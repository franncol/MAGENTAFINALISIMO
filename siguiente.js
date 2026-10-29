// Avanza a la pantalla indicada en <body data-sig="..."> al hacer clic en cualquier lugar (salvo links).
document.addEventListener('click', (e) => {
  const sig = document.body.dataset.sig;
  if (sig && !e.target.closest('a')) irA(sig);
});
document.addEventListener('keydown', (e) => {
  const sig = document.body.dataset.sig;
  if (sig && e.key === 'ArrowRight') irA(sig);
});
