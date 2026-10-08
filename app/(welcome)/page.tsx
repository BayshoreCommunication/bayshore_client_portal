import type { Metadata } from "next";
import WelcomePage from "@/component/auth/WelcomePage";

export const metadata: Metadata = { title: "Welcome – BayShore Client Portal" };

// The front door: where someone who isn't signed in chooses between starting onboarding and
// signing in. A signed-in client never sees it — proxy.ts sends them on to their dashboard.
const HomePage = () => <WelcomePage />;

export default HomePage;
