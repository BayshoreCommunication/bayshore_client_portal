"use client";

import { Fragment, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, type HTMLMotionProps } from "framer-motion";
import { enterPortalAction, saveSignupAnswersAction, signUpAction, type SignupAnswers } from "@/app/actions/auth";
import { fraunces, poppins } from "@/component/shared/fonts";
import { BOOKING_URL } from "@/lib/booking";
import { ButtonArrow, Logo, WelcomeShell, suButtonClass, suFocusRing, suInputClass, suInputState } from "@/component/clientstart/WelcomeShell";

// A new client's way in, all of it on the front page: first the account, then — still on this
// page, and not signed in — five short steps, one at a time: the business, its goals, its
// website, its online accounts, and booking the kickoff call. Once those are done they are
// signed in, with the account they made at the start, and taken to their onboarding form. Each
// step is saved onto their record as it is finished (app/actions/auth.ts →
// saveSignupAnswersAction), and all of them once more at the end. The steps are built from the
// "BayShore Client Onboarding" mockup, the create-account screen from the "bayshore-signup-v3"
// design. The page itself forgets on a reload: the answers already saved stay on the record, but
// the page starts again from the first screen. The call itself is booked on a Google Calendar
// appointment schedule, shown inside the last step.

// ── What is asked ────────────────────────────────────────────────────────────

type StepId = "business" | "goals" | "website" | "accounts" | "book";
type FormStep = Exclude<StepId, "book">;
type Screen = "signup" | StepId;

const STEPS: { id: StepId; label: string; minutes: number }[] = [
  { id: "business", label: "Business", minutes: 2 },
  { id: "goals", label: "Goals", minutes: 1.5 },
  { id: "website", label: "Website", minutes: 1 },
  { id: "accounts", label: "Accounts", minutes: 1 },
  { id: "book", label: "Book call", minutes: 1 },
];

// Every typed answer, under the id of its field.
const BLANK_FIELDS = {
  "su-name": "",
  "su-email": "",
  "su-phone": "",
  "su-pw": "",
  "b-name": "",
  "b-desc": "",
  "b-cname": "",
  "b-cemail": "",
  "b-phone": "",
  "g-crev": "",
  "g-grev": "",
  "g-cleads": "",
  "g-gleads": "",
  "g-csales": "",
  "g-gsales": "",
  "g-cpl": "",
  "g-value": "",
  "w-url": "",
  "w-domain": "",
  "w-registrar": "",
};
type FieldId = keyof typeof BLANK_FIELDS;

// The questions answered by picking one option.
type Group = "b-reach" | "g-time" | "g-budget" | "w-has" | "w-plan" | "w-build" | "w-dom";
type Option = [value: string, label: string];

const same = (values: string[]): Option[] => values.map((value) => [value, value]);
const REACH = same(["Email", "Phone call", "Text message"]);
const TIMEFRAMES = same(["3 months", "6 months", "12 months", "Not sure"]);
const BUDGETS: Option[] = [
  ["Under $1,000", "Under $1,000"],
  ["$1,000–$3,000", "$1k–$3k"],
  ["$3,000–$5,000", "$3k–$5k"],
  ["$5,000–$10,000", "$5k–$10k"],
  ["$10,000+", "$10k+"],
  ["Not sure yet", "Not sure yet"],
];
const YES_NO: Option[] = [
  ["yes", "Yes"],
  ["no", "No"],
];
const HAVE: Option[] = [
  ["have", "I have it"],
  ["dont", "I don't have it"],
  ["unsure", "Not sure"],
];
const CREATE: Option[] = [
  ["yes", "Yes, create it"],
  ["no", "No, I'll do it"],
];

const SERVICE_IDEAS = ["Car accidents", "Truck accidents", "Slip and fall", "Workers' comp"];
const AREA_IDEAS = ["Tampa", "St. Petersburg", "Clearwater", "Hillsborough County"];
const SOURCES = ["Referrals", "Google search", "Google Maps", "Paid ads", "Social media", "Other"];
const WEBSITE_PLANS: Record<string, string> = { keep: "Keep current site", redesign: "Redesign", unsure: "Not sure yet" };

type AccountGroup = "Local" | "Social" | "Tracking" | "Ads";
// `placeholder` is what to type for an account they have; none means there is nothing to give.
const ACCTS: { group: AccountGroup; key: string; name: string; placeholder: string | null }[] = [
  { group: "Local", key: "gbp", name: "Google Business Profile", placeholder: "Business name as it shows on Google Maps" },
  { group: "Social", key: "fb", name: "Facebook Page", placeholder: "facebook.com/…" },
  { group: "Social", key: "ig", name: "Instagram", placeholder: "@username" },
  { group: "Social", key: "li", name: "LinkedIn Company Page", placeholder: "linkedin.com/company/…" },
  { group: "Tracking", key: "ga", name: "Google Analytics", placeholder: null },
  { group: "Tracking", key: "gsc", name: "Google Search Console", placeholder: null },
  { group: "Ads", key: "gads", name: "Google Ads", placeholder: "Customer ID (optional)" },
  { group: "Ads", key: "meta", name: "Meta Ads (Facebook / Instagram)", placeholder: "Ad account ID (optional)" },
];

// ── The answers ──────────────────────────────────────────────────────────────

type State = {
  screen: Screen;
  // A skipped step counts as done too, so it can be gone back to.
  done: StepId[];
  skipped: StepId[];
  // Whether the client says they booked the call: Google's calendar doesn't tell this page.
  booked: boolean;
  // The accounts the team was asked to create, as of the last time the step was left.
  tasks: string[];
  f: Record<FieldId, string>;
  terms: boolean;
  me: boolean;
  pick: Partial<Record<Group, string>>;
  services: string[];
  areas: string[];
  sources: string[];
  accts: Record<string, string>;
  setup: Record<string, string>;
  links: Record<string, string>;
};

const BLANK: State = {
  screen: "signup",
  done: [],
  skipped: [],
  booked: false,
  tasks: [],
  f: BLANK_FIELDS,
  terms: false,
  me: true,
  pick: {},
  services: [],
  areas: [],
  sources: [],
  accts: {},
  setup: {},
  links: {},
};

type Errors = Record<string, string>;
type Changes = Partial<State> | ((now: State) => Partial<State>);

// What the screens share: the answers, what is wrong with them, and the ways to change them
// and to move on.
type Flow = {
  s: State;
  errors: Errors;
  patch: (changes: Changes) => void;
  setField: (id: FieldId, value: string) => void;
  setPick: (group: Group, value: string) => void;
  go: (screen: Screen) => void;
  next: (step: FormStep) => void;
  skip: (step: FormStep) => void;
  skipAll: () => void;
  back: () => void;
  signUp: () => void;
  // Saves the steps named onto the client's record — as the answers stand, with `changes`
  // on top of them where they are only just being made.
  save: (steps: StepId[], changes?: Partial<State>) => void;
  // Signs them in with the account they made at the start, and takes them to their onboarding form.
  enter: () => void;
  // They are being signed in just now.
  entering: boolean;
  // The account is being created just now.
  creating: boolean;
  say: (message: string) => void;
};

const val = (s: State, id: FieldId) => s.f[id].trim();
const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const urlOk = (value: string) => /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/.test(value);
const URL_PROBLEM = "Enter your website address, like https://yourfirm.com.";
const money = (value: string | number) => `$${Math.round(+value).toLocaleString("en-US")}`;
const withStep = (list: StepId[], id: StepId) => (list.includes(id) ? list : [...list, id]);
const isMissing = (answer?: string) => answer === "dont" || answer === "unsure";
// The accounts the client asked us to create.
const setupList = (s: Pick<State, "accts" | "setup">) =>
  ACCTS.filter((acct) => isMissing(s.accts[acct.key]) && s.setup[acct.key] === "yes").map((acct) => acct.name);

const nextOf = (step: StepId): Screen => STEPS[STEPS.findIndex((entry) => entry.id === step) + 1]?.id ?? "book";
const prevOf = (screen: Screen): Screen => {
  const index = STEPS.findIndex((entry) => entry.id === screen);
  return index > 0 ? STEPS[index - 1].id : "business";
};

// ── The answers as the backend keeps them ───────────────────────────────────

// The form's own words for a choice, against the backend's (models/client.model.ts).
const REACH_BY: Record<string, string> = { Email: "email", "Phone call": "phone", "Text message": "text" };
const TIMEFRAME: Record<string, string> = { "3 months": "3_months", "6 months": "6_months", "12 months": "12_months", "Not sure": "unsure" };
const BUDGET: Record<string, string> = {
  "Under $1,000": "under_1000",
  "$1,000–$3,000": "1000_3000",
  "$3,000–$5,000": "3000_5000",
  "$5,000–$10,000": "5000_10000",
  "$10,000+": "over_10000",
  "Not sure yet": "unsure",
};
const LEAD_SOURCE: Record<string, string> = { Referrals: "referrals", "Google search": "google_search", "Google Maps": "google_maps", "Paid ads": "paid_ads", "Social media": "social_media", Other: "other" };
const HAS: Record<string, string> = { have: "yes", dont: "no", unsure: "unsure" };
// Where each account's answer goes on the record: the section, and the account's name in it.
const ACCOUNT_PLACE: Record<string, [section: "google" | "social", name: string]> = {
  gbp: ["google", "businessProfile"],
  ga: ["google", "analytics"],
  gsc: ["google", "searchConsole"],
  gads: ["google", "ads"],
  fb: ["social", "facebook"],
  ig: ["social", "instagram"],
  li: ["social", "linkedin"],
  meta: ["social", "metaAds"],
};

