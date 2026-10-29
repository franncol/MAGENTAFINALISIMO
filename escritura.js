/*
  ESCRITURA GLITCH — los textos marcados con data-escribe se "tipean" letra por letra (como en Undertale),
  y las últimas letras escritas tiemblan con un glitch RGB que se calma al instante (siempre legible).

  Usa GSAP (cdnjs) para el tiempo y la secuencia. Se carga al final de la pantalla, después de stage.js:
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
    <script src="escritura.js"></script>

  · Marcar un texto:           <h1 data-escribe>…</h1>   (los textos se escriben uno tras otro, en orden)
  · Velocidad (ms por letra):  data-escribe="22"          (por defecto 16)
  · El texto completo ocupa su lugar desde el primer cuadro (las letras que faltan están invisibles),
    así que nada se corre ni se reacomoda mientras se escribe.
*/
(() => {
  'use strict';
  const gsap = window.gsap;
  const reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elementos = [...document.querySelectorAll('[data-escribe]')];
  if (!gsap || reducido || !elementos.length) return;

  const COLA = 5;           // cuántas letras recién escritas tienen el glitch
  const PAUSA = 0.12;       // pausa (s) entre un texto y el siguiente
  const ARRANQUE = 0.35;    // espera (s) desde que la pantalla ya se está mostrando

  // Cada nodo de texto se reemplaza por 3 spans: [ya escrito][glitch][todavía invisible].
  function preparar(el) {
    const trozos = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    nodos.forEach((nodo) => {
      const texto = nodo.nodeValue;
      if (!texto.trim()) return;
      const hecho = document.createElement('span');
      const cola = document.createElement('span');
      const resto = document.createElement('span');
      cola.className = 'esc-glitch';
      resto.className = 'esc-oculto';
      resto.textContent = texto;
      const frag = document.createDocumentFragment();
      frag.append(hecho, cola, resto);
      nodo.replaceWith(frag);
      trozos.push({ texto, hecho, cola, resto, inicio: 0 });
    });
    let total = 0;
    trozos.forEach((t) => { t.inicio = total; total += t.texto.length; });
    return { trozos, total };
  }

  // Las letras más nuevas son casi siempre símbolos; las más viejas se van pareciendo a la letra real.
  const SIMBOLOS = '#$%&@§¤¦×÷±█▓▒░▌▐<>/\\|=+*?0123456789ABCDEFGHJKLMNPRSTUVXYZ';
  const azar = () => SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
  const glitchear = (s) => [...s].map((c, i) => {
    if (c === ' ') return c;
    const edad = s.length - 1 - i;                 // 0 = la última escrita
    return Math.random() < 1 - edad * 0.22 ? azar() : c;
  }).join('');

  function pintar({ trozos, total }, n) {
    const fin = n >= total;   // al terminar, el texto queda limpio: el glitch es solo mientras se escribe
    trozos.forEach((t) => {
      const local = Math.max(0, Math.min(t.texto.length, n - t.inicio));
      // el glitch cubre solo las últimas letras escritas del texto entero (no la cola de cada trozo)
      const corte = fin ? local : Math.max(0, Math.min(t.texto.length, n - COLA - t.inicio));
      t.hecho.textContent = t.texto.slice(0, corte);
      const cola = t.texto.slice(corte, local);
      t.cola.textContent = cola;               // las letras reales fijan el ancho (nada se corre)
      t.cola.dataset.g = fin ? '' : glitchear(cola);   // lo que se ve: símbolos que se resuelven en la letra
      t.resto.textContent = t.texto.slice(local);
    });
  }

  const listas = elementos.map((el) => {
    const datos = preparar(el);
    datos.ms = parseFloat(el.dataset.escribe) || 16;
    return datos;
  });

  const linea = gsap.timeline({ paused: true });
  let ultimo = 0;
  let t0 = ARRANQUE;
  listas.forEach((d) => {
    const prog = { n: 0 };
    const dur = (d.total * d.ms) / 1000;
    linea.to(prog, {
      n: d.total, duration: dur, ease: 'none',
      onUpdate: () => {
        // se repinta cada ~50 ms para que los símbolos parpadeen aunque no entre una letra nueva
        const ahora = performance.now();
        if (ahora - ultimo < 50 && Math.floor(prog.n) === d.ultimaN) return;
        ultimo = ahora; d.ultimaN = Math.floor(prog.n);
        pintar(d, d.ultimaN);
      },
      onComplete: () => pintar(d, d.total),
    }, t0);
    t0 += dur + PAUSA;
  });

  // Arranca cuando la pantalla ya se está mostrando (después del barrido o del flotado de entrada).
  const H = document.documentElement;
  const arrancar = () => linea.play();
  if (H.classList.contains('tr-play')) arrancar();
  else {
    const ob = new MutationObserver(() => {
      if (H.classList.contains('tr-play')) { ob.disconnect(); arrancar(); }
    });
    ob.observe(H, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { ob.disconnect(); if (linea.paused()) arrancar(); }, 3000);
  }
})();
