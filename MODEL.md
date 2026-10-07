# Mobile POV & APK Transformation Architecture (MODEL.md)

This document serves as the implementation blueprint for configuring the TD Payment Portal & Profile Showcase as an **actual, professional production mobile application UI** (deployable as WebAPK / PWA / Capacitor native APK) while preserving 100% of the internal UI interface.

---

## 1. Core Architecture Principles

1. **Actual Production App UI (Not a Toy Mock-Up):**
   - No skeuomorphic hardware gimmicks: **No simulated notches, no fake dynamic islands, no fake hardware camera holes, and no fake notification panels**. Real devices already provide their own physical display cutouts and native OS notification shade.
   - Clean, professional application viewports:
     - **Mobile POV / Installed APK (`<= 768px` or PWA/Capacitor Standalone):** True edge-to-edge native fullscreen ($100\text{vw} \times 100\text{dvh}$), zero fake outer margins, natural safe-area insets (`env(safe-area-inset-top)` / `bottom`).
     - **Desktop Preview (`> 768px`):** Clean, professional centered mobile viewport ($390 \times 844\,\text{px}$ at modern mobile $9:19.5$ aspect ratio), free of cartoonish plastic bezels or synthetic overlays.
2. **Zero Internal UI Mutation:**
   - 100% fidelity to the existing TD application interface: identical green logo box ($92 \times 92\,\text{px}$), input typography, form underlines, vector icons, buttons, and profile screen cards.
3. **Native APK Functional Parity:**
   - Installable directly as a native Android WebAPK (Chrome) or packageable into a signed `.apk` via Capacitor.
   - Dynamic local device clock synchronization.
   - Tactile native haptic feedback (`navigator.vibrate`).
   - Android hardware back button and swipe-gesture routing via HTML5 History API.
   - Virtual keyboard ergonomics (no squished forms or clipped inputs).

---

## 2. Modular Implementation Blueprint

```
+--------------------------------------------------------------------------+
|                        Application Shell & Viewport                       |
|                                                                          |
|  +------------------------- Desktop View (> 768px) --------------------+ |
|  | Clean Presentation Canvas                                            | |
|  | +----------------------- 9:19.5 App Viewport ---------------------+ | |
|  | | [Actual App Screen - Native Mobile Dimensions]                   | | |
|  | |                                                                  | | |
|  | |   • TD Navigation Header (Native App Top)                        | | |
|  | |   • TD Brand Identity & Login Form                               | | |
|  | |   • Interactive Profile Dashboard                                | | |
|  | +-----------------------------------------------------------------+ | |
|  +---------------------------------------------------------------------+ |
|                                                                          |
|  +---------------- Mobile / Native APK POV (<= 768px) -----------------+ |
|  | [Actual App Screen: 100vw x 100dvh Edge-to-Edge]                   | |
|  | Native Safe-Area-Inset Top (OS System Bar Alignment)                | |
|  | Real App Interface - Zero Fake Margins or Simulated Overlays        | |
|  | Native Safe-Area-Inset Bottom (OS Gesture Navigation Area)          | |
|  +---------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

---

### Module 1: Viewport & Layout Architecture Module
* **Target File:** `src/style.css`
* **Objective:** Establish professional, production-grade responsive container architecture for the real app UI without fake skeuomorphic hardware or synthetic notification overlays.

#### 1.1 Clean Desktop Viewport Container
- Standardize the desktop container to an authentic, minimal mobile app viewport ($390 \times 844\,\text{px}$, aspect-ratio $9 / 19.5$) with sleek, professional containment:
  ```css
  /* Clean, professional desktop app container */
  .phone-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .phone-frame {
    width: 390px;
    height: 844px;
    max-height: 94vh;
    aspect-ratio: 9 / 19.5;
    background-color: var(--td-dark-green);
    border-radius: 36px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  ```
- **Professional Standard:** No fake camera holes, no fake dynamic island cutouts, and no fake home bars. The viewport displays purely the **actual application interface**.

#### 1.2 Mobile POV & Installed APK Fullscreen (`<= 768px` & Standalone Mode)
- In mobile viewports or when installed on Android:
  ```css
  @media (max-width: 768px), (display-mode: standalone) {
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #031c10; /* Seamless deep green matching TD app base */
    }

    .page-container {
      padding: 0;
      margin: 0;
      width: 100vw;
      height: 100dvh;
      min-height: 100dvh;
    }

    .app-header {
      display: none !important; /* Remove desktop marketing tagline */
    }

    .phone-wrapper {
      zoom: 1 !important;
      transform: none !important;
      width: 100vw;
      height: 100dvh;
    }

    .phone-frame {
      width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
      box-shadow: none;
      border: none;
      aspect-ratio: auto;
    }

    .screen {
      width: 100vw;
      height: 100dvh;
      min-height: 100dvh;
    }

    /* Natural system safe-area alignment - no fake margins */
    .td-status-bar {
      padding-top: max(12px, env(safe-area-inset-top));
      padding-left: max(20px, env(safe-area-inset-left));
      padding-right: max(20px, env(safe-area-inset-right));
    }

    #view-login {
      padding-bottom: max(24px, env(safe-area-inset-bottom));
      min-height: 100dvh;
    }
  }
  ```

    .screen {
      width: 100vw;
      height: 100dvh;
      min-height: 100dvh;
    }

    .td-status-bar {
      padding-top: max(12px, env(safe-area-inset-top));
      padding-left: max(20px, env(safe-area-inset-left));
      padding-right: max(20px, env(safe-area-inset-right));
    }

    #view-login {
      padding-bottom: max(24px, env(safe-area-inset-bottom));
      min-height: 100dvh;
    }
  }
  ```

