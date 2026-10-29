const stage = document.getElementById('stage');
const ANCHO = 1920;
const ALTO = 1080;

// Escala el lienzo 1920x1080 para que entre en la ventana y lo centra.
function ajustar() {
  const escala = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO);
  const x = (window.innerWidth - ANCHO * escala) / 2;
  const y = (window.innerHeight - ALTO * escala) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
}
window.addEventListener('resize', ajustar);
ajustar();
