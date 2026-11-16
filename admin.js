const store = window.LaCavData;
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const money = cents => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
let products = [], categories = [], customers = [];
let editing = null;
let allowed = false;

function feedback(message, error = false) {
  const box = $("#feedback");
  box.textContent = message;
  box.classList.toggle("error", error);
  box.hidden = false;
  if (error) console.error(message);
}
function showPage(name) {
  document.querySelectorAll("[data-panel]").forEach(panel => panel.hidden = panel.dataset.panel !== name);
  document.querySelectorAll("[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === name));
  $("#page-title").textContent = { overview: "Vue d’ensemble", products: "Articles", categories: "Collections", customers: "Clients", firebase: "Firebase" }[name];
}
function requireAccess() {
  if (!allowed) throw new Error("Connectez-vous avec un compte administrateur autorisé dans les règles Firestore.");
}
function safeImage(value) {
  return /^(assets\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s"'<>]+)$/i.test(value);
}
function render() {
  $("#stat-products").textContent = products.length;
  $("#stat-published").textContent = products.filter(item => item.status === "published").length;
  $("#stat-categories").textContent = categories.length;
  $("#stat-customers").textContent = customers.length;
  const term = $("#product-search").value.toLocaleLowerCase("fr");
  const visible = products.filter(item => `${item.title} ${item.category}`.toLocaleLowerCase("fr").includes(term));
  $("#products-table").innerHTML = visible.map(item => `<tr><td><div class="item-cell"><img src="${escapeHTML(safeImage(item.image) ? item.image : "assets/images/interior.jpg")}" alt=""><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.seller)}</small></div></div></td><td>${escapeHTML(item.category)}</td><td>${money(item.priceCents)}</td><td><span class="tag ${item.status === "published" ? "" : "draft"}">${item.status === "published" ? "Publié" : item.status === "archived" ? "Archivé" : "Brouillon"}</span></td><td><div class="row-actions"><button data-edit="products" data-id="${escapeHTML(item.id)}">Modifier</button><button class="delete" data-delete="products" data-id="${escapeHTML(item.id)}">Supprimer</button></div></td></tr>`).join("");
  $("#products-empty").hidden = visible.length > 0;
  $("#categories-list").innerHTML = categories.map(item => `<div class="collection-item"><div><strong>${escapeHTML(item.name)}</strong><small>${products.filter(product => product.category === item.name).length} article(s)</small></div><div class="row-actions"><button data-edit="categories" data-id="${escapeHTML(item.id)}">Modifier</button><button class="delete" data-delete="categories" data-id="${escapeHTML(item.id)}">Supprimer</button></div></div>`).join("");
  $("#categories-empty").hidden = categories.length > 0;
  $("#customers-table").innerHTML = customers.map(item => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.email)}</td><td>${escapeHTML(item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : "—")}</td><td><div class="row-actions"><button data-edit="customers" data-id="${escapeHTML(item.id)}">Modifier</button><button class="delete" data-delete="customers" data-id="${escapeHTML(item.id)}">Supprimer le profil</button></div></td></tr>`).join("");
  $("#customers-empty").hidden = customers.length > 0;
}
async function load() {
  requireAccess();
  [products, categories, customers] = await Promise.all([store.list("products"), store.list("categories"), store.list("customers")]);
  render();
}
async function attempt(action) {
  try { await action(); } catch (error) { feedback(error.message || String(error), true); }
}
function refreshMode() {
  const connected = store.configured();
  $("#side-mode").textContent = connected ? "FIREBASE CONFIGURÉ" : "MODE LOCAL";
  $("#mode-badge").textContent = connected ? "Firebase · prototype" : "Prototype local";
  $("#mode-notice").textContent = connected
    ? "Mode Firebase : l’accès aux données dépend des règles Firestore et de votre compte. Le site reste un prototype, sans paiement réel."
    : "Mode local de démonstration : les données sont stockées dans ce navigateur et ne sont pas protégées. Ne saisissez aucune donnée personnelle réelle.";
  $("#new-customer").hidden = connected;
  const config = store.getConfig() || {};
  ["apiKey", "authDomain", "projectId", "appId"].forEach(name => { $("#config-form").elements[name].value = config[name] || ""; });
}
async function start() {
  refreshMode();
  if (!store.configured()) {
    allowed = true;
    await load();
    return;
  }
  try {
    const user = await store.user();
    if (!user) {
      showPage("firebase");
      feedback("Connectez-vous avec votre compte administrateur Firebase pour accéder aux données.");
      return;
    }
    await store.verifyAdmin();
    allowed = true;
    $("#auth-status").textContent = `Connecté : ${user.email} · UID : ${user.uid}`;
    await load();
  } catch (error) {
    showPage("firebase");
    feedback(`Accès administrateur impossible : ${error.message}`, true);
  }
}
function field(name, label, value = "", options = "") {
  return `<label>${label}<input name="${name}" value="${escapeHTML(value)}" ${options}></label>`;
}
function openEditor(kind, item = null) {
  requireAccess();
  editing = { kind, item };
  const form = $("#edit-form");
  form.reset();
  $("#edit-title").textContent = `${item ? "Modifier" : "Créer"} ${kind === "products" ? "un article" : kind === "categories" ? "une collection" : "un profil"}`;
  if (kind === "products") {
    if (!categories.length) throw new Error("Créez d'abord une collection.");
    $("#edit-fields").innerHTML = `${field("title", "Titre de l’article", item?.title, "required maxlength=\"120\"")}
      <div class="two-fields"><label>Collection<select name="category" required>${categories.map(cat => `<option value="${escapeHTML(cat.name)}" ${cat.name === item?.category ? "selected" : ""}>${escapeHTML(cat.name)}</option>`).join("")}</select></label>${field("price", "Prix en euros", item ? (item.priceCents / 100).toFixed(2) : "", "type=\"number\" min=\"0\" max=\"1000000\" step=\"0.01\" required")}</div>
      <div class="two-fields"><label>État<select name="condition">${["Neuf", "Très bon état", "Bon état", "État correct"].map(c => `<option ${c === item?.condition ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>Statut<select name="status"><option value="draft" ${item?.status === "draft" ? "selected" : ""}>Brouillon</option><option value="published" ${item?.status === "published" ? "selected" : ""}>Publié</option><option value="archived" ${item?.status === "archived" ? "selected" : ""}>Archivé</option></select></label></div>
      ${field("seller", "Nom de la boutique", item?.seller || "Boutique Démo", "required maxlength=\"100\"")}
      ${field("image", "Image : URL HTTPS ou chemin assets/images/…", item?.image || "", "required maxlength=\"1000\"")}
      <label>Description<textarea name="description" required maxlength="2000">${escapeHTML(item?.description || "")}</textarea></label>
      <label class="checkbox-label"><input type="checkbox" name="demo" ${!item || item.demo ? "checked" : ""}> Article fictif de démonstration</label>`;
  } else if (kind === "categories") {
    $("#edit-fields").innerHTML = field("name", "Nom de la collection", item?.name, "required maxlength=\"60\"");
  } else {
    $("#edit-fields").innerHTML = field("name", "Nom", item?.name, "required maxlength=\"100\"") + field("email", "E-mail du profil", item?.email, `type="email" required maxlength="254" ${store.configured() ? "readonly" : ""}`);
  }
  $("#edit-dialog").showModal();
}
async function saveEditor(event) {
  event.preventDefault();
  requireAccess();
  const { kind, item } = editing;
  const form = event.currentTarget;
  const value = name => form.elements[name].value.trim();
  let data;
  if (kind === "products") {
    const price = Number(value("price"));
    if (!Number.isFinite(price) || price < 0 || price > 1000000 || !safeImage(value("image"))) throw new Error("Vérifiez le prix et l’image : utilisez une URL HTTPS ou un chemin assets/images/nom-de-fichier.");
    data = { id: item?.id, title: value("title"), category: value("category"), priceCents: Math.round(price * 100), condition: value("condition"), image: value("image"), description: value("description"), status: value("status"), seller: value("seller"), demo: form.elements.demo.checked };
  } else if (kind === "categories") {
    const name = value("name");
    if (categories.some(category => category.id !== item?.id && category.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"))) throw new Error("Cette collection existe déjà.");
    if (item && item.name !== name && products.some(product => product.category === item.name)) throw new Error("Déplacez d'abord les articles de cette collection avant de la renommer.");
    data = { id: item?.id, name };
  } else {
    data = { id: item?.id, name: value("name"), email: value("email"), createdAt: item?.createdAt || new Date().toISOString() };
  }
  if (Object.values(data).some(v => typeof v === "string" && !v.trim())) throw new Error("Les champs ne peuvent pas être vides.");
  await store.put(kind, data);
  $("#edit-dialog").close();
  await load();
  feedback("Enregistrement effectué.");
}
document.querySelectorAll("[data-page], [data-goto]").forEach(button => button.addEventListener("click", () => showPage(button.dataset.page || button.dataset.goto)));
$("#product-search").addEventListener("input", render);
$("#new-product").addEventListener("click", () => attempt(() => openEditor("products")));
$("#new-category").addEventListener("click", () => attempt(() => openEditor("categories")));
$("#new-customer").addEventListener("click", () => attempt(() => openEditor("customers")));
document.querySelectorAll(".close-edit").forEach(button => button.addEventListener("click", () => $("#edit-dialog").close()));
$("#edit-form").addEventListener("submit", event => attempt(() => saveEditor(event)));
document.addEventListener("click", event => {
  const button = event.target.closest("[data-edit], [data-delete]");
  if (!button) return;
  attempt(async () => {
    requireAccess();
    const kind = button.dataset.edit || button.dataset.delete;
    const item = ({ products, categories, customers })[kind].find(entry => entry.id === button.dataset.id);
    if (!item) throw new Error("Élément introuvable. Actualisez la page.");
    if (button.dataset.edit) return openEditor(kind, item);
    if (kind === "categories" && products.some(product => product.category === item.name)) throw new Error("Déplacez ou supprimez d'abord les articles de cette collection.");
    const message = kind === "customers" && store.configured() ? "Supprimer ce profil Firestore ? Le compte de connexion Firebase ne sera pas supprimé." : "Supprimer cet élément définitivement ?";
    if (!confirm(message)) return;
    await store.remove(kind, item.id);
    await load();
    feedback("Élément supprimé.");
  });
});
$("#config-form").addEventListener("submit", event => {
  event.preventDefault();
  attempt(() => {
    const form = event.currentTarget;
    const config = Object.fromEntries(["apiKey", "authDomain", "projectId", "appId"].map(name => [name, form.elements[name].value.trim()]));
    store.saveConfig(config);
    location.reload();
  });
});
$("#reset-config").addEventListener("click", () => {
  if (!confirm("Effacer la configuration de ce navigateur ? Une configuration présente dans firebase-config.js restera active. Les données Firebase ne seront pas supprimées.")) return;
  attempt(() => { store.resetConfig(); location.reload(); });
});
$("#admin-login").addEventListener("submit", event => {
  event.preventDefault();
  attempt(async () => {
    const form = event.currentTarget;
    const user = await store.signIn(form.elements.email.value.trim(), form.elements.password.value);
    form.elements.password.value = "";
    try { await store.verifyAdmin(); } catch (error) {
      await store.signOut();
      throw new Error(`Ce compte n'est pas autorisé par les règles Firestore : ${error.message}`);
    }
    allowed = true;
    $("#auth-status").textContent = `Connecté : ${user.email} · UID : ${user.uid}`;
    await load();
    feedback("Connexion administrateur réussie.");
  });
});
$("#admin-logout").addEventListener("click", () => attempt(async () => { await store.signOut(); location.reload(); }));
$("#initialize").addEventListener("click", () => attempt(async () => {
  requireAccess();
  await store.initialize();
  feedback("Documents de schéma initialisés sans écraser les documents existants.");
  await load();
}));
attempt(start);
