import { t, applyTranslations, setLangToggleState, setLocale, getLocale } from "./i18n.js";

/** Resolve a localized field (object with es/en) or plain string; fallback to Spanish if locale missing. */
function localizeField(field, preferredLocale) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  const locale = preferredLocale || getLocale();
  return field[locale] ?? field.es ?? field.en ?? "";
}

const routes = {
  home: "view-home",
  wineries: "view-wineries",
  wineryDetail: "view-winery-detail",
  events: "view-events",
  eventDetail: "view-event-detail",
  promos: "view-promos",
  promoDetail: "view-promo-detail",
  map: "view-map",
};

const appRoot = document.getElementById("app");
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
let wineries = [];
let wineriesLoaded = false;
let events = [];
let eventsLoaded = false;
let promos = [];
let promosLoaded = false;
let mapInstance = null;
let mapMarkersLayer = null;

function renderRoute(route) {
  const templateId = routes[route] || routes.home;
  const template = document.getElementById(templateId);
  if (!template || !("content" in template)) return;

  appRoot.replaceChildren(template.content.cloneNode(true));
}

function setActiveNav(route) {
  const activeKey =
    route === "wineryDetail"
      ? "wineries"
      : route === "eventDetail"
        ? "events"
        : route === "promoDetail"
          ? "promos"
          : route;
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
  let route = base;
  if (base === "wineries" && rest.length > 0) route = "wineryDetail";
  else if (base === "events" && rest.length > 0) route = "eventDetail";
  else if (base === "promos" && rest.length > 0) route = "promoDetail";

  renderRoute(route);
  setActiveNav(route);
  enhanceRoute(route, rest);
  applyTranslations();
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

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    if (lang !== "es" && lang !== "en") return;
    setLocale(lang);
    setLangToggleState();
    applyTranslations();
    handleRouteChange();
  });
});

setLangToggleState();
handleRouteChange();

async function ensureWineriesLoaded() {
  if (wineriesLoaded) return;

  const response = await fetch("data/vinicolas.json");
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
      const id = slugify(localizeField(winery.name, "es"));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "winery-card";
      button.dataset.wineryId = id;
      button.setAttribute("aria-label", `Abrir ${localizeField(winery.name)}`);

      const logo = document.createElement("div");
      logo.className = "winery-card-logo";
      logo.textContent = initialsFromName(localizeField(winery.name));

      const name = document.createElement("div");
      name.className = "winery-card-name";
      name.textContent = localizeField(winery.name);

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
    listEl.textContent = t("wineries.loadError");
  }
}

