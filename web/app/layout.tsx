import type { ReactNode } from "react";
import "./globals.css";

const APP_URL = "{APP_URL}";
const CONTACT_EMAIL = "{CONTACT_EMAIL}";

export const metadata = {
  title: {
    default: "Clip Engine",
    template: "%s · Clip Engine",
  },
  description:
    "Review your clips, approve each one, then publish to your own YouTube and TikTok accounts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav aria-label="Primary">
            <a className="brand" href={APP_URL}>
              Clip Engine
            </a>
            <a href={APP_URL}>Home</a>
            <a href={`${APP_URL}/privacy`}>Privacy Policy</a>
            <a href={`${APP_URL}/terms`}>Terms of Service</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>
            Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
