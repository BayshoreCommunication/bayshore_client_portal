"use client";

import Link from "next/link";
import { MotionConfig, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogIn,
  PhoneCall,
  Rocket,
  type LucideIcon,
} from "lucide-react";

// The first thing a visitor sees. One card leads the page: start onboarding, for someone new
// with no account yet. A client signs in from the button at the top. Under the card, what
// onboarding involves and what the portal holds.

// Each block rises into place a beat after the one before it.
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const inTurn: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

const eyebrowClass = "text-[11px] font-bold tracking-[0.1em] uppercase";

const ONBOARDING_POINTS = ["8 short steps — about 10 minutes", "No password needed", "Skip anything you're not sure about"];

// The way in for someone new: what onboarding is, what to expect, and the button — the whole
// card is the link.
const OnboardingCard = () => (
  <motion.div variants={rise}>
    <Link
      href="/onboarding"
      className="group grid items-center gap-7 rounded-2xl border border-[#ecd2a8] bg-white p-8 text-inherit no-underline shadow-[0_1px_3px_rgba(13,30,44,0.06),0_14px_36px_rgba(13,30,44,0.10)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#d99136] hover:shadow-[0_1px_3px_rgba(13,30,44,0.06),0_22px_48px_rgba(13,30,44,0.16)] max-sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fdf1df] text-[#d99136]">
            <Rocket size={22} strokeWidth={2} />
          </span>
          <div>
            <div className={`${eyebrowClass} text-[#b8771f]`}>New to BayShore?</div>
            <h2 className="font-serif text-[24px] leading-tight font-bold text-[#17242f]">Start onboarding</h2>
          </div>
        </div>

        <p className="mt-4 text-[14px] leading-[1.65] text-[#52636f]">Tell us about your website and accounts so we can get you set up.</p>

        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {ONBOARDING_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2 text-[13px] text-[#384b59]">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#fdf1df] text-[#b8771f]">
                <Check size={11} strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d99136] px-6 py-3.5 text-[14px] font-semibold whitespace-nowrap text-white transition-colors group-hover:bg-[#c5811f]">
        Start onboarding <ArrowRight size={16} strokeWidth={2.25} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  </motion.div>
);

const ONBOARDING_STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ClipboardList, title: "Tell us what you have", text: "Your website, domain, logo and the accounts you already use — one short question at a time." },
  { icon: KeyRound, title: "Give us access", text: "We show you where to click on each platform. You never type a password into the form." },
  { icon: PhoneCall, title: "We take it from there", text: "Your account manager follows up on anything you skipped and gets everything set up." },
];

const PORTAL_FEATURES: { icon: LucideIcon; text: string }[] = [
  { icon: LayoutDashboard, text: "See how your marketing is performing at a glance" },
  { icon: FileText, text: "Read your monthly performance reports" },
  { icon: CheckCircle2, text: "Review and approve content in one place" },
  { icon: Calendar, text: "Book time with your BayShore specialists" },
];

const WelcomePage = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-[#f2f5f3]">
        {/* The dark band: the name, and what this place is. The onboarding card sits half over its lower edge. */}
        <section className="relative overflow-hidden bg-[#0b1522] px-6 pb-36 text-white max-sm:pb-32">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-32 h-105 w-105 rounded-full bg-[#d99136]/14 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-40 h-120 w-120 rounded-full bg-[#2f5fd8]/12 blur-3xl" />

          <header className="relative mx-auto flex w-full max-w-270 items-center justify-between gap-4 py-5">
            <Link href="/" className="font-serif text-[24px] font-bold text-white no-underline">
              BayShore
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-[12.5px] font-semibold text-white no-underline transition-colors hover:border-white/50 hover:bg-white/6"
            >
              <LogIn size={14} strokeWidth={2.25} /> Sign in
            </Link>
          </header>

          <motion.div variants={inTurn} initial="hidden" animate="shown" className="relative mx-auto max-w-180 pt-14 text-center max-sm:pt-9">
            <motion.div variants={rise} className={`${eyebrowClass} text-[#d99136]`}>
              Client portal
            </motion.div>
            <motion.h1 variants={rise} className="mt-3 font-serif text-[44px] leading-[1.12] font-bold max-sm:text-[32px]">
              Welcome to BayShore
            </motion.h1>
            <motion.p variants={rise} className="mx-auto mt-4 max-w-140 text-[15px] leading-[1.65] text-[#9cb0c3] max-sm:text-[14px]">
              Reports, approvals, leads and services from your BayShore team, all in one place. New here? Start with onboarding below.
            </motion.p>
          </motion.div>
        </section>

        <main className="relative mx-auto -mt-24 w-full max-w-270 flex-1 px-6 pb-14">
          <motion.div variants={inTurn} initial="hidden" animate="shown" className="mx-auto max-w-225">
            <OnboardingCard />
          </motion.div>

          <motion.section
            variants={inTurn}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 rounded-2xl border border-[#e5e9e7] bg-white px-8 py-8 max-sm:px-6"
          >
            <motion.div variants={rise}>
              <div className={`${eyebrowClass} text-[#b8771f]`}>How onboarding works</div>
              <h2 className="mt-1.5 font-serif text-[24px] leading-tight font-bold text-[#17242f]">Three things, and we do the rest</h2>
            </motion.div>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {ONBOARDING_STEPS.map((step, index) => (
                <motion.li key={step.title} variants={rise} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fdf1df] text-[#d99136]">
                      <step.icon size={18} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.1em] text-[#8496a3] uppercase">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-[#17242f]">{step.title}</h3>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#657787]">{step.text}</p>
                </motion.li>
              ))}
            </ol>
          </motion.section>

          <motion.section variants={inTurn} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "-60px" }} className="mt-10">
            <motion.div variants={rise} className={`${eyebrowClass} text-center text-[#657787]`}>
              Inside your portal
            </motion.div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PORTAL_FEATURES.map((feature) => (
                <motion.div key={feature.text} variants={rise} className="flex items-center gap-3 rounded-xl border border-[#e5e9e7] bg-white px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0b1522] text-[#d99136]">
                    <feature.icon size={16} strokeWidth={2} />
                  </span>
                  <span className="text-[12.5px] leading-normal font-medium text-[#384b59]">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>

        <footer className="border-t border-[#e1e7e4] px-6 py-5 text-center text-[12px] text-[#8496a3]">BayShore Communication · Client portal</footer>
      </div>
    </MotionConfig>
  );
};

export default WelcomePage;