---

### Module 2: WebAPK & PWA Packaging Module
* **Target Files:**
  * `public/manifest.webmanifest`
  * `public/sw.js`
  * `index.html`
* **Objective:** Enable one-click installation on Android devices as a native WebAPK with full standalone execution.

#### 2.1 Web App Manifest (`public/manifest.webmanifest`)
```json
{
  "name": "TD Payment Portal",
  "short_name": "TD Portal",
  "start_url": "/",
  "id": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#062b19",
  "background_color": "#031c10",
  "description": "Secure login to accept card and cash payments with Administrative Role access.",
  "icons": [
    {
      "src": "/assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 2.2 Offline Service Worker (`public/sw.js`)
```javascript
const CACHE_NAME = 'td-portal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/main.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
```

#### 2.3 HTML Head Configuration (`index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" content="#062b19">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.webmanifest">
```

---

### Module 3: Native OS System & Safe-Area Integration Module
* **Target Files:** `src/style.css`, `index.html`
* **Objective:** Ensure the real app interface integrates seamlessly with the actual mobile device OS status bar.
* **Standard:**
  - Real Android and iOS devices already render their own native status bars (time, battery, Wi-Fi, cellular).
  - No synthetic HTML clocks or battery percentages are injected.
  - The top app bar (`.td-header`) and profile header (`.top-bar`) automatically align beneath the device's physical status bar using `env(safe-area-inset-top)`.
  - Color synchronization: The OS status bar background matches the TD brand palette (`#062b19`) via `<meta name="theme-color">`.

---

### Module 4: Native APK Touch & Navigation Module
* **Target Files:** `src/main.js`, `src/style.css`
* **Objective:** Implement physical haptics, swipe/hardware back-button handling, and responsive virtual keyboard support.

#### 4.1 Native Haptics (Vibration API)
```javascript
function triggerHaptic(type = 'light') {
  if (!('vibrate' in navigator)) return;
  switch (type) {
    case 'light':
      navigator.vibrate(12);
      break;
    case 'success':
      navigator.vibrate([15, 40, 25]);
      break;
    case 'error':
      navigator.vibrate([30, 60, 30, 60, 30]);
      break;
  }
}
```

#### 4.2 Android Hardware Back Button (History Routing)
```javascript
function initHistoryRouting() {
  window.history.replaceState({ screen: 'login' }, '');

  window.addEventListener('popstate', (e) => {
    const screen = e.state?.screen || 'login';
    switchScreen(screen, false); // Switch without pushing duplicate history
  });
}
```

