# Slidey Docs

User guide for [Slidey](https://github.com/Venari-Hunt/slidey), an Obsidian plugin that turns notes into slide decks. Plain static HTML/CSS, served by GitHub Pages from this repo's `main` branch.

Live at: https://venari-hunt.github.io/slidey-docs/

## Editing

Edit the page content in `pages/*.html`. Each file starts with a
`<!-- title: … | description: … -->` line. Then rebuild:

```
node tools/build.mjs <path to the slidey repo>/CHANGELOG.md
```

That wraps every page in the shared header, nav and footer, writes the finished pages to the repo root, regenerates `pages/changelog.html` (What's new) from Slidey's changelog, and rewrites `sitemap.xml`. Commit both `pages/` and the root `.html` files.

To add a page: create `pages/<name>.html` and add it to `NAV` in `tools/build.mjs`.

After each Slidey release, rebuild so What's new is current.