function isEventUpcoming(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T12:00:00");
  eventDate.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeIcsText(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function buildIcsForEvent(event) {
  const uid = `${event.id}-${event.date}@provino.app`;
  const now = new Date();
  const dtstamp =
    now.getUTCFullYear() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";
  const start = (event.date || "").replace(/-/g, "");
  const endDate = event.date ? new Date(event.date + "T12:00:00") : null;
  if (endDate) endDate.setDate(endDate.getDate() + 1);
  const end = endDate
    ? endDate.toISOString().slice(0, 10).replace(/-/g, "")
    : start;
  const summary = escapeIcsText(localizeField(event.name) || "Evento");
  const description = escapeIcsText(localizeField(event.description) || "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Provino//Eventos//ES",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + dtstamp,
    "DTSTART;VALUE=DATE:" + start,
    "DTEND;VALUE=DATE:" + end,
    "SUMMARY:" + summary,
    "DESCRIPTION:" + description,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function downloadIcsForEvent(event) {
  const ics = buildIcsForEvent(event);
  const blob = new Blob(["\uFEFF" + ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `evento-${(event.id || "evento").replace(/\s+/g, "-")}.ics`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getGoogleCalendarUrl(event) {
  const start = (event.date || "").replace(/-/g, "");
  const endDate = event.date ? new Date(event.date + "T12:00:00") : null;
  if (endDate) endDate.setDate(endDate.getDate() + 1);
  const end = endDate
    ? endDate.toISOString().slice(0, 10).replace(/-/g, "")
    : start;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: localizeField(event.name) || "Evento",
    details: localizeField(event.description) || "",
    dates: `${start}/${end}`,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

async function ensureEventsLoaded() {
  if (eventsLoaded) return;
  const response = await fetch("data/eventos.json");
  if (!response.ok) throw new Error("No se pudieron cargar los eventos");
  events = await response.json();
  eventsLoaded = true;
}

async function setupEventsView() {
  const listEl = document.getElementById("eventsList");
  if (!listEl) return;

  try {
    await ensureEventsLoaded();
    const upcoming = events.filter((e) => isEventUpcoming(e.date));
    listEl.replaceChildren();

    if (upcoming.length === 0) {
      const p = document.createElement("p");
      p.className = "view-text";
      p.textContent = t("events.empty");
      listEl.replaceChildren(p);
      return;
    }

    upcoming.forEach((event) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "event-card";
      card.setAttribute("aria-label", `Ver ${localizeField(event.name)}`);

      const imgWrap = document.createElement("div");
      imgWrap.className = "event-card-image";
      const img = document.createElement("img");
      img.src = event.image || "";
      img.alt = "";
      img.loading = "lazy";
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "event-card-body";
      const title = document.createElement("div");
      title.className = "event-card-title";
      title.textContent = localizeField(event.name);
      const date = document.createElement("div");
      date.className = "event-card-date";
      date.textContent = formatEventDate(event.date);
      const desc = document.createElement("div");
      desc.className = "event-card-desc";
      const eventDesc = localizeField(event.description) || "";
      desc.textContent = eventDesc.slice(0, 80) + (eventDesc.length > 80 ? "…" : "");
      body.append(title, date, desc);

      const chevron = document.createElement("div");
      chevron.className = "event-card-chevron";
      chevron.textContent = "›";

      card.append(imgWrap, body, chevron);
      card.addEventListener("click", () => {
        history.pushState(
          { route: "events" },
          "",
          `#events/${encodeURIComponent(event.id)}`
        );
        handleRouteChange();
      });
      listEl.appendChild(card);
    });
  } catch (error) {
    listEl.textContent = t("events.loadError");
  }
}

async function setupEventDetailView(eventIdRaw) {
  const container = document.getElementById("eventDetail");
  const backBtn = document.getElementById("eventBackBtn");
  if (!container) return;

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.pushState({ route: "events" }, "", "#events");
      handleRouteChange();
    });
  }

  try {
    await ensureEventsLoaded();
    const eventId = decodeURIComponent(eventIdRaw || "");
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      container.textContent = t("events.notFound");
      return;
    }

    container.replaceChildren();

    const imgWrap = document.createElement("div");
    imgWrap.className = "event-detail-image";
    const img = document.createElement("img");
    img.src = event.image || "";
    img.alt = "";
    imgWrap.appendChild(img);

    const title = document.createElement("h1");
    title.className = "event-detail-title";
    title.textContent = localizeField(event.name);

    const date = document.createElement("p");
    date.className = "event-detail-date";
    date.textContent = formatEventDate(event.date);

    const desc = document.createElement("p");
    desc.className = "event-detail-desc";
    desc.textContent = localizeField(event.description) || "";

    const actions = document.createElement("div");
    actions.className = "event-detail-actions";
    const addToCalendarLabel = "Añadir al calendario";
    const googleBtn = document.createElement("a");
    googleBtn.className = "event-action event-action-google";
    googleBtn.href = getGoogleCalendarUrl(event);
    googleBtn.target = "_blank";
    googleBtn.rel = "noopener noreferrer";
    googleBtn.textContent = t("events.googleCalendar");
    googleBtn.setAttribute("aria-label", addToCalendarLabel + " (Google)");
    const icsBtn = document.createElement("button");
    icsBtn.type = "button";
    icsBtn.className = "event-action event-action-ics";
    icsBtn.textContent = t("events.downloadIcs");
    icsBtn.setAttribute("aria-label", addToCalendarLabel + " (archivo .ics para iOS / Apple Calendar)");
    icsBtn.addEventListener("click", () => downloadIcsForEvent(event));
    actions.append(googleBtn, icsBtn);

    container.append(imgWrap, title, date, desc, actions);
  } catch (error) {
    container.textContent = t("events.detailError");
  }
}

function isPromoActive(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startStr + "T12:00:00");
  start.setHours(0, 0, 0, 0);
  const end = new Date(endStr + "T12:00:00");
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}

function formatPromoDateRange(startStr, endStr) {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr + "T12:00:00");
  const end = new Date(endStr + "T12:00:00");
  return (
    start.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) +
    " – " +
    end.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
  );
}

async function ensurePromosLoaded() {
  if (promosLoaded) return;
  const response = await fetch("data/promos.json");
  if (!response.ok) throw new Error("No se pudieron cargar las promociones");
  promos = await response.json();
  promosLoaded = true;
}