#### 4.3 Virtual Keyboard & Scroll Stabilization
```css
/* Touch and selection ergonomics */
* {
  -webkit-tap-highlight-color: transparent;
}

button, input, a {
  touch-action: manipulation;
}

.td-form {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

---

### Module 5: Quality Assurance & Verification Matrix

| Test Case | Scenario / Device Profile | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **TC-01** | Desktop (`1440x900`) | Clean centered 9:19.5 app viewport container, presentation canvas, tagline visible. | Visual matches reference with clean calibrated ratio. |
| **TC-02** | Mobile Viewport (`390x844` / `412x915`) | Outer bezels, brown background, and tagline disappear; TD app screen spans 100% viewport. | No "phone inside phone" effect. |
| **TC-03** | Internal UI Fidelity | Green TD logo, white input underlines, vector mail/lock icons, font sizes, colors. | 100% pixel identical to current UI. |
| **TC-04** | Status Bar Authenticity | Open app on any mobile device. | Real phone OS status bar handles time/battery; zero fake HTML mockup bars. |
| **TC-05** | Android Installation (WebAPK) | Open in Chrome on Android and tap "Add to Home Screen". | Installs as standalone WebAPK in app drawer, launches full screen. |
| **TC-06** | Hardware Back Button | Login to Profile, press device back button. | Returns smoothly to TD login screen without closing app. |
| **TC-07** | Keyboard Soft Focus | Focus Email or Password input on mobile. | Form inputs remain visible above keyboard without layout distortion. |

---

### Module 1.2: Dynamic Executive Background Architecture
* **Target Files:** `src/style.css`, `src/main.js`, `index.html`
* **Objective:** Replace flat muddy backgrounds with an executive-tier, multi-layered dynamic coffee ambience that matches the internal profile screen:
  1. **Layer 0 (Base & CSS Mesh):** Deep luxury obsidian-espresso palette (`#0e0604`) with an animated GPU-accelerated crema mesh gradient (`dynamicCremaPulse`) that slowly breathes with shifting warm caramel and espresso focal points.
  2. **Layer 1 (60fps Real-Time Crema Particle Engine):** HTML5 canvas rendering floating rising golden crema embers/steam motes and 4 drifting warm amber-gold light blooms, with pointer/touch interactive warmth.
  3. **Layer 2 (Steaming Espresso Media):** Autoplaying, seamlessly looping high-contrast coffee brewing video blended with `mix-blend-mode: screen; opacity: 0.36`.
  4. **Layer 3 (Executive Frosted Glass & TD Green Contrast):** Razor-sharp frosted glass pods (`rgba(255, 255, 255, 0.05)` with `16px` backdrop blur) and vibrant TD Emerald green branding (`#00c000` to `#008800`) with glass highlight rims.

### Module 1.3: Thematic Identity & Clean Login Layout
* **Target Files:** `index.html`, `src/style.css`
* **Objective:** Replace generic bank branding with an authentic specialty coffee identity while maintaining a focused, clean login experience:
  1. **Artisan Roastery Crest SVG:** A steaming porcelain espresso cup vector with golden crema surface, warm espresso gradients, and delicate rising steam curls animated via `@keyframes steamDrift`. Encased in an $80 \times 80\,\text{px}$ liquid glass medallion (`.cafe-brand-crest`) with amber crema glow.
  2. **Portal Title:** "Artisan Roastery" / "Administrative & Barista Portal".
  3. **Streamlined 2-Field Authentication:** Form strictly focuses on the essential credentials (`EMAIL*` and `PASSWORD*`) with custom frosted glass inputs, floating focus rings, and Remember Email toggle.

---

## 3. Execution Roadmap

1. **Step 1 (Module 1 - COMPLETED):** Applied in `src/style.css` (desktop frame calibration + mobile 100dvh media query, zero fake notches or bezels).
2. **Step 2 (Module 2 - COMPLETED):** Generated PWA assets and applied WebAPK infrastructure (`public/manifest.webmanifest`, `public/sw.js`, `public/assets/icons/icon.svg`, and PWA meta tags in `index.html` + Service Worker registration in `src/main.js`).
3. **Step 3 (Module 3 & 4 - Next):** Implement Module 3 & Module 4 in `src/main.js` (live clock, battery API, native haptics, History API back-button routing).
4. **Step 4 (Module 5):** Execute Module 5 QA matrix across responsive breakpoints.
