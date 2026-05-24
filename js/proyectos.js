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
    var semLbl = esSaldo ? 'Término obra' : 'S' + String(i+1).padStart(2,'0');
    var p = prev[fs] || { prog:'', real:'' };
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