# Ela Rosen — Portfolio

Code version of [elarosenai.figma.site](https://elarosenai.figma.site/): plain HTML + CSS, no build step, same URLs as the Figma site.

```
index.html          Home: name, title, 4 project tiles, LinkedIn / Email / CV
videos/index.html   Video Ads Variation Pipeline (GLOW)
batch/index.html    Batch Image Generation App
reskin/index.html   Character Re-skin (Lamar)
loras/index.html    LoRA Training From Scratch (Cinema World)
css/style.css       All styling: colors, type, layout, mobile breakpoints
js/main.js          Loads/plays videos only when they scroll into view
assets/             Images + videos (filled by the download script)
scripts/            download-assets.mjs, compress-videos.sh
```

## 1. Get the images and videos (once)

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd ela-rosen-portfolio
npm run assets
```

This pulls all 21 images and videos from your Figma site into `assets/`.

## 2. Shrink the videos (recommended)

The Figma videos are big (the five on the Video Ads page are 17–65 MB each). Compressing them makes the page load fast and keeps every file under hosting limits.

```bash
# install ffmpeg first:  brew install ffmpeg   (Mac)   or   winget install ffmpeg   (Windows)
npm run compress
```

## 3. Preview locally

```bash
npm run dev
```

Open the address it prints (usually http://localhost:3000).

## 4. Put it on GitHub

1. Create a new empty repository on github.com, e.g. `portfolio`.
2. In this folder:

```bash
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/<your-username>/portfolio.git
git push -u origin main
```

## 5. Deploy (free) — Netlify

1. Sign in at [netlify.com](https://app.netlify.com) with GitHub.
2. **Add new site → Import an existing project → GitHub →** pick the repo.
3. Leave build command empty and publish directory as `.` → **Deploy**.
4. You get a live URL like `ela-rosen.netlify.app`. Every `git push` redeploys automatically.

Vercel works the same way (Import Project → Framework: Other → Deploy).
Cloudflare Pages also works, but only after step 2: it rejects files over 25 MB.

## 6. Connect your own domain

1. Buy a domain (e.g. `elarosen.com`) at Namecheap, Porkbun or Cloudflare.
2. In Netlify: **Domain management → Add a domain**, then follow the DNS records it shows you at your registrar.
3. HTTPS turns on automatically within a few minutes.

## 7. After you have the domain

- Add a social preview image: save a 1200×630 PNG as `assets/og-image.png`, then add to each page's `<head>`:
  `<meta property="og:image" content="https://your-domain.com/assets/og-image.png">`
- Unlike the figma.site version, this site is indexable by Google. Submit it in [Google Search Console](https://search.google.com/search-console) to get found faster.

## Editing

- **Text:** edit the HTML file for that page.
- **Colors / fonts / spacing:** the variables at the top of `css/style.css` (`--bg`, `--accent`, etc.).
- **Add a project:** copy one of the project folders, change its text and assets, and add a tile in `index.html` under `<nav class="projects">`.
