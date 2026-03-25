import { t, applyTranslations, setLangToggleState, setLocale, getLocale } from "./i18n.js";
import {
  mountAdminView,
  getStoredBreweriesOverride,
  setStoredBreweriesOverride,
  getStoredEventsOverride,
  setStoredEventsOverride,
  getStoredPromosOverride,
  setStoredPromosOverride,
} from "./admin.js";

/** Resolve a localized field (object with es/en) or plain string; fallback to Spanish if locale missing. */
function localizeField(field, preferredLocale) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  const locale = preferredLocale || getLocale();
  return field[locale] ?? field.es ?? field.en ?? "";
}

const routes = {
  home: "view-home",
  breweries: "view-breweries",
  breweryDetail: "view-brewery-detail",
  events: "view-events",
  eventDetail: "view-event-detail",
  promos: "view-promos",
  promoDetail: "view-promo-detail",
  map: "view-map",
  admin: "view-admin",
};

const appRoot = document.getElementById("app");
const navButtons = Array.from(document.querySelectorAll(".nav-link"));
let breweries = [];
let breweriesLoaded = false;
let events = [];
let eventsLoaded = false;
let promos = [];
let promosLoaded = false;
let mapInstance = null;
let mapMarkersLayer = null;

const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxBackdrop = document.querySelector(".lightbox-backdrop");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
let lightboxUrls = [];
let lightboxIndex = 0;

function renderRoute(route) {
  const templateId = routes[route] || routes.home;
  const template = document.getElementById(templateId);
  if (!template || !("content" in template)) return;

  appRoot.replaceChildren(template.content.cloneNode(true));
}

