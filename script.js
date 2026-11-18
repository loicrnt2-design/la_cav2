let products = [];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const safeImage = value => {
  if (/^assets\/images\/(interior|chair|objects|jewelry|watch|fashion)\.jpg$/i.test(value || "")) return value.slice("assets/images/".length);
  return /^(assets\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s"'<>]+)$/i.test(value || "") ? value : "interior.jpg";
};

const grid = document.querySelector("#product-grid");
const search = document.querySelector("#search");
const dialog = document.querySelector("#product-dialog");
const favoritesTrigger = document.querySelector(".favorites-trigger");
const favoriteCount = document.querySelector(".favorite-count");
const cartTrigger = document.querySelector(".cart-trigger");
const cartCount = document.querySelector(".cart-count");
let category = "Tout";
let favoritesOnly = false;
let currentProduct = null;
let favorites = new Set();
let cart = [];
let statusTimer;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealSelector = ".section-top, .category-card, .story-image, .story-copy, .feature-card, .artisan-item, .steps article, .newsletter-content, .footer-main, .product-card";
const motionToggle = document.querySelector(".motion-toggle");
const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-revealed");
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.08 }) : null;

function observeReveals(elements) {
  if (!revealObserver || reducedMotion.matches) return;
  for (const element of elements) {
    if (element.classList.contains("is-revealed")) continue;
    element.classList.add("reveal");
    revealObserver.observe(element);
  }
}

observeReveals(document.querySelectorAll(revealSelector));
motionToggle.hidden = reducedMotion.matches;
motionToggle.addEventListener("click", () => {
  const paused = document.body.classList.toggle("motion-paused");
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.textContent = paused ? "Reprendre les animations" : "Mettre les animations en pause";
  if (paused) {
    document.querySelector(".hero-visual").style.removeProperty("--hero-shift");
    clearPointerMotion();
  }
  else updateScrollMotion();
});

function clearPointerMotion() {
  document.querySelectorAll(".pointer-active").forEach(element => {
    element.style.removeProperty("--pointer-x");
    element.style.removeProperty("--pointer-y");
    element.classList.remove("pointer-active");
  });
}

document.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || reducedMotion.matches || document.body.classList.contains("motion-paused")) return;
  const target = event.target.closest(".hero-visual, .category-card, .product-image, .artisan-image");
  if (!target) return;
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
  const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  target.classList.add("pointer-active");
  target.style.setProperty("--pointer-x", `${x * -10}px`);
  target.style.setProperty("--pointer-y", `${y * -10}px`);
}, { passive: true });

document.addEventListener("pointerout", event => {
  const target = event.target.closest(".pointer-active");
  if (target && !target.contains(event.relatedTarget)) {
    target.style.removeProperty("--pointer-x");
    target.style.removeProperty("--pointer-y");
    target.classList.remove("pointer-active");
  }
});

let scrollFrame = 0;
function updateScrollMotion() {
  scrollFrame = 0;
  if (reducedMotion.matches || document.body.classList.contains("motion-paused")) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector(".scroll-progress").style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
  const hero = document.querySelector(".hero-visual");
  if (hero.getBoundingClientRect().bottom > 0) {
    hero.style.setProperty("--hero-shift", `${Math.min(window.scrollY * 0.1, 45)}px`);
  }
}
window.addEventListener("scroll", () => {
  if (!reducedMotion.matches && !document.body.classList.contains("motion-paused") && !scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
}, { passive: true });
reducedMotion.addEventListener("change", () => {
  motionToggle.hidden = reducedMotion.matches;
  if (reducedMotion.matches) {
    document.querySelector(".hero-visual").style.removeProperty("--hero-shift");
    clearPointerMotion();
  } else {
    updateScrollMotion();
    observeReveals(document.querySelectorAll(revealSelector));
  }
});
updateScrollMotion();

function announce(message) {
  const status = document.querySelector("#status");
  status.textContent = message;
  status.classList.add("visible");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => status.classList.remove("visible"), 3500);
}

try {
  const saved = JSON.parse(localStorage.getItem("lacav-v2-favorites") || "[]");
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => typeof id === "string"));
} catch (error) {
  console.warn("Les favoris enregistrés sont indisponibles.", error);
  announce("Les favoris enregistrés sont indisponibles dans ce navigateur.");
}

