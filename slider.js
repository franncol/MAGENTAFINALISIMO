// Slider de volumen compartido por las pantallas de "¿Cómo interactúa?".
// La posición del pulgar indica en qué pantalla estás; al soltarlo en otra marca se navega a esa pantalla.
(() => {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  const ANCHO = 1187; // ancho de la pista en el diseño
  const PASOS = [
    { x: 199, href: 'interactua-tocar.html' },
    { x: 351, href: 'interactua-transformar.html' },
    { x: 478, href: 'interactua-generar.html' },
    { x: 599, href: 'apps-continue.html' },
    { x: 732, href: 'apps-generate.html' },
    { x: 846, href: 'apps-interpolacion.html' },
    { x: 970, href: 'apps-temperatura.html' },
    { x: 1101, href: 'ahora-te-toca.html' },
    { x: 1162, href: 'piano-genie.html' }, // final de la pista = siguiente
  ];
  const actual = Number(slider.dataset.paso);

  const crear = (clase, padre = slider) => {
    const el = document.createElement('div');
    el.className = clase;
    padre.appendChild(el);
    return el;
  };

  const pista = crear('slider__pista');
  const relleno = crear('slider__relleno', pista);
  const marcas = PASOS.slice(1, -1).map((p) => {
    const m = crear('slider__marca');
    m.style.left = `${p.x}px`;
    return m;
  });
  const pulgar = crear('slider__pulgar');
  pulgar.tabIndex = 0;
  pulgar.setAttribute('role', 'slider');
  pulgar.setAttribute('aria-label', 'Volumen');
  pulgar.setAttribute('aria-valuemin', '1');
  pulgar.setAttribute('aria-valuemax', String(PASOS.length));
  pulgar.setAttribute('aria-valuenow', String(actual + 1));

  const colocar = (x) => {
    pulgar.style.left = `${x}px`;
    relleno.style.width = `${x}px`;
    marcas.forEach((m, i) => m.classList.toggle('pasada', PASOS[i + 1].x <= x));
  };
  colocar(PASOS[actual].x);

  const ir = (i) => {
    if (i < 0 || i >= PASOS.length || i === actual) return;
    irA(PASOS[i].href);
  };

  const masCercano = (x) =>
    PASOS.reduce((mejor, p, i) => (Math.abs(p.x - x) < Math.abs(PASOS[mejor].x - x) ? i : mejor), 0);

  const posicion = (e) => {
    const r = slider.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * ANCHO;
    return Math.min(PASOS[PASOS.length - 1].x, Math.max(PASOS[0].x, x));
  };

  let arrastrando = false;
  const soltar = (e) => {
    if (!arrastrando) return;
    arrastrando = false;
    const destino = masCercano(posicion(e));
    slider.classList.add('slider--anima');
    colocar(PASOS[destino].x);
    if (destino !== actual) setTimeout(() => ir(destino), 250);
  };

  slider.addEventListener('pointerdown', (e) => {
    arrastrando = true;
    slider.setPointerCapture(e.pointerId);
    slider.classList.remove('slider--anima');
    colocar(posicion(e));
  });
  slider.addEventListener('pointermove', (e) => { if (arrastrando) colocar(posicion(e)); });
  slider.addEventListener('pointerup', soltar);
  slider.addEventListener('pointercancel', soltar);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') ir(actual + 1);
    if (e.key === 'ArrowLeft') ir(actual - 1);
  });
})();
