# Clip Engine public pages

Next.js App Router pages for the Vercel app: homepage, Privacy Policy, and Terms of Service.

Google requires a publicly reachable homepage that describes the app and links to the privacy policy (and terms). TikTok requires those two links to be visible on the website URL **without opening a menu**. This layout puts them in the top header.

## Before you deploy

In every file under `app/`, replace:

- `{APP_URL}` — public origin, no trailing slash
- `{CONTACT_EMAIL}` — privacy and support inbox
- `{OPERATOR_NAME}` — legal name of the individual operator
- `{EFFECTIVE_DATE}` — date these pages go live, e.g. `November 9, 2026`

Then copy `app/` into the Clip Engine Next.js project (or deploy this folder as the app root if you add `package.json` later). Routes:

| Path | Page |
|---|---|
| `/` | Product homepage |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

Use these exact URLs in Google OAuth branding and the TikTok app settings:

- `{APP_URL}`
- `{APP_URL}/privacy`
- `{APP_URL}/terms`
