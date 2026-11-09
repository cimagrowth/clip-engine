const APP_URL = "{APP_URL}";

export const metadata = {
  title: "Clip Engine",
};

export default function HomePage() {
  return (
    <>
      <h1>Clip Engine</h1>
      <p className="muted">Review your clips. You approve. Then we post to your accounts.</p>
      <p>
        Clip Engine is a web app that helps creators review short clips they made
        from source videos they have the right to use, edit the title and
        caption, choose privacy and audience settings, and publish those clips
        to their own YouTube and TikTok accounts.
      </p>
      <h2>How it works</h2>
      <ol>
        <li>Connect your own YouTube channel or TikTok profile.</li>
        <li>Open the review queue and watch the clip next to any rules that apply to it.</li>
        <li>Edit the title and caption. Suggested text is always editable.</li>
        <li>Choose visibility (and, on TikTok, interaction and commercial-content settings).</li>
        <li>Tap Post. Clip Engine uploads only after that approval, and only to the account you connected.</li>
      </ol>
      <p>
        Clip Engine does not post without your approval, does not buy views or
        engagement, and does not upload material you do not have rights to use.
      </p>
      <h2>Policies</h2>
      <p>
        Please read the{" "}
        <a href={`${APP_URL}/privacy`}>Privacy Policy</a> and{" "}
        <a href={`${APP_URL}/terms`}>Terms of Service</a> before connecting an
        account. By using Clip Engine you also agree to be bound by the{" "}
        <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.
      </p>
    </>
  );
}
