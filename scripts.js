// Carmen site: theme toggle, current year, mod cards (home) and mod pages (direct downloads).
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

// Everything is free and built for one game version + loader.
const SITE = {
  mc: "26.3",
  loader: "Fabric",
  fabricApiUrl: "https://modrinth.com/mod/fabric-api",
  fabricInstallerUrl: "https://fabricmc.net/use/installer/"
};

// ---------------------------------------------------------------------------
// MOD LIST: edit this to add or change mods.
//   slug        -> the page lives at  /studiohearts/mods/<slug>/   (folder name must match)
//   repo + tag  -> the GitHub release the Download button pulls the .jar from
//   tagline     -> one line shown on the home card and at the top of the mod page
//   about       -> description on the mod page (blank line = new paragraph)
//   features    -> bullet list on the mod page (leave [] to hide the section)
//   screenshots -> [{ src: "https://...png", caption: "..." }]  (leave [] to hide the section)
// ---------------------------------------------------------------------------
const githubMods = [
  {
  slug: "jcraft",
  name: "JCraft",
  repo: "peureumen/mods",
  tag: "jcraftreleases",
  thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/jcraftthmb.png",
  tagline: "A free VFX/HUD mod for Minecraft 26.3.",
  about: "",
  features: [],
  screenshots: []
},
  {
    slug: "audify",
    name: "Audify",
    repo: "peureumen/mods",
    tag: "audifyreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/audifythmb.png",
    tagline: "A free SFX mod for Minecraft 26.3.",
    about: "",
    features: [],
    screenshots: []
  },
  {
  slug: "damage-indicators-3",
  name: "Damage Indicators 3.0",
  repo: "peureumen/mods",
  tag: "dmginreleases",
  thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/dmginthmb.png",
  tagline: "Unofficial Java Port from Pixelbiester for Minecraft 26.3.",
  about: "",
  features: [],
  screenshots: []
},
  {
    slug: "shouldersandbeyond",
    name: "Shoulders & Beyond",
    repo: "peureumen/mods",
    tag: "snbreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/snbthmb.png",
    tagline: "Punchy! Moves' shoulder surfing camera standalone",
    about: "",
    features: [],
    screenshots: []
  },
  {
    slug: "advanced-compass",
    name: "Advanced Compass++",
    repo: "peureumen/mods",
    tag: "advcomreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/advthmb.png",
    tagline: "Unofficial port of Advanced Compass to 26.3",
    about: "",
    features: [],
    screenshots: []
  },
  {
    slug: "after-effects-plus",
    name: "After Effects+",
    repo: "peureumen/mods",
    tag: "afteffreleases",
    thumbnail: "https://raw.githubusercontent.com/peureumen/mods/refs/heads/main/aethmb.png",
    tagline: "Unofficial port of Combat Effects to 26.3",
    about: "",
    features: [],
    screenshots: []
  }
];

// ---------- small helpers ----------
const ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path></svg>';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatSize(bytes) {
  if (!bytes) return "";
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---------- GitHub releases (one request per repo, cached for 10 minutes) ----------
function fetchReleases(repo) {
  const key = "carmenReleases:" + repo;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key));
    if (cached && Date.now() - cached.t < 600000) return Promise.resolve(cached.d);
  } catch (e) {}
  return fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
    headers: { Accept: "application/vnd.github+json" }
  })
    .then(response => {
      if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
      return response.json();
    })
    .then(releases => {
      const slim = releases.map(r => ({
        tag_name: r.tag_name, name: r.name, draft: r.draft, prerelease: r.prerelease,
        published_at: r.published_at, created_at: r.created_at, html_url: r.html_url,
        assets: (r.assets || []).map(a => ({
          name: a.name, size: a.size, download_count: a.download_count, browser_download_url: a.browser_download_url
        }))
      }));
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: slim })); } catch (e) {}
      return slim;
    });
}

function latestRelease(releases, tag) {
  // Accept the exact tag or versioned tags beginning with the mod's tag.
  const matching = releases.filter(r =>
    !r.draft && !r.prerelease &&
    (r.tag_name === tag || r.tag_name.startsWith(tag + "-") || r.tag_name.startsWith(tag + "_"))
  );
  matching.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
  return matching[0] || null;
}

function pickJar(release) {
  const jars = (release.assets || []).filter(a =>
    /\.jar$/i.test(a.name) && !/-(sources|dev|javadoc)\.jar$/i.test(a.name)
  );
  return jars.find(a => a.name.includes(SITE.mc)) || jars[0] || null;
}


