import "../globals.css";

// The front page has the whole screen to itself: no sidebar (nobody is signed in yet) and no
// split panel like the sign-in page — it is where both of those are reached from.
const WelcomeLayout = ({ children }: { children: React.ReactNode }) => children;

export default WelcomeLayout;
