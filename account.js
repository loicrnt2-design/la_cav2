const store = window.LaCavData;
const $ = selector => document.querySelector(selector);
function feedback(message, error = false) {
  const box = $("#account-feedback");
  box.textContent = message;
  box.classList.toggle("error", error);
  box.hidden = false;
  if (error) console.error(message);
}
async function attempt(action) {
  try { await action(); } catch (error) { feedback(error.message || String(error), true); }
}
async function renderAccount() {
  const user = await store.user();
  $("#auth-panel").hidden = Boolean(user);
  $("#profile-panel").hidden = !user;
  if (user) {
    $("#account-email").textContent = user.email;
    const profile = await store.profile();
    $("#profile-form").elements.name.value = profile?.name || "";
    if (!profile) feedback("Votre profil est absent. Enregistrez votre nom pour le créer.");
  }
}
if (!store.configured()) {
  $("#account-form").querySelectorAll("input, button").forEach(element => element.disabled = true);
} else {
  $("#account-notice").textContent = "Mode Firebase de test : ne saisissez pas de données personnelles réelles avant validation de la sécurité et de la configuration.";
  attempt(renderAccount);
}
$("#account-form").addEventListener("submit", event => {
  event.preventDefault();
  attempt(async () => {
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (event.submitter.value === "register") {
      const name = form.elements.name.value.trim();
      if (!name) throw new Error("Indiquez votre nom pour créer votre compte.");
      await store.register(email, password, name);
    } else await store.signIn(email, password);
    form.elements.password.value = "";
    await renderAccount();
    feedback("Vous êtes connecté.");
  });
});
$("#profile-form").addEventListener("submit", event => {
  event.preventDefault();
  attempt(async () => {
    const name = event.currentTarget.elements.name.value.trim();
    if (!name) throw new Error("Indiquez votre nom.");
    await store.saveProfile(name);
    feedback("Profil enregistré.");
  });
});
$("#account-logout").addEventListener("click", () => attempt(async () => { await store.signOut(); await renderAccount(); feedback("Vous êtes déconnecté."); }));
