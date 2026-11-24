// Carmen site interactions: theme toggle and current year.
(function(){
  const root=document.documentElement;
  try { const saved=localStorage.getItem("carmenTheme"); if(saved==="light"||saved==="dark") root.dataset.theme=saved; } catch(e) {}
  const toggle=document.querySelector(".theme-toggle");
  if(toggle) toggle.addEventListener("click",()=>{
    const next=root.dataset.theme==="dark"?"light":"dark"; root.dataset.theme=next;
    try { localStorage.setItem("carmenTheme",next); } catch(e) {}
    toggle.setAttribute("aria-label",next==="dark"?"Switch to light theme":"Switch to dark theme");
  });
  document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
})();
