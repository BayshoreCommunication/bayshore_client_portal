import { Poppins } from "next/font/google";

// The redesigned pages (dashboard, reports) are set in Poppins. Loaded once here
// so every page that uses it shares the same font files.
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
