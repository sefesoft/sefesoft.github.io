const routes = {
  home: "view-home",
  wineries: "view-wineries",
  events: "view-events",
  promos: "view-promos",
  map: "view-map",
  i18n: "view-i18n",
};

const appRoot = document.getElementById("app");
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

function renderRoute(route) {
  const templateId = routes[route] || routes.home;
  const template = document.getElementById(templateId);
  if (!template || !("content" in template)) return;

  appRoot.replaceChildren(template.content.cloneNode(true));
}

function setActiveNav(route) {
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.route === route;
    btn.classList.toggle("is-active", isActive);
  });
}

function handleRouteChange(routeFromHash) {
  const route = routeFromHash || "home";
  renderRoute(route);
  setActiveNav(route);
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const route = btn.dataset.route;
    if (!route) return;
    history.pushState({ route }, "", `#${route}`);
    handleRouteChange(route);
  });
});

window.addEventListener("popstate", (event) => {
  const route = event.state?.route || (location.hash || "#home").slice(1);
  handleRouteChange(route);
});

const initialRoute = (location.hash || "#home").slice(1);
handleRouteChange(initialRoute);

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;
const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");
const installSheet = document.getElementById("installSheet");
const installSheetText = document.getElementById("installSheetText");
const installSheetPrimary = document.getElementById("installSheetPrimary");
const installSheetClose = document.getElementById("installSheetClose");

function hideInstallUI(permanent = false) {
  if (installBtn) {
    installBtn.hidden = true;
  }
  if (installSheet) {
    installSheet.hidden = true;
    installSheet.classList.remove("is-visible");
  }
  if (permanent) {
    window.localStorage.setItem("provino_install_dismissed", "1");
  }
}

function showInstallSheetForIos() {
  if (!installSheet || isStandalone) return;
  if (window.localStorage.getItem("provino_install_dismissed") === "1") return;

  if (installSheetText) {
    installSheetText.textContent =
      "En iOS, abre el menú de Compartir y selecciona \"Añadir a pantalla de inicio\" para instalar Provino como app.";
  }
  if (installSheetPrimary) {
    installSheetPrimary.style.display = "none";
  }

  installSheet.hidden = false;
  installSheet.classList.add("is-visible");
}

function showInstallSheetWithPrompt() {
  if (!installSheet || isStandalone) return;
  if (window.localStorage.getItem("provino_install_dismissed") === "1") return;

  if (installSheetText) {
    installSheetText.textContent =
      "Instala Provino en tu dispositivo para acceder más rápido a bodegas, eventos y promociones.";
  }
  if (installSheetPrimary) {
    installSheetPrimary.style.display = "";
  }

  installSheet.hidden = false;
  installSheet.classList.add("is-visible");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installBtn) {
    installBtn.hidden = false;
  }
  showInstallSheetWithPrompt();
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      deferredPrompt = null;
      hideInstallUI(true);
    }
  });
}

if (installSheetPrimary) {
  installSheetPrimary.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      deferredPrompt = null;
      hideInstallUI(true);
    }
  });
}

if (installSheetClose) {
  installSheetClose.addEventListener("click", () => {
    hideInstallUI(true);
  });
}

if (isIos && !isStandalone) {
  window.setTimeout(showInstallSheetForIos, 1200);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.error("SW registration failed", err));
  });
}

