/*
  CONSOLA (contenedor) — habla con el Arduino por USB y se lo pasa a la pantalla que se está mostrando.

  Por qué existe: la conexión USB (Web Serial) se corta cada vez que el navegador cambia de página, y
  tu infografía son muchos HTML separados. Acá la conexión vive UNA sola vez, y las pantallas se
  muestran dentro de un iframe. Cada pantalla (consola.js) recibe los mensajes del Arduino y manda
  de vuelta qué LEDs prender.

  Mensajes del Arduino -> pantalla:  { fuente:'consola', tipo:'evento', nombre:'JACK', valor:2 }
  Pantalla -> contenedor:            { fuente:'pagina',  tipo:'hola' }  /  { tipo:'leds', modos:{JACK:'T',...} }
*/
(() => {
  'use strict';

  const BAUDIOS = 115200;
  const ESPERA_ARRANQUE_MS = 3000;   // si no llega "LISTO" (placa que no se reinicia), seguimos igual
  const LEDS = ['JACK', 'PERILLA', 'SLIDER', 'PIANO'];

  const $ = (id) => document.getElementById(id);
  const iframe = $('pantalla');
  const btnConectar = $('btn-conectar');
  const btnChip = $('btn-chip');
  const btnDesconectar = $('btn-desconectar');
  const aviso = $('aviso');
  const monitor = $('monitor');

  const estado = { conectado: false, listo: false, jack: null, fader: null, presencia: null };
  let ledDeseado = { JACK: '0', PERILLA: '0', SLIDER: '0', PIANO: '0' };
  let ledEnviado = {};

  let puerto = null, lector = null, escritor = null;
  let colaEscritura = Promise.resolve();
  let timerArranque = null;
  let cerrando = false;               // true mientras el usuario desconecta a mano
  const codificar = new TextEncoder();

  // ---------- utilidades de pantalla ----------
  const log = (txt) => {
    const lineas = monitor.textContent ? monitor.textContent.split('\n') : [];
    lineas.push(txt);
    monitor.textContent = lineas.slice(-60).join('\n');
    monitor.scrollTop = monitor.scrollHeight;
  };
  const decir = (txt) => { aviso.textContent = txt || ''; aviso.hidden = !txt; };
  const pantalla = () => iframe.contentWindow;
  const mandar = (msg) => { try { pantalla().postMessage({ fuente: 'consola', ...msg }, '*'); } catch (e) { /* iframe cambiando */ } };
  const enfocar = () => { try { btnConectar.blur(); iframe.focus(); pantalla().focus(); } catch (e) { /* nada */ } };

  function pintar() {
    btnConectar.hidden = estado.conectado;
    btnChip.hidden = !estado.conectado;
    btnDesconectar.hidden = !estado.conectado || monitor.hidden;
  }

  // ---------- escritura hacia el Arduino ----------
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  function enviar(texto) {
    if (!escritor) return;
    const w = escritor;
    colaEscritura = colaEscritura
      .then(() => w.write(codificar.encode(texto + '\n')))
      .then(() => esperar(25))          // el Arduino UNO tiene un buffer chico: espaciamos los comandos
      .catch(() => {});
    log('→ ' + texto);
  }

  function sincronizarLeds() {
    if (!estado.listo) return;
    for (const l of LEDS) {
      if (ledEnviado[l] !== ledDeseado[l]) {
        ledEnviado[l] = ledDeseado[l];
        enviar(`LED:${l}:${ledDeseado[l]}`);
      }
    }
  }

  // ---------- lectura desde el Arduino ----------
  function procesarLinea(crudo) {
    const txt = crudo.trim();
    if (!txt) return;
    log('← ' + txt);
    const i = txt.indexOf(':');
    const nombre = (i < 0 ? txt : txt.slice(0, i)).toUpperCase();
    const textoValor = i < 0 ? '' : txt.slice(i + 1);
    const numero = Number(textoValor);
    const valor = textoValor !== '' && !Number.isNaN(numero) ? numero : textoValor;

    if (nombre === 'LISTO') {
      clearTimeout(timerArranque);
      estado.listo = true;
      ledEnviado = {};                 // la placa se reinició: no tiene ningún LED prendido
      sincronizarLeds();
    } else if (nombre === 'JACK') estado.jack = valor;
    else if (nombre === 'FADER') estado.fader = valor;
    else if (nombre === 'PRESENCIA') estado.presencia = valor;

    mandar({ tipo: 'evento', nombre, valor, linea: txt });
  }

  async function bucleLectura(p) {
    const decodificar = new TextDecoder();
    let resto = '';
    try {
      while (p.readable && !cerrando) {
        lector = p.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await lector.read();
            if (done) break;
            resto += decodificar.decode(value, { stream: true });
            let m;
            while ((m = resto.match(/\r?\n/))) {
              procesarLinea(resto.slice(0, m.index));
              resto = resto.slice(m.index + m[0].length);
            }
            if (resto.length > 200) resto = '';   // basura sin salto de línea
          }
        } finally {
          lector.releaseLock();
          lector = null;
        }
      }
    } catch (err) {
      log('Error de lectura: ' + err.message);
    }
    if (puerto === p && !cerrando) alDesconectar('Se cortó la conexión con el Arduino. Revisá el cable USB.');
  }

  // ---------- conectar / desconectar ----------
  async function abrir(p) {
    await p.open({ baudRate: BAUDIOS });
    cerrando = false;
    puerto = p;
    escritor = p.writable.getWriter();
    estado.conectado = true;
    estado.listo = false;
    ledEnviado = {};
    decir('');
    pintar();
    mandar({ tipo: 'estado', estado });
    // Al abrir el puerto el Arduino UNO se reinicia y manda "LISTO" a los ~2 segundos.
    clearTimeout(timerArranque);
    timerArranque = setTimeout(() => {
      if (!estado.listo) { estado.listo = true; sincronizarLeds(); enviar('ESTADO'); }
    }, ESPERA_ARRANQUE_MS);
    bucleLectura(p);
    enfocar();
  }

  function mensajeError(err) {
    if (err && err.name === 'NotFoundError') return '';   // el usuario cerró el selector: no es un error
    if (err && err.name === 'InvalidStateError') return 'El puerto ya está abierto en otro lado.';
    return 'No se pudo abrir el puerto. ¿Está abierto el Monitor Serie del Arduino IDE (o otra pestaña)? Cerralo y probá de nuevo.';
  }

  async function conectarManual() {
    if (!('serial' in navigator)) { decir('Este navegador no soporta Web Serial. Usá Chrome o Edge.'); return; }
    try {
      const p = await navigator.serial.requestPort();   // abre el selector de puertos (necesita un clic)
      await abrir(p);
    } catch (err) {
      decir(mensajeError(err));
      log('Error: ' + (err && err.message));
    }
  }

  // Si ya autorizaste el puerto antes, Chrome deja abrirlo solo, sin selector.
  async function conectarAuto() {
    if (!('serial' in navigator) || estado.conectado) return;
    try {
      const puertos = await navigator.serial.getPorts();
      if (puertos.length) await abrir(puertos[0]);
    } catch (err) {
      decir(mensajeError(err));
      log('Auto-conexión falló: ' + (err && err.message));
    }
  }

  function alDesconectar(texto) {
    clearTimeout(timerArranque);
    const w = escritor;
    escritor = null;
    try { w && w.releaseLock(); } catch (e) { /* nada */ }
    const p = puerto;
    puerto = null;
    estado.conectado = false;
    estado.listo = false;
    ledEnviado = {};
    pintar();
    decir(texto || '');
    mandar({ tipo: 'estado', estado });
    if (p) p.close().catch(() => {});
  }

  async function desconectarManual() {
    const p = puerto;
    if (!p) return;
    cerrando = true;
    try { if (lector) await lector.cancel(); } catch (e) { /* nada */ }   // corta el bucle de lectura
    try { await colaEscritura; } catch (e) { /* nada */ }
    alDesconectar('');                                                  // suelta el escritor y cierra el puerto
  }

  // ---------- mensajes de las pantallas ----------
  window.addEventListener('message', (e) => {
    if (e.source !== iframe.contentWindow) return;
    const d = e.data;
    if (!d || d.fuente !== 'pagina') return;
    if (d.tipo === 'hola') mandar({ tipo: 'estado', estado });
    else if (d.tipo === 'leds' && d.modos) {
      for (const l of LEDS) if (l in d.modos) ledDeseado[l] = String(d.modos[l]);
      sincronizarLeds();
    }
  });

  // Cada pantalla nueva: devolver el foco al iframe para que sigan andando las teclas.
  iframe.addEventListener('load', enfocar);

  btnConectar.addEventListener('click', conectarManual);
  btnDesconectar.addEventListener('click', desconectarManual);
  btnChip.addEventListener('click', () => { monitor.hidden = !monitor.hidden; pintar(); });

  if ('serial' in navigator) {
    navigator.serial.addEventListener('disconnect', (e) => { if (e.target === puerto) alDesconectar('Se desconectó el Arduino.'); });
    navigator.serial.addEventListener('connect', () => { if (!estado.conectado) conectarAuto(); });
    conectarAuto();
  } else {
    decir('Este navegador no soporta Web Serial. Usá Chrome o Edge.');
  }
  pintar();
})();