async function setupPromosView() {
  const listEl = document.getElementById("promosList");
  if (!listEl) return;

  try {
    await ensurePromosLoaded();
    const active = promos.filter((p) => isPromoActive(p.startDate, p.endDate));
    listEl.replaceChildren();

    if (active.length === 0) {
      const p = document.createElement("p");
      p.className = "view-text";
      p.textContent = t("promos.empty");
      listEl.replaceChildren(p);
      return;
    }

    active.forEach((promo) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "promo-card";
      card.setAttribute("aria-label", `Ver ${localizeField(promo.name)}`);

      const imgWrap = document.createElement("div");
      imgWrap.className = "promo-card-image";
      const img = document.createElement("img");
      img.src = promo.image || "";
      img.alt = "";
      img.loading = "lazy";
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "promo-card-body";
      const title = document.createElement("div");
      title.className = "promo-card-title";
      title.textContent = localizeField(promo.name);
      const dates = document.createElement("div");
      dates.className = "promo-card-dates";
      dates.textContent = formatPromoDateRange(promo.startDate, promo.endDate);
      const desc = document.createElement("div");
      desc.className = "promo-card-desc";
      const promoDesc = localizeField(promo.description) || "";
      desc.textContent = promoDesc.slice(0, 80) + (promoDesc.length > 80 ? "…" : "");
      body.append(title, dates, desc);

      const chevron = document.createElement("div");
      chevron.className = "promo-card-chevron";
      chevron.textContent = "›";

      card.append(imgWrap, body, chevron);
      card.addEventListener("click", () => {
        history.pushState(
          { route: "promos" },
          "",
          `#promos/${encodeURIComponent(promo.id)}`
        );
        handleRouteChange();
      });
      listEl.appendChild(card);
    });
  } catch (error) {
    listEl.textContent = t("promos.loadError");
  }
}

async function setupPromoDetailView(promoIdRaw) {
  const container = document.getElementById("promoDetail");
  const backBtn = document.getElementById("promoBackBtn");
  if (!container) return;

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.pushState({ route: "promos" }, "", "#promos");
      handleRouteChange();
    });
  }

  try {
    await ensurePromosLoaded();
    const promoId = decodeURIComponent(promoIdRaw || "");
    const promo = promos.find((p) => p.id === promoId);
    if (!promo) {
      container.textContent = t("promos.notFound");
      return;
    }

    container.replaceChildren();

    const imgWrap = document.createElement("div");
    imgWrap.className = "promo-detail-image";
    const img = document.createElement("img");
    img.src = promo.image || "";
    img.alt = "";
    imgWrap.appendChild(img);

    const title = document.createElement("h1");
    title.className = "promo-detail-title";
    title.textContent = localizeField(promo.name);

    const dates = document.createElement("p");
    dates.className = "promo-detail-dates";
    dates.textContent =
      t("promos.validity") + formatPromoDateRange(promo.startDate, promo.endDate);

    const desc = document.createElement("p");
    desc.className = "promo-detail-desc";
    desc.textContent = localizeField(promo.description) || "";

    container.append(imgWrap, title, dates, desc);
  } catch (error) {
    container.textContent = t("promos.detailError");
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
    const winery = wineries.find(
      (w) => slugify(localizeField(w?.name, "es") || "") === wineryId
    );
    if (!winery) {
      container.textContent = t("wineries.notFound");
      return;
    }

    container.replaceChildren();

    const header = document.createElement("div");
    header.className = "winery-detail-header";

    const badge = document.createElement("div");
    badge.className = "winery-detail-badge";
    badge.textContent = initialsFromName(localizeField(winery.name));

    const titleWrap = document.createElement("div");
    titleWrap.className = "winery-detail-titlewrap";

    const title = document.createElement("h1");
    title.className = "winery-detail-title";
    title.textContent = localizeField(winery.name);

    const desc = document.createElement("p");
    desc.className = "winery-detail-desc";
    desc.textContent = localizeField(winery.description) || "";

    titleWrap.append(title, desc);
    header.append(badge, titleWrap);

    const info = document.createElement("div");
    info.className = "winery-detail-info";

    const address = infoRow(t("winery.address"), localizeField(winery.address));
    const phone = infoRow(t("winery.phone"), winery.phone);
    const web = infoRow(t("winery.web"), winery.webpage);

    info.append(address, phone, web);

    const actions = document.createElement("div");
    actions.className = "winery-detail-actions";

    const callBtn = actionButton(t("winery.call"), winery.phone ? `tel:${normalizeTel(winery.phone)}` : "");
    const webBtn = actionButton(t("winery.openWeb"), winery.webpage || "");
    const hasCoords =
      typeof winery.lat === "number" && typeof winery.lng === "number";
    const navHref = hasCoords ? `geo:${winery.lat},${winery.lng}` : "";
    const navBtn = actionButton(t("winery.navigation"), navHref);
    navBtn.setAttribute("aria-label", t("winery.navigation"));

    if (!winery.phone) callBtn.disabled = true;
    if (!winery.webpage) webBtn.disabled = true;
    if (!navHref) navBtn.disabled = true;

    actions.append(callBtn, webBtn, navBtn);

    container.append(header, info, actions);
  } catch (error) {
    container.textContent = t("wineries.detailError");
  }
}

