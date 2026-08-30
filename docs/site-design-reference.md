# Site design reference — carolinawellnesspsychiatry.com

Extracted 2026-08-30 from the live site's HTML/CSS. The standalone New Patient Forms
page should visually match this.

## Platform

- **WordPress** + **Elementor / Elementor Pro** (v4.2.x), **Hello Elementor** theme (v3.5.1).
- Assets served from a PCDN CDN (`s48650.pcdn.co`); site managed under a
  "360cloud.app" / "o360 Air Framework" healthcare site program.
- Contact form on the site is an Elementor Pro form widget.

## Brand colors (Elementor global palette)

| Role | Hex | Notes |
| --- | --- | --- |
| Primary | `#6F8993` | muted slate blue-green — headings/links/buttons |
| Secondary | `#B6BCAA` | sage gray |
| Accent | `#97AC5C` | olive / sage green — CTA accents |
| Text | `#46493E` | dark warm olive-gray — body copy |
| Light background | `#FCFEFF` | near-white, faint cool tint |
| White | `#FFFFFF` | |
| Extra | `#AAB68A` | light olive |
| Extra | `#6F899300` | primary at 0% alpha (transparent) |

## Typography

| Use | Family | Size / weight | Line height |
| --- | --- | --- | --- |
| Headings | **"Typhone"** (custom serif; needs a serif fallback stack — e.g. `Georgia, 'Times New Roman', serif`) | h1 ~3–4rem / 300; h2 ~2.7–3rem / 300; smaller heads 2.3–2.5rem | 3.2–4.4rem |
| Eyebrow / label | (inherits) | 0.9rem, `letter-spacing: 2.8px`, `text-transform: uppercase` | 1.4rem |
| Body | **"Lato"** (Google Font) | 17px / 400 | 1.7em |

Font files: "Typhone" is loaded from the site as `Typhone-1.ttf` (self-hosted, not
publicly downloadable via the CDN path tried on 2026-08-30). "Lato" is available
from Google Fonts.

## Navigation (primary menu)

About Us · Services · Blog · Testimonials · Patient Info · Fees and Insurance ·
New Patient Forms · Useful Links · Contact Us

(The New Patient Forms page sits under "Patient Info".)

## Practice info

- Carolina Wellness Psychiatry, PLLC
- 400 Meadowmont Village Circle, Suite 428, Chapel Hill, NC 27517
- Phone 919-446-3232 · (secondary/fax 919-869-2828)
- Providers referenced in the intake packet: Elizabeth S. Bullard, MD;
  Allison Foroobar, MD; Ayumi Nakamura, MD, PhD; Sarah E. Gilbert, PhD;
  Sarah Tatko, PA; M. Caroline Hale, LCSW.

## Raw CSS

Elementor page CSS captured to the session scratchpad on 2026-08-30
(`post-7.css`, `post-19.css`, `post-42.css`, `post-140.css`). Re-fetch from
`https://s48650.pcdn.co/wp-content/uploads/sites/15/elementor/css/post-<id>.css`
if needed — not committed here to keep the repo clean.
