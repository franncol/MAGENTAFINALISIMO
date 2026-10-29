/*
  CONSOLA (pantallas) — traduce lo que hace el tablero (Arduino) en acciones de ESTA pantalla.

  Se incluye en todas las pantallas. Si la pantalla se abre sola (sin consola.html) no hace nada, así que el
  mouse y el teclado siguen funcionando igual que siempre.

  Tablero: 1 perilla infinita, 1 deslizante vertical, 6 botones arcade (después 8) y 1 jack con 1 cable.
  Mensajes del Arduino:  JACK:1 / JACK:0   PERILLA:DER / PERILLA:IZQ / PERILLA:CLICK (apretada)   FADER:0-100   BOTON_ON:n / BOTON_OFF:n

  Abajo, en REGLAS, hay una línea por pantalla que dice qué la hace avanzar. "Avanzar" va siempre al destino de la
  píldora de esa pantalla, así que si cambiás un destino en el HTML, el tablero lo sigue.
*/
(() => {
  'use strict';
  if (window.parent === window) return;

  // ===================== AJUSTES =====================
  const CANT_BOTONES = 6;            // botones conectados (cuando pongas 8, cambialo a 8 acá y en el .ino)
  const CLICKS_PERILLA = 1;          // "toc" de la perilla (un paso) para pasar de pantalla
  const PAUSA_GIRO_MS = 380;         // tiempo mínimo entre dos pasos de perilla (evita saltear pantallas al girar rápido)
  const PAUSA_TABS_MS = 200;          // lo mismo, pero entre pestañas (ir y volver tiene que responder rápido)
  const CLICKS_TUTORIAL = 1;         // "girala un poco" en el tutorial de la perilla (o apretarla)
  const VIAJE_TUTORIAL = 90;         // "movelo un rato": recorrido total del deslizante (0-100) en el tutorial
  const VIAJE_CONTINUAR = 70;        // recorrido del deslizante para "deslizá para continuar"
  const PULSACIONES_PADS = 4;        // tutorial de los botones: cuántas pulsaciones (cualquiera) hacen falta
  const PAUSA_PADS_MS = 350;         // ...y cuánto espera después de la última
  const ESPERA_ZONA_MS = 220;        // en las tabs: el deslizante tiene que quedarse quieto este tiempo para cambiar de tab
  const HISTERESIS = 2;              // en las tabs / gráfico: margen (en puntos) para que no "tiemble" en el borde de una zona
  const BANDA_MUERTA = 3;           // el deslizante solo cuenta recorrido si se movió al menos esto (ignora temblor/ruido)
  const HISTERESIS_TABS = 5;         // margen extra en el borde entre tabs (evita el parpadeo al frenar justo en el límite)
  const MOVIMIENTO_MIN = 6;          // cuánto hay que mover el deslizante, desde que se abre la pantalla, para que empiece a mandar
  const GRACIA_MS = 500;             // al abrir una pantalla se ignoran los eventos un instante (evita saltos dobles)
  const BOTONES_PIANO = CANT_BOTONES;

  // ===================== REGLAS POR PANTALLA =====================
  //  tipo:  inicio | cable | cableFuera | perillaPoco | deslizantePoco | botones4 | perilla | grafico | tabs | pads | piano | practica1 | quiz | nada
  //  leds:  qué LEDs invitan a actuar (T = titila, 1 = fijo)
  const REGLAS = {
    'index':                { tipo: 'inicio', leds: { PIANO: 'T' } },
    'bienvenido':           { tipo: 'nada' },                                           // pasa sola (ver bienvenido.html)
    'equipo-jacks':         { tipo: 'cable', leds: { JACK: 'T' } },
    'equipo-perilla':       { tipo: 'perillaPoco', leds: { PERILLA: 'T' } },
    'equipo-slider':        { tipo: 'deslizantePoco', viaje: VIAJE_TUTORIAL, leds: { SLIDER: 'T' } },
    'equipo-botones':       { tipo: 'botones4', leds: { PIANO: 'T' } },

    // Núcleo 1: la perilla recorre las pantallas (derecha = seguir, izquierda = volver)
    'como-funciona':        { tipo: 'perilla', atras: 'equipo-botones.html', leds: { PERILLA: 'T' } },
    'n1-magenta':           { tipo: 'perilla', atras: 'como-funciona.html', leds: { PERILLA: 'T' } },
    'modelo':               { tipo: 'perilla', atras: 'n1-magenta.html', leds: { PERILLA: 'T' } },
    'canales-midi':         { tipo: 'tabs' },
    'canales-audio':        { tipo: 'tabs' },
    'canales-texto':        { tipo: 'tabs' },
    'motor':                { tipo: 'perilla', atras: 'canales-texto.html', leds: { PERILLA: 'T' } },
    'grafico':              { tipo: 'grafico', atras: 'motor.html', leds: { SLIDER: 'T', PERILLA: 'T' } },
    'progreso':             { tipo: 'cable', atras: 'grafico.html', leds: { JACK: 'T', PERILLA: 'T' } },

    // Núcleo 2: el deslizante cambia de tab; la perilla pasa de grupo de tabs cuando se vieron todas
    'como-interactua':      { tipo: 'deslizantePoco', viaje: VIAJE_CONTINUAR, leds: { SLIDER: 'T' } },
    'interactua-tocar':     { tipo: 'tabs' },
    'interactua-transformar': { tipo: 'tabs' },
    'interactua-generar':   { tipo: 'tabs' },
    'apps-continue':        { tipo: 'tabs' },
    'apps-generate':        { tipo: 'tabs' },
    'apps-interpolacion':   { tipo: 'tabs' },
    'apps-temperatura':     { tipo: 'tabs' },
    'genie-info':           { tipo: 'perilla', atras: 'apps-temperatura.html', leds: { PERILLA: 'T' } },
    'ai-duet':              { tipo: 'perilla', atras: 'genie-info.html', leds: { PERILLA: 'T' } },
    'ahora-te-toca':        { tipo: 'perilla', atras: 'ai-duet.html', leds: { PERILLA: 'T' } },
    'piano-genie':          { tipo: 'piano', sig: 'progreso-2.html', atras: 'ahora-te-toca.html', leds: { PIANO: 'T', PERILLA: 'T' } },                    // la propia pantalla avanza sola después de la primera nota
    'progreso-2':           { tipo: 'cable', leds: { JACK: 'T' } },

    // Núcleo 3
    // Núcleo 3: todo con los pads
    'ponete-a-prueba':      { tipo: 'pads', leds: { PIANO: 'T' } },
    'magenta-practica-1':   { tipo: 'practica1', leds: { PIANO: 'T' } },
    'magenta-practica-2':   { tipo: 'pads', leds: { PIANO: 'T' } },
    'quiz-aviso':           { tipo: 'pads', leds: { PIANO: 'T' } },
    'quiz-intro':           { tipo: 'pads', leds: { PIANO: 'T' } },
    'quiz':                 { tipo: 'quiz', leds: { PIANO: 'T' } },   // pads 1-4 eligen; después cualquier pad sigue
    'cierre-1':             { tipo: 'nada' },                                           // pasa sola (ver cierre-1.html)
    'cierre-2':             { tipo: 'cableFuera', leds: { JACK: 'T' } },
  };

  // Grupos de tabs del núcleo 2: hay que ver todas las tabs del grupo para poder pasar al siguiente.
  const GRUPOS = [
    { paginas: ['canales-midi', 'canales-audio', 'canales-texto'], siguiente: 'motor.html', atras: 'modelo.html', perilla: true },
    { paginas: ['interactua-tocar', 'interactua-transformar', 'interactua-generar'], siguiente: 'apps-continue.html' },
    { paginas: ['apps-continue', 'apps-generate', 'apps-interpolacion', 'apps-temperatura'], siguiente: 'genie-info.html' },
  ];

  // ===================== BASE =====================
  let pagina = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index';
  const regla = Object.assign({}, REGLAS[pagina]);
  const nacio = performance.now();
  const enGracia = () => performance.now() - nacio < GRACIA_MS;

  const enviar = (msg) => window.parent.postMessage(Object.assign({ fuente: 'pagina' }, msg), '*');
  const ir = (url) => {
    if (!url || navegando) return;
    url = segunSlider(url);
    navegando = true;
    if (window.irA) window.irA(url); else location.href = new URL(url, location.href).href;
  };
  let navegando = false;
  // Al entrar a un grupo de tabs, abrir directamente la tab que le toca a la posición actual del deslizante.
  function segunSlider(url) {
    const g = GRUPOS.find((x) => !x.perilla && url.split('/').pop().replace(/\.html.*$/, '') === x.paginas[0]);
    if (!g) return url;
    let v = hw.fader;
    if (v == null) { try { v = parseFloat(sessionStorage.getItem('magenta-fader')); } catch (e) { v = NaN; } }
    if (v == null || Number.isNaN(v)) return url;
    return g.paginas[zonaDeslizante(v, g.paginas.length, null)] + '.html';
  }

  const leds = (modos) => enviar({ tipo: 'leds', modos: Object.assign({ JACK: '0', PERILLA: '0', SLIDER: '0', PIANO: '0' }, modos) });

  // Destino de la píldora ("avanzar") de esta pantalla.
  const destino = () => {
    if (regla.sig) return regla.sig;
    const a = document.querySelector('a.pildora-tut, a.pildora-paso, a.n1-boton, a.c2-pildora');
    return (a && a.getAttribute('href')) || document.body.dataset.sig || null;
  };

  // Teclas y toques simulados: las pantallas ya entienden el teclado y los toques.
  const tecla = (k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: String(k), bubbles: true }));
  const tocar = (el) => { if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); };

  // Los navegadores no dejan sonar audio sin un gesto del usuario; el clic en "Conectar Arduino" cuenta,
  // pero nos aseguramos de que cualquier contexto de audio de la página quede activo.
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) window.AudioContext = class extends AC { constructor(...a) { super(...a); this.resume().catch(() => {}); } };

  // ===================== ESTADO DEL TABLERO (lo que se vio desde que se abrió la pantalla) =====================
  const hw = { jack: null, fader: null };
  let cableAfuera = true;        // ¿se vio el cable desenchufado? (para "desconectalo y volvelo a conectar")
  let anclaFader = null;         // valor del deslizante al abrir la pantalla
  let viaje = 0;                 // recorrido total del deslizante desde que se abrió la pantalla
  let ultimoFader = null;
  let giros = 0, dirGiros = 0, tGiros = 0, girosTotales = 0;
  let pulsaciones = 0, timerPads = null;

  // Clicks seguidos de la perilla en la misma dirección (se reinicia si cambia de sentido o se frena).
  function girar(dir) {
    const ahora = performance.now();
    if (dir !== dirGiros || ahora - tGiros > 1200) giros = 0;
    dirGiros = dir; tGiros = ahora;
    giros += 1; girosTotales += 1;
    return giros;
  }

  // ===================== TABS DEL NÚCLEO 2 =====================
  const CLAVE_VISTAS = 'magenta-visitadas';
  const leerVistas = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE_VISTAS)) || []; } catch (e) { return []; } };
  const grupo = GRUPOS.find((g) => g.paginas.includes(pagina));
  if (grupo) {
    const v = new Set(leerVistas());
    v.add(pagina);
    try { sessionStorage.setItem(CLAVE_VISTAS, JSON.stringify([...v])); } catch (e) { /* nada */ }
  }
  const gruposCompleto = () => grupo && grupo.paginas.every((p) => leerVistas().includes(p));
  if (pagina === 'index') { try { sessionStorage.removeItem(CLAVE_VISTAS); sessionStorage.removeItem('quizParcial'); sessionStorage.removeItem('quizResultados'); } catch (e) { /* nada */ } }

  // Zona del deslizante (0 = arriba = primera tab). Con histéresis respecto de la tab actual.
  function zonaDeslizante(v, n, actual, hist = HISTERESIS) {
    const ancho = 100 / n;
    const crudo = Math.min(n - 1, Math.max(0, Math.floor((100 - v) / ancho)));
    if (actual == null || actual < 0) return crudo;
    const arriba = 100 - actual * ancho, abajo = 100 - (actual + 1) * ancho;
    if (v <= arriba + hist && v >= abajo - hist) return actual;
    return crudo;
  }

  // Todas las tabs de un grupo se muestran en UNA sola pantalla: al mover el deslizante, el contenido cambia
  // al instante (sin recargar la página). Arriba (100) = primera tab, abajo (0) = última.
  const cache = {};
  if (grupo) {
    grupo.paginas.forEach((p) => {
      fetch(p + '.html').then((r) => r.text()).then((t) => {
        const d = new DOMParser().parseFromString(t, 'text/html');
        cache[p] = d;
        d.querySelectorAll('img').forEach((im) => { const i = new Image(); i.src = im.getAttribute('src'); });   // precarga imágenes
      }).catch(() => {});
    });
  }

  function ledsTabs() { leds(grupo && grupo.perilla ? { PERILLA: 'T' } : gruposCompleto() ? { PERILLA: 'T', SLIDER: '1' } : { SLIDER: 'T' }); }

  // Sincroniza `a` (lo que se ve) con `b` (la otra tab): solo toca lo que cambia (clases, estilos, imágenes, textos).
  // Lo que es igual en las dos tabs (títulos, fondo, la botonera) no se vuelve a crear, así no parpadea.
  function sincronizar(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType === 3) { if (a.textContent !== b.textContent) a.textContent = b.textContent; return true; }
    if (a.nodeType !== 1 || a.tagName !== b.tagName) return false;
    const ha = [...a.childNodes].filter((n) => n.nodeType !== 8), hb = [...b.childNodes].filter((n) => n.nodeType !== 8);
    if (ha.length !== hb.length) { ha.forEach((h) => h.remove()); hb.forEach((h) => a.appendChild(document.importNode(h, true))); return true; }
    for (const at of ['class', 'style', 'src', 'href']) {
      if (a === document.querySelector('main.diseno') && at !== 'style') continue;
      const v = b.getAttribute(at);
      if (v == null) a.removeAttribute(at); else if (a.getAttribute(at) !== v) a.setAttribute(at, v);
    }
    ha.forEach((h, k) => {
      if (sincronizar(h, hb[k])) return;
      const n = document.importNode(hb[k], true);
      a.replaceChild(n, h);
    });
    return true;
  }

  // Al cambiar de tab, el contenido flota hacia adentro (escalonado) y la tab/título/fondo quedan quietos.
  function flotar(main) {
    const fijo = (e) => e.matches('.n2-nav, .n2-titulo, .a-titulo, .n2-bajada, .pestanas, .halo, h1');
    const blancos = [];
    [...main.children].filter((e) => !fijo(e)).forEach((e) => { if (e.matches('.n2-grupo')) blancos.push(...e.children); else blancos.push(e); });
    blancos.forEach((e, k) => {
      e.animate([{ opacity: 0, translate: '0 26px' }, { opacity: 1, translate: '0 0' }],
        { duration: 600, delay: Math.min(k * 45, 520), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }

  function cambiarTab(i) {
    const p = grupo.paginas[i];
    const doc = cache[p];
    const main = document.querySelector('main.diseno');
    const nuevo = doc && doc.querySelector('main.diseno');
    if (!main || !nuevo) { ir(p + '.html'); return; }          // sin caché: carga normal

    // lo nuevo que aparezca no se anima (las animaciones de entrada solo corren al cargar la pantalla)
    document.documentElement.classList.add('sin-anim');
    if (!sincronizar(main, nuevo)) { ir(p + '.html'); return; }
    const bg = document.querySelector('.stage > img.bg'), bgN = doc.querySelector('.stage > img.bg');
    if (bg && bgN && bg.getAttribute('src') !== bgN.getAttribute('src')) bg.setAttribute('src', bgN.getAttribute('src'));
    tSwap = performance.now();
    flotar(main);

    pagina = p;
    try { history.replaceState(null, '', p + '.html'); } catch (e) { /* nada */ }
    const v = new Set(leerVistas()); v.add(p);
    try { sessionStorage.setItem(CLAVE_VISTAS, JSON.stringify([...v])); } catch (e) { /* nada */ }
    ledsTabs();
  }
  let tSwap = 0, tTrail = null;
  function conTabs(v) {
    if (!grupo || grupo.perilla || v == null || navegando) return;
    const actual = grupo.paginas.indexOf(pagina);
    const z = zonaDeslizante(v, grupo.paginas.length, actual, HISTERESIS_TABS);
    if (z === actual) return;
    const ahora = performance.now();
    if (ahora - tSwap < 110) {            // no más de un cambio cada ~110 ms; el último valor siempre gana
      clearTimeout(tTrail);
      tTrail = setTimeout(() => conTabs(hw.fader), 120);
      return;
    }
    cambiarTab(z);
  }

  if (grupo) {      // recordar dónde estaba el deslizante al llegar (viene de la pantalla anterior)
    try { const g = parseFloat(sessionStorage.getItem('magenta-fader')); if (!Number.isNaN(g)) { hw.fader = g; anclaFader = g; ultimoFader = g; } } catch (e) { /* nada */ }
  }

  // ===================== GRÁFICO: el deslizante elige una de las 4 pistas =====================
  let filaGrafico = -1, graficoActivo = false;
  function conGrafico(v) {
    const filas = [...document.querySelectorAll('.gr-fila')];
    if (!filas.length) return;
    if (!graficoActivo && Math.abs(v - anclaFader) < MOVIMIENTO_MIN) return;
    graficoActivo = true;
    const z = zonaDeslizante(v, filas.length, filaGrafico);
    if (z !== filaGrafico) { filaGrafico = z; filas[z].click(); }
  }

  // ===================== QUIZ =====================
  const quizRespondida = () => { const d = document.getElementById('dato-etq'); return !!d && !d.hidden; };
  const ledsQuiz = () => leds({ PIANO: 'T' });

  // ===================== EVENTOS =====================
  const CLAVE_FADER = 'magenta-fader';
  function conFader(v) {
    hw.fader = v;
    try { sessionStorage.setItem(CLAVE_FADER, String(v)); } catch (e) { /* nada */ }
    if (anclaFader == null) anclaFader = v;
    if (ultimoFader == null) ultimoFader = v;
    if (Math.abs(v - ultimoFader) >= BANDA_MUERTA) { viaje += Math.abs(v - ultimoFader); ultimoFader = v; }
    if (regla.tipo === 'tabs') { conTabs(v); return; }      // las tabs responden al instante, sin esperar
    if (enGracia() || navegando) return;
    switch (regla.tipo) {
      case 'deslizantePoco': if (viaje >= regla.viaje) ir(destino()); break;
      case 'grafico': conGrafico(v); break;
      default:
    }
  }

  function conJack(valor) {
    hw.jack = valor;
    if (valor === 0) cableAfuera = true;
    if (enGracia() || navegando) return;
    if (regla.tipo === 'cable' && valor === 1 && cableAfuera) ir(destino());
    if (regla.tipo === 'cableFuera' && valor === 0) ir('index.html');
  }

  let tPaso = 0, dirPaso = 0;
  function conPerilla(dir) {      // dir: +1 derecha, -1 izquierda, 0 = apretaron
    if (dir !== 0) {              // un paso por vez: ignora los que llegan pegados o en sentido contrario (temblor)
      const ahora = performance.now();
      const entreTabs = regla.tipo === 'tabs' && grupo && grupo.perilla;      // entre pestañas se puede ir y volver enseguida
      if (ahora - tPaso < (entreTabs ? PAUSA_TABS_MS : PAUSA_GIRO_MS)) return;
      if (!entreTabs && dir !== dirPaso && ahora - tPaso < PAUSA_GIRO_MS * 2 && dirPaso !== 0) { tPaso = ahora; dirPaso = dir; return; }
      tPaso = ahora; dirPaso = dir;
    }
    const n = dir === 0 ? CLICKS_PERILLA : girar(dir);
    switch (regla.tipo) {
      case 'perillaPoco': if (dir === 0 || girosTotales >= CLICKS_TUTORIAL) ir(destino()); break;
      case 'perilla':
      case 'grafico':
        if (dir >= 0 && n >= CLICKS_PERILLA) ir(destino());
        else if (dir < 0 && regla.atras) ir(regla.atras);          // volver atrás: 1 click a la izquierda
        break;
      case 'cable':
      case 'piano':
        if (dir < 0 && regla.atras) ir(regla.atras);
        else if (dir > 0 && regla.tipo === 'piano' && n >= CLICKS_PERILLA) ir(destino());
        break;
      case 'tabs':
        if (grupo.perilla) {            // la perilla recorre las tabs; en los extremos pasa a la pantalla de al lado
          const i = grupo.paginas.indexOf(pagina);
          if (dir >= 0) { if (i < grupo.paginas.length - 1) cambiarTab(i + 1); else ir(grupo.siguiente); }
          else if (i > 0) cambiarTab(i - 1); else ir(grupo.atras);
          break;
        }
        if (dir >= 0 && n >= CLICKS_PERILLA && gruposCompleto()) ir(grupo.siguiente);
        else if (dir < 0 && grupo.atras) ir(grupo.atras);
        break;
      default:
    }
  }

  let tRespuesta = 0;
  function conBoton(n) {
    switch (regla.tipo) {
      case 'inicio': ir('bienvenido.html'); break;
      case 'pads': ir(destino()); break;
      case 'botones4': {
        const pads = document.querySelectorAll('.eq-pad');
        tocar(pads[(n - 1) % pads.length]);
        pulsaciones += 1;
        clearTimeout(timerPads);
        if (pulsaciones >= PULSACIONES_PADS) timerPads = setTimeout(() => ir(destino()), PAUSA_PADS_MS);
        break;
      }
      case 'piano': {      // los botones se reparten a lo largo de las 18 teclas blancas
        const teclas = document.querySelectorAll('.pianito__blanca');
        if (teclas.length) tocar(teclas[Math.round(((n - 1) * (teclas.length - 1)) / Math.max(1, BOTONES_PIANO - 1))]);
        break;
      }
      case 'practica1':
        if (n <= 2) tecla(n);        // los pads 1 y 2 dan vuelta las fichas
        else ir(destino());          // cualquier otro pad sigue
        break;
      case 'quiz':
        if (!quizRespondida()) {
          if (n <= 4) { tecla(n); tRespuesta = performance.now(); setTimeout(ledsQuiz, 60); }   // pads 1-4 eligen
        } else if (performance.now() - tRespuesta > 500) {                                       // ya respondió: cualquier pad sigue
          const c = document.getElementById('cta'); if (c) c.click();
          setTimeout(ledsQuiz, 60);
        }
        break;
      default:
    }
  }

  function manejar(ev) {
    if (ev.nombre === 'FADER') return conFader(ev.valor);
    if (ev.nombre === 'JACK') return conJack(ev.valor);
    if (enGracia() || navegando) return;
    switch (ev.nombre) {
      case 'PERILLA': {
        const v = String(ev.valor).toUpperCase();
        if (v === 'DER') conPerilla(1);
        else if (v === 'IZQ') conPerilla(-1);
        else if (v === 'CLICK') { if (regla.tipo === 'inicio') ir('bienvenido.html'); else conPerilla(0); }
        break;
      }
      case 'ENC': conPerilla(ev.valor >= 0 ? 1 : -1); break;      // formato viejo (consola v3)
      case 'OK':                                                   // formato viejo (consola v3)
        if (regla.tipo === 'inicio') ir('bienvenido.html'); else conPerilla(0);
        break;
      case 'BOTON_ON': conBoton(ev.valor); break;
      default:
    }
  }

  // ===================== MENSAJES DEL CONTENEDOR =====================
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.fuente !== 'consola') return;
    if (d.tipo === 'estado' && d.estado) {
      if (d.estado.fader != null) { hw.fader = d.estado.fader;  if (anclaFader == null) { anclaFader = d.estado.fader; ultimoFader = d.estado.fader; } }
      if (d.estado.jack != null) { hw.jack = d.estado.jack; cableAfuera = d.estado.jack !== 1; }
      // cierre: si el cable ya estaba desenchufado no hay nada que desconectar
      if (regla.tipo === 'cableFuera' && d.estado.jack === 0 && !navegando) setTimeout(() => { if (!navegando) ir('index.html'); }, 3000);
    } else if (d.tipo === 'evento') manejar(d);
  });

  // Al abrir la pantalla: pedir el estado actual y dejar prendidos solo los LEDs que invitan a actuar.
  enviar({ tipo: 'hola', pagina });
  if (regla.tipo === 'tabs') ledsTabs();
  else if (regla.tipo === 'quiz') ledsQuiz();
  else leds(regla.leds || {});

  // Para depurar desde la consola del navegador (F12): Consola.simular('PERILLA:DER')
  window.Consola = {
    pagina, regla,
    simular(linea) {
      const [nombre, ...r] = String(linea).split(':');
      const t = r.join(':');
      manejar({ nombre: nombre.toUpperCase(), valor: t !== '' && !Number.isNaN(Number(t)) ? Number(t) : t });
    },
  };
})();
