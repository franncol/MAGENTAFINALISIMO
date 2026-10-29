// Quiz de 5 preguntas con 4 opciones (pads 1 a 4 / DO, RE, MI, FA).
// Al elegir se marca la respuesta (verde si es correcta, roja si no) y se muestra el dato curioso.
const PREGUNTAS = [
  {
    titulo: '¿Cómo aprende la IA de Magenta?',
    ancho: 858,
    opciones: ['Copiando una canción', 'Leyendo partituras a mano', 'Analizando canciones, audio y MIDI', 'Escuchando a un músico en vivo'],
    correcta: 2,
    dato: 'Los modelos aprenden de datos musicales e identifican patrones y relaciones. Después los usan para generar nuevas secuencias y sonidos',
  },
  {
    titulo: 'Para generar música, ¿qué hace la IA paso a paso?',
    opciones: ['Calcula probabilidades del próximo evento musical y elige uno', 'Busca la melodía más parecida en internet', 'Mezcla dos canciones completas', 'Repite la nota anterior'],
    correcta: 0,
    dato: 'Predice cuál podría ser el siguiente evento musical y lo elige. Repite el proceso para construir una secuencia.',
  },
  {
    titulo: '¿Qué guarda un archivo MIDI?',
    opciones: ['El sonido grabado', 'La letra de la canción', 'El volumen de la sala', 'Qué nota se toca, cuándo y con qué intensidad'],
    correcta: 3,
    dato: 'MIDI no guarda el sonido. Guarda información de la interpretación: qué nota se toca, cuándo empieza y termina, y con qué intensidad.',
  },
  {
    titulo: '¿Qué pasa si subís la temperatura?',
    opciones: ['Más predecible', 'Más variado y experimental', 'Más lento', 'La IA se detiene'],
    correcta: 1,
    dato: 'Temperatura baja = predecible.\nAlta = experimental.',
  },
  {
    titulo: '¿Qué hace Melody Continue?',
    centro: true,
    opciones: ['Une dos melodías', 'Cambia el instrumento', 'Borra el final', 'Continúa tu melodía'],
    correcta: 3,
    dato: 'Continue sigue tu melodía. Interpolate une dos.',
  },
];
const PADS = ['DO', 'RE', 'MI', 'FA'];
const ICONO_OK = 'assets/quiz/correcta.svg';
const ICONO_MAL = 'assets/quiz/incorrecta.svg';

const el = (id) => document.getElementById(id);
const resultados = JSON.parse(sessionStorage.getItem('quizParcial') || '[]'); // true / false por pregunta
let actual = resultados.length;
let respondida = false;

if (actual >= PREGUNTAS.length) { resultados.length = 0; actual = 0; }

function pintarProgreso() {
  const barras = PREGUNTAS.map((_, i) => {
    if (i < resultados.length) return `<i class="${resultados[i] ? 'ok' : 'mal'}"></i>`;
    return `<i class="${i === actual && !respondida ? 'actual' : ''}"></i>`;
  }).join('');
  el('progreso').innerHTML = `<span class="q-progreso__txt">PROGRESO</span>${barras}`;
}

function pintar() {
  const p = PREGUNTAS[actual];
  respondida = false;
  document.title = `Pregunta ${actual + 1} | Google Magenta`;
  el('etiqueta').textContent = `PREGUNTA 0${actual + 1}`;
  el('titulo').textContent = p.titulo;
  el('titulo').classList.toggle('q-titulo--centro', !!p.centro);
  el('titulo').style.maxWidth = p.ancho ? `${p.ancho}px` : '';

  el('opciones').innerHTML = p.opciones.map((txt, i) => `
    <button class="q-op ${i % 2 === 0 ? 'q-op--cian' : 'q-op--viol'}" data-i="${i}">
      <span class="q-op__pad">PAD ${i + 1} - ${PADS[i]}</span>
      <span class="q-op__texto">${txt}</span>
      <span class="q-op__marca"></span>
    </button>`).join('');
  el('opciones').querySelectorAll('.q-op').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); responder(Number(b.dataset.i)); }));

  el('dato-etq').hidden = true;
  el('dato-txt').textContent = 'ESPERANDO TU RESPUESTA - EL DATO CURIOSO APARECE AL ELEGIR';
  el('cta-txt').textContent = 'ELEGÍ CON LOS PADS 1 A 4';
  pintarProgreso();
}

function responder(i) {
  if (respondida) return;
  respondida = true;
  const p = PREGUNTAS[actual];
  const acierto = i === p.correcta;
  resultados.push(acierto);
  sessionStorage.setItem('quizParcial', JSON.stringify(resultados));

  el('opciones').querySelectorAll('.q-op').forEach((b, n) => {
    const marca = b.querySelector('.q-op__marca');
    if (n === p.correcta) {
      b.classList.add('correcta');
      marca.innerHTML = `<img src="${ICONO_OK}" alt="">CORRECTA`;
    } else if (n === i) {
      b.classList.add('incorrecta');
      marca.innerHTML = `<img src="${ICONO_MAL}" alt="">TU RESPUESTA`;
    } else {
      b.classList.add('apagada');
    }
  });

  el('dato-etq').hidden = false;
  el('dato-etq').textContent = acierto ? '¡CORRECTO! · DATO CURIOSO' : 'NO ERA ESA · DATO CURIOSO';
  el('dato-txt').textContent = p.dato;
  el('cta-txt').textContent = 'TOCÁ CUALQUIER PAD PARA SEGUIR';
  pintarProgreso();
}

function seguir() {
  if (actual + 1 < PREGUNTAS.length) {
    actual += 1;
    pintar();
  } else {
    sessionStorage.setItem('quizResultados', JSON.stringify(resultados));
    sessionStorage.removeItem('quizParcial');
    irA('cierre-1.html');
  }
}

// Pads 1 a 4 (teclas o clic): antes de responder eligen opción; después de responder siguen.
document.addEventListener('keydown', (e) => {
  if (!/^[1-4]$/.test(e.key)) return;
  respondida ? seguir() : responder(Number(e.key) - 1);
});
el('cta').addEventListener('click', (e) => { e.preventDefault(); if (respondida) seguir(); });
document.addEventListener('click', (e) => { if (respondida && !e.target.closest('#cta')) seguir(); });

pintar();
