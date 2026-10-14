# Episode Holding — restaurant menus attached to reservations

## User experience (current Node preview)

1. Visitor chooses **Restaurants → branch** and sees the **Full menu and dish selection** link on that branch's public page.
2. Each venue has its **own** menu route:
   - `/restaurants/batumi/menu`
   - `/restaurants/kutaisi/menu`
   - `/restaurants/tbilisi/menu`
3. The guest browses food, bar/cocktails and wine, searches dishes, filters categories, and sets a quantity for each item.
4. The per-venue selection persists for the current browser tab/session only; the selected restaurant page shows its item count and indicative total. Different branch selections never mix.
5. The guest can enter booking date, time, guest count and special notes, then **copy/share a combined reservation + selected-menu request** to a contact they choose.
6. The public viewer states prominently that **copy/share is not a confirmed reservation, order or notification to the restaurant**. The fake-confirmation buttons in the five prototype screens remain disabled.

## Menu sources and price integrity

Only Batumi's actual owner-provided menu documents were available:
- `Batumis_Sakhli_Food_Menu_Corrected.pdf` — food, four pages.
- `Batumis_Sakhli_Bar_Menu(2).pdf` — drinks, coffee, cocktails, two pages.
- `Batumis_Sakhli_Wine_Menu.pdf` — wine, one page.

These source files are held in the user's ChatGPT Library and were transcribed into `prototype-preview/src/menu-data.js` for website display. No PDFs were embedded in the public repo, to avoid unnecessary duplication. Food menu prices include `ხბოს ოჯახური = 28 ₾`, `ღორის ოჯახური = 26 ₾`, and `ქალაქური ხინკალი = 2.40 ₾`. The supplied PDFs say **service charge included**. All public prices remain **unverified as current** and must be approved by the restaurant before they are used for payment or confirmed pre-orders.

No verified Kutaisi or Tbilisi menus were found. Their menu routes therefore show a clear **menu not yet supplied** message instead of replicating Batumi's menu or inventing dishes/prices. Upload and approve each branch's authentic menu before activating it.

## Production backend still required — **not implemented in the Node preview**

A production reservation must reference:
- `customer_id` — optional for guest bookings; otherwise a single Episode Customer ID across the holding;
- `venue_id` — **required**; resolved and validated on the server from the venue URL;
- `table_reservation_id` — server-generated ID created only on successful capacity validation;
- `reservation_menu_items(id, table_reservation_id, venue_id, menu_item_id, quantity, item_name_snapshot, unit_price_snapshot, currency, status)`, with foreign keys and unique booking/menu-item relation where appropriate;
- `menu_items(id, venue_id, section_id, name, description, allergens, price, availability_status, active, updated_at)` and `menu_sections` per venue; roles assigned to a venue may edit only that venue's menu.

Suggested API:
```
GET  /api/venues/{venue:slug}/menu
POST /api/venues/{venue:slug}/table-reservations
     { date, time, party_size, guest_details_or_customer_id, occasion, notes,
       menu_items: [{ menu_item_id, quantity }] }
```

Server validation rules: resolve venue, authenticate or validate guest phone, validate date/party size and available tables, ensure all menu items belong to that venue and are active, validate quantity and current prices, calculate server-side totals, implement idempotency key to avoid duplicate reservations, atomically save booking and its selected menu items. Do not trust client totals. Booking statuses: `pending` → `confirmed` / `declined` / `cancelled`; menu request statuses: `pending_kitchen_review` → `accepted` / `unavailable`. **A menu request does not mean it has been prepared or paid.**

On successful save, show an actual generated booking reference with the branch and exact items; create an entry in **My Episode** and **that branch's** staff dashboard; notify the guest and staff via configured email/SMS/WhatsApp adapters after transaction. Promos, deposits, allergies, and cancellation policies must be venue-specific.

**Never** implement a dummy API returning “success” without persisting or validating a real booking; this is especially important when the guest has selected paid menu items.

## Current acceptance tests

- Full Batumi menu categories and known document prices, no fabricated Kutaisi/Tbilisi prices.
- Separate routes for all three branch menus; direct HTTP refresh works.
- Local draft is venue-scoped, quantities are capped, invalid item IDs dropped, totals computed correctly to cents.
- Generated request includes restaurant + city, date, time, number of guests, item names, quantities and indicative total.
- Fake booking confirmation is still disabled on public previews, and users aren't falsely told that SMS or a booking was sent.

Follow-up: obtain approved Kutaisi/Tbilisi menus; implement the Laravel database, transactional API, and operational dashboards before enabling actual **Send with reservation** or accepting payments.
