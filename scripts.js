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


// Per-mod GitHub Releases integration.
// All three mods live in peureumen/snb. Each mod is identified by its release-tag prefix.
const githubMods = [
  {
    name: "Advanced Compass++",
    repo: "peureumen/snb",
    tagPrefix: "advcomreleases",
    description: "Advanced Compass++"
  },
  {
    name: "After Effects+",
    repo: "peureumen/snb",
    tagPrefix: "afteffreleases",
    description: "After Effects+"
  },
  {
    name: "ShouldersAndBeyond",
    repo: "peureumen/snb",
    tagPrefix: "snbreleases",
    description: "ShouldersAndBeyond"
  }
];

(function loadModReleases(){
  const grid = document.querySelector("#mod-release-grid");
  if (!grid) return;

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
    const releasesUrl = `${repoUrl}/releases`;
    const [owner, repository] = mod.repo.split("/");

    fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases?per_page=100`)
      .then(response => {
        if (!response.ok) throw new Error("GitHub releases could not be loaded.");
        return response.json();
      })
      .then(releases => {
        const matchingReleases = releases
          .filter(release => !release.draft && !release.prerelease &&
            (release.tag_name || "").toLowerCase().startsWith(mod.tagPrefix.toLowerCase()))
          .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

        const latest = matchingReleases[0];
        if (!latest) {
          version.textContent = "No published release found for this mod.";
          notes.textContent = `Expected a release tag beginning with: ${mod.tagPrefix}`;
          foot.append(makeLink("View repository releases", releasesUrl, "btn btn-primary"));
          return;
        }

        version.textContent = `${latest.tag_name || latest.name || "Latest"}${latest.published_at ? " · " + new Date(latest.published_at).toLocaleDateString() : ""}`;
        notes.textContent = (latest.body || "No release notes provided.").trim().slice(0, 500);
        foot.append(makeLink("View release", latest.html_url, "btn btn-secondary"));
        const asset = (latest.assets || []).find(item => item.name.toLowerCase().endsWith(".jar"));
        if (asset) foot.append(makeLink("Download .jar", asset.browser_download_url, "btn btn-primary"));
        else foot.append(makeLink("All releases", releasesUrl, "btn btn-primary"));
      })
      .catch(error => {
        version.textContent = error.message || "Could not load release.";
        foot.append(makeLink("GitHub repository", repoUrl, "btn btn-secondary"));
        foot.append(makeLink("All releases", releasesUrl, "btn btn-primary"));
      });
  });
})();
