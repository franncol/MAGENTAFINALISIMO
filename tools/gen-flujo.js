// Genera las pantallas nuevas del flujo: conocé tu equipo (4), MAgenTA, gráfico de horas,
// "Magenta llevado a la práctica" (2) y aviso del quiz.
// Uso: node tools/gen-flujo.js
const fs = require('fs');
const path = require('path');
const raíz = path.join(__dirname, '..');

const FUENTES = 'family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,700&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@400;600;700;900&family=Russo+One&family=Space+Grotesk:wght@400;700';
const página = ({ file, title, css, cuerpo, scripts = '', sig }) => fs.writeFileSync(path.join(raíz, file), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="transicion.js"></script>
  <title>${title} | Google Magenta</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${FUENTES}&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="base.css">
${css.map((c) => `  <link rel="stylesheet" href="${c}">`).join('\n')}
  <link rel="stylesheet" href="transicion.css">
</head>
<body${sig ? ` data-sig="${sig}"` : ''}>
  <div class="stage" id="stage">
${cuerpo}
  </div>
  <script src="stage.js"></script>${sig ? '\n  <script src="siguiente.js"></script>' : ''}${scripts}
</body>
</html>
`, 'utf8');

const E = 'assets/equipo';
const ROSA = '--tut-bg:rgba(255,61,191,.12);--tut-c:#ff3dbf;--tut-g:rgba(255,61,191,.45)';

/* ---------- Conocé tu equipo ---------- */
const equipo = ({ file, seccion, gif, texto, sig, extra = '', scripts = '' }) => página({
  file,
  title: 'Conocé tu equipo',
  css: ['equipo.css'],
  scripts,
  cuerpo: `    <img class="glich" src="assets/glich.png" alt="">
    <main class="diseno">
      <h1 class="eq-titulo">ANTES DE PRODUCIR, CONOCÉ TU EQUIPO</h1>
      <p class="eq-seccion">${seccion}</p>
${gif}
      <div class="eq-mascota"><img src="${E}/mascota-dj.png" alt="Mascota de Google Magenta con auriculares"></div>
${extra}
      <a class="pildora-tut" href="${sig}" style="${ROSA}">
        <span class="pildora-tut__icono"><img src="${E}/icono.svg" alt=""></span>
        <span class="pildora-tut__texto">${texto}</span>
      </a>
    </main>`,
});

equipo({
  file: 'equipo-jacks.html',
  seccion: 'LOS JACKS',
  gif: `      <div class="gif" style="left:720px;top:350px;width:590px;height:405px">
        <img src="assets/gif/bienvenido.gif" alt="" style="left:.11%;top:-78.62%;width:99.98%;height:258.71%">
      </div>`,
  texto: 'CONECTÁ EL CABLE PARA EMPEZAR',
  sig: 'equipo-perilla.html',
});

equipo({
  file: 'equipo-perilla.html',
  seccion: 'LA PERILLA',
  gif: `      <div class="gif" style="left:946px;top:333px;width:307px;height:286px">
        <img src="assets/gif/como-funciona.gif" alt="" style="left:-25.76%;top:-63.62%;width:138.38%;height:264.73%">
      </div>`,
  texto: 'GIRÁ LA PERILLA PARA EXPLORAR LA SECCIÓN 1',
  sig: 'equipo-slider.html',
});

equipo({
  file: 'equipo-slider.html',
  seccion: 'EL SLIDER',
  gif: `      <div class="gif" style="left:930px;top:336px;width:211.68px;height:403.2px">
        <img src="assets/gif/como-interactua.gif" alt="" style="left:-72.69%;top:-51.2%;width:205.25%;height:192.35%">
      </div>`,
  texto: 'SUBÍ Y BAJÁ EL SLIDER PARA LA SECCIÓN 2',
  sig: 'equipo-botones.html',
});

const botonB = (left, nota) => `      <button class="eq-pad" data-nota="${nota}" style="left:${left}px;top:429px;width:285.605px;height:171.112px">
        <img src="${E}/e-7a5f4.svg" alt="" style="left:78.54px;top:37.75px;width:130.983px;height:87.443px">
        <img src="${E}/e-fbc60.svg" alt="" style="left:79.48px;top:39.63px;width:129.969px;height:74.547px">
        <img class="base" src="${E}/boton.png" alt="">
        <img src="${E}/e-e0896.svg" alt="" style="left:84.3px;top:39px;width:119.527px;height:69.829px">
      </button>`;
equipo({
  file: 'equipo-botones.html',
  seccion: 'EL PIANO GENIE',
  gif: '',
  texto: 'TOCÁ LOS BOTONES PARA CREAR TU MELODÍA',
  sig: 'como-funciona.html',
  extra: `${botonB(581, 0)}
${botonB(768, 1)}
${botonB(950, 2)}
${botonB(1139, 3)}`,
  scripts: `
  <script>
    // Cada botón toca una nota (Do, Mi, Sol, Si).
    const NOTAS = [261.63, 329.63, 392, 493.88];
    let audio;
    document.querySelectorAll('.eq-pad').forEach((b, i) => {
      b.addEventListener('pointerdown', () => {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const osc = audio.createOscillator();
        const vol = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = NOTAS[i];
        vol.gain.setValueAtTime(.3, audio.currentTime);
        vol.gain.exponentialRampToValueAtTime(.001, audio.currentTime + 1.2);
        osc.connect(vol).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 1.2);
        b.classList.add('on');
        setTimeout(() => b.classList.remove('on'), 160);
      });
    });
  </script>`,
});

/* ---------- Núcleo 1: MAgenTA ---------- */
página({
  file: 'n1-magenta.html',
  title: 'MAgenTA',
  css: ['n1.css'],
  cuerpo: `    <img class="n1-bg" src="assets/n1/fondo.png" alt="">
    <div class="n1-velo"></div>
    <main class="diseno">
      <img class="n1-bg-diseno" src="assets/n1/fondo.png" alt="">
      <div class="n1-velo n1-velo--diseno"></div>
      <h1 class="mg-titulo">MAgenTA = Music And art Generation</h1>
      <div class="mg-panel"><img src="assets/n1/panel.png" alt=""></div>
      <div class="mg-texto">
        <p>Nace como un <span class="rosa">Proyecto de investigación de Google</span>, de código abierto, que explora cómo el aprendizaje automático puede ser una herramienta más dentro del proceso creativo.</p>
        <p>Lo fundó Douglas Eck en Google Brain: se presentó en Moogfest y se lanzó el 1 de junio de 2016.</p>
        <p>Hoy forma parte de Google DeepMind.</p>
      </div>
      <div class="mg-ondas"><img src="assets/n1/ondas-rosa.png" alt=""></div>
      <a class="n1-boton" href="modelo.html" style="left:1291px;top:863px"><img src="assets/n1/icono-perilla.svg" alt=""></a>
    </main>`,
});

/* ---------- Núcleo 1: gráfico de horas ---------- */
const EJE = [['1 h', 0, 0], ['10 h', 143.6, 13.9], ['100 h', 298, 17.5], ['1 mil h', 448.8, 24.7], ['10 mil h', 603.2, 28.3], ['100 mil h', 757.6, 31.9], ['1 M h', 912, 35]];
const PISTAS = [
  { id: 'midi', tipo: 'midi', nombre: 'Groove MIDI', anio: '2019 · batería', ancho: 181.1, onda: 'onda-midi', inset: '0 0 0 -0.39%', valor: '13,6 h',
    año: '2019', tag: 'Notas · MIDI · batería', desc: 'Baterista tocando en una batería electrónica. Con esto se entrenó GrooVAE, el motor de Groove y Drumify en Magenta Studio.', grande: '≈ medio día', chico: '13,6 horas · 10 bateristas · 1.150 archivos MIDI' },
  { id: 'maestro', tipo: 'midi', nombre: 'MAESTRO', anio: '2018 · piano', ancho: 355.3, onda: 'onda-maestro', inset: '0 0 0 -0.24%', valor: '172 h',
    año: '2018', tag: 'Notas · MIDI · piano', desc: 'Interpretaciones del concurso Piano-e-Competition grabadas con sus notas exactas. Es la base de los modelos de piano de Magenta, como Wave2Midi2Wave.', grande: '≈ 7 días', chico: '172,3 horas de pianistas reales (versión 1)' },
  { id: 'nsynth', tipo: 'audio', nombre: 'NSynth', anio: '2017 · sonido', ancho: 402, onda: 'onda-nsynth', inset: '0 0 0 -0.18%', valor: '≈340 h',
    año: '2017', tag: 'Sonido · audio', desc: 'El sintetizador neuronal aprendió el timbre de más de mil instrumentos a partir de notas sueltas de cuatro segundos cada una.', grande: '≈ 14 días', chico: '~340 horas · 305.979 notas de 1.006 instrumentos' },
  { id: 'rt', tipo: 'audio', nombre: 'Magenta RT', anio: '2025 · sonido', ancho: 836, onda: 'onda-rt', inset: '0 -0.79% 0 -0.78%', valor: '190.000 h',
    año: '2025', tag: 'Sonido · audio', desc: 'El modelo de música en vivo, de 800 millones de parámetros. Ya no escucha notas sueltas ni un solo instrumento: escucha canciones completas.', grande: '≈ 21 años', chico: '~190.000 horas de música mayormente instrumental' },
];
const DATOS = Object.fromEntries(PISTAS.map((p) => [p.id, { tipo: p.tipo, año: p.año, tag: p.tag, nombre: p.nombre, desc: p.desc, grande: p.grande, chico: p.chico }]));
página({
  file: 'grafico.html',
  title: '¿Cuánta música escuchó cada modelo?',
  css: ['n1.css'],
  cuerpo: `    <div class="gr-fondo"></div>
    <main class="diseno">
      <h1 class="gr-titulo">¿Cuánta música escuchó cada modelo?</h1>
      <img class="gr-sub" src="assets/n1/grafico-sub.svg" alt="Cada dataset es una pista: cuanto más largo el clip y más apretada la onda, más horas escuchó. Tocá una pista para oírla.">

      <div class="gr-grafico">
        <span class="gr-pista">PISTA</span>
        <div class="gr-eje">${EJE.map(([t, l, x]) => `<span style="left:${l}px;--t:${x}px">${t}</span>`).join('')}</div>
        <div class="gr-filas">