function enhanceRoute(route, rest = []) {
  if (route === "wineries") {
    setupWineriesView();
    return;
  }
  if (route === "wineryDetail") {
    setupWineryDetailView(rest[0]);
    return;
  }
  if (route === "map") {
    setupMapView();
    return;
  }
  if (route === "events") {
    setupEventsView();
    return;
  }
  if (route === "eventDetail") {
    setupEventDetailView(rest[0]);
    return;
  }
  if (route === "promos") {
    setupPromosView();
    return;
  }
  if (route === "promoDetail") {
    setupPromoDetailView(rest[0]);
  }
}

async function setupMapView() {
  const container = document.getElementById("mapView");
  if (!container || typeof L === "undefined") return;

  await ensureWineriesLoaded();

  if (!mapInstance || mapInstance.getContainer() !== container) {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      mapMarkersLayer = null;
    }

    mapInstance = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([32.08, -116.57], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(mapInstance);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(mapInstance);
  }

  if (!mapMarkersLayer) {
    mapMarkersLayer = L.layerGroup().addTo(mapInstance);
  } else {
    mapMarkersLayer.clearLayers();
  }

  const bounds = [];

  wineries.forEach((winery) => {
    if (typeof winery.lat !== "number" || typeof winery.lng !== "number") return;

    const point = [winery.lat, winery.lng];
    bounds.push(point);

    const marker = L.circleMarker(point, {
      radius: 7,
      color: "#e65a94",
      weight: 2,
      fillColor: "#b3325a",
      fillOpacity: 0.85,
    });

    const popupHtml = `<strong>${localizeField(winery.name)}</strong><br><span style="font-size:0.8rem;">${
      localizeField(winery.address) || ""
    }</span>`;

    marker.bindPopup(popupHtml);
    marker.addTo(mapMarkersLayer);
  });

  if (bounds.length && mapInstance) {
    mapInstance.fitBounds(bounds, { padding: [24, 24] });
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

// ——— PWA Install (show only when not installed; iOS = instructions only) ———
const INSTALL_DISMISSED_KEY = "provino_install_dismissed";
let deferredPrompt = null;

const installBtn = document.getElementById("installBtn");
const installSheet = document.getElementById("installSheet");
const installSheetTitle = document.getElementById("installSheetTitle");
const installSheetText = document.getElementById("installSheetText");
const installSheetPrimary = document.getElementById("installSheetPrimary");
const installSheetClose = document.getElementById("installSheetClose");

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

function isInstallDismissed() {
  return window.sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
}

function hideInstallUI(permanent = false) {
  if (installBtn) installBtn.hidden = true;
  if (installSheet) {
    installSheet.hidden = true;
    installSheet.classList.remove("is-visible");
  }
  if (permanent) window.sessionStorage.setItem(INSTALL_DISMISSED_KEY, "1");
}

// When already installed (opened from home screen), never show install UI
if (isRunningStandalone()) {
  hideInstallUI(false);
} else {
  // Android (and others): show header button when beforeinstallprompt fires
  window.addEventListener("beforeinstallprompt", (e) => {
    if (isInstallDismissed()) return;
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
    // Optional: auto-show bottom sheet on first visit
    showInstallSheet(false);
  });

  // iOS: show header button; tapping it shows bottom sheet with instructions only
  if (isIos) {
    if (installBtn && !isInstallDismissed()) {
      installBtn.hidden = false;
    }
  }
}

function showInstallSheet(forIos = false) {
  if (!installSheet || isRunningStandalone() || isInstallDismissed()) return;
  if (forIos) {
    if (installSheetTitle) installSheetTitle.textContent = t("installSheet.titleIos");
    if (installSheetText) installSheetText.textContent = t("installSheet.textIos");
    if (installSheetPrimary) {
      installSheetPrimary.textContent = t("installSheet.primaryIos");
      installSheetPrimary.style.display = "";
    }
  } else {
    if (installSheetTitle) installSheetTitle.textContent = t("installSheet.title");
    if (installSheetText) installSheetText.textContent = t("installSheet.text");
    if (installSheetPrimary) {
      installSheetPrimary.textContent = t("installSheet.primary");
      installSheetPrimary.style.display = deferredPrompt ? "" : "none";
    }
  }
  installSheet.hidden = false;
  installSheet.classList.add("is-visible");
}

function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        deferredPrompt = null;
        hideInstallUI(true);
      }
    });
    return;
  }
  if (isIos) {
    showInstallSheet(true);
  }
}

if (installBtn) {
  installBtn.addEventListener("click", () => {
    if (isIos) showInstallSheet(true);
    else handleInstallClick();
  });
}

if (installSheetPrimary) {
  installSheetPrimary.addEventListener("click", () => {
    if (deferredPrompt) {
      handleInstallClick();
    } else {
      installSheet.classList.remove("is-visible");
      installSheet.hidden = true;
    }
  });
}

if (installSheetClose) {
  installSheetClose.addEventListener("click", () => {
    hideInstallUI(true);
  });
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  hideInstallUI(true);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("SW registration failed", err));
  });
}
