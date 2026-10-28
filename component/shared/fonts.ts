import { Fraunces, Inter, Poppins } from "next/font/google";

// The redesigned pages (dashboard, reports) are set in Poppins. Loaded once here
// so every page that uses it shares the same font files.
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// The front page's create-account screen (component/clientstart/ClientSignup.tsx): Inter for
// the text, Fraunces for the brand and the headings.
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
export const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"] });
