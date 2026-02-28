(function(){
  const API_DB = '/api/db';
  const API_PATCH = '/api/patch';

  // global version used for all outgoing patch requests
  let GLOBAL_VERSION = 1;

  async function fetchServerDB(){
    try{
      const r = await fetch(API_DB, {cache: 'no-store'});
      if (!r.ok) throw new Error('fetch failed');
      const j = await r.json();
      if (j && j.__meta && typeof j.__meta.version === 'number') GLOBAL_VERSION = j.__meta.version;
      return j;
    }catch(e){
      console.warn('Could not fetch server DB', e);
      return null;
    }
  }

  function simpleMerge(server, local){
    if (!server) return local || {};
    if (!local) return server || {};
    const merged = JSON.parse(JSON.stringify(server));
    for (const k of Object.keys(local)){
      if (!merged[k]) { merged[k] = local[k]; continue; }
      if (Array.isArray(merged[k]) && Array.isArray(local[k])){
        const map = new Map();
        merged[k].forEach(it => {
          const id = (it && it.id !== undefined) ? it.id : JSON.stringify(it);
          map.set(id, it);
        });
        local[k].forEach(it => {
          const id = (it && it.id !== undefined) ? it.id : JSON.stringify(it);
          if (!map.has(id)) map.set(id, it);
        });
        merged[k] = Array.from(map.values());
        continue;
      }
      if (typeof merged[k] === 'object' && typeof local[k] === 'object'){
        merged[k] = Object.assign({}, merged[k], local[k]);
        continue;
      }
    }
    return merged;
  }

  // save a single-field patch. Exposed as window.savePatch for other scripts.
  async function savePatch(id, field, value, _attempt){
    try{
      const payload = { id, field, value, version: GLOBAL_VERSION };
      const r = await fetch(API_PATCH, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (r.status === 409){
        // conflict: server provides currentVersion
        let j = null;
        try{ j = await r.json(); }catch(e){}
        const currentVersion = j && (j.currentVersion || j.currentVersion === 0) ? j.currentVersion : null;
        if (currentVersion) GLOBAL_VERSION = currentVersion;

        // refresh local DB from server
        const serverDb = await fetchServerDB();
        const localStr = localStorage.getItem('lojaDB');
        const localDb = localStr ? JSON.parse(localStr) : null;
        const merged = simpleMerge(serverDb, localDb);
        try{ localStorage.setItem('lojaDB', JSON.stringify(merged)); }catch(e){console.warn('localStorage set failed', e)}

        // retry once
        if (!_attempt) return savePatch(id, field, value, true);
        console.warn('Patch conflict after retry, data changed on server');
        return { ok: false, error: 'conflict' };
      }

      if (!r.ok) {
        // server error: inform user
        if (r.status >= 500) {
          try { alert('Falha interna no servidor ao salvar. Tente novamente mais tarde.'); } catch (e) {}
          return { ok: false, error: 'server' };
        }
        console.warn('Patch request failed', r.status);
        return { ok: false, error: 'network' };
      }

      const res = await r.json();
      if (res && res.ok) {
        // update local store with returned item and new version
        GLOBAL_VERSION = res.version || GLOBAL_VERSION;
        try{
          const localStr = localStorage.getItem('lojaDB');
          const db = localStr ? JSON.parse(localStr) : {};
          if (!db.__meta) db.__meta = {};
          db.__meta.version = GLOBAL_VERSION;
          db.__meta.updatedAt = res.updatedAt || Date.now();

          // apply merged item to local db arrays
          for (const k of Object.keys(db)){
            if (k === '__meta') continue;
            const col = db[k];
            if (Array.isArray(col)){
              for (let i=0;i<col.length;i++){
                if (col[i] && col[i].id === id){
                  col[i] = Object.assign({}, col[i], res.item);
                  break;
                }
              }
            }
          }
          localStorage.setItem('lojaDB', JSON.stringify(db));
        }catch(e){console.warn('failed to update local db after patch', e)}
        return res;
      }
      return { ok: false, error: 'unknown' };
    }catch(e){
      console.warn('savePatch error', e);
      return { ok: false, error: 'exception' };
    }
  }

  // init: load server db, merge with local, store and set GLOBAL_VERSION
  (async function init(){
    const serverDb = await fetchServerDB();
    const localStr = localStorage.getItem('lojaDB');
    const localDb = localStr ? JSON.parse(localStr) : null;
    const merged = simpleMerge(serverDb, localDb);
    if (merged) {
      if (!merged.__meta) merged.__meta = { version: GLOBAL_VERSION, updatedAt: Date.now() };
      try{
        localStorage.setItem('lojaDB', JSON.stringify(merged));
      }catch(e){console.warn('localStorage set failed', e)}
    }

    // periodically refresh server DB to pick up external changes
    setInterval(async ()=>{
      try{
        const server = await fetchServerDB();
        const localStr2 = localStorage.getItem('lojaDB');
        const local2 = localStr2 ? JSON.parse(localStr2) : null;
        const merged2 = simpleMerge(server, local2);
        if (merged2) {
          try{ localStorage.setItem('lojaDB', JSON.stringify(merged2)); }catch(e){console.warn('localStorage set failed', e)}
        }
      }catch(e){console.warn('periodic refresh failed', e)}
    }, 5000);

    // expose savePatch for pages to call
    window.savePatch = savePatch;
    window.getGlobalVersion = () => GLOBAL_VERSION;
  })();
})();
