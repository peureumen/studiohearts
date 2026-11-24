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


// Per-mod GitHub Releases integration. Add one entry per mod and set its repo to
// "GitHubOwner/RepositoryName". Each card loads its own latest release.
const githubMods = [
  // Example: { name: "My Mod", repo: "Carmen/MyMod", description: "A short mod description." }
];

(function loadModReleases(){
  const grid = document.querySelector("#mod-release-grid");
  if (!grid) return;

  if (!githubMods.length) {
    const empty = document.createElement("p");
    empty.className = "product-card-line";
    empty.textContent = "Add each mod's GitHub repository in the githubMods list in scripts.js to show its latest release here.";
    grid.append(empty);
    return;
  }

  const makeLink = (label, href, className) => {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = href;
    link.className = className || "btn btn-secondary";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  };

  githubMods.forEach(mod => {
    const card = document.createElement("article");
    card.className = "card product-card github-release-card";
    const body = document.createElement("div");
    body.className = "product-card-body";
    const name = document.createElement("h3");
    name.className = "product-card-name";
    name.textContent = mod.name;
    const description = document.createElement("p");
    description.className = "product-card-line";
    description.textContent = mod.description || "Minecraft mod";
    const version = document.createElement("p");
    version.className = "product-card-line github-release-version";
    version.textContent = "Loading latest release…";
    const notes = document.createElement("p");
    notes.className = "product-card-line github-release-notes";
    const foot = document.createElement("div");
    foot.className = "card-foot github-release-actions";
    body.append(name, description, version, notes, foot);
    card.append(body);
    grid.append(card);

    const repoUrl = `https://github.com/${mod.repo}`;
    fetch(`https://api.github.com/repos/${encodeURIComponent(mod.repo.split("/")[0])}/${encodeURIComponent(mod.repo.split("/")[1])}/releases/latest`)
      .then(response => {
        if (!response.ok) throw new Error(response.status === 404 ? "No releases found (check the repository name)." : "GitHub release unavailable.");
        return response.json();
      })
      .then(release => {
        version.textContent = `${release.tag_name || release.name || "Latest"}${release.published_at ? " · " + new Date(release.published_at).toLocaleDateString() : ""}`;
        notes.textContent = (release.body || "No release notes.").trim().slice(0, 240);
        foot.append(makeLink("View release", release.html_url, "btn btn-secondary"));
        const asset = (release.assets || []).find(a => a.name.toLowerCase().endsWith(".jar"));
        if (asset) foot.append(makeLink("Download .jar", asset.browser_download_url, "btn btn-primary"));
        else foot.append(makeLink("Downloads", repoUrl + "/releases", "btn btn-primary"));
      })
      .catch(error => {
        version.textContent = error.message || "Could not load release.";
        foot.append(makeLink("GitHub", repoUrl, "btn btn-secondary"));
        foot.append(makeLink("All releases", repoUrl + "/releases", "btn btn-primary"));
      });
  });
})();
