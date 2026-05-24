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
