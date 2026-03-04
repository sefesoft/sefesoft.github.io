/**
 * Localization (i18n) for Provino — Spanish and English.
 * Export: t, applyTranslations, setLangToggleState, setLocale
 */

export const LOCALE_KEY = "provino_locale";
export const DEFAULT_LOCALE = "es";

export const translations = {
  es: {
    "brand.subtitle": "Valle de Guadalupe",
    "nav.home": "Inicio",
    "nav.wineries": "Bodegas",
    "nav.events": "Eventos",
    "nav.promos": "Promociones",
    "nav.map": "Mapa",
    "install.btn": "Instalar App",
    "installSheet.title": "Instala Provino",
    "installSheet.text":
      "Instala la app para acceder más rápido a bodegas, mapa y promociones del Valle de Guadalupe.",
    "installSheet.primary": "Instalar ahora",
    "installSheet.close": "No mostrar de nuevo",
    "installSheet.titleIos": "Instalar Provino en iPhone/iPad",
    "installSheet.textIos":
      "En Safari: toca el botón Compartir (cuadrado con flecha) abajo o arriba, luego «Añadir a la pantalla de inicio». La app aparecerá en tu pantalla de inicio.",
    "installSheet.primaryIos": "Entendido",
    "view.home.title": "Bienvenido a Provino",
    "view.home.text":
      "Explora bodegas, eventos y promociones del Valle de Guadalupe desde una experiencia rápida y lista para instalar en tu teléfono.",
    "view.wineries.title": "Bodegas",
    "view.wineries.text":
      "Explora algunas de las bodegas más representativas del Valle de Guadalupe.",
    "view.events.title": "Eventos",
    "view.events.text":
      "Eventos y experiencias en el Valle de Guadalupe. Toca uno para ver detalles.",
    "view.promos.title": "Promociones",
    "view.promos.text":
      "Ofertas y promociones vigentes en el Valle de Guadalupe. Toca una para ver detalles.",
    "view.map.title": "Mapa interactivo",
    "view.map.text":
      "Descubre de un vistazo dónde se encuentran las bodegas del Valle de Guadalupe.",
    "view.map.ariaLabel": "Mapa con la ubicación de las bodegas",
    "back.wineries": "Volver a Bodegas",
    "back.events": "Volver a Eventos",
    "back.promos": "Volver a Promociones",
    "footer.copyright": "© {year} Provino - Valle de Guadalupe",
    "wineries.loadError":
      "No se pudieron cargar las bodegas en este momento. Intenta nuevamente más tarde.",
    "wineries.notFound": "Bodega no encontrada.",
    "wineries.detailError": "No se pudo cargar la información de la bodega.",
    "winery.address": "Dirección",
    "winery.phone": "Teléfono",
    "winery.web": "Web",
    "winery.call": "Llamar",
    "winery.openWeb": "Abrir web",
    "winery.navigation": "Navegación",
    "events.empty": "No hay eventos próximos en este momento. Vuelve pronto.",
    "events.loadError": "No se pudieron cargar los eventos. Intenta más tarde.",
    "events.notFound": "Evento no encontrado.",
    "events.detailError": "No se pudo cargar el evento.",
    "events.googleCalendar": "Google Calendar",
    "events.downloadIcs": "Descargar .ics",
    "promos.empty": "No hay promociones vigentes en este momento. Vuelve pronto.",
    "promos.loadError": "No se pudieron cargar las promociones. Intenta más tarde.",
    "promos.notFound": "Promoción no encontrada.",
    "promos.detailError": "No se pudo cargar la promoción.",
    "promos.validity": "Vigencia: ",
  },
  en: {
    "brand.subtitle": "Valle de Guadalupe",
    "nav.home": "Home",
    "nav.wineries": "Wineries",
    "nav.events": "Events",
    "nav.promos": "Promos",
    "nav.map": "Map",
    "install.btn": "Install App",
    "installSheet.title": "Install Provino",
    "installSheet.text":
      "Install the app for quicker access to wineries, map and promos in Valle de Guadalupe.",
    "installSheet.primary": "Install now",
    "installSheet.close": "Don't show again",
    "installSheet.titleIos": "Install Provino on iPhone/iPad",
    "installSheet.textIos":
      "In Safari: tap the Share button (square with arrow) at the bottom or top, then «Add to Home Screen». The app will appear on your home screen.",
    "installSheet.primaryIos": "Got it",
    "view.home.title": "Welcome to Provino",
    "view.home.text":
      "Explore wineries, events and promos in Valle de Guadalupe with a fast experience ready to install on your phone.",
    "view.wineries.title": "Wineries",
    "view.wineries.text":
      "Explore some of the most representative wineries in Valle de Guadalupe.",
    "view.events.title": "Events",
    "view.events.text":
      "Events and experiences in Valle de Guadalupe. Tap one to see details.",
    "view.promos.title": "Promos",
    "view.promos.text":
      "Current offers and promos in Valle de Guadalupe. Tap one to see details.",
    "view.map.title": "Interactive map",
    "view.map.text":
      "Discover at a glance where the Valle de Guadalupe wineries are located.",
    "view.map.ariaLabel": "Map with winery locations",
    "back.wineries": "Back to Wineries",
    "back.events": "Back to Events",
    "back.promos": "Back to Promos",
    "footer.copyright": "© {year} Provino - Valle de Guadalupe",
    "wineries.loadError":
      "Wineries could not be loaded at this time. Please try again later.",
    "wineries.notFound": "Winery not found.",
    "wineries.detailError": "Could not load winery information.",
    "winery.address": "Address",
    "winery.phone": "Phone",
    "winery.web": "Web",
    "winery.call": "Call",
    "winery.openWeb": "Open web",
    "winery.navigation": "Navigation",
    "events.empty": "No upcoming events at this time. Check back soon.",
    "events.loadError": "Could not load events. Try again later.",
    "events.notFound": "Event not found.",
    "events.detailError": "Could not load event.",
    "events.googleCalendar": "Google Calendar",
    "events.downloadIcs": "Download .ics",
    "promos.empty": "No active promos at this time. Check back soon.",
    "promos.loadError": "Could not load promos. Try again later.",
    "promos.notFound": "Promo not found.",
    "promos.detailError": "Could not load promo.",
    "promos.validity": "Valid: ",
  },
};

let currentLocale =
  (typeof localStorage !== "undefined" && localStorage.getItem(LOCALE_KEY)) || DEFAULT_LOCALE;
if (currentLocale !== "es" && currentLocale !== "en") currentLocale = DEFAULT_LOCALE;

export function t(key) {
  return translations[currentLocale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key;
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(lang) {
  if (lang !== "es" && lang !== "en") return;
  currentLocale = lang;
  try {
    localStorage.setItem(LOCALE_KEY, currentLocale);
  } catch (e) {
    void e;
  }
}

export function applyTranslations() {
  document.documentElement.lang = currentLocale;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    if (key === "footer.copyright") {
      el.textContent = t(key).replace("{year}", String(new Date().getFullYear()));
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (key) el.setAttribute("aria-label", t(key));
  });
}

export function setLangToggleState() {
  document.querySelectorAll(".lang-option").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    const active = lang === currentLocale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}
