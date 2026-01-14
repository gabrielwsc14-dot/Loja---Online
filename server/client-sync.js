(function(){
  const API_DB = '/api/db';
  const API_SYNC = '/api/sync';

  async function fetchServerDB(){
    try{
      const r = await fetch(API_DB, {cache: 'no-store'});
      if (!r.ok) throw new Error('fetch failed');
      return await r.json();
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

  (async function init(){
    const serverDb = await fetchServerDB();
    const localStr = localStorage.getItem('lojaDB');
    const localDb = localStr ? JSON.parse(localStr) : null;
    const merged = simpleMerge(serverDb, localDb);
    if (merged) {
      try{
        localStorage.setItem('lojaDB', JSON.stringify(merged));
      }catch(e){console.warn('localStorage set failed', e)}
    }

    // send merged back to server to centralize new items
    try{
      await fetch(API_SYNC, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({db: merged})});
    }catch(e){console.warn('sync push failed', e)}

    // watch for changes and push periodically
    let last = localStorage.getItem('lojaDB');
    setInterval(async ()=>{
      try{
        const cur = localStorage.getItem('lojaDB');
        if (cur && cur !== last){
          last = cur;
          await fetch(API_SYNC, {method:'POST', headers:{'Content-Type':'application/json'}, body: cur});
        }
      }catch(e){console.warn('periodic sync failed', e)}
    }, 5000);
  })();
})();
