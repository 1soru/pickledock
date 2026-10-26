# PickleDock website

Static site for PickleDock, a 3D-printed ball holder that clamps onto a sports wheelchair.

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `pickledock`).
2. Upload everything in this folder to the repository root. Keep the folder structure as is.
3. In the repo, open **Settings > Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, pick `main` and `/ (root)`, then Save.
5. After a minute the site is live at `https://YOUR-USERNAME.github.io/pickledock/`.

## What's inside

```
index.html          page content
style.css           all styling (light and dark mode)
script.js           menu, fit guide, lightbox
viewer.js           interactive 3D model (three.js, loaded from a CDN)
assets/img/         photos, renders, logo, favicon
assets/models/      lightweight STL files used by the 3D viewer
downloads/          v6 print files (cup, four clamps, and a zip of all of them)
.nojekyll           tells GitHub Pages to serve files as-is
```

## Common edits

- **Text:** everything is in `index.html`. Search for the sentence you want to change.
- **New print files:** put the STLs in `downloads/`, update the links in the "Get the files" section and the `data-file` paths in the fit guide, and rebuild `PickleDock_v6_all_parts.zip`.
- **Contact email:** search `index.html` for `mailto:` (it appears twice).
- **New video:** swap the video ID in the YouTube embed (`/embed/VIDEO_ID`).
- **Colors:** the variables at the top of `style.css`.

The 3D viewer needs to be opened through a web server (GitHub Pages counts). Opening `index.html` straight from your computer may block the model from loading, but everything else will work.
