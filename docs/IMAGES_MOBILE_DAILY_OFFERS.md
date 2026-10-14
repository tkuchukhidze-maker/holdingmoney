# Episode Holding — image-led discovery, mobile navigation and daily campaigns

## Visual source policy

The public Node website now bundles existing Episode website assets from the old archived production source under `prototype-preview/assets/photos/`. No third-party property photograph is represented as a genuine photo of an Episode venue without verification.

- `photos/batumi.webp`, `photos/kutaisi.webp`: legacy venue reference images (small files, review original resolution before final production).
- `photos/magnolia.webp`: archived Magnolia facade reference (very low resolution; replace with a high-resolution approved photo).
- `photos/holding-interiors.webp`, `photos/editorial.webp`: archived generic hospitality/editorial assets, used **only as illustrative visuals** for unsupplied venue photos and the lunch campaign proposal.
- Real venue image albums, menu dish photography, hotel room photography, menu allergen details and live event photography must be supplied and approved by each venue; do not claim placeholders depict a specific real object.

Images are locally served from `/photos/`, shipped by the Node build, lazily loaded where appropriate, cropped with `object-fit: cover`, and labeled as illustrative. Actual booking/menu data and offers remain separate from asset presentation.

## Mobile guest journey — inspired by common Airbnb discovery patterns

We adapt interaction principles, **not Airbnb branding, design assets or proprietary UI**:

- Home → Restaurants / Hotels → photo-led venue cards → dedicated venue page.
- One clearly visible primary decision at a time; city filter pills are horizontally scrollable on small screens, no nested confusing category anchor links.
- Cards become one column on phone; text and images scale to width; large touch areas; reduced motion respected.
- Persistent four-tab mobile navigation (Home, Restaurants, Hotels, My Episode). My Episode still points to its demo until the Laravel auth backend is operational.
- On full restaurant menu: category tabs, search and live quantity controls; sticky cart shortcut above mobile navigation; menu cart belongs only to chosen venue.
- All photo and icon content must have alt text/labels suitable for screen readers; keyboard focus visible.
- No booking or promotion is confirmed without a real server transaction.

## Draft 12:00–17:00 promotion

Proposed marketing campaign: **„ხინკლის შუადღე“** — **5 ხინკალზე 1 ლუდი საჩუქრად**, 12:00–17:00 (Georgia local time).

Implementation:
- `src/daily-offers.js` stores a separate **draft** for Batumi, Kutaisi and Tbilisi, with `venueSlug`, `status`, hours and qualifying quantity.
- The public website displays the card **„შეთავაზების პროექტი — ჯერ არ მოქმედებს“** to avoid misleading customers.
- The menu page may show a purely indicative calculation: 4 khinkali → 0 example gift; 5 → 1; 10 → 2. This does not add beer to the cart or change its price.
- Alcohol-related benefit is for adults only; do not target minors. The specific beer brand/type, volume, eligible khinkali varieties, participation per venue, start/end campaign dates, per-table gift caps, deposit terms and cancellation policy all need written owner approval before publication.
- **No backend publishes or redeems this campaign yet**, nor is any calendar interval an approval. Live promotion activation requires a staff-controlled audit trail, valid date window, per-venue eligibility validation and server-side order calculation.
- A free beer is not offered to the customer as a legally binding promise from this draft preview.

## Acceptance

The automated tests exercise draft-only promotion logic, separate venue IDs, gift preview thresholds, mobile tab paths, photo and stylesheet HTTP responses, existing book/menu/profile tests and the Node production build. Successful GitHub CI validates source, **not successful Laravel Cloud deployment**.

Production media checklist: replace low-resolution legacy refs with approved high-resolution photos in WebP/AVIF, optimize file sizes, provide alt text and verify consent/ownership, add actual food photography per menu item, and verify real offer eligibility with venue managers before switching `status` to published.
