# Cómo usar la web con el Arduino

1. Subí `consola_v10.ino` a la placa (cerrá el Monitor Serie después).
2. Abrí **consola.html** (con Live Server, Chrome o Edge) — NO index.html. Tocá "Conectar Arduino" una vez; después se reconecta solo.
3. Para probar sin placa: abrí la consola del navegador y usá `Consola.simular('PERILLA:DER')`, `Consola.simular('JACK:1')`, `Consola.simular('BOTON_ON:1')`, etc. (dentro del iframe).

Tablero: 1 perilla (con pulsador), 1 slider, 6 botones (`CANT_BOTONES` en consola.js, subirlo a 8), 1 jack con un cable.

## Recorrido
| Pantalla | Cómo pasa |
|---|---|
| index (Frecuencia Futura) | cualquier botón |
| bienvenido | solo, a los 8 s |
| equipo-jacks | enchufar el cable |
| equipo-perilla | girar o apretar la perilla un poco (1 toc) |
| equipo-slider | mover el slider un rato (recorrido 90, ignora temblor) |
| equipo-botones | 4 pulsaciones (cualquier pad) |
| Núcleo 1 (como-funciona … motor) | perilla a la derecha (2 clicks) = siguiente, a la izquierda (1 toc) = atrás |
| grafico | slider elige 1 de 4 opciones; perilla → progreso |
| progreso / progreso-2 | sacar el cable y volver a enchufarlo |
| Núcleo 2 (tabs) | la POSICIÓN del slider elige la tab, al instante y sin recargar (las tabs son una sola pantalla) (arriba=100=primera; 3 zonas, luego 4); la perilla solo pasa cuando se vieron todas |
| genie-info, ai-duet, ahora-te-toca | perilla (izquierda = atrás) |
| piano-genie | los botones tocan el pianito; perilla o 3 s después de la primera nota pasa |
| Núcleo 3 (ponete-a-prueba, práctica 1 y 2, avisos) | todo con pads: 1 y 2 dan vuelta las fichas, cualquier otro pad sigue |
| quiz | pads 1–4 eligen; ya respondida, cualquier pad pasa a la siguiente |
| cierre-2 (gracias) | desconectar el cable → vuelve a index |

Los umbrales (clicks, recorrido del slider, pausas) son constantes al principio de consola.js.


## Perilla
El Arduino manda `PERILLA:DER`, `PERILLA:IZQ` (hacia dónde giró) y `PERILLA:CLICK` (apretada). Si derecha/izquierda te quedan al revés, `PERILLA_INVERTIDA = true` en el .ino. Sensibilidad: `PASOS_POR_CLICK` (2 = normal, 1 = más sensible, 4 = más dura).

## Si la perilla no avisa DER/IZQ
Subí `consola_v10.ino`, abrí el Monitor Serie (115200), escribí `DIAG` y Enter, y girá la perilla: tienen que cambiar `CLK(D2)` y `DT(D3)`. Si al girar cambia `SW(D4)`, o no cambia nada, los cables CLK/DT/SW están en otros pines que los de la guía. Escribí `DIAG` de nuevo para apagarlo y cerrá el Monitor.