// What the steps named hold, as sections of the client's onboarding answers (client.onboarding).
// A step that isn't named sends nothing, so what the record has for it is left as it is.
const toBackend = (s: State, steps: StepId[]): SignupAnswers => {
  const text = (id: FieldId) => val(s, id) || undefined;
  const number = (id: FieldId) => (val(s, id) === "" ? undefined : +val(s, id));
  const answers: Record<string, unknown> = {};

  if (steps.includes("business")) {
    answers.business = {
      description: text("b-desc"),
      services: s.services,
      areas: s.areas,
      contact: {
        isAccountOwner: s.me,
        name: text("b-cname"),
        email: text("b-cemail"),
        // Without the formatting, as the backend stores it.
        phone: val(s, "b-phone").replace(/[\s\-().]/g, "") || undefined,
        reachBy: REACH_BY[s.pick["b-reach"] ?? ""],
      },
    };
  }
  if (steps.includes("goals")) {
    answers.goals = {
      revenue: { current: number("g-crev"), goal: number("g-grev") },
      leads: { current: number("g-cleads"), goal: number("g-gleads") },
      newClients: { current: number("g-csales"), goal: number("g-gsales") },
      timeframe: TIMEFRAME[s.pick["g-time"] ?? ""],
      budget: BUDGET[s.pick["g-budget"] ?? ""],
      costPerLead: number("g-cpl"),
      clientValue: number("g-value"),
      leadSources: s.sources.map((source) => LEAD_SOURCE[source]).filter(Boolean),
    };
  }
  if (steps.includes("website")) {
    // A domain is only asked about when we are to build the website. Otherwise it goes as
    // empty, so a domain given before they changed their mind doesn't stay on the record.
    answers.domain = {};
    if (s.pick["w-has"] === "yes") {
      // Keeping the site as it is means no new one is needed.
      answers.website = { url: text("w-url"), need: { keep: "no", redesign: "redesign", unsure: "unsure" }[s.pick["w-plan"] ?? ""] };
    } else if (s.pick["w-has"] === "no") {
      const build = s.pick["w-build"] === "yes";
      answers.website = { hasNone: true, need: build ? "new" : s.pick["w-build"] === "no" ? "no" : undefined };
      if (build && s.pick["w-dom"]) {
        const owns = s.pick["w-dom"] === "yes";
        answers.domain = { has: s.pick["w-dom"], name: owns ? text("w-domain") : undefined, platform: owns ? text("w-registrar") : undefined };
      }
    }
  }
  if (steps.includes("accounts")) {
    const sections: Record<"google" | "social", Record<string, unknown>> = { google: {}, social: {} };
    for (const acct of ACCTS) {
      const answer = s.accts[acct.key];
      if (!answer) continue;
      const [section, name] = ACCOUNT_PLACE[acct.key];
      sections[section][name] = {
        has: HAS[answer],
        link: answer === "have" ? s.links[acct.key]?.trim() || undefined : undefined,
        wantsCreated: isMissing(answer) && s.setup[acct.key] ? s.setup[acct.key] === "yes" : undefined,
      };
    }
    answers.google = sections.google;
    answers.social = sections.social;
  }
  if (steps.includes("book")) answers.kickoffCall = { booked: s.booked };

  // The business's name is the client's own company name.
  return { ...(steps.includes("business") && val(s, "b-name") ? { companyName: val(s, "b-name") } : {}), answers };
};

// ── What is wrong with a screen's answers, by field ──────────────────────────

const checkSignup = (s: State) => {
  const problems: Errors = {};
  const password = s.f["su-pw"];
  if (!val(s, "su-name")) problems["su-name"] = "Enter your full name.";
  if (!emailOk(val(s, "su-email"))) problems["su-email"] = "Enter a valid email, like you@yourfirm.com.";
  if (val(s, "su-phone").replace(/\D/g, "").length < 10) problems["su-phone"] = "Enter a 10-digit phone number.";
  if (!/^(?=.*\d).{8,}$/.test(password)) problems["su-pw"] = "Use at least 8 characters, including 1 number.";
  if (!s.terms) problems["su-terms"] = "Please agree to the Terms and Privacy Policy to continue.";
  return problems;
};

const CHECKS: Record<FormStep, (s: State) => Errors> = {
  business: (s) => {
    const problems: Errors = {};
    if (!val(s, "b-name")) problems["b-name"] = "Enter your business name.";
    if (!val(s, "b-desc")) problems["b-desc"] = "Add a short description of your business.";
    // A yes needs the website's address too.
    if (!s.pick["w-has"]) problems["w-has"] = "Choose Yes or No.";
    else if (s.pick["w-has"] === "yes" && !urlOk(val(s, "w-url"))) problems["w-url"] = URL_PROBLEM;
    if (!s.services.length) problems["b-services"] = "Add at least one service.";
    if (!s.areas.length) problems["b-areas"] = "Add at least one area you serve.";
    if (!val(s, "b-cname")) problems["b-cname"] = "Enter the main contact's name.";
    if (!emailOk(val(s, "b-cemail"))) problems["b-cemail"] = "Enter a valid email.";
    if (val(s, "b-phone").replace(/\D/g, "").length < 10) problems["b-phone"] = "Enter a 10-digit phone number.";
    if (!s.pick["b-reach"]) problems["b-reach"] = "Choose how we should reach you.";
    return problems;
  },
  goals: (s) => {
    const problems: Errors = {};
    // `required` is what to say when the field is empty; without it, empty is fine.
    const number = (id: FieldId, required?: string) => {
      const value = val(s, id);
      if (value === "") {
        if (required) problems[id] = required;
      } else if (+value < 0 || Number.isNaN(+value)) problems[id] = "Use 0 or more.";
    };
    number("g-crev", "Enter your rough monthly revenue.");
    number("g-grev", "Enter your revenue goal.");
    number("g-cleads", "Enter a rough number.");
    number("g-gleads", "Enter your goal.");
    number("g-csales", "Enter a rough number.");
    number("g-gsales", "Enter your goal.");
    number("g-cpl");
    number("g-value");
    if (!s.pick["g-time"]) problems["g-time"] = 'Choose a timeframe, or "Not sure".';
    if (!s.pick["g-budget"]) problems["g-budget"] = 'Choose a budget range, or "Not sure yet".';
    return problems;
  },
  website: (s) => {
    const problems: Errors = {};
    const has = s.pick["w-has"];
    if (!has) problems["w-has"] = "Choose Yes or No.";
    if (has === "yes") {
      if (!urlOk(val(s, "w-url"))) problems["w-url"] = URL_PROBLEM;
      if (!s.pick["w-plan"]) problems["w-plan"] = "Choose what you'd like to do with your site.";
    }
    if (has === "no") {
      if (!s.pick["w-build"]) problems["w-build"] = "Choose one option.";
      // A domain is only asked about when we are to build the website.
      if (s.pick["w-build"] === "yes") {
        if (!s.pick["w-dom"]) problems["w-dom"] = "Let us know if you own a domain.";
        else if (s.pick["w-dom"] === "yes") {
          if (!val(s, "w-domain")) problems["w-domain"] = "Enter your domain, like yourfirm.com.";
          if (!val(s, "w-registrar")) problems["w-registrar"] = "Tell us where it is registered, like GoDaddy.";
        }
      }
    }
    return problems;
  },
  accounts: () => ({}),
};

// ── Looks ────────────────────────────────────────────────────────────────────

// The page keeps to the mockup's widths: the bar, the steps and each screen are held to 1080px
// in the middle of the window, and the card the account is created in to 960px.
const widthClass = "mx-auto w-full max-w-270";
const cardClass = "rounded-2xl border border-[#e1e7e3] bg-white shadow-[0_1px_2px_rgba(22,33,42,0.04),0_6px_20px_rgba(22,33,42,0.05)]";
const titleClass = "text-[clamp(22px,3.4vw,29px)] leading-[1.2] font-semibold tracking-[-0.2px] text-balance";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8892f]";
// The same ring drawn inside the button, for buttons whose container would cut it off.
const focusRingInside = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#b8892f]";
// A field turns red when the Field around it has something wrong.
const fieldClass =
  "w-full rounded-[9px] border border-[#cdd6d1] bg-white px-3 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#b8892f] focus:ring-3 focus:ring-[#f7f0e1] group-data-[invalid]/field:border-[#b42318]!";
const inputClass = `${fieldClass} min-h-11`;
const labelClass = "text-[13.5px] font-medium";
const helpClass = "text-[12.5px] text-[#5b6a72]";
const capsClass = "text-[12px] font-semibold tracking-[1.3px] text-[#5b6a72] uppercase";
const linkButton = `cursor-pointer text-[13px] text-[#5b6a72] underline ${focusRing}`;
const layoutClass = "grid grid-cols-[minmax(0,1fr)_290px] items-start gap-6 max-[900px]:grid-cols-1";
// Stays in view under the page's own header, which is stuck to the top of the window.
const railClass = "sticky top-23 flex flex-col gap-3.5 max-[900px]:static max-[900px]:grid max-[900px]:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]";
const sectionClass = "flex flex-col gap-4 px-6.5 py-6 max-[700px]:px-4.5";
const gridClass = "grid grid-cols-2 gap-x-4.5 gap-y-4 max-[700px]:grid-cols-1";

const BUTTON = {
  primary: "bg-[#16212a] text-white hover:bg-[#22313b]",
  ghost: "border border-[#cdd6d1] bg-white",
  gold: "bg-[#b8892f] text-white disabled:cursor-not-allowed disabled:bg-[#cdd6d1] disabled:text-[#5b6a72]",
};

const ICONS = {
  building: <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r=".6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M2 20h20" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  brush: (
    <>
      <path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z" />
      <path d="M4 20l2.5-2.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  megaphone: <path d="M3 10v4h4l6 4V6L7 10zM17 9a4 4 0 0 1 0 6" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.8.6 3 2.3 3.5 5" />
    </>
  ),
};
type IconName = keyof typeof ICONS;

const GROUP_ICONS: Record<AccountGroup, IconName> = { Local: "pin", Social: "people", Tracking: "chart", Ads: "megaphone" };

// ── Small pieces ─────────────────────────────────────────────────────────────

const Icon = ({ name, className = "size-4.5" }: { name: IconName; className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}>
    {ICONS[name]}
  </svg>
);

// Opens and closes its content by growing and shrinking.
const Reveal = ({ open, className = "", children }: { open: boolean; className?: string; children: ReactNode }) => (
  <AnimatePresence initial={false}>
    {open ? (
      <motion.div
        key="content"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    ) : null}
  </AnimatePresence>
);

// A question and its answer, with what is wrong with the answer under it.
const Field = ({ error, className = "", children }: { error?: string; className?: string; children: ReactNode }) => (
  <div data-invalid={error ? "" : undefined} className={`group/field flex min-w-0 flex-col gap-1.5 ${className}`}>
    {children}
    {error ? (
      <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="text-[12.5px] text-[#b42318]">
        {error}
      </motion.p>
    ) : null}
  </div>
);

const TextField = ({
  flow,
  id,
  label,
  children,
  ...input
}: { flow: Flow; id: FieldId; label: ReactNode; children?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) => (
  <Field error={flow.errors[id]}>
    <label htmlFor={id} className={labelClass}>
      {label}
    </label>
    <input id={id} type="text" className={inputClass} value={flow.s.f[id]} onChange={(event) => flow.setField(id, event.target.value)} {...input} />
    {children}
  </Field>
);

const NumberInput = ({ flow, id, placeholder, dollars = false, big = false }: { flow: Flow; id: FieldId; placeholder: string; dollars?: boolean; big?: boolean }) => {
  const input = (
    <input
      id={id}
      type="number"
      min={0}
      inputMode="numeric"
      placeholder={placeholder}
      className={`${inputClass} ${big ? "text-[18px] font-semibold tabular-nums" : ""} ${dollars ? "pl-6.5" : ""}`}
      value={flow.s.f[id]}
      onChange={(event) => flow.setField(id, event.target.value)}
    />
  );
  if (!dollars) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#5b6a72]">$</span>
      {input}
    </div>
  );
};

