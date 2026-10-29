// Genera las pantallas del núcleo 2 (diseño nuevo) como páginas sueltas.
// Uso: node tools/gen-nucleo2.js
const fs = require('fs');
const path = require('path');
const raíz = path.join(__dirname, '..');
const A = 'assets/interactua';
const N = 'assets/n2';

const página = (file, title, cuerpo, sig) => fs.writeFileSync(path.join(raíz, file), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="transicion.js"></script>
  <title>${title} | Google Magenta</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@1,700&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="base.css">
  <link rel="stylesheet" href="interactua.css">
  <link rel="stylesheet" href="nucleo2.css">
  <link rel="stylesheet" href="transicion.css">
</head>
<body${sig ? ` data-sig="${sig}"` : ''}>
  <div class="stage" id="stage">
${cuerpo}
  </div>
  <script src="stage.js"></script>${sig ? '\n  <script src="siguiente.js"></script>' : ''}
</body>
</html>
`, 'utf8');

const pct = (t, r, b, l) => `top:${t}%;right:${r}%;bottom:${b}%;left:${l}%`;

/* ---------- Navegación lateral ---------- */
// items: [{ txt, href, top, h, on, sig }]
const nav = (top, alto, items) => `      <nav class="n2-nav" style="top:${top}px;height:${alto}px">
        <i class="n2-nav__linea"></i>
${items.map((it) => {
    const c = it.top + it.h / 2;
    return `        <a class="n2-nav__item${it.on ? ' on' : ''}${it.sig ? ' n2-nav__item--sig' : ''}" href="${it.href}" style="top:${it.top}px;height:${it.h}px">${it.txt}</a>
        <i class="n2-nav__cx${it.on ? ' on' : ''}" style="top:${c - 1}px"></i><i class="n2-nav__punto${it.on ? ' on' : ''}" style="top:${c - 9}px"></i>`;
  }).join('\n')}
      </nav>`;

/* ---------- ¿Cómo interactúa? (intro, tocar, transformar, generar) ---------- */
const NAV_A = [
  ['TOCAR', 'interactua-tocar.html'],
  ['TRANSFORMAR', 'interactua-transformar.html'],
  ['GENERAR', 'interactua-generar.html'],
  ['▶▶', 'apps-continue.html'],
];
const TOPS_A = {
  intro: [[0, 75], [140, 60], [265, 60], [390, 60]],
  tocar: [[0, 75], [140, 60], [265, 60], [390, 60]],
  transformar: [[0, 60], [125, 75], [265, 60], [390, 60]],
  generar: [[0, 60], [125, 60], [250, 75], [390, 60]],
};
const BLANCAS = [[0, 10.81], [12.43, 11.89], [25.95, 10.81], [37.84, 11.35], [50.81, 11.35], [63.24, 10.81], [75.68, 11.89], [89.19, 10.81]];
const NEGRAS = [[8.65, 5.94], [20.54, 7.03], [45.95, 7.02], [58.38, 7.03], [71.35, 6.49]];
const NOTAS = [[13.79, 2.56, 67.82, 61.54], [81.61, 0, 0, 76.41], [72.41, 34.36, 9.2, 49.74], [27.59, 53.85, 54.02, 22.56], [58.62, 81.03, 22.99, 0], [0, 88.72, 87.36, 0]];

function pantallaA({ file, estado, activa, tarjetas, nota }) {
  const items = NAV_A.map(([txt, href], i) => ({ txt, href, top: TOPS_A[estado][i][0], h: TOPS_A[estado][i][1], on: activa === i, sig: i === 3 }));
  const t = (n, extra = '') => `<div class="n2-card n2-card--${n}${tarjetas[n - 1] === 1 ? ' on' : ''}${tarjetas[n - 1] === -1 ? ' apagada' : ''}" style="left:${[426, 748, 1074][n - 1]}px"></div>`;
  const piano = `<div class="n2-piano">${BLANCAS.map(([l, w], i) => `<i class="${i === 3 ? 'az' : ''}" style="left:${l}%;width:${w}%"></i>`).join('')}${NEGRAS.map(([l, w]) => `<i class="n" style="left:${l}%;width:${w}%"></i>`).join('')}</div>`;
  const notas = `<div class="n2-notas${nota === 'cian' ? ' n2-notas--cian' : ''}">${NOTAS.map(([a, b, c, d]) => `<i style="${pct(a, b, c, d)}"></i>`).join('')}</div>`;
  const dy = estado === 'intro' ? -45 : 0;
  const pildora = estado === 'intro'
    ? `\n      <a class="pildora-paso" href="interactua-tocar.html" style="--p-bg:rgba(79,123,255,.4);--p-c:#4f7bff;--p-g:rgba(79,123,255,.75)">
        <span class="pildora-paso__icono"><img src="${A}/icono-volumen.svg" alt=""></span>
        <span class="pildora-paso__texto">DESLIZÁ EL VOLUMEN PARA CONTINUAR</span>
      </a>`
    : '';
  página(file, '¿Cómo interactúa?', `    <img class="bg bg--tenue" src="${A}/fondo-tenue.png" alt="">
    <main class="diseno">
      <h1 class="n2-titulo">¿Cómo interactúa?</h1>
      <p class="n2-bajada">Del piano tradicional a nuevas formas de crear música. Permiten tocar, transformar y generar melodías mediante modelos de inteligencia artificial.</p>
${nav(388, 450, items)}
      <div class="n2-grupo" style="--dy:${dy}px">
        ${t(1)}${t(2)}${t(3)}
        <p class="n2-etq" style="left:489.5px">01 · TOCAR</p>
        <p class="n2-pie" style="left:547px">Piano tradicional</p>
        <img class="abs" src="${A}/flecha.svg" alt="" style="left:686px;top:597px;width:44px;height:24px">
        <img class="abs" src="${A}/flecha.svg" alt="" style="left:1010px;top:597px;width:44px;height:24px">
        <p class="n2-etq" style="left:846.5px">02 · TRANSFORMAR</p>
        <p class="n2-pie" style="left:869px">La IA modifica</p>
        <p class="n2-etq" style="left:1149.5px">03 · GENERAR</p>
        <p class="n2-pie" style="left:1195.5px">La IA crea</p>
        ${piano}
        <img class="abs" src="${N}/${estado === 'transformar' ? 'transformar-b' : 'transformar-a'}.svg" alt="" style="left:771px;top:576px;width:195px;height:68px">
        ${notas}
      </div>${pildora}
    </main>`);
}
pantallaA({ file: 'interactua-tocar.html', estado: 'tocar', activa: 0, tarjetas: [1, 0, 0] });
pantallaA({ file: 'interactua-transformar.html', estado: 'transformar', activa: 1, tarjetas: [1, 1, 0] });
pantallaA({ file: 'interactua-generar.html', estado: 'generar', activa: 2, tarjetas: [1, 1, 1], nota: 'cian' });

/* ---------- Aplicaciones de Magenta ---------- */
const NAV_B = [
  ['CONTINUE', 'apps-continue.html'],
  ['GENERATE', 'apps-generate.html'],
  ['INTERPOLACIÓN', 'apps-interpolacion.html'],
  ['TEMPERATURA', 'apps-temperatura.html'],
  ['▶▶', 'genie-info.html'],
];
const TOPS_B = [
  [[0, 75], [140, 60], [265, 60], [390, 60], [515, 60]],
  [[0, 60], [125, 75], [265, 60], [390, 60], [515, 60]],
  [[0, 60], [125, 60], [250, 75], [390, 60], [515, 60]],
  [[0, 60], [125, 60], [250, 60], [375, 75], [515, 60]],
];
const inset = (n) => `top:${n[0]}%;right:${n[1]}%;bottom:${n[2]}%;left:${n[3]}%`;

function pantallaB({ file, idx, titulo, nombre, desc, panel, grafico, cuerpo = '' }) {
  const items = NAV_B.map(([txt, href], i) => ({ txt, href, top: TOPS_B[idx][i][0], h: TOPS_B[idx][i][1], on: idx === i, sig: i === 4 }));
  página(file, `Aplicaciones de Magenta: ${titulo}`, `    <img class="bg" src="${A}/fondo.png" alt="">
    <main class="diseno">
      <h1 class="a-titulo">Aplicaciones de Magenta</h1>
${nav(304, 575, items)}
      <div class="n2-caja"></div>
      <div class="n2-panel" style="left:${panel[0]}px;width:${panel[1]}px"></div>
      <h2 class="n2-nombre${nombre.grande ? ' n2-nombre--grande' : ''}" style="left:${nombre.x}px">${nombre.txt}</h2>
      <p class="n2-desc" style="top:${desc.top}px;width:${desc.w}px">${desc.txt}</p>
${grafico}${cuerpo}
    </main>`);
}

// Continue
const CONT = [
  ['#60f2ff', '#26c3d1', [53.26, 30.77, 41.24, 54.34], 1],
  ['#ff3dbf', '#ff3dbf', [67.35, 87.59, 27.15, 0], 1],
  ['#ff3dbf', '#ff3dbf', [51.89, 84.86, 42.61, 6.2], 1],
  ['#ff3dbf', '#ff3dbf', [57.39, 68.24, 37.11, 16.63], 1],
  ['#ff3dbf', '#ff3dbf', [42.61, 63.28, 51.89, 26.8], 1],
  ['#60f2ff', '#26c3d1', [39.86, 25.31, 54.64, 63.77], 1],
  ['#60f2ff', '#26c3d1', [50.52, 3.97, 43.99, 85.11], 1],
  ['#60f2ff', '#26c3d1', [62.89, 7.94, 31.62, 72.21], .75],
  ['#32e7f1', '#26c3d1', [39.86, 0, 54.64, 87.59], .5],
];
pantallaB({
  file: 'apps-continue.html', idx: 0, titulo: 'Continue',
  nombre: { txt: 'CONTINUE', x: 634, grande: true },
  desc: { top: 461, w: 372, txt: 'Amplía la música con nuevos sonidos a partir de lo que tocaste.' },
  panel: [847, 447],
  grafico: `      <div class="abs" style="left:870px;top:340px;width:403px;height:291px">
        <div class="abs" style="left:14.14%;right:13.4%;top:0;aspect-ratio:352/351;filter:blur(2px)"><img class="abs" style="inset:0;width:100%;height:100%;object-fit:cover;object-position:bottom;opacity:.64;mix-blend-mode:difference" src="${N}/circulo.png" alt=""></div>
${CONT.map(([c, s, i, o]) => `        <i class="n2-b" style="${inset(i)};background:${c};border-radius:2px;box-shadow:0 0 9.6px ${s}${o < 1 ? `;opacity:${o}` : ''}"></i>`).join('\n')}
      </div>`,
});

// Generate
pantallaB({
  file: 'apps-generate.html', idx: 1, titulo: 'Generate',
  nombre: { txt: 'GENERATE', x: 599 },
  desc: { top: 444, w: 372, txt: 'Lo más parecido a un generador de notas: entrenado con millones de melodías.' },
  panel: [847, 447],
  grafico: `      <img class="abs" src="${N}/generate.svg" alt="" style="left:916px;top:355px;width:310px;height:261px">`,
});

// Interpolación
const MAG = [[36.54, 90, 15.38, 0], [0, 72.14, 51.92, 17.86], [51.92, 53.57, 0, 36.43], [1.92, 35.71, 50, 54.29], [36.54, 17.86, 15.38, 72.14], [1.92, 0, 50, 90]];
const CIA = [[44.64, 90, 10.71, 0], [23.21, 72.14, 32.14, 17.86], [0, 53.57, 55.36, 36.43], [33.93, 35.71, 21.43, 54.29], [55.36, 17.86, 0, 72.14], [21.43, 0, 33.93, 90]];
const GRAD = 'linear-gradient(to bottom,#60f2ff,#ff3dbf)';
const MIX = [
  [[51.92, 31.12, 0, 63.07], GRAD], [[36.54, 20.75, 15.38, 73.44], '#60f2ff'], [[0, 10.37, 51.92, 83.82], '#60f2ff'], [[36.54, 0, 15.38, 94.19], '#60f2ff'],
  [[36.54, 94.19, 15.38, 0], '#ff3dbf'], [[0, 83.82, 51.92, 10.37], '#ff3dbf'], [[51.92, 73.03, 0, 21.16], '#ff3dbf'],
  [[1.92, 62.66, 50, 31.54], GRAD], [[36.54, 52.28, 15.38, 41.91], GRAD], [[1.92, 41.91, 50, 52.28], GRAD],
];
const grupo = (l, t, w, h, lista, color) => `      <div class="abs" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px">${lista.map((i) => `<i class="n2-n" style="${inset(i)};background:${color}"></i>`).join('')}</div>`;
const rot = (l, rotacion, escala, img) => `      <div class="n2-rot" style="left:${l}px;top:439.5px"><div style="rotate:${rotacion}deg;${escala ? 'scale:1 -1' : ''}"><img src="${N}/${img}" alt=""></div></div>`;
pantallaB({
  file: 'apps-interpolacion.html', idx: 2, titulo: 'Interpolación',
  nombre: { txt: 'INTERPOLACIÓN', x: 671 },
  desc: { top: 444, w: 372, txt: 'Une dos melodías separadas creando una intermedia.' },
  panel: [920, 374],
  grafico: `      <p class="n2-letra" style="left:1022px;color:#ff3dbf">A</p>
      <p class="n2-letra" style="left:1213px;color:#5ee9ff">B</p>
${rot(1116.48, 117.78, true, 'linea-a.svg')}
${rot(1116.48, 117.78, true, 'linea-a.svg')}
${rot(997.48, 62.22, false, 'linea-b.svg')}
${rot(997.48, 62.22, false, 'linea-b.svg')}
${grupo(948, 384, 140, 52, MAG, '#ff3dbf')}
${grupo(1128, 381, 140, 56, CIA, '#60f2ff')}
      <div class="abs" style="left:989px;top:561px;width:241px;height:52px">${MIX.map(([i, c]) => `<i class="n2-n" style="${inset(i)};background:${c}"></i>`).join('')}</div>`,
});

// Temperatura
const ALTA = [[42, 93.4, 0, 0], [58, 81.73, 0, 11.68], [58, 46.7, 0, 46.7], [58, 0, 0, 93.4], [42, 35.03, 0, 58.38], [42, 11.68, 0, 81.73], [42, 70.05, 0, 23.35], [18, 58.38, 0, 35.03], [0, 23.35, 0, 70.05]];
const BAJA = [[0, 88.41, 0, 0], [0, 70.73, 0, 17.68], [0, 53.05, 0, 35.37], [0, 35.37, 0, 53.05], [0, 17.68, 0, 70.73], [0, 0, 0, 88.41]];
pantallaB({
  file: 'apps-temperatura.html', idx: 3, titulo: 'Temperatura',
  nombre: { txt: 'TEMPERATURA', x: 660 },
  desc: { top: 444, w: 380, txt: 'Define qué tan predecible o arriesgada es la generación.' },
  panel: [920, 374],
  grafico: `      <p class="n2-temp-t" style="left:1204px;top:427px">más predecible</p>
      <p class="n2-temp-t" style="left:1193px;top:576px">más variada</p>
      <div class="abs" style="left:1125px;top:365px;width:0;height:237px;display:flex;align-items:center;justify-content:center"><div style="position:relative;flex:none;width:237px;height:0;transform:rotate(-90deg)"><img src="${A}/linea-temp.svg" alt="" style="position:absolute;max-width:none;left:-1.27%;top:-4px;width:102.54%;height:calc(100% + 7px)"></div></div>
      <div class="abs" style="left:940px;top:405px;width:164px;height:39px">${BAJA.map((i) => `<i class="n2-temp-b" style="${inset(i)}"></i>`).join('')}</div>
      <div class="abs" style="left:933px;top:549px;width:178px;height:44px">${ALTA.map((i) => `<i class="n2-temp-c" style="${inset(i)}"></i>`).join('')}</div>`,
});

/* ---------- Piano Genie ---------- */
const BOTONES = [[9.73, 72.79, 81.42, 18.14], [9.73, 54.2, 81.42, 36.73], [9.73, 35.6, 81.42, 55.33], [9.73, 17.01, 81.42, 73.92], [27.88, 72.79, 63.27, 18.14], [27.88, 54.2, 63.27, 36.73], [27.88, 35.6, 63.27, 55.33], [27.88, 17.01, 63.27, 73.92]];
const TB = [[0, 45], [50, 45], [100, 44], [150, 44], [200, 44], [250, 44], [299, 45], [349, 45]];
const TN = [33, 82, 181, 231, 280];
página('genie-info.html', 'Piano Genie', `    <img class="bg" src="${A}/fondo.png" alt="">
    <main class="diseno">
      <h1 class="gi-titulo">Piano GENIE</h1>
      <p class="gi-t" style="left:368px;top:180px;width:714px">Un modelo de IA que actúa como un "traductor" musical</p>
      <p class="gi-t" style="left:626px;top:274px;width:246px"><span style="color:#dcd6f2">Tus</span> <b>8 botones</b></p>
      <div class="gi-botones">
        <div class="gi-botones__caja"></div>
${BOTONES.map((i, n) => `        <div class="b" style="${inset(i)}"><img src="${N}/b${n + 1}.svg" alt=""></div>`).join('\n')}
        <div class="gi-teclas">${TB.map(([l, w]) => `<i style="left:${l}px;width:${w}px"></i>`).join('')}${TN.map((l) => `<i class="n" style="left:${l}px"></i>`).join('')}</div>
      </div>
      <img class="abs" src="${N}/chevron.svg" alt="" style="left:698px;top:548px;width:47.94px;height:19.169px;overflow:visible">
      <p class="gi-t" style="left:540px;top:779px;width:446px"><span style="color:#dcd6f2">Piano tradicional</span> <b>· 88 teclas</b></p>
      <p class="gi-t" style="left:230px;top:873px;width:974px;text-align:center">Predice <b>notas</b> que encajan con la armonía y la escala, para generar combinaciones <b>musicalmente coherentes</b>. Incluso si no sabés tocar el piano.</p>
    </main>`, 'ai-duet.html');

/* ---------- AI Duet ---------- */
const DB = [72, 145, 218, 291, 364, 437, 510, 583];
const DN = [122, 196, 338, 411, 487];
página('ai-duet.html', 'AI Duet', `    <img class="bg" src="${A}/fondo.png" alt="">
    <main class="diseno">
      <h1 class="gi-titulo" style="top:120px">ai duet</h1>
      <p class="gi-t" style="left:479px;top:211px;width:714px">Tocás unas notas y la <b>IA</b> te responde.</p>
      <div class="ad-piano">
        <div class="ad-turno ad-turno--tu">Tu turno</div>
        <div class="ad-turno ad-turno--ia">Turno de la IA</div>
        <div class="ad-piano__caja"></div>
        ${DB.map((l) => `<i style="left:${l}px"></i>`).join('')}${DN.map((l) => `<i class="n" style="left:${l}px"></i>`).join('')}
      </div>
      <p class="gi-t" style="left:358px;top:781px;width:812px">La IA completa tu melodía e imita tu estilo, en tiempo real.</p>
      <p class="gi-t" style="left:220px;top:833px;width:1000px;text-align:center">Una forma de explorar cómo una máquina improvisa con una persona.</p>
    </main>`, 'ahora-te-toca.html');

console.log('ok');