// ---------- HOME: Top card (Audify) ----------
(function renderTopMod() {
  const host = document.getElementById("top-mod-card");
  if (!host) return;

  const mod = githubMods.find(m => m.slug === "audify");
  if (!mod) return;

  const card = el("div", "card top-mod-card");

  const artWrap = el("div", "top-mod-art-wrap");
  const image = el("img", "top-mod-art");
  image.src = mod.thumbnail;
  image.alt = "";
  image.width = 520;
  image.height = 320;
  image.loading = "eager";
  image.decoding = "async";
  image.addEventListener("error", () => {
    artWrap.replaceChildren(el("div", "product-art-fallback", mod.name.charAt(0)));
  });
  artWrap.appendChild(image);

  const body = el("div", "top-mod-body");
  const head = el("div", "top-mod-head");
  head.append(
    el("h3", "top-mod-name", mod.name),
    el("span", "badge badge-green", "Free")
  );

  const line = el("p", "top-mod-line", mod.tagline);
  const facts = el("div", "top-mod-facts");
  facts.append(
    el("span", "product-compat", `${SITE.mc} · ${SITE.loader}`),
    el("span", "badge", "Free download")
  );

  const actions = el("div", "top-mod-actions");
  const details = el("a", "btn btn-secondary", "Details");
  details.href = `mods/${mod.slug}/`;
  const download = el("a", "btn btn-primary", "Download .jar");
  download.href = `https://github.com/${mod.repo}/releases/tag/${mod.tag}`;
  download.target = "_blank";
  download.rel = "noopener noreferrer";
  actions.append(details, download);

  body.append(head, line, facts, actions);
  card.append(artWrap, body);
  host.replaceChildren(card);
})();

// ---------- HOME: mod cards that open each mod's page ----------
(function renderModCards() {
  const grid = document.getElementById("mod-release-grid");
  if (!grid) return;

  githubMods.forEach(mod => {
    const card = el("a", "card product-card");
    card.href = `mods/${mod.slug}/`;

    const wrap = el("span", "product-art-wrap");
    const showFallback = () => {
      wrap.replaceChildren(el("span", "product-art product-art-fallback", mod.name.trim().charAt(0).toUpperCase()));
    };
    if (mod.thumbnail) {
      const image = el("img", "product-art");
      image.src = mod.thumbnail;
      image.alt = "";
      image.width = 320;
      image.height = 320;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", showFallback);
      wrap.appendChild(image);
    } else {
      showFallback();
    }

    const body = el("div", "product-card-body");
    body.append(
      el("h3", "product-card-name", mod.name),
      el("p", "product-card-line", mod.tagline)
    );
    const foot = el("div", "card-foot");
    foot.append(
      el("span", "product-compat", `${SITE.mc} · ${SITE.loader}`),
      el("span", "badge badge-green", "Free")
    );
    body.appendChild(foot);

    card.append(wrap, body);
    grid.appendChild(card);
  });
})();

