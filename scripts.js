// Carmen site interactions: theme toggle and current year.
(function(){
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("carmenTheme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) toggle.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("carmenTheme", next); } catch (e) {}
    toggle.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
  });
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();

// Each mod uses its own release tag in the shared public repository.
const githubMods = [
  {
    name: "Advanced Compass++",
    repo: "peureumen/snb",
    tag: "advcomreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/snb/refs/heads/main/advthmb.png"
  },
  {
    name: "After Effects+",
    repo: "peureumen/snb",
    tag: "afteffreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/snb/refs/heads/main/aethmb.png"
  },
  {
    name: "ShouldersAndBeyond",
    repo: "peureumen/snb",
    tag: "snbreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/snb/refs/heads/main/snbthmb.png"
  }
];

(function renderModCards() {
  const grid = document.getElementById("mod-release-grid");
  if (!grid) return;

  const createLink = (label, href, className) => {
    const a = document.createElement("a");
    a.className = className;
    a.href = href;
    a.textContent = label;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  };

  githubMods.forEach(mod => {
    const card = document.createElement("article");
    card.className = "card product-card github-release-card";

    if (mod.thumbnail) {
      const image = document.createElement("img");
      image.className = "github-release-thumbnail";
      image.src = mod.thumbnail;
      image.alt = mod.name + " thumbnail";
      image.loading = "eager";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.alt = mod.name + " thumbnail could not be loaded";
        image.classList.add("thumbnail-load-error");
      });
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "product-card-body";
    const title = document.createElement("h3");
    title.className = "product-card-name";
    title.textContent = mod.name;
    const version = document.createElement("p");
    version.className = "product-card-line github-release-version";
    version.textContent = "Loading release…";
    const notes = document.createElement("p");
    notes.className = "product-card-line github-release-notes";
    notes.textContent = "Fetching the latest published release.";
    const actions = document.createElement("div");
    actions.className = "card-foot github-release-actions";
    body.append(title, version, notes, actions);
    card.appendChild(body);
    grid.appendChild(card);

    const repoUrl = `https://github.com/${mod.repo}`;
    const releaseListUrl = `https://api.github.com/repos/${mod.repo}/releases?per_page=100`;
    fetch(releaseListUrl, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store"
    })
      .then(async response => {
        if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
        return response.json();
      })
      .then(releases => {
        // Accept the exact tag or versioned tags beginning with the mod's tag.
        const matching = releases.filter(release =>
          !release.draft && !release.prerelease &&
          (release.tag_name === mod.tag || release.tag_name.startsWith(mod.tag + "-") || release.tag_name.startsWith(mod.tag + "_"))
        );
        matching.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
        const release = matching[0];
        if (!release) throw new Error(`No published release found with tag “${mod.tag}”.`);

        version.textContent = `${release.name || release.tag_name}${release.published_at ? " · " + new Date(release.published_at).toLocaleDateString() : ""}`;
        notes.textContent = (release.body || "No release notes provided.").trim().slice(0, 500);
        actions.appendChild(createLink("View release", release.html_url, "btn btn-secondary"));
        const jar = (release.assets || []).find(asset => (asset.name || "").toLowerCase().endsWith(".jar"));
        if (jar) actions.appendChild(createLink("Download .jar", jar.browser_download_url, "btn btn-primary"));
        else actions.appendChild(createLink("Download files", release.html_url, "btn btn-primary"));
      })
      .catch(error => {
        version.textContent = "Release information unavailable";
        notes.textContent = error.message;
        actions.appendChild(createLink("Open GitHub releases", `${repoUrl}/releases`, "btn btn-secondary"));
      });
  });
})();
