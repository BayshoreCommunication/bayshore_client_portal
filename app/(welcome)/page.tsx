import type { Metadata } from "next";
import ClientSignup from "@/component/clientstart/ClientSignup";

export const metadata: Metadata = { title: "Welcome – BayShore Client Portal" };

// The front door: where someone who isn't signed in creates their account and goes through
// the onboarding steps, with "Log in" for those who already have one. A signed-in client
// never sees it — proxy.ts sends them on to their dashboard.
const HomePage = () => <ClientSignup />;

export default HomePage;
