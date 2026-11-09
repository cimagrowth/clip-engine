# Clip Engine — platform audit copy

Copy-paste answers for:

1. Google OAuth verification (branding + sensitive-scope data access)
2. YouTube API Services Audit and Quota Extension Form
3. TikTok for Developers app review (Content Posting API)

Pages to host on the Vercel app (same domain as the homepage): `web/app/` (`/`, `/privacy`, `/terms`). Privacy Policy and Terms links must be visible on the homepage without opening a menu.

Replace placeholders before submitting:

| Placeholder | What to put |
|---|---|
| `{APP_URL}` | Public HTTPS origin of the Clip Engine site, no trailing slash (example: `https://clip-engine.vercel.app`) |
| `{CONTACT_EMAIL}` | Support / privacy inbox (a personal plus-address is fine) |
| `{OPERATOR_NAME}` | Legal name of the operator (individual) |
| `{EFFECTIVE_DATE}` | Date the hosted policy pages go live |
| `{GOOGLE_CLOUD_PROJECT_NUMBER}` | Numeric project number from the Cloud Console welcome card (not the project ID) |
| `{GOOGLE_OAUTH_CLIENT_ID}` | Web client ID shown in the consent-screen address bar |
| `{DEMO_VIDEO_URL}` | Unlisted YouTube URL of the recorded demo |
| `{TIKTOK_CLIENT_KEY}` | TikTok app client key, if a form asks for it |

## What changed versus earlier notes

Checked against live docs on 9 November 2026 (America/New_York):

- YouTube Data API default quota is now **100 `search.list` / day**, **100 `videos.insert` / day**, and **10,000 units / day for every other method**. `videos.insert` costs **1** unit in its own bucket, not ~1,600 units out of a shared 10,000. Source: [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost) (updated 2026). Four channels at 3 Shorts/day is about 12 uploads — the default upload bucket is enough. A quota increase is optional headroom, not a launch blocker.
- Official `videos.insert` docs now say: **“Videos uploaded from unverified API projects are not restricted to private viewing mode.”** Privacy defaults to `public` if you omit `status.privacyStatus` (some accounts still default to private via creator settings). Source: [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) (updated 2026-11-03). The older “unaudited uploads stay private until a compliance audit” rule is no longer stated. You still need OAuth verification to leave the unverified-app / Testing limits if the app is public, and you still need a compliance audit to get **more than** the default quota.
- TikTok Direct Post from an **unaudited** client is still limited to `SELF_ONLY` viewership and **5 users per 24 hours**. Source: [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines) (updated 2026-08-04). TikTok also states apps **must not be for private or personal use** and **must not still be in development or testing**. Source: [App Review Guidelines](https://developers.tiktok.com/doc/app-review-guidelines/). See the risk note in `tiktok-content-posting.md`.

## Submit order

1. Host `{APP_URL}`, `/privacy`, and `/terms` (placeholders replaced). Verify Search Console ownership of the domain for Google.
2. Build enough of the review-and-post UI to record a real demo (script in `demo-video-script.md`). Do not submit TikTok review against a login-only page.
3. Record the demo in English. Upload it unlisted to YouTube for Google; also keep a copy TikTok can play (TikTok accepts up to 5 files, 50 MB each, in the App review form).
4. Google Cloud Console: OAuth branding → publish branding → Data Access scopes → Verification Center, with the justifications in `scopes.md` and `google-oauth-youtube.md`.
5. Optional: [YouTube API Services Audit and Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form) using `google-oauth-youtube.md`. Needed if you want more than 100 uploads/day or 10,000 other units/day, or if YouTube asks for a re-audit.
6. TikTok Developer Portal: production app (not a draft-only test app), sandbox demo for a first review, then App review with the answers in `tiktok-content-posting.md`.

## Files

- `app-description.md` — short product description for both consoles
- `scopes.md` — exact scope strings and why each is (or is not) requested
- `data-use-and-retention.md` — data-use statement for forms and for the policy pages
- `google-oauth-youtube.md` — OAuth verification + YouTube audit form answers
- `tiktok-content-posting.md` — TikTok app-review answers
- `demo-video-script.md` — narration and on-screen checklist
