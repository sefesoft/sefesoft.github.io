import { ADMIN_PASSWORD } from "./admin-config.js";
import { t } from "./i18n.js";

const SESSION_KEY = "lupulo_admin_session_v1";
const STORAGE_BREWERIES = "lupulo_cervecerias_admin_v1";
const STORAGE_EVENTS = "lupulo_eventos_admin_v1";
const STORAGE_PROMOS = "lupulo_promos_admin_v1";

export function getStoredBreweriesOverride() {
  return readJsonArray(STORAGE_BREWERIES);
}

export function setStoredBreweriesOverride(list) {
  localStorage.setItem(STORAGE_BREWERIES, JSON.stringify(list));
}

export function clearStoredBreweriesOverride() {
  localStorage.removeItem(STORAGE_BREWERIES);
}

export function getStoredEventsOverride() {
  return readJsonArray(STORAGE_EVENTS);
}

export function setStoredEventsOverride(list) {
  localStorage.setItem(STORAGE_EVENTS, JSON.stringify(list));
}

export function clearStoredEventsOverride() {
  localStorage.removeItem(STORAGE_EVENTS);
}

export function getStoredPromosOverride() {
  return readJsonArray(STORAGE_PROMOS);
}

export function setStoredPromosOverride(list) {
  localStorage.setItem(STORAGE_PROMOS, JSON.stringify(list));
}

export function clearStoredPromosOverride() {
  localStorage.removeItem(STORAGE_PROMOS);
}

function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function isAdminSession() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function setAdminSession() {
  sessionStorage.setItem(SESSION_KEY, "1");
}

function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function tryLogin(password) {
  if (password === ADMIN_PASSWORD) {
    setAdminSession();
    return true;
  }
  return false;
}

function locName(field) {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return field.es ?? field.en ?? "";
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueId(base, used) {
  const root = base || "item";
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

/**
 * @param {HTMLElement} rootEl
 * @param {{
 *   loadBreweriesForAdmin: () => Promise<object[]>,
 *   persistBreweries: (list: object[]) => void,
 *   loadEventsForAdmin: () => Promise<object[]>,
 *   persistEvents: (list: object[]) => void,
 *   loadPromosForAdmin: () => Promise<object[]>,
 *   persistPromos: (list: object[]) => void,
 * }} api
 */
export function mountAdminView(rootEl, api) {
  rootEl.replaceChildren();
  if (!isAdminSession()) {
    renderLogin(rootEl, () => mountAdminView(rootEl, api));
    return;
  }
  renderConsole(rootEl, api);
}

function renderLogin(rootEl, onAuthed) {
  const wrap = document.createElement("div");
  wrap.className = "admin-login";

  const title = document.createElement("h1");
  title.className = "view-title";
  title.setAttribute("data-i18n", "admin.loginTitle");
  title.textContent = t("admin.loginTitle");

  const note = document.createElement("p");
  note.className = "admin-login-note";
  note.setAttribute("data-i18n", "admin.loginNote");
  note.textContent = t("admin.loginNote");

  const form = document.createElement("form");
  form.className = "admin-login-form";
  form.autocomplete = "on";

  const label = document.createElement("label");
  label.className = "admin-label";
  label.htmlFor = "adminPassword";
  label.setAttribute("data-i18n", "admin.password");
  label.textContent = t("admin.password");

  const input = document.createElement("input");
  input.id = "adminPassword";
  input.type = "password";
  input.name = "password";
  input.className = "admin-input";
  input.required = true;
  input.autocomplete = "current-password";

  const err = document.createElement("p");
  err.className = "admin-error";
  err.hidden = true;
  err.setAttribute("data-i18n", "admin.badPassword");
  err.textContent = t("admin.badPassword");

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "admin-btn-primary";
  submit.setAttribute("data-i18n", "admin.loginBtn");
  submit.textContent = t("admin.loginBtn");

  const back = document.createElement("a");
  back.className = "admin-back-link";
  back.href = "#home";
  back.setAttribute("data-i18n", "admin.backApp");
  back.textContent = t("admin.backApp");

  form.append(label, input, err, submit);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    err.hidden = true;
    if (tryLogin(input.value)) {
      onAuthed();
    } else {
      err.hidden = false;
      input.value = "";
      input.focus();
    }
  });

  wrap.append(title, note, form, back);
  rootEl.appendChild(wrap);
}

