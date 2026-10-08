import Link from "next/link";
import "../globals.css";

// Pages anyone can open without signing in — for now, the onboarding form a new client
// starts from the sign-in page. No sidebar here: there is no account to show one for. The
// way back to signing in is at the top and again at the bottom, for those who already
// have an account.
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#e1e7e4] bg-white">
        <div className="mx-auto flex w-full max-w-310 items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="font-serif text-[22px] font-bold text-[#0b1522] no-underline">
            BayShore
          </Link>
          <div className="flex items-center gap-3 text-[12.5px] text-[#657787]">
            <span className="max-sm:hidden">Already have an account?</span>
            <Link
              href="/sign-in"
              className="rounded-lg border border-[#cbd6d0] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#17242f] no-underline transition-colors hover:border-[#0b1522]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-310 flex-1 px-6 pt-7 pb-10">{children}</main>

      <footer className="border-t border-[#e1e7e4] bg-white px-6 py-5 text-center text-[12.5px] text-[#657787]">
        Already a BayShore client?{" "}
        <Link href="/sign-in" className="font-semibold text-[#0b1522] underline underline-offset-[3px]">
          Sign in to your portal
        </Link>
      </footer>
    </div>
  );
};

export default PublicLayout;
