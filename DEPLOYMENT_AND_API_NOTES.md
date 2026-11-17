# FrostTech — Deployment, Domain & API Security Reference Guide

This document summarizes the reference information for login security, regional Google Maps configuration (Region 10), domain pricing, and production deployment checklists.

---

## 1. Free APIs & Solutions for Login Security

| Tool / Service | Cost | Function | Why It's Recommended |
| :--- | :--- | :--- | :--- |
| **Google OAuth + NextAuth** *(Built-in)* | **100% Free** | Direct social login via Google accounts | Zero passwords to store/hash; Google handles 2FA, session security, and account verification. |
| **Cloudflare Turnstile** | **100% Free** (Unlimited) | Smart bot & brute-force shield | Invisible check against credential stuffing and brute-force bot attacks without annoying CAPTCHA puzzle images. |
| **Email OTP via Gmail SMTP** *(Built-in)* | **100% Free** | 6-digit email verification codes | Uses your configured Gmail SMTP to verify customer identity during signup/checkout. |
| **Upstash Redis Rate Limiter** | **Free Tier** (10k requests/day) | IP / endpoint rate limiting | Prevents attackers from spamming login or SMS endpoints repeatedly. |

---

## 2. Restricting Google Maps Strictly to Region 10 (Northern Mindanao)

### Coverage Area:
* **Cagayan de Oro City (CDO)**
* **Misamis Oriental**
* **Bukidnon**
* **Misamis Occidental**
* **Lanao del Norte**
* **Camiguin Island**

### Google Cloud Pricing / Free Tier:
* Google Cloud provides a **$200 USD free recurring credit every month**.
* This covers approximately **28,500 dynamic map loads** or **~70,000 autocomplete requests** per month at zero cost.

### Code Implementation (`components/AddressAutocomplete.tsx`):
Use `LatLngBounds` combined with `strictBounds: true` to prevent the autocomplete from showing suggestions outside Region 10:

```typescript
// Bounding box coordinates for Region 10 (Northern Mindanao)
const REGION_10_BOUNDS = {
  north: 9.30,   // Camiguin / North Misamis Oriental
  south: 7.55,   // Southern Bukidnon boundary
  east: 125.30,  // Eastern boundary
  west: 123.50,  // Misamis Occidental boundary
};

const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
  componentRestrictions: { country: 'ph' }, // Restrict search to Philippines
  bounds: new google.maps.LatLngBounds(
    { lat: REGION_10_BOUNDS.south, lng: REGION_10_BOUNDS.west },
    { lat: REGION_10_BOUNDS.north, lng: REGION_10_BOUNDS.east }
  ),
  strictBounds: true, // ⚠️ Rejects any suggestions outside Region 10 boundaries
});
```

*(Note: If you ever want a 100% open-source alternative that does not require any credit card for setup, **Leaflet.js + OpenStreetMap with Nominatim** is completely free).*

---

## 3. Domain Pricing & Deployment Guide

| Option | Example Address | Estimated Price | Best Use Case |
| :--- | :--- | :--- | :--- |
| **Free Vercel Subdomain** *(Current)* | `frost-tech-sigma.vercel.app` | **₱0.00 / Free Forever** | School defense, capstone review, client prototyping. Includes free automatic HTTPS. |
| **.com Domain** | `frosttechcooling.com` | **₱550 – ₱750 / year** ($10 – $13) | Recommended for professional brand launch. Buy via [Porkbun.com](https://porkbun.com) or [Namecheap.com](https://namecheap.com). |
| **Promo Tech Domain** | `frosttech.online` / `.site` / `.tech` | **₱100 – ₱250 for 1st yr** ($2 – $5) | Budget-friendly custom domain for school presentations. |
| **.ph / .com.ph Domain** | `frosttech.ph` / `frosttech.com.ph` | **₱1,800 – ₱2,000 / year** ($35) | Official Philippine registry (DotPH). |

### Connecting a Custom Domain to Vercel:
1. Buy your domain on **Porkbun** or **Namecheap**.
2. Go to **Vercel &rarr; frost-tech &rarr; Settings &rarr; Domains**.
3. Type your custom domain (e.g. `frosttechcooling.com`).
4. Vercel will give you two DNS records (e.g. `A` record pointing to `76.76.21.21` and `CNAME` pointing to `cname.vercel-dns.com`).
5. Paste those records into your domain registrar's DNS settings. Vercel handles the rest and generates free SSL certificates automatically.

---

## 4. Current Service Configuration Checklist

### Gmail SMTP (Notifications & Invoices):
* **Status:** Configured & Verified (`200 OK`).
* **Credentials:** In `.env.local` and Vercel Environment Variables:
  * `GMAIL_USER`: Your Gmail address.
  * `GMAIL_APP_PASSWORD`: 16-character Google App Password (from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).

### Google OAuth Whitelist (`Error 400: origin_mismatch` Fix):
* In [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials):
  * **Authorized JavaScript origins:** `https://frost-tech-sigma.vercel.app`
  * **Authorized redirect URIs:**
    * `https://frost-tech-sigma.vercel.app/api/auth/callback/google`
    * `https://frost-tech-sigma.vercel.app`
