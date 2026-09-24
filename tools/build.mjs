// Builds the site: wraps every pages/*.html fragment in the shared header,
// nav and footer, and regenerates pages/changelog.html from Slidey's
// CHANGELOG.md.
//
//   node tools/build.mjs <path to the slidey repo>/CHANGELOG.md
//
// A page fragment starts with one comment line:
//   <!-- title: Page title | description: One sentence for search results -->
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://venari-hunt.github.io/slidey-docs/";

// Order = nav order.
const NAV = [
    ["index", "Home"],
    ["getting-started", "Getting started"],
    ["writing", "Writing slides"],
    ["slide-menu", "Slide menu (/)"],
    ["looks", "Layouts & styles"],
    ["pictures", "Pictures"],
    ["presenting", "Presenting"],
    ["export", "Export"],
    ["settings", "Settings"],
    ["faq", "FAQ"],
    ["changelog", "What's new"],
];

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Just enough Markdown for CHANGELOG.md: headings, bullets, **bold**,
// `code` and [links](url).
function inline(text) {
    return escapeHtml(text)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function buildChangelog(changelogPath, limit = 20) {
    const text = readFileSync(changelogPath, "utf8");
    const releases = text
        .split(/^## /m)
        .slice(1)
        .filter((block) => /^\d+\.\d+\.\d+/.test(block))
        .slice(0, limit);
    const body = releases
        .map((block) => {
            const [heading, ...lines] = block.split("\n");
            const items = lines
                .filter((line) => line.startsWith("- "))
                .map((line) => `  <li>${inline(line.slice(2))}</li>`)
                .join("\n");
            return `<section class="release">\n<h2>${inline(heading.trim())}</h2>\n<ul>\n${items}\n</ul>\n</section>`;
        })
        .join("\n\n");
    writeFileSync(
        path.join(root, "pages", "changelog.html"),
        `<!-- title: What's new | description: Every Slidey release, newest first. -->
<h1>What's new</h1>
<p class="subtitle">Every Slidey release, newest first. The ${releases.length} most recent are listed here; the full history is in the <a href="https://github.com/Venari-Hunt/slidey/blob/main/CHANGELOG.md">changelog on GitHub</a>.</p>

${body}
`,
    );
}

function page(name, fragment) {
    const [, title, description] =
        /^<!--\s*title:\s*(.*?)\s*\|\s*description:\s*(.*?)\s*-->/.exec(
            fragment,
        ) ?? [];
    if (!title) {
        throw new Error(`pages/${name}.html: missing the title comment`);
    }
    const content = fragment.slice(fragment.indexOf("-->") + 3).trim();
    const nav = NAV.map(
        ([file, label]) =>
            `      <a href="${file}.html"${file === name ? ' class="active"' : ""}>${escapeHtml(label)}</a>`,
    ).join("\n");
    const fullTitle = name === "index" ? title : `${title} — Slidey`;
    const url = name === "index" ? SITE : `${SITE}${name}.html`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="assets/img/favicon.svg">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <img class="logo" src="assets/img/favicon.svg" alt="">
    <span class="brand">Slidey</span>
    <nav class="site-nav">
${nav}
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
${content}
  </div>
</main>

<footer>
  <div class="wrap">
    Slidey is an independent Obsidian plugin, built on <a href="https://github.com/ebullient/obsidian-slides-extended">Slides Extended</a> (MIT). This guide covers the plugin as it is today and grows with each release.
  </div>
</footer>
</body>
</html>
`;
}

const changelogPath = process.argv[2];
if (changelogPath) {
    buildChangelog(changelogPath);
}

const files = new Set(
    readdirSync(path.join(root, "pages")).filter((f) => f.endsWith(".html")),
);
for (const [name] of NAV) {
    if (!files.has(`${name}.html`)) {
        throw new Error(`pages/${name}.html is in the nav but missing`);
    }
    const fragment = readFileSync(path.join(root, "pages", `${name}.html`), "utf8");
    writeFileSync(path.join(root, `${name}.html`), page(name, fragment));
}

writeFileSync(
    path.join(root, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${NAV.map(([name]) => `  <url><loc>${name === "index" ? SITE : `${SITE}${name}.html`}</loc></url>`).join("\n")}
</urlset>
`,
);
console.log(`Built ${NAV.length} pages.`);
