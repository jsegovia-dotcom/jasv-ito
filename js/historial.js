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
    estado.sgPendientesAnterior = document.getElementById('sg-pendientes-anterior')?document.getElementById('sg-pendientes-anterior').value:'';
    // Lay Out
    ['lo-version','lo-fecha','lo-autor','lo-desc'].forEach(function(id){
      var el=document.getElementById(id); if(el) estado[id]=el.value;
    });
    var loImg=document.getElementById('lo-preview-img');
    estado.loImgSrc = loImg&&loImg.src&&loImg.src.length>100?loImg.src:'';
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
      estado.csRows.forEach(function(r){
        if(typeof addCsRow==='function'){
          var tr2=document.createElement('tr');
          tr2.innerHTML='<td><span class="cs-lbl">'+r.lbl+'</span></td>'+
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
    anexos = (estado.anexos||[]).map(function(a){ return Object.assign({},a); });
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
