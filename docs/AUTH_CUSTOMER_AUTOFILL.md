# My Episode — prefill guest data on every booking

## Requirement

A guest should register/sign in **once** to My Episode, then book any Episode restaurant or hotel without reentering their surname, name or previously verified contact details.

## Actual source of identity

- Use **only** the customer in the currently authenticated server session; do not infer guest identity from venue, history, localStorage, query strings or client-provided customer ID.
- **Laravel** endpoint: `GET /api/customer/profile` in web middleware with `auth`; unauthenticated requests with JSON Accept get HTTP 401.
- The endpoint returns `firstName`, `lastName`, `fullName` and verified `email` / `phone`; it does not reveal passwords, roles, points or private details of another customer.
- On Laravel `users`, optional `first_name`, `last_name`, `phone` and `phone_verified_at` columns were added. An existing full `name` is split as a legacy fallback **only if structured fields are missing**. New registrations must explicitly store given name and surname separately.
- Responses use `Cache-Control: private, no-store` and `Vary: Cookie`.

## Guest experience

- Signed-in customer: prefill full name and verified contacts in restaurant table booking, hotel room booking, and restaurant menu/pre-order draft. Editable in the form; manual edits always take precedence. Still choose **venue, date, time, guests, room type and menu** for each new booking.
- Guest/unauthenticated: no pretend logged-in profile. Show blank contact inputs and let the guest enter them. No autocompletion from another user's browser session.
- Unknown or unverified phone/email: leave those fields empty for the customer to complete; don't claim they are verified.
- Don't store names, phone numbers or emails in menu/cart `sessionStorage`, `localStorage` or URLs. Menu-only cart continues to store just dish IDs and quantities.

## Limits in the currently deployed Node preview

**No real customer login exists** in the Node preview. Its registration and My Episode screens are design mockups; it returns HTTP 404 for the Laravel profile endpoint. Therefore the preview MUST still act as a guest until the Laravel authentication phase is deployed. Adding fake login or a hardcoded demo user would risk leaking identity and falsely claiming bookings.

A future live Laravel UI will use this authenticated endpoint after the real registration, OTP, login/session and customer profile lifecycle is wired up. Its existing backend migrations/models will need to be deployed separately; adding a PHP route to GitHub does not make the Node Cloud preview authenticate users.

## Acceptance tests

- HTTP 401 for guests; session-authenticated user receives only their own profile; unverified contacts excluded; headers disable caching.
- Node frontend sends cookie session requests to a same-origin endpoint; catches 401, 404 and offline cases without showing demo identity.
- Profile fills only blank booking inputs and does not overwrite user changes.
- Restaurant menu request summary includes chosen guest contacts, but only menu item IDs/quantities are stored in session storage.
