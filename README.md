# Secret Santa

A small static Secret Santa app: Home (RSVP with "Yes, I'm in!" or "Not This Year", plus participant list), Admin (event details, remove people, draw names) and a password gate.
Plain HTML, CSS and JavaScript. No build step.

## Project structure

    index.html        page shell
    css/style.css     styles
    js/storage.js     DATA LAYER (the only file to change for Supabase)
    js/app.js         pages and logic

## Run locally

- **VS Code:** install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".
- **Or:** just double-click `index.html`.

Default admin password: `santa2026` (change it in `js/storage.js`).

## Put it on GitHub

    git init
    git add .
    git commit -m "Initial Secret Santa app"
    git branch -M main
    git remote add origin https://github.com/YOUR-USERNAME/secret-santa.git
    git push -u origin main

## Deploy to Vercel

Import the GitHub repo at vercel.com/new and click Deploy. No settings needed.

## Current limitation

Data is stored in each visitor's browser (localStorage), so lists are not shared between people
and the password check is visible in the page source. Fix both by connecting Supabase.

## Connecting Supabase later

1. Create a project at supabase.com.
2. In the SQL editor, create the tables:

        create table participants (id bigint generated always as identity primary key, name text not null unique, status text not null check (status in ('in','out')));
        create table settings (id int primary key default 1, date text, budget text, location text);
        create table draws (giver text primary key, receiver text not null);

3. Turn on Row Level Security. Allow public `select`, `insert` and `update` on `participants` (so guests can RSVP) and public `select` on `settings`; restrict inserts, deletes and all
   access to `draws` to the authenticated admin user (create the admin under Authentication > Users).
4. Add the client to `index.html` before `storage.js`:

        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

5. Rewrite `load()` and `save()` in `js/storage.js` to read and write those tables using
   `supabase.createClient(URL, ANON_KEY)`. The anon key is safe to expose when RLS is on; never use the service key in the browser.
6. Replace the password gate in `js/app.js` with `supabase.auth.signInWithPassword(...)`.
