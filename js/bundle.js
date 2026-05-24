
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
  if (typeof obraActual !== 'undefined' && obraActual && informeActual && !window._cargandoFormulario) {
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

// ══ CURVA S ══
function onEnterCurvaS() {
  var fi = document.getElementById('fecha-inicio').value;
  // Usar fecha término actualizada si hay aumento de plazo
  var chkA = document.getElementById('chk-aumento');
  var ftNva = chkA && chkA.checked ? document.getElementById('fecha-termino-nueva').value : '';
  var ft = ftNva || document.getElementById('fecha-termino').value;
  if (fi && !document.getElementById('cs-inicio').value) document.getElementById('cs-inicio').value = fi;
  if (ft && !document.getElementById('cs-termino').value) document.getElementById('cs-termino').value = ft;
  if (document.getElementById('cs-tbody').children.length === 0 && fi && ft) generarSemanas();
  else actualizarGrafico();
}
function proximoDiaCtrl(fecha, dia) {
  var d = new Date(fecha); var actual = d.getDay();
  var diff = dia - actual; if (diff < 0) diff += 7; if (diff === 0) diff = 0;
  d.setDate(d.getDate() + diff); return d;
}
function generarSemanas() {
  var iniVal = document.getElementById('cs-inicio').value;
  var terVal = document.getElementById('cs-termino').value;
  var diaCtrl = parseInt(document.getElementById('dia-control').value);
  if (!iniVal || !terVal) { alert('Ingresa primero las fechas de inicio y término.'); return; }
  var ini = new Date(iniVal + 'T12:00:00');
  var ter = new Date(terVal + 'T12:00:00');
  var prev = {};
  document.querySelectorAll('#cs-tbody tr').forEach(function(tr) {
    var fi2 = tr.querySelector('.cs-fi'); var fp = tr.querySelector('.cs-prog'); var fr = tr.querySelector('.cs-real');
    if (fi2 && fi2.value) prev[fi2.value] = { prog: fp ? fp.value : '', real: fr ? fr.value : '' };
  });
  var primera = proximoDiaCtrl(ini, diaCtrl);
  var fechas = []; var c2 = new Date(primera);
  while (c2 <= ter) { fechas.push(new Date(c2)); c2.setDate(c2.getDate() + 7); }
  var ultima = fechas[fechas.length - 1];
  if (ultima.toISOString().split('T')[0] !== terVal) fechas.push(new Date(ter));
  var tbody = document.getElementById('cs-tbody'); tbody.innerHTML = '';
  fechas.forEach(function(f, i) {
    var fs = f.toISOString().split('T')[0];
    var esSaldo = i === fechas.length - 1 && fs === terVal && fechas.length > 1 && fechas[fechas.length-2].toISOString().split('T')[0] !== terVal;
    var semLbl = esSaldo ? 'Término obra' : (i===0 ? 'Inicio obra' : 'S' + String(i).padStart(2,'0'));
    var p = prev[fs] || { prog: (i===0?'0':''), real:'' };
    var tr2 = document.createElement('tr'); if (esSaldo) tr2.classList.add('saldo');
    tr2.innerHTML = '<td><span class="cs-lbl' + (esSaldo?' saldo-lbl':'') + '">' + semLbl + '</span></td>' +
      '<td><input class="cs-fi" type="date" value="' + fs + '" readonly></td>' +
      '<td><div class="pct-row"><input class="cs-prog" type="number" min="0" max="100" step="0.1" placeholder="0.0" value="' + p.prog + '" oninput="actualizarGrafico()"><span>%</span></div></td>' +
      '<td><div class="pct-row"><input class="cs-real real-inp" type="number" min="0" max="100" step="0.1" placeholder="—" value="' + p.real + '" oninput="actualizarGrafico()"><span>%</span></div></td>';
    tbody.appendChild(tr2);
  });
  var nSem = fechas.filter(function(f,i){ return !(i===fechas.length-1 && f.toISOString().split('T')[0]===terVal && fechas.length>1 && fechas[fechas.length-2].toISOString().split('T')[0]!==terVal); }).length;
  document.getElementById('cs-resumen').textContent = nSem + ' semanas' + (fechas.length > nSem ? ' + saldo final' : '');
  actualizarGrafico();
}
function addCsRow() {
  var n = document.getElementById('cs-tbody').querySelectorAll('tr').length + 1;
  var tr2 = document.createElement('tr');
  tr2.innerHTML = '<td><span class="cs-lbl">S'+String(n).padStart(2,'0')+'</span></td><td><input class="cs-fi" type="date"></td><td><div class="pct-row"><input class="cs-prog" type="number" min="0" max="100" step="0.1" placeholder="0.0" oninput="actualizarGrafico()"><span>%</span></div></td><td><div class="pct-row"><input class="cs-real real-inp" type="number" min="0" max="100" step="0.1" placeholder="—" oninput="actualizarGrafico()"><span>%</span></div></td>';
  document.getElementById('cs-tbody').appendChild(tr2);
}
function limpiarReales() {
  document.querySelectorAll('.cs-real').forEach(function(i){ i.value=''; }); actualizarGrafico();
}
function actualizarGrafico() {
  if (typeof Chart === 'undefined') return;
  var labels=[], prog=[], real=[];
  document.querySelectorAll('#cs-tbody tr').forEach(function(tr,i){
    var lbl=tr.querySelector('.cs-lbl'); var pv=tr.querySelector('.cs-prog'); var rv=tr.querySelector('.cs-real');
    labels.push(lbl ? lbl.textContent : 'S'+(i+1));
    prog.push(pv && pv.value !== '' ? parseFloat(pv.value) : null);
    real.push(rv && rv.value !== '' ? parseFloat(rv.value) : null);
  });
  var lastRealIdx = -1;
  for (var i = real.length-1; i>=0; i--) { if (real[i] !== null) { lastRealIdx = i; break; } }
  var lastReal = lastRealIdx >= 0 ? real[lastRealIdx] : null;
  var progEnSemana = (lastRealIdx >= 0 && prog[lastRealIdx] !== null) ? prog[lastRealIdx] : null;
  document.getElementById('lbl-prog').textContent = 'Avance Programado ' + (progEnSemana !== null ? progEnSemana.toFixed(1)+'%' : '—%');
  document.getElementById('lbl-real').textContent = 'Avance Real ' + (lastReal !== null ? lastReal.toFixed(1)+'%' : '—%');
  var desvEl = document.getElementById('lbl-desv');
  if (progEnSemana !== null && lastReal !== null) {
    var desv = lastReal - progEnSemana;
    desvEl.textContent = 'Desviación ' + (desv>=0?'+':'') + desv.toFixed(1)+'%';
    desvEl.style.color = desv>=0 ? '#2d9e5f' : '#d93a3a';
  } else { desvEl.textContent='Desviación —%'; desvEl.style.color='var(--negro)'; }
  var datalabelPlugin = { id:'dl', afterDatasetsDraw: function(chart){
    if (lastRealIdx < 0) return;
    var ctx2 = chart.ctx;
    chart.data.datasets.forEach(function(ds, di){
      var meta = chart.getDatasetMeta(di); if (meta.hidden) return;
      var point = meta.data[lastRealIdx]; var val = ds.data[lastRealIdx];
      if (val === null || !point) return;
      var color = di===0 ? '#888' : '#1a5fa8';
      var txt = val.toFixed(1)+'%'; var tw = ctx2.measureText(txt).width;
      var offsetY = di===0 ? -16 : 16;
      ctx2.save();
      ctx2.font = 'bold 12px "Segoe UI",system-ui,sans-serif';
      ctx2.fillStyle = 'rgba(255,255,255,0.85)';
      ctx2.fillRect(point.x - tw/2 - 3, point.y + offsetY - (di===0?13:0), tw+6, 14);
      ctx2.fillStyle = color; ctx2.textAlign='center';
      ctx2.textBaseline = di===0 ? 'bottom' : 'top';
      ctx2.fillText(txt, point.x, point.y + offsetY); ctx2.restore();
    });
  }};
  var ctx = document.getElementById('cs-chart').getContext('2d');
  if (csChart) csChart.destroy();
  csChart = new Chart(ctx, {
    type:'line',
    data:{ labels:labels, datasets:[
      { label:'% Programado', data:prog, borderColor:'#888', backgroundColor:'transparent', borderWidth:2.5,
        pointRadius:function(c3){return c3.dataIndex===lastRealIdx?7:0;},
        pointHoverRadius:function(c3){return c3.dataIndex===lastRealIdx?9:0;},
        pointBackgroundColor:'#888888', pointBorderColor:'#ffffff', pointBorderWidth:2,
        tension:0.35, fill:false, spanGaps:false },
      { label:'% Real', data:real, borderColor:'#1a5fa8', backgroundColor:'transparent', borderWidth:2.5,
        pointRadius:function(c3){return c3.dataIndex===lastRealIdx?8:0;},
        pointHoverRadius:function(c3){return c3.dataIndex===lastRealIdx?10:0;},
        pointBackgroundColor:'#1a5fa8', pointBorderColor:'#ffffff', pointBorderWidth:2,
        tension:0.35, fill:false, spanGaps:false }
    ]},
    plugins:[datalabelPlugin],
    options:{ responsive:true, maintainAspectRatio:false, layout:{padding:{top:12,right:12,bottom:8,left:8}},
      interaction:{mode:'index',intersect:false},
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c3){return c3.dataset.label+': '+(c3.parsed.y!==null?c3.parsed.y.toFixed(1)+'%':'—');}}}},
      scales:{ x:{grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:11},color:'#888',maxRotation:45}}, y:{min:0,max:100,grid:{color:'rgba(0,0,0,.05)'},ticks:{font:{size:11},color:'#888',callback:function(v){return v+'%';}}}}
    }
  });
}

// ══ SITUACIÓN GENERAL ══

  // Crear card editable de punto pendiente de arrastre
  function crearPendCard(texto, estado, idx) {
    var estados2=[
      {v:'proceso',l:'⟳ En proceso'},
      {v:'pendiente',l:'⚠ Pendiente'},
      {v:'urgente',l:'🔴 Urgente'},
      {v:'cerrado',l:'✓ Cerrado'}
    ];
    var card=document.createElement('div');
    card.className='pend-card estado-'+(estado||'pendiente');
    card.dataset.estado=estado||'pendiente';
    var btnsDiv=document.createElement('div'); btnsDiv.className='pend-card-btns';
    btnsDiv.style.marginBottom='8px';
    estados2.forEach(function(e){
      var btn=document.createElement('button');
      btn.className='pend-est-btn'+(card.dataset.estado===e.v?' active-'+e.v:'');
      btn.textContent=e.l;
      btn.addEventListener('click',function(){
        card.dataset.estado=e.v;
        card.className='pend-card estado-'+e.v;
        btnsDiv.querySelectorAll('.pend-est-btn').forEach(function(b){b.className='pend-est-btn';});
        btn.className='pend-est-btn active-'+e.v;
      });
      btnsDiv.appendChild(btn);
    });
    var ta=document.createElement('textarea');
    ta.className='pend-texto'; ta.value=texto||'';
    ta.placeholder='Descripción del punto...';
    card.appendChild(btnsDiv); card.appendChild(ta);
    return card;
  }

  // Recolectar pendientes de arrastre
  function recolectarPendientes() {
    try {
      var items=[];
      var list=document.getElementById('sg-pendientes-list');
      if(!list) return items;
      list.querySelectorAll('.pend-card').forEach(function(card){
        var ta=card.querySelector('.pend-texto');
        var txt=ta?ta.value.trim():'';
        if(txt) items.push({texto:txt, estado:card.dataset.estado||'pendiente'});
      });
      return items;
    } catch(e){ return []; }
  }

