# carolinawellnesspsychiatry

Redesign of a single page on **carolinawellnesspsychiatry.com** (Carolina Wellness
Psychiatry, PLLC).

## Goal

Redesign the **New Patient Forms** page:
https://carolinawellnesspsychiatry.com/contents/new-patient-forms/

### Current state

The page only lets prospective patients **download** a PDF packet, **print** it,
**fill it out on paper**, **scan** it, and **upload** the completed scan.

### Target state

A **standalone web page** hosting **interactive intake forms** that prospective
patients fill in and submit **online** — no printing, no scanning, no paper.
Legally-binding **e-signatures** required on the consent/policy sections.

## Decisions (as of 2026-08-30)

| Topic | Decision |
| --- | --- |
| Data handling | **HIPAA-compliant form platform with a signed BAA.** Vendor not yet chosen — the practice must get pricing before committing (candidates: Jotform HIPAA, Formstack, Foxit/DocuSign, Clearwave, etc.). |
| EHR / practice-management system | Unknown — to be confirmed with the practice. May offer built-in digital intake worth using instead. |
| Scope | **One form, one page.** Not a broader site redesign. |
| Delivery | **Standalone page** (styled to match the existing site), with the platform's form embedded. |
| File uploads (insurance card / ID photos) | Not now. Possibly later. |
| E-signatures | Required. |
| Payment card capture | Section 3 collects a credit card (number, exp, CVV, zip). This is **PCI-DSS** scope — the chosen platform must tokenize via a payment processor, not store raw card data. |
| Source content | Google Doc: "Carolina Wellness Psychiatry, PLLC – Intake Forms (2025)" — https://docs.google.com/document/d/1zzHJfoa4YoyWLhUL_yioyv8s1KHVJ6i2ga-v_uugfy8/mobilebasic |
| Existing site | WordPress + Elementor (Hello Elementor theme). Design tokens captured in [`docs/site-design-reference.md`](docs/site-design-reference.md) — new page must match. |

## Intake packet contents (from the 2025 Google Doc)

1. **Intake Form** — patient demographics; financial responsibility; employment/education;
   parent/spouse info; emergency contact; referral source.
2. **Medical History** — primary care info; past diagnoses; current medications (x10);
   allergies; illness/therapy/hospitalization history; stressors checklist;
   presenting problem.
3. **Financial Policy, Appointment Policy & Good Faith Estimate** — 5 initialed
   statements (Medicare/Medicaid status, out-of-network policy, fee schedule,
   card-on-file charge authorization, missed-appointment policy) + 15-minute-increment
   billing statement + **credit card on file** + signature block.
4. **Notice of Privacy Practices (HIPAA)** — informational.
5. **Patient Acknowledgement** — signature + date.
6. **Release of Information** — consent statement; information-category checkboxes;
   recipients; revocation and rescind-consent sections; signature/witness/date.

Full field-level detail lives in the Google Doc above.

## Prototype

A working, vendor-independent prototype of the online packet lives at the repo root:

| File | Purpose |
| --- | --- |
| `index.html` | The standalone New Patient Forms page — 6-step wizard covering all packet sections |
| `assets/styles.css` | Brand-matched styling (colors, type, layout from `docs/site-design-reference.md`) |
| `assets/app.js` | Wizard navigation, validation, draft autosave, signature pads, review & submit |

**It is client-side only** — nothing is transmitted or stored on a server. It exists to:

- show the practice the end-state patient experience;
- serve as the **build spec** handed to whichever HIPAA form platform is chosen;
- surface field-level and signature/initialing requirements early.

### What it does

- Multi-step flow: Welcome → Patient Info → Medical History → Financial & Appointment
  Policy (with the 5 initialed statements + fee schedule + card-on-file) → Privacy
  Practices & Acknowledgement → Release of Information (optional) → Review & Submit.
- Inline validation; jump between completed sections via the side rail.
- **Draft autosave** to `localStorage`, with a restore prompt on return. Sensitive
  fields (`[data-nosave]`: SSN, card number/CVV, signatures, attestations) are
  deliberately excluded from the saved draft.
- **E-signature** capture: draw pad *or* typed legal name, plus an intent-to-sign
  checkbox on the binding sections.
- Review screen with per-section Edit links and signature thumbnails.
- Submit shows a confirmation with a reference number and a Print / Save-as-PDF option
  (print stylesheet expands every section).

### Preview it locally

```
cd carolinawellnesspsychiatry
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

### Known deltas from the live version (by design)

- The credit-card fields are plain inputs marked *not stored*. In production this
  block is replaced by the form platform's PCI-compliant tokenized payment field.
- No backend, no file uploads, no real e-signature audit trail — those come from
  the chosen platform.
- "Typhone" heading font (site's custom face) is substituted with `Lora` from
  Google Fonts as a visual stand-in.

### Smoke tests

`smoke.js` / `smoke2.js` (jsdom) exercised the full happy path plus negative cases
(blocked navigation, required-field errors, toggles, the optional ROI branch,
review rendering, submit, draft clearing) — all passing on 2026-08-30. They live in
the session scratchpad, not the repo.

## Open items

- [ ] Practice confirms EHR / practice-management system.
- [ ] Practice gathers vendor pricing and picks a HIPAA form platform (+ BAA).
- [ ] Confirm which sections need patient initials vs. full signature (prototype's
      current split needs practice sign-off).
- [ ] Practice reviews the prototype and confirms field list / wording.
- [ ] Confirm fee schedule is current before publishing.
- [x] Identify the current site's CMS/host — WordPress + Elementor; brand tokens captured.
- [ ] Determine the deployment path into the WordPress/Elementor site (embed block,
      custom page template, or subdomain).

## Status

- 2026-08-30: Repo created (`main`). Scope, decisions, form inventory, and existing-site
  design reference captured. Vendor-independent clickable prototype of the full packet
  built (`index.html` + `assets/`) and smoke-tested.