const Btn = ({
  tone = "primary",
  small = false,
  block = false,
  className = "",
  ...rest
}: { tone?: keyof typeof BUTTON; small?: boolean; block?: boolean } & HTMLMotionProps<"button">) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[9px] font-medium transition-colors duration-150 ${small ? "min-h-9 px-3.5 py-1.75 text-[13px]" : "min-h-11 px-6 py-2.75"} ${block ? "w-full" : ""} ${BUTTON[tone]} ${focusRing} ${className}`}
    {...rest}
  />
);

// One answer out of a few, as a row of buttons.
const Pills = ({ options, value, onPick }: { options: Option[]; value?: string; onPick: (value: string) => void }) => (
  <div className="flex flex-wrap gap-2 rounded-[10px] border border-transparent group-data-[invalid]/field:border-[#b42318]">
    {options.map(([option, label]) => (
      <button
        key={option}
        type="button"
        aria-pressed={value === option}
        onClick={() => onPick(option)}
        className={`cursor-pointer rounded-[9px] border px-3.5 py-2.25 text-[13px] font-medium transition-colors duration-150 ${value === option ? "border-[#16212a] bg-[#16212a] text-white" : "border-[#cdd6d1] bg-white hover:border-[#2d3f4b]"} ${focusRing}`}
      >
        {label}
      </button>
    ))}
  </div>
);

// The same, as one joined control. The gold one is for "shall we create it?".
const Seg = ({ options, value, onPick, label, gold = false }: { options: Option[]; value?: string; onPick: (value: string) => void; label?: string; gold?: boolean }) => (
  <div role="group" aria-label={label} className="inline-flex justify-self-start overflow-hidden rounded-[9px] border border-[#cdd6d1] bg-white">
    {options.map(([option, text]) => (
      <button
        key={option}
        type="button"
        aria-pressed={value === option}
        onClick={() => onPick(option)}
        className={`cursor-pointer border-l border-[#cdd6d1] px-3 py-1.75 text-[12.5px] whitespace-nowrap transition-colors duration-150 first:border-l-0 ${value === option ? (gold ? "bg-[#b8892f] text-white" : "bg-[#16212a] text-white") : ""} ${focusRingInside}`}
      >
        {text}
      </button>
    ))}
  </div>
);

// The same, as a card with an icon.
const Choice = ({ icon, title, note, big = false, pressed, onClick }: { icon: IconName; title: string; note?: string; big?: boolean; pressed: boolean; onClick: () => void }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.98 }}
    aria-pressed={pressed}
    onClick={onClick}
    className={`flex min-w-0 cursor-pointer rounded-[13px] border-[1.5px] text-left transition-colors duration-150 ${big ? "flex-row items-center gap-3.5 px-4.5 py-5.5" : "flex-col gap-1.5 p-4"} ${pressed ? "border-[#b8892f] bg-[#f7f0e1] shadow-[inset_0_0_0_1px_#b8892f]" : "border-[#cdd6d1] bg-white group-data-[invalid]/field:border-[#b42318] hover:border-[#2d3f4b]"} ${focusRing}`}
  >
    <span className={`grid size-8.5 flex-none place-items-center rounded-[9px] border transition-colors duration-150 ${pressed ? "border-[#b8892f] bg-[#b8892f] text-white" : "border-[#e1e7e3] bg-[#f8faf9] text-[#16212a]"}`}>
      <Icon name={icon} />
    </span>
    <strong className={big ? "text-[16px]" : "text-[14.5px]"}>{title}</strong>
    {note ? <span className="text-[12.5px] text-[#5b6a72]">{note}</span> : null}
  </motion.button>
);

const Cards = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">{children}</div>;

