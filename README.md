# Campus Book Drop Control Dashboard

The internal admin console for [Campus Book Drop](https://github.com/Exyons/CampusBookDrop), a used-textbook marketplace that ran on the MNNIT Allahabad campus through 2023.

The storefront had no payment gateway. Buyers paid by scanning a UPI QR code, then uploaded a screenshot of the receipt. Someone had to open each screenshot, check that the money had actually landed, and mark the order paid. This is the tool for doing that.

> **Status: archived.** Campus Book Drop is no longer running, and this repository is kept as a record of the build. Read the limitations before running it anywhere reachable: there is no authentication.

## What it does

Two tabs over the same MongoDB database the storefront writes to.

**Orders** lists every order with its receipt image, the books in it, the seller's email and UPI ID for payout, the buyer's shipping address, and the totals. Verifying a payment means opening the receipt, then setting the order status and typing the UPI transaction ID into the modal. Confirming an order requires that ID, and the server rejects an empty one.

**Delivery orders** tracks the physical handoff. Each entry carries a pickup address for every book, since books in one order can come from different sellers in different hostels, plus the buyer's shipping address. Book Heroes, the student volunteers who ran the deliveries, claimed orders themselves through the storefront. This tab covers the ones the team handled directly and exists to push a stuck delivery forward.

## The state machines

Orders move through `processing`, `confirmed`, `canceled`, `delivered`, `returned`, and `pickedup`. Deliveries move through `open`, `locked`, `pickedup`, and `delivered`.

The two are coupled, and `controllers/admin_dashboard.js` enforces the coupling:

- Confirming an order also flips the paired delivery order's `payment_status` to `confirmed`, which is what makes it visible to Book Heroes.
- A delivery cannot advance while its order is still `processing`. The dashboard answers "Payment Is Not Verified of The Order!" and stops.
- A delivered order is terminal. Nothing moves it.
- Locking an already-locked order, or marking an already-picked-up one, is rejected rather than silently reapplied.
- Marking a delivery `delivered` or `pickedup` writes back to the order too, with a fixed status comment the buyer then sees on the storefront.

Sellers were paid to the UPI ID on their profile after the buyer's return window closed, minus a 7% service fee. The dashboard prints that rate on every order but does not compute payouts.

## Stack

Server-rendered Express with no build step and no frontend framework.

- Node.js and Express 4, EJS with `ejs-mate` for layouts
- MongoDB via Mongoose 7, sessions persisted through `connect-mongo`
- Bootstrap 5.3 and axios loaded from jsDelivr
- Status changes POST as JSON through axios and come back as a toast, so the page never reloads

Three routes, one controller, five Mongoose models.

## Running it locally

```bash
git clone https://github.com/Exyons/CampusBookDrop-ControlDashboard.git
cd CampusBookDrop-ControlDashboard
npm install
cp .env.example .env    # then fill in SESSION_SECRET
npm start
```

Runs on `http://localhost:4000` unless `PORT` says otherwise.

Outside production it connects to `mongodb://127.0.0.1:27017/BookSellingApp`, the same local database the storefront uses. That is deliberate: this app owns no data of its own. It reads and writes the storefront's collections, and the models here are copies of the storefront's schemas. Point it at an empty database and both tabs render their "no orders yet" state, which is all you will get without placing an order through the storefront first.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Anything other than `production` uses the local database and prints error stack traces onto the error page. |
| `MONGODB_URL` | Connection string. Read only when `NODE_ENV=production`. |
| `SESSION_SECRET` | Signing secret for `express-session`. There is no fallback, so sessions break if it is unset. |
| `PORT` | HTTP port. Defaults to 4000. |

## Layout

```
app.js                          Express setup, session store, route mounting, error handler
routes/admin_dashboard.js       Three routes
controllers/admin_dashboard.js  Render dashboard, update order status, update delivery status
models/                         Mongoose schemas mirrored from the storefront
views/dashboard/                Dashboard page and its orders / delivery_orders partials
public/js/dashboard.js          Tab switching, modals, axios calls, toasts
```

## Known limitations

This was written for one operator on one machine, and it shows.

**There is no authentication.** `/dashboard` is public. Anyone who can reach the port can read buyer names, mobile numbers, hostel room numbers, seller emails and usernames, seller UPI IDs, and every payment receipt image, and can change the status of any order. `passport-local-mongoose` is a dependency and the user schema loads the plugin, but Passport is never initialized in `app.js` and no route carries a guard. Do not deploy this as it stands.

**The footer never renders.** `views/layouts/boilerplate.ejs` pulls it in with `<% include(...) %>`, which evaluates the include and discards the output. EJS 3 needs `<%- include(...) %>`. Every page therefore ships without its closing `</body>` and `</html>` tags and never loads `public/js/app.js`. Browsers close the tags themselves and that file is empty, so nothing visibly breaks.

**Session encryption is off.** The `connect-mongo` crypto option is spelled `secrete` in `app.js`, so the library ignores it and stores session data unencrypted. The storefront carries the same typo.

**The filter buttons do nothing.** Nine buttons across the two tabs, every one of them carrying `id="processing"`, with no click handler anywhere. They are markup for a feature that was never wired up, and the duplicate IDs are invalid HTML.

**Hostel codes are out of date.** The dashboard maps `TH`, `MH`, and `PH` to hostel names. The storefront's address schema also allows `SVBH`, added later. An SVBH address renders with a blank hostel in both the shipping and pickup blocks.

**A failed query answers twice.** `renderAdminDashboard` calls `next(error)` inside its catch block without returning, then falls through to `res.render` anyway. Take the database away and Express runs both the error handler and the render, and whichever loses the race throws `ERR_HTTP_HEADERS_SENT` into the log on every request.

**Smaller things.** `updateOrderStatus` reads `order.order_id` before checking whether the order was found, so a bad ID returns "Server Error" instead of "Order Not Found!". The payment ID field is initialized from an empty EJS tag, `value="<%=  %> "`, so it opens holding a single space instead of the order's existing payment ID. Once that field is revealed it is never hidden again, and stays visible for every order opened afterwards. A stray `%>` leaked into the delivery tab's markup and prints literally beside the Book Hero name. A `console.log` of the payment ID is still in the controller, and there are no tests.

## License

MIT. See [LICENSE](LICENSE).
