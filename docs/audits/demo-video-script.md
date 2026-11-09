# Demo video script — review and post

Record in English. Use screen recording so the browser chrome is visible. You may narrate or add on-screen captions that call out each required beat. Target length: 6–9 minutes (you can split TikTok and YouTube into two files if needed).

Google: upload the finished file to YouTube as **Unlisted** and paste that URL into Verification Center. The consent screen must be toggled to English (control at the bottom left). The address bar on the Google consent page must show `{GOOGLE_OAUTH_CLIENT_ID}`. App name on screen: Clip Engine.

TikTok: also export a copy under 50 MB for the App review form. First-time review must show the **sandbox** integration. The site origin in the video must be `{APP_URL}`.

Do not record until the review UI actually works. A slide deck or mock will fail both reviews.

---

## Cold open (15 seconds)

**Show:** `{APP_URL}` homepage. Product name “Clip Engine,” a short description, and visible links to Privacy Policy and Terms (no menu).

**Say:** “This is Clip Engine, a web app where a creator reviews a short clip they made, edits the title, and approves a post to their own YouTube or TikTok account. Nothing is uploaded until they tap Post.”

---

## G1 — Connect YouTube (~90 seconds)

**Show:** Signed-in Clip Engine → Accounts → Connect YouTube.

**Say:** “The creator connects their own YouTube channel. Clip Engine requests only two scopes: upload videos, and read the channel so we can show which channel is connected.”

**Show, without cutting away:**

1. Google account picker (if it appears).
2. The full OAuth consent screen in English.
3. App name “Clip Engine.”
4. Browser address bar including `{GOOGLE_OAUTH_CLIENT_ID}`.
5. Scopes matching what you submitted (`youtube.upload` and `youtube.readonly`).
6. Allow.

**Show:** Return to Clip Engine. The connected channel title and thumbnail are visible.

**Say:** “We use the read-only scope here to call channels.list and display the destination channel. We are not asking for permission to delete videos or manage comments.”

---

## G2 — Review a clip (~90 seconds)

**Show:** Review queue. One pending Short.

On one screen, together:

- Video preview (the file that will be uploaded)
- Suggested title and description, then **edit** both (type a change)
- Privacy control: public / unlisted / private — pick one on camera
- Made for Kids: leave off unless the content is made for kids; say so
- Campaign / source rules text beside the player (“the creator can read the rules before they post”)

**Say:** “The creator has final control over title, description, and privacy. Clip Engine may suggest text but will not append anything after they submit. This clip was cut from source material the creator has the right to post.”

---

## G3 — Approve and upload (~60 seconds)

**Show:** Tap **Post to YouTube** (or Approve, then Post). A clear confirm that this will upload to the named channel with the chosen privacy.

**Say:** “The creator is giving explicit consent to upload this video now.”

**Show:** Progress, then success: YouTube video id and a link. Optionally open `videos.list` status or the YouTube Studio / watch page so the uploaded item is visible.

**Say:** “That upload used videos.insert with the youtube.upload scope. The privacy status you saw is the status we sent. We do not change visibility afterward unless the creator asks us to.”

---

## G4 — Disconnect YouTube (~30 seconds)

**Show:** Accounts → Disconnect YouTube (or Revoke). Mention the Privacy Policy link to https://security.google.com/settings/security/permissions.

**Say:** “The creator can disconnect in Clip Engine, which revokes the token, or revoke access in their Google Account settings.”

---

## T1 — Connect TikTok (~60 seconds)

**Show:** Accounts → Connect TikTok. Full TikTok authorization page showing `user.info.basic`, `video.publish`, and `video.upload` if you requested it.

**Say:** “The creator connects their own TikTok account. We ask for basic profile info so we can show who they are posting as, Direct Post so they can publish from this screen, and inbox upload if they would rather finish the post in the TikTok app.”

---

## T2 — Creator identity and limits (~30 seconds)

**Show:** Post to TikTok screen with nickname and avatar from the latest creator-info response.

**Say:** “We refresh creator info every time this screen loads. If TikTok said the creator could not post right now, we would stop and ask them to try later. We also check the clip against max video duration.”

---

## T3 — Direct Post metadata (~2 minutes)

**Show:**

- Preview of the exact clip
- Title field: edit it on camera
- Privacy status: dropdown with **nothing pre-selected**; pick one of the options TikTok returned
- Allow Comment, Duet, Stitch: all unchecked; enable one on camera (leave disabled ones greyed out if TikTok disabled them)
- Commercial content toggle: **off**. Turn it on briefly, show “Your brand” and “Branded content,” then set it back to the state you will actually post (for a paid campaign clip, select the truthful option and read the notice out loud)
- Consent line visible: “By posting, you agree to TikTok's Music Usage Confirmation” (add Branded Content Policy if branded content is on)
- Notice that the post may take a few minutes to process

**Say:** “There is no default privacy value. Interaction settings start off. We do not add a watermark. Media is not sent to TikTok until the creator taps Post.”

---

## T4 — Publish (~45 seconds)

**Show:** Tap Post. Status updates (processing / success). Mention polling publish status.

**Say:** “This call uses the video.publish scope to post to the creator’s TikTok profile.”

---

## T5 — Inbox draft, only if `video.upload` is enabled (~45 seconds)

**Show:** A second clip → choose “Send to my TikTok inbox” → success → tell them to open the TikTok notification and finish the post in the TikTok app.

**Say:** “This path uses video.upload. The creator completes publishing inside TikTok.”

---

## T6 — Close (~15 seconds)

**Show:** Homepage or Accounts screen again.

**Say:** “That is the full flow: the creator reviews the clip, controls the metadata, and approves the post. Clip Engine does not post without that approval.”

---

## Editing checklist

- [ ] English throughout
- [ ] Same app name and `{APP_URL}` as the submissions
- [ ] Google consent screen complete, English, client id visible
- [ ] Each Google scope used on camera
- [ ] Each TikTok scope used on camera
- [ ] Human taps Post; no silent background upload
- [ ] No passwords or secrets readable in the recording
