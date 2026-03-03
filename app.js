const routes = {
  home: "view-home",
  wineries: "view-wineries",
  wineryDetail: "view-winery-detail",
  events: "view-events",
  promos: "view-promos",
  map: "view-map",
  i18n: "view-i18n",
};

const appRoot = document.getElementById("app");
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
const yearEl = document.getElementById("year");
let wineries = [];
let wineriesLoaded = false;

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
  const activeKey = route === "wineryDetail" ? "wineries" : route;
  navButtons.forEach((btn) => {
    const isActive = btn.dataset.route === activeKey;
    btn.classList.toggle("is-active", isActive);
  });
}

function parseLocationHash() {
  const raw = (location.hash || "#home").slice(1);
  const [base, ...rest] = raw.split("/");
  return { base: base || "home", rest };
}

function handleRouteChange() {
  const { base, rest } = parseLocationHash();
  const route = base === "wineries" && rest.length > 0 ? "wineryDetail" : base;

  renderRoute(route);
  setActiveNav(route);
  enhanceRoute(route, rest);
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const route = btn.dataset.route;
    if (!route) return;
    history.pushState({ route }, "", `#${route}`);
    handleRouteChange();
  });
});

window.addEventListener("popstate", (event) => {
  void event;
  handleRouteChange();
});

handleRouteChange();

async function ensureWineriesLoaded() {
  if (wineriesLoaded) return;

  const response = await fetch("vinicolas.json");
  if (!response.ok) {
    throw new Error("No se pudieron cargar las vinícolas");
  }
  wineries = await response.json();
  wineriesLoaded = true;
}

async function setupWineriesView() {
  const listEl = document.getElementById("wineriesList");
  if (!listEl) return;

  try {
    await ensureWineriesLoaded();
    listEl.replaceChildren();
    wineries.forEach((winery) => {
      if (!winery?.name) return;
      const id = slugify(winery.name);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "winery-card";
      button.dataset.wineryId = id;
      button.setAttribute("aria-label", `Abrir ${winery.name}`);

      const logo = document.createElement("div");
      logo.className = "winery-card-logo";
      logo.textContent = initialsFromName(winery.name);

      const name = document.createElement("div");
      name.className = "winery-card-name";
      name.textContent = winery.name;

      const chevron = document.createElement("div");
      chevron.className = "winery-card-chevron";
      chevron.textContent = "›";

      button.append(logo, name, chevron);
      button.addEventListener("click", () => {
        history.pushState(
          { route: "wineries", wineryId: id },
          "",
          `#wineries/${encodeURIComponent(id)}`
        );
        handleRouteChange();
      });

      listEl.appendChild(button);
    });
  } catch (error) {
    listEl.textContent =
      "No se pudieron cargar las bodegas en este momento. Intenta nuevamente más tarde.";
  }
}

async function setupWineryDetailView(wineryIdRaw) {
  const container = document.getElementById("wineryDetail");
  const backBtn = document.getElementById("wineryBackBtn");
  if (!container) return;

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.pushState({ route: "wineries" }, "", "#wineries");
      handleRouteChange();
    });
  }

  try {
    await ensureWineriesLoaded();
    const wineryId = decodeURIComponent(wineryIdRaw || "");
    const winery = wineries.find((w) => slugify(w?.name || "") === wineryId);
    if (!winery) {
      container.textContent = "Bodega no encontrada.";
      return;
    }

    container.replaceChildren();

    const header = document.createElement("div");
    header.className = "winery-detail-header";

    const badge = document.createElement("div");
    badge.className = "winery-detail-badge";
    badge.textContent = initialsFromName(winery.name);

    const titleWrap = document.createElement("div");
    titleWrap.className = "winery-detail-titlewrap";

    const title = document.createElement("h1");
    title.className = "winery-detail-title";
    title.textContent = winery.name;

    const desc = document.createElement("p");
    desc.className = "winery-detail-desc";
    desc.textContent = winery.description || "";

    titleWrap.append(title, desc);
    header.append(badge, titleWrap);

    const info = document.createElement("div");
    info.className = "winery-detail-info";

    const address = infoRow("Dirección", winery.address);
    const phone = infoRow("Teléfono", winery.phone);
    const web = infoRow("Web", winery.webpage);

    info.append(address, phone, web);

    const actions = document.createElement("div");
    actions.className = "winery-detail-actions";

    const callBtn = actionButton("Llamar", winery.phone ? `tel:${normalizeTel(winery.phone)}` : "");
    const webBtn = actionButton("Abrir web", winery.webpage || "");

    if (!winery.phone) callBtn.disabled = true;
    if (!winery.webpage) webBtn.disabled = true;

    actions.append(callBtn, webBtn);

    container.append(header, info, actions);
  } catch (error) {
    container.textContent = "No se pudo cargar la información de la bodega.";
  }
}

function enhanceRoute(route, rest = []) {
  if (route === "wineries") {
    setupWineriesView();
    return;
  }
  if (route === "wineryDetail") {
    setupWineryDetailView(rest[0]);
  }
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function initialsFromName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1][0] : (parts[0]?.[1] || "");
  return (first + second).toUpperCase();
}

function normalizeTel(phone) {
  return String(phone).replace(/[^\d+]/g, "");
}

function infoRow(label, value) {
  const row = document.createElement("div");
  row.className = "winery-info-row";

  const k = document.createElement("div");
  k.className = "winery-info-key";
  k.textContent = label;

  const v = document.createElement("div");
  v.className = "winery-info-val";
  v.textContent = value || "—";

  row.append(k, v);
  return row;
}

function actionButton(text, href) {
  const a = document.createElement("a");
  a.className = "winery-action";
  a.textContent = text;
  a.href = href || "#";
  a.target = href?.startsWith("http") ? "_blank" : "";
  a.rel = href?.startsWith("http") ? "noopener noreferrer" : "";
  a.addEventListener("click", (e) => {
    if (!href) {
      e.preventDefault();
    }
  });
  return a;
}

let deferredPrompt = null;
const installBtn = document.getElementById("installBtn");
const installSheet = document.getElementById("installSheet");
const installSheetText = document.getElementById("installSheetText");
const installSheetPrimary = document.getElementById("installSheetPrimary");
const installSheetClose = document.getElementById("installSheetClose");

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;
const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

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

if (isStandalone) {
  hideInstallUI(true);
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
  if (isStandalone || window.localStorage.getItem("provino_install_dismissed") === "1") {
    return;
  }

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