${PISTAS.map((p) => `          <div class="gr-fila gr-fila--${p.tipo}" data-id="${p.id}" role="button" tabindex="0">
            <div class="gr-etq"><i class="gr-punto"></i><span class="gr-nombre">${p.nombre}</span><span class="gr-anio">${p.anio}</span></div>
            <div class="gr-carril">
              <div class="gr-onda" style="width:${p.ancho}px"><img src="assets/n1/${p.onda}.svg" alt="" style="left:${p.inset.split(' ')[3]};width:${(100 - parseFloat(p.inset.split(' ')[3]) - parseFloat(p.inset.split(' ')[1])).toFixed(2)}%"></div>
              <i class="gr-cursor"></i>
              <span class="gr-valor" style="left:${p.ancho + 6}px">${p.valor}</span>
            </div>
          </div>`).join('\n')}
        </div>
      </div>

      <section class="gr-tarjeta" id="tarjeta">
        <img src="assets/n1/tarjeta.png" alt="">
        <div class="gr-t-izq">
          <span class="gr-t-anio" id="t-anio"></span>
          <span class="gr-t-tag" id="t-tag"></span>
          <p class="gr-t-nombre" id="t-nombre"></p>
          <p class="gr-t-desc" id="t-desc"></p>
        </div>
        <div class="gr-t-der">
          <p class="gr-t-etq">SI LO ESCUCHARAS SIN PARAR</p>
          <p class="gr-t-grande" id="t-grande"></p>
          <p class="gr-t-chico" id="t-chico"></p>
        </div>
      </section>

      <a class="n1-boton" href="progreso.html" style="left:1321px;top:869px"><img src="assets/n1/icono-perilla.svg" alt=""></a>
    </main>`,
  scripts: `
  <script>
    // Al principio no hay ninguna pista elegida ni tarjeta; al tocar una pista aparece su información.
    const DATOS = ${JSON.stringify(DATOS)};
    const filas = document.querySelectorAll('.gr-fila');
    const tarjeta = document.getElementById('tarjeta');
    const poner = (id, txt) => { document.getElementById(id).textContent = txt; };
    function elegir(fila) {
      const d = DATOS[fila.dataset.id];
      filas.forEach((f) => f.classList.toggle('on', f === fila));
      tarjeta.classList.toggle('midi', d.tipo === 'midi');
      poner('t-anio', d.año);
      poner('t-tag', d.tag);
      poner('t-nombre', d.nombre);
      poner('t-desc', d.desc);
      poner('t-grande', d.grande);
      poner('t-chico', d.chico);
      tarjeta.classList.add('visible');
    }
    filas.forEach((f) => {
      f.addEventListener('click', () => elegir(f));
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') elegir(f); });
    });
  </script>`,
});

/* ---------- Núcleo 3: Magenta llevado a la práctica ---------- */
const N3 = 'assets/n3';
const pildoraPad = (href, texto) => `      <a class="pildora-paso" href="${href}" style="left:110px;top:927px;width:auto;--p-bg:rgba(255,61,191,.16);--p-c:#ff3dbf;--p-g:rgba(255,61,191,.45)">
        <span class="pildora-paso__icono"><img src="${N3}/icono-pad.svg" alt=""></span>
        <span class="pildora-paso__texto">${texto}</span>
      </a>`;

página({
  file: 'magenta-practica-1.html',
  title: 'Magenta llevado a la práctica',
  css: ['n3.css'],
  cuerpo: `    <img class="mp-bg" src="${N3}/fondo.png" alt="">
    <main class="diseno">
      <h1 class="mp-titulo">Magenta llevado a la práctica</h1>
      <p class="mp-sub">Chain Tripping (2019) — Nominado al Grammy 2020</p>
      <p class="mp-bajada">Álbum creado con Google Magenta a partir de 80 canciones previas desglosadas en MIDI por instrumento, con la utilización de las siguientes herramientas:</p>

      <section class="mp-card mp-card--cian" id="c1" style="left:317px" role="button" tabindex="0">
        <p class="mp-card__titulo mp-front" style="left:129px;color:#83f5ff">MusicVAE</p>
        <p class="mp-card__texto mp-front">Composición de melodías y acordes mediante interpolación.</p>
        <div class="mp-front" style="position:absolute;left:13px;top:91px;width:338px;height:317px;overflow:hidden">
          <img src="${N3}/musicvae.png" alt="" style="left:-23.48%;top:-60.2%;width:145.62%;height:219.3%">
        </div>
        <p class="mp-back mp-back__titulo" style="left:30px;top:30px;width:198px;color:#83f5ff">MusicVAE</p>
        <div class="mp-back mp-back__texto" style="left:18px;right:18px;top:98px;bottom:55px">
          <p>Composición de melodías y acordes mediante interpolación.</p>
          <p>Usaban distintos riffs presentes en canciones propias, y la IA se encargaba de generar compases intermedios para unirlos.</p>
        </div>
      </section>
      <section class="mp-card mp-card--violeta" id="c2" style="left:755px" role="button" tabindex="0">
        <p class="mp-card__titulo mp-front" style="left:109.5px;color:#da7dff">NSynth</p>
        <p class="mp-card__texto mp-front">Síntesis de timbres híbridos (acústico + analógico).</p>
        <img class="mp-front" src="${N3}/sonido.svg" alt="" style="left:38px;top:97px;width:288px;height:288px">
        <p class="mp-back mp-back__titulo" style="left:30px;top:30px;width:161px;color:#da7dff">NSynth</p>
        <div class="mp-back mp-back__texto" style="left:13px;right:12px;top:98px;bottom:55px">
          <p>Utilizando grabaciones aisladas de instrumentos y voces, lo unieron con la IA para que pueda generar nuevos sonidos, combinando características de instrumentos reales con sintetizadores modulares</p>
        </div>
      </section>
