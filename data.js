(() => {
  const keys = { config: "lacav-v2-firebase-config", local: "lacav-v2-data" };
  const initialCategories = ["Maison", "Mode", "Bijoux", "Accessoires"];
  const initialProducts = [
    ["lampe", "Lampe de bureau", "Maison", 6500, "Bon état", "assets/images/interior.jpg", "Une lampe au dessin épuré pour éclairer les petits moments du quotidien."],
    ["bijoux", "Boucles d’oreilles", "Bijoux", 8900, "Très bon état", "assets/images/jewelry.jpg", "Une paire de boucles d’oreilles colorées, pour apporter une touche singulière à une tenue."],
    ["lunettes", "Lunettes de soleil", "Accessoires", 4500, "Bon état", "assets/images/objects.jpg", "Une monture ronde et légère pour accompagner les journées ensoleillées."],
    ["tabouret", "Tabouret en bois", "Maison", 7500, "Bon état", "assets/images/chair.jpg", "Une petite pièce de mobilier aux lignes simples, facile à imaginer dans différents intérieurs."],
    ["montre", "Montre au cadran rond", "Accessoires", 12000, "Bon état", "assets/images/watch.jpg", "Une montre au design minimaliste, choisie pour sa silhouette contemporaine."],
    ["mode", "Silhouette colorée", "Mode", 4500, "Bon état", "assets/images/fashion.jpg", "Une inspiration mode haute en couleur pour donner du caractère à votre vestiaire."]
  ];
  const now = () => new Date().toISOString();
  const defaultData = () => ({
    categories: initialCategories.map((name, i) => ({ id: ["maison", "mode", "bijoux", "accessoires"][i], name })),
    products: initialProducts.map(([id, title, category, priceCents, condition, image, description]) => ({
      id, title, category, priceCents, condition, image, description, status: "published", seller: "Boutique Démo", demo: true
    })),
    customers: []
  });
  let firebasePromise;

  function getConfig() {
    const saved = localStorage.getItem(keys.config);
    return saved ? JSON.parse(saved) : window.LACAV_FIREBASE_CONFIG;
  }
  function configured() {
    const config = getConfig();
    return Boolean(config && config.apiKey && config.authDomain && config.projectId && config.appId);
  }
  function saveConfig(config) {
    if (!["apiKey", "authDomain", "projectId", "appId"].every(key => typeof config[key] === "string" && config[key].trim())) {
      throw new Error("Tous les champs de configuration Firebase sont obligatoires.");
    }
    localStorage.setItem(keys.config, JSON.stringify(config));
  }
  function resetConfig() { localStorage.removeItem(keys.config); }
  function readLocal() {
    const raw = localStorage.getItem(keys.local);
    if (!raw) {
      const data = defaultData();
      localStorage.setItem(keys.local, JSON.stringify(data));
      return data;
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data.products) || !Array.isArray(data.categories) || !Array.isArray(data.customers)) {
      throw new Error("Les données locales sont invalides. Elles n'ont pas été modifiées.");
    }
    return data;
  }
  function writeLocal(data) { localStorage.setItem(keys.local, JSON.stringify(data)); }
  function id() { return crypto.randomUUID(); }
  async function connect() {
    if (!configured()) throw new Error("Complétez la configuration Firebase avant de vous connecter.");
    if (!firebasePromise) {
      firebasePromise = (async () => {
        const base = "https://www.gstatic.com/firebasejs/11.6.1/";
        const [appApi, authApi, dbApi] = await Promise.all([
          import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")
        ]);
        const app = appApi.initializeApp(getConfig());
        const firebase = { authApi, dbApi, auth: authApi.getAuth(app), db: dbApi.getFirestore(app) };
        await firebase.auth.authStateReady();
        return firebase;
      })();
    }
    try { return await firebasePromise; }
    catch (error) { firebasePromise = null; throw error; }
  }
  async function list(kind, publicOnly = false) {
    if (!configured()) {
      const items = readLocal()[kind];
      return publicOnly && kind === "products" ? items.filter(item => item.status === "published") : items;
    }
    const { dbApi: f, db } = await connect();
    const ref = f.collection(db, kind);
    const query = publicOnly && kind === "products" ? f.query(ref, f.where("status", "==", "published")) : ref;
    const snapshot = await f.getDocs(query);
    return snapshot.docs.filter(doc => doc.id !== "_schema").map(doc => ({ ...doc.data(), id: doc.id }));
  }
  async function put(kind, item) {
    const itemId = item.id || id();
    const { id: ignored, ...fields } = item;
    if (!configured()) {
      const data = readLocal();
      const index = data[kind].findIndex(entry => entry.id === itemId);
      if (index < 0) data[kind].push({ ...fields, id: itemId });
      else data[kind][index] = { ...fields, id: itemId };
      writeLocal(data);
    } else {
      const { dbApi: f, db } = await connect();
      await f.setDoc(f.doc(db, kind, itemId), fields);
    }
    return itemId;
  }
  async function remove(kind, itemId) {
    if (!configured()) {
      const data = readLocal();
      data[kind] = data[kind].filter(item => item.id !== itemId);
      writeLocal(data);
    } else {
      const { dbApi: f, db } = await connect();
      await f.deleteDoc(f.doc(db, kind, itemId));
    }
  }
  async function signIn(email, password) {
    const { authApi, auth } = await connect();
    return (await authApi.signInWithEmailAndPassword(auth, email, password)).user;
  }
  async function signOut() {
    const { authApi, auth } = await connect();
    await authApi.signOut(auth);
  }
  async function user() { return (await connect()).auth.currentUser; }
  async function verifyAdmin() {
    const { dbApi: f, db, auth } = await connect();
    if (!auth.currentUser) throw new Error("Connectez-vous avec votre compte administrateur Firebase.");
    await f.getDoc(f.doc(db, "admin", "access"));
    return auth.currentUser;
  }
  async function register(email, password, name) {
    const { authApi, auth, dbApi: f, db } = await connect();
    const credential = await authApi.createUserWithEmailAndPassword(auth, email, password);
    try {
      await f.setDoc(f.doc(db, "customers", credential.user.uid), { name, email: credential.user.email, createdAt: now() });
    } catch (error) {
      throw new Error(`Le compte Firebase a été créé, mais son profil n'a pas pu être enregistré. Connectez-vous et réessayez depuis votre compte. Détail : ${error.message}`);
    }
    return credential.user;
  }
  async function profile() {
    const { dbApi: f, db, auth } = await connect();
    if (!auth.currentUser) throw new Error("Connectez-vous d'abord.");
    const snapshot = await f.getDoc(f.doc(db, "customers", auth.currentUser.uid));
    return snapshot.exists() ? snapshot.data() : null;
  }
  async function saveProfile(name) {
    const { dbApi: f, db, auth } = await connect();
    if (!auth.currentUser) throw new Error("Connectez-vous d'abord.");
    const ref = f.doc(db, "customers", auth.currentUser.uid);
    const snapshot = await f.getDoc(ref);
    await f.setDoc(ref, { name, email: auth.currentUser.email, createdAt: snapshot.exists() ? snapshot.data().createdAt : now() });
  }
  async function initialize() {
    await verifyAdmin();
    const { dbApi: f, db } = await connect();
    const schema = {
      products: { version: 1, fields: ["title", "category", "priceCents", "condition", "image", "description", "status", "seller", "demo"] },
      categories: { version: 1, fields: ["name"] },
      customers: { version: 1, fields: ["name", "email", "createdAt"] }
    };
    const refs = Object.keys(schema).map(kind => f.doc(db, kind, "_schema"));
    await f.runTransaction(db, async transaction => {
      const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) transaction.set(refs[index], schema[Object.keys(schema)[index]]);
      });
    });
  }
  window.LaCavData = { configured, getConfig, saveConfig, resetConfig, list, put, remove, connect, signIn, signOut, user, verifyAdmin, register, profile, saveProfile, initialize };
})();
