# Manual QA Checklist — Law Library Management System

Automated unit tests (`npm test` in `backend/`) cover pure logic: pagination,
password hashing, JWT signing, validation schemas, and report CSV export.
Everything below needs a live database and both servers running, so it's a
manual pass — walk through each section against your real Supabase-connected
app.

Run `npm run dev` in both `backend/` and `frontend/` before starting.

## 1. Authentication & RBAC
- [ ] Log in as Website Owner — succeeds, lands on Dashboard
- [ ] Log in as Library Admin — succeeds, lands on Dashboard
- [ ] Log in with wrong password — rejected with a clear error, no account info leaked
- [ ] Log in with a non-existent email — same generic error as wrong password
- [ ] 11 failed login attempts in a row — 11th is rate-limited
- [ ] As Library Admin, try visiting `/employees/new` directly by URL — redirected away (Owner-only route)
- [ ] Deactivate an employee's account (as Owner), then try logging in as them — rejected

## 2. Books
- [ ] Search by title, ISBN, accession number, barcode, author name, category name — each returns correct results
- [ ] Filter by Book Type, Status, Category — narrows results correctly, combinable
- [ ] Sort by Title and Accession Number, both ascending and descending
- [ ] Add a new book with a full location (floor/room/shelf/row/position) — appears correctly, location tag shows on list and details
- [ ] Add a book with no location — shows "No location assigned", doesn't crash
- [ ] Edit a book — changes persist and reflect immediately
- [ ] Delete a book — disappears from the main list (soft delete)
- [ ] Restore a deleted book via `GET /api/books/deleted` + `POST /api/books/:id/restore` (no UI for this yet — API only; consider adding a "Deleted Books" view if you want this exposed in the UI)
- [ ] Mark a book Lost — status updates, confirmation dialog appears first
- [ ] Mark a book Damaged — status and condition both update
- [ ] Try deleting a book that's currently issued — correctly rejected

## 3. Borrow Records
- [ ] Issue a book to an employee — book status flips to Issued, record appears in Borrow Records
- [ ] Try issuing the same book again — it no longer appears in the "available books" search in the Issue dialog (correctly prevented)
- [ ] Return a book — status flips back to Available, return date recorded
- [ ] Renew a book — due date extends, status stays Issued
- [ ] Try renewing with a due date earlier than the current one — rejected
- [ ] Mark an issued book as Lost via Borrow Records — book's own status also updates to Lost
- [ ] Filter Borrow Records by status (Issued/Returned/Overdue/Lost)

## 4. Employees
- [ ] As Owner: add, edit, delete an employee — all succeed
- [ ] As Owner: activate/deactivate an employee — status updates
- [ ] As Owner: reset an employee's password — new password shown once, works for login
- [ ] As Owner: grant Library Admin access to a plain employee — temporary password shown, they can now log in
- [ ] As Owner: revoke Library Admin access — they can no longer log in
- [ ] As Library Admin: confirm Employees page is visible but read-only (no Add/Edit/Delete/Activate buttons visible)
- [ ] As Library Admin: try hitting `PUT /api/employees/:id` directly (e.g. via curl/Postman) — rejected with 403, not just hidden in UI

## 5. Authors / Publishers / Categories / Rooms / Shelves
- [ ] Add, edit, delete an Author — succeeds
- [ ] Try deleting an Author still referenced by a book — rejected with a clear error (not a raw DB error)
- [ ] Same checks for Publishers and Categories
- [ ] Add a Room under a Floor, add a Shelf under that Room — both appear correctly
- [ ] Try deleting a Room that still has Shelves — rejected
- [ ] Try deleting a Shelf that still has a book located on it — rejected

## 6. Reports
- [ ] Each of the 7 report types loads a preview table with correct columns
- [ ] Date range filter narrows Borrow History / Books Added / Books Removed correctly
- [ ] Export as CSV — file downloads, opens correctly, data matches preview
- [ ] Export as Excel — file downloads, opens in Excel/Sheets, formatted with bold header row
- [ ] Export as PDF — file downloads, readable, doesn't cut off columns

## 7. Activity Logs
- [ ] Every action taken above (login, book added, employee deactivated, etc.) shows up here with correct user, action, module, and timestamp
- [ ] Filter by module and action narrows results correctly

## 8. Dashboard
- [ ] Summary cards (Total/Available/Issued/Lost/Damaged Books, Total Employees) match reality after the actions above
- [ ] Recently Added Books, Recently Issued Books, Recent Activity all update live

## 9. UI/UX baseline
- [ ] Light mode and dark mode both look correct on every page (not just Dashboard/Login)
- [ ] Every delete action shows a confirmation dialog before proceeding
- [ ] Every successful/failed action shows a toast notification
- [ ] Pagination works correctly on Books, Employees, Borrow Records, Activity Logs, Reports
- [ ] Resize the browser window narrow — layout doesn't break (spec requires responsive layout)

## 10. Security spot-checks
- [ ] Open browser dev tools → Network tab → confirm the JWT is sent as `Authorization: Bearer ...`, never as a URL param
- [ ] Try calling a protected endpoint (e.g. `/api/books`) with no token via curl — rejected with 401
- [ ] Try calling an Owner-only endpoint as Library Admin's token via curl — rejected with 403
- [ ] Confirm `.env` files are not committed to git (`git status` should never show them if `.gitignore` is set up — see note below)

---

### One gap worth flagging
There's no dedicated `.gitignore` yet. Before pushing to GitHub in the
deployment phase, make sure `node_modules/`, `.env`, and `dist/` are excluded
— I'll include this in the deployment phase, but flagging it now so you
don't accidentally commit secrets before then.
