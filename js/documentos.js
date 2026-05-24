// ══ TABLA PROYECTOS ══
var PROY_DEFAULT=['Arquitectura','Cálculo estructural','Eléctrico','Climatización (Clima)','Sanitario','Seguridad contra Incendio'];
var HIST_TIPOS=[{v:'ingreso',l:'📥 Ingreso a revisión'},{v:'observacion',l:'📋 Emisión de observaciones'},{v:'reingreso',l:'🔄 Reingreso (corrección)'},{v:'aprobacion',l:'✅ Aprobación final'}];
function crearHistRow() {
  var r = document.createElement('div'); r.className = 'hist-row';
  // Build with DOM to allow event listeners
  var sel = document.createElement('select');
  HIST_TIPOS.forEach(function(t){
    var opt = document.createElement('option'); opt.value = t.v; opt.textContent = t.l; sel.appendChild(opt);
  });
  var dateInp = document.createElement('input'); dateInp.type = 'date';
  dateInp.style.cssText = 'width:128px;flex-shrink:0;padding:4px 7px;font-size:12px;border:1.5px solid var(--gris-b);border-radius:6px;font-family:inherit;outline:none;';
  var rmBtn = document.createElement('button'); rmBtn.className = 'btn-rm-hist'; rmBtn.textContent = '×';
  rmBtn.addEventListener('click', function(){ rmHistRow(rmBtn); });
  // Auto-sync: when type = aprobacion and date is set, replicate to Fecha Aprobación column
  function syncAprobacion() {
    var tr = r.closest('tr');
    if (!tr) return;
    // Sync fecha aprobacion column when tipo=aprobacion
    var fechaApro = tr.querySelectorAll('td')[3] && tr.querySelectorAll('td')[3].querySelector('input[type=date]');
    if (fechaApro) {
      if (sel.value === 'aprobacion' && dateInp.value) {
        fechaApro.value = dateInp.value;
      } else if (sel.value !== 'aprobacion' && fechaApro.value === dateInp.value && dateInp.value) {
        fechaApro.value = '';
      }
    }
    // Auto-update semaforo based on historial state
    updateProySemaforo(tr);
  }
  sel.addEventListener('change', syncAprobacion);
  dateInp.addEventListener('change', syncAprobacion);
  r.appendChild(sel); r.appendChild(dateInp); r.appendChild(rmBtn);
  return r;
}
function rmHistRow(btn) {
  var b = btn.closest('.hist-block');
  if (b && b.querySelectorAll('.hist-row').length > 1) btn.closest('.hist-row').remove();
}
function addProyRow(txt) {
  var tr = document.createElement('tr');
  var tdS = document.createElement('td'); tdS.innerHTML = '<div class="sem-cell"><button class="sem-btn rojo" onclick="cicloSem(this)"></button></div>';
  var tdE = document.createElement('td'); tdE.innerHTML = '<input type="text" value="' + txt + '" placeholder="Especialidad">';
  var tdH = document.createElement('td');
  var blk = document.createElement('div'); blk.className = 'hist-block'; blk.appendChild(crearHistRow());
  var bA = document.createElement('button'); bA.className = 'btn-add-hist'; bA.textContent = '+ Agregar revisión';
  bA.onclick = function(){ blk.insertBefore(crearHistRow(), bA); }; blk.appendChild(bA); tdH.appendChild(blk);
  var tdA = document.createElement('td'); tdA.innerHTML = '<input type="date">';
  var tdC = document.createElement('td'); tdC.innerHTML = '<input type="text" placeholder="Observaciones...">';
  var tdX = document.createElement('td'); tdX.innerHTML = '<button class="btn-rm" onclick="rmProyRow(this)">×</button>';
  tr.appendChild(tdS); tr.appendChild(tdE); tr.appendChild(tdH); tr.appendChild(tdA); tr.appendChild(tdC); tr.appendChild(tdX);
  document.getElementById('proy-tbody').appendChild(tr);
}
function rmProyRow(btn) {
  var tb = document.getElementById('proy-tbody');
  if (tb.querySelectorAll('tr').length > 1) btn.closest('tr').remove();
}
PROY_DEFAULT.forEach(function(p){ addProyRow(p); });