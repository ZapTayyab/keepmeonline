# Keep Me Online - Ad Networks & Hosting Integration Guide

This guide explains how to host your website and activate ads from **Google AdSense**, **Adsterra**, or **PropellerAds**.

---

## 1. Hosting the Website

Your website is a modern Single Page Application (SPA) with hash routing (`/#/about`, `/#/blog`, etc.). It can be hosted for **free** on any static hosting provider.

### Option A: Cloudflare Pages (Recommended - Fast, Free SSL, Global CDN)
1. Push your repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages**.
3. Select your repo.
4. Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### Option B: Netlify
1. Connect repository.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy.

### Option C: Vercel
1. Import repository.
2. Framework preset automatically detects `Vite`.
3. Output Directory: `dist`.
4. Deploy.

---

## 2. Setting up Google AdSense

### Step 1: Update `public/ads.txt`
Open `public/ads.txt` and replace `pub-XXXXXXXXXXXXXXXX` with your personal AdSense Publisher ID:
```
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

### Step 2: Add AdSense Script in `index.html`
In `index.html`, inside the `<head>` tag, add your Google AdSense tag:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
     crossorigin="anonymous"></script>
```

### Step 3: Enable Ads in `.env`
Create or edit `.env` in the root:
```env
VITE_ADS_ENABLED=true
```

### Step 4: AdSense Approval Tips
- Submit your domain (e.g. `https://yourdomain.com`).
- Google requires a minimum set of indexed, original text content. The site currently includes 6 detailed articles under `/blog`, a Privacy Policy, and Terms of Service.
- Ensure your custom domain is connected (AdSense generally rejects free subdomains like `.web.app` or `.netlify.app` for initial approval).

---

## 3. Setting up Adsterra

Adsterra has an instant approval process and works well with calculators and utility sites.

1. Create a Publisher account at [Adsterra](https://adsterra.com/).
2. Add your website domain and choose your category (e.g., Tools/Utility).
3. Choose ad formats:
   - **Native Banners** or **Display Banners (728x90, 300x250)**: Place script inside `src/components/AdSlot.tsx`.
   - **Popunder** or **Social Bar**: Paste the script directly before `</body>` in `index.html`.
4. If Adsterra provides an `ads.txt` line, add it to `public/ads.txt`.

---

## 4. Setting up PropellerAds

PropellerAds also approves utilities and calculators rapidly without strict minimum traffic requirements.

1. Register at [PropellerAds](https://propellerads.com/).
2. Add and verify your domain (via meta tag or HTML verification file in `public/`).
3. Create ad zones:
   - **In-Page Push (Banner)**
   - **Multitag**
   - **Interstitials**
4. Paste the tag in `index.html` or inside the target slots.
5. Add any required PropellerAds `ads.txt` records to `public/ads.txt`.

---

## 5. Verification Checklist

- [x] `public/robots.txt` created with valid sitemap directive.
- [x] `public/sitemap.xml` listing all pages and 6 blog articles.
- [x] `public/ads.txt` ready for Publisher IDs.
- [x] Meta description, title, Open Graph, and Twitter cards updated.
- [x] GDPR / Cookie Consent Banner installed.
- [x] Comprehensive Privacy Policy and Terms of Service active.
- [x] Production build passes cleanly (`npm run build`).
