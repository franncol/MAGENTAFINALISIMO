/*
  TRANSICIONES — "Frecuencia Futura"
  ------------------------------------------------------------------
  Cada pantalla es un HTML distinto. Para que el cambio no parezca "una página nueva":

    · DENTRO DE UN NÚCLEO ('interno'): no hay capa ni corte. Lo que cambia flota hacia afuera, y en la
      pantalla nueva los elementos flotan hacia adentro y se acomodan. Lo que es igual en las dos
      pantallas (fondo, títulos, y en el núcleo 2 las tabs laterales) NO se mueve. Las tabs del núcleo 2
      se agrandan / achican para marcar cuál está seleccionada.

    · TUTORIAL Y UMBRALES ('barrido'): una banda diagonal cruza la pantalla y descubre la siguiente.
      Es SIEMPRE la misma animación; solo cambia el color de la banda según el núcleo.

  Quedan disponibles (pero sin usar por defecto) 'pixel', 'onda' y 'zoom': irA(url, 'pixel').

  Se carga en el <head> de TODAS las pantallas. Define window.irA(url, tipo?); los links <a> comunes
  se interceptan solos.
*/
(() => {
  'use strict';
  const D = document;
  const H = D.documentElement;
  if (window.irA) return;

  // ===================== AJUSTES =====================
  const FONDO = '#002037';
  const ROSA = '#ff3dbf', AZUL = '#4f7bff', CIAN = '#60f2ff', LILA = '#d49dde';

  const DUR = { barrido: 300, onda: 420, zoom: 380, interno: 150 };          // salida (ms)
  const DUR_ENTRADA = { barrido: 380, onda: 650, zoom: 600 };                // entrada (ms)
  const ESPERA_MAX = 1200;     // máximo que se espera a que cargue la pantalla nueva antes de descubrirla
  const PIXEL = { cols: 16, rows: 9, barrido: 170, azar: 90, dur: 150 };     // (opcional, sin uso por defecto)

  // Pantallas "de tutorial / umbral": cualquier cambio que las toque usa el barrido diagonal.
  const TUTORIAL = new Set([
    'index', 'bienvenido', 'equipo-jacks', 'equipo-perilla', 'equipo-slider', 'equipo-botones',
    'como-funciona', 'progreso', 'como-interactua', 'progreso-2', 'ponete-a-prueba', 'cierre-2',
  ]);

  // Pantallas del tutorial propiamente dicho: entre ellas el cambio es el flotado común; el barrido
  // queda para entrar al tutorial (desde el inicio) y para salir hacia "¿Cómo funciona la IA?".
  const PANTALLAS_TUTORIAL = new Set(['bienvenido', 'equipo-jacks', 'equipo-perilla', 'equipo-slider', 'equipo-botones']);

  // A qué núcleo pertenece cada pantalla (define el color de la banda y qué cambios son "internos").
  const NUCLEOS = {
    tutorial: { color: [ROSA, AZUL], pantallas: ['index', 'bienvenido', 'equipo-jacks', 'equipo-perilla', 'equipo-slider', 'equipo-botones'] },
    n1: { color: [LILA, ROSA], pantallas: ['como-funciona', 'n1-magenta', 'modelo', 'canales-midi', 'canales-audio', 'canales-texto', 'motor', 'grafico', 'progreso'] },
    n2: { color: [AZUL, CIAN], pantallas: ['como-interactua', 'interactua-tocar', 'interactua-transformar', 'interactua-generar',
      'apps-continue', 'apps-generate', 'apps-interpolacion', 'apps-temperatura', 'genie-info', 'ai-duet', 'ahora-te-toca', 'piano-genie', 'progreso-2'] },
    n3: { color: [ROSA, LILA], pantallas: ['ponete-a-prueba', 'magenta-practica-1', 'magenta-practica-2', 'quiz-aviso', 'quiz-intro', 'quiz', 'cierre-1', 'cierre-2'] },
  };
  const nucleoDe = (n) => Object.keys(NUCLEOS).find((k) => NUCLEOS[k].pantallas.includes(n)) || 'tutorial';

  // Elementos que, si están en las dos pantallas con la misma estructura, se quedan quietos (sin animar).
  const FIJOS_SIEMPRE = ['.n2-nav', '.pestanas'];

  const reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CLAVE = 'magenta-transicion';

  // ===================== BASE =====================
  const nombre = (url) => new URL(url, location.href).pathname.split('/').pop().replace(/\.html$/i, '') || 'index';
  const el = (clase, tag = 'div') => { const e = D.createElement(tag); e.className = clase; return e; };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const anima = (nodo, frames, opciones) => (nodo.animate ? nodo.animate(frames, opciones) : { finished: Promise.resolve() });
  const estilo = (css) => { const s = D.createElement('style'); s.textContent = css; (D.head || H).appendChild(s); };

  // ===================== LEER LO PENDIENTE (viene de la pantalla anterior) =====================
  let pendiente = null;
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    sessionStorage.removeItem(CLAVE);
    const p = crudo && JSON.parse(crudo);
    if (p && Date.now() - p.t < 8000) pendiente = p;
  } catch (e) { /* nada */ }
  const interno = !!(pendiente && pendiente.tipo === 'interno' && !reducido);

  // Pantallas del tutorial: entran solo con el flotado común (sin animaciones propias de cada elemento).
  if (PANTALLAS_TUTORIAL.has(nombre(location.href))) H.classList.add('tr-tutorial');

  // El fondo oscuro desde el primer instante evita el destello blanco entre pantallas.
  estilo(`html{background:${FONDO}}` + (interno ? '' : 'html.tr-pre body{visibility:hidden}'));

  if (interno) {
    // Pantalla del mismo núcleo: se anima ya desde el primer cuadro (sin capa ni espera).
    H.classList.add('tr-interno', 'tr-play');
    const f = pendiente.fijos || { diseno: [], stage: [], sel: [] };
    const lista = (base, arr) => arr.map((k) => `${base} > :nth-child(${k})`);
    const fijos = [...lista('.diseno', f.diseno), ...lista('.stage', f.stage), ...(f.sel || []).map((s) => `.diseno > ${s}`)];
    if (fijos.length) {
      const sel = fijos.map((s) => `html.tr-interno ${s}`);
      estilo(`${sel.join(',')},${sel.map((s) => s + ' *').join(',')}{animation:none!important}`);
    }
    const stageFijos = f.stage.map((k) => `:nth-child(${k})`).join(',');
    estilo(`html.tr-interno .stage > :not(.diseno)${stageFijos ? `:not(:is(${stageFijos}))` : ''}{animation:tr-fondo-suave .35s ease backwards}`);
  } else {
    H.classList.add('tr-pre');
  }

  // ===================== CAPAS (barrido y opcionales) =====================
  function capaBarrido(estado, nucleo) {
    const [c1, c2] = NUCLEOS[nucleo].color;
    const c = el('tr tr-barrido-cont');
    c.style.setProperty('--ac', c1);
    c.style.setProperty('--ac2', c2);
    const p = el('tr-barrido');
    p.style.transform = estado === 'cubierto' ? 'translateX(0) skewX(-14deg)' : 'translateX(-115%) skewX(-14deg)';
    c.appendChild(p);
    c.panelEl = p;
    return c;
  }

  function capaPixel(estado) {
    const c = el('tr tr-px ' + estado);
    c.style.setProperty('--cols', PIXEL.cols);
    c.style.setProperty('--rows', PIXEL.rows);
    const fondos = [FONDO, FONDO, FONDO, '#012a47', '#00304f'], acentos = [ROSA, AZUL, CIAN];
    for (let r = 0; r < PIXEL.rows; r++) {
      for (let k = 0; k < PIXEL.cols; k++) {
        const b = el('', 'i');
        const diag = (k + r) / (PIXEL.cols + PIXEL.rows - 2);
        b.style.setProperty('--d', `${Math.round(diag * PIXEL.barrido + Math.random() * PIXEL.azar)}ms`);
        b.style.setProperty('--bg', fondos[Math.floor(Math.random() * fondos.length)]);
        if (Math.random() < 0.13) b.style.setProperty('--ac', acentos[Math.floor(Math.random() * acentos.length)]);
        c.appendChild(b);
      }
    }
    return c;
  }
  const tiempoPixel = PIXEL.barrido + PIXEL.azar + PIXEL.dur + 40;

  function capaOnda(estado) {
    const c = el('tr tr-onda');
    const disco = el('tr-disco');
    disco.style.clipPath = estado === 'cubierto' ? 'circle(75% at 50% 50%)' : 'circle(0% at 50% 50%)';
    c.appendChild(disco);
    c.discoEl = disco;
    return c;
  }
  function anillos(contenedor, colores = [ROSA, AZUL, CIAN]) {
    colores.forEach((color, i) => {
      const a = el('tr-anillo');
      a.style.borderColor = color;
      a.style.boxShadow = `0 0 24px ${color}, inset 0 0 24px ${color}`;
      contenedor.appendChild(a);
      anima(a, [{ transform: 'scale(.05)', opacity: 0.95 }, { transform: 'scale(9)', opacity: 0 }],
        { duration: 900, delay: i * 100, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'both' });
    });
  }

  const FLASH_ZOOM = `radial-gradient(circle, #592a67 0%, ${FONDO} 70%)`;
  function capaZoom(estado) {
    const c = el('tr tr-zoom');
    c.style.background = FLASH_ZOOM;
    c.style.opacity = estado === 'cubierto' ? '1' : '0';
    return c;
  }

  // ===================== SALIR =====================
  let navegando = false;
  const guardar = (datos) => { try { sessionStorage.setItem(CLAVE, JSON.stringify(Object.assign({ t: Date.now() }, datos))); } catch (e) { /* nada */ } };
  const irYa = (url, ms) => setTimeout(() => location.assign(url), reducido ? 0 : ms);

  // --- interno: lo que cambia flota hacia afuera, lo que se repite se queda ---
  const hijosDiseno = (doc) => [...doc.querySelectorAll('.diseno > *')];
  const hijosStage = (doc) => [...doc.querySelectorAll('.stage > *')];
  const firma = (n) => [
    n.tagName, n.className, n.getAttribute('style') || '',
    (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    [...n.querySelectorAll('img')].map((i) => i.getAttribute('src')).join(','),
  ].join('|');

  async function analizarDestino(url) {
    try {
      const r = await Promise.race([fetch(url, { cache: 'force-cache' }), esperar(350).then(() => null)]);
      if (!r || !r.ok) return null;
      return new DOMParser().parseFromString(await r.text(), 'text/html');
    } catch (e) { return null; }   // p. ej. abierto como archivo (file://): sin análisis, se anima todo
  }

  const estructuraIgual = (a, b) => !!a && !!b && a.children.length === b.children.length;

  async function salirInterno(url, desde, aQue) {
    // En el tutorial todo flota: nada se queda quieto.
    const todoFlota = PANTALLAS_TUTORIAL.has(desde) && PANTALLAS_TUTORIAL.has(aQue);
    const doc = todoFlota ? null : await analizarDestino(url);
    const actualesD = hijosDiseno(D);
    const fijos = { diseno: [], stage: [], sel: [] };
    const quietos = new Set();

    if (doc) {
      const firmasActuales = new Set([...actualesD, ...hijosStage(D)].map(firma));
      hijosDiseno(doc).forEach((n, i) => { if (firmasActuales.has(firma(n))) fijos.diseno.push(i + 1); });
      const stageDoc = [...doc.querySelectorAll('.stage')][0];
      if (stageDoc) [...stageDoc.children].forEach((n, i) => { if (!n.classList.contains('diseno') && firmasActuales.has(firma(n))) fijos.stage.push(i + 1); });
      // las tabs (menú vertical del núcleo 2, pestañas de canales): quietas si tienen la misma estructura
      FIJOS_SIEMPRE.forEach((s) => {
        const a = D.querySelector('.diseno > ' + s), b = doc.querySelector('.diseno > ' + s);
        if (estructuraIgual(a, b)) {
          const k = hijosDiseno(doc).indexOf(b) + 1;
          if (k && !fijos.diseno.includes(k)) fijos.diseno.push(k);
          quietos.add(a);
        }
      });
      const firmasDestino = new Set([...hijosDiseno(doc), ...(stageDoc ? [...stageDoc.children] : [])].map(firma));
      actualesD.forEach((n) => { if (firmasDestino.has(firma(n))) quietos.add(n); });
    } else if (!todoFlota) {
      // sin análisis: igual dejamos quietas las tabs si es el mismo menú
      FIJOS_SIEMPRE.forEach((s) => { if (D.querySelector('.diseno > ' + s) && mismaFamilia(desde, aQue)) { fijos.sel.push(s); quietos.add(D.querySelector('.diseno > ' + s)); } });
    }

    // geometría de las tabs, para que en la pantalla nueva se agranden / achiquen en vez de saltar
    const nav = D.querySelector('.n2-nav');
    const geo = nav ? [...nav.children].map((c) => { const cs = getComputedStyle(c); return { top: parseFloat(cs.top) || 0, height: parseFloat(cs.height) || 0 }; }) : null;

    // lo que cambia flota hacia arriba y se desvanece
    actualesD.forEach((n) => {
      if (quietos.has(n)) return;
      // los títulos solo se funden: no se desplazan
      const esTitulo = !todoFlota && n.matches('h1, h2, [class*="titulo"]');
      anima(n, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: esTitulo ? '0 0' : '0 -16px' }], { duration: DUR.interno, easing: 'ease-in', fill: 'forwards' });
    });

    guardar({ tipo: 'interno', fijos, geo });
    irYa(url, DUR.interno);
  }
  const mismaFamilia = (a, b) => {
    const f = (n) => (/^(interactua|apps)-/.test(n) ? 'menu2' : /^canales-/.test(n) ? 'canales' : null);
    return f(a) && f(a) === f(b);
  };

  function salir(tipo, url, nucleo) {
    const cuerpoActual = D.body || H;
    let dur = 0;
    if (tipo === 'barrido') {
      const c = capaBarrido('abierto', nucleo);
      H.appendChild(c);
      anima(c.panelEl, [{ transform: 'translateX(-115%) skewX(-14deg)' }, { transform: 'translateX(0) skewX(-14deg)' }],
        { duration: DUR.barrido, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      dur = DUR.barrido;
    } else if (tipo === 'pixel') {
      H.appendChild(capaPixel('cubre'));
      dur = tiempoPixel;
    } else if (tipo === 'onda') {
      const c = capaOnda('abierto');
      H.appendChild(c);
      anillos(c);
      anima(c.discoEl, [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }],
        { duration: DUR.onda, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
      dur = DUR.onda;
    } else if (tipo === 'zoom') {
      const c = capaZoom('abierto');
      H.appendChild(c);
      anima(c, [{ opacity: 0 }, { opacity: 1 }], { duration: DUR.zoom, easing: 'ease-in', fill: 'forwards' });
      anima(cuerpoActual, [{ transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 }, { transform: 'scale(1.4)', filter: 'blur(10px)', opacity: 0.2 }],
        { duration: DUR.zoom, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards' });
      dur = DUR.zoom;
    }
    guardar({ tipo, nucleo });
    irYa(url, dur);
  }

  window.irA = function irA(url, tipoForzado) {
    if (navegando || !url) return;
    const destino = new URL(url, location.href);
    navegando = true;
    const aQue = nombre(destino.href), desde = nombre(location.href);
    if (reducido) { location.assign(destino.href); return; }
    let tipo = tipoForzado;
    if (!tipo) {
      if (PANTALLAS_TUTORIAL.has(desde) && PANTALLAS_TUTORIAL.has(aQue)) tipo = 'interno';
      else if (TUTORIAL.has(desde) || TUTORIAL.has(aQue)) tipo = 'barrido';
      else tipo = nucleoDe(desde) === nucleoDe(aQue) ? 'interno' : 'barrido';
    }
    if (tipo === 'interno') salirInterno(destino.href, desde, aQue);
    else salir(tipo, destino.href, nucleoDe(aQue));
  };

  // Links comunes: se intercepta el clic y se navega con transición.
  D.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\.html?$|\/$/i.test(u.pathname)) return;
    e.preventDefault();
    window.irA(a.href);
  }, true);

  // ===================== ENTRAR =====================
  let tapa = null;
  if (pendiente && !interno && !reducido) {
    const t = pendiente.tipo;
    tapa = t === 'pixel' ? capaPixel('cubierto') : t === 'onda' ? capaOnda('cubierto') : t === 'zoom' ? capaZoom('cubierto') : capaBarrido('cubierto', pendiente.nucleo || nucleoDe(nombre(location.href)));
    H.appendChild(tapa);
  }

  function listo() {
    const cargada = new Promise((res) => {
      if (D.readyState === 'complete') res(); else window.addEventListener('load', res, { once: true });
    });
    const fuentes = D.fonts && D.fonts.ready ? D.fonts.ready : Promise.resolve();
    return Promise.race([Promise.all([cargada, fuentes]), esperar(ESPERA_MAX)]);
  }

  function limpiar() {
    if (tapa && tapa.parentNode) tapa.parentNode.removeChild(tapa);
    tapa = null;
  }

  function revelar() {
    H.classList.remove('tr-pre');
    H.classList.add('tr-play');            // arranca la coreografía de entrada de la pantalla (transicion.css)
    if (!tapa) return;
    const t = pendiente.tipo;
    const cuerpo = D.body;
    if (t === 'pixel') {
      tapa.classList.remove('cubierto');
      tapa.classList.add('revela');
      setTimeout(limpiar, tiempoPixel + 60);
    } else if (t === 'onda') {
      anima(cuerpo, [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }],
        { duration: DUR_ENTRADA.onda, easing: 'cubic-bezier(.2,.7,.2,1)' });
      limpiar();
      const c = el('tr tr-onda');
      H.appendChild(c);
      anillos(c);
      setTimeout(() => c.remove(), 1300);
    } else if (t === 'zoom') {
      anima(cuerpo, [{ transform: 'scale(.72)', filter: 'blur(14px)', opacity: 0 }, { transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 }],
        { duration: DUR_ENTRADA.zoom, easing: 'cubic-bezier(.16,1,.3,1)' });
      anima(tapa, [{ opacity: 1 }, { opacity: 0 }], { duration: DUR_ENTRADA.zoom, easing: 'ease-out', fill: 'forwards' });
      setTimeout(limpiar, DUR_ENTRADA.zoom + 60);
    } else {
      anima(tapa.panelEl, [{ transform: 'translateX(0) skewX(-14deg)' }, { transform: 'translateX(115%) skewX(-14deg)' }],
        { duration: DUR_ENTRADA.barrido, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      setTimeout(limpiar, DUR_ENTRADA.barrido + 60);
    }
  }

  // Tabs del núcleo 2: la seleccionada se agranda y la anterior se achica (en vez de saltar).
  function acomodarTabs() {
    const geo = pendiente && pendiente.geo;
    const nav = D.querySelector('.n2-nav');
    if (!geo || !nav || nav.children.length !== geo.length) return;
    [...nav.children].forEach((c, i) => {
      const cs = getComputedStyle(c);
      const ahora = { top: parseFloat(cs.top) || 0, height: parseFloat(cs.height) || 0 };
      const antes = geo[i];
      if (antes.top === ahora.top && antes.height === ahora.height) return;
      anima(c, [{ top: antes.top + 'px', height: antes.height + 'px' }, { top: ahora.top + 'px', height: ahora.height + 'px' }],
        { duration: 340, easing: 'cubic-bezier(.2,.9,.2,1)' });
    });
    nav.querySelectorAll('.n2-nav__item.on').forEach((c) => {
      anima(c, [{ scale: 0.93, filter: 'brightness(1.5)' }, { scale: 1, filter: 'brightness(1)' }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    });
  }

  if (interno) {
    if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', acomodarTabs, { once: true });
    else acomodarTabs();
  } else {
    listo().then(() => requestAnimationFrame(() => requestAnimationFrame(revelar)));
  }

  // Botón "atrás" del navegador (la página vuelve de la caché ya cargada): dejar todo limpio.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    navegando = false;
    D.querySelectorAll('.tr').forEach((n) => n.remove());
    D.body.getAnimations && D.body.getAnimations().forEach((a) => a.cancel());
    H.classList.remove('tr-pre');
    H.classList.add('tr-play');
  });
})();
