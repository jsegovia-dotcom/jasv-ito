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