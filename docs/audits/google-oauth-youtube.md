# Google OAuth verification and YouTube API audit

Official starting points:

- Branding and sensitive-scope verification: [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification) (updated 2026-10-30), [Demo video requirements](https://support.google.com/cloud/answer/13804565), [Verification requirements](https://support.google.com/cloud/answer/13464321)
- Quota and compliance: [Quota and Compliance Audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) (updated 2026-11-03)
- Form: [YouTube API Services — Audit and Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form)
- Policies the privacy/terms pages implement: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies) (updated 2026-11-06)

Personal-use note: Google allows skipping verification if you are the only user (or a few people you know) and you stay in Testing with those accounts on the test-user list. Testing still shows a warning and limits refresh-token lifetime (**confirm the current Testing token lifetime in Console; not re-checked here**). Submit verification when you want Production publishing, stable tokens, and no unverified-app screen.

## A. OAuth consent / branding (Cloud Console)

| Field | Paste |
|---|---|
| App name | Clip Engine |
| User support email | `{CONTACT_EMAIL}` |
| App logo | Clip Engine mark (square). Do not use the YouTube logo. |
| Application home page | `{APP_URL}` |
| Privacy policy | `{APP_URL}/privacy` |
| Terms of service | `{APP_URL}/terms` |
| Authorized domains | The registrable domain of `{APP_URL}` (verify ownership in Search Console with a project Owner/Editor account) |
| Developer contact | `{CONTACT_EMAIL}` |
| User type | External |
| Publishing | Production, after branding verifies (or Testing + your Google accounts if you are deferring verification) |
| Scopes | See `scopes.md` — only `youtube.upload` and `youtube.readonly` |

### Per-scope justifications (Data Access / Verification Center)

**`https://www.googleapis.com/auth/youtube.upload`**

Clip Engine uses `https://www.googleapis.com/auth/youtube.upload` so that, after a signed-in creator reviews a short clip and explicitly taps Post, the app can call YouTube Data API v3 `videos.insert` to upload that video to the creator’s own channel and set the title, description, tags, category, privacy status, and Made for Kids value the creator chose. This is the narrowest scope documented for `videos.insert`. A read-only scope cannot upload.

**`https://www.googleapis.com/auth/youtube.readonly`**

Clip Engine uses `https://www.googleapis.com/auth/youtube.readonly` to call `channels.list` (`mine=true`) and show the creator which YouTube channel is connected before anything is uploaded, and to call `videos.list` for processing status and the creator’s own video statistics on posts they published through the app. The upload scope is not documented as sufficient for those read calls, and we do not request the broader `youtube` or `youtube.force-ssl` scopes that would allow deleting videos or managing comments.

### Why this is not a Restricted-scope / CASA case (as we understand it)

We are not requesting Gmail, Drive, or other scopes commonly marked Restricted. Confirm the Data Access page classification when you add the two YouTube scopes. If Console marks either Restricted, pause and review [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) (a third-party CASA assessment may be required).

## B. YouTube Audit and Quota Extension Form

**Reason for request**

If you want any increase (optional headroom): “Complete a compliance audit to request for additional quota.”

If YouTube later emails you to re-audit and you do not need more quota: “Complete a compliance audit to keep current quota (requested to complete re-audit).”

There is no separate form option for “lift private-upload restriction.” Current `videos.insert` docs state unverified projects are not forced to private (see README). You do not need this form solely to make Shorts public.