function fieldRow(labelKey, inputId, type, extra = {}) {
  const row = document.createElement("div");
  row.className = "admin-field";
  const lab = document.createElement("label");
  lab.className = "admin-label";
  lab.htmlFor = inputId;
  lab.setAttribute("data-i18n", labelKey);
  lab.textContent = t(labelKey);
  const inp =
    extra.textarea === true
      ? document.createElement("textarea")
      : document.createElement("input");
  inp.id = inputId;
  inp.className = extra.textarea === true ? "admin-textarea" : "admin-input";
  if (!extra.textarea) inp.type = type || "text";
  row.append(lab, inp);
  return { row, input: inp };
}

function renderConsole(rootEl, api) {
  const wrap = document.createElement("div");
  wrap.className = "admin-console";

  const header = document.createElement("div");
  header.className = "admin-console-header";

  const title = document.createElement("h1");
  title.className = "view-title admin-console-title";
  title.setAttribute("data-i18n", "admin.consoleTitle");
  title.textContent = t("admin.consoleTitle");

  const toolbar = document.createElement("div");
  toolbar.className = "admin-toolbar";

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "admin-btn-ghost";
  logoutBtn.setAttribute("data-i18n", "admin.logout");
  logoutBtn.textContent = t("admin.logout");
  logoutBtn.addEventListener("click", () => {
    clearAdminSession();
    mountAdminView(rootEl, api);
  });

  toolbar.append(logoutBtn);
  header.append(title, toolbar);

  const tablist = document.createElement("div");
  tablist.className = "admin-tabs";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", t("admin.tabsAria"));

  const panelHost = document.createElement("div");
  panelHost.className = "admin-tab-panels";

  const panels = {
    breweries: document.createElement("div"),
    events: document.createElement("div"),
    promos: document.createElement("div"),
  };
  panels.breweries.className = "admin-panel";
  panels.breweries.setAttribute("role", "tabpanel");
  panels.events.className = "admin-panel";
  panels.events.setAttribute("role", "tabpanel");
  panels.promos.className = "admin-panel";
  panels.promos.setAttribute("role", "tabpanel");
  panels.events.hidden = true;
  panels.promos.hidden = true;

  function makeTab(id, labelKey) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-tab";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    btn.setAttribute("data-i18n", labelKey);
    btn.textContent = t(labelKey);
    btn.addEventListener("click", () => selectTab(id));
    return btn;
  }

  const tabBreweries = makeTab("breweries", "admin.tabBreweries");
  const tabEvents = makeTab("events", "admin.tabEvents");
  const tabPromos = makeTab("promos", "admin.tabPromos");
  tablist.append(tabBreweries, tabEvents, tabPromos);

  const tabButtons = { breweries: tabBreweries, events: tabEvents, promos: tabPromos };

  function selectTab(id) {
    Object.keys(panels).forEach((key) => {
      const on = key === id;
      panels[key].hidden = !on;
      tabButtons[key].classList.toggle("is-active", on);
      tabButtons[key].setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  tabBreweries.classList.add("is-active");
  tabBreweries.setAttribute("aria-selected", "true");

  panelHost.append(panels.breweries, panels.events, panels.promos);

  const back = document.createElement("a");
  back.className = "admin-back-link";
  back.href = "#home";
  back.setAttribute("data-i18n", "admin.backApp");
  back.textContent = t("admin.backApp");

  wrap.append(header, tablist, panelHost, back);
  rootEl.appendChild(wrap);

  mountBreweriesPanel(panels.breweries, api);
  mountEventsPanel(panels.events, api);
  mountPromosPanel(panels.promos, api);
}

function parseGallery(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyBrewery() {
  return {
    name: { es: "", en: "" },
    logo: "",
    gallery: [],
    address: { es: "", en: "" },
    webpage: "",
    phone: "",
    description: { es: "", en: "" },
    lat: null,
    lng: null,
  };
}

function normalizeBreweryFromForm(form) {
  const latStr = form.lat?.trim() ?? "";
  const lngStr = form.lng?.trim() ?? "";
  let lat = null;
  let lng = null;
  if (latStr !== "" && !Number.isNaN(Number(latStr))) lat = Number(latStr);
  if (lngStr !== "" && !Number.isNaN(Number(lngStr))) lng = Number(lngStr);
  return {
    name: { es: form.nameEs?.trim() ?? "", en: form.nameEn?.trim() ?? "" },
    logo: form.logo?.trim() ?? "",
    gallery: parseGallery(form.galleryText),
    address: { es: form.addressEs?.trim() ?? "", en: form.addressEn?.trim() ?? "" },
    webpage: form.webpage?.trim() ?? "",
    phone: form.phone?.trim() ?? "",
    description: { es: form.descEs?.trim() ?? "", en: form.descEn?.trim() ?? "" },
    lat,
    lng,
  };
}

function mountBreweriesPanel(container, api) {
  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "admin-section-title";
  sectionTitle.setAttribute("data-i18n", "admin.breweriesTitle");
  sectionTitle.textContent = t("admin.breweriesTitle");

  const listEl = document.createElement("div");
  listEl.className = "admin-brewery-list";

  const formWrap = document.createElement("div");
  formWrap.className = "admin-form-card";

  let editingIndex = null;
  let list = [];

  function breweryLabel(b, i) {
    const n = locName(b?.name);
    return n || `${t("admin.breweryUntitled")} ${i + 1}`;
  }

  function renderList() {
    listEl.replaceChildren();
    list.forEach((b, i) => {
      const row = document.createElement("div");
      row.className = "admin-brewery-row";

      const name = document.createElement("span");
      name.className = "admin-brewery-row-name";
      name.textContent = breweryLabel(b, i);

      const actions = document.createElement("div");
      actions.className = "admin-brewery-row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "admin-btn-small";
      editBtn.setAttribute("data-i18n", "admin.edit");
      editBtn.textContent = t("admin.edit");
      editBtn.addEventListener("click", () => {
        editingIndex = i;
        fillForm(list[i]);
        formTitle.textContent = t("admin.editBrewery");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "admin-btn-small admin-btn-danger";
      delBtn.setAttribute("data-i18n", "admin.remove");
      delBtn.textContent = t("admin.remove");
      delBtn.addEventListener("click", () => {
        if (!window.confirm(t("admin.removeConfirm"))) return;
        list.splice(i, 1);
        api.persistBreweries(list);
        editingIndex = null;
        clearForm();
        formTitle.textContent = t("admin.addBrewery");
        renderList();
      });

      actions.append(editBtn, delBtn);
      row.append(name, actions);
      listEl.appendChild(row);
    });

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.setAttribute("data-i18n", "admin.emptyBreweries");
      empty.textContent = t("admin.emptyBreweries");
      listEl.appendChild(empty);
    }
  }

  const formTitle = document.createElement("h3");
  formTitle.className = "admin-form-title";
  formTitle.setAttribute("data-i18n", "admin.addBrewery");
  formTitle.textContent = t("admin.addBrewery");

  const form = document.createElement("form");
  form.className = "admin-brewery-form";

  const nameEs = fieldRow("admin.nameEs", "ab_nameEs", "text");
  const nameEn = fieldRow("admin.nameEn", "ab_nameEn", "text");
  const logo = fieldRow("admin.logo", "ab_logo", "text");
  const { row: galleryRow, input: galleryInput } = fieldRow("admin.gallery", "ab_gallery", "text", {
    textarea: true,
  });
  galleryInput.rows = 3;
  galleryInput.placeholder = t("admin.galleryPlaceholder");

  const addressEs = fieldRow("admin.addressEs", "ab_addressEs", "text");
  const addressEn = fieldRow("admin.addressEn", "ab_addressEn", "text");
  const webpage = fieldRow("admin.web", "ab_web", "text");
  const phone = fieldRow("admin.phone", "ab_phone", "text");
  const descEs = fieldRow("admin.descEs", "ab_descEs", "text", { textarea: true });
  descEs.input.rows = 2;
  const descEn = fieldRow("admin.descEn", "ab_descEn", "text", { textarea: true });
  descEn.input.rows = 2;

  const latRow = fieldRow("admin.lat", "ab_lat", "text");
  const lngRow = fieldRow("admin.lng", "ab_lng", "text");

  const formActions = document.createElement("div");
  formActions.className = "admin-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "admin-btn-primary";
  saveBtn.setAttribute("data-i18n", "admin.save");
  saveBtn.textContent = t("admin.save");

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "admin-btn-ghost";
  cancelBtn.setAttribute("data-i18n", "admin.cancel");
  cancelBtn.textContent = t("admin.cancel");
  cancelBtn.addEventListener("click", () => {
    editingIndex = null;
    clearForm();
    formTitle.textContent = t("admin.addBrewery");
  });

  formActions.append(cancelBtn, saveBtn);

  form.append(
    nameEs.row,
    nameEn.row,
    logo.row,
    galleryRow,
    addressEs.row,
    addressEn.row,
    webpage.row,
    phone.row,
    descEs.row,
    descEn.row,
    latRow.row,
    lngRow.row,
    formActions
  );

  function clearForm() {
    nameEs.input.value = "";
    nameEn.input.value = "";
    logo.input.value = "";
    galleryInput.value = "";
    addressEs.input.value = "";
    addressEn.input.value = "";
    webpage.input.value = "";
    phone.input.value = "";
    descEs.input.value = "";
    descEn.input.value = "";
    latRow.input.value = "";
    lngRow.input.value = "";
  }

  function fillForm(b) {
    const x = clone(b || emptyBrewery());
    nameEs.input.value = x.name?.es ?? "";
    nameEn.input.value = x.name?.en ?? "";
    logo.input.value = x.logo ?? "";
    galleryInput.value = Array.isArray(x.gallery) ? x.gallery.join("\n") : "";
    addressEs.input.value = x.address?.es ?? "";
    addressEn.input.value = x.address?.en ?? "";
    webpage.input.value = x.webpage ?? "";
    phone.input.value = x.phone ?? "";
    descEs.input.value = x.description?.es ?? "";
    descEn.input.value = x.description?.en ?? "";
    latRow.input.value = x.lat != null && !Number.isNaN(x.lat) ? String(x.lat) : "";
    lngRow.input.value = x.lng != null && !Number.isNaN(x.lng) ? String(x.lng) : "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = normalizeBreweryFromForm({
      nameEs: nameEs.input.value,
      nameEn: nameEn.input.value,
      logo: logo.input.value,
      galleryText: galleryInput.value,
      addressEs: addressEs.input.value,
      addressEn: addressEn.input.value,
      webpage: webpage.input.value,
      phone: phone.input.value,
      descEs: descEs.input.value,
      descEn: descEn.input.value,
      lat: latRow.input.value,
      lng: lngRow.input.value,
    });
    if (!next.name.es.trim()) {
      window.alert(t("admin.nameEsRequired"));
      nameEs.input.focus();
      return;
    }
    if (editingIndex !== null) {
      list[editingIndex] = next;
    } else {
      list.push(next);
    }
    api.persistBreweries(list);
    editingIndex = null;
    clearForm();
    formTitle.textContent = t("admin.addBrewery");
    renderList();
  });

  formWrap.append(formTitle, form);
  container.append(sectionTitle, listEl, formWrap);

  api.loadBreweriesForAdmin().then((data) => {
    list = Array.isArray(data) ? data.map((b) => clone(b)) : [];
    renderList();
  });
}

function emptyEvent() {
  return {
    id: "",
    name: { es: "", en: "" },
    date: "",
    description: { es: "", en: "" },
    image: "",
  };
}

function normalizeEventFromForm(form, existingIds) {
  let id = form.id?.trim() ?? "";
  if (!id) {
    const base = slugify(form.nameEs?.trim() || "event") || "event";
    id = uniqueId(base, existingIds);
  } else if (existingIds.has(id)) {
    return { error: t("admin.duplicateId") };
  }
  return {
    value: {
      id,
      name: { es: form.nameEs?.trim() ?? "", en: form.nameEn?.trim() ?? "" },
      date: form.date?.trim() ?? "",
      description: { es: form.descEs?.trim() ?? "", en: form.descEn?.trim() ?? "" },
      image: form.image?.trim() ?? "",
    },
  };
}

function mountEventsPanel(container, api) {
  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "admin-section-title";
  sectionTitle.setAttribute("data-i18n", "admin.eventsTitle");
  sectionTitle.textContent = t("admin.eventsTitle");

  const listEl = document.createElement("div");
  listEl.className = "admin-brewery-list";

  const formWrap = document.createElement("div");
  formWrap.className = "admin-form-card";

  let editingIndex = null;
  let list = [];

  function eventLabel(ev, i) {
    const n = locName(ev?.name);
    const d = ev?.date ? ` · ${ev.date}` : "";
    return (n || `${t("admin.eventUntitled")} ${i + 1}`) + d;
  }

  function renderList() {
    listEl.replaceChildren();
    list.forEach((ev, i) => {
      const row = document.createElement("div");
      row.className = "admin-brewery-row";

      const name = document.createElement("span");
      name.className = "admin-brewery-row-name";
      name.textContent = eventLabel(ev, i);

      const actions = document.createElement("div");
      actions.className = "admin-brewery-row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "admin-btn-small";
      editBtn.setAttribute("data-i18n", "admin.edit");
      editBtn.textContent = t("admin.edit");
      editBtn.addEventListener("click", () => {
        editingIndex = i;
        fillForm(list[i]);
        idInput.disabled = true;
        formTitle.textContent = t("admin.editEvent");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "admin-btn-small admin-btn-danger";
      delBtn.setAttribute("data-i18n", "admin.remove");
      delBtn.textContent = t("admin.remove");
      delBtn.addEventListener("click", () => {
        if (!window.confirm(t("admin.removeEventConfirm"))) return;
        list.splice(i, 1);
        api.persistEvents(list);
        editingIndex = null;
        idInput.disabled = false;
        clearForm();
        formTitle.textContent = t("admin.addEvent");
        renderList();
      });

      actions.append(editBtn, delBtn);
      row.append(name, actions);
      listEl.appendChild(row);
    });

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.setAttribute("data-i18n", "admin.emptyEvents");
      empty.textContent = t("admin.emptyEvents");
      listEl.appendChild(empty);
    }
  }

  const formTitle = document.createElement("h3");
  formTitle.className = "admin-form-title";
  formTitle.setAttribute("data-i18n", "admin.addEvent");
  formTitle.textContent = t("admin.addEvent");

  const form = document.createElement("form");
  form.className = "admin-brewery-form";

  const idRow = fieldRow("admin.itemId", "ae_id", "text");
  const idInput = idRow.input;
  idInput.placeholder = t("admin.idAutoPlaceholder");

  const nameEs = fieldRow("admin.nameEs", "ae_nameEs", "text");
  const nameEn = fieldRow("admin.nameEn", "ae_nameEn", "text");
  const dateRow = fieldRow("admin.eventDate", "ae_date", "date");
  const descEs = fieldRow("admin.descEs", "ae_descEs", "text", { textarea: true });
  descEs.input.rows = 3;
  const descEn = fieldRow("admin.descEn", "ae_descEn", "text", { textarea: true });
  descEn.input.rows = 3;
  const imageRow = fieldRow("admin.imageUrl", "ae_image", "text");

  const formActions = document.createElement("div");
  formActions.className = "admin-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "admin-btn-primary";
  saveBtn.setAttribute("data-i18n", "admin.save");
  saveBtn.textContent = t("admin.save");

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "admin-btn-ghost";
  cancelBtn.setAttribute("data-i18n", "admin.cancel");
  cancelBtn.textContent = t("admin.cancel");
  cancelBtn.addEventListener("click", () => {
    editingIndex = null;
    idInput.disabled = false;
    clearForm();
    formTitle.textContent = t("admin.addEvent");
  });

  formActions.append(cancelBtn, saveBtn);

  form.append(
    idRow.row,
    nameEs.row,
    nameEn.row,
    dateRow.row,
    descEs.row,
    descEn.row,
    imageRow.row,
    formActions
  );

  function clearForm() {
    idInput.value = "";
    nameEs.input.value = "";
    nameEn.input.value = "";
    dateRow.input.value = "";
    descEs.input.value = "";
    descEn.input.value = "";
    imageRow.input.value = "";
  }

  function fillForm(ev) {
    const x = clone(ev || emptyEvent());
    idInput.value = x.id ?? "";
    nameEs.input.value = x.name?.es ?? "";
    nameEn.input.value = x.name?.en ?? "";
    dateRow.input.value = x.date ?? "";
    descEs.input.value = x.description?.es ?? "";
    descEn.input.value = x.description?.en ?? "";
    imageRow.input.value = x.image ?? "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!nameEs.input.value.trim()) {
      window.alert(t("admin.nameEsRequired"));
      nameEs.input.focus();
      return;
    }
    const used = new Set(
      list.map((x, idx) => (idx === editingIndex ? null : x.id)).filter(Boolean)
    );
    const parsed = normalizeEventFromForm(
      {
        id: idInput.value,
        nameEs: nameEs.input.value,
        nameEn: nameEn.input.value,
        date: dateRow.input.value,
        descEs: descEs.input.value,
        descEn: descEn.input.value,
        image: imageRow.input.value,
      },
      used
    );
    if (parsed.error) {
      window.alert(parsed.error);
      return;
    }
    const next = parsed.value;
    if (!next.date) {
      window.alert(t("admin.dateRequired"));
      dateRow.input.focus();
      return;
    }
    if (editingIndex !== null) {
      const prevId = list[editingIndex].id;
      list[editingIndex] = { ...next, id: prevId };
    } else {
      list.push(next);
    }
    api.persistEvents(list);
    editingIndex = null;
    idInput.disabled = false;
    clearForm();
    formTitle.textContent = t("admin.addEvent");
    renderList();
  });

  formWrap.append(formTitle, form);
  container.append(sectionTitle, listEl, formWrap);

  api.loadEventsForAdmin().then((data) => {
    list = Array.isArray(data) ? data.map((x) => clone(x)) : [];
    renderList();
  });
}

