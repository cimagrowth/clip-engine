# Scopes

Request only the scopes below. Do not add broader “future-proof” scopes. YouTube’s developer policies say an API client may request only scopes it currently uses.

Sensitivity (sensitive vs restricted) is labeled in Google Cloud Console when you add a scope on the Data Access page. Confirm the badge there before you submit. `youtube.upload` and `youtube.readonly` are YouTube Data API scopes and historically require sensitive-scope verification; they are not the well-known Restricted scopes (Gmail, Drive, etc.). A CASA security assessment is required only if Console marks a requested scope Restricted and the app accesses that data via a server. **Could not independently verify the Console badge for these two scopes without opening your project.**

## Google / YouTube — request these

### `https://www.googleapis.com/auth/youtube.upload`

Official description: “Manage your YouTube videos.” This is the narrowest scope listed for `videos.insert`.

**Why we need it:** After the creator approves a clip, Clip Engine calls YouTube Data API v3 `videos.insert` (`POST https://www.googleapis.com/upload/youtube/v3/videos`) to upload that Short to the connected channel and set the creator-chosen title, description, tags, category, privacy status, and Made for Kids declaration.

**Why a narrower scope is not enough:** There is no upload-only scope narrower than this. `youtube.readonly` cannot upload.

**Sources:** [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), [Upload a Video](https://developers.google.com/youtube/v3/guides/uploading_a_video)

### `https://www.googleapis.com/auth/youtube.readonly`

Official description: “View your YouTube account.”

**Why we need it:** After OAuth, Clip Engine calls `channels.list` with `mine=true` so the review screen can show which channel will receive the upload (title and thumbnail). YouTube’s developer policies require the client to identify the YouTube channel associated with an authorized request. After upload, `videos.list` may be used to read processing status and, later, the creator’s own video statistics for posts they published through Clip Engine.

**Why a narrower scope is not enough:** `youtube.upload` is documented for `videos.insert`, not as sufficient for `channels.list`. There is no channel-identity-only scope.

**Sources:** [YouTube Data API scopes](https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps), [Developer Policies §III.C / §III.E.3](https://developers.google.com/youtube/terms/developer-policies)

## Google / YouTube — do not request

| Scope | Why not |
|---|---|
| `https://www.googleapis.com/auth/youtube` | Full account management. Broader than upload + read. |
| `https://www.googleapis.com/auth/youtube.force-ssl` | Includes edit and permanent delete of videos, ratings, comments, and captions. Not needed. |
| `https://www.googleapis.com/auth/youtubepartner` | Content-owner / CMS partner features. Not a CMS partner workflow. |
| `https://www.googleapis.com/auth/youtubepartner-channel-audit` | Partner audit only. |
| `https://www.googleapis.com/auth/youtube.channel-memberships.creator` | Memberships. Unused. |

Optional later, only if you add that feature and re-verify: `thumbnails.set` also works with `youtube.upload` (no extra scope). Do not add Google Sign-In scopes (`openid`, `email`, `profile`) unless the app actually uses Google Sign-In besides YouTube OAuth. They are non-sensitive if you need them.

## TikTok — request these

Exact scope names from [Scopes Reference](https://developers.tiktok.com/docs/en/tiktok-api-scopes) (fetched 9 November 2026). Every scope you enable must appear in the demo video or review will stall.

### `user.info.basic`

Official: read profile info (open id, avatar, display name). User-facing: “Read your profile info (avatar, display name).”

**Why we need it:** TikTok’s Direct Post guidelines require the post screen to show the creator’s nickname so they know which account will receive the content. Clip Engine calls creator/user info and displays nickname and avatar before publish.

**Do not replace with** `user.info.profile` or `user.info.stats` — those add bio, verification, follower counts, and similar fields we do not show.

### `video.publish`

Official: “Directly post content to a user's TikTok profile.” User-facing: “Post content to TikTok.” Used by Direct Post (`/v2/post/publish/video/init/`) and Get Post Status.

**Why we need it:** After the creator previews the clip, edits the title, manually chooses privacy and interaction settings, sets commercial-content disclosure if needed, and consents, Clip Engine publishes to that creator’s TikTok profile and polls publish status.

### `video.upload`

Official: “Share content to creator's account as a draft to further edit and post in TikTok.” Used by inbox upload (`/v2/post/publish/inbox/video/init/`).

**Why we need it:** When the creator chooses “Send to TikTok inbox instead,” Clip Engine uploads a draft so they can finish caption, sounds, and publish inside the TikTok app. This is the fallback when they do not want Direct Post.

If you decide not to ship the inbox path before review, **remove `video.upload` from the app** rather than leaving it unused.

## TikTok — do not request

| Scope | Why not |
|---|---|
| `user.info.profile` | Bio, profile links, verification. Unused. |
| `user.info.stats` | Follower / like / video counts. Unused at audit time. |
| `video.list` | List public videos. Add later only if an in-app metrics view needs it. |
| `video.manage` | Edit or delete any of the user’s TikTok posts, including posts not made through Clip Engine. Far too broad. |

## Endpoints we will call (for the YouTube form)

- `videos.insert` — upload the approved Short (1 unit in the Video Uploads bucket; default 100/day)
- `channels.list` — show the connected channel (1 unit from the general 10,000)
- `videos.list` — confirm processing / later read the creator’s own stats (1 unit)

We will not call `search.list` or any write method other than `videos.insert`.
