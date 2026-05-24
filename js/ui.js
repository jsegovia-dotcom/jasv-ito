  function mostrarToast(msg, tipo) {
    var t = document.getElementById('jasv-toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'jasv-toast show' + (tipo==='err'?' err':'');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show','err'); }, 3200);
  }
  // ══ FIN HISTORIAL ══════════════════════════════════════

