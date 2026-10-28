import { Suspense } from "react";
import SigninForm from "@/component/auth/SigninForm";
import { WelcomeShell } from "@/component/clientstart/WelcomeShell";

// Logging in: the same page as creating an account on the front page, with the sign-in form in
// the card. A client needs no pitch, so the left side welcomes them back and shows what is
// waiting inside (WelcomeShell's "signin" variant).
const SignInPage = () => {
  return (
    <WelcomeShell variant="signin" question="New to BayShore?" linkHref="/" linkLabel="Get started">
      <Suspense fallback={null}>
        <SigninForm />
      </Suspense>
    </WelcomeShell>
  );
};

export default SignInPage;
