import type { Metadata } from "next";
import ClientSignup from "@/component/clientstart/ClientSignup";

export const metadata: Metadata = { title: "Welcome – BayShore Client Portal" };

// The front door: where someone who isn't signed in creates their account and then, on this
// same page, goes through the onboarding steps — with "Log in" for those who already have an
// account. A client who arrives here already signed in never sees it: proxy.ts sends them on
// to their dashboard.
const HomePage = () => <ClientSignup />;

export default HomePage;