try {
  const savedCart = JSON.parse(localStorage.getItem("lacav-v2-cart") || "[]");
  if (Array.isArray(savedCart)) cart = savedCart.filter(id => typeof id === "string");
} catch (error) {
  console.warn("Le panier enregistré est indisponible.", error);
}

function saveFavorites() {
  try {
    localStorage.setItem("lacav-v2-favorites", JSON.stringify([...favorites]));
  } catch (error) {
    console.warn("Impossible d’enregistrer les favoris.", error);
    announce("Favoris non enregistrés : le stockage du navigateur est indisponible.");
  }
}

function saveCart() {
  try {
    localStorage.setItem("lacav-v2-cart", JSON.stringify(cart));
  } catch (error) {
    console.warn("Impossible d'enregistrer le panier.", error);
    announce("Panier non enregistré : le stockage du navigateur est indisponible.");
  }
}

function euro(price) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price / 100);
}

function updateFavoriteUI() {
  favoriteCount.textContent = favorites.size;
  favoriteCount.hidden = favorites.size === 0;
  favoritesTrigger.setAttribute("aria-pressed", String(favoritesOnly));
  favoritesTrigger.setAttribute("aria-label", favoritesOnly ? "Afficher tous les objets" : "Voir mes favoris");
  if (currentProduct) {
    const saved = favorites.has(currentProduct.id);
    const button = document.querySelector(".dialog-favorite");
    button.firstChild.textContent = saved ? "Retirer des favoris " : "Ajouter aux favoris ";
  }
}

function updateCartUI() {
  cartCount.textContent = cart.length;
  cartCount.hidden = cart.length === 0;
}

function addToCart(id) {
  if (!cart.includes(id)) {
    cart.push(id);
    saveCart();
    updateCartUI();
    announce("✓ Ajouté au panier");
  } else {
    announce("Cet article est déjà dans votre panier");
  }
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
  renderProducts();
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function renderProducts() {
  const term = normalize(search.value.trim());
  const visible = products.filter(product =>
    (category === "Tout" || product.category === category) &&
    (!favoritesOnly || favorites.has(product.id)) &&
    normalize(`${product.title} ${product.category} ${product.description}`).includes(term)
  );
  if (revealObserver) grid.querySelectorAll(".reveal").forEach(card => revealObserver.unobserve(card));
  grid.replaceChildren();
  for (const product of visible) {
    const card = document.createElement("article");
    card.className = "product-card";
    const saved = favorites.has(product.id);
    card.innerHTML = `<div class="product-image">
      <button class="product-open" type="button" aria-label="Voir ${escapeHTML(product.title)}"><img src="${escapeHTML(safeImage(product.image))}" alt="${escapeHTML(product.title)}" loading="lazy"></button>
      <span class="product-tag">DÉMO · ILLUSTRATION</span>
      <button class="product-heart" type="button" aria-pressed="${saved}" aria-label="${saved ? "Retirer des favoris" : "Ajouter aux favoris"} : ${escapeHTML(product.title)}"><svg><use href="#i-heart"></use></svg></button>
    </div><div class="product-details"><span class="product-category">${escapeHTML(product.category)} · ${escapeHTML(product.condition)}</span><div class="product-title-row"><button type="button" class="product-title">${escapeHTML(product.title)}</button><span class="product-price">${euro(product.priceCents)}</span></div><span class="product-seller">${escapeHTML(product.seller)}</span></div>`;
    card.querySelector(".product-open").addEventListener("click", () => openProduct(product));
    card.querySelector(".product-title").addEventListener("click", () => openProduct(product));
    card.querySelector(".product-heart").addEventListener("click", () => toggleFavorite(product.id));
    grid.append(card);
  }
  observeReveals(grid.querySelectorAll(".product-card"));
  document.querySelector("#results-count").textContent = `${visible.length} ${visible.length > 1 ? "TROUVAILLES" : "TROUVAILLE"}${favoritesOnly ? " EN FAVORIS" : ""}`;
  document.querySelector("#empty-state").hidden = visible.length > 0;
  updateFavoriteUI();
}

function setCategory(value) {
  category = value;
  document.querySelectorAll(".filter").forEach(button => {
    const selected = button.dataset.filter === category;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderProducts();
}

function openProduct(product) {
  currentProduct = product;
  document.querySelector("#dialog-image").src = safeImage(product.image);
  document.querySelector("#dialog-image").alt = product.title;
  const charEl = document.querySelector("#dialog-characteristic");
  if (product.characteristic) {
    charEl.textContent = product.characteristic;
    charEl.hidden = false;
  } else {
    charEl.hidden = true;
  }
  document.querySelector("#dialog-category").textContent = product.category;
  document.querySelector("#dialog-title").textContent = product.title;
  document.querySelector("#dialog-price").textContent = euro(product.priceCents);
  document.querySelector("#dialog-description").textContent = product.description;
  document.querySelector("#dialog-condition").textContent = product.condition;
  document.querySelector("#dialog-seller").textContent = product.seller;
  document.querySelector("#dialog-label").textContent = "• ANNONCE FICTIVE · PHOTO D’ILLUSTRATION";
  updateFavoriteUI();
  dialog.showModal();
}

document.querySelector(".filter-list").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (button) setCategory(button.dataset.filter);
});
document.querySelectorAll(".category-card").forEach(button => button.addEventListener("click", () => {
  favoritesOnly = false;
  search.value = "";
  setCategory(button.dataset.category);
  document.querySelector("#selection").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
}));
search.addEventListener("input", renderProducts);
document.querySelector(".search-trigger").addEventListener("click", () => {
  document.querySelector("#selection").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
  search.focus({ preventScroll: true });
});
favoritesTrigger.addEventListener("click", () => {
  favoritesOnly = !favoritesOnly;
  search.value = "";
  setCategory("Tout");
  document.querySelector("#selection").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
});
cartTrigger.addEventListener("click", () => {
  announce(`Panier · ${cart.length} ${cart.length > 1 ? "articles" : "article"}`);
});
document.querySelector("#reset-filters").addEventListener("click", () => {
  favoritesOnly = false;
  search.value = "";
  setCategory("Tout");
});
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
document.querySelector(".dialog-favorite").addEventListener("click", () => {
  if (currentProduct) toggleFavorite(currentProduct.id);
});
document.querySelector("#dialog-add-cart").addEventListener("click", () => {
  if (currentProduct) addToCart(currentProduct.id);
});
document.querySelector(".newsletter-form").addEventListener("submit", event => event.preventDefault());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => { currentProduct = null; });

