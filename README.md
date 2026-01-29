# Disney Wedding Site (Pastel + Guest Uploads)

This project is a React (Vite) site designed for Cloudflare Pages + GitHub.

✅ Pastel look & feel (like Claude's version)  
✅ No playlist  
✅ Guest photo upload + public gallery (Upload tab + shown on Suggestions tab)  
✅ Suggestions are editable from the website (admin passcode)  
✅ Works as a plain static site locally, but uploads/editing require Pages Functions + KV + R2 bindings.

---

## Local dev

```bash
npm install
npm run dev
```

Functions-based features (uploads/suggestions saving) require bindings; you can still run UI without them.

---

## Deploy to Cloudflare Pages (recommended)

Cloudflare Pages will build the static site **and** run your `/functions` backend.  
Cloudflare’s docs cover Pages build settings and bindings. (See citations in the ChatGPT instructions.)

Build settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

### 1) Create the GitHub repo
1. Create a new repo on GitHub (e.g. `disney-wedding-site`)
2. Upload this project (or push with git)

### 2) Create Cloudflare resources
In Cloudflare dashboard:
1. Create an **R2 bucket** (example name: `wedding-photos`)
2. Create a **KV namespace** (example name: `wedding-kv`)

### 3) Create a Pages project
1. Cloudflare Dashboard → **Workers & Pages** → **Pages** → Create project
2. Connect to your GitHub repo
3. Set build command + output dir as above
4. Deploy

### 4) Add bindings to Pages
In the Pages project → **Settings** → **Functions** → **Bindings**:
- Add KV namespace binding:
  - Variable name: `WEDDING_KV`
  - Select your KV namespace
- Add R2 bucket binding:
  - Variable name: `WEDDING_PHOTOS`
  - Select your R2 bucket
- Add environment variable (or Secret):
  - `ADMIN_PASSCODE` = a passcode you’ll type into the Suggestions tab to enable editing

Then redeploy.

---

## Notes

- Uploaded photos are stored in R2 and served via `/api/photos/file/<key>`.
- The photo list metadata and suggestions are stored in KV.
- If you want stricter security for suggestions editing:
  - remove the `hdr === 'SESSION'` shortcut in `/functions/api/suggestions/index.js`.

