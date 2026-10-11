# Secure portfolio demo

Protected portfolio images are blurred and watermarked **on the server** with sharp,
so the browser never receives the original. No CSS blur is used anywhere in the protected flow.

## How it works

| Request | Visitor without access | Approved client |
| --- | --- | --- |
| `/api/image?id=1..3` | Watermarked, max 1600px | Watermarked, max 1600px |
| `/api/image?id=4..6` | New 32px-wide blurred JPEG (q40), ~0.3 KB | Watermarked, max 1600px |
| `/private-images/*` | 404 (not in the publish folder) | 404 |

- Originals live in `private-images/`, outside `public/`, and are bundled only into the
  functions via `included_files` in `netlify.toml`.
- The watermark is an SVG built in code and composited into the pixels. Its text is stored
  as vector paths (`functions/_lib/watermark-paths.js`), so it renders identically on
  Netlify, where the function runtime has no system fonts.
- Access is a magic link: `/access?token=...` sets an HttpOnly, Secure, SameSite=Lax cookie
  for 7 days. Tokens are in `functions/_lib/access.js`; set `active: false` to revoke one.

## Run locally

```bash
npm install
npx netlify dev
```

Open http://localhost:8888.

## Deploy

**Git (recommended).** Push to GitHub, then in Netlify: Add new site → Import an existing
project → pick the repo. Build settings come from `netlify.toml`. Netlify installs the Linux
sharp binary itself.

**CLI from Windows or macOS.** Use `npm run deploy:prod`. It temporarily installs the Linux
sharp binary so the uploaded function works on Netlify, deploys, then restores your local one.

## Replacing the images

Drop real work into `private-images/` as `project-1.jpg` … `project-6.jpg` and replace
`public/sample-css.jpg` (the deliberately public CSS-blur sample). The placeholder images were
made with `npm run generate:images`.
