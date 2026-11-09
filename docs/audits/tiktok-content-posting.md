# TikTok Content Posting API — app review

Official pages checked 9 November 2026:

- [App Review Guidelines](https://developers.tiktok.com/doc/app-review-guidelines/) (updated 2026-08-04)
- [Content Sharing Guidelines / Direct Post UX](https://developers.tiktok.com/doc/content-sharing-guidelines) (updated 2026-08-04)
- [Scopes Reference](https://developers.tiktok.com/docs/en/tiktok-api-scopes)
- [Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [Inbox upload](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content)

## Risk you should know before you submit

TikTok’s review guidelines say apps **must not be for private or personal use**, **must not still be in development or testing**, and the website URL **cannot be only a landing page or login page**. Direct Post guidelines also say a client that is only “a utility tool to help upload contents to the account(s) you or your team manages” is **not acceptable**, and that clients should be intended for a wide audience.

Clip Engine is a creator review-and-post product. That is a legitimate Direct Post use (a creator publishes to their own profile after preview and consent). It is also, today, operated by one person across a few brand accounts. TikTok may reject the audit if reviewers treat it as a private upload utility or an unfinished app.

Mitigations that are honest, not decorative:

- Ship a real public homepage at `{APP_URL}` that explains the product (not a bare login).
- Put working Privacy and Terms links on that homepage without opening a menu.
- Record the demo against the real review-and-post UI in the Developer Portal **sandbox** (required for a first review).
- Describe creators posting to **their own** connected TikTok profiles after explicit approval — not bulk copying of other people’s videos and not silent posting to accounts they do not control.
- Do not claim a large public user base you do not have.

If review is refused as “personal use,” the compliant fallback is to keep using unaudited Direct Post (`SELF_ONLY`, 5 users / 24 hours) or inbox `video.upload` drafts that you finish in the TikTok app, until the product is clearly a finished creator-facing app.

Unaudited Direct Post remains private-only (`SELF_ONLY`) with a 5-user/24h cap until the audit passes. Audited and unaudited clients also share a per-creator daily post cap (typically around 15, and shared with other API clients).

## App details

| Field | Paste |
|---|---|
| App name | Clip Engine |
| App icon | Clip Engine mark. Do not use the TikTok logo or the word “TikTok” in the name. |
| Description | Clip Engine is a web app that helps creators review short clips they made from source videos they have the right to use, edit the caption, choose privacy and interaction settings, and post to their own TikTok profile. |
| Website URL | `{APP_URL}` |
| Privacy Policy | `{APP_URL}/privacy` |
| Terms of Service | `{APP_URL}/terms` |
| Platform | Web |
| Redirect URI | `{APP_URL}/api/tiktok/callback` (or the exact callback you register — it must match) |
| Products | Login Kit (to obtain tokens) + Content Posting API |
| Scopes | `user.info.basic`, `video.publish`, `video.upload` (remove `video.upload` if you will not demo inbox drafts) |

## How each product and scope is used (App review text)

Paste:

Clip Engine is a web application where a signed-in creator reviews a short clip, edits the title, and explicitly chooses to post it to their own TikTok account.

Login Kit: the creator signs in with TikTok and grants only the scopes listed below. We store tokens so they do not have to log in for every post, and they can disconnect at any time.

`user.info.basic`: we read the creator’s open id, display name, and avatar and show the nickname on the Post to TikTok screen so they can see which account will receive the clip. We also read creator posting info (whether they can post right now, allowed `privacy_level_options`, interaction defaults that TikTok has disabled, and `max_video_post_duration_sec`) and we block the post if TikTok says they cannot post or if the clip is too long.

`video.publish` (Direct Post, `/v2/post/publish/video/init/`): after the creator previews the video, edits the title, manually selects a privacy status from the options TikTok returned (no pre-selected value), manually enables any of Allow Comment / Duet / Stitch they want (none checked by default; disabled options are greyed out), optionally turns on commercial-content disclosure (off by default), and agrees to the on-screen declaration, they tap Post. Only then do we send the video to TikTok and poll `/v2/post/publish/status/fetch/` (or handle status webhooks) so they can see progress. We tell them it may take a few minutes before the post is visible.

`video.upload` (inbox draft, `/v2/post/publish/inbox/video/init/`): if the creator chooses “Send to my TikTok inbox,” we upload a draft and tell them to open the TikTok notification and finish the post in the TikTok app.

We do not add a Clip Engine watermark or promotional logo to the video. Suggested titles are fully editable. We do not start sending media until the creator consents. For server-hosted files we use `PULL_FROM_URL` from a domain we have verified under URL Properties; we do not use `FILE_UPLOAD` for files that already live on our servers.

Commercial content: if the creator is posting paid or promotional material they can turn on the disclosure and choose “Your brand,” “Branded content,” or both. The declaration text then matches TikTok’s required wording (Music Usage Confirmation, and Branded Content Policy when branded content is selected). Branded content cannot be set to private / “only me.”

## Usage estimates (creator cap)

The audit form uses these estimates to set a 24-hour active-creator cap. Be conservative and honest.

| Period | Active creators / 24h | Posts / creator / 24h |
|---|---|---|
| First months | 2–4 (the operator’s connected brand profiles) | up to 3 |
| Later, if other creators use the product | Update TikTok if this grows; do not invent a large number now | still within TikTok’s per-creator cap (typically around 15, shared across API clients) |

## Demo video notes (TikTok-specific)

- First review: record from the Developer Portal **sandbox** integration.
- The domain shown in the video must match `{APP_URL}`.
- Show every enabled scope. If `video.upload` is enabled, show the inbox-draft path as well as Direct Post.
- Upload up to 5 videos, 50 MB each, in the App review section.
- Follow `demo-video-script.md` scenes T1–T8.

## UX checklist (ship this before you record)

From TikTok’s Direct Post guidelines:

- [ ] Post screen shows the creator nickname from the latest creator-info call
- [ ] If creator info says they cannot post, stop and tell them to try later
- [ ] Reject videos longer than `max_video_post_duration_sec`
- [ ] Title field is editable
- [ ] Privacy dropdown lists only `privacy_level_options` and has **no default selected**
- [ ] Comment / Duet / Stitch start unchecked; grey out any TikTok has disabled
- [ ] Preview of the exact video that will be posted
- [ ] Commercial disclosure toggle **off** by default; “Your brand” / “Branded content” behavior and notice strings match the guidelines
- [ ] Required consent line before Post: “By posting, you agree to TikTok's Music Usage Confirmation” (and Branded Content Policy when that option is on)
- [ ] Notice that processing may take a few minutes
- [ ] Status polling after Post
- [ ] No Clip Engine watermark on the video
- [ ] `client_secret` only on the server
- [ ] URL property verified if using `PULL_FROM_URL`
