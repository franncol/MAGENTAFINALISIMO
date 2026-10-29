/*
  CONSOLA DE NÚCLEOS v10 (base: v2; la perilla se lee filtrando rebotes) - Arduino UNO
  ----------------------------------------------------------------
  El Arduino funciona como un "control remoto": AVISA todo lo que pasa
  (cable, perilla, deslizante, botones) y la PÁGINA decide qué hacer
  y qué LED prender. Así la lógica (pantallas, orden, tiempos) se cambia en la
  página sin tener que volver a subir este programa.

  Conexión con la notebook: USB, 115200 baudios, un mensaje por línea.

  Cambios respecto de la v2 (para que coincida con el tablero armado):
    - Un solo jack (antes 3).
    - Botones directos a pines digitales (antes 5-8 compartían A4/A5 con resistencias).
    - LEDs en A1 a A4.
    - Sin sensor de movimiento.

  ===================== CONEXIONES =====================
  (todo lo que dice GND va a la fila azul del protoboard; 5V a la fila roja)
    Perilla (encoder):  CLK -> D2   DT -> D3   SW -> D4   + -> 5V   GND -> GND
    Jack del cable:     patita 1 del par -> D5   patita 2 -> GND   (las demás patitas libres)
    Deslizante:         un extremo -> 5V   cursor -> A0   otro extremo -> GND
    Botones arcade:     1=D6  2=D7  3=D8  4=D9  5=D10  6=D11   (otra patita de cada botón -> GND)
                        (7=D12 y 8=D13 ya están previstos: al conectarlos, poné NUM_BOTONES = 8)
    LEDs (cada uno con resistencia de 220 ohm en la patita larga; patita corta -> GND):
                        jack -> A1   perilla -> A2   deslizante -> A3   piano -> A4

  ===================== MENSAJES QUE MANDA =====================
    LISTO               arrancó (después manda JACK y FADER actuales)
    JACK:1 / JACK:0     el cable está enchufado / no hay cable
    PERILLA:DER         un click de la perilla a la DERECHA
    PERILLA:IZQ         un click de la perilla a la IZQUIERDA
    PERILLA:CLICK       apretaron la perilla (el pulsador)
    VERSION:10           qué versión de este programa está cargada
    FADER:n             posición del deslizante, de 0 (abajo) a 100 (arriba)
    BOTON_ON:n          apretaron el botón n (1 = izquierda/grave ... 6 u 8 = derecha/agudo)
    BOTON_OFF:n         soltaron el botón n

  ===================== COMANDOS QUE ACEPTA =====================
    LED:<cual>:<modo>   cual = JACK, PERILLA, SLIDER, PIANO o TODOS
                        modo = 0 (apagado), 1 (prendido), T (titila)
                        ejemplo: LED:PERILLA:T
    ESTADO              vuelve a mandar JACK y FADER
    DIAG                (para probar la perilla) muestra en crudo D2, D3 y D4; mandalo otra vez para apagarlo

  No necesita librerías extra.
*/

// ===================== PINES =====================
const uint8_t PIN_ENC_A  = 2;
const uint8_t PIN_ENC_B  = 3;
const uint8_t PIN_ENC_SW = 4;
const uint8_t PIN_JACK   = 5;
const uint8_t PIN_FADER  = A0;
const uint8_t PIN_BOTON[8] = {6, 7, 8, 9, 10, 11, 12, 13};   // botones 1 a 8
const uint8_t PIN_LED[4]   = {A1, A2, A3, A4};               // jack, perilla, deslizante, piano

// ===================== AJUSTES =====================
const uint8_t NUM_BOTONES = 6;       // cuántos botones hay conectados (hasta 8)
const bool JACK_INVERTIDO  = false;  // si el cable funciona al revés (detecta "enchufado" sin cable), poné true
const bool FADER_INVERTIDO = false;  // si el deslizante va al revés, poné true
const int8_t PASOS_POR_CLICK = 4;    // pasos por mensaje (un "toc" normal = 4). Si tu perilla da menos por toc, igual responde: un giro de 2 pasos avisa al frenar
const unsigned long ENC_ESTABLE_US = 1500;   // una señal tiene que quedarse quieta este tiempo para valer (filtra rebotes). Si hay giros fantasma, subilo (3000)
const bool PERILLA_INVERTIDA = false; // si al girar a la derecha dice IZQ (y al revés), poné true