function emptyPromo() {
  return {
    id: "",
    name: { es: "", en: "" },
    description: { es: "", en: "" },
    startDate: "",
    endDate: "",
    image: "",
  };
}

function normalizePromoFromForm(form, existingIds) {
  let id = form.id?.trim() ?? "";
  if (!id) {
    const base = slugify(form.nameEs?.trim() || "promo") || "promo";
    id = uniqueId(base, existingIds);
  } else if (existingIds.has(id)) {
    return { error: t("admin.duplicateId") };
  }
  return {
    value: {
      id,
      name: { es: form.nameEs?.trim() ?? "", en: form.nameEn?.trim() ?? "" },
      description: { es: form.descEs?.trim() ?? "", en: form.descEn?.trim() ?? "" },
      startDate: form.startDate?.trim() ?? "",
      endDate: form.endDate?.trim() ?? "",
      image: form.image?.trim() ?? "",
    },
  };
}

function mountPromosPanel(container, api) {
  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "admin-section-title";
  sectionTitle.setAttribute("data-i18n", "admin.promosTitle");
  sectionTitle.textContent = t("admin.promosTitle");

  const listEl = document.createElement("div");
  listEl.className = "admin-brewery-list";

  const formWrap = document.createElement("div");
  formWrap.className = "admin-form-card";

  let editingIndex = null;
  let list = [];

  function promoLabel(p, i) {
    const n = locName(p?.name);
    const r =
      p?.startDate && p?.endDate ? ` · ${p.startDate} → ${p.endDate}` : "";
    return (n || `${t("admin.promoUntitled")} ${i + 1}`) + r;
  }

  function renderList() {
    listEl.replaceChildren();
    list.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "admin-brewery-row";

      const name = document.createElement("span");
      name.className = "admin-brewery-row-name";
      name.textContent = promoLabel(p, i);

      const actions = document.createElement("div");
      actions.className = "admin-brewery-row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "admin-btn-small";
      editBtn.setAttribute("data-i18n", "admin.edit");
      editBtn.textContent = t("admin.edit");
      editBtn.addEventListener("click", () => {
        editingIndex = i;
        fillForm(list[i]);
        idInput.disabled = true;
        formTitle.textContent = t("admin.editPromo");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "admin-btn-small admin-btn-danger";
      delBtn.setAttribute("data-i18n", "admin.remove");
      delBtn.textContent = t("admin.remove");
      delBtn.addEventListener("click", () => {
        if (!window.confirm(t("admin.removePromoConfirm"))) return;
        list.splice(i, 1);
        api.persistPromos(list);
        editingIndex = null;
        idInput.disabled = false;
        clearForm();
        formTitle.textContent = t("admin.addPromo");
        renderList();
      });

      actions.append(editBtn, delBtn);
      row.append(name, actions);
      listEl.appendChild(row);
    });

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.setAttribute("data-i18n", "admin.emptyPromos");
      empty.textContent = t("admin.emptyPromos");
      listEl.appendChild(empty);
    }
  }

  const formTitle = document.createElement("h3");
  formTitle.className = "admin-form-title";
  formTitle.setAttribute("data-i18n", "admin.addPromo");
  formTitle.textContent = t("admin.addPromo");

  const form = document.createElement("form");
  form.className = "admin-brewery-form";

  const idRow = fieldRow("admin.itemId", "ap_id", "text");
  const idInput = idRow.input;
  idInput.placeholder = t("admin.idAutoPlaceholder");

  const nameEs = fieldRow("admin.nameEs", "ap_nameEs", "text");
  const nameEn = fieldRow("admin.nameEn", "ap_nameEn", "text");
  const startRow = fieldRow("admin.promoStart", "ap_start", "date");
  const endRow = fieldRow("admin.promoEnd", "ap_end", "date");
  const descEs = fieldRow("admin.descEs", "ap_descEs", "text", { textarea: true });
  descEs.input.rows = 3;
  const descEn = fieldRow("admin.descEn", "ap_descEn", "text", { textarea: true });
  descEn.input.rows = 3;
  const imageRow = fieldRow("admin.imageUrl", "ap_image", "text");

  const formActions = document.createElement("div");
  formActions.className = "admin-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "admin-btn-primary";
  saveBtn.setAttribute("data-i18n", "admin.save");
  saveBtn.textContent = t("admin.save");

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "admin-btn-ghost";
  cancelBtn.setAttribute("data-i18n", "admin.cancel");
  cancelBtn.textContent = t("admin.cancel");
  cancelBtn.addEventListener("click", () => {
    editingIndex = null;
    idInput.disabled = false;
    clearForm();
    formTitle.textContent = t("admin.addPromo");
  });

  formActions.append(cancelBtn, saveBtn);

  form.append(
    idRow.row,
    nameEs.row,
    nameEn.row,
    startRow.row,
    endRow.row,
    descEs.row,
    descEn.row,
    imageRow.row,
    formActions
  );

  function clearForm() {
    idInput.value = "";
    nameEs.input.value = "";
    nameEn.input.value = "";
    startRow.input.value = "";
    endRow.input.value = "";
    descEs.input.value = "";
    descEn.input.value = "";
    imageRow.input.value = "";
  }

  function fillForm(p) {
    const x = clone(p || emptyPromo());
    idInput.value = x.id ?? "";
    nameEs.input.value = x.name?.es ?? "";
    nameEn.input.value = x.name?.en ?? "";
    startRow.input.value = x.startDate ?? "";
    endRow.input.value = x.endDate ?? "";
    descEs.input.value = x.description?.es ?? "";
    descEn.input.value = x.description?.en ?? "";
    imageRow.input.value = x.image ?? "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!nameEs.input.value.trim()) {
      window.alert(t("admin.nameEsRequired"));
      nameEs.input.focus();
      return;
    }
    const used = new Set(
      list.map((x, idx) => (idx === editingIndex ? null : x.id)).filter(Boolean)
    );
    const parsed = normalizePromoFromForm(
      {
        id: idInput.value,
        nameEs: nameEs.input.value,
        nameEn: nameEn.input.value,
        startDate: startRow.input.value,
        endDate: endRow.input.value,
        descEs: descEs.input.value,
        descEn: descEn.input.value,
        image: imageRow.input.value,
      },
      used
    );
    if (parsed.error) {
      window.alert(parsed.error);
      return;
    }
    const next = parsed.value;
    if (!next.startDate || !next.endDate) {
      window.alert(t("admin.promoDatesRequired"));
      return;
    }
    if (editingIndex !== null) {
      const prevId = list[editingIndex].id;
      list[editingIndex] = { ...next, id: prevId };
    } else {
      list.push(next);
    }
    api.persistPromos(list);
    editingIndex = null;
    idInput.disabled = false;
    clearForm();
    formTitle.textContent = t("admin.addPromo");
    renderList();
  });

  formWrap.append(formTitle, form);
  container.append(sectionTitle, listEl, formWrap);

  api.loadPromosForAdmin().then((data) => {
    list = Array.isArray(data) ? data.map((x) => clone(x)) : [];
    renderList();
  });
}
