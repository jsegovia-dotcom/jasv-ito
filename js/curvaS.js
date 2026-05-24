// ══ SITUACIÓN GENERAL ══
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
    var badge = est ? '<span class="badge '+est+'">'+(badgeMap[est]||est)+'</span>' : '';
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