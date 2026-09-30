# The Victorias Hotel and Aquatic Center — website

A single-page marketing site for **The Victorias Hotel and Aquatic Center**,
Osmeña Avenue (National Highway), beside Victorias City Coliseum, Victorias City,
Negros Occidental, Philippines.

**Facebook:** <https://www.facebook.com/profile.php?id=61560476636504>

## Running it

```bash
npm start          # static server on http://localhost:4173
npm run screenshots # capture shots/ at desktop, tablet and mobile (separate terminal)
npm test            # 17-check layout/behaviour assertion suite
npm run test:server # confirm the static server survives hostile requests
```

There is no build step — `index.html`, `assets/css/styles.css` and `assets/js/main.js`
are the whole site. It can be deployed as-is to any static host (Netlify, GitHub Pages,
Cloudflare Pages) or dropped into a shared host's `public_html`.

## What's on the page

| Section | Contents |
| --- | --- |
| Hero | Illustrated dusk scene, phone CTA, quick facts |
| Welcome | Where the hotel sits, opened March 12, 2023 |
| Rooms & Suites | Four room types with published nightly rates |
| Aquatic Center | Kiddie, regular (with slide) and Olympic-size pools, day-use fees |
| Facilities | Six practical amenities |
| Events | Cottages, shed houses and pavilions for hire |
| Around Victorias | St. Joseph the Worker Chapel, Gawahon, City Coliseum & City Mall |
| Gallery | Six illustrated frames, sized for real photographs |
| Visit | Address, contacts, travel times, enquiry form |

## Content sources

Details were gathered from the Facebook page, a write-up on *Touristang Pobre*
(25 Sep 2024) and the Visayan Daily Star (14 Mar 2023):

- **Rooms:** Double/Twin ₱1,600 · Triple De Luxe ₱2,000 · Family Suite ₱3,000 · Executive Suite ₱3,000 per night
- **Pool day use:** Adults ₱80 · Children below 7 ₱50
- **Check-in / out:** 2:00 PM / 11:00 AM
- **Contacts:** +63 928 484 2116 · Tel. 399-3208

Rates and fees are marked on the page as indicative — confirm them before publishing.

## Images

All artwork is hand-drawn inline SVG (no third-party photography, no external image
requests), so nothing is hot-linked and nothing breaks if a source disappears. Each
illustration sits in a fixed-ratio frame, so real photographs can be swapped in later
without the layout moving.

## Enquiry form

The form validates on the page and opens Facebook Messenger
(`m.me/61560476636504`) with the details pre-filled. Nothing is sent anywhere else and
no data is stored.

## Browser support

Evergreen Chrome, Edge, Firefox and Safari. Respects `prefers-reduced-motion`, has a
skip link, visible focus states and labelled controls.
