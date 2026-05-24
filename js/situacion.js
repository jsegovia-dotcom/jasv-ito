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