| Field | Paste |
|---|---|
| Legal name of primary contact | `{OPERATOR_NAME}` |
| Organization legal name | `self` (the form says to write “self” if applying as an individual) |
| Main contact | `{OPERATOR_NAME}`, `{CONTACT_EMAIL}` |
| Technical contact | Same, unless you add another |
| Google Ads Customer IDs | Leave blank if you do not run ads through this project |
| Application name | Clip Engine |
| Main URL | `{APP_URL}` |
| Test login | If the review UI requires sign-in and you have no demo account, leave a note and point to the unlisted screencast in Section 6 (`{DEMO_VIDEO_URL}`). Do not invent placeholder passwords. |
| Google Cloud Project Number | `{GOOGLE_CLOUD_PROJECT_NUMBER}` (digits only) |
| Use case category | **Video Uploading & Account Management** |
| OAuth? | Yes |
| Endpoints | `videos.insert`, `channels.list`, `videos.list` |
| Total per-day quota (shared bucket; does **not** include `search.list` or `videos.insert`) | `10000` if you are not asking for more general units |

### Quota numbers to type

Current defaults (verified): 100 `videos.insert` / day, 100 `search.list` / day, 10,000 units / day for everything else.

Recommended first ask if the form requires an increase:

- `videos.insert`: **200** per day (headroom above a planned peak of about 12 Shorts/day across four channels at 3 posts each). If the form only has one “total per day” box for non-upload methods, enter **10000** and explain the upload ask in the justification.
- `search.list`: **100** (default; we do not use search)
- Other methods: **10000** (default)

If you do not want any increase, say so in the justification and enter the defaults.

### Detailed justification (paste)

Clip Engine is a web-based review-and-publish tool. A creator connects their own YouTube channel with OAuth, reviews each short clip in a queue, edits the title and description, chooses privacy status (public, unlisted, or private) and the Made for Kids declaration, and taps an explicit Post control. Only then do we call `videos.insert` to upload that file to the connected channel. We call `channels.list` so the UI can show which channel will receive the upload. We call `videos.list` to confirm processing and, later, to read statistics for videos the creator published through Clip Engine.

We do not upload without that approval. We do not modify the creator’s title or description after they submit. We do not scrape YouTube. We do not incentivize views, likes, comments, or subscribers. We do not show YouTube audiovisual content in a custom player as a substitute for YouTube. Authorized data is shown only to the authorizing creator. Tokens are stored only while the channel stays connected and are revoked and deleted when the creator disconnects.

This client is not child-directed. Creators who upload Made for Kids content must set that flag themselves on the review screen; we pass `status.selfDeclaredMadeForKids` through to `videos.insert`.

We comply with the YouTube API Services Terms of Service and Developer Policies, including privacy-policy requirements (the policy at `{APP_URL}/privacy` discloses YouTube API Services use, links to https://www.youtube.com/t/terms and https://policies.google.com/privacy, explains access/use/storage/sharing, and links to https://security.google.com/settings/security/permissions).

Quota request: we expect roughly 6 uploads/day in the first wave (two channels) and about 12/day when four channels are active, plus a small number of `channels.list` and `videos.list` calls. The default 100 `videos.insert`/day and 10,000 other units/day already cover that. [Choose one: “We are not requesting additional quota beyond the documented defaults (100 videos.insert/day and 10,000 other units/day).” OR “We request 200 videos.insert/day as modest headroom and 10,000 units/day for other methods. We are not requesting additional search.list quota.”]

### Evidence the form asks for

- OAuth flow screenshots: consent screen in English showing app name “Clip Engine”, the two scopes, and the address bar with `{GOOGLE_OAUTH_CLIENT_ID}`
- Upload interface screenshots: review queue, editable title/description, privacy picker, Post button, success state with video id
- Privacy Policy screenshots: the YouTube API Services section, Google Privacy Policy link, deletion/revocation language
- Demo video: `{DEMO_VIDEO_URL}` (unlisted YouTube), using `demo-video-script.md`

## C. Console checklist

1. Dedicated Google Cloud project (not shared with any other product). Enable YouTube Data API v3.
2. Create a Web application OAuth client. Authorized JavaScript origins and redirect URIs must be on `{APP_URL}`.
3. Remove unused/test OAuth clients from the project you submit.
4. Homepage publicly describes the app and links to Privacy and Terms without a menu.
5. Demo video: English consent flow, app name visible, client ID visible in the address bar, each requested scope used on screen.