function setActiveNav(route) {
  const activeKey =
    route === "breweryDetail"
      ? "breweries"
      : route === "eventDetail"
        ? "events"
        : route === "promoDetail"
          ? "promos"
          : route === "admin"
            ? ""
            : route;
  navButtons.forEach((btn) => {
    const isActive = activeKey !== "" && btn.dataset.route === activeKey;
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
  if (base === "breweries" && rest.length > 0) route = "breweryDetail";
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
initGalleryLightbox();
handleRouteChange();

async function ensureBreweriesLoaded() {
  if (breweriesLoaded) return;

  const stored = getStoredBreweriesOverride();
  if (stored) {
    breweries = stored;
    breweriesLoaded = true;
    return;
  }

  const response = await fetch("data/cervecerias.json");
  if (!response.ok) {
    throw new Error("No se pudieron cargar las cervecerías");
  }
  breweries = await response.json();
  breweriesLoaded = true;
}

function persistAdminBreweries(next) {
  setStoredBreweriesOverride(next);
  breweries = next;
  breweriesLoaded = true;
}

function persistAdminEvents(next) {
  setStoredEventsOverride(next);
  events = next;
  eventsLoaded = true;
}

function persistAdminPromos(next) {
  setStoredPromosOverride(next);
  promos = next;
  promosLoaded = true;
}

function setupAdminView() {
  const root = document.getElementById("adminRoot");
  if (!root) return;
  mountAdminView(root, {
    loadBreweriesForAdmin: async () => {
      await ensureBreweriesLoaded();
      return JSON.parse(JSON.stringify(breweries));
    },
    persistBreweries: (list) => {
      persistAdminBreweries(list);
    },
    loadEventsForAdmin: async () => {
      await ensureEventsLoaded();
      return JSON.parse(JSON.stringify(events));
    },
    persistEvents: (list) => {
      persistAdminEvents(list);
    },
    loadPromosForAdmin: async () => {
      await ensurePromosLoaded();
      return JSON.parse(JSON.stringify(promos));
    },
    persistPromos: (list) => {
      persistAdminPromos(list);
    },
  });
}

async function setupBreweriesView() {
  const listEl = document.getElementById("breweriesList");
  if (!listEl) return;

  try {
    await ensureBreweriesLoaded();
    listEl.replaceChildren();
    breweries.forEach((brewery) => {
      if (!brewery?.name) return;
      const id = slugify(localizeField(brewery.name, "es"));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "brewery-card";
      button.setAttribute("role", "listitem");
      button.dataset.breweryId = id;
      button.setAttribute("aria-label", `Abrir ${localizeField(brewery.name)}`);

      const logo = document.createElement("div");
      logo.className = "brewery-card-logo";
      if (brewery.logo) {
        const logoImg = document.createElement("img");
        logoImg.src = brewery.logo;
        logoImg.alt = "";
        logoImg.loading = "lazy";
        logo.appendChild(logoImg);
      } else {
        logo.textContent = initialsFromName(localizeField(brewery.name));
      }

      const name = document.createElement("div");
      name.className = "brewery-card-name";
      name.textContent = localizeField(brewery.name);

      button.append(logo, name);
      button.addEventListener("click", () => {
        history.pushState(
          { route: "breweries", breweryId: id },
          "",
          `#breweries/${encodeURIComponent(id)}`
        );
        handleRouteChange();
      });

      listEl.appendChild(button);
    });
  } catch (error) {
    listEl.textContent = t("breweries.loadError");
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
  const uid = `${event.id}-${event.date}@lupulo.app`;
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
    "PRODID:-//Lupulo//Eventos//ES",
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

  const stored = getStoredEventsOverride();
  if (stored) {
    events = stored;
    eventsLoaded = true;
    return;
  }

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

  const stored = getStoredPromosOverride();
  if (stored) {
    promos = stored;
    promosLoaded = true;
    return;
  }

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

/** iOS / iPadOS (including iPad with desktop UA). */
function isMapsIOS() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isMapsAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

/**
 * Apple Maps on iPhone/iPad, Google Maps (app or web) on Android, Google Maps in a new browser tab on desktop.
 */
function openBreweryInMaps(lat, lng, placeName) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return;

  const name = (placeName || "").trim();

  if (isMapsIOS()) {
    const params = new URLSearchParams();
    params.set("daddr", `${latNum},${lngNum}`);
    if (name) params.set("q", name);
    window.location.href = `https://maps.apple.com/?${params.toString()}`;
    return;
  }

  if (isMapsAndroid()) {
    const dest = encodeURIComponent(`${latNum},${lngNum}`);
    window.location.assign(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}`
    );
    return;
  }

  const query =
    name.length > 0
      ? encodeURIComponent(`${name} ${latNum},${lngNum}`)
      : encodeURIComponent(`${latNum},${lngNum}`);
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank",
    "noopener,noreferrer"
  );
}

async function setupBreweryDetailView(breweryIdRaw) {
  const container = document.getElementById("breweryDetail");
  const backBtn = document.getElementById("breweryBackBtn");
  if (!container) return;

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.pushState({ route: "breweries" }, "", "#breweries");
      handleRouteChange();
    });
  }

  try {
    await ensureBreweriesLoaded();
    const breweryId = decodeURIComponent(breweryIdRaw || "");
    const brewery = breweries.find(
      (b) => slugify(localizeField(b?.name, "es") || "") === breweryId
    );
    if (!brewery) {
      container.textContent = t("breweries.notFound");
      return;
    }

    container.replaceChildren();

    const header = document.createElement("div");
    header.className = "brewery-detail-header";

    const badge = document.createElement("div");
    badge.className = "brewery-detail-badge";
    if (brewery.logo) {
      const badgeImg = document.createElement("img");
      badgeImg.src = brewery.logo;
      badgeImg.alt = "";
      badge.appendChild(badgeImg);
    } else {
      badge.textContent = initialsFromName(localizeField(brewery.name));
    }

    const titleWrap = document.createElement("div");
    titleWrap.className = "brewery-detail-titlewrap";

    const title = document.createElement("h1");
    title.className = "brewery-detail-title";
    title.textContent = localizeField(brewery.name);

    const desc = document.createElement("p");
    desc.className = "brewery-detail-desc";
    desc.textContent = localizeField(brewery.description) || "";

    titleWrap.append(title, desc);
    header.append(badge, titleWrap);

    let galleryEl = null;
    if (Array.isArray(brewery.gallery) && brewery.gallery.length > 0) {
      galleryEl = document.createElement("div");
      galleryEl.className = "brewery-detail-gallery";
      brewery.gallery.slice(0, 3).forEach((src) => {
        const item = document.createElement("div");
        item.className = "brewery-detail-gallery-item";
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        item.appendChild(img);
        galleryEl.appendChild(item);
      });
    }

    const info = document.createElement("div");
    info.className = "brewery-detail-info";

    const address = infoRow(t("brewery.address"), localizeField(brewery.address));
    const phone = infoRow(t("brewery.phone"), brewery.phone);
    const web = infoRow(t("brewery.web"), brewery.webpage);

    info.append(address, phone, web);

    const actions = document.createElement("div");
    actions.className = "brewery-detail-actions";

    const callBtn = actionButton(t("brewery.call"), brewery.phone ? `tel:${normalizeTel(brewery.phone)}` : "");
    const webBtn = actionButton(t("brewery.openWeb"), brewery.webpage || "");
    const hasCoords =
      typeof brewery.lat === "number" && typeof brewery.lng === "number";
    const navBtn = document.createElement("button");
    navBtn.type = "button";
    navBtn.className = "brewery-action";
    navBtn.textContent = t("brewery.navigation");
    navBtn.setAttribute("aria-label", t("brewery.navigation"));
    navBtn.addEventListener("click", () => {
      openBreweryInMaps(
        brewery.lat,
        brewery.lng,
        localizeField(brewery.name)
      );
    });

    if (!brewery.phone) callBtn.disabled = true;
    if (!brewery.webpage) webBtn.disabled = true;
    if (!hasCoords) navBtn.disabled = true;

    actions.append(callBtn, webBtn, navBtn);

    if (galleryEl) {
      const urls = brewery.gallery.slice(0, 3);
      galleryEl.querySelectorAll(".brewery-detail-gallery-item").forEach((item, index) => {
        item.addEventListener("click", () => openGalleryLightbox(urls, index));
        item.style.cursor = "pointer";
      });
      container.append(header, galleryEl, info, actions);
    } else container.append(header, info, actions);
  } catch (error) {
    container.textContent = t("breweries.detailError");
  }
}

function openGalleryLightbox(urls, startIndex) {
  if (!urls?.length || !galleryLightbox || !lightboxImage) return;
  lightboxUrls = urls;
  lightboxIndex = Math.max(0, Math.min(startIndex, urls.length - 1));
  lightboxImage.src = lightboxUrls[lightboxIndex];
  galleryLightbox.hidden = false;
  document.body.style.overflow = "hidden";
  updateLightboxNav();
  galleryLightbox.focus();
}

function closeGalleryLightbox() {
  if (galleryLightbox) galleryLightbox.hidden = true;
  document.body.style.overflow = "";
}

function updateLightboxNav() {
  if (!lightboxImage || !lightboxUrls.length) return;
  lightboxImage.src = lightboxUrls[lightboxIndex];
  if (lightboxPrev) {
    lightboxPrev.disabled = lightboxIndex <= 0;
    lightboxPrev.hidden = lightboxUrls.length <= 1;
  }
  if (lightboxNext) {
    lightboxNext.disabled = lightboxIndex >= lightboxUrls.length - 1;
    lightboxNext.hidden = lightboxUrls.length <= 1;
  }
}

function initGalleryLightbox() {
  if (!galleryLightbox) return;
  galleryLightbox.hidden = true;
  document.body.style.overflow = "";
  lightboxBackdrop?.addEventListener("click", (e) => {
    e.preventDefault();
    closeGalleryLightbox();
  });
  lightboxClose?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeGalleryLightbox();
  });
  lightboxPrev?.addEventListener("click", () => {
    if (lightboxIndex > 0) {
      lightboxIndex--;
      updateLightboxNav();
    }
  });
  lightboxNext?.addEventListener("click", () => {
    if (lightboxIndex < lightboxUrls.length - 1) {
      lightboxIndex++;
      updateLightboxNav();
    }
  });
  galleryLightbox.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGalleryLightbox();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (lightboxIndex > 0) {
        lightboxIndex--;
        updateLightboxNav();
      }
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (lightboxIndex < lightboxUrls.length - 1) {
        lightboxIndex++;
        updateLightboxNav();
      }
    }
  });
  let touchStartX = 0;
  galleryLightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches?.[0]?.clientX ?? 0;
    },
    { passive: true }
  );
  galleryLightbox.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches?.[0]?.clientX ?? 0;
    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) lightboxNext?.click();
      else lightboxPrev?.click();
    }
  });
}

function enhanceRoute(route, rest = []) {
  if (route === "breweries") {
    setupBreweriesView();
    return;
  }
  if (route === "breweryDetail") {
    setupBreweryDetailView(rest[0]);
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
    return;
  }
  if (route === "admin") {
    setupAdminView();
  }
}

async function setupMapView() {
  const container = document.getElementById("mapView");
  if (!container || typeof L === "undefined") return;

  await ensureBreweriesLoaded();

  if (!mapInstance || mapInstance.getContainer() !== container) {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      mapMarkersLayer = null;
    }

    mapInstance = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([32.35, -116.85], 8);

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

  breweries.forEach((brewery) => {
    if (typeof brewery.lat !== "number" || typeof brewery.lng !== "number") return;

    const point = [brewery.lat, brewery.lng];
    bounds.push(point);

    const marker = L.circleMarker(point, {
      radius: 7,
      color: "#e8a23c",
      weight: 2,
      fillColor: "#b8621a",
      fillOpacity: 0.9,
    });

    const popupHtml = `<strong>${localizeField(brewery.name)}</strong><br><span style="font-size:0.8rem;">${
      localizeField(brewery.address) || ""
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
  row.className = "brewery-info-row";

  const k = document.createElement("div");
  k.className = "brewery-info-key";
  k.textContent = label;

  const v = document.createElement("div");
  v.className = "brewery-info-val";
  v.textContent = value || "—";

  row.append(k, v);
  return row;
}

function actionButton(text, href) {
  const a = document.createElement("a");
  a.className = "brewery-action";
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
const INSTALL_DISMISSED_KEY = "lupulo_install_dismissed";
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
