const APP_URL = "{APP_URL}";
const CONTACT_EMAIL = "{CONTACT_EMAIL}";
const OPERATOR_NAME = "{OPERATOR_NAME}";
const EFFECTIVE_DATE = "{EFFECTIVE_DATE}";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="muted">Effective {EFFECTIVE_DATE}. Operator: {OPERATOR_NAME}.</p>
      <p>
        This policy explains how Clip Engine ({APP_URL}) accesses, uses, stores,
        and shares information. By using Clip Engine you agree to this policy.
        It is the same policy linked from our homepage and from the Google OAuth
        consent screen.
      </p>

      <h2>Who we are</h2>
      <p>
        Clip Engine is operated by {OPERATOR_NAME}. Contact:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What Clip Engine does</h2>
      <p>
        Clip Engine is a review-and-publish tool. You review short clips you
        created from source videos you have the right to use, edit their titles
        and captions, choose privacy settings, and approve posts to YouTube
        channels and TikTok profiles you connect.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data you give us.</strong> Your email address or login
          identifier, and messages you send to {CONTACT_EMAIL}.
        </li>
        <li>
          <strong>Content you upload into Clip Engine.</strong> Video files,
          titles, captions, privacy choices, commercial-content disclosures, and
          related review notes.
        </li>
        <li>
          <strong>YouTube data, if you connect YouTube.</strong> After you grant
          access we receive an OAuth token and may read your channel id, title,
          and thumbnail, upload a video you approved, and read processing status
          and statistics for videos you published through Clip Engine.
        </li>
        <li>
          <strong>TikTok data, if you connect TikTok.</strong> After you grant
          access we receive an OAuth token and may read your open id, display
          name, and avatar, read whether you can post and which privacy options
          TikTok allows, and publish or draft a video you approved and then
          check its status.
        </li>
        <li>
          <strong>Technical logs.</strong> Standard server logs (IP address,
          user agent, timestamps) used to operate and secure the service.
        </li>
      </ul>
      <p>
        We do not ask for, collect, or store your Google, YouTube, or TikTok
        passwords. We do not collect information from children. Clip Engine is
        not directed at children under 13 (or the equivalent age in your
        country).
      </p>

      <h2>How we use information</h2>
      <p>We use this information only to:</p>
      <ul>
        <li>show you which YouTube channel or TikTok profile is connected</li>
        <li>let you review clips, edit metadata, and approve a post</li>
        <li>upload or publish that clip to the account you connected</li>
        <li>show post status and the resulting URL</li>
        <li>keep a record of posts you published through Clip Engine</li>
        <li>respond to your requests and keep the service secure</li>
      </ul>
      <p>
        We do not sell your information. We do not use it for advertising or
        remarketing. We do not use Google or TikTok user data to train
        general-purpose artificial intelligence or machine-learning models.
      </p>

      <h2>YouTube API Services</h2>
      <p>
        Clip Engine uses YouTube API Services. By using the YouTube features of
        Clip Engine you agree to be bound by the{" "}
        <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.
        Our use of information received from Google APIs also complies with the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
      <p>
        Google’s own practices are described in the{" "}
        <a href="https://policies.google.com/privacy">Google Privacy Policy</a>.
      </p>
      <p>
        In addition to disconnecting YouTube inside Clip Engine, you can revoke
        Clip Engine’s access to your Google Account at{" "}
        <a href="https://security.google.com/settings/security/permissions">
          Google’s security settings
        </a>
        .
      </p>

      <h2>TikTok</h2>
      <p>
        If you connect TikTok, Clip Engine uses TikTok Login Kit and the Content
        Posting API with the scopes you approve. TikTok’s practices are
        described in the{" "}
        <a href="https://www.tiktok.com/legal/page/us/privacy-policy/en">
          TikTok Privacy Policy
        </a>
        . You can revoke Clip Engine in TikTok’s app settings.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not share Authorized YouTube data or TikTok profile data with
        anyone other than you, except:
      </p>
      <ul>
        <li>
          processors that host Clip Engine (database, file storage, application
          hosting) and that may handle data only on our instructions
        </li>
        <li>YouTube or TikTok when you ask us to upload or publish a clip</li>
        <li>when required by law</li>
      </ul>
      <p>
        We do not let third parties serve advertisements in Clip Engine. We do
        not use advertising cookies.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only cookies or similar storage needed to keep you signed in and
        to operate the site (for example, a session cookie). We do not use them
        to advertise to you across other sites.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>
          OAuth tokens are stored only while your account stays connected. If
          you disconnect in Clip Engine we revoke the token and delete it as
          soon as possible, within 7 days.
        </li>
        <li>
          If you revoke access in your Google Account settings, we delete
          related authorized data as soon as possible and within 30 days.
        </li>
        <li>
          Channel or profile display data is refreshed while you stay connected
          and deleted within 30 days after disconnect.
        </li>
        <li>
          Other Authorized YouTube API data is deleted or refreshed within 30
          days, except tokens and statistics that YouTube’s policies allow us
          to keep longer while we reconfirm authorization at least every 30
          days.
        </li>
        <li>
          Video files used for an upload are deleted from working storage
          within 30 days after a successful post, or within 7 days of a
          deletion request.
        </li>
        <li>
          Titles, captions, privacy choices, and post URLs are kept so you can
          see what you published, and are deleted within 7 days of a deletion
          request.
        </li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You can disconnect YouTube or TikTok in Clip Engine, ask us to delete
        stored data related to you by emailing {CONTACT_EMAIL}, or revoke
        platform access as described above. Deleting data stored by Clip Engine
        does not delete videos already posted on YouTube or TikTok; remove
        those in YouTube or TikTok if you want them taken down. We will delete
        stored data as soon as possible and within 7 days of a request made to
        us.
      </p>

      <h2>Security</h2>
      <p>
        We use HTTPS and restrict access to tokens and media to the Clip Engine
        service and to you when you are signed in. No method of transmission or
        storage is completely secure.
      </p>

      <h2>Changes</h2>
      <p>
        If we change how we use data in a way this policy does not already
        cover, we will update this page and ask you to accept the new policy
        before those new uses begin.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or complaints:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
