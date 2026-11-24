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
// Each mod has its own exact release tag in the shared peureumen/snb repository.
const githubMods = [
  {
    name: "Advanced Compass++",
    repo: "peureumen/snb",
    releaseTag: "advcomreleases",
    description: "Advanced Compass++"
  },
  {
    name: "After Effects+",
    repo: "peureumen/snb",
    releaseTag: "afteffreleases",
    description: "After Effects+"
  },
  {
    name: "ShouldersAndBeyond",
    repo: "peureumen/snb",
    releaseTag: "snbreleases",
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

  const repoUrl = "https://github.com/peureumen/snb";

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
    description.textContent = mod.description;
    const version = document.createElement("p");
    version.className = "product-card-line github-release-version";
    version.textContent = "Loading release…";
    const notes = document.createElement("p");
    notes.className = "product-card-line github-release-notes";
    const foot = document.createElement("div");
    foot.className = "card-foot github-release-actions";
    body.append(name, description, version, notes, foot);
    card.append(body);
    grid.append(card);

    const releaseUrl = `${repoUrl}/releases/tag/${encodeURIComponent(mod.releaseTag)}`;
    const apiUrl = `https://api.github.com/repos/${mod.repo}/releases/tags/${encodeURIComponent(mod.releaseTag)}`;

    fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    })
      .then(async response => {
        if (response.status === 404) throw new Error("Release not found. Check that this exact tag is published.");
        if (response.status === 403) throw new Error("GitHub API rate limit reached. Please try again later.");
        if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
        return response.json();
      })
      .then(release => {
        version.textContent = `${release.name || release.tag_name}${release.published_at ? " · " + new Date(release.published_at).toLocaleDateString() : ""}`;
        notes.textContent = (release.body || "No release notes provided.").trim().slice(0, 500);
        foot.append(makeLink("View release", release.html_url || releaseUrl, "btn btn-secondary"));
        const assets = Array.isArray(release.assets) ? release.assets : [];
        const jar = assets.find(asset => (asset.name || "").toLowerCase().endsWith(".jar"));
        if (jar) {
          foot.append(makeLink("Download .jar", jar.browser_download_url, "btn btn-primary"));
        } else {
          foot.append(makeLink("Download files", release.html_url || releaseUrl, "btn btn-primary"));
          const warning = document.createElement("small");
          warning.className = "github-release-hint";
          warning.textContent = "No .jar asset is attached to this release yet.";
          body.append(warning);
        }
      })
      .catch(error => {
        version.textContent = "Couldn't load this release.";
        notes.textContent = error.message;
        foot.append(makeLink("Open GitHub release", releaseUrl, "btn btn-secondary"));
        foot.append(makeLink("All releases", `${repoUrl}/releases`, "btn btn-primary"));
      });
  });
})();
