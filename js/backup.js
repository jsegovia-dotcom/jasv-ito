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
