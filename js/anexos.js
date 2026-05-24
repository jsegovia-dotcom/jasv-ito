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