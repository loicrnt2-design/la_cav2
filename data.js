(() => {
  try {
    const keys = { config: "lacav-v2-firebase-config", local: "lacav-v2-data" };
  const initialCategories = ["Mobilier", "Objets d'art", "Bijoux", "Accessoires"];
  const initialProducts = [
    // Mobilier vintage
    ["lampe-lin", "Lampe de bureau — Lin et laiton", "Mobilier", 6500, "Bon état", "assets/images/interior.jpg", "Une lampe au dessin épuré dont l'abat-jour en lin crème diffuse une lumière chaleureuse. Base en laiton patiné. Années 1970. Fonctionne parfaitement.", true, "Pièce unique"],
    ["tabouret-rotin", "Tabouret bas — Rotin tressé", "Mobilier", 7500, "Très bon état", "assets/images/chair.jpg", "Un tabouret aux formes organiques, revêtu de rotin tissé à la main. Structure bois naturel. Environ années 1960. Stable et robuste.", true, "Pièce unique"],
    ["guéridon-acajou", "Guéridon — Acajou massif", "Mobilier", 15000, "Restauré", "assets/images/interior.jpg", "Une petite table d'appoint au plateau circulaire en acajou massif. Restaurée avec soin, vernis d'époque conservé. Très début XXe siècle.", false, "Pièce unique"],
    ["fauteuil-velours", "Fauteuil — Velours citron", "Mobilier", 32000, "Très bon état", "assets/images/interior.jpg", "Un fauteuil aux lignes épurées, recouvert d'un velours citron vibrant. Accoudoirs en bois teinté. Années 1960, structure solide.", false, "Pièce unique"],
    
    // Objets d'art et décoration
    ["vase-ceramique", "Vase — Céramique artisanale", "Objets d'art", 4800, "Bon état", "assets/images/objects.jpg", "Un vase tourné et émaillé à la main par un artisan céramiste. Teintes naturelles inspirées de la terre. Hauteur 28 cm. Craquelures de cuisson recherchées.", true, "Artisanat"],
    ["miroir-soleil", "Miroir mural — Cadre doré", "Objets d'art", 8900, "Très bon état", "assets/images/interior.jpg", "Un miroir aux formes géométriques épurées, cadre en bois doré à la feuille. Années 1970. 60 cm de diamètre. Élégant et lumineux.", false, "Pièce unique"],
    ["cadre-or", "Cadre en bois — Feuille d'or patiné", "Objets d'art", 2500, "Bon état", "assets/images/interior.jpg", "Un cadre classique aux proportions généreuses, bois teinté et filet doré. Format 40 × 50 cm. Sans passe-partout ni vitre.", true, "Pièce unique"],
    ["sculptute-bronze", "Sculpture — Bronze abstraite", "Objets d'art", 24000, "Restaurée", "assets/images/objects.jpg", "Une figure abstraite en bronze massif, patine vert-de-gris d'époque. Numérotée et signée. Années 1950. Poids environ 8 kg.", false, "Pièce unique"],
    
    // Bijoux et métaux précieux
    ["boucles-or", "Boucles d'oreilles — Or et perles", "Bijoux", 8900, "Très bon état", "assets/images/jewelry.jpg", "Une paire délicate en or jaune 750/1000, ornée de perles de culture. Fermoirs sécurisés. Poinçon français. Fin XIXe siècle. Certificat d'authenticité.", false, "Pièce unique"],
    ["collier-argent", "Collier — Chaîne argent massif", "Bijoux", 3600, "Bon état", "assets/images/jewelry.jpg", "Une chaîne en argent massif poinçonné 925, maillon forcats épais. Longueur 60 cm, ajustable. Très bien conservée, poids 18 g.", true, "Pièce unique"],
    ["bague-turquoise", "Bague — Turquoise et laiton", "Bijoux", 5400, "Bon état", "assets/images/jewelry.jpg", "Une bague ornée d'une turquoise naturelle cabochon, monture en laiton travaillé. Travail artisanal, années 1970. Taille 54 français.", true, "Artisanat"],
    ["montre-acier", "Montre de poignet — Acier brossé", "Bijoux", 12000, "Très bon état", "assets/images/watch.jpg", "Une montre automatique au cadran blanc, boîtier acier, bracelet cuir brun vintage. Marque suisse, années 1980. Fonctionne précisément.", false, "Pièce unique"],
    
    // Accessoires
    ["lunettes-soleil", "Lunettes de soleil — Monture miel", "Accessoires", 4500, "Très bon état", "assets/images/objects.jpg", "Une monture ovale en acétate miel tendre, verres teinté ambre d'époque. Années 1990. Très bon état, légère patine du temps.", true, "Pièce unique"],
    ["echarpe-cachemire", "Écharpe — Cachemire ivoire", "Accessoires", 6700, "Très bon état", "assets/images/fashion.jpg", "Une grande écharpe en cachemire fin, teinte ivoire crème. Frange main. Tissage très serré, douceur exceptionnelle. Marque réputée italienne.", false, "Pièce unique"],
    ["ceinture-cuir", "Ceinture — Cuir travaillé et laiton", "Accessoires", 2800, "Bon état", "assets/images/interior.jpg", "Une ceinture en cuir naturel tressé à la main, boucle en laiton forgé. Travail artisanal français. Réglable 75-95 cm. Usure légère naturelle.", true, "Artisanat"],
    ["sac-cuir-marron", "Sac à main — Cuir marron caramel", "Accessoires", 11500, "Très bon état", "assets/images/fashion.jpg", "Un sac de luxe en cuir végétal tannée naturellement, monnaie cuivre doré. Poignées robustes, intérieur doublé. Marque française, années 2000. Très peu porté.", false, "Pièce unique"]
  ];
  const now = () => new Date().toISOString();
  const defaultData = () => ({
    categories: initialCategories.map((name, i) => ({ id: ["mobilier", "objets-art", "bijoux", "accessoires"][i], name })),
    products: initialProducts.map(([id, title, category, priceCents, condition, image, description, demo, characteristic]) => ({
      id, title, category, priceCents, condition, image, description, characteristic, status: "published", seller: "La CAV' — Sélection", demo: demo ?? false
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
  } catch(error) {
    console.error("Data.js error:", error);
  }
})();
