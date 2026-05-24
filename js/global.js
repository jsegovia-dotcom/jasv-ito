
// ══ ESTADO GLOBAL ══
var cur = 0;
var csChart = null;
var sgPuntoCount = 0;

// ══ NAVEGACIÓN ══
function irA(n) {
  document.getElementById('sec-' + cur).classList.remove('active');
  var steps = document.querySelectorAll('.step');
  steps[cur].classList.remove('active');
  steps[cur].classList.add('done');
  cur = n;
  document.getElementById('sec-' + n).classList.add('active');
  for (var i = 0; i < steps.length; i++) {
    steps[i].classList.remove('active');
    if (i === n) { steps[i].classList.add('active'); steps[i].classList.remove('done'); }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Auto-guardar silencioso al navegar entre secciones
  if (typeof obraActual !== 'undefined' && obraActual && informeActual) {
    (function(){
      var obras=cargarObras();
      var obra=obras.find(function(o){return o.id===obraActual.id;});
      if(!obra) return;
      var inf=(obra.informes||[]).find(function(i){return i.id===informeActual.id;});
      if(!inf) return;
      inf.estado=recolectarEstado();
      inf.semana=document.getElementById('semana-informe')?document.getElementById('semana-informe').value:'';
      obraActual=obra;
      guardarObras(obras);
    })();
  }
  // Hooks por sección
  if (n === 4) onEnterCurvaS();
  if (n === 5) onEnterSituacion();
}
