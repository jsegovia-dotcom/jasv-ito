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
    // Ocultar topbar principal — pantalla obras tiene su propio header
    var mainTop = document.querySelector('.topbar');
    if (mainTop) mainTop.style.display = 'none';
    sincronizarLogoObras();
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
  function abrirFormulario(obra, inf, esNuevo) {
    informeActual = inf;
    // Mostrar app
    document.getElementById('pantalla-obras').style.display = 'none';
    document.getElementById('pantalla-informes').style.display = 'none';
    document.querySelector('.app').style.display = '';
    var mainTop3 = document.querySelector('.topbar');
    if (mainTop3) mainTop3.style.display = '';
    var tb = document.getElementById('inf-topbar');
    if (tb) tb.style.display = '';
    irA(0);
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
      }

      // ══ Curva S: cargar programado + real del anterior ══
      if(prev && prev.csRows && prev.csRows.length>0){
        var csInEl=document.getElementById('cs-inicio');
        var csTerEl=document.getElementById('cs-termino');
        if(csInEl && prev.csInicio) csInEl.value=prev.csInicio;
        if(csTerEl && prev.csTermino) csTerEl.value=prev.csTermino;
        var csnota=document.getElementById('cs-nota'); if(csnota) csnota.value='';
        var cstbody=document.getElementById('cs-tbody'); if(cstbody) cstbody.innerHTML='';
        prev.csRows.forEach(function(r){
          var tr2=document.createElement('tr');
          tr2.innerHTML='<td><span class="cs-lbl">'+r.lbl+'</span></td>'+
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
          loImg2.onload=function(){ loImg2.style.display='block'; };
          loImg2.src=prev.loImgSrc;
          if(loImg2.complete) loImg2.style.display='block'; // already cached
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
      var sgFecha=document.getElementById('sg-fecha-visita'); if(sgFecha) sgFecha.value='';
      var sgNroV=document.getElementById('sg-nro-visita'); if(sgNroV) sgNroV.value='';

      // Pendientes del informe anterior: puntos en proceso/pendiente/urgente
      // Pendientes del informe anterior: mostrar en sg-pendientes-list
      var sgPendList=document.getElementById('sg-pendientes-list');
      if(sgPendList){
        if(prev && prev.sgPuntos && prev.sgPuntos.length>0){
          var pendItems=prev.sgPuntos.filter(function(p){
            return p.estado==='pendiente'||p.estado==='urgente'||p.estado==='proceso';
          });
          if(pendItems.length>0){
            sgPendList.innerHTML='';
            pendItems.forEach(function(p){
              var div=document.createElement('div');
              var bgMap={urgente:'#fff3cd',pendiente:'#fdecea',proceso:'#e8f4fd'};
              var colMap={urgente:'#d93a3a',pendiente:'#b02828',proceso:'#1a5fa8'};
              var lblMap={urgente:'🔴 URGENTE',pendiente:'⚠ Pendiente',proceso:'⟳ En proceso'};
              div.style.cssText='padding:10px 14px;border-radius:8px;background:'+(bgMap[p.estado]||'#f5f5f5')+
                ';border-left:4px solid '+(colMap[p.estado]||'#888')+';margin-bottom:8px;';
              div.innerHTML='<span style="font-size:11px;font-weight:700;color:'+(colMap[p.estado]||'#888')+'">'+
                (lblMap[p.estado]||p.estado)+'</span><div style="font-size:13px;margin-top:4px;color:#1a1a1a">'+
                p.texto.replace(/</g,'&lt;')+'</div>';
              sgPendList.appendChild(div);
            });
          } else {
            sgPendList.innerHTML='<div style="font-size:13px;color:#2d7a4f;padding:8px 0">✅ Sin puntos pendientes del informe anterior.</div>';
          }
        } else {
          sgPendList.innerHTML='<div style="font-size:13px;color:#aaa;font-style:italic;padding:8px 0">Los puntos no cerrados aparecerán aquí la próxima semana.</div>';
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

    } else {
      // Restaurar estado guardado
      if (inf.estado && Object.keys(inf.estado).length > 0) {
        restaurarEstado(inf.estado);
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

