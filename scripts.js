const MODS={
  "advanced-compass":{name:"Advanced Compass",tagline:"A better compass experience for Minecraft.",game:"26.3",loader:"Fabric",icon:"https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/advthmb.png",match:/advanced[-_ ]?compass|advcom/i},
  "after-effects-plus":{name:"After Effects Plus",tagline:"Enhanced visual effects for your Minecraft experience.",game:"26.3",loader:"Fabric",icon:"https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/aethmb.png",match:/after[-_ ]?effects|afteff/i},
  "shouldersandbeyond":{name:"Shoulders & Beyond",tagline:"Punchy! Moves' shoulder surfing camera standalone",game:"26.3",loader:"Fabric",icon:"https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/snbthmb.png",match:/shoulders?[-_ ]?and[-_ ]?beyond|snb/i}
};
const slug=document.body.dataset.mod;
const mod=MODS[slug]||MODS["shouldersandbeyond"];
const $=s=>document.querySelector(s);
function set(sel,val){const e=$(sel);if(e)e.textContent=val}
set('[data-mod-name]',mod.name);set('[data-mod-tagline]',mod.tagline);set('[data-fact="game"]',mod.game);set('[data-fact="loader"]',mod.loader);set('[data-mod-about]',`A full description is coming soon.`);const icon=$('[data-mod-icon]');if(icon)icon.src=mod.icon;
async function loadRelease(){
  const version=$('[data-fact="version"]'), meta=$('[data-download-meta]'), btn=$('[data-download]');
  try{
    const r=await fetch('https://api.github.com/repos/peureumen/mods/releases?per_page=30',{headers:{Accept:'application/vnd.github+json'}});
    if(!r.ok)throw new Error('release request failed');
    const releases=await r.json();
    const candidates=[];
    for(const rel of releases){
      const hay=[rel.name,rel.tag_name,...(rel.assets||[]).map(a=>a.name)].join(' ');
      if(mod.match.test(hay)) candidates.push(rel);
    }
    candidates.sort((a,b)=>new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at));
    const rel=candidates[0]||releases[0];
    if(!rel)throw new Error('no releases');
    const asset=(rel.assets||[]).find(a=>/\.jar$/i.test(a.name));
    const label=rel.name||rel.tag_name||'Latest release';
    set('[data-fact="version"]',label);
    if(asset){
      btn.href=asset.browser_download_url;
      btn.setAttribute('download','');
      meta.textContent=`${label} · ${(asset.size/1024).toFixed(0)} KB · ${asset.download_count||0} downloads`;
    }else{
      btn.href=rel.html_url;
      meta.textContent=`${label} · No .jar asset found`;
    }
  }catch(e){
    set('[data-fact="version"]','Latest release');
    meta.textContent='Release information unavailable';
    btn.href='https://github.com/peureumen/mods/releases';
  }
}
loadRelease();
