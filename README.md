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

## Open items

- [ ] Practice confirms EHR / practice-management system.
- [ ] Practice gathers vendor pricing and picks a HIPAA form platform (+ BAA).
- [ ] Confirm which sections need patient initials vs. full signature.
- [ ] Confirm fee schedule is current before publishing.
- [x] Identify the current site's CMS/host — WordPress + Elementor; brand tokens captured.
- [ ] Determine the deployment path into the WordPress/Elementor site (embed block,
      custom page template, or subdomain).

## Status

- 2026-08-30: Repo created (`main`). Scope, decisions, form inventory, and existing-site
  design reference captured. No implementation yet.
