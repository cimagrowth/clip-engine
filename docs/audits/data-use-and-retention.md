# Data use and retention

Paste this into form fields that ask how you use Google or TikTok user data. The hosted Privacy Policy at `{APP_URL}/privacy` says the same things in user-facing language.

## What we access

**YouTube (after the creator grants OAuth):** a refreshable access token; the connected channel’s id, title, and thumbnail (`channels.list`); upload responses (`videos.insert` returns a video id and metadata); and, when needed, processing status and the creator’s own video statistics (`videos.list`). We never ask for, collect, or store Google or YouTube passwords.

**TikTok (after the creator grants OAuth):** an access token and refresh token; open id, display name, and avatar (`user.info.basic`); creator posting limits and allowed privacy options from creator info; and publish ids / post status for content the creator approved.

**Content the creator already placed in Clip Engine:** the short video file, title, caption, chosen privacy, interaction settings, commercial-content disclosure, and campaign-rules text shown next to the clip.

## How we use it

We use this data only to:

- show the creator which YouTube channel or TikTok profile is connected
- let them review a clip, edit metadata, and approve a post
- upload or publish that clip to the account they connected
- show upload / publish status and the resulting post URL
- record post identifiers so the creator can later see status and (if they use it) view counts for posts they published through Clip Engine

We do not sell this data. We do not use it for advertising or remarketing. We do not use Google or TikTok user data to train general-purpose AI/ML models. We do not share Authorized YouTube data or TikTok profile data with anyone other than the authorizing creator (and processors that host Clip Engine, acting on our instructions).

## How long we keep it

| Data | Retention |
|---|---|
| OAuth access and refresh tokens | Stored only while the account stays connected. On disconnect we revoke the token and delete it as soon as possible, within 7 days. If the creator revokes access in Google Account settings, we delete related authorized data as soon as possible and within 30 days. |
| Channel / profile display fields (name, avatar, channel id, open id) | Refreshed while connected. Deleted within 30 days after disconnect. |
| YouTube authorized API data other than tokens and allowed analytics/statistics | Deleted or refreshed within 30 days, per YouTube API Services Developer Policies §III.E.4. |
| Rendered video files used for upload | Kept long enough to complete the approved upload. Deleted from working storage within 30 days after a successful post, or within 7 days of a deletion request. |
| Title, caption, privacy choice, post URL, platform post id, submission status | Kept so the creator can see what they published. Deleted within 7 days of an account-or-data deletion request (this does not delete the post on YouTube or TikTok). |
| View / like samples for posts the creator published through us | Sampled around 24 hours, 72 hours, and 7 days. Authorized statistics are re-checked at least every 30 days or deleted. |

## Security and user control

Tokens and media sit on the Clip Engine backend with transport encryption (HTTPS) and access limited to the service and the signed-in creator. The creator can disconnect YouTube or TikTok in Clip Engine. They can also revoke Google access at https://security.google.com/settings/security/permissions and TikTok app access in TikTok’s settings. Deleting data stored by Clip Engine does not delete videos already posted on YouTube or TikTok; those must be removed in those apps.

## Processors

Hosting, database, and file storage providers acting on our instructions (the dedicated Clip Engine project only). They are not permitted to use this data for their own purposes.

## Contact

Privacy questions: `{CONTACT_EMAIL}`