function onEnterSituacion() {
  var fe = document.getElementById('fecha-emision').value;
  var nv = document.getElementById('nro-informe').value;
  if (fe && !document.getElementById('sg-fecha-visita').value) document.getElementById('sg-fecha-visita').value = fe;
  if (nv && !document.getElementById('sg-nro-visita').value) document.getElementById('sg-nro-visita').value = nv;
  actualizarP1();
}
function actualizarP1() {
  var fecha = document.getElementById('sg-fecha-visita').value;
  var nro = document.getElementById('sg-nro-visita').value;
  var fechaStr = fecha ? new Date(fecha+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}) : '—';
  document.getElementById('sg-p1-texto').innerHTML = 'Con fecha <strong>' + fechaStr + '</strong> se realizó la visita N° <strong>' + (nro||'—') + '</strong> a la obra por parte de esta ITO.';
  actualizarSgPreview();
}
function addPartida() {
  var div = document.createElement('div'); div.className = 'partida-row';
  div.innerHTML = '<span class="partida-bullet">—</span><input type="text" placeholder="Ej: Instalación de cielo continuo" class="partida-input" oninput="actualizarSgPreview()"><button class="btn-rm" onclick="rmPartida(this)">×</button>';
  document.getElementById('partidas-list').appendChild(div);
}
function rmPartida(btn) {
  var list = document.getElementById('partidas-list');
  if (list.querySelectorAll('.partida-row').length > 1) { btn.closest('.partida-row').remove(); actualizarSgPreview(); }
}
function addSgPunto(texto, estado) {
  sgPuntoCount++;
  var div = document.createElement('div');
  div.className = 'sg-punto-row';
  div.dataset.estado = estado || '';
  if (estado === 'proceso') div.classList.add('estado-proceso');
  if (estado === 'pendiente') div.classList.add('estado-pendiente');
  // Build using DOM to avoid quote escaping issues
  var top = document.createElement('div'); top.className = 'sg-punto-top';
  var semIco = document.createElement('span'); semIco.className = 'sg-sem-ico'; semIco.textContent = '';
  var num = document.createElement('span'); num.className = 'sg-punto-num'; num.textContent = '?.';
  var ta = document.createElement('textarea'); ta.className = 'sg-punto-text';
  ta.placeholder = 'Describe la observación o gestión...';
  ta.setAttribute('oninput', 'actualizarSgPreview()');
  ta.value = texto || '';
  top.appendChild(semIco); top.appendChild(num); top.appendChild(ta);
  var bot = document.createElement('div'); bot.className = 'sg-punto-bottom';
  var sel = document.createElement('div'); sel.className = 'sg-estado-sel';
  var estados = [['cerrado','✓ Cerrado'],['proceso','⟳ En proceso'],['pendiente','⚠ Pendiente'],['urgente','🔴 Urgente']];
  estados.forEach(function(e) {
    var btn = document.createElement('button');
    btn.className = 'sg-estado-btn' + (estado === e[0] ? ' active-' + e[0] : '');
    btn.textContent = e[1];
    btn.onclick = function() { setSgEstado(btn, e[0]); };
    sel.appendChild(btn);
  });
  var rmBtn = document.createElement('button'); rmBtn.className = 'sg-rm-btn'; rmBtn.textContent = '×';
  rmBtn.onclick = function() { rmSgPunto(rmBtn); };
  bot.appendChild(sel); bot.appendChild(rmBtn);
  div.appendChild(top); div.appendChild(bot);
  document.getElementById('sg-puntos-list').appendChild(div);
  actualizarSgNums(); actualizarSgPreview();
}
function setSgEstado(btn, estado) {
  var row = btn.closest('.sg-punto-row');
  // Limpiar TODOS los estados posibles
  row.classList.remove('estado-proceso','estado-pendiente','estado-urgente');
  row.dataset.estado = estado;
  row.querySelectorAll('.sg-estado-btn').forEach(function(b){
    b.classList.remove('active-cerrado','active-proceso','active-pendiente','active-urgente');
  });
  btn.classList.add('active-' + estado);
  if (estado !== 'cerrado') row.classList.add('estado-' + estado);
  // Actualizar semáforo icono
  var semEl = row.querySelector('.sg-sem-ico');
  if (semEl) {
    if (estado === 'urgente')        { semEl.textContent = '🔴'; semEl.title = 'Urgente'; }
    else if (estado === 'pendiente') { semEl.textContent = '🔴'; semEl.title = 'Pendiente'; }
    else if (estado === 'proceso')   { semEl.textContent = '🟡'; semEl.title = 'En proceso'; }
    else if (estado === 'cerrado')   { semEl.textContent = '🟢'; semEl.title = 'Cerrado'; }
    else                             { semEl.textContent = ''; }
  }
  actualizarSgPreview();
}
function rmSgPunto(btn) { btn.closest('.sg-punto-row').remove(); actualizarSgNums(); actualizarSgPreview(); }
function actualizarSgNums() {
  document.querySelectorAll('#sg-puntos-list .sg-punto-row').forEach(function(row, i){
    var num = row.querySelector('.sg-punto-num'); if (num) num.textContent = (i+3)+'.';
  });
}
function actualizarSgPreview() {
  var html = '<ol>';
  html += '<li>' + (document.getElementById('sg-p1-texto') ? document.getElementById('sg-p1-texto').innerHTML : '') + '</li>';
  var partidas = [];
  document.querySelectorAll('#partidas-list .partida-input').forEach(function(inp){ if(inp.value.trim()) partidas.push(inp.value.trim()); });
  html += '<li>Se verifican los siguientes trabajos en ejecución:';
  if (partidas.length) { html += '<ul>'; partidas.forEach(function(p){ html += '<li>'+p+'</li>'; }); html += '</ul>'; }
  html += '</li>';
  document.querySelectorAll('#sg-puntos-list .sg-punto-row').forEach(function(row){
    var txt = row.querySelector('.sg-punto-text').value.trim();
    var est = row.dataset.estado || '';
    var badgeMap={'cerrado':'Cerrado','proceso':'En proceso','pendiente':'Pendiente','urgente':'URGENTE'};
    var badgeStyles={urgente:'background:#d93a3a;color:#fff;',pendiente:'background:#d93a3a;color:#fff;',proceso:'background:#CC8800;color:#fff;',cerrado:'background:#2d9e5f;color:#fff;'};
    var badge = est ? '<span class="badge '+est+'" style="font-size:11px;font-weight:700;border-radius:4px;padding:2px 7px;margin-left:6px;'+(badgeStyles[est]||'')+'">'+(badgeMap[est]||est)+'</span>' : '';
    html += '<li>' + (txt || '<em style="color:#aaa">Sin texto</em>') + badge + '</li>';
  });
  html += '</ol>';
  document.getElementById('sg-preview').innerHTML = html;
}


  // ══ LAY OUT ══
  function toggleLoCambio() {
    var chk = document.getElementById('lo-chk-cambio').checked;
    document.getElementById('lo-cambio-box').style.display = chk ? 'block' : 'none';
  }
  function loDragOver(e) { e.preventDefault(); document.getElementById('lo-dropzone').classList.add('dragover'); }
  function loDrop(e) {
    e.preventDefault();
    document.getElementById('lo-dropzone').classList.remove('dragover');
    var files = e.dataTransfer.files;
    if (files.length > 0) loProcessFile(files[0]);
  }
  function loCargarArchivo(input) { if (input.files.length > 0) loProcessFile(input.files[0]); }
  function loProcessFile(file) {
    var wrap = document.getElementById('lo-preview-wrap');
    var dz = document.getElementById('lo-dropzone');
    var img = document.getElementById('lo-preview-img');
    var pdf = document.getElementById('lo-pdf-notice');
    var lbl = document.getElementById('lo-filelabel');
    var cap = document.getElementById('lo-caption');
    lbl.textContent = file.name + ' (' + (file.size/1024).toFixed(0) + ' KB)';
    var ver = document.getElementById('lo-version').value;
    var fec = document.getElementById('lo-fecha').value;
    var aut = document.getElementById('lo-autor').value;
    var parts = [];
    if (ver) parts.push('Versión: ' + ver);
    if (fec) { var d = new Date(fec+'T12:00:00'); parts.push('Fecha: ' + d.toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})); }
    if (aut) parts.push('Emitido por: ' + aut);
    cap.textContent = parts.join(' — ');
    if (file.type === 'application/pdf') {
      // Render PDF page 1 using PDF.js
      var reader = new FileReader();
      reader.onload = function(e2) {
        var pdfData = new Uint8Array(e2.target.result);
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.getDocument({data: pdfData}).promise.then(function(pdfDoc) {
            return pdfDoc.getPage(1);
          }).then(function(page) {
            var viewport = page.getViewport({scale: 2.0});
            var canvas = document.createElement('canvas');
            canvas.width = viewport.width; canvas.height = viewport.height;
            var ctx = canvas.getContext('2d');
            page.render({canvasContext: ctx, viewport: viewport}).promise.then(function() {
              img.src = canvas.toDataURL('image/png');
              img.style.display = 'block'; pdf.style.display = 'none';
              // Store for PPT export
              img.dataset.pdfRendered = 'true';
            });
          });
        } else {
          // Fallback: show notice
          pdf.style.display = 'block'; img.style.display = 'none';
          pdf.innerHTML = '📄 PDF cargado: <strong>' + file.name + '</strong><br><small>Vista previa no disponible. Se incluirá la referencia en el PPT.</small>';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      var reader2 = new FileReader();
      reader2.onload = function(e2) { img.src = e2.target.result; img.style.display = 'block'; pdf.style.display = 'none'; };
      reader2.readAsDataURL(file);
    }
    dz.style.display = 'none'; wrap.style.display = 'block';
  }
  function loBorrarPlano() {
    document.getElementById('lo-dropzone').style.display = 'block';
    document.getElementById('lo-preview-wrap').style.display = 'none';
    document.getElementById('lo-preview-img').src = '';
    document.getElementById('lo-file-input').value = '';
  }

  
  // ══ FOTOGRAFÍAS ══
  var fotos = []; // [{dataUrl, pie, grupo, warning, warningTxt}]
  var fotoGrupos = []; // [{nombre}]
  var fotoDragIdx = null;

  function addFotoGrupo() {
    fotoGrupos.push({ nombre: '' });
    renderGrupos();
    renderFotos();
  }
  function renderGrupos() {
    var list = document.getElementById('foto-grupos-list');
    list.innerHTML = '';
    fotoGrupos.forEach(function(g, i) {
      var row = document.createElement('div'); row.className = 'foto-grupo-row';
      var inp = document.createElement('input'); inp.type = 'text';
      inp.placeholder = 'Ej: Oficina 1201 / Rol A / Área de trabajo';
      inp.value = g.nombre;
      (function(idx){ inp.addEventListener('input', function(){ fotoGrupos[idx].nombre = inp.value; renderFotos(); }); })(i);
      var rm = document.createElement('button'); rm.className = 'btn-rm'; rm.textContent = '×';
      (function(idx){ rm.addEventListener('click', function(){
        fotoGrupos.splice(idx,1);
        fotos.forEach(function(f){ if(f.grupo === idx) f.grupo = ''; else if(f.grupo > idx) f.grupo--; });
        renderGrupos(); renderFotos();
      }); })(i);
      row.appendChild(inp); row.appendChild(rm); list.appendChild(row);
    });
  }

  function fotosCargar(input) {
    var files = Array.from(input.files);
    var disponibles = 12 - fotos.length;
    if (disponibles <= 0) { alert('Ya tienes 12 fotografías. Elimina alguna para agregar más.'); return; }
    files = files.slice(0, disponibles);
    var pending = files.length;
    files.forEach(function(file) {
      // Usar createObjectURL para compatibilidad HEIC en Safari/Chrome
      var blobUrl = URL.createObjectURL(file);
      var tmpImg = new Image();
      tmpImg.onload = function() {
        // Convertir a JPEG 150ppp: 592x444px
        var targetFW=592, targetFH=444;
        var cv=document.createElement('canvas');
        cv.width=targetFW; cv.height=targetFH;
        var ctx150=cv.getContext('2d');
        ctx150.fillStyle='#ffffff'; ctx150.fillRect(0,0,targetFW,targetFH);
        var r150=Math.min(targetFW/tmpImg.naturalWidth,targetFH/tmpImg.naturalHeight);
        var dw=Math.round(tmpImg.naturalWidth*r150),dh=Math.round(tmpImg.naturalHeight*r150);
        var dx=Math.round((targetFW-dw)/2),dy=Math.round((targetFH-dh)/2);
        ctx150.drawImage(tmpImg,dx,dy,dw,dh);
        URL.revokeObjectURL(blobUrl);
        fotos.push({ dataUrl: cv.toDataURL('image/jpeg',0.85), pie: '', grupo: '', warning: false, warningTxt: '', resuelto: false, resueltoTxt: '' });
        pending--;
        if (pending === 0) renderFotos();
      };
      tmpImg.onerror = function() {
        // Fallback FileReader si blob falla
        URL.revokeObjectURL(blobUrl);
        var rd = new FileReader();
        rd.onload = function(ev) {
          fotos.push({ dataUrl: ev.target.result, pie: '', grupo: '', warning: false, warningTxt: '', resuelto: false, resueltoTxt: '' });
          pending--; if(pending===0) renderFotos();
        };
        rd.readAsDataURL(file);
      };
      tmpImg.src = blobUrl;
    });
    input.value = '';
  }

  function renderFotos() {
    var grid = document.getElementById('foto-grid');
    grid.innerHTML = '';
    fotos.forEach(function(f, i) {
      var card = document.createElement('div');
      card.className = 'foto-card' + (f.warning ? ' has-warning' : '') + (f.resuelto ? ' has-resuelto' : '');
      card.draggable = true;
      card.addEventListener('dragstart', function() { fotoDragIdx = i; card.classList.add('dragging'); });
      card.addEventListener('dragend', function() { card.classList.remove('dragging'); });
      card.addEventListener('dragover', function(e) { e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', function() { card.classList.remove('drag-over'); });
      card.addEventListener('drop', function(e) {
        e.preventDefault(); card.classList.remove('drag-over');
        if (fotoDragIdx !== null && fotoDragIdx !== i) {
          var moved = fotos.splice(fotoDragIdx, 1)[0];
          fotos.splice(i, 0, moved);
          fotoDragIdx = null; renderFotos();
        }
      });

      // Image
      var imgWrap = document.createElement('div'); imgWrap.className = 'foto-img-wrap';
      var badge = document.createElement('div'); badge.className = 'foto-warning-badge'; badge.textContent = '⚠ ADVERTENCIA';
      var rbadge = document.createElement('div'); rbadge.className = 'foto-resuelto-badge'; rbadge.textContent = '✓ RESUELTO';
      var img = document.createElement('img'); img.src = f.dataUrl;
      imgWrap.appendChild(badge); imgWrap.appendChild(rbadge); imgWrap.appendChild(img);

      // Botones: eliminar y reemplazar
      var rm = document.createElement('button'); rm.className = 'foto-rm'; rm.textContent = '×';
      rm.title = 'Eliminar foto';
      (function(idx){ rm.addEventListener('click', function(){ fotos.splice(idx,1); renderFotos(); }); })(i);
      var replBtn = document.createElement('label'); replBtn.className = 'foto-repl-btn'; replBtn.title = 'Reemplazar foto';
      replBtn.textContent = '↺';
      var replInp = document.createElement('input'); replInp.type='file'; replInp.accept='image/*';
      replInp.style.display='none';
      (function(idx){
        replInp.addEventListener('change', function(){
          if(!replInp.files.length) return;
          var file=replInp.files[0];
          var r2=new FileReader();
          var blobUrl2=URL.createObjectURL(file);
          var tmpI=new Image();
          tmpI.onload=function(){
            var targetFW=592,targetFH=444;
            var cv2=document.createElement('canvas');
            cv2.width=targetFW; cv2.height=targetFH;
            var ctx2=cv2.getContext('2d');
            ctx2.fillStyle='#ffffff'; ctx2.fillRect(0,0,targetFW,targetFH);
            var r2b=Math.min(targetFW/tmpI.naturalWidth,targetFH/tmpI.naturalHeight);
            var dw2=Math.round(tmpI.naturalWidth*r2b),dh2=Math.round(tmpI.naturalHeight*r2b);
            ctx2.drawImage(tmpI,Math.round((targetFW-dw2)/2),Math.round((targetFH-dh2)/2),dw2,dh2);
            URL.revokeObjectURL(blobUrl2);
            fotos[idx].dataUrl=cv2.toDataURL('image/jpeg',0.85);
            renderFotos();
          };
          tmpI.onerror=function(){ URL.revokeObjectURL(blobUrl2); };
          tmpI.src=blobUrl2;
        });
      })(i);
      replBtn.appendChild(replInp);

      // Body
      var body = document.createElement('div'); body.className = 'foto-body';

      // Meta row: número + selector de grupo
      var meta = document.createElement('div'); meta.className = 'foto-meta';
      var num = document.createElement('div'); num.className = 'foto-num'; num.textContent = 'Foto ' + (i+1);
      var sel = document.createElement('select'); sel.className = 'foto-grupo-sel';
      var optNone = document.createElement('option'); optNone.value = ''; optNone.textContent = 'Sin grupo';
      sel.appendChild(optNone);
      fotoGrupos.forEach(function(g, gi) {
        var opt = document.createElement('option'); opt.value = gi;
        opt.textContent = g.nombre || ('Grupo ' + (gi+1));
        if (f.grupo === gi || f.grupo === String(gi)) opt.selected = true;
        sel.appendChild(opt);
      });
      (function(idx){ sel.addEventListener('change', function(){ fotos[idx].grupo = sel.value === '' ? '' : parseInt(sel.value); }); })(i);
      meta.appendChild(num);
      if (fotoGrupos.length > 0) meta.appendChild(sel);

      // Pie de foto
      var pie = document.createElement('textarea'); pie.className = 'foto-pie';
      pie.placeholder = 'Pie de foto descriptivo...'; pie.value = f.pie; pie.rows = 2;
      (function(idx){ pie.addEventListener('input', function(){ fotos[idx].pie = pie.value; }); })(i);

      // Warning toggle
      var wRow = document.createElement('div'); wRow.className = 'foto-warning-row';
      var wChk = document.createElement('input'); wChk.type = 'checkbox'; wChk.checked = f.warning;
      var wId = 'w-chk-' + i; wChk.id = wId;
      var wLbl = document.createElement('label'); wLbl.htmlFor = wId; wLbl.textContent = '⚠ Marcar advertencia';
      var wTxt = document.createElement('input'); wTxt.type = 'text'; wTxt.className = 'foto-warning-text';
      wTxt.placeholder = 'Describe la situación de advertencia...'; wTxt.value = f.warningTxt;
      wTxt.style.display = f.warning ? 'block' : 'none';
      (function(idx, cardEl, badgeEl, wTxtEl){
        wChk.addEventListener('change', function(){
          fotos[idx].warning = wChk.checked;
          cardEl.classList.toggle('has-warning', wChk.checked);
          wTxtEl.style.display = wChk.checked ? 'block' : 'none';
        });
        wTxtEl.addEventListener('input', function(){ fotos[idx].warningTxt = wTxtEl.value; });
      })(i, card, badge, wTxt);
      wRow.appendChild(wChk); wRow.appendChild(wLbl);

      // Resuelto toggle
      var rRow = document.createElement('div'); rRow.className = 'foto-resuelto-row';
      var rChk = document.createElement('input'); rChk.type = 'checkbox'; rChk.checked = f.resuelto;
      var rId = 'r-chk-' + i; rChk.id = rId;
      var rLbl = document.createElement('label'); rLbl.htmlFor = rId; rLbl.textContent = '✓ Marcar como resuelto';
      var rTxt = document.createElement('input'); rTxt.type = 'text'; rTxt.className = 'foto-resuelto-text';
      rTxt.placeholder = 'Ej: Observación levantada — se corrigió la instalación eléctrica';
      rTxt.value = f.resueltoTxt;
      rTxt.style.display = f.resuelto ? 'block' : 'none';
      (function(idx, cardEl, rTxtEl){
        rChk.addEventListener('change', function(){
          fotos[idx].resuelto = rChk.checked;
          cardEl.classList.toggle('has-resuelto', rChk.checked);
          rTxtEl.style.display = rChk.checked ? 'block' : 'none';
        });
        rTxtEl.addEventListener('input', function(){ fotos[idx].resueltoTxt = rTxtEl.value; });
      })(i, card, rTxt);
      rRow.appendChild(rChk); rRow.appendChild(rLbl);

      body.appendChild(meta); body.appendChild(pie); body.appendChild(wRow); body.appendChild(wTxt); body.appendChild(rRow); body.appendChild(rTxt);
      card.appendChild(rm); card.appendChild(replBtn); card.appendChild(imgWrap); card.appendChild(body);
      grid.appendChild(card);
    });

    document.getElementById('foto-contador').textContent = '(' + fotos.length + ' / 12)';
    var addWrap = document.getElementById('foto-add-btn-wrap');
    if (addWrap) addWrap.style.display = fotos.length >= 12 ? 'none' : 'block';
  }

  
  // ══ ANEXOS ══
  var anexos = []; // [{nombre, size, tipo, titulo, desc, icono}]
  var ANX_TIPOS = ['Plano','Acta','Correo','Especificación','Fotografía','Certificado','Contrato','Otro'];
  var ANX_ICONOS = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', jpg:'🖼', jpeg:'🖼', png:'🖼', dwg:'📐', default:'📎' };

  function anxCargar(input) {
    var files = Array.from(input.files);
    var pending = files.length;
    files.forEach(function(file) {
      var ext = file.name.split('.').pop().toLowerCase();
      var entry = { nombre: file.name, size: file.size, tipo: 'Otro', titulo: '', desc: '', icono: ANX_ICONOS[ext] || ANX_ICONOS.default, previewUrl: null, rawFile: file };
      anexos.push(entry);
      var idx = anexos.length - 1;
      if (['jpg','jpeg','png','gif','webp'].indexOf(ext) >= 0) {
        var r = new FileReader(); r.onload = function(e2) {
          anexos[idx].previewUrl = e2.target.result;
          pending--; if (pending === 0) renderAnexos();
        }; r.readAsDataURL(file);
      } else if (ext === 'pdf' && typeof pdfjsLib !== 'undefined') {
        var r2 = new FileReader(); r2.onload = function(e2) {
          pdfjsLib.getDocument({data: new Uint8Array(e2.target.result)}).promise.then(function(pdf) {
            return pdf.getPage(1);
          }).then(function(page) {
            var vp = page.getViewport({scale: 1.0});
            var cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
            page.render({canvasContext: cv.getContext('2d'), viewport: vp}).promise.then(function() {
              anexos[idx].previewUrl = cv.toDataURL('image/png');
              pending--; if (pending === 0) renderAnexos();
            });
          }).catch(function(){ pending--; if(pending===0) renderAnexos(); });
        }; r2.readAsArrayBuffer(file);
      } else {
        pending--; if (pending === 0) renderAnexos();
      }
    });
    input.value = '';
  }

  function renderAnexos() {
    var list = document.getElementById('anx-list');
    list.innerHTML = '';
    anexos.forEach(function(a, i) {
      var card = document.createElement('div'); card.className = 'anx-card';

      var top = document.createElement('div'); top.className = 'anx-top';
      var ico = document.createElement('span'); ico.className = 'anx-icon'; ico.textContent = a.icono;
      var fname = document.createElement('div'); fname.className = 'anx-filename'; fname.textContent = a.nombre;
      var fsize = document.createElement('div'); fsize.className = 'anx-size'; fsize.textContent = (a.size/1024).toFixed(0) + ' KB';
      var rm = document.createElement('button'); rm.className = 'btn-rm'; rm.textContent = '×';
      (function(idx){ rm.addEventListener('click', function(){ anexos.splice(idx,1); renderAnexos(); }); })(i);
      top.appendChild(ico); top.appendChild(fname); top.appendChild(fsize); top.appendChild(rm);
      // Preview thumbnail
      if (a.previewUrl) {
        var prevWrap = document.createElement('div');
        prevWrap.style.cssText = 'width:100%;max-height:120px;overflow:hidden;border-radius:6px;margin-bottom:8px;border:1px solid var(--gris-b)';
        var prevImg = document.createElement('img');
        prevImg.src = a.previewUrl; prevImg.style.cssText = 'width:100%;object-fit:contain;max-height:120px;';
        prevWrap.appendChild(prevImg); card.appendChild(prevWrap);
      }

      var fields = document.createElement('div'); fields.className = 'anx-fields';
      var titulo = document.createElement('input'); titulo.type = 'text';
      titulo.placeholder = 'Título del anexo (ej: Acta de entrega de oficinas)';
      titulo.value = a.titulo;
      (function(idx){ titulo.addEventListener('input', function(){ anexos[idx].titulo = titulo.value; }); })(i);
      var tipoSel = document.createElement('select');
      ANX_TIPOS.forEach(function(t){
        var opt = document.createElement('option'); opt.value = t; opt.textContent = t;
        if (t === a.tipo) opt.selected = true;
        tipoSel.appendChild(opt);
      });
      (function(idx){ tipoSel.addEventListener('change', function(){ anexos[idx].tipo = tipoSel.value; }); })(i);
      fields.appendChild(titulo); fields.appendChild(tipoSel);

      var desc = document.createElement('textarea'); desc.className = 'anx-desc'; desc.rows = 2;
      desc.placeholder = 'Descripción breve (opcional)...'; desc.value = a.desc;
      (function(idx){ desc.addEventListener('input', function(){ anexos[idx].desc = desc.value; }); })(i);

      card.appendChild(top); card.appendChild(fields); card.appendChild(desc);
      list.appendChild(card);
    });
    document.getElementById('anx-contador').textContent = '(' + anexos.length + ')';
  }

  function generarResumen() {
    var rows = [];
    // Portada
    var obra = document.getElementById('nombre-obra').value || '—';
    var edificio = document.getElementById('nombre-edificio').value || '—';
    var nro = document.getElementById('nro-informe').value || '—';
    var fecha = document.getElementById('fecha-emision').value;
    var fechaStr = fecha ? new Date(fecha+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}) : '—';
    rows.push(['Informe N°', nro]);
    rows.push(['Fecha de emisión', fechaStr]);
    rows.push(['Obra', obra]);
    rows.push(['Edificio', edificio]);
    rows.push(['Mandante', document.getElementById('mandante').value || '—']);
    // Plazo
    var ft = document.getElementById('fecha-termino').value;
    rows.push(['Término contractual', ft ? new Date(ft+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}) : '—']);
    // Avance
    var lastReal = null, lastProg = null;
    document.querySelectorAll('#cs-tbody tr').forEach(function(tr){
      var rv = tr.querySelector('.cs-real'); var pv = tr.querySelector('.cs-prog');
      if (rv && rv.value !== '') { lastReal = parseFloat(rv.value); }
    });
    var lastRealIdx = -1;
    var csRows = document.querySelectorAll('#cs-tbody tr');
    for (var i = csRows.length-1; i>=0; i--) {
      var rv2 = csRows[i].querySelector('.cs-real');
      if (rv2 && rv2.value !== '') { lastRealIdx = i; lastReal = parseFloat(rv2.value); break; }
    }
    if (lastRealIdx >= 0) {
      var pv2 = csRows[lastRealIdx].querySelector('.cs-prog');
      if (pv2 && pv2.value !== '') lastProg = parseFloat(pv2.value);
    }
    rows.push(['Avance programado', lastProg !== null ? lastProg.toFixed(1)+'%' : '—']);
    rows.push(['Avance real', lastReal !== null ? lastReal.toFixed(1)+'%' : '—']);
    if (lastProg !== null && lastReal !== null) {
      var desv = lastReal - lastProg;
      rows.push(['Desviación', (desv>=0?'+':'')+desv.toFixed(1)+'%']);
    }
    // Docs aprobados
    var docsTotal = document.querySelectorAll('#doc-tbody tr').length;
    var docsVerdes = document.querySelectorAll('#doc-tbody .sem-btn.verde').length;
    rows.push(['Documentos aprobados', docsVerdes + ' / ' + docsTotal]);
    // Proyectos aprobados
    var proyTotal = document.querySelectorAll('#proy-tbody tr').length;
    var proyVerdes = document.querySelectorAll('#proy-tbody .sem-btn.verde').length;
    rows.push(['Proyectos aprobados', proyVerdes + ' / ' + proyTotal]);
    // Fotos y anexos
    rows.push(['Fotografías incluidas', fotos.length]);
    rows.push(['Anexos incluidos', anexos.length]);
    // Pendientes situación general
    var pendientes = document.querySelectorAll('#sg-puntos-list .sg-punto-row[data-estado="pendiente"]').length;
    var enProceso = document.querySelectorAll('#sg-puntos-list .sg-punto-row[data-estado="proceso"]').length;
    rows.push(['Puntos pendientes', pendientes]);
    rows.push(['Puntos en proceso', enProceso]);

    var html = '';
    rows.forEach(function(r){
      var isOk = typeof r[1] === 'string' && (r[1].includes('%') || r[1] !== '—');
      html += '<div class="resumen-item"><span class="resumen-lbl">' + r[0] + '</span><span class="resumen-val ' + (isOk?'ok':'') + '">' + (r[1] !== undefined && r[1] !== null ? r[1] : '—') + '</span></div>';
    });
    document.getElementById('sg-resumen').innerHTML = html;
    var emptyMsg = document.getElementById('sg-resumen-empty');
    if (emptyMsg) emptyMsg.style.display = html ? 'none' : 'block';
  }

  function generarPPT() {
    // Auto-guardar antes de generar PPT
    if (typeof obraActual !== 'undefined' && obraActual && informeActual) {
      guardarEstadoInformeActual();
    }
    var LOGO2_DATA = "data:image/jpeg;base64,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L3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOkdJTVA9Imh0dHA6Ly93d3cuZ2ltcC5vcmcveG1wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJBZG9iZSBSR0IgKDE5OTgpIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA4NWRlYTU4LWFjOGQtNjY0NC1iOTk0LTZmYjE4ZmY1MGY5YSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3YWIzOGZjZS00ZjZjLTQ4ZmUtYjMzMC03ZDIzNzMzOGUyOWYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowODVkZWE1OC1hYzhkLTY2NDQtYjk5NC02ZmIxOGZmNTBmOWEiIEdJTVA6QVBJPSIyLjAiIEdJTVA6UGxhdGZvcm09Ik1hYyBPUyIgR0lNUDpUaW1lU3RhbXA9IjE2NzAxMjI3NjA2MDgzMzIiIEdJTVA6VmVyc2lvbj0iMi4xMC4zMiIgZGM6Rm9ybWF0PSJpbWFnZS9qcGVnIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNS0wOS0wMlQwODoyMToxMC0wNDowMCIgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjI6MTI6MDNUMjM6NTk6MTYtMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIyOjEyOjAzVDIzOjU5OjE2LTAzOjAwIj4gPHBob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cmRmOlNlcT4gPHJkZjpsaSBwaG90b3Nob3A6TGF5ZXJOYW1lPSJKIEEgUyBWIEluZ2VuaWVyw61hIHkgR2VzdGnDs24gTHRkYS4iIHBob3Rvc2hvcDpMYXllclRleHQ9IkogQSBTIFYgSW5nZW5pZXLDrWEgeSBHZXN0acOzbiBMdGRhLiIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IkF2ZGEuIE51ZXZhIFByb3ZpZGVuY2lhIE7CsCAxODgxIE9mLiAxMjA1IFByb3ZpZGVuY2lhLCBTYW50aWFnbyAiIHBob3Rvc2hvcDpMYXllclRleHQ9IkF2ZGEuIE51ZXZhIFByb3ZpZGVuY2lhIE7CsCAxODgxIE9mLiAxMjA1IFByb3ZpZGVuY2lhLCBTYW50aWFnbyBmb25vOiArIDU2IDkgNiAyMjcgMDQgMTcgbWFpbDogai5zZWdvdmlhQGphc3YuY2wiLz4gPC9yZGY6U2VxPiA8L3Bob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA4NWRlYTU4LWFjOGQtNjY0NC1iOTk0LTZmYjE4ZmY1MGY5YSIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgc3RFdnQ6d2hlbj0iMjAxNS0wOS0wMlQwODoyMToxMC0wNDowMCIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0OmNoYW5nZWQ9Ii8iIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YWJlMDg0MjItM2U0Mi0wYjRkLWJjMTAtMTMwYjFjZGM1MzU3IiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiBzdEV2dDp3aGVuPSIyMDE1LTA5LTAyVDA4OjI4OjI3LTA0OjAwIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6Y2hhbmdlZD0iLyIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowOTEzYzg2NS0xYzNiLWYxNDItOWRlNC0zZmYzZDI2MTliYWYiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiIHN0RXZ0OndoZW49IjIwMTUtMDktMDJUMDg6NDI6NDEtMDQ6MDAiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDpjaGFuZ2VkPSIvIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjBjZWNkMDY4LTg4OGItNDkyMi05Njg3LTc5OGQwZjJjMTg2NyIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChNYWMgT1MpIiBzdEV2dDp3aGVuPSIyMDIyLTEyLTAzVDIzOjU5OjIwLTAzOjAwIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+ICsElDQ19QUk9GSUxFAAEBAAACoGxjbXMEMAAAbW50clJHQiBYWVogB+YADAAEAAIAOAATYWNzcEFQUEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1sY21zAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANZGVzYwAAASAAAABAY3BydAAAAWAAAAA2d3RwdAAAAZgAAAAUY2hhZAAAAawAAAAsclhZWgAAAdgAAAAUYlhZWgAAAewAAAAUZ1hZWgAAAgAAAAAUclRSQwAAAhQAAAAgZ1RSQwAAAhQAAAAgYlRSQwAAAhQAAAAgY2hybQAAAjQAAAAkZG1uZAAAAlgAAAAkZG1kZAAAAnwAAAAkbWx1YwAAAAAAAAABAAAADGVuVVMAAAAkAAAAHABHAEkATQBQACAAYgB1AGkAbAB0AC0AaQBuACAAcwBSAEcAQm1sdWMAAAAAAAAAAQAAAAxlblVTAAAAGgAAABwAUAB1AGIAbABpAGMAIABEAG8AbQBhAGkAbgAA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ACQCQSAAQQQASCAAQSSSACACQACAACQCCACAQCQACQCAAAAAACAAAAACAQQAAAAAQAAAAAAAQCAAAAQAAAACgAACwAAACACACASCAQAAACSASACAQSAASCAAACAQAQAACASSAQQCASQQCAAQAQAAAAAQAAAAAACAAAAAACAAAAAAAAAQAAQAAAAAAYAAAbgAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAACAAAAAQQACAAAAAQSAAAAAAAAAAACAAAAABAAAMhgAAMACSAAAAAAAAAAAAAAASQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAACCAQAAAAAAQSQAAAAAQAACAQAAAAAAoAVAFAAIgASSACAQQSCASCQSQACQSASQQSQCSAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAACAASAAAAAQQAQAAAAAAAAyPgAOx1gAAQSQSAQCQSAACSQAACCCQSASQSCSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAQQACCAAAAAAQACAAAAACAACAAAAAACYlMgCSSQAASCCSQSCSSCCQSAQAAASCQSCAQSQCAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAACCSSAAAAAAAACQCAAAAAACAAAAAAAAAAAACQACQACACCASSAASQSQCCAAQQACSSCCSSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAACAAAAAAAAQQAAAAQAQQAAAAAAcAAAOAAACQAAAAAAAAAAAAAAACAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAQAAAAAAAAAAAACAQAAAACAAAAAAAACAAACQAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAACCAAAAAAAAAAAAQCAAAAAQCAAAAAAAEAAAUAAAAQAQAAAAAAAAACAAACQAAAQQACAQAQAQSAAAAAAAAAAAAAAAAAAAAAAAAAQQAAAAAQAACCAAAAAAACCAAAAAQQAAAAAAADAAABQAAACACSQAAQAAAACCCQCAACQCAACACACAQAQAAAAAAAAAAAAAAAAAAAAAACACCAAAAQAAAAAAAAAACACAQAAAAACAAAAAAAAMAABkQAAAAAQQCCQAAAQSACCASACCCACAQCCSCCAAAAAAAAAAAAAAAAAAAAAAAACCQAAAAACCAAAAQAAAAQAQAAAAAAAACAAAAAAADgADMCAAAQACASQQAAAAAACAACQAACSSQQAAQCASCAAAAAAAAAAAAAAAAAAAAAAASSCAAAAASQAAAAQAAACSCAQAAAAAASQAAAAAAAAK3UAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADEogACSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAALgAAAAAAAAAAQAACAAAAAAAAAQACQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAYgAAAAACASCACQAAACQCAAAAACCQSACASAASSAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAQAAAAQSAQAASAQAQAAAAAIAAAKAAAAQAAAQAQSACAAAQSSQCAQAQCQQASQCCAQAAAAAAAAAAAAAAAAAAAAAAASCCQSQSQCQQQAQCQCQASCSQASSQCAQCSCAAAAAgAACgAAACACACQSCQAQCQSCCQCACQSAQCQSASCSSAAAAAAAAAAAAAAAAAAAAAAACCQQCSCASCQCQCCSAQCCQQASASAQQCSCQSAAAAQAAASAAAAQAAQSAQSACQAASQASCASASACSASCASQQAAAAAAAAAAAAAAAAAAAAAAAQCQQQAACQQASSQCQCASQSCCSSSACACQSAAAAABgAABwAAASAAAAAAAAACAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACSQAQAQAQASSACAQASASCCCCQQSQCCQCCQSAAACAAAgCAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABW7kAQCCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
    if (typeof PptxGenJS === 'undefined') { alert('Librería PPT no cargada. Verifica tu conexión a internet.'); return; }

    var prs = new PptxGenJS();
    prs.layout = 'LAYOUT_4x3'; // 10" x 7.5" = 25.4cm x 19.05cm
    prs.author = 'JASV Ingeniería y Gestión Ltda.';

    var LOGO    = document.querySelector('.topbar img').src;
    var FONT    = 'Century Gothic';
    var ROJO    = '8B1A1A';
    var GRIS    = '5a5a5a';
    var NEGRO   = '1a1a1a';
    var ENCAB_BG= 'BFC3C5';
    var TBL_HEAD= '1B3A4B';
    var TBL_ALT = 'F0F4F6';

    // Medidas fijas (pulgadas)
    var SW=10, SH=7.5;
    var LOGO_W=1.9685, LOGO_H=0.6299;
    var LOGO_X=7.7008, LOGO_Y=0.2165;          // 19.56cm x 0.55cm
    var PIE_X=3.311,   PIE_Y=6.9528;            // 8.41cm x 17.66cm
    var PIE_W=SW-PIE_X-0.1, PIE_H=0.35;
    var CX=0.1181, CY=1.4016, CW=9.7402, CH=0.4094; // cinta sección
    var CONT_Y=CY+CH+0.12;                      // inicio contenido
    var MAX_Y=PIE_Y-0.1;
    var FOTO_W=3.9488, FOTO_H=2.9606;           // ancho=10.03cm, alto=7.52cm
    var FOTO_L_X=0.622, FOTO_R_X=5.0591, FOTO_Y2=2.3622; // posiciones fotos

    // Date formatter: dd/mm/yyyy
    function fmtDate(val) {
      if (!val) return '—';
      var d = new Date(val+'T12:00:00');
      var dd=String(d.getDate()).padStart(2,'0');
      var mm=String(d.getMonth()+1).padStart(2,'0');
      var yy=d.getFullYear();
      return dd+'/'+mm+'/'+yy;
    }
    // Number formatter: thousand separator
    function fmtNum(val) {
      if (!val) return '—';
      var s = val.toString().trim();
      // Normalizar: si tiene coma como separador decimal (ej: 11256,56) convertir a punto
      // Detectar si la coma es decimal: aparece una sola coma con ≤2 dígitos después
      s = s.replace(/\./g,'').replace(',','.');  // quitar puntos de miles, coma→punto decimal
      var n = parseFloat(s);
      if (isNaN(n)) return val.toString();
      // Formatear: separador de miles = punto, decimal = coma (es-CL)
      return n.toLocaleString('es-CL', {minimumFractionDigits:0, maximumFractionDigits:2});
    }
    var nroInf   = document.getElementById('nro-informe').value||'—';
    var nroStr2  = 'Informe ITO N° '+String(nroInf).padStart(3,'0');
    var obra     = document.getElementById('nombre-obra').value||'—';
    var edificio = document.getElementById('nombre-edificio').value||'—';
    var mandante = document.getElementById('mandante').value||'—';
    var contratista=document.getElementById('contratista').value||'—';
    var fechaEm  = document.getElementById('fecha-emision').value;
    var fechaStr = fechaEm?new Date(fechaEm+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}):'—';

    var slideNum=0;

    // ── addHF: logo fijo + cinta + pie ──
    function addHF(slide, titulo, pageN) {
      // Logo posición fija
      slide.addImage({data:LOGO, x:LOGO_X, y:LOGO_Y, w:LOGO_W, h:LOGO_H});
      // Cinta sección
      slide.addShape(prs.ShapeType.rect,{x:CX,y:CY,w:CW,h:CH,fill:{color:ENCAB_BG},line:{color:ENCAB_BG}});
      // Título en cinta
      slide.addText(titulo,{x:CX+0.12,y:CY,w:LOGO_X-CX-0.2,h:CH,fontSize:18,fontFace:FONT,bold:true,color:'1a1a1a',valign:'middle'});
      // Cinta roja inferior (igual que portada)
      slide.addShape(prs.ShapeType.rect,{x:0,y:SH-0.04,w:SW,h:0.04,fill:{color:ROJO},line:{color:ROJO}});
      // Pie: y=17.8cm=7.0079", centrado en página completa
      slide.addShape(prs.ShapeType.rect,{x:0,y:7.0079-0.02,w:SW,h:0.02,fill:{color:'CCCCCC'},line:{color:'CCCCCC'}});
      slide.addText(nroStr2+' — '+obra+' — Pág. '+pageN,
        {x:0,y:7.0079,w:SW,h:0.32,fontSize:8,fontFace:FONT,color:GRIS,valign:'middle',align:'center'});
    }

    // ── addProfTable: tabla profesional reutilizable ──
    function addProfTable(slide,headers,rows,colW,x,y,w,headFontSize,bodyFontSize) {
      var hfs=headFontSize||10, bfs=bodyFontSize||9;
      var tData=[headers.map(function(h){
        return {text:h,options:{bold:true,fontSize:hfs,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}};
      })];
      rows.forEach(function(row,ri){
        var bg=ri%2===0?'FFFFFF':TBL_ALT;
        tData.push(row.map(function(cell){
          return {text:cell.text||'',options:Object.assign({fontSize:bfs,fontFace:FONT,color:cell.color||NEGRO,
            fill:{color:cell.fill||bg},align:cell.align||'left',valign:'middle',bold:cell.bold||false,italic:cell.italic||false},cell.extra||{})};
        }));
      });
      slide.addTable(tData,{x:x,y:y,w:w,colW:colW,rowH:0.38,border:{color:'D0D8DC',pt:0.5},fill:{color:'FFFFFF'}});
    }

    // ══ PORTADA ══
    slideNum++;
    var s1=prs.addSlide();
    s1.addImage({data:LOGO,x:LOGO_X,y:LOGO_Y,w:LOGO_W,h:LOGO_H});
    // Portada: contenido desde y=4.66cm=1.8346"
    var PY=1.8346;
    s1.addShape(prs.ShapeType.rect,{x:0.5,y:PY,w:0.07,h:2.5,fill:{color:ROJO},line:{color:ROJO}});
    s1.addText(nroStr2,{x:0.75,y:PY,w:9.0,h:0.62,fontSize:20,fontFace:FONT,bold:true,color:ROJO,valign:'middle'});
    s1.addText(obra,{x:0.75,y:PY+0.65,w:9.0,h:1.1,fontSize:28,fontFace:FONT,bold:true,color:NEGRO,wrap:true,valign:'top'});
    s1.addText(edificio,{x:0.75,y:PY+1.78,w:9.0,h:0.42,fontSize:14,fontFace:FONT,color:GRIS});
    var metas=[['Mandante',mandante],['Contratista',contratista],['Fecha de emisión',fechaStr]];
    metas.forEach(function(m,i){
      var x=0.6+i*3.1;
      s1.addText(m[0],{x:x,y:PY+2.4,w:3.0,h:0.22,fontSize:9,fontFace:FONT,color:GRIS,bold:true});
      s1.addText(m[1],{x:x,y:PY+2.64,w:3.0,h:0.32,fontSize:12,fontFace:FONT,color:NEGRO,bold:true});
    });
    s1.addShape(prs.ShapeType.rect,{x:0,y:SH-0.04,w:SW,h:0.04,fill:{color:ROJO},line:{color:ROJO}});

    // ══ TABLA DE CONTENIDOS ══
    slideNum++;
    var s2=prs.addSlide();
    // Logo fijo
    s2.addImage({data:LOGO,x:LOGO_X,y:LOGO_Y,w:LOGO_W,h:LOGO_H});
    // Cinta con título tabla de contenidos
    s2.addShape(prs.ShapeType.rect,{x:CX,y:CY,w:CW,h:CH,fill:{color:ENCAB_BG},line:{color:ENCAB_BG}});
    s2.addText('Tabla de contenidos',{x:CX+0.12,y:CY,w:LOGO_X-CX-0.2,h:CH,fontSize:18,fontFace:FONT,bold:true,color:'1a1a1a',valign:'middle'});
    // Cinta roja inferior TOC
    s2.addShape(prs.ShapeType.rect,{x:0,y:SH-0.04,w:SW,h:0.04,fill:{color:ROJO},line:{color:ROJO}});
    // Pie: idéntico a addHF — y=17.8cm=7.0079", centrado en página completa
    s2.addShape(prs.ShapeType.rect,{x:0,y:7.0079-0.02,w:SW,h:0.02,fill:{color:'CCCCCC'},line:{color:'CCCCCC'}});
    s2.addText(nroStr2+' — '+obra+' — Pág. '+slideNum,
      {x:0,y:7.0079,w:SW,h:0.32,fontSize:8,fontFace:FONT,color:GRIS,valign:'middle',align:'center'});
    // Secciones: fuente 18, interlineado 27pt=0.375"
    var secciones=['1. Datos del proyecto','2. Estatus de documentación','3. Estatus de aprobación de proyectos','4. Control Curva S','5. Situación general de la obra','6. Lay Out Arquitectura vigente','7. Fotografías relevantes'];
    if(anexos.length>0) secciones.push('8. Anexos');
    var tocLH=0.375; var tocY=CY+CH+0.15;
    secciones.forEach(function(sec,i){
      var y=tocY+i*(tocLH+0.04);
      s2.addShape(prs.ShapeType.rect,{x:CX+0.06,y:y+tocLH*0.2,w:0.04,h:tocLH*0.6,fill:{color:ROJO},line:{color:ROJO}});
      s2.addText(sec,{x:CX+0.18,y:y,w:CW-0.25,h:tocLH,fontSize:16,fontFace:FONT,color:NEGRO,valign:'middle'});
    });

    // ══ DATOS DEL PROYECTO ══
    slideNum++;
    var s3=prs.addSlide();
    addHF(s3,'1. Datos del proyecto',slideNum);
    var fi=document.getElementById('fecha-inicio').value;
    var ft=document.getElementById('fecha-termino').value;
    // Verificar si hay aumento de plazo activo
    var chkAum=document.getElementById('chk-aumento');
    var hayAumento=chkAum&&chkAum.checked;
    var ftNueva=hayAumento?document.getElementById('fecha-termino-nueva').value:'';
    var aumDias=hayAumento?(document.getElementById('aumento-dias').value||''):'';
    var aumMotivo=hayAumento?(document.getElementById('aumento-motivo').value||''):'';
    var plazo=document.getElementById('plazo-dias').value;
    var oficina=document.getElementById('nro-oficina').value||'—';
    var montoRaw=document.getElementById('monto-valor').value||'';
    var montoDesc=document.getElementById('monto-desc').value||'';
    var monto=(document.getElementById('moneda').value||'UF')+' '+fmtNum(montoRaw)+(montoDesc?' ('+montoDesc+')':'');
    var superficieRaw=document.getElementById('superficie').value||'';
    var superficie=superficieRaw?fmtNum(superficieRaw)+' m²':'—';
    var fiStr=fi?new Date(fi+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}):'—';
    var ftStr=ft?new Date(ft+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}):'—';
    var ftStr2=ftNueva?fmtDate(ftNueva):'';
    var plazoTotal=hayAumento&&aumDias?(parseInt(plazo||0)+parseInt(aumDias||0))+' días corridos':plazo?plazo+' días corridos':'—';
    var ftLabel=hayAumento?'Fecha de término actualizada':'Fecha de término';
    var ftValor=ftStr2||ftStr;
    var dp=[['Obra / Proyecto',obra],['Edificio',edificio],['Oficina / Piso(s)',oficina],['Mandante',mandante],['Contratista',contratista],
      ['Fecha de inicio',fiStr],['Plazo contractual',plazoTotal],
      [ftLabel,ftValor+(hayAumento&&ftStr&&ftStr2?' (original: '+ftStr+')':'')],
      ['Monto del contrato',monto],['Superficie aprox.',superficie]];
    // Agregar fila de aumento si corresponde
    if(hayAumento&&aumDias){
      dp.splice(7,0,['Aumento de plazo',aumDias+' días corridos'+(aumMotivo?' — '+aumMotivo:'')]);
    }
    var profs=[];
    document.querySelectorAll('#mandante-profs .prof-row,#constructora-profs .prof-row,#arq-profs .prof-row,#ito-profs .prof-row,#pm-profs .prof-row').forEach(function(row){
      var inp=row.querySelectorAll('input');
      if(inp.length>=2&&inp[1].value) profs.push(inp[0].value+': '+inp[1].value);
    });
    function addDatosCol(sl,data,x,startY,step,lblH,valH){
      data.forEach(function(d,i){
        var y=startY+i*step;
        sl.addText(d[0],{x:x,y:y,w:4.4,h:lblH,fontSize:8,fontFace:FONT,color:GRIS,bold:true});
        sl.addShape(prs.ShapeType.rect,{x:x,y:y+lblH+0.01,w:4.4,h:0.01,fill:{color:'D0D8DC'},line:{color:'D0D8DC'}});
        sl.addText(d[1],{x:x,y:y+lblH+0.03,w:4.4,h:valH,fontSize:11,fontFace:FONT,color:NEGRO,bold:true,wrap:true});
      });
    }
    var dpMid=Math.ceil(dp.length/2);
    var dpLeft=dp.slice(0,dpMid), dpRight=dp.slice(dpMid);
    var dpMax=Math.max(dpLeft.length,dpRight.length);
    var dpAvailH=5.7-(CONT_Y+0.05);
    var dpStep=Math.min(0.68, dpAvailH/Math.max(dpMax,1));
    var dpLblH=0.18, dpValH=Math.min(0.32, dpStep-dpLblH-0.06);
    addDatosCol(s3,dpLeft,0.3,CONT_Y+0.05,dpStep,dpLblH,dpValH);
    addDatosCol(s3,dpRight,5.1,CONT_Y+0.05,dpStep,dpLblH,dpValH);
    if(profs.length){
      s3.addText('Profesionales a cargo',{x:0.3,y:5.9055,w:9.4,h:0.22,fontSize:8,fontFace:FONT,color:GRIS,bold:true});
      s3.addShape(prs.ShapeType.rect,{x:0.3,y:6.13,w:9.4,h:0.01,fill:{color:'D0D8DC'},line:{color:'D0D8DC'}});
      // Layout fijo por rol: fila1=Mandante|PM, fila2=Visitador|Admin, fila3=Arq|ITO
      // Recopilar profesionales por sección (soporte múltiples por cargo)
      var profSecs={
        'mandante': Array.from(document.querySelectorAll('#mandante-profs .prof-row')),
        'constructora': Array.from(document.querySelectorAll('#constructora-profs .prof-row')),
        'arq': Array.from(document.querySelectorAll('#arq-profs .prof-row')),
        'ito': Array.from(document.querySelectorAll('#ito-profs .prof-row')),
        'pm': Array.from(document.querySelectorAll('#pm-profs .prof-row'))
      };
      // Obtener nombres por sección (cargo solo en primera, resto con " | ")
      function getProfNombres(rows){
        var res=[];
        rows.forEach(function(r,i){
          var ins=r.querySelectorAll('input');
          var cargo=ins[0]?ins[0].value:''; var nombre=ins[1]?ins[1].value:'';
          if(!nombre) return;
          res.push(i===0?(cargo+': '+nombre):nombre);
        });
        return res;
      }
      function joinProfs(arr){ return arr.join(' | '); }
      var mandArr=getProfNombres(profSecs.mandante);
      var pmArr=getProfNombres(profSecs.pm);
      var arqArr=getProfNombres(profSecs.arq);
      var itoArr=getProfNombres(profSecs.ito);
      // Visitador y Administrador: cada uno en su propia fila (roles distintos)
      var constRows=Array.from(profSecs.constructora);
      var visArr=[],admArr=[];
      constRows.forEach(function(r){
        var ins=r.querySelectorAll('input');
        var cargo=ins[0]?ins[0].value:''; var nombre=ins[1]?ins[1].value:'';
        if(!nombre) return;
        if(cargo.toLowerCase().indexOf('visitador')>=0) visArr.push(cargo+': '+nombre);
        else admArr.push(cargo+': '+nombre);
      });
      // Layout: fila1=Mandante(s)|PM, fila2=Visitador|Administrador, fila3=Arq|ITO
      var allRows=[];
      // Fila mandante+PM (múltiples con |)
      allRows.push([joinProfs(mandArr), joinProfs(pmArr)]);
      // Visitador y Administrador: cada uno separado
      var maxVA=Math.max(visArr.length,admArr.length);
      if(maxVA===0) maxVA=1;
      for(var vi=0;vi<maxVA;vi++) allRows.push([visArr[vi]||'',admArr[vi]||'']);
      // Arq | ITO (múltiples con |)
      allRows.push([joinProfs(arqArr), joinProfs(itoArr)]);
      var pRowH=0.26, pY=6.16;
      allRows.forEach(function(row,ri){
        if(row[0]||row[1]){
          if(row[0]) s3.addText(row[0],{x:0.3,y:pY+ri*pRowH,w:4.5,h:pRowH,fontSize:10,fontFace:FONT,color:NEGRO,wrap:true});
          if(row[1]) s3.addText(row[1],{x:5.0,y:pY+ri*pRowH,w:4.5,h:pRowH,fontSize:10,fontFace:FONT,color:NEGRO,wrap:true});
        }
      });
    }

    // ══ ESTATUS DOCUMENTACIÓN ══
    slideNum++;
    var s4=prs.addSlide();
    addHF(s4,'2. Estatus de documentación',slideNum);
    var docRows=document.querySelectorAll('#doc-tbody tr');
    var docTR=[];
    docRows.forEach(function(tr,ri){
      var sem=tr.querySelector('.sem-btn');
      var isV=sem&&sem.classList.contains('verde');
      var isA=sem&&sem.classList.contains('amarillo');
      var eT=isV?'● Aprobado':isA?'● En proceso':'● No iniciado';
      var eC=isV?'2d9e5f':isA?'CC8800':'d93a3a';
      var inp=tr.querySelectorAll('input');
      var nombre=inp[0]?inp[0].value:'—';
      var fecha=inp[1]?inp[1].value:'';
      var fechaD=fecha?fmtDate(fecha):'—';
      var com=inp[2]?inp[2].value:'';
      docTR.push([{text:eT,color:eC,align:'center',bold:true},{text:nombre},{text:fechaD,align:'center',color:GRIS},{text:com,color:GRIS,italic:!!com}]);
    });
    addProfTable(s4,['Estado','Protocolo / Documento','Fecha aprobación','Comentarios'],
      docTR,[1.3,3.8,1.4,2.9],0.25,CONT_Y+0.05,9.5,12,10);

    // ══ ESTATUS PROYECTOS ══
    slideNum++;
    var s5=prs.addSlide();
    addHF(s5,'3. Estatus de aprobación de proyectos',slideNum);
    var proyRows=document.querySelectorAll('#proy-tbody tr');
    var proyTR=[];
    // Tabla con historial completo por especialidad
    // Encabezados principales
    var proyHeaders=[
      {text:'Estado',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}},
      {text:'Especialidad',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}},
      {text:'Iteración',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}},
      {text:'Tipo de revisión',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}},
      {text:'Fecha',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}},
      {text:'Aprobación',options:{bold:true,fontSize:11,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center',valign:'middle'}}
    ];
    var proyTD=[proyHeaders];
    var TIPO_ICO={'Ingreso':'📥','Observaciones':'📋','Reingreso':'🔄','Aprobación final':'✅'};
    var globalRow=0;
    proyRows.forEach(function(tr){
      var sem=tr.querySelector('.sem-btn');
      var isV=sem&&sem.classList.contains('verde');
      var isA=sem&&sem.classList.contains('amarillo');
      var eT=isV?'● Aprobado':isA?'● En revisión':'● No iniciado';
      var eC=isV?'2d9e5f':isA?'CC8800':'d93a3a';
      var tds=tr.querySelectorAll('td');
      var esp=tds[1]&&tds[1].querySelector('input')?tds[1].querySelector('input').value:'—';
      var fa=tds[3]&&tds[3].querySelector('input')?tds[3].querySelector('input').value:'';
      var faS=fa?fmtDate(fa):'—';
      var com=''; // columna comentarios eliminada
      var hrows=tr.querySelectorAll('.hist-row');
      var n=Math.max(hrows.length,1);
      for(var hi=0;hi<n;hi++){
        var hr2=hrows[hi];
        var tN='—', tF='—';
        if(hr2){
          var sel=hr2.querySelector('select');
          if(sel) tN=sel.options[sel.selectedIndex].text;
          var di=hr2.querySelector('input[type=date]');
          if(di&&di.value) tF=fmtDate(di.value);
        }
        var ico=TIPO_ICO[tN]||'';
        var bg=globalRow%2===0?'FFFFFF':TBL_ALT;
        var row=[];
        if(hi===0){
          // estado y especialidad sólo en primera fila de la especialidad
          row.push({text:eT,options:{fontSize:9,fontFace:FONT,color:eC,bold:true,align:'center',valign:'middle',fill:{color:bg}}});
          row.push({text:esp,options:{fontSize:9,fontFace:FONT,bold:true,color:NEGRO,valign:'middle',fill:{color:bg}}});
        } else {
          row.push({text:'',options:{fontSize:9,fontFace:FONT,color:NEGRO,fill:{color:bg}}});
          row.push({text:'',options:{fontSize:9,fontFace:FONT,color:NEGRO,fill:{color:bg}}});
        }
        row.push({text:String(hi+1)+'ª',options:{fontSize:9,fontFace:FONT,color:GRIS,align:'center',valign:'middle',fill:{color:bg}}});
        row.push({text:ico+' '+tN,options:{fontSize:9,fontFace:FONT,color:tN==='Aprobación final'?'2d9e5f':NEGRO,bold:tN==='Aprobación final',valign:'middle',fill:{color:bg}}});
        row.push({text:tF,options:{fontSize:9,fontFace:FONT,color:GRIS,align:'center',valign:'middle',fill:{color:bg}}});
        if(hi===0){
          row.push({text:faS,options:{fontSize:9,fontFace:FONT,color:isV?'2d9e5f':GRIS,bold:isV,align:'center',valign:'middle',fill:{color:bg}}});
          // columna comentarios eliminada
        } else {
          row.push({text:'',options:{fontSize:9,fontFace:FONT,fill:{color:bg}}});
          row.push({text:'',options:{fontSize:9,fontFace:FONT,fill:{color:bg}}});
        }
        proyTD.push(row);
        globalRow++;
      }
    });
    // Calcular anchos de columna automáticamente según contenido máximo
    // Cada columna: medir el texto más largo (título o dato) y asignar ancho proporcional
    var colTitles=['Estado','Especialidad','Iter.','Tipo de revisión','Fecha','Aprobación','Comentarios'];
    // Aproximar px por char según fuente 9pt (≈0.065" por carácter en Century Gothic 9pt)
    var CPP=0.072; // inches per char
    var MIN_W=[0.9,1.2,0.45,1.6,0.82,0.95,1.2]; // mínimos por columna
    var maxW=[0,0,0,0,0,0];
    // Medir títulos
    colTitles.forEach(function(t,ci){ maxW[ci]=Math.max(maxW[ci],t.length*CPP+0.1); });
    // Medir datos
    proyTD.slice(1).forEach(function(row){
      row.forEach(function(cell,ci){
        var txt=(cell.text||cell.options&&cell.options.text||'').toString();
        maxW[ci]=Math.max(maxW[ci],txt.length*CPP+0.1);
      });
    });
    // Aplicar mínimos y normalizar a ancho total 9.5"
    var autoW=maxW.map(function(w,i){ return Math.max(w,MIN_W[i]); });
    var sumW=autoW.reduce(function(a,b){return a+b;},0);
    var scale=9.5/sumW;
    var colW=autoW.map(function(w){ return Math.round(w*scale*100)/100; });
    s5.addTable(proyTD,{x:0.2,y:CONT_Y+0.05,w:9.6,
      colW:colW,
      rowH:0.3,border:{color:'D0D8DC',pt:0.5},fill:{color:'FFFFFF'}});

    // ══ CONTROL CURVA S ══
    slideNum++;
    var s6=prs.addSlide();
    addHF(s6,'4. Control Curva S',slideNum);
    var lblProg=document.getElementById('lbl-prog').textContent;
    var lblReal=document.getElementById('lbl-real').textContent;
    var lblDesv=document.getElementById('lbl-desv').textContent;
    var desvNeg=lblDesv.indexOf('-')>=0, desvPos=lblDesv.indexOf('+')>=0;
    var desvC=desvNeg?'d93a3a':(desvPos?'1a5fa8':NEGRO);
    // Leyenda avance — encima de la tabla/gráfico
    // Leyenda: izquierda, uno debajo del otro
    var leyX=0.2, leyY=CONT_Y+0.05, leyLH=0.38;
    s6.addText(lblProg,{x:leyX,y:leyY,          w:5.0,h:leyLH,fontSize:14,fontFace:FONT,bold:true,color:'888888',valign:'middle'});
    s6.addText(lblReal,{x:leyX,y:leyY+leyLH,    w:5.0,h:leyLH,fontSize:14,fontFace:FONT,bold:true,color:'1a5fa8',valign:'middle'});
    s6.addText(lblDesv,{x:leyX,y:leyY+leyLH*2,  w:5.0,h:leyLH,fontSize:14,fontFace:FONT,bold:true,color:desvC, valign:'middle'});
    // Gráfico: posición exacta 8cm x 8cm, tamaño 16.3cm x 7.55cm
    var gfxX=3.252, gfxY=2.0433, gfxW=6.4173; // x=8.26cm y=5.19cm w=16.3cm, h calculado por aspecto
    // Tabla: izquierda del gráfico, alineada al top del gráfico
    var tblW=2.8, tblX=0.2;
    var notaY=5.9055;
    // Tabla avance — fuente 12 encabezado, 10 body
    var csRows=document.querySelectorAll('#cs-tbody tr');
    if(csRows.length>0){
      var csTD=[[
        {text:'Sem.',options:{bold:true,fontSize:12,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center'}},
        {text:'Prog.%',options:{bold:true,fontSize:12,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center'}},
        {text:'Real%',options:{bold:true,fontSize:12,fontFace:FONT,color:'FFFFFF',fill:{color:TBL_HEAD},align:'center'}}
      ]];
      csRows.forEach(function(tr,ri){
        var lbl=tr.querySelector('.cs-lbl');
        var prog=tr.querySelector('.cs-prog');
        var real=tr.querySelector('.cs-real');
        var pV=prog&&prog.value!==''?parseFloat(prog.value):null;
        var rV=real&&real.value!==''?parseFloat(real.value):null;
        var dV=pV!==null&&rV!==null?rV-pV:null;
        var rC=dV!==null?(dV<0?'d93a3a':dV>0?'1a5fa8':NEGRO):GRIS;
        var bg=ri%2===0?'FFFFFF':TBL_ALT;
        csTD.push([
          {text:lbl?(lbl.textContent==='Saldo'?'Término obra':lbl.textContent):'—',options:{fontSize:10,fontFace:FONT,color:NEGRO,align:'center',fill:{color:bg}}},
          {text:pV!==null?pV.toFixed(1)+'%':'—',options:{fontSize:10,fontFace:FONT,color:'888888',align:'center',fill:{color:bg}}},
          {text:rV!==null?rV.toFixed(1)+'%':'—',options:{fontSize:10,fontFace:FONT,color:rC,bold:rV!==null,align:'center',fill:{color:bg}}}
        ]);
      });
      // Ajustar rowH para que la tabla no se desborde: desde y=3.1496 hasta comentarios y=5.9055
      // Ajustar automáticamente: desde tblY=3.1496" hasta notas y=5.9055"
      var tblY=3.1496, tblMaxH=5.9055-tblY-0.05;
      var nRows=csTD.length; // incluye header
      var rowH=Math.min(0.26, tblMaxH/Math.max(nRows,1));
      // Si rowH < 0.18 reducir fuente para que quepa el texto
      var tblFontHead=12, tblFontBody=10;
      if(rowH<0.20){ tblFontHead=10; tblFontBody=8; }
      if(rowH<0.16){ tblFontHead=8;  tblFontBody=7; }
      // Aplicar tamaño de fuente calculado a cada celda
      csTD.forEach(function(row,ri){
        row.forEach(function(cell){
          if(ri===0) cell.options.fontSize=tblFontHead;
          else if(cell.options) cell.options.fontSize=tblFontBody;
        });
      });
      s6.addTable(csTD,{x:tblX,y:tblY,w:tblW,colW:[tblW*0.3,tblW*0.35,tblW*0.35],
        rowH:rowH,border:{color:'D0D8DC',pt:0.5},fill:{color:'FFFFFF'}});
    }
    // Gráfico derecha
    var chartCanvas=document.getElementById('cs-chart');
    if(chartCanvas&&chartCanvas.width>0){
      // Recortar bordes blancos detectando área con contenido
      var ctxOrig=chartCanvas.getContext('2d');
      var imgData=ctxOrig.getImageData(0,0,chartCanvas.width,chartCanvas.height);
      var pixels=imgData.data;
      var minX=chartCanvas.width,minY=chartCanvas.height,maxX=0,maxY=0;
      for(var py=0;py<chartCanvas.height;py++){
        for(var px=0;px<chartCanvas.width;px++){
          var idx4=(py*chartCanvas.width+px)*4;
          var rp=pixels[idx4],gp=pixels[idx4+1],bp=pixels[idx4+2],ap=pixels[idx4+3];
          if(ap>10&&!(rp>245&&gp>245&&bp>245)){
            if(px<minX)minX=px; if(px>maxX)maxX=px;
            if(py<minY)minY=py; if(py>maxY)maxY=py;
          }
        }
      }
      // Margen mínimo para no cortar puntos
      var margin=6;
      minX=Math.max(0,minX-margin); minY=Math.max(0,minY-margin);
      maxX=Math.min(chartCanvas.width-1,maxX+margin);
      maxY=Math.min(chartCanvas.height-1,maxY+margin);
      var cropW=maxX-minX+1, cropH=maxY-minY+1;
      // Calcular h proporcional al aspecto original — ancho fijo 16.3cm
      var gfxH=gfxW*(cropH/cropW);
      // Escalar a 150ppp respetando aspecto
      var targetW=Math.round(gfxW*150), targetH=Math.round(gfxH*150);
      var cvOut=document.createElement('canvas');
      cvOut.width=targetW; cvOut.height=targetH;
      var ctxOut=cvOut.getContext('2d');
      ctxOut.fillStyle='#FFFFFF';
      ctxOut.fillRect(0,0,targetW,targetH);
      ctxOut.drawImage(chartCanvas,minX,minY,cropW,cropH,0,0,targetW,targetH);
      s6.addImage({data:cvOut.toDataURL('image/jpeg',0.88),x:gfxX,y:gfxY,w:gfxW,h:gfxH});
    }
    // Nota en negrita con prefijo
    var csNota=document.getElementById('cs-nota').value;
    if(csNota){
      s6.addText([{text:'Comentarios: ',options:{bold:true}},{text:csNota,options:{bold:false}}],
        {x:3.252,y:6.2283,w:SW-3.252-0.1,h:0.4,fontSize:10,fontFace:FONT,color:GRIS,wrap:true,valign:'top'});
    }

    // ══ SITUACIÓN GENERAL — múltiples slides si es necesario ══
    var p1txt=document.getElementById('sg-p1-texto').textContent;
    var partidas=[];
    document.querySelectorAll('#partidas-list .partida-input').forEach(function(inp){if(inp.value.trim())partidas.push(inp.value.trim());});

    // ── Puntos de arrastre (informe anterior) ──
    var pendArrastre=[];
    document.querySelectorAll('#sg-pendientes-list .pend-card').forEach(function(card){
      var ta=card.querySelector('.pend-texto');
      var est=card.dataset.estado||'pendiente';
      var txt=ta?ta.value.trim():'';
      if(txt) pendArrastre.push({texto:txt,estado:est});
    });

    // ── Puntos nuevos de la semana ──
    var pList=[];
    pList.push({n:1,texto:p1txt,estado:'',warning:'',isP2:false});
    pList.push({n:2,texto:'',estado:'',warning:'',isP2:true});
    document.querySelectorAll('#sg-puntos-list .sg-punto-row').forEach(function(row,i){
      var ta=row.querySelector('.sg-punto-text');
      var est=row.dataset.estado||'';
      var eL=est==='cerrado'?' [Cerrado]':est==='proceso'?' [En proceso]':est==='pendiente'?' [Pendiente]':est==='urgente'?' [URGENTE]':'';
      if(ta&&ta.value.trim()) pList.push({n:i+3,texto:ta.value.trim(),estado:est,warning:eL,isP2:false});
    });
    // SG: 2 columnas para optimizar espacio
    var COL_W=(SW-0.6)/2;   // ancho de cada columna
    var COL_L=0.25;          // x columna izquierda
    var COL_R=COL_L+COL_W+0.1; // x columna derecha
    var COL_MAX=MAX_Y-0.1;

    function newSgSlide(){
      slideNum++;
      var sl=prs.addSlide();
      addHF(sl,'5. Situación general de la obra',slideNum);
      // Línea divisoria vertical entre columnas
      sl.addShape(prs.ShapeType.rect,{
        x:COL_L+COL_W+0.03, y:CONT_Y+0.02,
        w:0.01, h:MAX_Y-CONT_Y-0.05,
        fill:{color:'BFC3C5'}, line:{color:'BFC3C5'}
      });
      return {slide:sl, yPosL:CONT_Y+0.05, yPosR:CONT_Y+0.05, col:0};
    }
    function addSgText(ctx, txt, h, opts){
      // Si la columna activa no tiene espacio, intentar la otra
      if(ctx.col===0 && ctx.yPosL+h > COL_MAX){
        if(ctx.yPosR+h <= COL_MAX){ ctx.col=1; } // pasar a columna derecha
        else { return null; } // sin espacio en ninguna — señal para nueva slide
      }
      if(ctx.col===1 && ctx.yPosR+h > COL_MAX){ return null; }
      var x = ctx.col===0 ? COL_L : COL_R;
      var y = ctx.col===0 ? ctx.yPosL : ctx.yPosR;
      ctx.slide.addText(txt, Object.assign({x:x,y:y,w:COL_W,h:h,wrap:true,valign:'top'}, opts));
      if(ctx.col===0) ctx.yPosL+=h+0.03;
      else            ctx.yPosR+=h+0.03;
      return true;
    }

    var sgCtx=newSgSlide();

    pList.forEach(function(p){
      if(p.isP2){
        var encH=0.22;
        var ok=addSgText(sgCtx,p.n+'.  Se verifican los siguientes trabajos en ejecución:',encH,{fontSize:10,fontFace:FONT,color:NEGRO});
        if(!ok){ var nx=newSgSlide(); sgCtx.slide=nx.slide; sgCtx.yPosL=nx.yPosL; sgCtx.yPosR=nx.yPosR; sgCtx.col=0;
          addSgText(sgCtx,p.n+'.  Se verifican los siguientes trabajos en ejecución:',encH,{fontSize:10,fontFace:FONT,color:NEGRO}); }
        partidas.forEach(function(part){
          var pH=Math.max(0.2,Math.ceil(part.length/45)*0.175);
          // Partidas con sangría: usar x+0.3 dentro de addSgText no es posible directamente
          // Añadir manualmente
          var tryCol=sgCtx.col; var tryY=tryCol===0?sgCtx.yPosL:sgCtx.yPosR;
          if(tryY+pH>COL_MAX){
            if(tryCol===0&&sgCtx.yPosR+pH<=COL_MAX){ sgCtx.col=1; tryCol=1; tryY=sgCtx.yPosR; }
            else{ var nx2=newSgSlide(); sgCtx.slide=nx2.slide; sgCtx.yPosL=nx2.yPosL; sgCtx.yPosR=nx2.yPosR; sgCtx.col=0; tryCol=0; tryY=sgCtx.yPosL; }
          }
          var px=tryCol===0?COL_L+0.25:COL_R+0.25;
          sgCtx.slide.addText('— '+part,{x:px,y:tryY,w:COL_W-0.25,h:pH,fontSize:10,fontFace:FONT,color:NEGRO,wrap:true,valign:'top'});
          if(tryCol===0) sgCtx.yPosL+=pH+0.03; else sgCtx.yPosR+=pH+0.03;
        });
      } else {
        var semIco=p.estado==='pendiente'||p.estado==='urgente'?'🔴 ':p.estado==='proceso'?'🟡 ':p.estado==='cerrado'?'🟢 ':'';
        var fullTxt=p.n+'.  '+semIco+p.texto.replace(/\n/g,' ')+(p.warning?' '+p.warning:'');
        var nL=Math.ceil(fullTxt.length/46)+1;
        var h=Math.max(0.22,nL*0.165);
        var txtC=p.estado==='urgente'?'d93a3a':NEGRO;
        var textOpts={fontSize:10,fontFace:FONT,color:txtC,bold:p.estado==='urgente'};
        if(p.estado==='urgente') textOpts.highlight='FFF3CD';
        var ok2=addSgText(sgCtx,fullTxt,h,textOpts);
        if(!ok2){ var nx3=newSgSlide(); sgCtx.slide=nx3.slide; sgCtx.yPosL=nx3.yPosL; sgCtx.yPosR=nx3.yPosR; sgCtx.col=0;
          addSgText(sgCtx,fullTxt,h,textOpts); }
      }
    });
    // ══ PUNTOS DE ARRASTRE (slide adicional si hay) ══
    if(pendArrastre.length>0){
      var sgCtxA=newSgSlide();
      sgCtxA.slide.addText('⟵ Puntos de arrastre del informe anterior',
        {x:COL_L,y:CONT_Y-0.18,w:SW-0.5,h:0.18,fontSize:9,fontFace:FONT,color:GRIS,italic:true});
      var yPA=CONT_Y+0.05;
      pendArrastre.forEach(function(p){
        if(yPA>=MAX_Y-0.1){ var nxA=newSgSlide(); sgCtxA.slide=nxA.slide; yPA=nxA.yPosL; }
        var semIco=p.estado==='pendiente'||p.estado==='urgente'?'🔴 ':p.estado==='proceso'?'🟡 ':p.estado==='cerrado'?'🟢 ':'';
        var txt2=semIco+p.texto;
        var h2=Math.max(0.22,Math.ceil(txt2.length/92)*0.165+0.05);
        var txtC2=p.estado==='urgente'?'d93a3a':NEGRO;
        var opts2={x:COL_L,y:yPA,w:SW-0.5,h:h2,fontSize:10,fontFace:FONT,color:txtC2,wrap:true,valign:'top'};
        if(p.estado==='urgente') opts2.highlight='FFF3CD';
        sgCtxA.slide.addText(txt2,opts2);
        yPA+=h2+0.03;
      });
    }

    // ══ LAY OUT ARQUITECTURA ══
    slideNum++;
    var s8=prs.addSlide();
    addHF(s8,'6. Lay Out Arquitectura vigente',slideNum);
    var loImg=document.getElementById('lo-preview-img');
    var loVer=document.getElementById('lo-version').value;
    var loFecha=document.getElementById('lo-fecha').value;
    var loAutor=document.getElementById('lo-autor').value;
    var loDesc=document.getElementById('lo-desc').value;
    // (dimensiones imagen calculadas dinámicamente por aspecto)
    // Imagen del plano: y=5.54cm=2.1811", h=11.43cm=4.5"
    // Ancho proporcional al aspecto original de la imagen
    var loSrc2 = loImg && loImg.src && loImg.src.length > 100 ? loImg.src : null;
    var hasImg = !!loSrc2;
    // Calcular ancho proporcional
    var loNatW=loImg&&loImg.naturalWidth?loImg.naturalWidth:1;
    var loNatH=loImg&&loImg.naturalHeight?loImg.naturalHeight:1;
    var loAspect=loNatW/loNatH;
    var loH=4.5; // 11.43cm
    var loY=2.1811; // 5.54cm
    var loW=loH*loAspect;
    if(loW>SW-0.4) { loW=SW-0.4; } // no superar ancho disponible
    var loX=(SW-loW)/2; // centrado horizontal
    if(hasImg){
      // Crear imagen temporal para garantizar decodificación
      var tmpLoImg=new Image();
      tmpLoImg.src=loSrc2;
      // Si ya está decodificada (naturalWidth>0) usar directamente, si no usar loImg
      var srcImg=(loImg&&loImg.naturalWidth>0)?loImg:tmpLoImg;
      var loNW=srcImg.naturalWidth||800, loNH=srcImg.naturalHeight||600;
      var loAR=loNW/loNH;
      var loTH=675, loTW=Math.min(Math.round(loTH*loAR),1050);
      var loCv=document.createElement('canvas');
      loCv.width=loTW; loCv.height=loTH;
      var loCtx=loCv.getContext('2d');
      loCtx.fillStyle='#ffffff'; loCtx.fillRect(0,0,loTW,loTH);
      loCtx.drawImage(srcImg,0,0,loTW,loTH);
      var loData=loCv.toDataURL('image/jpeg',0.85);
      loW=loH*loAR; if(loW>SW-0.4){loW=SW-0.4;} loX=(SW-loW)/2;
      s8.addImage({data:loData,x:loX,y:loY,w:loW,h:loH});
    } else {
      // Sin imagen — aviso
      s8.addShape(prs.ShapeType.rect,{x:0.2,y:loY,w:SW-0.4,h:loH,fill:{color:'F5F5F5'},line:{color:'CCCCCC',pt:1}});
      s8.addText('Plano no adjunto. Sube el plano como JPG o PNG para que aparezca aquí.',
        {x:0.5,y:loY+loH/2-0.3,w:SW-1.0,h:0.6,fontSize:11,fontFace:FONT,color:GRIS,align:'center',wrap:true});
    }
    // Versión del plano: y=4.82cm=1.8976", centrado en página
    var cPts=[];
    if(loVer) cPts.push('Versión: '+loVer);
    if(loFecha) cPts.push('Fecha: '+fmtDate(loFecha));
    if(loAutor) cPts.push('Emitido por: '+loAutor);
    if(cPts.length) s8.addText(cPts.join('   —   '),
      {x:0,y:1.8976,w:SW,h:0.28,fontSize:10,fontFace:FONT,color:GRIS,italic:true,align:'center',valign:'middle'});
    // Comentarios: y=16.47cm=6.4843", centrado respecto al ancho de la imagen
    if(loDesc) s8.addText(loDesc,
      {x:loX,y:6.4843,w:loW,h:0.28,fontSize:10,fontFace:FONT,color:GRIS,align:'center',valign:'middle'});

    // ══ FOTOGRAFÍAS — posiciones exactas, tamaño bloqueado ══
    if(fotos.length>0){
      for(var fi3=0;fi3<fotos.length;fi3+=2){
        slideNum++;
        var sf=prs.addSlide();
        addHF(sf,'7. Fotografías relevantes',slideNum);
        var batch=fotos.slice(fi3,fi3+2);
        batch.forEach(function(foto,bi){
          var fx=bi===0?FOTO_L_X:FOTO_R_X;
          var fy=FOTO_Y2;
          // Imagen ya convertida a JPEG al cargar — insertar directamente
          sf.addImage({data:foto.dataUrl,x:fx,y:fy,w:FOTO_W,h:FOTO_H,
            sizing:{type:'cover',w:FOTO_W,h:FOTO_H},
            shadow:{type:'outer',color:'000000',opacity:0.47,blur:7,offset:8,angle:50}});
          // Número foto
          sf.addText('Foto '+(fi3+bi+1),{x:fx+0.04,y:fy+0.04,w:0.85,h:0.22,
            fontSize:10,fontFace:FONT,bold:true,color:'FFFFFF',fill:{color:ROJO}});
          // Badges
          var badgeText='';
          if(foto.warning&&foto.resuelto) badgeText='⚠ ADVERTENCIA  |  ✓ RESUELTO';
          else if(foto.warning) badgeText='⚠ ADVERTENCIA';
          else if(foto.resuelto) badgeText='✓ RESUELTO';
          if(badgeText){
            var bC=foto.resuelto&&!foto.warning?'2d9e5f':'CC8800';
            sf.addText(badgeText,{x:fx+FOTO_W-2.1,y:fy+0.04,w:2.1,h:0.2,
              fontSize:7,fontFace:FONT,bold:true,color:'000000',fill:{color:bC}});
          }
          // Textos bajo la foto
          var pY=fy+FOTO_H+0.06;
          var gN='';
          if(foto.grupo!==''&&fotoGrupos[foto.grupo]) gN=fotoGrupos[foto.grupo].nombre;
          if(gN) sf.addText(gN,{x:fx,y:pY,w:FOTO_W,h:0.28,fontSize:14,fontFace:FONT,bold:true,color:ROJO});
          if(foto.pie) sf.addText(foto.pie,{x:fx,y:pY+(gN?0.22:0),w:FOTO_W,h:0.44,fontSize:12,fontFace:FONT,color:NEGRO,wrap:true});
          var dY=pY+(gN?0.22:0)+(foto.pie?0.4:0);
          if(foto.warning&&foto.warningTxt&&dY<MAX_Y)
            sf.addText('⚠ '+foto.warningTxt,{x:fx,y:dY,w:FOTO_W,h:0.28,fontSize:12,fontFace:FONT,color:'7a6010',italic:true,wrap:true});
          if(foto.resuelto&&foto.resueltoTxt&&dY<MAX_Y)
            sf.addText('✓ '+foto.resueltoTxt,{x:fx,y:dY+(foto.warning&&foto.warningTxt?0.3:0),w:FOTO_W,h:0.28,fontSize:12,fontFace:FONT,color:'2d7a4f',italic:true,wrap:true});
        });
      }
    }

    // ══ ANEXOS ══
    if(anexos.length>0){
      slideNum++;
      var sa=prs.addSlide();
      addHF(sa,'8. Anexos',slideNum);
      var anxR=[];
      var anxY=CONT_Y+0.05;
      anexos.forEach(function(a,ai){
        // If has preview (image or PDF-rendered), show thumbnail on left
        if(a.previewUrl){
          var thW=1.6, thH=1.1;
          // Compresión SÍNCRONA thumbnail anexo
          var aTh=document.createElement('canvas');
          aTh.width=300; aTh.height=200;
          var aTImg=new Image(); aTImg.src=a.previewUrl;
          aTh.getContext('2d').drawImage(aTImg,0,0,300,200);
          sa.addImage({data:aTh.toDataURL('image/jpeg',0.75),x:0.25,y:anxY,w:thW,h:thH,sizing:{type:'contain',w:thW,h:thH}});
          sa.addText(a.tipo,{x:0.25+thW+0.1,y:anxY,w:1.2,h:0.22,fontSize:10,fontFace:FONT,bold:true,color:NEGRO});
          sa.addText(a.titulo||a.nombre,{x:0.25+thW+0.1,y:anxY+0.24,w:SW-thW-0.7,h:0.22,fontSize:10,fontFace:FONT,color:NEGRO});
          if(a.desc) sa.addText(a.desc,{x:0.25+thW+0.1,y:anxY+0.48,w:SW-thW-0.7,h:0.22,fontSize:9,fontFace:FONT,color:GRIS,italic:true});
          anxY+=thH+0.12;
        } else {
          anxR.push([{text:a.tipo,bold:true},{text:a.titulo||a.nombre},{text:a.nombre,color:GRIS},{text:a.desc,color:GRIS,italic:!!a.desc}]);
        }
      });
      if(anxR.length>0){
        addProfTable(sa,['Tipo','Título / Documento','Archivo','Descripción'],
          anxR,[1.4,2.8,2.5,2.8],0.25,anxY,9.5,12,10);
      }
    }

    // ══ DIAPOSITIVA FINAL — sin cintas, solo logo centrado ══
    var sfin=prs.addSlide();
    sfin.addShape(prs.ShapeType.rect,{x:0,y:SH-0.04,w:SW,h:0.04,fill:{color:ROJO},line:{color:ROJO}});
    sfin.addImage({data:LOGO2_DATA,x:(SW-6.9094)/2,y:(SH-1.1102)/2,w:6.9094,h:1.1102});

    // ══ DESCARGAR ══
    var nS=String(nroInf).padStart(3,'0');
    var oS=obra.replace(/[^a-zA-Z0-9 ]/g,'').trim().replace(/ +/g,'_').substring(0,30);
    prs.writeFile({fileName:'Informe_ITO_'+nS+'_'+oS+'.pptx'})
      .then(function(){console.log('PPT OK');})
      .catch(function(err){alert('Error: '+err);});
  }


  // ══ HISTORIAL DE OBRAS ══════════════════════════════
  var HIST_KEY = 'jasv_historial_v1';

  // ── Recolectar todo el estado del formulario ──
  function recolectarEstado() {
    var estado = {};
    // Portada
    ['nro-informe','fecha-emision','semana-informe','nombre-obra','nombre-edificio',
     'direccion-obra','mandante','contratista'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) estado[id] = el.value;
    });
    // Datos proyecto
    ['nro-oficina','fecha-inicio','plazo-dias','fecha-termino','moneda','monto-valor',
     'monto-desc','descripcion-proyecto','superficie'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) estado[id] = el.value;
    });
    var chkA = document.getElementById('chk-aumento');
    if(chkA){ estado['chk-aumento'] = chkA.checked;
      ['aumento-dias','aumento-motivo','fecha-termino-nueva'].forEach(function(id){
        var el=document.getElementById(id); if(el) estado[id]=el.value;
      });
    }
    // Profesionales (todos los inputs en prof-rows)
    estado.profs = {};
    ['mandante-profs','constructora-profs','arq-profs','ito-profs','pm-profs'].forEach(function(sec){
      var rows = document.querySelectorAll('#'+sec+' .prof-row');
      estado.profs[sec] = Array.from(rows).map(function(r){
        var ins = r.querySelectorAll('input');
        return { cargo: ins[0]?ins[0].value:'', nombre: ins[1]?ins[1].value:'' };
      });
    });
    // Estatus documentación
    estado.docRows = Array.from(document.querySelectorAll('#doc-tbody tr')).map(function(tr){
      var ins = tr.querySelectorAll('input'); var sem = tr.querySelector('.sem-btn');
      var semClass = sem ? (sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo') : 'rojo';
      return { semaforo: semClass, nombre: ins[0]?ins[0].value:'', fecha: ins[1]?ins[1].value:'', com: ins[2]?ins[2].value:'' };
    });
    // Estatus proyectos
    estado.proyRows = Array.from(document.querySelectorAll('#proy-tbody tr')).map(function(tr){
      var tds = tr.querySelectorAll('td');
      var sem = tr.querySelector('.sem-btn');
      var semClass = sem?(sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo'):'rojo';
      var esp = tds[1]&&tds[1].querySelector('input')?tds[1].querySelector('input').value:'';
      var fa = tds[3]&&tds[3].querySelector('input')?tds[3].querySelector('input').value:'';
      var hrows = Array.from(tr.querySelectorAll('.hist-row')).map(function(hr){
        var sel=hr.querySelector('select'); var di=hr.querySelector('input[type=date]');
        return { tipo: sel?sel.value:'', fecha: di?di.value:'' };
      });
      return { semaforo:semClass, especialidad:esp, fechaAprobacion:fa, historial:hrows };
    });
    // Curva S
    estado.csInicio = document.getElementById('cs-inicio')?document.getElementById('cs-inicio').value:'';
    estado.csTermino = document.getElementById('cs-termino')?document.getElementById('cs-termino').value:'';
    estado.diaControl = document.getElementById('dia-control')?document.getElementById('dia-control').value:'4';
    estado.csNota = document.getElementById('cs-nota')?document.getElementById('cs-nota').value:'';
    estado.csRows = Array.from(document.querySelectorAll('#cs-tbody tr')).map(function(tr){
      var lbl=tr.querySelector('.cs-lbl'); var fi=tr.querySelector('.cs-fi');
      var prog=tr.querySelector('.cs-prog'); var real=tr.querySelector('.cs-real');
      return { lbl:lbl?lbl.textContent:'', fi:fi?fi.value:'', prog:prog?prog.value:'', real:real?real.value:'' };
    });
    // Situación general
    estado.sgFechaVisita = document.getElementById('sg-fecha-visita')?document.getElementById('sg-fecha-visita').value:'';
    estado.sgNroVisita = document.getElementById('sg-nro-visita')?document.getElementById('sg-nro-visita').value:'';
    estado.partidas = Array.from(document.querySelectorAll('#partidas-list .partida-input')).map(function(i){return i.value;});
    estado.sgPuntos = Array.from(document.querySelectorAll('#sg-puntos-list .sg-punto-row')).map(function(r){
      var ta=r.querySelector('.sg-punto-text');
      return { texto:ta?ta.value:'', estado:r.dataset.estado||'' };
    });
    estado.sgPendientesAnterior = typeof recolectarPendientes==='function' ? recolectarPendientes() : [];
    // Lay Out
    ['lo-version','lo-fecha','lo-autor','lo-desc'].forEach(function(id){
      var el=document.getElementById(id); if(el) estado[id]=el.value;
    });
    var loImg=document.getElementById('lo-preview-img');
    var loImgEl2=document.getElementById('lo-preview-img');
    estado.loImgSrc = loImgEl2&&loImgEl2.src&&loImgEl2.src.length>100?loImgEl2.src:'';
    estado.loImgW = (loImgEl2&&loImgEl2.naturalWidth>0)?loImgEl2.naturalWidth:800;
    estado.loImgH = (loImgEl2&&loImgEl2.naturalHeight>0)?loImgEl2.naturalHeight:600;
    // Fotografías (con dataUrl ya comprimido)
    estado.fotos = fotos.map(function(f){
      return { dataUrl:f.dataUrl, pie:f.pie, grupo:f.grupo,
               warning:f.warning, warningTxt:f.warningTxt,
               resuelto:f.resuelto, resueltoTxt:f.resueltoTxt };
    });
    estado.fotoGrupos = fotoGrupos.map(function(g){ return { nombre:g.nombre }; });
    // Anexos (sin rawFile, solo metadata)
    estado.anexos = anexos.map(function(a){
      return { nombre:a.nombre, size:a.size, tipo:a.tipo, titulo:a.titulo,
               desc:a.desc, icono:a.icono, previewUrl:a.previewUrl||null };
    });
    return estado;
  }

  // ── Restaurar estado completo ──
  function restaurarEstado(estado) {
    // Campos simples
    var camposSimples = ['nro-informe','fecha-emision','semana-informe','nombre-obra',
      'nombre-edificio','direccion-obra','mandante','contratista',
      'nro-oficina','fecha-inicio','plazo-dias','fecha-termino','moneda','monto-valor',
      'monto-desc','descripcion-proyecto','superficie',
      'aumento-dias','aumento-motivo','fecha-termino-nueva',
      'cs-inicio','cs-termino','dia-control','cs-nota',
      'sg-fecha-visita','sg-nro-visita','sg-pendientes-anterior',
      'lo-version','lo-fecha','lo-autor','lo-desc'];
    camposSimples.forEach(function(id){
      var el=document.getElementById(id);
      if(el && estado[id]!==undefined) el.value=estado[id];
    });
    var chkA=document.getElementById('chk-aumento');
    if(chkA && estado['chk-aumento']!==undefined){
      chkA.checked=estado['chk-aumento'];
      if(typeof toggleAumento==='function') toggleAumento();
    }
    // Portada preview
    if(typeof actualizarPortada==='function') actualizarPortada();
    // Estatus documentación
    if(estado.docRows && typeof addDocRow==='function'){
      var tbody=document.getElementById('doc-tbody'); if(tbody) tbody.innerHTML='';
      estado.docRows.forEach(function(r){
        addDocRow(r.nombre);
        var lastTr=document.querySelector('#doc-tbody tr:last-child');
        if(!lastTr) return;
        var ins=lastTr.querySelectorAll('input');
        if(ins[1]) ins[1].value=r.fecha;
        if(ins[2]) ins[2].value=r.com;
        var sem=lastTr.querySelector('.sem-btn');
        if(sem && r.semaforo!=='rojo'){
          if(r.semaforo==='verde'){ sem.classList.remove('rojo','amarillo'); sem.classList.add('verde'); }
          else if(r.semaforo==='amarillo'){ sem.classList.remove('rojo','verde'); sem.classList.add('amarillo'); }
        }
      });
    }
    // Estatus proyectos
    if(estado.proyRows && typeof addProyRow==='function'){
      var ptbody=document.getElementById('proy-tbody'); if(ptbody) ptbody.innerHTML='';
      estado.proyRows.forEach(function(r){
        addProyRow(r.especialidad);
        var lastTr=document.querySelector('#proy-tbody tr:last-child');
        if(!lastTr) return;
        var tds=lastTr.querySelectorAll('td');
        if(tds[3]&&tds[3].querySelector('input')) tds[3].querySelector('input').value=r.fechaAprobacion||'';
        var sem=lastTr.querySelector('.sem-btn');
        if(sem && r.semaforo!=='rojo'){
          if(r.semaforo==='verde'){ sem.classList.remove('rojo','amarillo'); sem.classList.add('verde'); }
          else{ sem.classList.remove('rojo','verde'); sem.classList.add('amarillo'); }
        }
        // Historial de revisiones
        if(r.historial && r.historial.length>0){
          var histContainer=lastTr.querySelector('.hist-container');
          if(histContainer){
            histContainer.innerHTML='';
            r.historial.forEach(function(h){
              if(typeof addHistRow==='function') addHistRow(histContainer,h.tipo,h.fecha);
            });
          }
        }
      });
    }
    // Curva S
    if(estado.csRows && estado.csRows.length>0){
      var cstbody=document.getElementById('cs-tbody'); if(cstbody) cstbody.innerHTML='';
      estado.csRows.forEach(function(r,rIdx){
        if(typeof addCsRow==='function'){
          var tr2=document.createElement('tr');
          tr2.innerHTML='<td><span class="cs-lbl">'+(rIdx===0?'Inicio obra':r.lbl)+'</span></td>'+
            '<td><input class="cs-fi" type="date" value="'+r.fi+'" readonly></td>'+
            '<td><div class="pct-row"><input class="cs-prog" type="number" min="0" max="100" step="0.1" value="'+r.prog+'" oninput="actualizarGrafico()"><span>%</span></div></td>'+
            '<td><div class="pct-row"><input class="cs-real real-inp" type="number" min="0" max="100" step="0.1" value="'+r.real+'" oninput="actualizarGrafico()"><span>%</span></div></td>';
          var cstbody2=document.getElementById('cs-tbody'); if(cstbody2) cstbody2.appendChild(tr2);
        }
      });
      if(typeof actualizarGrafico==='function') actualizarGrafico();
    }
    // Situación general
    if(estado.partidas){
      var pList2=document.getElementById('partidas-list'); if(pList2) pList2.innerHTML='';
      estado.partidas.forEach(function(p){ if(typeof addPartida==='function') addPartida(); var last=document.querySelector('#partidas-list .partida-input:last-of-type'); if(last) last.value=p; });
    }
    if(estado.sgPuntos){
      var sgList=document.getElementById('sg-puntos-list'); if(sgList) sgList.innerHTML=''; sgPuntoCount=0;
      estado.sgPuntos.forEach(function(p){ if(typeof addSgPunto==='function') addSgPunto(p.texto, p.estado); });
    }
    if(typeof actualizarSgPreview==='function') actualizarSgPreview();
    // Lay Out imagen
    if(estado.loImgSrc && estado.loImgSrc.length>100){
      var loImg2=document.getElementById('lo-preview-img');
      var loWrap=document.getElementById('lo-preview-wrap');
      var loDz=document.getElementById('lo-dropzone');
      if(loImg2){ loImg2.src=estado.loImgSrc; loImg2.style.display='block'; }
      if(loWrap) loWrap.style.display='block';
      if(loDz) loDz.style.display='none';
    }
    // Fotografías
    fotos = (estado.fotos||[]).map(function(f){ return Object.assign({},f); });
    fotoGrupos = (estado.fotoGrupos||[]).map(function(g){ return Object.assign({},g); });
    if(typeof renderFotos==='function') renderFotos();
    if(typeof renderGrupos==='function') renderGrupos();
    // Anexos
    // Anexos: siempre vacíos — cada informe gestiona los suyos
    anexos = [];
    if(typeof renderAnexos==='function') renderAnexos();
    // Ir a portada
    if(typeof irA==='function') irA(0);
  }

  // ── GUARDAR en localStorage ──
  function guardarEnHistorial() {
    var estado = recolectarEstado();
    var obra = estado['nombre-obra'] || 'Sin nombre';
    var nro  = estado['nro-informe'] || '000';
    var fecha = new Date().toISOString();
    var key = 'jasv_inf_' + Date.now();
    var meta = { key:key, obra:obra, nro:nro, fecha:fecha, semana:estado['semana-informe']||'' };
    try {
      localStorage.setItem(key, JSON.stringify(estado));
      var hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
      hist.unshift(meta);
      if(hist.length>30) { // máx 30 registros
        var old=hist.pop(); try{localStorage.removeItem(old.key);}catch(e){}
      }
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      mostrarToast('💾 Informe guardado: '+obra+' N°'+nro, 'ok');
      renderHistorial();
    } catch(e) {
      mostrarToast('Error al guardar (¿almacenamiento lleno?): '+e.message, 'err');
    }
  }

  // ── EXPORTAR JSON ──
  function exportarJSON() {
    var estado = recolectarEstado();
    var obra = estado['nombre-obra']||'informe';
    var nro  = estado['nro-informe']||'000';
    var blob = new Blob([JSON.stringify(estado,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ITO_'+obra.replace(/[^a-zA-Z0-9]/g,'_')+'_N'+nro+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
    mostrarToast('📥 JSON exportado', 'ok');
  }

  // ── IMPORTAR JSON ──
  function importarJSON(input) {
    if(!input.files.length) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var estado = JSON.parse(e.target.result);
        restaurarEstado(estado);
        mostrarToast('✅ Informe importado correctamente', 'ok');
      } catch(ex) {
        mostrarToast('❌ Archivo inválido: '+ex.message, 'err');
      }
    };
    reader.readAsText(input.files[0]);
    input.value='';
  }

  // ── ELIMINAR del historial ──
  function eliminarHistorial(key) {
    try {
      localStorage.removeItem(key);
      var hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
      hist = hist.filter(function(h){ return h.key !== key; });
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      renderHistorial();
      mostrarToast('🗑 Registro eliminado', 'ok');
    } catch(e) {}
  }

  // ── CARGAR del historial ──
  function cargarHistorial(key) {
    try {
      var data = localStorage.getItem(key);
      if(!data) { mostrarToast('Registro no encontrado', 'err'); return; }
      var estado = JSON.parse(data);
      restaurarEstado(estado);
      cerrarHistorial();
      mostrarToast('✅ Informe cargado', 'ok');
    } catch(e) { mostrarToast('Error al cargar: '+e.message, 'err'); }
  }

  // ── RENDER lista del historial ──
  function renderHistorial() {
    var list = document.getElementById('hist-list');
    if(!list) return;
    var hist = [];
    try { hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); } catch(e){}
    if(hist.length === 0){
      list.innerHTML = '<div style="color:var(--gris);font-style:italic;padding:16px 0">No hay informes guardados aún.</div>';
      return;
    }
    list.innerHTML = '';
    hist.forEach(function(meta){
      var row = document.createElement('div'); row.className = 'hist-row-item';
      var info = document.createElement('div'); info.className = 'hist-info';
      var title = document.createElement('div'); title.className = 'hist-title';
      title.textContent = meta.obra + (meta.semana?' — '+meta.semana:'');
      var sub = document.createElement('div'); sub.className = 'hist-sub';
      sub.textContent = 'N° '+meta.nro+' · '+new Date(meta.fecha).toLocaleString('es-CL',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      info.appendChild(title); info.appendChild(sub);
      var btns = document.createElement('div'); btns.className = 'hist-btns';
      var btnLoad = document.createElement('button'); btnLoad.className = 'btn btn-pri'; btnLoad.style.fontSize='12px'; btnLoad.style.padding='5px 12px';
      btnLoad.textContent = '↩ Cargar';
      (function(k){ btnLoad.addEventListener('click', function(){ cargarHistorial(k); }); })(meta.key);
      var btnDel = document.createElement('button'); btnDel.className = 'btn btn-sec'; btnDel.style.fontSize='12px'; btnDel.style.padding='5px 10px'; btnDel.style.color='#b02828';
      btnDel.textContent = '🗑';
      (function(k){ btnDel.addEventListener('click', function(){ if(confirm('¿Eliminar este registro?')) eliminarHistorial(k); }); })(meta.key);
      btns.appendChild(btnLoad); btns.appendChild(btnDel);
      row.appendChild(info); row.appendChild(btns);
      list.appendChild(row);
    });
  }

  function abrirHistorial() {
    renderHistorial();
    document.getElementById('hist-modal').style.display='flex';
  }
  function cerrarHistorial() {
    document.getElementById('hist-modal').style.display='none';
  }

  // ── TOAST ──
  function mostrarToast(msg, tipo) {
    var t = document.getElementById('jasv-toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'jasv-toast show' + (tipo==='err'?' err':'');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show','err'); }, 3200);
  }
  // ══ FIN HISTORIAL ══════════════════════════════════════


  // ══ SISTEMA DE OBRAS ══════════════════════════════════
  var OBRAS_KEY = 'jasv_obras_v1';
  var obraActual = null;    // {id, nombre, edificio, …, informes:[]}
  var informeActual = null; // {id, nro, fechaCreacion, estado:…}
  var modoEdicionObra = false;

  function cargarObras() {
    try { return JSON.parse(localStorage.getItem(OBRAS_KEY) || '[]'); }
    catch(e) { return []; }
  }
  function guardarObras(obras) {
    localStorage.setItem(OBRAS_KEY, JSON.stringify(obras));
  }

  // ── Logo en pantalla obras ──
  function sincronizarLogoObras() {
    var imgSrc = document.querySelector('.topbar img') ? document.querySelector('.topbar img').src : '';
    var obraLogo = document.getElementById('obras-logo');
    if (obraLogo && imgSrc) obraLogo.src = imgSrc;
  }

  // ── Pantalla Obras ──
  function mostrarPantallaObras() {
    document.getElementById('pantalla-obras').style.display = 'flex';
    document.getElementById('pantalla-informes').style.display = 'none';
    document.querySelector('.app') && (document.querySelector('.app').style.display = 'none');
    // Ocultar barra de informe — no hay informe activo en el dashboard
    var tb = document.getElementById('inf-topbar');
    if (tb) tb.style.display = 'none';
    // Sincronizar logo ANTES de ocultar topbar
    sincronizarLogoObras();
    // Ocultar topbar principal — pantalla obras tiene su propio header
    var mainTop = document.querySelector('.topbar');
    if (mainTop) mainTop.style.display = 'none';
    renderObras();
  }

  function renderObras() {
    var obras = cargarObras();
    var lista = document.getElementById('obras-lista');
    var vacia = document.getElementById('obras-vacia');
    lista.innerHTML = '';
    if (obras.length === 0) { vacia.style.display = 'block'; return; }
    vacia.style.display = 'none';
    obras.forEach(function(obra) {
      var card = document.createElement('div'); card.className = 'obra-card';
      card.onclick = function() { abrirObra(obra.id); };
      var nInf = (obra.informes || []).length;
      var cardInfo = document.createElement('div'); cardInfo.className='obra-card-info';
      cardInfo.innerHTML = '<div class="obra-card-nombre">' + (obra.nombre || 'Sin nombre') + '</div>' +
        '<div class="obra-card-sub">' + [obra.edificio, obra.oficina].filter(Boolean).join(' · ') + '</div>' +
        '<div class="obra-card-hint">Ver informes</div>';
      var cardBadge = document.createElement('span'); cardBadge.className='obra-card-badge';
      cardBadge.textContent = nInf + ' informe' + (nInf !== 1 ? 's' : '');
      var cardDel = document.createElement('button'); cardDel.className='btn btn-sec';
      cardDel.style.cssText='font-size:11px;padding:4px 10px;flex-shrink:0';
      cardDel.textContent='🗑';
      (function(oid){ cardDel.addEventListener('click',function(e){e.stopPropagation();eliminarObra(oid);}); })(obra.id);
      card.appendChild(cardInfo); card.appendChild(cardBadge); card.appendChild(cardDel)
      lista.appendChild(card);
    });
  }

  // ── Pantalla Informes ──
  function abrirObra(id) {
    var obras = cargarObras();
    obraActual = obras.find(function(o){ return o.id === id; });
    if (!obraActual) return;
    document.getElementById('pantalla-obras').style.display = 'none';
    document.getElementById('pantalla-informes').style.display = 'flex';
    var tb = document.getElementById('inf-topbar');
    if (tb) tb.style.display = 'none';
    var mainTop2 = document.querySelector('.topbar');
    if (mainTop2) mainTop2.style.display = 'none';
    document.getElementById('inf-obra-nombre').textContent = obraActual.nombre || 'Obra sin nombre';
    document.getElementById('inf-obra-sub').textContent = [obraActual.edificio, obraActual.mandante].filter(Boolean).join(' · ');
    renderInformes();
  }

  function volverAObras() {
    obraActual = null;
    document.getElementById('pantalla-informes').style.display = 'none';
    document.getElementById('pantalla-obras').style.display = 'flex';
    renderObras();
  }

  function renderInformes() {
    if (!obraActual) return;
    var lista = document.getElementById('informes-lista');
    var vacia = document.getElementById('informes-vacia');
    var informes = (obraActual.informes || []).slice().reverse(); // más reciente primero
    lista.innerHTML = '';
    if (informes.length === 0) { vacia.style.display = 'block'; return; }
    vacia.style.display = 'none';
    informes.forEach(function(inf) {
      var card = document.createElement('div'); card.className = 'inf-card';
      card.onclick = function() { abrirInforme(inf.id); };
      var fecha = inf.fechaCreacion ? new Date(inf.fechaCreacion).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}) : '—';
      var infNum = document.createElement('div'); infNum.className='inf-card-num';
      infNum.textContent = 'N° ' + String(inf.nro).padStart(3,'0');
      var infInfo = document.createElement('div'); infInfo.className='inf-card-info';
      infInfo.innerHTML = '<div class="inf-card-titulo">' + (inf.semana ? 'Semana ' + inf.semana : 'Informe N° ' + inf.nro) + '</div>' +
        '<div class="inf-card-sub">' + fecha + (inf.avanceReal !== undefined ? ' · Avance: ' + inf.avanceReal + '%' : '') + '</div>';
      var infBtns = document.createElement('div'); infBtns.className='inf-card-btns';
      var btnAbrir = document.createElement('button'); btnAbrir.className='btn btn-pri';
      btnAbrir.style.cssText='font-size:11px;padding:4px 12px';
      btnAbrir.textContent='↩ Abrir';
      (function(iid){ btnAbrir.addEventListener('click',function(e){e.stopPropagation();abrirInforme(iid);}); })(inf.id);
      var btnDel = document.createElement('button'); btnDel.className='btn btn-sec';
      btnDel.style.cssText='font-size:11px;padding:4px 10px;color:#b02828';
      btnDel.textContent='🗑';
      (function(iid){ btnDel.addEventListener('click',function(e){e.stopPropagation();eliminarInforme(iid);}); })(inf.id);
      infBtns.appendChild(btnAbrir); infBtns.appendChild(btnDel);
      card.appendChild(infNum); card.appendChild(infInfo); card.appendChild(infBtns)
      lista.appendChild(card);
    });
  }

  // ── Nuevo informe ──
  function nuevoInforme() {
    if (!obraActual) return;
    var obras = cargarObras();
    var obra = obras.find(function(o){ return o.id === obraActual.id; });
    if (!obra) return;
    var nro = (obra.informes || []).length > 0
      ? Math.max.apply(null, obra.informes.map(function(i){ return i.nro || 1; })) + 1
      : 1;
    var infId = 'inf_' + Date.now();
    var newInf = { id: infId, nro: nro, semana: '', fechaCreacion: new Date().toISOString(), estado: {} };
    obra.informes = obra.informes || [];
    obra.informes.push(newInf);
    obraActual = obra;
    guardarObras(obras);
    // Abrir formulario con datos fijos de la obra pre-cargados
    abrirFormulario(obra, newInf, true);
  }

  // ── Abrir informe existente ──
  function abrirInforme(infId) {
    if (!obraActual) return;
    var obras = cargarObras();
    var obra = obras.find(function(o){ return o.id === obraActual.id; });
    var inf = obra && (obra.informes || []).find(function(i){ return i.id === infId; });
    if (!inf) return;
    abrirFormulario(obra, inf, false);
  }

  // ── Abrir formulario ──

  // ══ RESET COMPLETO DEL FORMULARIO ══
  function resetFormulario() {
    // Campos de texto simples
    var camposSemanales = [
      'nro-informe','fecha-emision','semana-informe',
      'nombre-obra','nombre-edificio','direccion','mandante','contratista',
      'nro-oficina','fecha-inicio','plazo-dias','fecha-termino','moneda',
      'monto-valor','monto-desc','descripcion-proyecto','superficie',
      'aumento-dias','aumento-motivo','fecha-termino-nueva',
      'cs-inicio','cs-termino','dia-control','cs-nota',
      'sg-fecha-visita','sg-nro-visita',
      'lo-version','lo-fecha','lo-autor','lo-desc'
    ];
    camposSemanales.forEach(function(id){
      var el=document.getElementById(id);
      if(el){ el.value=''; }
    });
    // Checkbox aumento
    var chk=document.getElementById('chk-aumento');
    if(chk){ chk.checked=false; if(typeof toggleAumento==='function') toggleAumento(); }
    // Estatus documentación — recargar lista predefinida
    var docTbody=document.getElementById('doc-tbody');
    if(docTbody){
      docTbody.innerHTML='';
      if(typeof DOC_DEFAULT!=='undefined' && typeof addDocRow==='function'){
        DOC_DEFAULT.forEach(function(d){ addDocRow(d); });
      }
    }
    // Estatus proyectos — recargar lista predefinida
    var proyTbody=document.getElementById('proy-tbody');
    if(proyTbody){
      proyTbody.innerHTML='';
      if(typeof PROY_DEFAULT!=='undefined' && typeof addProyRow==='function'){
        PROY_DEFAULT.forEach(function(p){ addProyRow(p); });
      }
    }
    // Curva S
    var csTbody=document.getElementById('cs-tbody');
    if(csTbody) csTbody.innerHTML='';
    if(typeof actualizarGrafico==='function') setTimeout(actualizarGrafico,100);
    // Situación general - puntos nuevos
    var sgList=document.getElementById('sg-puntos-list');
    if(sgList){ sgList.innerHTML=''; sgPuntoCount=0; }
    // Situación general - puntos arrastre
    var sgPend=document.getElementById('sg-pendientes-list');
    if(sgPend) sgPend.innerHTML='<div style="font-size:13px;color:#aaa;font-style:italic;padding:8px 0">Los puntos no cerrados aparecerán aquí automáticamente.</div>';
    // Partidas en ejecución
    var partList=document.getElementById('partidas-list');
    if(partList) partList.innerHTML='';
    if(typeof addPartida==='function') addPartida();
    // Lay Out
    var loImg=document.getElementById('lo-preview-img');
    var loWrap=document.getElementById('lo-preview-wrap');
    var loDz=document.getElementById('lo-dropzone');
    if(loImg){ loImg.src=''; loImg.style.display='none'; }
    if(loWrap) loWrap.style.display='none';
    if(loDz) loDz.style.display='';
    // Fotos y grupos
    fotos=[]; fotoGrupos=[];
    if(typeof renderFotos==='function') renderFotos();
    if(typeof renderGrupos==='function') renderGrupos();
    // Anexos
    anexos=[];
    if(typeof renderAnexos==='function') renderAnexos();
    // Resumen
    var sgRes=document.getElementById('sg-resumen');
    if(sgRes) sgRes.innerHTML='';
    var sgResEmpty=document.getElementById('sg-resumen-empty');
    if(sgResEmpty) sgResEmpty.style.display='block';
    // Profesionales: limpiar nombres (mantener cargos por defecto)
    document.querySelectorAll('.prof-row input:not(.cargo)').forEach(function(inp){ inp.value=''; });
    // Portada preview
    if(typeof actualizarPortada==='function') actualizarPortada();
  }
  // ══ FIN RESET ══

  function abrirFormulario(obra, inf, esNuevo) {
    informeActual = inf;
    // Reset completo del formulario antes de cargar datos
    window._cargandoFormulario = true;
    resetFormulario();
    // Mostrar app
    document.getElementById('pantalla-obras').style.display = 'none';
    document.getElementById('pantalla-informes').style.display = 'none';
    document.querySelector('.app').style.display = '';
    var mainTop3 = document.querySelector('.topbar');
    if (mainTop3) mainTop3.style.display = '';
    var tb = document.getElementById('inf-topbar');
    if (tb) tb.style.display = '';
    // irA(0) will be called after data is loaded
    if (esNuevo) {
      // ══ Datos FIJOS de la obra (siempre pre-cargados) ══
      var fixedMap = {
        'nombre-obra': obra.nombre, 'nombre-edificio': obra.edificio,
        'direccion': obra.direccion, 'mandante': obra.mandante,
        'contratista': obra.contratista, 'nro-oficina': obra.oficina,
        'superficie': obra.superficie, 'fecha-inicio': obra.fechaInicio,
        'plazo-dias': obra.plazo, 'monto-valor': obra.monto,
        'monto-desc': obra.montoDesc, 'descripcion-proyecto': obra.descripcion
      };
      Object.keys(fixedMap).forEach(function(id){
        var el=document.getElementById(id); if(el && fixedMap[id]) el.value=fixedMap[id];
      });
      var monSel=document.getElementById('moneda');
      if(monSel && obra.moneda) monSel.value=obra.moneda;
      // N° informe y fecha emisión
      var nroEl=document.getElementById('nro-informe'); if(nroEl) nroEl.value=inf.nro;
      var fechaEl=document.getElementById('fecha-emision'); if(fechaEl) fechaEl.value=new Date().toISOString().split('T')[0];
      // Fecha término calculada
      if(obra.fechaInicio && obra.plazo){
        var fi2=new Date(obra.fechaInicio+'T12:00:00');
        fi2.setDate(fi2.getDate()+parseInt(obra.plazo));
        var ftEl=document.getElementById('fecha-termino');
        if(ftEl) ftEl.value=fi2.toISOString().split('T')[0];
      }
      actualizarPortada();
      // Limpiar punto 1 con valores por defecto
    var p1el=document.getElementById('sg-p1-texto');
    if(p1el) p1el.innerHTML='Con fecha <em>—</em> se realizó la visita N° <em>—</em> a la obra.';
    if(typeof actualizarP1==='function') setTimeout(actualizarP1,100);;

      // ══ Buscar informe anterior ══
      var prevInf = null;
      if(inf.nro > 1){
        var prevNro = inf.nro - 1;
        prevInf = (obra.informes||[]).find(function(i){ return i.nro===prevNro && i.estado && Object.keys(i.estado).length>0; });
        // Si no hay estado en prevNro-1, buscar el más reciente con estado
        if(!prevInf){
          var conEstado = (obra.informes||[]).filter(function(i){ return i.nro<inf.nro && i.estado && Object.keys(i.estado).length>0; });
          if(conEstado.length>0) prevInf = conEstado.sort(function(a,b){return b.nro-a.nro;})[0];
        }
      }
      var prev = prevInf ? prevInf.estado : null;

      // ── Profesionales: heredar del informe anterior ──
      if(prev && prev.profs){
        ['mandante-profs','constructora-profs','arq-profs','ito-profs','pm-profs'].forEach(function(sec){
          var prevRows=prev.profs[sec]; if(!prevRows||!prevRows.length) return;
          var container=document.getElementById(sec); if(!container) return;
          // Add extra rows if needed
          var curRows=container.querySelectorAll('.prof-row');
          while(curRows.length < prevRows.length){
            var firstRow=curRows[0];
            if(firstRow){
              var cargo=firstRow.querySelector('input.cargo');
              var cargoVal=cargo?cargo.value:'';
              if(typeof addProf==='function') addProf(sec, cargoVal);
            } else break;
            curRows=container.querySelectorAll('.prof-row');
          }
          // Fill values
          curRows=container.querySelectorAll('.prof-row');
          prevRows.forEach(function(p,i){
            if(curRows[i]){
              var ins=curRows[i].querySelectorAll('input');
              // Only set cargo if not readonly
              if(ins[0] && !ins[0].readOnly && p.cargo) ins[0].value=p.cargo;
              if(ins[1]) ins[1].value=p.nombre||'';
            }
          });
        });
      }

      // ══ Estatus documentación: cargar del informe anterior ══
      if(prev && prev.docRows && prev.docRows.length>0 && typeof addDocRow==='function'){
        var docTbody=document.getElementById('doc-tbody'); if(docTbody) docTbody.innerHTML='';
        prev.docRows.forEach(function(r){
          addDocRow(r.nombre||'');
          var lastTr=document.querySelector('#doc-tbody tr:last-child'); if(!lastTr) return;
          var ins=lastTr.querySelectorAll('input');
          if(ins[1]) ins[1].value=r.fecha||'';
          if(ins[2]) ins[2].value=r.com||'';
          var sem=lastTr.querySelector('.sem-btn');
          if(sem){
            sem.classList.remove('rojo','amarillo','verde');
            sem.classList.add(r.semaforo||'rojo');
          }
        });
      }

      // ══ Estatus proyectos: cargar del informe anterior ══
      // Siempre limpiar primero (evita duplicados con filas por defecto)
      var proyTbody0=document.getElementById('proy-tbody'); if(proyTbody0) proyTbody0.innerHTML='';
      if(prev && prev.proyRows && prev.proyRows.length>0 && typeof addProyRow==='function'){
        var proyTbody=document.getElementById('proy-tbody'); if(proyTbody) proyTbody.innerHTML='';
        prev.proyRows.forEach(function(r){
          addProyRow(r.especialidad||'');
          var allTrs=document.querySelectorAll('#proy-tbody tr');
          var lastTr2=allTrs[allTrs.length-1]; if(!lastTr2) return;
          var tds=lastTr2.querySelectorAll('td');
          if(tds[3]&&tds[3].querySelector('input')) tds[3].querySelector('input').value=r.fechaAprobacion||'';
          var sem2=lastTr2.querySelector('.sem-btn');
          if(sem2){ sem2.classList.remove('rojo','amarillo','verde'); sem2.classList.add(r.semaforo||'rojo'); }
          if(r.historial && r.historial.length>0){
            var histC=lastTr2.querySelector('.hist-block');
            if(histC){
              // Remove only hist-row divs, keep the "+ Agregar revisión" button
              Array.from(histC.querySelectorAll('.hist-row')).forEach(function(hr){hr.remove();});
              var addBtn=histC.querySelector('.btn-add-hist');
              r.historial.forEach(function(h){
                var hrow=crearHistRow();
                // Append first, then set value (ensures options are in DOM)
                // Insert before the "+ Agregar" button if present
                var addBtnH=histC.querySelector('.btn-add-hist');
                if(addBtnH) histC.insertBefore(hrow,addBtnH); else histC.appendChild(hrow);
                var hsel=hrow.querySelector('select');
                if(hsel){
                  // Set value directly
                  hsel.value=h.tipo||'';
                  // Fallback: iterate options if value didn't stick
                  if(hsel.value !== h.tipo){
                    Array.from(hsel.options).forEach(function(opt){
                      opt.selected = (opt.value === h.tipo);
                    });
                  }
                }
                var hdate=hrow.querySelector('input[type=date]');
                if(hdate) hdate.value=h.fecha||'';
              });
            }
          }
          // Actualizar semáforo automáticamente según historial cargado
          updateProySemaforo(lastTr2);
        });
      } else if(typeof addProyRow==='function'){
        // Primer informe: cargar especialidades por defecto
        var proyTbodyD=document.getElementById('proy-tbody'); if(proyTbodyD) proyTbodyD.innerHTML='';
        if(typeof PROY_DEFAULT!=='undefined'){
          PROY_DEFAULT.forEach(function(p){ addProyRow(p); });
        }
      }

      // ══ Curva S: cargar programado + real del anterior ══
      if(prev && prev.csRows && prev.csRows.length>0){
        var csInEl=document.getElementById('cs-inicio');
        var csTerEl=document.getElementById('cs-termino');
        var csDiaEl=document.getElementById('dia-control');
        if(csInEl && prev.csInicio) csInEl.value=prev.csInicio;
        if(csTerEl && prev.csTermino) csTerEl.value=prev.csTermino;
        if(csDiaEl && prev.diaControl) csDiaEl.value=prev.diaControl;
        var csnota=document.getElementById('cs-nota'); if(csnota) csnota.value='';
        var cstbody=document.getElementById('cs-tbody'); if(cstbody) cstbody.innerHTML='';
        prev.csRows.forEach(function(r,rIdx){
          var tr2=document.createElement('tr');
          tr2.innerHTML='<td><span class="cs-lbl">'+(rIdx===0?'Inicio obra':r.lbl)+'</span></td>'+
            '<td><input class="cs-fi" type="date" value="'+r.fi+'" readonly></td>'+
            '<td><div class="pct-row"><input class="cs-prog" type="number" min="0" max="100" step="0.1" value="'+r.prog+'" oninput="actualizarGrafico()"><span>%</span></div></td>'+
            '<td><div class="pct-row"><input class="cs-real real-inp" type="number" min="0" max="100" step="0.1" value="'+r.real+'" placeholder="—" oninput="actualizarGrafico()"><span>%</span></div></td>';
          var csb=document.getElementById('cs-tbody'); if(csb) csb.appendChild(tr2);
        });
        setTimeout(function(){ if(typeof actualizarGrafico==='function') actualizarGrafico(); },300);
      }

      // ══ Lay Out: mantener del informe anterior ══
      if(prev && prev.loImgSrc && prev.loImgSrc.length>100){
        var loImg2=document.getElementById('lo-preview-img');
        var loWrap=document.getElementById('lo-preview-wrap');
        var loDz=document.getElementById('lo-dropzone');
        if(loImg2){
          loImg2.style.display='block';
          loImg2.src=prev.loImgSrc;
        }
        if(loWrap) loWrap.style.display='block';
        if(loDz) loDz.style.display='none';
        ['lo-version','lo-fecha','lo-autor','lo-desc'].forEach(function(id){
          var el=document.getElementById(id);
          if(el && prev[id]) el.value=prev[id];
        });
      }

      // ══ Situación general: LIMPIAR datos semanales ══
      var sgPtsList=document.getElementById('sg-puntos-list');
      if(sgPtsList){ sgPtsList.innerHTML=''; sgPuntoCount=0; }
      var partList=document.getElementById('partidas-list');
      if(partList) partList.innerHTML='';
      if(typeof addPartida==='function') addPartida();
      var sgFecha=document.getElementById('sg-fecha-visita');
      if(sgFecha) sgFecha.value=new Date().toISOString().split('T')[0]; // fecha de hoy
      var sgNroV=document.getElementById('sg-nro-visita');
      // Nº visita = anterior + 1
      if(sgNroV && prev && prev.sgNroVisita){
        sgNroV.value=String(parseInt(prev.sgNroVisita||0)+1);
      } else if(sgNroV){
        sgNroV.value='';
      }

      // Pendientes del informe anterior: puntos en proceso/pendiente/urgente
      // Pendientes del informe anterior: mostrar en sg-pendientes-list
      // Cargar pendientes anteriores como cards editables
      var sgPendList=document.getElementById('sg-pendientes-list');
      if(sgPendList){
        if(prev && prev.sgPuntos && prev.sgPuntos.length>0){
          var pendItems=prev.sgPuntos.filter(function(p){
            return p.estado==='pendiente'||p.estado==='urgente'||p.estado==='proceso';
          });
          if(pendItems.length>0){
            sgPendList.innerHTML='';
            pendItems.forEach(function(p,pi){
              sgPendList.appendChild(crearPendCard(p.texto, p.estado, pi));
            });
          } else {
            sgPendList.innerHTML='<div style="font-size:13px;color:#2d7a4f;padding:8px 0">✅ Sin puntos pendientes del informe anterior.</div>';
          }
        } else {
          sgPendList.innerHTML='<div style="font-size:13px;color:#aaa;font-style:italic;padding:8px 0">Los puntos no cerrados aparecerán aquí automáticamente.</div>';
        }
      }
      if(typeof actualizarSgPreview==='function') actualizarSgPreview();

      // ══ Fotos: solo las que tienen advertencia del informe anterior ══
      fotos=[];
      if(prev && prev.fotos && prev.fotos.length>0){
        // Cargar grupos del informe anterior
        fotoGrupos=(prev.fotoGrupos||[]).map(function(g){return Object.assign({},g);});
        // Solo fotos con warning activo
        prev.fotos.forEach(function(f){
          if(f.warning){
            fotos.push({
              dataUrl:f.dataUrl, pie:f.pie, grupo:f.grupo,
              warning:true, warningTxt:f.warningTxt,
              resuelto:false, resueltoTxt:'' // reset: se verifica esta semana
            });
          }
        });
      } else {
        fotoGrupos=[];
      }
      if(typeof renderFotos==='function') renderFotos();
      if(typeof renderGrupos==='function') renderGrupos();

      // ══ Anexos: vacíos para nuevo informe ══
      anexos=[];
      if(typeof renderAnexos==='function') renderAnexos();

      // ══ Resumen: limpiar ══
      var sgRes=document.getElementById('sg-resumen'); if(sgRes) sgRes.innerHTML='';
      var sgResEmpty=document.getElementById('sg-resumen-empty');
      if(sgResEmpty) sgResEmpty.style.display='block';
      // Navegar a portada después de cargar todos los datos
      setTimeout(function(){ window._cargandoFormulario = false; }, 500);
      irA(0);

    } else {
      // Restaurar estado guardado
      if (inf.estado && Object.keys(inf.estado).length > 0) {
        restaurarEstado(inf.estado);
        setTimeout(function(){ window._cargandoFormulario = false; }, 500);
        irA(0);
      } else {
        // Solo datos fijos
        var map2 = {
          'nombre-obra': obra.nombre, 'nombre-edificio': obra.edificio,
          'direccion': obra.direccion, 'mandante': obra.mandante,
          'contratista': obra.contratista, 'nro-oficina': obra.oficina,
          'superficie': obra.superficie, 'fecha-inicio': obra.fechaInicio,
          'plazo-dias': obra.plazo, 'monto-valor': obra.monto,
          'monto-desc': obra.montoDesc, 'descripcion-proyecto': obra.descripcion
        };
        Object.keys(map2).forEach(function(id){
          var el=document.getElementById(id); if(el && map2[id]) el.value=map2[id];
        });
        var nroEl2=document.getElementById('nro-informe'); if(nroEl2) nroEl2.value=inf.nro;
        actualizarPortada();
        setTimeout(function(){ window._cargandoFormulario = false; }, 500);
        irA(0);
      }
    }
    // Actualizar botones del hist-topbar
    actualizarTopbarInforme();
    actualizarTopbarTitulo();
  }

  // ── Actualizar topbar al estar en formulario ──
  function actualizarTopbarInforme() {
    var topbar = document.querySelector('.hist-topbar');
    if (!topbar) return;
    if (obraActual && informeActual) {
      // Modo formulario de informe
      var extra = topbar.querySelector('.btn-volver-inf');
      if (!extra) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-sec btn-volver-inf';
        btn.style.cssText = 'font-size:12px;padding:5px 13px;';
        btn.textContent = '← Informes';
        btn.onclick = function() { guardarEstadoInformeActual(); volverDesdeFormulario(); };
        topbar.insertBefore(btn, topbar.firstChild);
      }
    }
  }

  function volverDesdeFormulario() {
    document.querySelector('.app').style.display = 'none';
    var mainTop4 = document.querySelector('.topbar');
    if (mainTop4) mainTop4.style.display = 'none';
    // Limpiar btn-volver-inf
    var extra = document.querySelector('.btn-volver-inf');
    if (extra) extra.remove();
    abrirObra(obraActual.id);
  }

  // ── Guardar estado del informe actual ──
  function guardarEstadoInformeActual() {
    if (!obraActual || !informeActual) return;
    var obras = cargarObras();
    var obra = obras.find(function(o){ return o.id === obraActual.id; });
    if (!obra) return;
    var inf = (obra.informes || []).find(function(i){ return i.id === informeActual.id; });
    if (!inf) return;
    inf.estado = recolectarEstado();
    inf.semana = document.getElementById('semana-informe') ? document.getElementById('semana-informe').value : '';
    // Capturar avance real del último dato
    var lastReal = null;
    document.querySelectorAll('#cs-tbody .cs-real').forEach(function(el){ if(el.value!=='') lastReal=el.value; });
    if(lastReal !== null) inf.avanceReal = parseFloat(lastReal).toFixed(1);
    obraActual = obra;
    guardarObras(obras);
    // Auto-backup si está configurado
    if (typeof ejecutarBackup === 'function') {
      ejecutarBackup(true); // true = mostrar toast combinado
    } else {
      mostrarToast('💾 Informe guardado', 'ok');
    }
  }

  // ── Modal Nueva/Editar Obra ──
  function abrirModalNuevaObra() {
    modoEdicionObra = false;
    document.getElementById('modal-obra-titulo').textContent = 'Nueva obra';
    document.getElementById('mo-btn-guardar').textContent = 'Crear obra';
    ['mo-nombre','mo-edificio','mo-direccion','mo-oficina','mo-mandante','mo-contratista',
     'mo-superficie','mo-monto','mo-monto-desc','mo-descripcion'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.value='';
    });
    var fi=document.getElementById('mo-fecha-inicio'); if(fi) fi.value='';
    var pl=document.getElementById('mo-plazo'); if(pl) pl.value='';
    document.getElementById('modal-obra').style.display='flex';
    setTimeout(function(){ document.getElementById('mo-nombre').focus(); }, 100);
  }

  function abrirModalEditarObra() {
    if (!obraActual) return;
    modoEdicionObra = true;
    document.getElementById('modal-obra-titulo').textContent = 'Editar obra';
    document.getElementById('mo-btn-guardar').textContent = 'Guardar cambios';
    var m = { 'mo-nombre':obraActual.nombre, 'mo-edificio':obraActual.edificio,
      'mo-direccion':obraActual.direccion, 'mo-oficina':obraActual.oficina,
      'mo-mandante':obraActual.mandante, 'mo-contratista':obraActual.contratista,
      'mo-superficie':obraActual.superficie, 'mo-fecha-inicio':obraActual.fechaInicio,
      'mo-plazo':obraActual.plazo, 'mo-monto':obraActual.monto,
      'mo-monto-desc':obraActual.montoDesc, 'mo-descripcion':obraActual.descripcion };
    Object.keys(m).forEach(function(id){
      var el=document.getElementById(id); if(el && m[id]!==undefined) el.value=m[id]||'';
    });
    var monSel=document.getElementById('mo-moneda');
    if(monSel && obraActual.moneda) monSel.value=obraActual.moneda;
    document.getElementById('modal-obra').style.display='flex';
  }

  function cerrarModalObra() { document.getElementById('modal-obra').style.display='none'; }

  function guardarObra() {
    var nombre = document.getElementById('mo-nombre').value.trim();
    if (!nombre) { mostrarToast('Ingresa el nombre de la obra', 'err'); return; }
    var datos = {
      nombre: nombre,
      edificio: document.getElementById('mo-edificio').value.trim(),
      direccion: document.getElementById('mo-direccion').value.trim(),
      oficina: document.getElementById('mo-oficina').value.trim(),
      mandante: document.getElementById('mo-mandante').value.trim(),
      contratista: document.getElementById('mo-contratista').value.trim(),
      superficie: document.getElementById('mo-superficie').value.trim(),
      fechaInicio: document.getElementById('mo-fecha-inicio').value,
      plazo: document.getElementById('mo-plazo').value,
      moneda: document.getElementById('mo-moneda').value,
      monto: document.getElementById('mo-monto').value.trim(),
      montoDesc: document.getElementById('mo-monto-desc').value.trim(),
      descripcion: document.getElementById('mo-descripcion').value.trim()
    };
    var obras = cargarObras();
    if (modoEdicionObra && obraActual) {
      var obra = obras.find(function(o){ return o.id===obraActual.id; });
      if (obra) { Object.assign(obra, datos); obraActual = obra; }
    } else {
      var nuevaObra = Object.assign({ id: 'obra_'+Date.now(), informes: [] }, datos);
      obras.push(nuevaObra);
    }
    guardarObras(obras);
    cerrarModalObra();
    mostrarToast(modoEdicionObra ? '✅ Obra actualizada' : '✅ Obra creada', 'ok');
    if (modoEdicionObra) {
      document.getElementById('inf-obra-nombre').textContent = datos.nombre;
    } else {
      renderObras();
    }
  }

  function eliminarObra(id) {
    if (!confirm('¿Eliminar esta obra y todos sus informes? Esta acción no se puede deshacer.')) return;
    var obras = cargarObras().filter(function(o){ return o.id !== id; });
    guardarObras(obras);
    renderObras();
    mostrarToast('🗑 Obra eliminada', 'ok');
  }

  function eliminarInforme(infId) {
    if (!obraActual) return;
    if (!confirm('¿Eliminar este informe?')) return;
    var obras = cargarObras();
    var obra = obras.find(function(o){ return o.id===obraActual.id; });
    if (obra) { obra.informes = (obra.informes||[]).filter(function(i){ return i.id!==infId; }); obraActual=obra; }
    guardarObras(obras);
    renderInformes();
    mostrarToast('🗑 Informe eliminado', 'ok');
  }

  // ── Exportar/importar todo (obras) ──
  function exportarObrasJSON() {
    var obras = cargarObras();
    var blob = new Blob([JSON.stringify(obras,null,2)], {type:'application/json'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'JASV_obras_' + new Date().toISOString().split('T')[0] + '.json';
    a.click(); URL.revokeObjectURL(a.href);
    mostrarToast('📥 Exportado', 'ok');
  }

  function importarObrasJSON(input) {
    if (!input.files.length) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('Formato inválido');
        var obras = cargarObras();
        // Merge: no duplicar por id
        data.forEach(function(o) {
          if (!obras.find(function(x){ return x.id===o.id; })) obras.push(o);
        });
        guardarObras(obras);
        renderObras();
        mostrarToast('✅ ' + data.length + ' obras importadas', 'ok');
      } catch(ex) { mostrarToast('❌ Archivo inválido', 'err'); }
    };
    reader.readAsText(input.files[0]);
    input.value='';
  }

  // Sobrescribir guardarEnHistorial para guardar en obra si hay informe activo
  var _guardarEnHistorialOrig = typeof guardarEnHistorial === 'function' ? guardarEnHistorial : null;
  guardarEnHistorial = function() {
    if (obraActual && informeActual) {
      guardarEstadoInformeActual();
    } else if (_guardarEnHistorialOrig) {
      _guardarEnHistorialOrig();
    }
  };
  // ══ FIN SISTEMA OBRAS ══════════════════════════════════


  // ══ VISTA PREVIA ══════════════════════════════════════
  function abrirPreview() {
    var modal = document.getElementById('preview-modal');
    var scroll = document.getElementById('preview-scroll');
    if(!modal||!scroll) return;
    scroll.innerHTML='';
    var slides = buildPreviewSlides();
    slides.forEach(function(html,i){
      var w = document.createElement('div'); w.innerHTML = html;
      scroll.appendChild(w.firstElementChild);
      var n = document.createElement('div'); n.className='pv-num';
      n.textContent=(i+1)+' / '+slides.length; scroll.appendChild(n);
    });
    modal.classList.add('open');
    scroll.scrollTop=0;
  }
  function cerrarPreview(){ document.getElementById('preview-modal').classList.remove('open'); }

  function pvEsc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Coordenadas en unidades de 960×720 (%)
  // Helper: elemento absoluto
  function pvAbs(l,t,w,h,style,inner){
    return '<div style="position:absolute;left:'+l+'%;top:'+t+'%;width:'+w+'%;height:'+h+'%;'+
           (style||'')+'">'+(inner||'')+'</div>';
  }

  // Shell de cada diapositiva
  function pvShell(bodyHtml, sinCinta){
    var logo = document.querySelector('.topbar img')?document.querySelector('.topbar img').src:'';
    var pie  = 'Informe ITO N° '+String((document.getElementById('nro-informe')||{}).value||'—').padStart(3,'0')+'  —  '+(document.getElementById('nombre-obra')||{}).value||'—';
    // Logo: x=19.56cm/25.4cm=77% w=7.74% h=5.5%
    var logoHtml = logo ? '<img class="pv-logo" src="'+logo+'" style="position:absolute;right:1.5%;top:0.4%;height:5.5%;object-fit:contain;">' : '';
    // Cinta: y=18.59% h=5.5%
    var cintaHtml = sinCinta ? '' : '';
    // Pie: y=93.4% h=4%
    var pieHtml = '<div class="pv-pie" style="position:absolute;left:0;right:0;top:93%;height:4%;font-size:0.75em;">'+pvEsc(pie)+'</div>';
    var rojHtml = '<div class="pv-rojo-inf" style="height:0.6%;"></div>';
    return '<div class="pv-slide">'+
      '<div class="pv-inner">'+logoHtml+bodyHtml+pieHtml+rojHtml+'</div>'+
    '</div>';
  }

  // Cinta de sección
  function pvCinta(titulo){
    return '<div class="pv-cinta" style="position:absolute;left:0;right:0;top:18.5%;height:5.5%;font-size:1.1em;">'+pvEsc(titulo)+'</div>';
  }

  function buildPreviewSlides(){
    var slides = [];
    var logo = document.querySelector('.topbar img')?document.querySelector('.topbar img').src:'';
    var nro  = String((document.getElementById('nro-informe')||{}).value||'—').padStart(3,'0');
    var obra = (document.getElementById('nombre-obra')||{}).value||'—';
    var edif = (document.getElementById('nombre-edificio')||{}).value||'';
    var mand = (document.getElementById('mandante')||{}).value||'';
    var cont = (document.getElementById('contratista')||{}).value||'';
    var fEm  = (document.getElementById('fecha-emision')||{}).value||'';
    var semInf= (document.getElementById('semana-informe')||{}).value||'';

    // ──────────────────────────────
    // 1. PORTADA
    // ──────────────────────────────
    var logoHtml = logo ? '<img src="'+logo+'" style="position:absolute;right:1.5%;top:0.4%;height:5.5%;object-fit:contain;">' : '';
    var port = logoHtml +
      '<div class="pv-acento" style="left:5%;width:0.7%;top:0;bottom:0;"></div>' +
      pvAbs(7,24.5,86,8,'','<div style="font-size:1.5em;font-weight:700;color:#8B1A1A;">Informe ITO N° '+pvEsc(nro)+'</div>') +
      pvAbs(7,33,80,14,'line-height:1.2','<div style="font-size:2.1em;font-weight:700;color:#1a1a1a;">'+pvEsc(obra)+'</div>') +
      pvAbs(7,48,80,5,'','<div style="font-size:1.1em;color:#5a5a5a;">'+pvEsc(edif)+'</div>') +
      pvAbs(7,57,85,6,'display:flex;gap:8%;',
        ['Mandante|'+mand,'Contratista|'+cont,'Fecha|'+fEm].map(function(p){
          var pts=p.split('|');
          return '<div><div class="pv-lbl">'+pts[0]+'</div><div class="pv-val" style="font-size:1em;">'+pvEsc(pts[1])+'</div></div>';
        }).join('')) +
      '<div class="pv-rojo-inf" style="height:0.6%;"></div>';
    slides.push('<div class="pv-slide"><div class="pv-inner">'+port+'</div></div>');

    // ──────────────────────────────
    // 2. TABLA DE CONTENIDOS
    // ──────────────────────────────
    var secciones2=['1. Datos del proyecto','2. Estatus de documentación','3. Estatus de aprobación de proyectos',
      '4. Control Curva S','5. Situación general de la obra','6. Lay Out Arquitectura vigente','7. Fotografías relevantes'];
    if(anexos.length>0) secciones2.push('8. Anexos');
    var tocHtml=secciones2.map(function(s,i){
      return '<div style="display:flex;align-items:center;gap:0.6em;padding:0.35em 0.2em;border-bottom:1px solid #eee;">'
        +'<div style="width:0.3em;height:1.4em;background:#8B1A1A;flex-shrink:0;"></div>'
        +'<div style="font-size:1.25em;color:#1a1a1a;">'+pvEsc(s)+'</div></div>';
    }).join('');
    slides.push(pvShell(pvCinta('Tabla de contenidos')+pvAbs(1.2,25,97,66,'overflow:hidden;',tocHtml)));

    // ──────────────────────────────
    // 3. DATOS DEL PROYECTO
    // ──────────────────────────────
    function dpKV(lbl,val){return '<div><div class="pv-lbl">'+pvEsc(lbl)+'</div><div class="pv-line"></div><div class="pv-val">'+pvEsc(val)+'</div></div>';}
    var fi=(document.getElementById('fecha-inicio')||{}).value||'';
    var ft=(document.getElementById('fecha-termino')||{}).value||'';
    var plazo=(document.getElementById('plazo-dias')||{}).value||'';
    var moneda=(document.getElementById('moneda')||{}).value||'UF';
    var monto=(document.getElementById('monto-valor')||{}).value||'';
    var monDesc=(document.getElementById('monto-desc')||{}).value||'';
    var sup=(document.getElementById('superficie')||{}).value||'';
    var nOfic=(document.getElementById('nro-oficina')||{}).value||'';
    var montoStr=moneda+' '+monto+(monDesc?' ('+monDesc+')':'');
    var leftKVs=[dpKV('Obra / Proyecto',obra),dpKV('Edificio',edif),dpKV('Mandante',mand),dpKV('Contratista',cont),dpKV('Oficina / Pisos',nOfic)];
    var rightKVs=[dpKV('Fecha de inicio',fi),dpKV('Plazo contractual',plazo+' días corridos'),dpKV('Fecha de término',ft),dpKV('Monto del contrato',montoStr),dpKV('Superficie aprox.',sup+' m²')];
    var dpHtml=pvAbs(1.5,25,47,64,'display:flex;flex-direction:column;gap:2%;',leftKVs.join(''))+
               pvAbs(51,25,47,64,'display:flex;flex-direction:column;gap:2%;',rightKVs.join(''));
    slides.push(pvShell(pvCinta('1. Datos del proyecto')+dpHtml));

    // ──────────────────────────────
    // 4. ESTATUS DOCUMENTACIÓN
    // ──────────────────────────────
    var docRows=document.querySelectorAll('#doc-tbody tr');
    var docBody='';
    docRows.forEach(function(tr){
      var sem=tr.querySelector('.sem-btn');
      var cls=sem?(sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo'):'rojo';
      var lbl=cls==='verde'?'Aprobado':cls==='amarillo'?'En proceso':'No iniciado';
      var ins=tr.querySelectorAll('input');
      var nombre=ins[0]?ins[0].value:''; var fecha=ins[1]?ins[1].value:''; var com=ins[2]?ins[2].value:'';
      docBody+='<tr><td><span class="sdot '+cls+'"></span>'+pvEsc(lbl)+'</td><td>'+pvEsc(nombre)+'</td><td>'+pvEsc(fecha)+'</td><td>'+pvEsc(com)+'</td></tr>';
    });
    var docHtml='<table class="pv-tbl"><thead><tr><th style="width:18%">Estado</th><th>Documento</th><th style="width:16%">Aprobación</th><th style="width:20%">Comentarios</th></tr></thead><tbody>'+docBody+'</tbody></table>';
    slides.push(pvShell(pvCinta('2. Estatus de documentación')+pvAbs(1,25,98,67,'overflow:auto;',docHtml)));

    // ──────────────────────────────
    // 5. ESTATUS PROYECTOS
    // ──────────────────────────────
    var proyRows=document.querySelectorAll('#proy-tbody tr');
    var proyBody='';
    proyRows.forEach(function(tr){
      var sem=tr.querySelector('.sem-btn');
      var cls=sem?(sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo'):'rojo';
      var lbl=cls==='verde'?'Aprobado':cls==='amarillo'?'En proceso':'No iniciado';
      var tds=tr.querySelectorAll('td');
      var esp=tds[1]&&tds[1].querySelector('input')?tds[1].querySelector('input').value:'';
      var hrs=tr.querySelectorAll('.hist-row'); var nIter=hrs.length;
      var lastHr=hrs[hrs.length-1];
      var sel=lastHr&&lastHr.querySelector('select');
      var lastTipo=sel?sel.options[sel.selectedIndex].text:'—';
      var lastDate=lastHr&&lastHr.querySelector('input[type=date]')?lastHr.querySelector('input[type=date]').value:'';
      var fa=tds[3]&&tds[3].querySelector('input')?tds[3].querySelector('input').value:'';
      proyBody+='<tr><td><span class="sdot '+cls+'"></span>'+pvEsc(lbl)+'</td><td><strong>'+pvEsc(esp)+'</strong></td>'
        +'<td style="text-align:center;">'+nIter+'ª</td><td>'+pvEsc(lastTipo)+(lastDate?' — '+pvEsc(lastDate):'')+'</td><td style="text-align:center;">'+pvEsc(fa)+'</td></tr>';
    });
    var proyHtml='<table class="pv-tbl"><thead><tr><th style="width:16%">Estado</th><th>Especialidad</th><th style="width:7%">Iter.</th><th>Última revisión</th><th style="width:14%">Aprobación</th></tr></thead><tbody>'+proyBody+'</tbody></table>';
    slides.push(pvShell(pvCinta('3. Estatus de aprobación de proyectos')+pvAbs(1,25,98,67,'overflow:auto;',proyHtml)));

    // ──────────────────────────────
    // 6. CURVA S
    // ──────────────────────────────
    var lblProg=document.getElementById('lbl-prog')?document.getElementById('lbl-prog').textContent:'Avance Programado';
    var lblReal=document.getElementById('lbl-real')?document.getElementById('lbl-real').textContent:'Avance Real';
    var lblDesv=document.getElementById('lbl-desv')?document.getElementById('lbl-desv').textContent:'Desviación';
    var csNota=(document.getElementById('cs-nota')||{}).value||'';
    var leyHtml=pvAbs(1,25,98,15,'',
      '<div class="pv-cs-ley" style="color:#888;">'+pvEsc(lblProg)+'</div>'+
      '<div class="pv-cs-ley" style="color:#1a5fa8;">'+pvEsc(lblReal)+'</div>'+
      '<div class="pv-cs-ley" style="color:#d93a3a;">'+pvEsc(lblDesv)+'</div>');
    // Tabla CS
    var csRows2=document.querySelectorAll('#cs-tbody tr');
    var csTblBody='';
    csRows2.forEach(function(tr){
      var lbl2=tr.querySelector('.cs-lbl')?tr.querySelector('.cs-lbl').textContent:'';
      var prog=tr.querySelector('.cs-prog')?tr.querySelector('.cs-prog').value:'';
      var real=tr.querySelector('.cs-real')?tr.querySelector('.cs-real').value:'';
      var dv=prog&&real?(parseFloat(real)-parseFloat(prog)).toFixed(1):'';
      var dvColor=dv&&parseFloat(dv)<0?'color:#d93a3a;':dv&&parseFloat(dv)>0?'color:#1a5fa8;':'';
      csTblBody+='<tr><td>'+pvEsc(lbl2)+'</td><td style="text-align:right;">'+pvEsc(prog)+'%</td><td style="text-align:right;">'+pvEsc(real)+'%</td><td style="text-align:right;'+dvColor+'">'+pvEsc(dv)+'</td></tr>';
    });
    var csTblHtml='<table class="pv-tbl" style="font-size:0.8em;"><thead><tr><th>Sem.</th><th style="text-align:right;">Prog.%</th><th style="text-align:right;">Real%</th><th style="text-align:right;">Desv.</th></tr></thead><tbody>'+csTblBody+'</tbody></table>';
    // Gráfico
    var chartCanvas=document.getElementById('cs-chart');
    var gfxHtml=chartCanvas&&chartCanvas.width>0
      ?'<img src="'+chartCanvas.toDataURL()+'" style="width:100%;height:100%;object-fit:contain;">'
      :'<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-size:1em;">Sin datos</div>';
    var notaHtml=csNota?pvAbs(32,89,66,6,'font-size:0.75em;color:#5a5a5a;','<strong>Comentarios: </strong>'+pvEsc(csNota)):'';
    slides.push(pvShell(pvCinta('4. Control Curva S')+leyHtml+pvAbs(1,41,30,50,'overflow:auto;',csTblHtml)+pvAbs(33,41,65,47,'',gfxHtml)+notaHtml));

    // ──────────────────────────────
    // 7. SITUACIÓN GENERAL
    // ──────────────────────────────
    var p1txt=document.getElementById('sg-p1-texto')?document.getElementById('sg-p1-texto').textContent:'';
    var partidas3=Array.from(document.querySelectorAll('#partidas-list .partida-input')).map(function(i){return i.value;}).filter(Boolean);
    var sgHtml2='<div class="pv-punto" style="border-color:#ccc;"><strong>1.</strong> '+pvEsc(p1txt)+'</div>';
    if(partidas3.length){
      sgHtml2+='<div class="pv-punto" style="border-color:#ccc;"><strong>2.</strong> Trabajos en ejecución:</div>';
      partidas3.forEach(function(p){ sgHtml2+='<div style="padding:0.1em 0.5em 0.1em 2em;font-size:0.82em;color:#333;">— '+pvEsc(p)+'</div>'; });
    }
    var sgPuntos3=document.querySelectorAll('#sg-puntos-list .sg-punto-row');
    sgPuntos3.forEach(function(row,i){
      var ta=row.querySelector('.sg-punto-text');
      var est=row.dataset.estado||'';
      var txt=ta?ta.value:''; if(!txt) return;
      sgHtml2+='<div class="pv-punto '+pvEsc(est)+'"><strong>'+(i+(partidas3.length?3:2))+'.</strong> '+pvEsc(txt)+'</div>';
    });
    slides.push(pvShell(pvCinta('5. Situación general de la obra')+pvAbs(1,25,98,66,'overflow:hidden;',sgHtml2)));

    // ──────────────────────────────
    // 8. LAY OUT
    // ──────────────────────────────
    var loImg3=document.getElementById('lo-preview-img');
    var loSrc=loImg3&&loImg3.src&&loImg3.src.length>100?loImg3.src:'';
    var loVer=(document.getElementById('lo-version')||{}).value||'';
    var loFecha=(document.getElementById('lo-fecha')||{}).value||'';
    var loAutor=(document.getElementById('lo-autor')||{}).value||'';
    var loDesc=(document.getElementById('lo-desc')||{}).value||'';
    var loCapParts=[loVer?'Versión: '+loVer:'',loFecha?'Fecha: '+loFecha:'',loAutor?'Emitido por: '+loAutor:''].filter(Boolean);
    var loImgHtml=loSrc
      ?'<img src="'+loSrc+'" style="position:absolute;left:50%;top:25%;transform:translateX(-50%);max-width:90%;max-height:58%;object-fit:contain;">'
      :'<div style="position:absolute;left:5%;top:25%;right:5%;height:55%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#aaa;border:1px dashed #ccc;font-size:1em;">Sin plano adjunto</div>';
    var loVerHtml=pvAbs(0,20,100,5,'text-align:center;font-size:0.9em;color:#5a5a5a;font-style:italic;',pvEsc(loCapParts.join('   —   ')));
    var loDescHtml=loDesc?pvAbs(5,84,90,5,'text-align:center;font-size:0.85em;color:#5a5a5a;',pvEsc(loDesc)):'';
    slides.push(pvShell(pvCinta('6. Lay Out Arquitectura vigente')+loVerHtml+loImgHtml+loDescHtml));

    // ──────────────────────────────
    // 9. FOTOGRAFÍAS (2 por slide)
    // ──────────────────────────────
    if(fotos.length>0){
      for(var fi2=0;fi2<fotos.length;fi2+=2){
        var batch=fotos.slice(fi2,fi2+2);
        var fHtml='';
        batch.forEach(function(f,bi){
          var lx=bi===0?1.5:51; // left: 1.5% o 51%
          var gn='';
          if(f.grupo!==undefined&&fotoGrupos[f.grupo]) gn=fotoGrupos[f.grupo].nombre;
          fHtml+=pvAbs(lx,25,47,58,'','<img src="'+f.dataUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.25);">')+
            (gn?pvAbs(lx,83.5,47,4,'font-size:1.05em;font-weight:700;color:#8B1A1A;',pvEsc(gn)):'') +
            (f.pie?pvAbs(lx,gn?87.5:83.5,47,6,'font-size:0.95em;color:#1a1a1a;',pvEsc(f.pie)):'');
        });
        slides.push(pvShell(pvCinta('7. Fotografías relevantes')+fHtml));
      }
    }

    // ──────────────────────────────
    // 10. ANEXOS
    // ──────────────────────────────
    if(anexos.length>0){
      var anxBody=anexos.map(function(a){
        return '<tr><td>'+pvEsc(a.tipo)+'</td><td>'+pvEsc(a.titulo||a.nombre)+'</td><td>'+pvEsc(a.nombre)+'</td><td>'+pvEsc(a.desc)+'</td></tr>';
      }).join('');
      var anxHtml='<table class="pv-tbl"><thead><tr><th>Tipo</th><th>Título</th><th>Archivo</th><th>Descripción</th></tr></thead><tbody>'+anxBody+'</tbody></table>';
      slides.push(pvShell(pvCinta('8. Anexos')+pvAbs(1,25,98,67,'overflow:auto;',anxHtml)));
    }

    return slides;
  }
  // ══ FIN VISTA PREVIA ══════════════════════════════════

  // ══ AUTO-BACKUP A ARCHIVO ══════════════════════════════
  var _backupFileHandle = null;
  var _backupEnabled = false;
  var _idbDb = null;

  // Inicializar IndexedDB para persistir el FileHandle entre sesiones
  function initBackupDB() {
    return new Promise(function(resolve) {
      if (!window.indexedDB) { resolve(null); return; }
      var req = indexedDB.open('jasv_backup_db', 1);
      req.onupgradeneeded = function(e) {
        e.target.result.createObjectStore('handles', {keyPath:'id'});
      };
      req.onsuccess = function(e) { _idbDb = e.target.result; resolve(_idbDb); };
      req.onerror = function() { resolve(null); };
    });
  }

  function saveHandleToDB(handle) {
    if (!_idbDb) return;
    var tx = _idbDb.transaction('handles','readwrite');
    tx.objectStore('handles').put({id:'backup', handle: handle});
  }

  function loadHandleFromDB() {
    return new Promise(function(resolve) {
      if (!_idbDb) { resolve(null); return; }
      var tx = _idbDb.transaction('handles','readonly');
      var req = tx.objectStore('handles').get('backup');
      req.onsuccess = function(e) { resolve(e.target.result ? e.target.result.handle : null); };
      req.onerror = function() { resolve(null); };
    });
  }

  function deleteHandleFromDB() {
    if (!_idbDb) return;
    var tx = _idbDb.transaction('handles','readwrite');
    tx.objectStore('handles').delete('backup');
  }

  // Al iniciar: recuperar handle guardado y pedir permiso
  async function iniciarBackup() {
    await initBackupDB();
    if (!window.showSaveFilePicker) return; // browser no soporta
    var handle = await loadHandleFromDB();
    if (!handle) return; // no hay backup configurado
    // Verificar si ya tiene permiso
    var perm = await handle.queryPermission({mode:'readwrite'});
    if (perm === 'granted') {
      _backupFileHandle = handle;
      _backupEnabled = true;
      actualizarBotonBackup();
      return;
    }
    // Mostrar banner para pedir permiso con un clic
    mostrarBannerBackup(handle);
  }

  function mostrarBannerBackup(handle) {
    // Eliminar banner previo si existe
    var existing = document.getElementById('backup-banner');
    if (existing) existing.remove();
    window._pendingHandle = handle;
    var banner = document.createElement('div');
    banner.id = 'backup-banner';
    banner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1a3a4b;color:#fff;' +
      'padding:14px 20px;border-radius:12px;z-index:9998;display:flex;align-items:center;gap:12px;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.3);font-size:13px;max-width:340px;';
    var txt = document.createElement('span');
    txt.textContent = '📁 Reactivar auto-backup del archivo anterior';
    var btnAct = document.createElement('button');
    btnAct.textContent = 'Activar';
    btnAct.style.cssText = 'background:#2d7a4f;border:none;color:#fff;padding:6px 14px;border-radius:7px;cursor:pointer;font-weight:600;white-space:nowrap;';
    btnAct.addEventListener('click', function() {
      banner.remove();
      reactivarBackup();
    });
    var btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    btnClose.style.cssText = 'background:transparent;border:none;color:#aaa;cursor:pointer;font-size:16px;padding:0 4px;';
    btnClose.addEventListener('click', function() {
      banner.remove();
      deleteHandleFromDB();
    });
    banner.appendChild(txt);
    banner.appendChild(btnAct);
    banner.appendChild(btnClose);
    document.body.appendChild(banner);
  }

  async function reactivarBackup() {
    var handle = window._pendingHandle;
    if (!handle) return;
    try {
      var perm = await handle.requestPermission({mode:'readwrite'});
      if (perm === 'granted') {
        _backupFileHandle = handle;
        _backupEnabled = true;
        saveHandleToDB(handle);
        actualizarBotonBackup();
        mostrarToast('✅ Backup reactivado', 'ok');
        await ejecutarBackup(false);
      } else {
        mostrarToast('⚠ Permiso denegado', 'err');
      }
    } catch(e) { mostrarToast('Error: '+e.message, 'err'); }
  }

  async function configurarBackupFolder() {
    if (!window.showSaveFilePicker) { descargarBackupManual(); return; }
    try {
      var handle = await window.showSaveFilePicker({
        suggestedName: 'JASV_obras_backup.json',
        types: [{ description: 'Backup JASV', accept: {'application/json': ['.json']} }]
      });
      _backupFileHandle = handle;
      _backupEnabled = true;
      saveHandleToDB(handle);
      actualizarBotonBackup();
      await ejecutarBackup(false);
      mostrarToast('✅ Auto-backup activado', 'ok');
    } catch(e) {
      if (e.name !== 'AbortError') mostrarToast('Error: '+e.message, 'err');
    }
  }

  async function ejecutarBackup(showToast) {
    if (!_backupEnabled || !_backupFileHandle) {
      if (showToast !== false) mostrarToast('💾 Informe guardado', 'ok');
      return;
    }
    try {
      var obras = cargarObras();
      var json = JSON.stringify({version:1, fecha:new Date().toISOString(), obras:obras}, null, 2);
      var writable = await _backupFileHandle.createWritable();
      await writable.write(json); await writable.close();
      if (showToast !== false) mostrarToast('💾 Guardado · 📁 Backup actualizado', 'ok');
    } catch(e) {
      if (e.name === 'NotAllowedError') {
        _backupEnabled = false; actualizarBotonBackup();
        mostrarBannerBackup(_backupFileHandle);
      } else {
        if (showToast !== false) mostrarToast('💾 Guardado (backup falló: '+e.message+')', 'err');
      }
    }
  }

  function actualizarBotonBackup() {
    var btn = document.getElementById('btn-backup');
    if (!btn) return;
    if (_backupEnabled) {
      btn.textContent = '📁 Backup: ON';
      btn.style.borderColor = '#2d7a4f'; btn.style.color = '#2d7a4f'; btn.style.fontWeight='600';
      btn.title = 'Auto-backup activo. Clic para cambiar archivo.';
    } else {
      btn.textContent = '📁 Backup: OFF';
      btn.style.borderColor = ''; btn.style.color = ''; btn.style.fontWeight='';
      btn.title = 'Clic para activar auto-backup a archivo local';
    }
  }

  function descargarBackupManual() {
    var obras = cargarObras();
    var json = JSON.stringify({version:1, fecha:new Date().toISOString(), obras:obras}, null, 2);
    var blob = new Blob([json],{type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'JASV_backup_'+new Date().toISOString().split('T')[0]+'.json';
    a.click(); URL.revokeObjectURL(a.href);
    mostrarToast('📥 Backup descargado', 'ok');
  }

  function manejarBackup() {
    if (_backupEnabled) {
      // Ya activo — ofrecer cambiar o desactivar
      if (confirm('Backup activo.\n\n¿Cambiar archivo de destino?')) configurarBackupFolder();
    } else {
      configurarBackupFolder();
    }
  }
  // ══ FIN AUTO-BACKUP ══════════════════════════════════

  // ── Exportar solo el informe actual ──
  function exportarInformeActualJSON() {
    var estado = recolectarEstado();
    var obra2 = obraActual ? obraActual.nombre : (estado['nombre-obra']||'informe');
    var nro2  = estado['nro-informe'] || '000';
    var blob = new Blob([JSON.stringify({obra: obra2, informe: estado},null,2)],{type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ITO_'+String(obra2).replace(/[^a-zA-Z0-9]/g,'_').substring(0,25)+'_N'+String(nro2).padStart(3,'0')+'.json';
    a.click(); URL.revokeObjectURL(a.href);
    mostrarToast('📥 Informe exportado', 'ok');
  }

  // ── Actualizar título en topbar ──
  function actualizarTopbarTitulo() {
    var el = document.getElementById('inf-topbar-titulo');
    if (!el) return;
    if (typeof obraActual !== 'undefined' && obraActual && typeof informeActual !== 'undefined' && informeActual) {
      el.textContent = obraActual.nombre + ' — N° ' + String(informeActual.nro).padStart(3,'0');
    } else {
      el.textContent = '';
    }
  }

  // ══ INIT ══
document.getElementById('fecha-emision').value = new Date().toISOString().split('T')[0];
actualizarPortada();
actualizarSgPreview();
// Iniciar en pantalla de obras
setTimeout(function(){ mostrarPantallaObras(); iniciarBackup(); }, 50);


  // ══ HISTORIAL DE OBRAS ══════════════════════════════
  var HIST_KEY = 'jasv_historial_v1';

  // ── Recolectar todo el estado del formulario ──
  function recolectarEstado() {
    var estado = {};
    // Portada
    ['nro-informe','fecha-emision','semana-informe','nombre-obra','nombre-edificio',
     'direccion-obra','mandante','contratista'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) estado[id] = el.value;
    });
    // Datos proyecto
    ['nro-oficina','fecha-inicio','plazo-dias','fecha-termino','moneda','monto-valor',
     'monto-desc','descripcion-proyecto','superficie'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) estado[id] = el.value;
    });
    var chkA = document.getElementById('chk-aumento');
    if(chkA){ estado['chk-aumento'] = chkA.checked;
      ['aumento-dias','aumento-motivo','fecha-termino-nueva'].forEach(function(id){
        var el=document.getElementById(id); if(el) estado[id]=el.value;
      });
    }
    // Profesionales (todos los inputs en prof-rows)
    estado.profs = {};
    ['mandante-profs','constructora-profs','arq-profs','ito-profs','pm-profs'].forEach(function(sec){
      var rows = document.querySelectorAll('#'+sec+' .prof-row');
      estado.profs[sec] = Array.from(rows).map(function(r){
        var ins = r.querySelectorAll('input');
        return { cargo: ins[0]?ins[0].value:'', nombre: ins[1]?ins[1].value:'' };
      });
    });
    // Estatus documentación
    estado.docRows = Array.from(document.querySelectorAll('#doc-tbody tr')).map(function(tr){
      var ins = tr.querySelectorAll('input'); var sem = tr.querySelector('.sem-btn');
      var semClass = sem ? (sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo') : 'rojo';
      return { semaforo: semClass, nombre: ins[0]?ins[0].value:'', fecha: ins[1]?ins[1].value:'', com: ins[2]?ins[2].value:'' };
    });
    // Estatus proyectos
    estado.proyRows = Array.from(document.querySelectorAll('#proy-tbody tr')).map(function(tr){
      var tds = tr.querySelectorAll('td');
      var sem = tr.querySelector('.sem-btn');
      var semClass = sem?(sem.classList.contains('verde')?'verde':sem.classList.contains('amarillo')?'amarillo':'rojo'):'rojo';
      var esp = tds[1]&&tds[1].querySelector('input')?tds[1].querySelector('input').value:'';
      var fa = tds[3]&&tds[3].querySelector('input')?tds[3].querySelector('input').value:'';
      var hrows = Array.from(tr.querySelectorAll('.hist-row')).map(function(hr){
        var sel=hr.querySelector('select'); var di=hr.querySelector('input[type=date]');
        return { tipo: sel?sel.value:'', fecha: di?di.value:'' };
      });
      return { semaforo:semClass, especialidad:esp, fechaAprobacion:fa, historial:hrows };
    });
    // Curva S
    estado.csInicio = document.getElementById('cs-inicio')?document.getElementById('cs-inicio').value:'';
    estado.csTermino = document.getElementById('cs-termino')?document.getElementById('cs-termino').value:'';
    estado.diaControl = document.getElementById('dia-control')?document.getElementById('dia-control').value:'4';
    estado.csNota = document.getElementById('cs-nota')?document.getElementById('cs-nota').value:'';
    estado.csRows = Array.from(document.querySelectorAll('#cs-tbody tr')).map(function(tr){
      var lbl=tr.querySelector('.cs-lbl'); var fi=tr.querySelector('.cs-fi');
      var prog=tr.querySelector('.cs-prog'); var real=tr.querySelector('.cs-real');
      return { lbl:lbl?lbl.textContent:'', fi:fi?fi.value:'', prog:prog?prog.value:'', real:real?real.value:'' };
    });
    // Situación general
    estado.sgFechaVisita = document.getElementById('sg-fecha-visita')?document.getElementById('sg-fecha-visita').value:'';
    estado.sgNroVisita = document.getElementById('sg-nro-visita')?document.getElementById('sg-nro-visita').value:'';
    estado.partidas = Array.from(document.querySelectorAll('#partidas-list .partida-input')).map(function(i){return i.value;});
    estado.sgPuntos = Array.from(document.querySelectorAll('#sg-puntos-list .sg-punto-row')).map(function(r){
      var ta=r.querySelector('.sg-punto-text');
      return { texto:ta?ta.value:'', estado:r.dataset.estado||'' };
    });
    estado.sgPendientesAnterior = typeof recolectarPendientes==='function' ? recolectarPendientes() : [];
    // Lay Out
    ['lo-version','lo-fecha','lo-autor','lo-desc'].forEach(function(id){
      var el=document.getElementById(id); if(el) estado[id]=el.value;
    });
    var loImg=document.getElementById('lo-preview-img');
    var loImgEl2=document.getElementById('lo-preview-img');
    estado.loImgSrc = loImgEl2&&loImgEl2.src&&loImgEl2.src.length>100?loImgEl2.src:'';
    estado.loImgW = (loImgEl2&&loImgEl2.naturalWidth>0)?loImgEl2.naturalWidth:800;
    estado.loImgH = (loImgEl2&&loImgEl2.naturalHeight>0)?loImgEl2.naturalHeight:600;
    // Fotografías (con dataUrl ya comprimido)
    estado.fotos = fotos.map(function(f){
      return { dataUrl:f.dataUrl, pie:f.pie, grupo:f.grupo,
               warning:f.warning, warningTxt:f.warningTxt,
               resuelto:f.resuelto, resueltoTxt:f.resueltoTxt };
    });
    estado.fotoGrupos = fotoGrupos.map(function(g){ return { nombre:g.nombre }; });
    // Anexos (sin rawFile, solo metadata)
    estado.anexos = anexos.map(function(a){
      return { nombre:a.nombre, size:a.size, tipo:a.tipo, titulo:a.titulo,
               desc:a.desc, icono:a.icono, previewUrl:a.previewUrl||null };
    });
    return estado;
  }

  // ── Restaurar estado completo ──
  function restaurarEstado(estado) {
    // Campos simples
    var camposSimples = ['nro-informe','fecha-emision','semana-informe','nombre-obra',
      'nombre-edificio','direccion-obra','mandante','contratista',
      'nro-oficina','fecha-inicio','plazo-dias','fecha-termino','moneda','monto-valor',
      'monto-desc','descripcion-proyecto','superficie',
      'aumento-dias','aumento-motivo','fecha-termino-nueva',
      'cs-inicio','cs-termino','dia-control','cs-nota',
      'sg-fecha-visita','sg-nro-visita','sg-pendientes-anterior',
      'lo-version','lo-fecha','lo-autor','lo-desc'];
    camposSimples.forEach(function(id){
      var el=document.getElementById(id);
      if(el && estado[id]!==undefined) el.value=estado[id];
    });
    var chkA=document.getElementById('chk-aumento');
    if(chkA && estado['chk-aumento']!==undefined){
      chkA.checked=estado['chk-aumento'];
      if(typeof toggleAumento==='function') toggleAumento();
    }
    // Portada preview
    if(typeof actualizarPortada==='function') actualizarPortada();
    // Estatus documentación
    if(estado.docRows && typeof addDocRow==='function'){
      var tbody=document.getElementById('doc-tbody'); if(tbody) tbody.innerHTML='';
      estado.docRows.forEach(function(r){
        addDocRow(r.nombre);
        var lastTr=document.querySelector('#doc-tbody tr:last-child');
        if(!lastTr) return;
        var ins=lastTr.querySelectorAll('input');
        if(ins[1]) ins[1].value=r.fecha;
        if(ins[2]) ins[2].value=r.com;
        var sem=lastTr.querySelector('.sem-btn');
        if(sem && r.semaforo!=='rojo'){
          if(r.semaforo==='verde'){ sem.classList.remove('rojo','amarillo'); sem.classList.add('verde'); }
          else if(r.semaforo==='amarillo'){ sem.classList.remove('rojo','verde'); sem.classList.add('amarillo'); }
        }
      });
    }
    // Estatus proyectos
    if(estado.proyRows && typeof addProyRow==='function'){
      var ptbody=document.getElementById('proy-tbody'); if(ptbody) ptbody.innerHTML='';
      estado.proyRows.forEach(function(r){
        addProyRow(r.especialidad);
        var lastTr=document.querySelector('#proy-tbody tr:last-child');
        if(!lastTr) return;
        var tds=lastTr.querySelectorAll('td');
        if(tds[3]&&tds[3].querySelector('input')) tds[3].querySelector('input').value=r.fechaAprobacion||'';
        var sem=lastTr.querySelector('.sem-btn');
        if(sem && r.semaforo!=='rojo'){
          if(r.semaforo==='verde'){ sem.classList.remove('rojo','amarillo'); sem.classList.add('verde'); }
          else{ sem.classList.remove('rojo','verde'); sem.classList.add('amarillo'); }
        }
        // Historial de revisiones
        if(r.historial && r.historial.length>0){
          var histContainer=lastTr.querySelector('.hist-container');
          if(histContainer){
            histContainer.innerHTML='';
            r.historial.forEach(function(h){
              if(typeof addHistRow==='function') addHistRow(histContainer,h.tipo,h.fecha);
            });
          }
        }
      });
    }
    // Curva S
    if(estado.csRows && estado.csRows.length>0){
      var cstbody=document.getElementById('cs-tbody'); if(cstbody) cstbody.innerHTML='';
      estado.csRows.forEach(function(r,rIdx){
        if(typeof addCsRow==='function'){
          var tr2=document.createElement('tr');
          tr2.innerHTML='<td><span class="cs-lbl">'+(rIdx===0?'Inicio obra':r.lbl)+'</span></td>'+
            '<td><input class="cs-fi" type="date" value="'+r.fi+'" readonly></td>'+
            '<td><div class="pct-row"><input class="cs-prog" type="number" min="0" max="100" step="0.1" value="'+r.prog+'" oninput="actualizarGrafico()"><span>%</span></div></td>'+
            '<td><div class="pct-row"><input class="cs-real real-inp" type="number" min="0" max="100" step="0.1" value="'+r.real+'" oninput="actualizarGrafico()"><span>%</span></div></td>';
          var cstbody2=document.getElementById('cs-tbody'); if(cstbody2) cstbody2.appendChild(tr2);
        }
      });
      if(typeof actualizarGrafico==='function') actualizarGrafico();
    }
    // Situación general
    if(estado.partidas){
      var pList2=document.getElementById('partidas-list'); if(pList2) pList2.innerHTML='';
      estado.partidas.forEach(function(p){ if(typeof addPartida==='function') addPartida(); var last=document.querySelector('#partidas-list .partida-input:last-of-type'); if(last) last.value=p; });
    }
    if(estado.sgPuntos){
      var sgList=document.getElementById('sg-puntos-list'); if(sgList) sgList.innerHTML=''; sgPuntoCount=0;
      estado.sgPuntos.forEach(function(p){ if(typeof addSgPunto==='function') addSgPunto(p.texto, p.estado); });
    }
    if(typeof actualizarSgPreview==='function') actualizarSgPreview();
    // Lay Out imagen
    if(estado.loImgSrc && estado.loImgSrc.length>100){
      var loImg2=document.getElementById('lo-preview-img');
      var loWrap=document.getElementById('lo-preview-wrap');
      var loDz=document.getElementById('lo-dropzone');
      if(loImg2){ loImg2.src=estado.loImgSrc; loImg2.style.display='block'; }
      if(loWrap) loWrap.style.display='block';
      if(loDz) loDz.style.display='none';
    }
    // Fotografías
    fotos = (estado.fotos||[]).map(function(f){ return Object.assign({},f); });
    fotoGrupos = (estado.fotoGrupos||[]).map(function(g){ return Object.assign({},g); });
    if(typeof renderFotos==='function') renderFotos();
    if(typeof renderGrupos==='function') renderGrupos();
    // Anexos
    // Anexos: siempre vacíos — cada informe gestiona los suyos
    anexos = [];
    if(typeof renderAnexos==='function') renderAnexos();
    // Ir a portada
    if(typeof irA==='function') irA(0);
  }

  // ── GUARDAR en localStorage ──
  function guardarEnHistorial() {
    var estado = recolectarEstado();
    var obra = estado['nombre-obra'] || 'Sin nombre';
    var nro  = estado['nro-informe'] || '000';
    var fecha = new Date().toISOString();
    var key = 'jasv_inf_' + Date.now();
    var meta = { key:key, obra:obra, nro:nro, fecha:fecha, semana:estado['semana-informe']||'' };
    try {
      localStorage.setItem(key, JSON.stringify(estado));
      var hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
      hist.unshift(meta);
      if(hist.length>30) { // máx 30 registros
        var old=hist.pop(); try{localStorage.removeItem(old.key);}catch(e){}
      }
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      mostrarToast('💾 Informe guardado: '+obra+' N°'+nro, 'ok');
      renderHistorial();
    } catch(e) {
      mostrarToast('Error al guardar (¿almacenamiento lleno?): '+e.message, 'err');
    }
  }

  // ── EXPORTAR JSON ──
  function exportarJSON() {
    var estado = recolectarEstado();
    var obra = estado['nombre-obra']||'informe';
    var nro  = estado['nro-informe']||'000';
    var blob = new Blob([JSON.stringify(estado,null,2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ITO_'+obra.replace(/[^a-zA-Z0-9]/g,'_')+'_N'+nro+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
    mostrarToast('📥 JSON exportado', 'ok');
  }

  // ── IMPORTAR JSON ──
  function importarJSON(input) {
    if(!input.files.length) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var estado = JSON.parse(e.target.result);
        restaurarEstado(estado);
        mostrarToast('✅ Informe importado correctamente', 'ok');
      } catch(ex) {
        mostrarToast('❌ Archivo inválido: '+ex.message, 'err');
      }
    };
    reader.readAsText(input.files[0]);
    input.value='';
  }

  // ── ELIMINAR del historial ──
  function eliminarHistorial(key) {
    try {
      localStorage.removeItem(key);
      var hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]');
      hist = hist.filter(function(h){ return h.key !== key; });
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
      renderHistorial();
      mostrarToast('🗑 Registro eliminado', 'ok');
    } catch(e) {}
  }

  // ── CARGAR del historial ──
  function cargarHistorial(key) {
    try {
      var data = localStorage.getItem(key);
      if(!data) { mostrarToast('Registro no encontrado', 'err'); return; }
      var estado = JSON.parse(data);
      restaurarEstado(estado);
      cerrarHistorial();
      mostrarToast('✅ Informe cargado', 'ok');
    } catch(e) { mostrarToast('Error al cargar: '+e.message, 'err'); }
  }

  // ── RENDER lista del historial ──
  function renderHistorial() {
    var list = document.getElementById('hist-list');
    if(!list) return;
    var hist = [];
    try { hist = JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); } catch(e){}
    if(hist.length === 0){
      list.innerHTML = '<div style="color:var(--gris);font-style:italic;padding:16px 0">No hay informes guardados aún.</div>';
      return;
    }
    list.innerHTML = '';
    hist.forEach(function(meta){
      var row = document.createElement('div'); row.className = 'hist-row-item';
      var info = document.createElement('div'); info.className = 'hist-info';
      var title = document.createElement('div'); title.className = 'hist-title';
      title.textContent = meta.obra + (meta.semana?' — '+meta.semana:'');
      var sub = document.createElement('div'); sub.className = 'hist-sub';
      sub.textContent = 'N° '+meta.nro+' · '+new Date(meta.fecha).toLocaleString('es-CL',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      info.appendChild(title); info.appendChild(sub);
      var btns = document.createElement('div'); btns.className = 'hist-btns';
      var btnLoad = document.createElement('button'); btnLoad.className = 'btn btn-pri'; btnLoad.style.fontSize='12px'; btnLoad.style.padding='5px 12px';
      btnLoad.textContent = '↩ Cargar';
      (function(k){ btnLoad.addEventListener('click', function(){ cargarHistorial(k); }); })(meta.key);
      var btnDel = document.createElement('button'); btnDel.className = 'btn btn-sec'; btnDel.style.fontSize='12px'; btnDel.style.padding='5px 10px'; btnDel.style.color='#b02828';
      btnDel.textContent = '🗑';
      (function(k){ btnDel.addEventListener('click', function(){ if(confirm('¿Eliminar este registro?')) eliminarHistorial(k); }); })(meta.key);
      btns.appendChild(btnLoad); btns.appendChild(btnDel);
      row.appendChild(info); row.appendChild(btns);
      list.appendChild(row);
    });
  }

  function abrirHistorial() {
    renderHistorial();
    document.getElementById('hist-modal').style.display='flex';
  }
  function cerrarHistorial() {
    document.getElementById('hist-modal').style.display='none';
  }

  // ── TOAST ──
  function mostrarToast(msg, tipo) {
    var t = document.getElementById('jasv-toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'jasv-toast show' + (tipo==='err'?' err':'');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show','err'); }, 3200);
  }
  // ══ FIN HISTORIAL ══════════════════════════════════════

  // ══ INIT ══
document.getElementById('fecha-emision').value = new Date().toISOString().split('T')[0];
actualizarPortada();
actualizarSgPreview();
// Iniciar en pantalla de obras
setTimeout(function(){ mostrarPantallaObras(); iniciarBackup(); }, 50);