const unsigned long REBOTE_MS      = 30;
const unsigned long JACK_ENTRA_MS  = 80;   // tiempo para aceptar que enchufaron el cable
const unsigned long JACK_SALE_MS   = 600;  // tiempo para aceptar que lo sacaron (evita falsos contactos)
const unsigned long PARPADEO_MS    = 350;

// ===================== ESTADO =====================
const int8_t TABLA_ENC[16] = {0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0};
uint8_t encPrev = 0, encCandidato = 0;   // estado aceptado / estado que se está confirmando
int8_t  encAcum = 0;
unsigned long encCandT = 0, encMovT = 0;   // micros del candidato / millis del último paso
bool diag = false;
uint8_t diagPrev = 255;

bool swEstable = HIGH, swLectura = HIGH;
unsigned long swCambio = 0;

bool jackActual = false, jackCandidato = false;
unsigned long jackCambio = 0;

float faderFiltrado = 0;
int faderUltimo = -10;

uint8_t botonesEstables = 0, botonesLectura = 0;
unsigned long botonesCambio[8];

uint8_t ledModo[4] = {0, 0, 0, 0};   // 0 apagado, 1 prendido, 2 titila

char buf[28];
uint8_t bufLen = 0;

void leerSerie();
void leerJack();
void leerPerilla();
void leerFader(bool forzar);
void leerBotones();
void actualizarLeds();
void procesarComando(char* cmd);
void mandarEstado();

// (la perilla se lee dentro de leerPerilla(), filtrando rebotes; sin interrupciones)

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);

  pinMode(PIN_ENC_A, INPUT_PULLUP);
  pinMode(PIN_ENC_B, INPUT_PULLUP);
  pinMode(PIN_ENC_SW, INPUT_PULLUP);
  pinMode(PIN_JACK, INPUT_PULLUP);
  for (uint8_t i = 0; i < NUM_BOTONES; i++) pinMode(PIN_BOTON[i], INPUT_PULLUP);
  for (uint8_t i = 0; i < 8; i++) botonesCambio[i] = 0;
  for (uint8_t i = 0; i < 4; i++) pinMode(PIN_LED[i], OUTPUT);

  encPrev = encCandidato = (digitalRead(PIN_ENC_A) << 1) | digitalRead(PIN_ENC_B);

  // Prueba de LEDs: se prenden los 4 medio segundo
  for (uint8_t i = 0; i < 4; i++) digitalWrite(PIN_LED[i], HIGH);
  delay(500);
  for (uint8_t i = 0; i < 4; i++) digitalWrite(PIN_LED[i], LOW);

  faderFiltrado = analogRead(PIN_FADER);

  // Estado inicial del cable (sin esperar el rebote)
  bool alto = digitalRead(PIN_JACK) == HIGH;
  jackActual = JACK_INVERTIDO ? !alto : alto;
  jackCandidato = jackActual;

  Serial.println("LISTO");
  Serial.println("VERSION:10");
  mandarEstado();
}

void loop() {
  leerSerie();
  leerJack();
  leerPerilla();
  leerFader(false);
  leerBotones();
  actualizarLeds();
}

void mandarEstado() {
  Serial.print("JACK:");      Serial.println(jackActual ? 1 : 0);
  leerFader(true);
}

// ===================== JACK =====================
// Un solo cable: JACK:1 al enchufarlo, JACK:0 al sacarlo.
void leerJack() {
  bool alto = digitalRead(PIN_JACK) == HIGH;
  bool lectura = JACK_INVERTIDO ? !alto : alto;
  unsigned long ahora = millis();
  if (lectura != jackCandidato) { jackCandidato = lectura; jackCambio = ahora; }
  if (jackCandidato == jackActual) return;
  unsigned long espera = jackCandidato ? JACK_ENTRA_MS : JACK_SALE_MS;
  if (ahora - jackCambio < espera) return;
  jackActual = jackCandidato;
  Serial.print("JACK:");
  Serial.println(jackActual ? 1 : 0);
}

