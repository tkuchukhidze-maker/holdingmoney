# Mobile and public-flow review — 2026-10-15

This change improves the existing Node public preview in `prototype-preview`.
The root Laravel application remains a foundation, not a completed booking platform.
Original approved `.dc.html` files are unchanged.

## Changes

- Consistent SVG mobile icons, category highlighting on aliases, keyboard focus,
  safe-area support and readable labels on 320px phones.
- Compact horizontally scrollable venue navigation; larger menu quantity controls
  and 16px form inputs to avoid iOS input zoom.
- Full menu links now open the selected restaurant's menu rather than looping
  back to the menu teaser. Deep links to asynchronous booking sections scroll
  after the section mounts.
- Disabled browser storage no longer crashes venue or menu pages.
- Menu export validates entered dates, guest counts and email. Clear-selection
  has an undo action; contact information is not persisted.
- Public account/admin routes display availability information instead of a fake
  signed-in customer, simulated OTP flow or a public role switcher. Embedded
  registration buttons lead to that same account availability page.
- Enter in an unconnected prototype form does not reload or expose fields in
  the URL. Loading, error recovery and skip-navigation states are available.
- Root npm lockfile is committed; CI uses npm ci. Browser regression tests cover
  11 public routes at 320/390/744/1280px plus cart and anchor interactions.

## Validation

Root ESLint, TypeScript and Vite build pass. Preview syntax checks, nine original
prototype validations, unit tests, nine-screen smoke tests and the new public UX
browser suite pass. The browser suite checks horizontal overflow, icons and
active tabs, deep links, storage rejection, cart undo and validation.

PHP/Composer are unavailable in this runner; PHP tests must run in CI. The existing
Cloud readiness test timed out in this runner; its dual-stack production check
remains required in CI. Calendar browser tests passed. The new browser suite binds IPv4 locally.

## Remaining product work

There is no operational booking/authentication/payment backend in the public
Node app. Registration, reservations, loyalty and admin must be implemented in
the Laravel application with migrations, authorization and integration tests.
The two non-Batumi restaurant menus still need approved data. Prototype schedules,
chat responses, room availability and prices are illustrative and require real
venue data/integrations before production use. No production migration, merge or
deployment is performed by this change.
