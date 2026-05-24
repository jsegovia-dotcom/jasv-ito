// ══ PORTADA ══
function actualizarPortada() {
  var nro = document.getElementById('nro-informe').value;
  var obra = document.getElementById('nombre-obra').value;
  var edificio = document.getElementById('nombre-edificio').value;
  var mandante = document.getElementById('mandante').value;
  var contratista = document.getElementById('contratista').value;
  var fecha = document.getElementById('fecha-emision').value;
  document.getElementById('prev-tag').textContent = nro ? 'Informe ITO N° ' + String(nro).padStart(3,'0') : 'Informe ITO N° —';
  document.getElementById('prev-obra').textContent = obra || 'Nombre de la obra';
  document.getElementById('prev-edificio').textContent = edificio || 'Edificio —';
  document.getElementById('prev-mandante').textContent = mandante || '—';
  document.getElementById('prev-contratista').textContent = contratista || '—';
  if (fecha) {
    var d = new Date(fecha + 'T12:00:00');
    document.getElementById('prev-fecha').textContent = d.toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'});
  } else { document.getElementById('prev-fecha').textContent = '—'; }
}

// ══ PLAZOS ══
function calcularTermino() {
  var ini = document.getElementById('fecha-inicio').value;
  var dias = parseInt(document.getElementById('plazo-dias').value) || 0;
  if (ini && dias > 0) {
    var d = new Date(ini + 'T12:00:00');
    d.setDate(d.getDate() + dias - 1);
    document.getElementById('fecha-termino').value = d.toISOString().split('T')[0];
    var extra = parseInt(document.getElementById('aumento-dias').value) || 0;
    if (extra > 0) {
      var d2 = new Date(d); d2.setDate(d2.getDate() + extra);
      document.getElementById('fecha-termino-nueva').value = d2.toISOString().split('T')[0];
    }
  }
}
function toggleAumento() {
  var chk = document.getElementById('chk-aumento').checked;
  document.getElementById('aumento-box').style.display = chk ? 'block' : 'none';
  if (!chk) { document.getElementById('aumento-dias').value = ''; document.getElementById('fecha-termino-nueva').value = ''; }
}
function actualizarPlaceholderMonto() {
  document.getElementById('monto-valor').placeholder = document.getElementById('moneda').value === 'UF' ? 'Ej: 1.250,00' : 'Ej: 42.000.000';
}

// ══ PROFESIONALES ══
function addProf(id, cargo) {
  var c = document.getElementById(id);
  var r = document.createElement('div'); r.className = 'prof-row';
  r.innerHTML = '<input class="cargo" type="text" value="' + cargo + '" readonly><input type="text" placeholder="Nombre completo"><button class="btn-rm" onclick="rmProfRow(this)">×</button>';
  c.appendChild(r);
}
function addProfCustom(id) {
  var c = document.getElementById(id);
  var r = document.createElement('div'); r.className = 'prof-row';
  r.innerHTML = '<input class="cargo" type="text" placeholder="Cargo"><input type="text" placeholder="Nombre completo"><button class="btn-rm" onclick="rmProfRow(this)">×</button>';
  c.appendChild(r);
}
function rmProfRow(btn) {
  var c = btn.closest('[id$="-profs"]');
  if (c && c.querySelectorAll('.prof-row').length > 1) btn.closest('.prof-row').remove();
}

// ══ SEMÁFORO ══
function updateProySemaforo(tr) {
  if (!tr) return;
  var semBtn = tr.querySelector('.sem-btn');
  if (!semBtn) return;
  var histRows = tr.querySelectorAll('.hist-row');
  var hasAprobacion = false, hasAnyDate = false;
  histRows.forEach(function(hr) {
    var sel = hr.querySelector('select');
    var di  = hr.querySelector('input[type=date]');
    if (di && di.value) {
      hasAnyDate = true;
      if (sel && sel.value === 'aprobacion') hasAprobacion = true;
    }
  });
  if (hasAprobacion) {
    semBtn.className = 'sem-btn verde';
  } else if (hasAnyDate) {
    semBtn.className = 'sem-btn amarillo';
  } else {
    semBtn.className = 'sem-btn rojo';
  }
}

function cicloSem(btn) {
  if (btn.classList.contains('rojo')) { btn.classList.remove('rojo'); btn.classList.add('amarillo'); }
  else if (btn.classList.contains('amarillo')) { btn.classList.remove('amarillo'); btn.classList.add('verde'); }
  else { btn.classList.remove('verde'); btn.classList.add('rojo'); }
}

// ══ TABLA DOCUMENTACIÓN ══
var DOC_DEFAULT=['Entrega de oficinas a la constructora','Entrega de planos a la Administración del Edificio','Validación de Proyectos','Entrega de la documentación de los trabajadores','Pólizas de Garantía','Boletas de Garantía','Programación de Obras','Permiso de Obra Menor','Recepción de funcionamiento de Clima','Recepción de Obras'];
function addDocRow(txt) {
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><div class="sem-cell"><button class="sem-btn rojo" onclick="cicloSem(this)"></button></div></td><td><input type="text" value="' + txt + '" placeholder="Nombre del documento"></td><td><input type="date"></td><td><input type="text" placeholder="Observaciones..."></td><td><button class="btn-rm" onclick="rmDocRow(this)">×</button></td>';
  document.getElementById('doc-tbody').appendChild(tr);
}
function rmDocRow(btn) {
  var tb = document.getElementById('doc-tbody');
  if (tb.querySelectorAll('tr').length > 1) btn.closest('tr').remove();
}
DOC_DEFAULT.forEach(function(d) { addDocRow(d); });