// A list typed one item at a time: Enter or a comma adds what is typed, Backspace on an empty
// box takes the last one off, and the suggestions under it add themselves.
const TagInput = ({
  id,
  values,
  onChange,
  ideas,
  placeholder,
  gold = false,
}: {
  id: string;
  values: string[];
  onChange: (change: (list: string[]) => string[]) => void;
  ideas: string[];
  placeholder: string;
  gold?: boolean;
}) => {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const left = ideas.filter((idea) => !values.includes(idea));

  const add = (text: string) => {
    const fresh = text.split(",").map((item) => item.trim()).filter(Boolean);
    if (fresh.length) onChange((list) => [...new Set([...list, ...fresh])]);
  };
  const addDraft = () => {
    add(draft);
    setDraft("");
  };

  return (
    <>
      <div
        onClick={(event) => {
          if (event.target === event.currentTarget) input.current?.focus();
        }}
        className="flex min-h-11 flex-wrap content-start gap-1.5 rounded-[9px] border border-[#cdd6d1] bg-white p-1.5 transition-[border-color,box-shadow] duration-150 group-data-[invalid]/field:border-[#b42318]! focus-within:border-[#b8892f] focus-within:ring-3 focus-within:ring-[#f7f0e1]"
      >
        <AnimatePresence initial={false}>
          {values.map((value) => (
            <motion.span
              key={value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={`inline-flex items-center gap-1 rounded-md py-0.75 pr-1 pl-2.25 text-[13px] font-medium ${gold ? "border border-[#ead9b2] bg-[#f7f0e1] text-[#7a5a17]" : "bg-[#16212a] text-white"}`}
            >
              <span>{value}</span>
              <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange((list) => list.filter((item) => item !== value))} className={`cursor-pointer px-1 text-[15px] leading-none opacity-60 hover:opacity-100 ${focusRing}`}>
                ×
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={input}
          id={id}
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={addDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addDraft();
            } else if (event.key === "Backspace" && !draft && values.length) onChange((list) => list.slice(0, -1));
          }}
          className="min-h-7.5 min-w-27.5 flex-1 bg-transparent px-1.5 py-1 outline-none"
        />
      </div>
      {left.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-[#5b6a72]">Add:</span>
          {left.map((idea) => (
            <button key={idea} type="button" onClick={() => add(idea)} className={`cursor-pointer rounded-full border border-dashed border-[#cdd6d1] px-2.5 py-0.75 text-[12px] text-[#5b6a72] transition-colors duration-150 hover:border-[#b8892f] hover:text-[#7a5a17] ${focusRing}`}>
              {idea}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
};

// `action` sits to the right of the title.
const Head = ({ eyebrow, title, action, children }: { eyebrow: string; title: ReactNode; action?: ReactNode; children?: ReactNode }) => (
  <div className="mb-5.5 flex items-end justify-between gap-4">
    <div className="max-w-170 min-w-0">
      <p className="mb-1.5 text-[11px] font-semibold tracking-[1.6px] text-[#7a5a17] uppercase">{eyebrow}</p>
      <h1 className={`${titleClass} mb-2`}>{title}</h1>
      {children ? <p className="max-w-[62ch] text-[14.5px] text-[#5b6a72]">{children}</p> : null}
    </div>
    {action ? <div className="mb-2 flex-none">{action}</div> : null}
  </div>
);

// Beside the title of the steps that can be skipped: leaves them all and goes to booking the call.
const SkipAll = ({ flow }: { flow: Flow }) => (
  <Btn tone="ghost" small onClick={flow.skipAll}>
    Skip all <Icon name="arrow" className="size-4" />
  </Btn>
);

const SectionHead = ({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="grid size-9 flex-none place-items-center rounded-[10px] bg-[#f7f0e1] text-[#7a5a17]">
      <Icon name={icon} />
    </div>
    <div>
      <h2 className="text-[15.5px] font-semibold">{title}</h2>
      <p className="mt-0.5 text-[13px] text-[#5b6a72]">{children}</p>
    </div>
  </div>
);

// A note beside the form.
const Tip = ({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) => (
  <div className={`${cardClass} p-4.5 [&_p]:text-[13px] [&_p]:text-[#5b6a72] [&_p+p]:mt-2`}>
    <h3 className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <Icon name={icon} className="size-4.5 text-[#7a5a17]" />
      {title}
    </h3>
    {children}
  </div>
);

// Back on the left; skip and continue on the right.
const Foot = ({ flow, step, first = false }: { flow: Flow; step: FormStep; first?: boolean }) => (
  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
    {first ? (
      <span />
    ) : (
      <Btn tone="ghost" onClick={flow.back}>
        Back
      </Btn>
    )}
    <div className="ml-auto flex items-center gap-4">
      {first ? null : (
        <button type="button" className={linkButton} onClick={() => flow.skip(step)}>
          Skip for now
        </button>
      )}
      <Btn onClick={() => flow.next(step)}>Continue</Btn>
    </div>
  </div>
);

// ── Create account ───────────────────────────────────────────────────────────

// The first screen: the front door's look (WelcomeShell), with the form to create the account
// in its card.

// The five answers the account needs, in the order the ring beside the title counts them down.
const SIGNUP_FIELDS = ["su-name", "su-phone", "su-email", "su-pw", "su-terms"];
// What the ring says with that many of them given.
const ETA_WORDS = ["min to go", "Nice start", "Keep going", "Keep going", "Almost there", "Ready!"];
// The ring's length: 2π × its radius of 15.
const RING = 94.25;
// The password meter's colours: weak, fine, strong.
const STRENGTH = ["#d9644a", "#d98b4a", "#2e7d5b"];

const Tick = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const SignupInput = ({
  flow,
  id,
  label,
  done,
  className = "",
  ...input
}: { flow: Flow; id: FieldId; label: string; done: boolean; className?: string } & InputHTMLAttributes<HTMLInputElement>) => (
  <Field error={flow.errors[id]} className={className}>
    <label htmlFor={id} className="text-[13px] font-medium">
      {label}
    </label>
    <input id={id} type="text" className={`${suInputClass} ${suInputState(done)}`} value={flow.s.f[id]} onChange={(event) => flow.setField(id, event.target.value)} {...input} />
  </Field>
);

const SignupScreen = ({ flow }: { flow: Flow }) => {
  const { s, errors } = flow;
  const password = s.f["su-pw"];
  const [showPassword, setShowPassword] = useState(false);
  const rules: [met: boolean, text: string][] = [
    [password.length >= 8, "8+ characters"],
    [/\d/.test(password), "1 number"],
  ];
  // 1 once anything is typed, 2 once the rules are met, 3 when it is long or has a symbol too.
  const strength = !password ? 0 : !rules.every(([met]) => met) ? 1 : password.length >= 12 || /[^A-Za-z0-9]/.test(password) ? 3 : 2;
  // Each answer counts as given once it would pass the check Create account makes.
  const problems = checkSignup(s);
  const good = (id: string) => !problems[id];
  const given = SIGNUP_FIELDS.filter(good).length;
  const ready = given === SIGNUP_FIELDS.length;

  return (
    <WelcomeShell variant="signup" question="Already have an account?" linkHref="/sign-in" linkLabel="Log in">
      <div className="mb-5.5 flex items-center justify-between gap-3">
        <h2 className={`${fraunces.className} text-[23px] leading-[1.2] font-semibold text-[#0f2a3d]`}>Let&apos;s get your brand moving</h2>
        {/* Counts the five minutes down as the answers are given. */}
        <div aria-live="polite" className={`flex flex-none items-center gap-2 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 ${given >= 4 ? "text-[#2e7d5b]" : "text-[#667280]"}`}>
          <div className="relative size-8.5">
            <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" strokeWidth={3.5} stroke="#ebe3d4" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                strokeWidth={3.5}
                strokeLinecap="round"
                stroke={given >= 4 ? "#2e7d5b" : "#d98b4a"}
                strokeDasharray={RING}
                style={{ strokeDashoffset: RING - (RING * given) / SIGNUP_FIELDS.length }}
                className="transition-[stroke-dashoffset,stroke] duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-[#0f2a3d]">{ready ? "✓" : SIGNUP_FIELDS.length - given}</span>
          </div>
          <span>{ETA_WORDS[given]}</span>
        </div>
      </div>

      <form
        noValidate
        className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1"
        onSubmit={(event) => {
          event.preventDefault();
          flow.signUp();
        }}
      >
        <SignupInput flow={flow} id="su-name" label="Full name" done={good("su-name")} placeholder="David Carter" autoComplete="name" />
        <SignupInput flow={flow} id="su-phone" label="Phone" done={good("su-phone")} type="tel" placeholder="(555) 123-4567" autoComplete="tel" />
        <SignupInput flow={flow} id="su-email" label="Work email" done={good("su-email")} type="email" placeholder="you@yourfirm.com" autoComplete="email" className="col-span-full" />

        <Field error={errors["su-pw"]} className="col-span-full">
          <label htmlFor="su-pw" className="text-[13px] font-medium">
            Password
          </label>
          {/* There is no second box to type it again in, so Show is how to check it. */}
          <div className="relative">
            <input
              id="su-pw"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              className={`${suInputClass} ${suInputState(good("su-pw"))} pr-17.5`}
              value={password}
              onChange={(event) => flow.setField("su-pw", event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className={`absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-lg bg-[#f4efe6] px-2.5 py-1.5 text-[12px] font-semibold text-[#0f2a3d] hover:bg-[#ebe3d4] ${suFocusRing}`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div aria-hidden="true" className="mt-1 flex gap-1">
            {STRENGTH.map((color, index) => (
              <i key={color} className="h-1 flex-1 rounded bg-[#ebe3d4] transition-colors duration-300" style={index < strength ? { background: STRENGTH[strength - 1] } : undefined} />
            ))}
          </div>
          <div className="mt-0.5 flex gap-4 text-[12px] text-[#667280]">
            {rules.map(([met, text]) => (
              <span key={text} className={`inline-flex items-center gap-1.5 transition-colors duration-200 ${met ? "text-[#2e7d5b]" : ""}`}>
                <Tick className={`size-3.5 transition-[opacity,scale] duration-300 ${met ? "scale-120 opacity-100" : "opacity-35"}`} />
                {text}
              </span>
            ))}
          </div>
        </Field>

        <Field error={errors["su-terms"]} className="col-span-full">
          <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-[1.45] text-[#667280]">
            <input id="su-terms" type="checkbox" checked={s.terms} onChange={(event) => flow.patch({ terms: event.target.checked })} className="mt-px size-4.5 flex-none accent-[#0f2a3d]" />
            <span>
              I agree to BayShore&apos;s{" "}
              <a href="/terms" className="font-medium text-[#0f2a3d] underline underline-offset-3">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="font-medium text-[#0f2a3d] underline underline-offset-3">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        </Field>

        {errors["su-form"] ? (
          <div role="alert" className="col-span-full rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
            {errors["su-form"]}
          </div>
        ) : null}

        {/* A glint passes over it now and then; once everything is filled in it turns sea-blue and glows. */}
        <button
          type="submit"
          disabled={flow.creating}
          aria-busy={flow.creating}
          className={`col-span-full ${suButtonClass(ready)}`}
        >
          {flow.creating ? (
            "Creating your account…"
          ) : (
            <>
              Start growing my brand
              <ButtonArrow />
            </>
          )}
        </button>

        <div className="col-span-full mt-0.5 flex flex-wrap justify-center gap-4.5 text-[12px] text-[#667280]">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
            </svg>
            Secure &amp; encrypted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            Saves as you go
          </span>
        </div>
      </form>
    </WelcomeShell>
  );
};

// Confetti once the account is made: falls over the page as the first step comes in.
type ConfettiPiece = { left: number; color: string; duration: number; delay: number };
const CONFETTI_COLORS = ["#d98b4a", "#2e7d8c", "#0f2a3d", "#5fb3c1", "#f1d3b3"];
const makeConfetti = (): ConfettiPiece[] =>
  Array.from({ length: 80 }, (_, index) => ({
    left: Math.random() * 100,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    duration: 1.8 + Math.random() * 1.6,
    delay: Math.random() * 0.4,
  }));

const Confetti = ({ pieces }: { pieces: ConfettiPiece[] | null }) =>
  pieces ? (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden">
      {pieces.map((piece, index) => (
        <i
          key={index}
          className="absolute -top-5 h-3 w-2 animate-[su-fall_linear_forwards] rounded-xs"
          style={{ left: `${piece.left}vw`, background: piece.color, animationDuration: `${piece.duration}s`, animationDelay: `${piece.delay}s` }}
        />
      ))}
    </div>
  ) : null;

// ── Step 1: the business ─────────────────────────────────────────────────────

// The parts of the business step. The notes beside the form follow whichever one is being filled in.
type BusinessPart = "about" | "offer" | "contact";
const BUSINESS_PARTS: Record<BusinessPart, string> = { about: "About your business", offer: "What you offer, and where", contact: "Main contact" };

// One line of "Your answers so far".
const SoFar = ({ label, on, children }: { label: string; on: boolean; children: ReactNode }) => (
  <div className={`flex items-start justify-between gap-3 border-t border-[#e1e7e3] py-2 text-[13px] transition-colors duration-200 first:border-t-0 ${on ? "text-[#1a252c]" : "text-[#5b6a72]"}`}>
    <span className={`flex-none ${on ? "font-medium" : ""}`}>{label}</span>
    <span className="flex min-w-0 flex-wrap justify-end gap-1 text-right break-words">{children}</span>
  </div>
);

const BusinessStep = ({ flow }: { flow: Flow }) => {
  const { s, errors } = flow;
  const [part, setPart] = useState<BusinessPart>("about");
  // A part is "being filled in" from the moment it is clicked or tabbed into.
  const watch = (name: BusinessPart) => ({ onFocus: () => setPart(name), onPointerDown: () => setPart(name) });

  const name = val(s, "b-name");
  const description = val(s, "b-desc");
  const words = description ? description.split(/\s+/).length : 0;
  const contact = val(s, "b-cname");
  const email = val(s, "b-cemail");
  const phone = val(s, "b-phone");
  const reach = s.pick["b-reach"];
  const searches = s.services.length * s.areas.length;
  // The nine answers Continue asks for, counted as they are given. The website's address
  // goes with the yes it follows, so it isn't counted on its own.
  const answered = 9 - Object.keys(CHECKS.business(s)).filter((id) => id !== "w-url").length;

  // Ticked, the contact is whoever signed up; unticked, it is someone to be named.
  const setMe = (me: boolean) => {
    flow.patch((now) => ({ me, f: { ...now.f, "b-cname": me ? val(now, "su-name") : "", "b-cemail": me ? val(now, "su-email") : "", "b-phone": me ? val(now, "su-phone") : "" } }));
    if (!me) document.getElementById("b-cname")?.focus();
  };

  return (
    <>
      <Head eyebrow="Step 1 of 5 · Business" title="Tell us about your business" />
      <div className={layoutClass}>
        <div>
          <div className={`${cardClass} divide-y divide-[#e1e7e3]`}>
            <div className={sectionClass} {...watch("about")}>
              <SectionHead icon="building" title="About your business">
                The basics, in your own words.
              </SectionHead>
              <TextField flow={flow} id="b-name" label="Business name" placeholder="e.g. Carter Injury Law" />
              <Field error={errors["b-desc"]}>
                <label htmlFor="b-desc" className={labelClass}>
                  Business description
                </label>
                <textarea
                  id="b-desc"
                  maxLength={500}
                  placeholder="What you do, who your clients are, and what makes you different"
                  className={`${fieldClass} min-h-25 resize-y`}
                  value={s.f["b-desc"]}
                  onChange={(event) => flow.setField("b-desc", event.target.value)}
                />
                <div className="-mt-0.5 text-right text-[12px] text-[#5b6a72] tabular-nums">{s.f["b-desc"].length} / 500</div>
              </Field>
              {/* The answer the website step starts with, and the same one: given here it is
                  already filled in there, and changed there it is changed here. */}
              <Field error={errors["w-has"]}>
                <span className={labelClass}>Do you have a website?</span>
                <Pills options={YES_NO} value={s.pick["w-has"]} onPick={(value) => flow.setPick("w-has", value)} />
              </Field>
              <Reveal open={s.pick["w-has"] === "yes"} className="-m-1 p-1">
                <TextField flow={flow} id="w-url" label="Website URL" type="url" placeholder="https://yourfirm.com" />
              </Reveal>
            </div>

            <div className={sectionClass} {...watch("offer")}>
              <SectionHead icon="target" title="What you offer, and where">
                Two separate lists. Type an item and press Enter to add it.
              </SectionHead>
              <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
                <Field error={errors["b-services"]} className="rounded-xl border border-[#e1e7e3] bg-[#f8faf9] p-3.5">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <Icon name="briefcase" className="size-4.5 text-[#7a5a17]" />
                    <label htmlFor="b-services-in">Services you offer</label>
                  </span>
                  <p className={helpClass}>The work you do for clients.</p>
                  <TagInput id="b-services-in" values={s.services} onChange={(change) => flow.patch((now) => ({ services: change(now.services) }))} ideas={SERVICE_IDEAS} placeholder="e.g. Car accidents" />
                </Field>
                <Field error={errors["b-areas"]} className="rounded-xl border border-[#e1e7e3] bg-[#f8faf9] p-3.5">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <Icon name="pin" className="size-4.5 text-[#7a5a17]" />
                    <label htmlFor="b-areas-in">Areas you serve</label>
                  </span>
                  <p className={helpClass}>Cities, counties or regions your clients come from.</p>
                  <TagInput id="b-areas-in" values={s.areas} onChange={(change) => flow.patch((now) => ({ areas: change(now.areas) }))} ideas={AREA_IDEAS} placeholder="e.g. Tampa" gold />
                </Field>
              </div>
            </div>

            <div className={sectionClass} {...watch("contact")}>
              <SectionHead icon="user" title="Main contact">
                Who we should talk to about your account.
              </SectionHead>
              <label className="flex items-center gap-2.5 rounded-[10px] border border-[#e1e7e3] bg-[#f8faf9] px-3 py-2.5 text-[13.5px]">
                <input id="b-me" type="checkbox" checked={s.me} onChange={(event) => setMe(event.target.checked)} className="size-[17px] flex-none accent-[#b8892f]" />
                <span>I&apos;m the main point of contact</span>
              </label>
              <div className={gridClass}>
                <TextField flow={flow} id="b-cname" label="Main contact name" />
                <TextField flow={flow} id="b-cemail" label="Contact email" type="email" />
                <TextField flow={flow} id="b-phone" label="Contact phone" type="tel" placeholder="(555) 123-4567" />
                <Field error={errors["b-reach"]}>
                  <span className={labelClass}>Best way to reach you</span>
                  <Pills options={REACH} value={s.pick["b-reach"]} onPick={(value) => flow.setPick("b-reach", value)} />
                </Field>
              </div>
            </div>
          </div>
          <Foot flow={flow} step="business" first />
        </div>

        <aside className={railClass}>
          {/* Why the part being filled in is asked for, said with what has been typed into it. */}
          <Tip icon="info" title="Why we ask">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={part} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: "easeOut" }}>
                <div className="mb-1.5 text-[11px] font-semibold tracking-[1.2px] text-[#7a5a17] uppercase">{BUSINESS_PARTS[part]}</div>
                {part === "about" ? (
                  <>
                    <p>
                      {name ? (
                        <>
                          This is how we&apos;ll introduce <b>{name}</b> on your profile, your ads and your website.
                        </>
                      ) : (
                        "Your business name and description are how we introduce you on your profile, your ads and your website."
                      )}
                    </p>
                    <p>{words ? `${words} word${words > 1 ? "s" : ""} so far. Two or three sentences is plenty.` : "Tell us what you do, who you help, and what sets you apart."}</p>
                  </>
                ) : part === "offer" ? (
                  <>
                    <p>Your services become the categories on your Google Business Profile and the searches we target. Your areas tell us which towns to show up in.</p>
                    <p>
                      {searches ? (
                        <>
                          We&apos;ll go after searches like{" "}
                          <b>
                            “{s.services[0]} in {s.areas[0]}”
                          </b>
                          {searches > 1 ? ` — ${searches} service-and-area pairs so far.` : "."}
                        </>
                      ) : s.services.length ? (
                        "Now add the areas you serve, and we'll pair each one with your services."
                      ) : s.areas.length ? (
                        "Now add your services, and we'll pair each one with these areas."
                      ) : (
                        "Add at least one of each to see the searches we'll target."
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      {contact ? (
                        <>
                          <b>{contact}</b> gets your reports, approvals and calls from your account manager.
                        </>
                      ) : (
                        "Your main contact gets your reports, approvals and calls from your account manager."
                      )}
                    </p>
                    <p>
                      {reach === "Email"
                        ? `We'll send updates to ${email || "the contact email"}.`
                        : reach === "Phone call"
                          ? `We'll call ${phone || "the contact phone"} when something needs a decision.`
                          : reach === "Text message"
                            ? `We'll text short updates to ${phone || "the contact phone"}.`
                            : "Pick the way that suits them best and we'll stick to it."}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </Tip>

          {/* What has been typed, as it is typed. The part being filled in stands out. */}
          <div className={`${cardClass} p-4.5`}>
            <h3 className="mb-1 flex items-center justify-between gap-2 text-[13.5px] font-semibold">
              <span className="flex items-center gap-2">
                <Icon name="list" className="size-4.5 text-[#7a5a17]" />
                Your answers so far
              </span>
              <span className="text-[12px] font-medium text-[#5b6a72] tabular-nums">{answered} of 9</span>
            </h3>
            <SoFar label="Business" on={part === "about"}>
              {name || "—"}
            </SoFar>
            <SoFar label="Services" on={part === "offer"}>
              {s.services.length
                ? s.services.map((service) => (
                    <span key={service} className="rounded-md bg-[#16212a] px-1.5 py-0.5 text-[11.5px] font-medium text-white">
                      {service}
                    </span>
                  ))
                : "—"}
            </SoFar>
            <SoFar label="Areas" on={part === "offer"}>
              {s.areas.length
                ? s.areas.map((area) => (
                    <span key={area} className="rounded-md border border-[#ead9b2] bg-[#f7f0e1] px-1.5 py-0.5 text-[11.5px] font-medium text-[#7a5a17]">
                      {area}
                    </span>
                  ))
                : "—"}
            </SoFar>
            <SoFar label="Contact" on={part === "contact"}>
              {contact || "—"}
            </SoFar>
            <SoFar label="Reach by" on={part === "contact"}>
              {reach ?? "—"}
            </SoFar>
          </div>
        </aside>
      </div>
    </>
  );
};

// ── Step 2: goals ────────────────────────────────────────────────────────────

// How far the goal is above today, and a gentle word when it isn't.
const growth = (today: string, goal: string, noun: string) => {
  if (today === "" || goal === "") return { text: "—", up: false, warning: null };
  const from = +today;
  const to = +goal;
  if (to > from) return { text: from > 0 ? `+${Math.round(((to - from) / from) * 100)}%` : `+${to}`, up: true, warning: null };
  return { text: to === from ? "No change" : "Lower", up: false, warning: `Your goal isn't higher than today. That's fine if you want to keep ${noun} steady.` };
};

// One number as it is today and as they want it.
const Metric = ({
  flow,
  title,
  text,
  from,
  to,
  noun,
  placeholders,
  dollars = false,
}: {
  flow: Flow;
  title: string;
  text: string;
  from: FieldId;
  to: FieldId;
  noun: string;
  placeholders: [string, string];
  dollars?: boolean;
}) => {
  const { s, errors } = flow;
  const today = val(s, from);
  const goal = val(s, to);
  const change = growth(today, goal, noun);
  const capsLabel = "text-[12px] font-semibold tracking-[1px] text-[#5b6a72] uppercase";

  return (
    <div className="flex flex-col rounded-[14px] border border-[#e1e7e3] bg-[#f8faf9] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <p className="mt-0.5 max-w-[52ch] text-[12.5px] text-[#5b6a72]">{text}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.75 text-[12px] font-semibold whitespace-nowrap tabular-nums transition-colors duration-200 ${change.up ? "bg-[#e6f3ec] text-[#2f7d5b]" : "bg-[#e1e7e3] text-[#5b6a72]"}`}>{change.text}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <Field error={errors[from]}>
          <label htmlFor={from} className={capsLabel}>
            Today
          </label>
          <NumberInput flow={flow} id={from} placeholder={placeholders[0]} dollars={dollars} big />
        </Field>
        <span className="pb-3 text-[#b8892f]">
          <Icon name="arrow" />
        </span>
        <Field error={errors[to]}>
          <label htmlFor={to} className={capsLabel}>
            Your goal
          </label>
          <NumberInput flow={flow} id={to} placeholder={placeholders[1]} dollars={dollars} big />
        </Field>
      </div>
      <Reveal open={dollars && today !== "" && goal !== ""}>
        <p className={`${helpClass} pt-3`}>
          That&apos;s {money(+today * 12)} a year today, and {money(+goal * 12)} a year at your goal.
        </p>
      </Reveal>
      <Reveal open={Boolean(change.warning)}>
        <div className="pt-3">
          <p className="rounded-lg bg-[#fcf2e3] px-3 py-2 text-[12.5px] text-[#9a5a12]">{change.warning}</p>
        </div>
      </Reveal>
    </div>
  );
};

const Gold = ({ children }: { children: ReactNode }) => <b className="text-[#e7c780]">{children}</b>;

// The goals said back in a sentence, with today and the goal drawn as bars.
const LivePlan = ({ s }: { s: State }) => {
  const revenue = [val(s, "g-crev"), val(s, "g-grev")];
  const leads = [val(s, "g-cleads"), val(s, "g-gleads")];
  const clients = [val(s, "g-csales"), val(s, "g-gsales")];
  const has = (pair: string[]) => pair[0] !== "" && pair[1] !== "";
  const when = s.pick["g-time"] && s.pick["g-time"] !== "Not sure" ? s.pick["g-time"] : null;
  const plain = (value: number) => String(value);

  if (!has(revenue) && !has(leads)) {
    return (
      <div className="rounded-[14px] bg-[#16212a] p-4.5 text-white" aria-live="polite">
        <p className="text-[15px]">Fill in today and your goal to see your plan here.</p>
      </div>
    );
  }

  const parts: ReactNode[] = [];
  if (has(revenue))
    parts.push(
      <>
        from <Gold>{money(revenue[0])}</Gold> to <Gold>{money(revenue[1])}</Gold> a month in revenue
      </>,
    );
  if (has(leads))
    parts.push(
      <>
        from <Gold>{+leads[0]}</Gold> to <Gold>{+leads[1]}</Gold> leads
      </>,
    );
  if (has(clients))
    parts.push(
      <>
        from <Gold>{+clients[0]}</Gold> to <Gold>{+clients[1]}</Gold> new clients
      </>,
    );

  const bars: [label: string, value: number, share: number, goal: boolean, format: (value: number) => string][] = [];
  const pair = (label: string, values: string[], format: (value: number) => string) => {
    const top = Math.max(+values[0], +values[1], 1);
    bars.push([`${label} today`, +values[0], +values[0] / top, false, format], [`${label} goal`, +values[1], +values[1] / top, true, format]);
  };
  if (has(revenue)) pair("Revenue", revenue, money);
  if (has(leads)) pair("Leads", leads, plain);
  if (has(clients)) pair("Clients", clients, plain);

  return (
    <div className="flex flex-col gap-3 rounded-[14px] bg-[#16212a] p-4.5 text-white" aria-live="polite">
      <p className="text-[15px]">
        You want to grow{" "}
        {parts.map((part, index) => (
          <Fragment key={index}>
            {index === 0 ? "" : index === parts.length - 1 ? " and " : ", "}
            {part}
          </Fragment>
        ))}
        {when ? (
          <>
            {" "}
            in <Gold>{when}</Gold>
          </>
        ) : null}
        .
      </p>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1.5 text-[12px] text-[#a3b3bc] tabular-nums">
        {bars.map(([label, value, share, goal, format]) => (
          <Fragment key={label}>
            <span>{label}</span>
            <div className="h-2 overflow-hidden rounded-lg bg-[#2d3f4b]">
              <motion.div className={`h-full rounded-lg ${goal ? "bg-[#e7c780]" : "bg-[#a3b3bc]"}`} initial={{ width: 0 }} animate={{ width: `${Math.max(2, share * 100)}%` }} transition={{ duration: 0.35, ease: "easeOut" }} />
            </div>
            <span>{format(value)}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
};

const GoalsStep = ({ flow }: { flow: Flow }) => {
  const { s, errors } = flow;
  const [more, setMore] = useState(false);
  const toggleSource = (source: string) => flow.patch((now) => ({ sources: now.sources.includes(source) ? now.sources.filter((item) => item !== source) : [...now.sources, source] }));

  return (
    <>
      <Head eyebrow="Step 2 of 5 · Goals" title="Where are you now, and where do you want to be?" action={<SkipAll flow={flow} />} />
      <div className={layoutClass}>
        <div>
          <div className={cardClass}>
            <div className={sectionClass}>
              <Metric
                flow={flow}
                title="Revenue per month"
                text="How much money your business brings in each month, before expenses. A rough average is fine."
                from="g-crev"
                to="g-grev"
                noun="revenue"
                placeholders={["50000", "100000"]}
                dollars
              />
              <Metric flow={flow} title="Leads per month" text="Everyone who reaches out: phone calls, website forms, emails and messages." from="g-cleads" to="g-gleads" noun="leads" placeholders={["20", "40"]} />
              <Metric flow={flow} title="New clients per month" text="Leads who sign with you or become paying customers." from="g-csales" to="g-gsales" noun="new clients" placeholders={["6", "12"]} />

              <Field error={errors["g-time"]}>
                <span className={labelClass}>How soon would you like to get there?</span>
                <Pills options={TIMEFRAMES} value={s.pick["g-time"]} onPick={(value) => flow.setPick("g-time", value)} />
              </Field>
              <Field error={errors["g-budget"]}>
                <span className={labelClass}>How much do you plan to spend on marketing each month?</span>
                <p className={helpClass}>Include ads and agency fees. This helps us suggest a realistic plan.</p>
                <Pills options={BUDGETS} value={s.pick["g-budget"]} onPick={(value) => flow.setPick("g-budget", value)} />
              </Field>

              <div className="rounded-xl border border-dashed border-[#cdd6d1] px-4">
                <button type="button" aria-expanded={more} onClick={() => setMore((open) => !open)} className={`flex w-full cursor-pointer justify-between gap-2.5 py-3.5 text-left font-medium ${focusRing}`}>
                  Optional: help us measure your return on investment
                  <span className="text-[18px] leading-none text-[#7a5a17]">{more ? "–" : "+"}</span>
                </button>
                <Reveal open={more} className="-mx-1 px-1">
                  <div className={`${gridClass} pb-4`}>
                    <Field error={errors["g-cpl"]}>
                      <label htmlFor="g-cpl" className={labelClass}>
                        What does one lead cost you today?
                      </label>
                      <NumberInput flow={flow} id="g-cpl" placeholder="85" dollars />
                      <p className={helpClass}>Leave blank if you don&apos;t know. We&apos;ll work it out.</p>
                    </Field>
                    <Field error={errors["g-value"]}>
                      <label htmlFor="g-value" className={labelClass}>
                        What is one new client worth to you?
                      </label>
                      <NumberInput flow={flow} id="g-value" placeholder="4500" dollars />
                      <p className={helpClass}>Roughly what one client or case brings in.</p>
                    </Field>
                    <Field className="col-span-full">
                      <span className={labelClass}>Where do your leads come from today?</span>
                      <div className="flex flex-wrap gap-2">
                        {SOURCES.map((source) => {
                          const on = s.sources.includes(source);
                          return (
                            <button
                              key={source}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggleSource(source)}
                              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-150 ${on ? "border-[#16212a] bg-[#16212a] text-white" : "border-[#cdd6d1] bg-white"} ${focusRing}`}
                            >
                              {source}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </Reveal>
              </div>

              <LivePlan s={s} />
            </div>
          </div>
          <Foot flow={flow} step="goals" />
        </div>

        <aside className={railClass}>
          <Tip icon="info" title="Lead or new client?">
            <p>
              A <b>lead</b> is someone who contacts you. A <b>new client</b> is a lead who hires you.
            </p>
            <p>Example: 20 people call this month and you sign 6 of them. That&apos;s 20 leads and 6 new clients.</p>
          </Tip>
          <Tip icon="chart" title="Not sure of your numbers?">
            <p>Give your best guess. We&apos;ll check them against your call tracking in the first month and adjust your targets on the call.</p>
          </Tip>
        </aside>
      </div>
    </>
  );
};

// ── Step 3: the website ──────────────────────────────────────────────────────

const WebsiteStep = ({ flow }: { flow: Flow }) => {
  const { s, errors } = flow;
  const { pick } = s;
  // What a yes or a no opens up, set off by a gold line down its left.
  const revealClass = "mt-4 flex flex-col gap-4.5 border-l-2 border-[#ead9b2] pl-4.5";

  return (
    <>
      <Head eyebrow="Step 3 of 5 · Website" title="Let's talk about your website" action={<SkipAll flow={flow} />} />
      <div className={layoutClass}>
        <div>
          <div className={cardClass}>
            <div className="px-6.5 py-6 max-[700px]:px-4.5">
              <Field error={errors["w-has"]}>
                <span className={labelClass}>Do you have a website?</span>
                <Cards>
                  <Choice big icon="globe" title="Yes, I have one" pressed={pick["w-has"] === "yes"} onClick={() => flow.setPick("w-has", "yes")} />
                  <Choice big icon="plus" title="No, not yet" pressed={pick["w-has"] === "no"} onClick={() => flow.setPick("w-has", "no")} />
                </Cards>
              </Field>

              <Reveal open={pick["w-has"] === "yes"} className="-m-1 p-1">
                <div className={revealClass}>
                  <TextField flow={flow} id="w-url" label="Website URL" type="url" placeholder="https://yourfirm.com" />
                  <Field error={errors["w-plan"]}>
                    <span className={labelClass}>What would you like to do with it?</span>
                    <Cards>
                      <Choice icon="check" title="Keep it as it is" note="We'll improve SEO and performance only" pressed={pick["w-plan"] === "keep"} onClick={() => flow.setPick("w-plan", "keep")} />
                      <Choice icon="brush" title="Redesign it" note="Fresh look, same domain" pressed={pick["w-plan"] === "redesign"} onClick={() => flow.setPick("w-plan", "redesign")} />
                      <Choice icon="help" title="Not sure yet" note="We'll recommend after a review" pressed={pick["w-plan"] === "unsure"} onClick={() => flow.setPick("w-plan", "unsure")} />
                    </Cards>
                  </Field>
                </div>
              </Reveal>

              <Reveal open={pick["w-has"] === "no"} className="-m-1 p-1">
                <div className={revealClass}>
                  <Field error={errors["w-build"]}>
                    <span className={labelClass}>Would you like us to build a new website?</span>
                    <Cards>
                      <Choice icon="brush" title="Yes, build me one" note="We'll start a New Website project" pressed={pick["w-build"] === "yes"} onClick={() => flow.setPick("w-build", "yes")} />
                      <Choice icon="clock" title="Not right now" note="We can talk about it later" pressed={pick["w-build"] === "no"} onClick={() => flow.setPick("w-build", "no")} />
                    </Cards>
                  </Field>
                  {/* Only when we are to build the website: whether they have a domain for it, and —
                      if they do — its name and where it is registered. */}
                  <Reveal open={pick["w-build"] === "yes"} className="-m-1 p-1">
                    <div className="flex flex-col gap-4.5">
                      <Field error={errors["w-dom"]}>
                        <span className={labelClass}>Do you own a domain name?</span>
                        {/* In a block of its own: straight in the field's column it would be stretched to the full width. */}
                        <div>
                          <Seg options={YES_NO} value={pick["w-dom"]} onPick={(value) => flow.setPick("w-dom", value)} label="Do you own a domain name?" />
                        </div>
                      </Field>
                      <Reveal open={pick["w-dom"] === "yes"} className="-m-1 p-1">
                        <div className={gridClass}>
                          <TextField flow={flow} id="w-domain" label="Your domain name" placeholder="yourfirm.com" />
                          <TextField flow={flow} id="w-registrar" label="Where is it registered?" placeholder="e.g. GoDaddy, Namecheap" />
                        </div>
                      </Reveal>
                    </div>
                  </Reveal>
                </div>
              </Reveal>
            </div>
          </div>
          <Foot flow={flow} step="website" />
        </div>

        <aside className={railClass}>
          <Tip icon="info" title="What happens next">
            <p>
              Choosing <b>Redesign it</b> or <b>Build me one</b> starts a project on your Projects page, so you can follow it from day one.
            </p>
          </Tip>
        </aside>
      </div>
    </>
  );
};

// ── Step 4: online accounts ──────────────────────────────────────────────────

const AccountsStep = ({ flow }: { flow: Flow }) => {
  const { s } = flow;
  const answered = ACCTS.filter((acct) => s.accts[acct.key]).length;
  const canSetUpAll = ACCTS.some((acct) => isMissing(s.accts[acct.key]) && s.setup[acct.key] !== "yes");
  const creating = setupList(s);

  // Having an account leaves nothing for us to create.
  const setAnswer = (key: string, answer: string) =>
    flow.patch((now) => {
      const setup = { ...now.setup };
      if (answer === "have") delete setup[key];
      return { accts: { ...now.accts, [key]: answer }, setup };
    });
  const setUpAll = () => {
    flow.patch((now) => ({ setup: { ...now.setup, ...Object.fromEntries(ACCTS.filter((acct) => isMissing(now.accts[acct.key])).map((acct) => [acct.key, "yes"])) } }));
    flow.say("Marked all missing accounts for us to create.");
  };

  return (
    <>
      <Head eyebrow="Step 4 of 5 · Accounts" title="Which of these accounts do you already have?" action={<SkipAll flow={flow} />} />
      <div className={layoutClass}>
        <div>
          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-[#e1e7e3] bg-[#f8faf9] px-6.5 py-4 max-[700px]:px-4.5">
              <p className="text-[13px] text-[#5b6a72]">
                {answered} of {ACCTS.length} answered
              </p>
              {canSetUpAll ? (
                <Btn tone="ghost" small onClick={setUpAll}>
                  Set up everything I&apos;m missing
                </Btn>
              ) : null}
            </div>

            {ACCTS.map((acct, index) => {
              const opens = index === 0 || ACCTS[index - 1].group !== acct.group;
              const answer = s.accts[acct.key];
              const create = s.setup[acct.key];
              const status = answer === "have" ? "You have it" : create === "yes" ? "We'll create it" : null;
              return (
                <Fragment key={acct.key}>
                  {opens ? (
                    <div className="flex items-center gap-2 px-6.5 pt-4.5 pb-1 text-[11px] font-semibold tracking-[1.4px] text-[#5b6a72] uppercase max-[700px]:px-4.5">
                      <Icon name={GROUP_ICONS[acct.group]} className="size-[15px]" />
                      {acct.group}
                    </div>
                  ) : null}
                  <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-6.5 py-3 max-[700px]:grid-cols-1 max-[700px]:gap-y-2.5 max-[700px]:px-4.5 ${opens ? "" : "border-t border-[#e1e7e3]"}`}>
                    <span className="flex items-center gap-2 font-medium">
                      {acct.name}
                      <AnimatePresence initial={false} mode="wait">
                        {status ? (
                          <motion.span
                            key={status}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.12 }}
                            className={`rounded-full px-2 py-px text-[11px] font-semibold whitespace-nowrap ${answer === "have" ? "bg-[#e6f3ec] text-[#2f7d5b]" : "bg-[#f7f0e1] text-[#7a5a17]"}`}
                          >
                            {status}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </span>
                    <Seg options={HAVE} value={answer} onPick={(value) => setAnswer(acct.key, value)} label={acct.name} />

                    <Reveal open={answer === "have"} className="col-span-full -mx-1 px-1 max-[700px]:-mt-2.5">
                      <div className="pt-2.5 pb-1">
                        {acct.placeholder ? (
                          <input
                            id={`lnk-${acct.key}`}
                            type="text"
                            placeholder={acct.placeholder}
                            aria-label={`${acct.name} link or username (optional)`}
                            className={`${inputClass} max-w-105`}
                            value={s.links[acct.key] ?? ""}
                            onChange={(event) => flow.patch((now) => ({ links: { ...now.links, [acct.key]: event.target.value } }))}
                          />
                        ) : (
                          <p className={helpClass}>We&apos;ll request access after your kickoff call.</p>
                        )}
                      </div>
                    </Reveal>
                    <Reveal open={isMissing(answer)} className="col-span-full max-[700px]:-mt-2.5">
                      <div className="pt-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2.5 rounded-[11px] border border-[#ead9b2] bg-[#f7f0e1] px-3 py-2.5">
                          <p className="text-[13px] font-medium text-[#7a5a17]">
                            {answer === "unsure" ? `Want us to check and create your ${acct.name} if you don't have one?` : `Want us to create your ${acct.name} for you?`}
                          </p>
                          <Seg options={CREATE} value={create} onPick={(value) => flow.patch((now) => ({ setup: { ...now.setup, [acct.key]: value } }))} gold />
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </Fragment>
              );
            })}

            <div className="flex items-start gap-2.5 rounded-b-2xl border-t border-[#e1e7e3] bg-[#f8faf9] px-6.5 py-4 text-[13px] max-[700px]:px-4.5">
              <Icon name="lock" className="mt-0.5 size-4.5 text-[#7a5a17]" />
              <p>No passwords needed here. We&apos;ll request access securely after your kickoff call.</p>
            </div>
          </div>
          <Foot flow={flow} step="accounts" />
        </div>

        <aside className={railClass}>
          <Tip icon="list" title="We'll set up for you">
            {creating.length ? (
              <ul>
                <AnimatePresence initial={false}>
                  {creating.map((name) => (
                    <motion.li
                      key={name}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden border-t border-[#e1e7e3] text-[13.5px] first:border-t-0"
                    >
                      <span className="block py-2">{name}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p>
                Nothing yet. Choose <b>Yes, create it</b> on any account you don&apos;t have.
              </p>
            )}
          </Tip>
          <Tip icon="help" title="Not sure?">
            <p>
              Pick <b>Not sure</b> and we&apos;ll check for you. If the account exists, we&apos;ll find it. If not, we can create it.
            </p>
          </Tip>
        </aside>
      </div>
    </>
  );
};

// ── Step 5: book the call ────────────────────────────────────────────────────

const None = ({ children }: { children: ReactNode }) => <p className="text-[13.5px] text-[#5b6a72] italic">{children}</p>;

// Everything answered so far, each part with a way back to change it.
const Summary = ({ flow }: { flow: Flow }) => {
  const { s } = flow;
  const { pick } = s;
  const when = pick["g-time"] && pick["g-time"] !== "Not sure" ? `, in ${pick["g-time"]}` : "";
  const website = !s.skipped.includes("website");

  const blocks: [title: string, step: StepId, body: ReactNode][] = [
    [
      "Business",
      "business",
      val(s, "b-name") ? (
        <>
          <p>
            <strong>{val(s, "b-name")}</strong>
          </p>
          <p>
            Contact: {val(s, "b-cname")} · {pick["b-reach"] ?? "—"}
          </p>
          <p>Services: {s.services.join(", ") || "—"}</p>
          <p>Areas: {s.areas.join(", ") || "—"}</p>
        </>
      ) : (
        <None>Not filled in yet</None>
      ),
    ],
    [
      "Goals",
      "goals",
      s.skipped.includes("goals") || !val(s, "g-cleads") ? (
        <None>Skipped. Your account manager will set goals with you on the call.</None>
      ) : (
        <>
          <p>
            Revenue: {money(val(s, "g-crev"))} → {money(val(s, "g-grev"))} a month
          </p>
          <p>
            Leads: {+val(s, "g-cleads")} → {+val(s, "g-gleads")} a month{when}
          </p>
          <p>
            New clients: {+val(s, "g-csales")} → {+val(s, "g-gsales")} a month
          </p>
          <p>Budget: {pick["g-budget"] ?? "—"}</p>
        </>
      ),
    ],
    [
      "Website",
      "website",
      website && pick["w-has"] === "no" ? (
        <p>
          {pick["w-build"] === "yes" ? "New build" : "No website for now"}
          {pick["w-build"] === "yes" && pick["w-dom"] === "yes" && val(s, "w-domain") ? ` · ${val(s, "w-domain")}${val(s, "w-registrar") ? ` (${val(s, "w-registrar")})` : ""}` : ""}
        </p>
      ) : website && pick["w-has"] === "yes" && pick["w-plan"] ? (
        <p>
          {WEBSITE_PLANS[pick["w-plan"]]} · {val(s, "w-url")}
        </p>
      ) : (
        <None>Skipped</None>
      ),
    ],
    [
      "Accounts we'll create for you",
      "accounts",
      s.skipped.includes("accounts") ? <None>Skipped</None> : s.tasks.length ? <p>{s.tasks.join(", ")}</p> : <None>None. You&apos;ll handle your own accounts.</None>,
    ],
  ];

  return (
    <div className={`${cardClass} px-6 py-5.5`}>
      <p className="mb-3 text-[11px] font-semibold tracking-[1.6px] text-[#7a5a17] uppercase">Your summary</p>
      {blocks.map(([title, step, body], index) => (
        <div key={step} className={`text-[13.5px] ${index === 0 ? "pt-1 pb-3.5" : "border-t border-[#e1e7e3] py-3.5"}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h3 className={capsClass}>{title}</h3>
            <button type="button" onClick={() => flow.go(step)} className={`cursor-pointer text-[12.5px] text-[#7a5a17] underline ${focusRing}`}>
              Edit
            </button>
          </div>
          {body}
        </div>
      ))}
    </div>
  );
};

const BookStep = ({ flow }: { flow: Flow }) => {
  const { s } = flow;
  const [loaded, setLoaded] = useState(false);

  // Google's calendar can't say when a time has been booked, so the client says so.
  const confirm = () => {
    flow.patch((now) => ({ booked: true, done: withStep(now.done, "book") }));
    flow.save(["book"], { booked: true });
    flow.say("Booked! A confirmation is on its way to your inbox.");
  };

  return (
    <>
      <Head eyebrow="Step 5 of 5 · Book call" title="You're almost done. Book your onboarding call." />
      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-6 max-[900px]:grid-cols-1">
        <Summary flow={flow} />

        <div className={`${cardClass} overflow-hidden`}>
          <AnimatePresence mode="wait" initial={false}>
            {s.booked ? (
              <motion.div key="booked" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className="px-8 py-13 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="mx-auto mb-3.5 grid size-14 place-items-center rounded-full bg-[#e6f3ec] text-[#2f7d5b]"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-6.5">
                    <motion.path d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }} />
                  </svg>
                </motion.div>
                <h2 className="mb-1.5 text-[19px] font-semibold">You&apos;re booked.</h2>
                <p className="mx-auto mb-5 max-w-90 text-[#5b6a72]">A calendar invite is on its way to your inbox. Next is your onboarding form — we&apos;ll sign you in and take you there.</p>
                <Btn onClick={flow.enter} disabled={flow.entering} aria-busy={flow.entering} className="disabled:cursor-wait disabled:opacity-70">
                  {flow.entering ? (
                    "Signing you in…"
                  ) : (
                    <>
                      Continue to onboarding <Icon name="arrow" className="size-4" />
                    </>
                  )}
                </Btn>
              </motion.div>
            ) : (
              <motion.div key="calendar" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="relative h-175 bg-white">
                  {loaded ? null : <p className="absolute inset-0 grid place-items-center text-[13px] text-[#5b6a72]">Loading the calendar…</p>}
                  <motion.iframe
                    src={`${BOOKING_URL}?gv=true`}
                    title="Book your onboarding call"
                    onLoad={() => setLoaded(true)}
                    initial={false}
                    animate={{ opacity: loaded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative block size-full border-0"
                  />
                </div>
                <p className="border-t border-[#e1e7e3] bg-[#f8faf9] px-6 py-3 text-[12.5px] text-[#5b6a72]">
                  Can&apos;t see the calendar?{" "}
                  <a href={BOOKING_URL} target="_blank" rel="noopener" className="text-[#7a5a17] underline">
                    Open it in a new tab
                  </a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Btn tone="ghost" onClick={flow.back}>
          Back
        </Btn>
        <div className="ml-auto flex items-center gap-4">
          {s.booked ? (
            // The way back for someone who said "booked" too soon.
            <button
              type="button"
              className={linkButton}
              onClick={() => {
                setLoaded(false);
                flow.patch({ booked: false });
              }}
            >
              Back to the calendar
            </button>
          ) : (
            <>
              <button
                type="button"
                className={linkButton}
                disabled={flow.entering}
                onClick={() => {
                  flow.patch({ booked: false });
                  flow.enter();
                }}
              >
                {flow.entering ? "Signing you in…" : "I\u2019ll book later"}
              </button>
              <Btn onClick={confirm}>I&apos;ve booked my call</Btn>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ── The whole thing ──────────────────────────────────────────────────────────

// Everything the screens share (see Flow), starting from the answers given.
const useFlow = (initial: State) => {
  const [s, setS] = useState<State>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [creating, setCreating] = useState(false);
  const [entering, setEntering] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // The password the account was made with, kept — on this page only, and out of the answers —
  // to sign them in with once the steps are done.
  const password = useRef("");

  // Each message gets the next number, so saying the same thing twice shows it afresh.
  const say = (message: string) => setToast((last) => ({ id: (last?.id ?? 0) + 1, message }));
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  // Confetti once the account is made, cleared once it has fallen.
  const [confetti, setConfetti] = useState<ConfettiPiece[] | null>(null);
  useEffect(() => {
    if (!confetti) return;
    const timer = setTimeout(() => setConfetti(null), 4000);
    return () => clearTimeout(timer);
  }, [confetti]);

  const patch = (changes: Changes) => setS((now) => ({ ...now, ...(typeof changes === "function" ? changes(now) : changes) }));
  const setField = (id: FieldId, value: string) => patch((now) => ({ f: { ...now.f, [id]: value } }));
  const setPick = (group: Group, value: string) => {
    patch((now) => ({ pick: { ...now.pick, [group]: value } }));
    // Saying they own a domain opens the box to type it in.
    if (group === "w-dom" && value === "yes") requestAnimationFrame(() => document.getElementById("w-domain")?.focus());
  };

  const go = (screen: Screen) => {
    patch({ screen });
    window.scrollTo({ top: 0 });
  };

  // Shows what is wrong and puts the cursor on the first of it.
  const fail = (problems: Errors) => {
    setErrors(problems);
    requestAnimationFrame(() => {
      const first = root.current?.querySelector<HTMLElement>("[data-invalid] input, [data-invalid] textarea, [data-invalid] button");
      first?.focus();
      first?.scrollIntoView({ block: "center" });
    });
  };

  // Creates the account (app/actions/auth.ts) — without signing them in — then goes on to the
  // steps, here on the same page. Why it couldn't be done — the email already has an account, say —
  // is shown above the button.
  const signUp = async () => {
    if (creating) return;
    const problems = checkSignup(s);
    if (Object.keys(problems).length) return fail(problems);
    setErrors({});

    setCreating(true);
    const result = await signUpAction({
      fullName: val(s, "su-name"),
      email: val(s, "su-email"),
      // Without the formatting, as the backend stores it.
      phone: val(s, "su-phone").replace(/[\s\-().]/g, ""),
      password: s.f["su-pw"],
      termsAccepted: s.terms,
    });
    setCreating(false);
    // What was wrong with each field says more than the "validation failed" above it.
    if (!result.ok) return setErrors({ "su-form": (result.fieldErrors?.length ? result.fieldErrors : [result.error]).join(" ") });

    // Whoever signed up is the main contact until they name someone else. The password has
    // done its work, so it isn't kept.
    password.current = s.f["su-pw"];
    patch((now) => ({ f: { ...now.f, "su-pw": "", "b-cname": val(now, "su-name"), "b-cemail": val(now, "su-email"), "b-phone": val(now, "su-phone") } }));
    setConfetti(makeConfetti());
    go("business");
  };

  const next = (step: FormStep) => {
    const problems = CHECKS[step](s);
    if (Object.keys(problems).length) return fail(problems);
    setErrors({});
    const changes: Partial<State> = { done: withStep(s.done, step), skipped: s.skipped.filter((id) => id !== step) };

    // The accounts to create go to the team.
    if (step === "accounts") {
      changes.tasks = setupList(s);
      if (changes.tasks.length) say(`${changes.tasks.length} account setup task${changes.tasks.length > 1 ? "s" : ""} sent to the BayShore team.`);
    }

    patch(changes);
    // Whether they have a website is asked with the business too, so it is saved with it.
    save(step === "business" ? [step, "website"] : [step]);
    go(nextOf(step));
  };

  const skip = (step: FormStep) => {
    setErrors({});
    patch((now) => ({ done: withStep(now.done, step), skipped: withStep(now.skipped, step), ...(step === "accounts" ? { tasks: [] } : {}) }));
    go(nextOf(step));
  };

  // Skips this step and every one after it that hasn't been answered, straight to booking the call.
  const skipAll = () => {
    setErrors({});
    patch((now) => {
      const from = STEPS.findIndex((step) => step.id === now.screen);
      const skipping = STEPS.slice(from, -1)
        .map((step) => step.id)
        .filter((id) => id === now.screen || !now.done.includes(id));
      return { done: skipping.reduce(withStep, now.done), skipped: skipping.reduce(withStep, now.skipped), ...(skipping.includes("accounts") ? { tasks: [] } : {}) };
    });
    go("book");
  };

  // Saves steps onto the client's record, one save at a time and in the order asked. A step
  // that couldn't be saved goes again with the next save, and with the last one before they
  // are signed in (see `enter`) — so a hiccup on the way doesn't lose an answer.
  const saving = useRef<Promise<{ ok: boolean; error?: string }>>(Promise.resolve({ ok: true }));
  const unsaved = useRef(new Set<StepId>());
  const send = (steps: StepId[], state: State) => {
    const run = async () => {
      // Without the password (the page was left and come back to) there is nothing to save with.
      if (!password.current) return { ok: false, error: "Your answers couldn't be saved. Please log in and fill them in again." };
      const all = [...new Set([...unsaved.current, ...steps])];
      const result = await saveSignupAnswersAction(val(state, "su-email"), password.current, toBackend(state, all));
      if (result.ok) unsaved.current.clear();
      else for (const step of all) unsaved.current.add(step);
      return result;
    };
    saving.current = saving.current.then(run, run);
    return saving.current;
  };
  const save = (steps: StepId[], changes: Partial<State> = {}) => {
    void send(steps, { ...s, ...changes }).then((result) => {
      if (!result.ok) say("Couldn't save that step yet — we'll try again as you go.");
    });
  };

  // At the end of the steps: signs them in and takes them to their onboarding form. Without
  // the password (it is only held while this page stays open), or if that fails, they log in
  // themselves — and land on the same form.
  const enter = async () => {
    if (entering) return;
    const logIn = () => router.push("/sign-in?callbackUrl=/onboarding");
    if (!password.current) return logIn();
    setEntering(true);
    // Everything answered goes onto their record once more first — the steps not skipped, and
    // whether the call was booked — so nothing is left behind on this page.
    const answered = STEPS.map((step) => step.id).filter((id) => id === "book" || (s.done.includes(id) && !s.skipped.includes(id)));
    const saved = await send(answered, s);
    if (!saved.ok) {
      setEntering(false);
      return say(saved.error ?? "Couldn't save your answers. Please try again.");
    }
    const result = await enterPortalAction(val(s, "su-email"), password.current);
    // It only comes back when it couldn't sign them in.
    setEntering(false);
    if (result?.error) {
      say(result.error);
      logIn();
    }
  };

  const flow: Flow = { s, errors, patch, setField, setPick, go, next, skip, skipAll, back: () => go(prevOf(s.screen)), signUp, save, enter, entering, creating, say };
  return { flow, root, toast, confetti };
};

type Toast = { id: number; message: string };

// A short message along the bottom of the window, gone after a moment.
const ToastMessage = ({ toast }: { toast: Toast | null }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="rounded-[10px] bg-[#16212a] px-4 py-2.5 text-[13px] text-white shadow-[0_1px_2px_rgba(22,33,42,0.04),0_6px_20px_rgba(22,33,42,0.05)]"
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);

// The five steps in a row, in a white bar under the header: where the client is, what is done or
// skipped, and the way back to those.
const StepsProgress = ({ s, go }: { s: State; go: (screen: Screen) => void }) => (
  <nav aria-label="Onboarding progress" className="border-b border-[#e1e7e3] bg-white px-4">
    <ol className={`${widthClass} grid grid-cols-5 gap-2`}>
      {STEPS.map((step, index) => {
        const current = step.id === s.screen;
        const skipped = s.skipped.includes(step.id);
        const done = s.done.includes(step.id);
        const clickable = done && !current;
        const look = current
          ? "border-[#16212a] font-semibold text-[#1a252c]"
          : skipped
            ? "border-dashed border-[#cdd6d1] font-medium text-[#5b6a72]"
            : done
              ? "border-[#b8892f] font-medium text-[#1a252c]"
              : "border-[#e1e7e3] font-medium text-[#5b6a72]";
        const dot = current ? "border-[#16212a] bg-[#16212a] text-white" : done && !skipped ? "border-[#b8892f] bg-[#b8892f] text-white" : "border-[#cdd6d1] bg-white";
        return (
          <li key={step.id}>
            <button
              type="button"
              tabIndex={clickable ? undefined : -1}
              aria-disabled={clickable ? undefined : true}
              aria-current={current ? "step" : undefined}
              onClick={() => clickable && go(step.id)}
              className={`group/step flex w-full items-center gap-2.5 border-b-3 py-3.5 text-left text-[13px] transition-colors duration-200 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-1.5 max-[700px]:text-[11px] ${clickable ? "cursor-pointer" : "cursor-default"} ${look} ${focusRingInside}`}
            >
              <span className={`grid size-6 flex-none place-items-center rounded-full border-[1.5px] text-[11.5px] font-semibold transition-colors duration-200 ${dot}`}>{clickable && !skipped ? "✓" : index + 1}</span>
              <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${clickable && !skipped ? "group-hover/step:underline" : ""}`}>
                {step.label}
                <small className="block text-[11px] font-normal text-[#5b6a72] max-[900px]:hidden">{current ? "In progress" : skipped ? "Skipped" : done ? "Done" : `${step.minutes < 2 ? "1" : "2"} min`}</small>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

const rootClass = `${poppins.className} text-[14px] leading-[1.55] text-[#1a252c] [&_b]:font-semibold [&_strong]:font-semibold`;

// The front page: creating the account, and then the five steps, one at a time. It has the
// window to itself the whole way — no portal around it, and nobody signed in: the account is
// made on the first screen, and logged in to once the steps are done.
const ClientSignup = () => {
  const { flow, root, toast, confetti } = useFlow(BLANK);
  const { s } = flow;
  const stepIndex = STEPS.findIndex((step) => step.id === s.screen);
  const minutesLeft = Math.ceil(STEPS.slice(Math.max(stepIndex, 0)).reduce((sum, step) => sum + step.minutes, 0));

  return (
    <MotionConfig reducedMotion="user">
      <div ref={root} className={`${rootClass} min-h-screen w-full ${s.screen === "signup" ? "bg-[#f4efe6]" : "bg-[#f2f5f3]"}`}>
        {/* Creating the account is a page of its own, with its own header; the steps share the one below. */}
        {s.screen === "signup" ? (
          <SignupScreen flow={flow} />
        ) : (
          <>
            {/* The account is made and they are on their way in, so there is no Log in here: just
                where they are and how long is left. Held to the steps' own width below it. */}
            <header className="sticky top-0 z-20 bg-[#16212a] px-4 py-3 text-white">
              <div className={`${widthClass} flex items-center justify-between gap-3`}>
                {/* Mid-way the link stays put: going back to the first screen would throw the answers away. */}
                <Logo dark onHome={(event) => event.preventDefault()} />
                <div className="flex items-center gap-3 text-[13px] text-[#a3b3bc]">
                  <span className="max-[700px]:hidden">About {minutesLeft} min left</span>
                  <span className="rounded-full bg-white/8 px-3 py-1.25 text-[12px] font-semibold whitespace-nowrap text-white ring-1 ring-white/15 tabular-nums">
                    Step {stepIndex + 1} of 5
                  </span>
                </div>
              </div>
            </header>

            <StepsProgress s={s} go={flow.go} />

            <main className="px-4 pt-8 pb-10">
              <AnimatePresence mode="wait">
                <motion.section key={s.screen} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }} className={widthClass}>
                  {s.screen === "business" ? <BusinessStep flow={flow} /> : null}
                  {s.screen === "goals" ? <GoalsStep flow={flow} /> : null}
                  {s.screen === "website" ? <WebsiteStep flow={flow} /> : null}
                  {s.screen === "accounts" ? <AccountsStep flow={flow} /> : null}
                  {s.screen === "book" ? <BookStep flow={flow} /> : null}
                </motion.section>
              </AnimatePresence>
            </main>
          </>
        )}

        <Confetti pieces={confetti} />
        <ToastMessage toast={toast} />
      </div>
    </MotionConfig>
  );
};

export default ClientSignup;
