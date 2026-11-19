# Personal notebook storage

The bottom-left **My notes** panel stores questions and notes in this browser immediately. It can additionally sync private, signed-in account notes to Supabase. No automatic assistant replies or AI service are involved.

## Connection

The dedicated Supabase project is **gender-equality-un-data**, reference `xqfkcrizdblybpalzdyw`. The notes migration and owner-only policies are applied, local CLI linking is configured, and the public connection settings are configured locally and in the Vercel project. Sign-in redirects cover production and local development. The existing `datapath` project was not changed.

For another environment, configure these variables in `.env.local` for local development and in the Vercel project environment for deployment:

```text
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Use a publishable key (or compatible legacy anon key), never a secret/service-role key in a `NEXT_PUBLIC_` variable. Environment files are ignored by Git. Changing these variables requires restarting development or rebuilding/redeploying production.

Apply `migrations/20261116000100_create_gender_equality_notes.sql` to the selected database. It creates only `public.gender_equality_notes`, its owner/date index, and its RLS policies. Review the target database before applying; a table-name conflict should be inspected rather than overwritten.

The database grants authenticated users SELECT, INSERT and DELETE, with policies requiring `auth.uid() = user_id`. Anonymous requests cannot access this table. Browser-note imports use a unique `(user_id, browser_id)` pair for idempotence without collisions between accounts. Accounts and their notes are separate from the public HDR/ILO datasets.

## Authentication

Enable email sign-in in Supabase Auth. Add the production site and local development routes to the authentication redirect allowlist, for example:

```text
https://ge-un-tyj.vercel.app/**
http://localhost:3000/**
http://127.0.0.1:3018/**
http://localhost:3020/**
http://127.0.0.1:3020/**
```

Set the production site URL to `https://ge-un-tyj.vercel.app`. Use **Sign in to sync** to open the email/password modal. **New here? Sign up** creates an account with a password and email confirmation. Existing email-link users choose **No password yet, or forgot it?** to receive a verified password setup/reset link. Signed-in users can also set a password from Account. Actual delivery depends on the project’s email/SMTP settings and limits. Recovery links return to `/?notebook=account`, opening the password form after Supabase verifies the link.

Signed-out notes stay in local storage. Signing in does not upload them automatically. **Copy browser notes to account** imports them into the current account and keeps the originals. Signing out clears account notes from the panel and returns to browser notes. The panel shows the latest 500 account notes; earlier rows remain in Supabase.

## Verification

```sh
node --experimental-strip-types scripts/notes.test.mjs
npm run build
```

For a connected project, verify that signed-out queries cannot read notes, account A cannot read or delete account B’s notes, and copying browser notes twice does not duplicate them. Confirm an actual save/reload and magic-link sign-in before reporting cloud sync as connected.

## Connection verification

Database checks verified owner reads, blocked cross-account reads/deletes/inserts, and blocked anonymous reads, using temporary rows/users rolled back in the same transaction. The public auth endpoint confirms email sign-in is enabled; the signed-out Data API does not expose notes. A real email sign-in and browser save/reload still require user interaction and have not been verified automatically.

The generated database password is retained only in ignored `.env.local`; it is not a browser variable and was not sent to Vercel. Only the project URL and publishable key are needed by the notebook. Never expose the password or service-role keys.

## Attachments

Migration `20261117000100_notebook_attachments.sql` adds optional attachment metadata to notes and a private `notebook-attachments` Storage bucket (20 MB per file). Storage policies restrict uploads, reads and deletes to the authenticated user’s UUID path prefix. It has been applied to the dedicated project.

Signed-in users can attach up to 10 files per message, with or without text: PowerPoint, Excel/CSV, Word, PDF, ZIP, and images (including HEIC, TIFF, SVG and common camera/design formats). Browser-supported raster images have inline previews. Other formats remain downloadable in their original format; files are not parsed, executed, or extracted. Uploads use opaque object names and download-only content types. Failed message inserts attempt to clean up uploaded objects; deleting a note also removes its objects. Network failures during cleanup can leave private orphan objects for later maintenance. Signed-out text notes remain local; files require sign-in.

Password email delivery, confirmation links, and a complete browser session should be checked with a real user account before claiming end-to-end verification.

Attachment verification passed owner-only reads, cross-account upload rejection and anonymous read isolation against temporary Storage metadata rolled back in one transaction. Build, existing note parser tests, and attachment format/limit/preview tests also passed. No real email delivery or full browser upload session was performed.

## Public community chat

**Public chat** (bottom right) is separate from **My notes** (bottom left). It works without Supabase Auth and is shared site-wide. Its optional display names are unverified. The initial view loads the latest 50 messages, **Load earlier messages** pages backward through the history, and the panel polls for newer messages every five seconds while open and visible. Messages are rendered as plain text. Private note rows and attachment objects are never copied to this chat.

Migration `20261117000200_public_chat.sql` is applied to the dedicated project. `community_messages` exposes only its public ID, display name, body and timestamp to the anonymous and authenticated roles. Direct inserts, updates and deletes are not granted. Posting uses the restricted `send_community_message` function, which generates timestamps, validates lengths, supports idempotent retries and applies a five-second cooldown and 100-message daily limit per browser guest ID. Guest IDs are client-generated and resettable; these are basic posting limits, not verified identities or comprehensive abuse protection. The limiter table and request IDs are not publicly readable. Moderation can be performed through the project’s administrative database access.

Verification passed anonymous posting/history reads, duplicate retry handling, cooldown and length rejection, blocked anonymous deletes, hidden request IDs/limiter rows and private-note isolation. Test messages were rolled back. Separate API checks verified public history reads and invalid-message rejection without an auth session and denied access to private notes, without posting any live messages. Component/browser interaction was not automatically verified.

## Message page context

Both public messages and private notes capture `page_path` at send time and display a **From** label. The dashboard preserves only the `index` query parameter to distinguish its reports; unrelated query parameters and URL fragments are excluded. Public messages created before page tracking remain unassigned. The private notebook already stored paths; its labels now identify individual index and topic pages.

Migration `20261117000300_message_page_context.sql` is applied. Its five-argument posting function records page context while retaining the original four-argument function for older deployed clients. Retries keep the original page. Database checks passed anonymous page persistence/read, retry-origin preservation and query validation, with test rows rolled back. Client helper tests and the production build passed.