${pildoraPad('magenta-practica-2.html', 'REVELA CON LOS PADS 1 y 2')}
    </main>`,
  scripts: `
  <script>
    // Cada ícono se revela al tocarlo (o con los pads 1 y 2) y muestra su texto; otro toque lo vuelve a cerrar.
    const tarjetas = [document.getElementById('c1'), document.getElementById('c2')];
    const alternar = (t) => t.classList.toggle('revelada');
    tarjetas.forEach((t) => {
      t.addEventListener('click', () => alternar(t));
      t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') alternar(t); });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '1') alternar(tarjetas[0]);
      if (e.key === '2') alternar(tarjetas[1]);
    });
  </script>`,
});

página({
  file: 'magenta-practica-2.html',
  title: 'Magenta llevado a la práctica',
  css: ['n3.css'],
  cuerpo: `    <img class="mp-bg" src="${N3}/fondo.png" alt="">
    <main class="diseno">
      <h1 class="mp-titulo">Magenta llevado a la práctica</h1>
      <p class="mp-sub">Proceso creativo del álbum</p>
      <p class="mp-bajada mp-bajada--grande">Si bien la banda afirma el uso de la IA en la creación de su música, no todo es tan sencillo como parece.</p>

      <section class="mp-card mp-card--cian" style="left:75px;top:359px;cursor:default">
        <p class="mp-card__texto">La IA generó partituras en bruto, las cuales el 90% eran descarte.</p>
        <img src="${N3}/ia-genera.svg" alt="" style="left:61.7px;top:108px;width:244px;height:244px">
      </section>
      <div class="mp-flecha" style="left:471px"><img src="${N3}/flecha.svg" alt=""></div>
      <section class="mp-card mp-card--violeta" style="left:537px;top:359px;cursor:default">
        <p class="mp-card__texto it">La banda seleccionó los mejores compases y los unió como un rompecabezas para darle forma al álbum.</p>
        <img src="${N3}/auriculares.svg" alt="" style="left:60px;top:112px;width:242px;height:231px">
      </section>
      <div class="mp-flecha" style="left:932px"><img src="${N3}/flecha.svg" alt=""></div>
      <section class="mp-card mp-card--oscura" style="left:997px;top:359px;cursor:default">
        <p class="mp-card__texto">Los músicos grabaron el disco tocando instrumentos reales en el estudio.</p>
        <img src="${N3}/play.svg" alt="" style="left:61.7px;top:108px;width:244px;height:244px">
      </section>
