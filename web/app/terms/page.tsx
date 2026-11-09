const APP_URL = "{APP_URL}";
const CONTACT_EMAIL = "{CONTACT_EMAIL}";
const OPERATOR_NAME = "{OPERATOR_NAME}";
const EFFECTIVE_DATE = "{EFFECTIVE_DATE}";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="muted">Effective {EFFECTIVE_DATE}. Operator: {OPERATOR_NAME}.</p>
      <p>
        These terms govern your use of Clip Engine ({APP_URL}). If you do not
        agree, do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        Clip Engine lets you review short clips, edit titles and captions,
        choose privacy and related settings, and publish to YouTube or TikTok
        accounts you connect. You decide whether each clip is posted. Clip
        Engine does not promise any number of views, approvals, or earnings.
      </p>

      <h2>Your accounts and content</h2>
      <p>
        You must only connect accounts you are allowed to use. You must only
        upload or publish material you have the right to use, including any
        music, likeness, or source video. You are responsible for complying
        with each campaign’s rules, with YouTube and TikTok policies, and with
        applicable law (including commercial-content and paid-partnership
        disclosures).
      </p>
      <p>
        You keep ownership of your content. You grant {OPERATOR_NAME} a limited
        license to store, process, and transmit that content solely to operate
        Clip Engine for you (including uploading a clip after you approve it).
      </p>

      <h2>YouTube</h2>
      <p>
        Clip Engine uses YouTube API Services. By using Clip Engine’s YouTube
        features, you agree to be bound by the{" "}
        <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.
      </p>

      <h2>TikTok</h2>
      <p>
        By posting to TikTok through Clip Engine you also agree to TikTok’s{" "}
        <a href="https://www.tiktok.com/legal/page/us/terms-of-service/en">
          Terms of Service
        </a>
        ,{" "}
        <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en">
          Music Usage Confirmation
        </a>
        , and, when you mark content as branded, TikTok’s{" "}
        <a href="https://www.tiktok.com/legal/page/global/bc-policy/en">
          Branded Content Policy
        </a>
        .
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use Clip Engine to buy or fake views, likes, follows, or comments.</li>
        <li>Do not upload content you do not have rights to post.</li>
        <li>Do not attempt to bypass platform safety, privacy, or quota systems.</li>
        <li>Do not use Clip Engine if you are not allowed to form this contract (including if you are under 13).</li>
      </ul>

      <h2>Availability</h2>
      <p>
        The service is provided “as is.” Platforms may change their APIs,
        force posts private, reject uploads, or revoke access. We may change
        or discontinue Clip Engine at any time.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {OPERATOR_NAME} is not liable
        for lost profits, lost data, account enforcement by YouTube or TikTok,
        or indirect damages arising from your use of Clip Engine. Our total
        liability for claims relating to the service is limited to the amount
        you paid us for Clip Engine in the 12 months before the claim, or zero
        if you paid nothing.
      </p>

      <h2>Privacy</h2>
      <p>
        Our <a href={`${APP_URL}/privacy`}>Privacy Policy</a> describes how we
        handle information, including data from Google, YouTube, and TikTok
        APIs.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
