// Navegación entre secciones
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

// Mostrar detalle de vinícola
function showDetail(name) {
    document.getElementById('detail-title').innerText = name;
    document.getElementById('detail-desc').innerText = "Esta es la información detallada de " + name + ". Aquí podrías poner fotos, horarios y contactos.";
    showPage('detail');
}

// Lógica de PWA (Lo que ya tenías)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-banner').style.display = 'block';
});