${pildoraPad('quiz-aviso.html', 'AVANZA CON EL PAD')}
    </main>`,
});

/* ---------- Aviso del quiz ---------- */
página({
  file: 'quiz-aviso.html',
  title: 'Poné a prueba tus conocimientos',
  css: ['n3.css'],
  cuerpo: `    <img class="mp-bg" src="${N3}/fondo-aviso.png" alt="">
    <main class="diseno">
      <p class="qa-linea" style="left:546px;top:169px;width:963px">AHORA QUE YA DOMINAS GOOGLE MAGENTA</p>
      <p class="qa-linea qa-linea--blanca" style="left:935px;top:367px;width:858px">ESTAS A UN PASO DE PRODUCIR..</p>
      <p class="qa-linea" style="left:540px;top:562px;width:858px">PONÉ A PRUEBA TUS CONOCIMIENTOS</p>
      <div class="qa-mascota"><img src="${N3}/mascota-brazos.png" alt="Mascota de Google Magenta"></div>
      <a class="pildora-paso" href="quiz.html" style="left:617px;top:771px;width:auto;--p-bg:rgba(255,61,191,.16);--p-c:#ff3dbf;--p-g:rgba(255,61,191,.45)">
        <span class="pildora-paso__icono"><img src="${N3}/icono-pad.svg" alt=""></span>
        <span class="pildora-paso__texto">EMPEZAR · TOCÁ CUALQUIER PAD</span>
      </a>
    </main>`,
  scripts: `
  <script>
    // Cada intento del quiz arranca de cero; cualquier pad (teclas 1 a 4) lo empieza.
    sessionStorage.removeItem('quizParcial');
    document.addEventListener('keydown', (e) => { if (/^[1-4]$/.test(e.key)) window.location.href = 'quiz.html'; });
  </script>`,
});

/* ---------- Bienvenida (querídisimo aprendiz) y ¿Cómo funciona la IA? ---------- */
const I = 'assets/inicio';
página({
  file: 'bienvenido.html',
  title: 'Bienvenido querídisimo aprendiz',
  css: ['inicio.css'],
  sig: 'equipo-jacks.html',
  cuerpo: `    <div class="bi-fondo"></div>
    <div class="bi-vignette"><img src="${I}/vignette.png" alt=""></div>
    <div class="bi-glich"><img src="${I}/glich-rosa.png" alt=""><i></i></div>
    <main class="diseno">
      <h1 class="bi-titulo">BIENVENIDO QUERIDÍSIMO APRENDIZ</h1>
      <p class="bi-texto">A lo largo de esta infografía aprenderás cómo la inteligencia artificial aprende, transforma y genera música</p>
      <div class="bi-mascota"><img src="${I}/mascota-saludo.png" alt="Mascota de Google Magenta saludando"></div>
    </main>`,
  scripts: `
  <script>
    // Esta pantalla pasa sola a la siguiente después de unos segundos (o con un clic).
    setTimeout(() => { window.location.href = 'equipo-jacks.html'; }, 6000);
  </script>`,
});

página({
  file: 'como-funciona.html',
  title: '¿Cómo funciona la IA?',
  css: ['inicio.css'],
  cuerpo: `    <img class="glich" src="assets/glich.png" alt="">
    <main class="diseno">
      <h1 class="cf-titulo">¿CÓMO <span>FUNCIONA</span> LA IA?</h1>
      <p class="cf-texto">En esta sección vas a aprender como la inteligencia artificial analiza miles de canciones, grabaciones de audio y partituras previas para reconocer patrones musicales</p>
      <div class="cf-mascota"><img src="${I}/mascota-cable.png" alt="Mascota de Google Magenta sosteniendo un cable"></div>
      <a class="pildora-tut" href="n1-magenta.html" style="${ROSA}">
        <span class="pildora-tut__icono"><img src="assets/icono-perilla.svg" alt=""></span>
        <span class="pildora-tut__texto">GIRÁ LA PERILLA Y EXPLORÁ ESTA SECCIÓN</span>
      </a>
    </main>`,
});

console.log('ok');