const menuButton = document.querySelector(".menu-trigger");
const mobileMenu = document.querySelector("#mobile-menu");
function setMenu(open) {
  mobileMenu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  menuButton.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
}
menuButton.addEventListener("click", () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener("click", event => { if (event.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !mobileMenu.hidden) { setMenu(false); menuButton.focus(); } });

async function loadCatalog() {
  try {
    // Attendre que LaCavData soit disponible
    let attempts = 0;
    while (!window.LaCavData && attempts < 1000) {  // Augmenter à 10 secondes max
      await new Promise(r => setTimeout(r, 10));
      attempts++;
    }
    if (!window.LaCavData) throw new Error("LaCavData n'a pas pu être initialisé");
    
    const [items, categories] = await Promise.all([window.LaCavData.list("products", true), window.LaCavData.list("categories", true)]);
    products = items;
    const categoryCards = [...document.querySelectorAll(".category-card")];
    categoryCards.forEach(button => { button.hidden = !categories.some(item => item.name === button.dataset.category); });
    document.querySelector("#categories-placeholder").hidden = categoryCards.some(button => !button.hidden);
    const list = document.querySelector(".filter-list");
    list.innerHTML = `<button type="button" class="filter active" data-filter="Tout" aria-pressed="true">Tout voir</button>` +
      categories.map(item => `<button type="button" class="filter" data-filter="${escapeHTML(item.name)}" aria-pressed="false">${escapeHTML(item.name)}</button>`).join("");
    renderProducts();
  } catch (error) {
    console.error("Chargement du catalogue impossible", error);
    document.querySelector("#empty-state").hidden = false;
    document.querySelector("#empty-state").textContent = "Le catalogue est indisponible. Vérifiez la connexion et les règles Firestore dans l’administration.";
    announce("Impossible de charger le catalogue.");
  }
}
loadCatalog();
