# 🚀 Free Deployment Guide: Artisan Roastery PWA

This guide provides step-by-step instructions to deploy this web application **100% for free** with **automatic HTTPS / SSL** (mandatory for mobile PWA home screen installation and Service Workers).

---

## 📋 Quick Platform Comparison

| Platform | Best For | Deploy Time | Custom Domain | Requires Git? |
| :--- | :--- | :--- | :--- | :--- |
| **[Vercel](#option-1-vercel-recommended)** | Fastest 1-command deployment & GitHub CI/CD | ~60 seconds | Yes (Free) | No (CLI) or Yes |
| **[Netlify](#option-2-netlify-drag--drop)** | No-code Drag & Drop of build folder | ~30 seconds | Yes (Free) | No |
| **[Cloudflare Pages](#option-3-cloudflare-pages)** | Unlimited bandwidth & ultra-fast CDN | ~90 seconds | Yes (Free) | Yes / Direct |
| **[GitHub Pages](#option-4-github-pages)** | Hosting directly from your GitHub repo | ~2 minutes | Yes (Free) | Yes |

---

## 🛠️ Step 0: Test Local Build (Universal Step)

Before deploying, make sure your production bundle builds cleanly:

1. Open PowerShell / Terminal in your project directory:
   ```powershell
   cd e:\clone\app\app
   ```
2. Run the build command:
   ```bash
   npm run build
   ```
3. A `dist/` directory will be generated containing all compiled, optimized assets ready for production.

---

## Option 1: Vercel (Recommended)

Vercel provides automatic HTTPS, edge CDN, zero-config Vite support, and instant live updates.

### Method A: Deploy in 1 Minute via Terminal (No GitHub Needed)
1. Open terminal in the project folder:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts:
   - **Log in** with GitHub, GitLab, or Email.
   - **Set up and deploy?** Press `y` (Yes).
   - **Which scope?** Select your account.
   - **Link to existing project?** Press `n` (No).
   - **Project name?** Press `Enter` (default: `coffee-profile-screen`).
   - **In which directory is your code located?** Press `Enter` (`./`).
   - **Want to modify settings?** Press `n` (Vercel automatically detects Vite).
3. In ~20 seconds, your live production HTTPS URL will be printed (e.g., `https://artisan-roastery.vercel.app`).

### Method B: Deploy via GitHub (Continuous Deployment)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import your GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **"Deploy"**. Every time you push to GitHub, Vercel will automatically re-deploy your app with live updates.

---

## Option 2: Netlify (Drag & Drop — Zero CLI)

If you don't want to use Git or terminal commands:

1. Build the production folder locally:
   ```bash
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
3. Sign up or log in for free.
4. Drag and drop the `dist` folder directly onto the browser window.
5. Netlify will instantly launch your live HTTPS site (e.g., `https://creative-roastery-xxxxxx.netlify.app`).
6. *(Optional)* Go to **Site Configuration** $\rightarrow$ **Change site name** to pick your own custom free subdomain (e.g., `https://artisan-roastery.netlify.app`).

---

## Option 3: Cloudflare Pages

Cloudflare offers 100% free hosting with unlimited bandwidth and fast global edge servers.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and navigate to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages**.
2. **Connect to Git** and choose your repository.
3. In **Build Settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **"Save and Deploy"**.

---

## Option 4: GitHub Pages

To host directly on GitHub:

1. Add a deploy script to `package.json`:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Update `vite.config.js` with your base repository name if hosting under `username.github.io/reponame`:
   ```javascript
   // In vite.config.js
   export default defineConfig({
     base: './', // relative path for universal compatibility
     // ...
   });
   ```
3. Add deployment scripts in `package.json`:
   ```json
   "scripts": {
     "dev": "vite --host",
     "build": "vite build",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run:
   ```bash
   npm run deploy
   ```
5. Go to your GitHub Repo $\rightarrow$ **Settings** $\rightarrow$ **Pages**, and set the branch to `gh-pages`.

---

## 📱 Verification Checklist After Deployment

Once your live HTTPS link is running, test these features on your phone:

- [ ] **HTTPS Padlock:** Verify the browser displays a secure connection lock (required for Service Worker).
- [ ] **1-Tap Direct Install:**
  - On **Android (Chrome)**: Tap the top-right install capsule button. Chrome should trigger the native **WebAPK installation prompt**, adding the custom coffee icon directly to your home screen and app drawer.
  - On **iOS (Safari)**: Tap the Share button $\rightarrow$ "Add to Home Screen".
- [ ] **Native Standalone Mode:** Launch from your home screen icon. It will open edge-to-edge without browser address bars.
- [ ] **Smooth Keyboard Typing:** Tap the email and password fields. Confirm the background video remains completely stable with zero flickering or jumping.
- [ ] **Over-The-Air (OTA) Updates:** Make a change, re-deploy, and open the app. The Service Worker will automatically update in the background.

---

## 🔑 Free Authentication Options

### 1. Built-in Free Guest / Demo Access (Active Out of the Box)
The app now includes a 1-tap **"Continue as Guest"** capsule button right below the Sign In button.
- Anyone visiting the site can tap it to immediately explore the full administrative coffee dashboard without registering or typing credentials.
- Activates a dedicated **Guest Barista** trial profile.

### 2. Free Cloud Authentication (For Real User Accounts)
If you want real multi-user cloud login with passwords, Google Sign-In, and user database storage, both of these providers are **100% free forever**:

| Provider | Free Tier Allowance | Supported Features |
| :--- | :--- | :--- |
| **[Supabase Auth](https://supabase.com)** | **50,000 monthly active users (Free)** | Email + Password, Google/Apple OAuth, Magic Links, PostgreSQL Database |
| **[Firebase Auth](https://firebase.google.com)** | **50,000 monthly active users (Free)** | Email + Password, Phone SMS, Google OAuth, Firestore Database |

#### How to Connect Supabase (Takes ~2 minutes):
1. Create a free account at [supabase.com](https://supabase.com) and create a project.
2. In your Supabase Dashboard $\rightarrow$ **Authentication** $\rightarrow$ **Providers**, enable **Email**.
3. Install the client in your project:
   ```bash
   npm install @supabase/supabase-js
   ```
4. Initialize with your free Supabase URL & Anon Key in `src/main.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   const supabase = createClient('https://your-project.supabase.co', 'your-anon-key');

   // Sign in
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'barista@cafe.com',
     password: 'secure-password'
   });
   ```
