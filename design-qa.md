# Design QA — مؤسسة إحياء

## Comparison targets

- Public source: `C:\Users\amohm\.codex\generated_images\019ff137-aa87-7bf0-b2b7-0c233b1dbf8a\exec-3751230a-6878-4a18-b62c-468e81f9ce0b.png`
- Login source: `C:\Users\amohm\.codex\generated_images\019ff137-aa87-7bf0-b2b7-0c233b1dbf8a\exec-196ff367-c077-46a4-86bd-433abf840632.png`
- Teacher source: `C:\Users\amohm\.codex\generated_images\019ff137-aa87-7bf0-b2b7-0c233b1dbf8a\exec-1e259655-dc96-4299-95f2-cb1b0a070248.png`
- Admin source: `C:\Users\amohm\.codex\generated_images\019ff137-aa87-7bf0-b2b7-0c233b1dbf8a\exec-ea52ffe4-7ca4-4d11-b36b-16fc5febebb4.png`
- Browser implementation captures: `qa-home.png`, `qa-login.png`, `qa-teacher.png`, `qa-admin.png`
- Combined evidence: `qa-home-comparison.png`, `qa-login-comparison.png`, `qa-teacher-comparison.png`, `qa-admin-comparison.png`
- Mobile evidence: `implementation-home-mobile.png`, `implementation-login-mobile.png`, `implementation-admin-mobile.png`, `implementation-teacher-attendance-mobile.png`

## Viewports and normalization

- Public, login, and teacher source pixels: 1487 × 1058. Browser CSS viewport: 1487 × 1058, device scale 1; implementation captures normalized to source size.
- Admin source pixels: 1672 × 941. Browser CSS viewport: 1672 × 941, device scale 1; implementation capture normalized to source size.
- Mobile check: 390 × 844 CSS pixels. All routes had no horizontal page overflow (`scrollWidth` 375 excluding the 15px browser scrollbar).
- State: public first view, empty login form, teacher partial attendance, and default admin daily overview.

## Fidelity review

- Fonts and typography: Noto Sans Arabic provides the UI hierarchy and Amiri provides editorial/quotation emphasis. Weights, wrapping, and RTL alignment match the selected directions.
- Spacing and layout rhythm: desktop proportions preserve the source hierarchy; mobile collapses to single-column content and persistent bottom admin navigation without covering primary controls.
- Colors and visual tokens: petrol blue, restrained gold, warm ivory, and semantic attendance colors are consistent across routes.
- Image quality and assets: the supplied official logo is used everywhere with `object-fit: contain`; no logo is reconstructed in CSS or SVG.
- Copy and content: institutional headline, teacher quotation, attendance states, daily priorities, day flow, transfer, and student distribution match the approved Arabic content.
- Focused regions reviewed: public hero and logo lockup; login form and brand panel; teacher status controls and sticky completion bar; admin priorities, timeline, circle rows, and mobile bottom navigation.

## Interaction and accessibility checks

- Public CTA navigates to login.
- Teacher/admin role selection works; valid mock credentials route to the correct workspace.
- Teacher bulk-present, per-student exception, automatic save state, completion guard, and summary modal work.
- Admin transfer review, student distribution, pending-count update, circle review, sidebar/bottom navigation, and success feedback work.
- Keyboard-visible focus styling, labels, roles, pressed states, and reduced-motion behavior are present.
- Browser console errors checked: none.

## Comparison history

1. Initial review found the supplied raster logo field too visible on light surfaces and the older brand label. The light logo treatment was corrected with the official color variant and the label is now consistently “مؤسسة إحياء”.
2. Mobile review confirmed the admin information architecture correctly becomes a bottom navigation and the teacher roster becomes one column with no hidden actions.
3. Post-fix browser review found no actionable P0, P1, or P2 differences. Remaining differences are intentional product additions: the login role selector and functional form states.

## Follow-up polish

- P3: replace sample contact details when the institution supplies the final email and telephone number.
- P3: the current official raster logo variants can later be replaced by original transparent vector exports if supplied.

final result: passed