// ---------- MOD PAGE: fill in details + direct download button ----------
(function renderModPage() {
  const slug = document.body && document.body.dataset.mod;
  if (!slug) return;
  const mod = githubMods.find(m => m.slug === slug);
  if (!mod) return;

  document.querySelectorAll("[data-mod-name]").forEach(n => n.textContent = mod.name);
  document.querySelectorAll("[data-mod-tagline]").forEach(n => n.textContent = mod.tagline);

  // Artwork
  ["data-mod-hero", "data-mod-icon"].forEach(attr => {
    const img = document.querySelector(`img[${attr}]`);
    if (!img) return;
    if (!mod.thumbnail) return;
    img.addEventListener("error", () => { img.hidden = true; });
    img.src = mod.thumbnail;
    img.alt = "";
    img.hidden = false;
  });

  // About
  const about = document.querySelector("[data-mod-about]");
  if (about) {
    const paragraphs = (mod.about || "").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (!paragraphs.length) paragraphs.push("A full description is coming soon.");
    about.replaceChildren(...paragraphs.map(text => el("p", "", text)));
  }

  // Features
  const featureSection = document.querySelector('[data-section="features"]');
  if (featureSection) {
    if (mod.features && mod.features.length) {
      featureSection.querySelector("ul").replaceChildren(...mod.features.map(f => el("li", "", f)));
    } else {
      featureSection.hidden = true;
    }
  }

  // Screenshots + viewer
  const shotSection = document.querySelector('[data-section="shots"]');
  if (shotSection) {
    if (mod.screenshots && mod.screenshots.length) setupScreenshots(mod, shotSection);
    else shotSection.hidden = true;
  }

  // Direct download button
  const button = document.querySelector("[data-download]");
  const meta = document.querySelector("[data-download-meta]");
  const versionFact = document.querySelector('[data-fact="version"]');
  if (!button) return;
  const releasesUrl = `https://github.com/${mod.repo}/releases`;

  function setButton(o) {
    button.className = "btn btn-block " + (o.secondary ? "btn-secondary" : "btn-primary") + (o.loading ? " is-loading" : "");
    button.href = o.href;
    if (o.external) { button.target = "_blank"; button.rel = "noopener noreferrer"; }
    else { button.removeAttribute("target"); button.removeAttribute("rel"); }
    button.replaceChildren();
    if (o.icon !== false) button.insertAdjacentHTML("beforeend", ICON_DOWNLOAD);
    button.append(el("span", "", o.label));
  }

  setButton({ label: "Finding latest version…", href: releasesUrl, loading: true, icon: false });
  if (meta) meta.textContent = "Checking GitHub for the newest file.";

  fetchReleases(mod.repo)
    .then(releases => {
      const release = latestRelease(releases, mod.tag);
      if (!release) throw new Error("No published release found.");
      const jar = pickJar(release);
      const label = release.name || release.tag_name;
      if (versionFact) versionFact.textContent = label;

      if (!jar) {
        setButton({ label: "Download files", href: release.html_url, external: true, secondary: true });
        if (meta) meta.textContent = `${label}: open the release page to pick a file.`;
        return;
      }
      setButton({ label: "Download .jar", href: jar.browser_download_url });
      const downloads = (release.assets || []).reduce((sum, a) => sum + (a.download_count || 0), 0);
      const bits = [label, formatDate(release.published_at), formatSize(jar.size)];
      if (downloads > 0) bits.push(downloads.toLocaleString() + " downloads");
      if (meta) meta.textContent = bits.filter(Boolean).join(" · ");
    })
    .catch(() => {
      setButton({ label: "Open GitHub releases", href: releasesUrl, external: true, secondary: true });
      if (versionFact) versionFact.textContent = "See releases";
      if (meta) meta.textContent = "Couldn’t get the direct link right now. The releases page has the same file.";
    });
})();

function setupScreenshots(mod, section) {
  const strip = section.querySelector("[data-mod-shots]");
  const count = section.querySelector("[data-shot-count]");
  if (count) count.textContent = mod.screenshots.length === 1 ? "1 image" : `${mod.screenshots.length} images`;

  const dialog = el("dialog", "shot-viewer");
  dialog.setAttribute("aria-label", `${mod.name} screenshots`);
  const frame = el("div", "shot-viewer-frame");
  const big = el("img");
  big.alt = "";
  const close = el("button", "shot-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  frame.append(big, close);
  const bar = el("div", "shot-viewer-bar");
  const prev = el("button", "shot-nav", "‹");
  prev.type = "button";
  prev.setAttribute("aria-label", "Previous screenshot");
  const caption = el("p", "shot-viewer-caption");
  caption.setAttribute("aria-live", "polite");
  const next = el("button", "shot-nav", "›");
  next.type = "button";
  next.setAttribute("aria-label", "Next screenshot");
  bar.append(prev, caption, next);
  dialog.append(frame, bar);
  document.body.appendChild(dialog);

  let index = 0;
  const show = i => {
    index = (i + mod.screenshots.length) % mod.screenshots.length;
    const shot = mod.screenshots[index];
    big.src = shot.src;
    big.alt = shot.caption || "";
    caption.textContent = `${index + 1} / ${mod.screenshots.length}${shot.caption ? " · " + shot.caption : ""}`;
  };
  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  strip.replaceChildren(...mod.screenshots.map((shot, i) => {
    const figure = el("figure", "shot");
    const open = el("button", "shot-open");
    open.type = "button";
    open.setAttribute("aria-label", `View screenshot ${i + 1}${shot.caption ? ": " + shot.caption : ""}`);
    const thumb = el("img");
    thumb.src = shot.src;
    thumb.alt = shot.caption || "";
    thumb.width = 480;
    thumb.height = 270;
    thumb.loading = "lazy";
    thumb.decoding = "async";
    open.appendChild(thumb);
    open.addEventListener("click", () => { show(i); dialog.showModal(); });
    figure.appendChild(open);
    if (shot.caption) figure.appendChild(el("figcaption", "", shot.caption));
    return figure;
  }));
}
