const inicio = document.getElementById('inicio');
const base = inicio.querySelector('.g-base');

const mostrar = () => inicio.classList.add('is-ready');
if (base.complete) mostrar();
else base.addEventListener('load', mostrar);

// En Figma el frame es un enlace: al hacer clic se avanza a la siguiente pantalla.
inicio.addEventListener('click', () => {
  irA('bienvenido.html');
});

// ---------- Glitch animado (GSAP) ----------
// Cada tanto hay una ráfaga: los canales rojo y cian se desfasan, el texto tiembla y unas franjas
// horizontales se corren de lado. Entre ráfagas la portada "respira" (CSS) y un barrido de luz baja.
(() => {
  const gsap = window.gsap;
  const reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!gsap || reducido) return;

  const rojo = inicio.querySelector('.g-rojo');
  const cian = inicio.querySelector('.g-cian');
  const contenedor = document.getElementById('franjas');
  const N_FRANJAS = 6;

  // Franjas: copias de la imagen recortadas en una banda horizontal que cambia en cada ráfaga.
  const franjas = Array.from({ length: N_FRANJAS }, () => {
    const f = base.cloneNode();
    f.removeAttribute('alt'); f.setAttribute('aria-hidden', 'true');
    f.className = 'g-img';
    contenedor.appendChild(f);
    return f;
  });

  const azar = (a, b) => a + Math.random() * (b - a);
  const signo = () => (Math.random() < 0.5 ? -1 : 1);

  // Un cuadro de la ráfaga (dura ~50 ms).
  function cuadro(fuerza) {
    const d = azar(6, 22) * fuerza;
    gsap.set(rojo, { x: -d, y: azar(-2, 2), opacity: azar(.55, .9) });
    gsap.set(cian, { x: d, y: azar(-2, 2), opacity: azar(.55, .9) });
    gsap.set(base, { x: signo() * azar(0, 6) * fuerza });
    franjas.forEach((f) => {
      if (Math.random() < 0.35) { gsap.set(f, { opacity: 0 }); return; }
      const arriba = azar(0, 92), alto = azar(2, 14);
      gsap.set(f, {
        opacity: 1,
        clipPath: `inset(${arriba}% 0 ${Math.max(0, 100 - arriba - alto)}% 0)`,
        x: signo() * azar(15, 90) * fuerza,
      });
    });
  }

  function limpiar() {
    gsap.set([rojo, cian], { opacity: 0, x: 0, y: 0 });
    gsap.set(base, { x: 0 });
    gsap.set(franjas, { opacity: 0, x: 0 });
  }

  function rafaga() {
    const fuerza = Math.random() < 0.25 ? 1.8 : 1;       // de vez en cuando, una más violenta
    const cuadros = Math.round(azar(4, 9));
    const tl = gsap.timeline({ onComplete: () => { limpiar(); gsap.delayedCall(azar(0.7, 2.4), rafaga); } });
    for (let i = 0; i < cuadros; i++) tl.call(() => cuadro(fuerza), null, i * azar(0.04, 0.07));
  }

  limpiar();
  gsap.delayedCall(1.2, rafaga);   // la primera ráfaga llega cuando ya se vio la portada
})();
