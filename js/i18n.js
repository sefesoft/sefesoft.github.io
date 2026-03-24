/**
 * Localization (i18n) for Lúpulo — Spanish and English.
 * Export: t, applyTranslations, setLangToggleState, setLocale
 */

export const LOCALE_KEY = "lupulo_locale";
export const DEFAULT_LOCALE = "es";

export const translations = {
  es: {
    "brand.subtitle": "Cerveza artesanal · Baja",
    "nav.home": "Inicio",
    "nav.breweries": "Cervecerías",
    "nav.events": "Eventos",
    "nav.promos": "Promociones",
    "nav.map": "Mapa",
    "install.btn": "Instalar App",
    "installSheet.title": "Instala Lúpulo",
    "installSheet.text":
      "Instala la app para acceder más rápido a cervecerías, mapa y promociones en Baja California.",
    "installSheet.primary": "Instalar ahora",
    "installSheet.close": "No mostrar de nuevo",
    "installSheet.titleIos": "Instalar Lúpulo en iPhone/iPad",
    "installSheet.textIos":
      "En Safari: toca el botón Compartir (cuadrado con flecha) abajo o arriba, luego «Añadir a la pantalla de inicio». La app aparecerá en tu pantalla de inicio.",
    "installSheet.primaryIos": "Entendido",
    "view.home.title": "Bienvenido a Lúpulo",
    "view.home.text":
      "Explora cervecerías artesanales, eventos y promociones en Baja California desde una experiencia rápida y lista para instalar en tu teléfono.",
    "view.breweries.title": "Cervecerías",
    "view.breweries.text":
      "Descubre tap rooms y fábricas con estilo propio en la escena craft de la región.",
    "view.events.title": "Eventos",
    "view.events.text":
      "Festivales, catas y experiencias cerveceras. Toca uno para ver detalles.",
    "view.promos.title": "Promociones",
    "view.promos.text":
      "Ofertas vigentes en tap rooms y cervecerías. Toca una para ver detalles.",
    "view.map.title": "Mapa de cervecerías",
    "view.map.text":
      "Ubica tap rooms y producción local en un mapa interactivo.",
    "view.map.ariaLabel": "Mapa con la ubicación de cervecerías",
    "back.breweries": "Volver a Cervecerías",
    "back.events": "Volver a Eventos",
    "back.promos": "Volver a Promociones",
    "footer.copyright": "© {year} Lúpulo — Cerveza artesanal Baja",
    "breweries.loadError":
      "No se pudieron cargar las cervecerías en este momento. Intenta nuevamente más tarde.",
    "breweries.notFound": "Cervecería no encontrada.",
    "breweries.detailError": "No se pudo cargar la información de la cervecería.",
    "brewery.address": "Dirección",
    "brewery.phone": "Teléfono",
    "brewery.web": "Web",
    "brewery.call": "Llamar",
    "brewery.openWeb": "Abrir web",
    "brewery.navigation": "Navegación",
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
    "brand.subtitle": "Craft beer · Baja",
    "nav.home": "Home",
    "nav.breweries": "Breweries",
    "nav.events": "Events",
    "nav.promos": "Promos",
    "nav.map": "Map",
    "install.btn": "Install App",
    "installSheet.title": "Install Lúpulo",
    "installSheet.text":
      "Install the app for quicker access to breweries, map and promos across Baja California.",
    "installSheet.primary": "Install now",
    "installSheet.close": "Don't show again",
    "installSheet.titleIos": "Install Lúpulo on iPhone/iPad",
    "installSheet.textIos":
      "In Safari: tap the Share button (square with arrow) at the bottom or top, then «Add to Home Screen». The app will appear on your home screen.",
    "installSheet.primaryIos": "Got it",
    "view.home.title": "Welcome to Lúpulo",
    "view.home.text":
      "Explore craft breweries, events and promos in Baja California with a fast experience ready to install on your phone.",
    "view.breweries.title": "Breweries",
    "view.breweries.text":
      "Discover taprooms and brewhouses with their own style in the regional craft scene.",
    "view.events.title": "Events",
    "view.events.text":
      "Festivals, tastings and beer experiences. Tap one for details.",
    "view.promos.title": "Promos",
    "view.promos.text":
      "Current offers at tap rooms and breweries. Tap one for details.",
    "view.map.title": "Brewery map",
    "view.map.text":
      "Find tap rooms and local production on an interactive map.",
    "view.map.ariaLabel": "Map with brewery locations",
    "back.breweries": "Back to Breweries",
    "back.events": "Back to Events",
    "back.promos": "Back to Promos",
    "footer.copyright": "© {year} Lúpulo — Craft beer Baja",
    "breweries.loadError":
      "Breweries could not be loaded at this time. Please try again later.",
    "breweries.notFound": "Brewery not found.",
    "breweries.detailError": "Could not load brewery information.",
    "brewery.address": "Address",
    "brewery.phone": "Phone",
    "brewery.web": "Web",
    "brewery.call": "Call",
    "brewery.openWeb": "Open web",
    "brewery.navigation": "Navigation",
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