// ===================== PERILLA =====================
void leerPerilla() {
  uint8_t ahoraEnc = (digitalRead(PIN_ENC_A) << 1) | digitalRead(PIN_ENC_B);
  unsigned long us = micros();
  unsigned long ms = millis();
  if (ahoraEnc != encCandidato) { encCandidato = ahoraEnc; encCandT = us; }          // cambió: empezar a confirmar
  else if (encCandidato != encPrev && us - encCandT >= ENC_ESTABLE_US) {             // se mantuvo estable: aceptarlo
    int8_t d = TABLA_ENC[(encPrev << 2) | encCandidato];
    encPrev = encCandidato;
    if (PERILLA_INVERTIDA) d = -d;
    if (d != 0) {
      encAcum += d;
      encMovT = ms;
      if (encAcum >= PASOS_POR_CLICK)       { Serial.println("PERILLA:DER"); encAcum = 0; }
      else if (encAcum <= -PASOS_POR_CLICK) { Serial.println("PERILLA:IZQ"); encAcum = 0; }
    }
  }
  // giro más corto que un "toc" completo (perillas de 2 pasos): avisar cuando se frena
  if (encAcum != 0 && ms - encMovT > 120) {
    if (encAcum >= 2)       Serial.println("PERILLA:DER");
    else if (encAcum <= -2) Serial.println("PERILLA:IZQ");
    encAcum = 0;
  }

  bool sw = digitalRead(PIN_ENC_SW);
  unsigned long ahora = millis();
  if (sw != swLectura) { swLectura = sw; swCambio = ahora; }
  if (ahora - swCambio > REBOTE_MS && sw != swEstable) {
    swEstable = sw;
    if (swEstable == LOW) Serial.println("PERILLA:CLICK");
  }
}

// ===================== DESLIZANTE =====================
void leerFader(bool forzar) {
  faderFiltrado = faderFiltrado * 0.85 + analogRead(PIN_FADER) * 0.15;
  int pct = map((int)(faderFiltrado + 0.5), 0, 1023, 0, 100);
  if (FADER_INVERTIDO) pct = 100 - pct;
  if (forzar || abs(pct - faderUltimo) >= 2) {
    faderUltimo = pct;
    Serial.print("FADER:");
    Serial.println(pct);
  }
}

// ===================== BOTONES =====================
void leerBotones() {
  uint8_t crudo = 0;
  for (uint8_t i = 0; i < NUM_BOTONES; i++) {
    if (digitalRead(PIN_BOTON[i]) == LOW) crudo |= 1 << i;
  }

  unsigned long ahora = millis();
  for (uint8_t i = 0; i < NUM_BOTONES; i++) {
    uint8_t bit = 1 << i;
    if ((crudo & bit) != (botonesLectura & bit)) { botonesLectura ^= bit; botonesCambio[i] = ahora; }
    if (ahora - botonesCambio[i] > REBOTE_MS && (botonesLectura & bit) != (botonesEstables & bit)) {
      botonesEstables ^= bit;
      Serial.print((botonesEstables & bit) ? "BOTON_ON:" : "BOTON_OFF:");
      Serial.println(i + 1);
    }
  }
}

// ===================== LEDS =====================
void actualizarLeds() {
  bool parpadeo = (millis() / PARPADEO_MS) % 2;
  for (uint8_t i = 0; i < 4; i++) {
    bool on = ledModo[i] == 1 || (ledModo[i] == 2 && parpadeo);
    digitalWrite(PIN_LED[i], on ? HIGH : LOW);
  }
}

// ===================== COMANDOS DESDE LA NOTEBOOK =====================
void leerSerie() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (bufLen) { buf[bufLen] = 0; procesarComando(buf); bufLen = 0; }
    } else if (bufLen < sizeof(buf) - 1) {
      buf[bufLen++] = toupper(c);
    }
  }
}

void procesarComando(char* cmd) {
  if (strcmp(cmd, "ESTADO") == 0) { mandarEstado(); return; }
  if (strcmp(cmd, "DIAG") == 0) { diag = !diag; diagPrev = 255; Serial.println(diag ? "DIAG:ON" : "DIAG:OFF"); return; }
  if (strncmp(cmd, "LED:", 4) != 0) return;

  char* nombre = cmd + 4;
  char* dosPuntos = strchr(nombre, ':');
  if (!dosPuntos) return;
  *dosPuntos = 0;
  char m = dosPuntos[1];
  uint8_t modo = (m == '1') ? 1 : (m == 'T') ? 2 : 0;

  int cual = -1;
  if (strcmp(nombre, "JACK") == 0)         cual = 0;
  else if (strcmp(nombre, "PERILLA") == 0) cual = 1;
  else if (strcmp(nombre, "SLIDER") == 0 || strcmp(nombre, "DESLIZANTE") == 0) cual = 2;
  else if (strcmp(nombre, "PIANO") == 0)   cual = 3;

  if (strcmp(nombre, "TODOS") == 0) { for (uint8_t i = 0; i < 4; i++) ledModo[i] = modo; }
  else if (cual >= 0) ledModo[cual] = modo;
}
