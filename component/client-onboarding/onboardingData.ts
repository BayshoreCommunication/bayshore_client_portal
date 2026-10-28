import type { Onboarding, OnboardingAccount, OnboardingAnswers, OnboardingFile, OnboardingMedia } from "@/app/actions/onboarding";

// What the onboarding form asks, how each answer is read, and how the answers go to the
// backend and come back. Kept apart from the form so the questions can change without
// touching how they are drawn.

// The address clients invite to their accounts. Change it to the team's access email.
export const AGENCY_EMAIL = "info@bayshorecommunication.org";
// Who a client gives access to on Meta (Facebook, Instagram) and LinkedIn. Placeholders until
// the agency's own are in.
export const AGENCY_META_BUSINESS_ID = "1234567890123456";
export const AGENCY_LINKEDIN = "linkedin.com/company/bayshore-communication";
export const AGENCY_TIKTOK_BUSINESS_CENTER_ID = "7000000000000000000";

// ── Answers ──────────────────────────────────────────────────────────────────

// Everything typed or chosen, under keys like "dom.has" or "fb.access".
export type Answers = Record<string, string | boolean | undefined>;
// An example website the client likes, and what they like about it.
export type Competitor = { id: number; url: string; note: string };

// ── Instructions for giving access ───────────────────────────────────────────

// A step is plain text with two marks: *bold*, and {email} for the access address.
const generic = (platform: string) => [
  `Sign in to your ${platform} account.`,
  "Find *Users*, *Team*, *Delegate access* or *Permissions* in your account settings.",
  "Invite {email} with admin or full access.",
  `If you can't find it, tick "I need help with this" and we'll walk you through it.`,
];

const GODADDY = [
  "Sign in to GoDaddy and open *Account Settings → Delegate Access*.",
  "Click *Invite to Access*.",
  `Enter "BayShore" as the name and {email} as the email.`,
  "Choose *Products, Domains & Purchase*, then send the invite.",
];

export type PlatformGroup = "registrar" | "host" | "cms";

// A platform's own steps; "builder" when hosting comes with the site builder; "dev" when a
// developer holds the keys; null when the usual steps (`generic`) apply.
const PLATFORMS: Record<PlatformGroup, Record<string, string[] | "builder" | "dev" | null>> = {
  registrar: {
    GoDaddy: GODADDY,
    Namecheap: [
      "Sign in to Namecheap and open your *Domain List*.",
      "Click *Manage* next to your domain, then the *Sharing & Transfer* tab.",
      "Under *Share Access*, add {email}.",
      "Save the changes.",
    ],
    "Squarespace (formerly Google Domains)": [
      "Sign in to Squarespace Domains and open your domain.",
      "Go to *Permissions* and click *Invite*.",
      "Enter {email} and choose *Administrator*.",
      "Send the invite.",
    ],
    Cloudflare: [
      "Sign in to Cloudflare and choose your account.",
      "Open *Manage Account → Members*.",
      "Click *Invite*, enter {email}, and choose *Administrator*.",
      "Send the invite.",
    ],
    Bluehost: null,
    HostGator: null,
    "Network Solutions": null,
    IONOS: null,
    Hostinger: null,
    Wix: null,
    Other: null,
  },
  host: {
    GoDaddy: GODADDY,
    SiteGround: [
      "Sign in to SiteGround and open *Websites*.",
      "Click the menu next to your site and choose *Add Collaborator*.",
      "Enter {email}.",
      "Send the invite.",
    ],
    "WP Engine": [
      "Sign in to the WP Engine User Portal.",
      "Open *Account Users* and click *Add User*.",
      "Enter {email} and choose *Full* access.",
      "Send the invite.",
    ],
    Kinsta: [
      "Sign in to MyKinsta.",
      "Open *Company Settings → Users*.",
      "Click *Invite users*, enter {email}, and choose *Company administrator*.",
      "Send the invite.",
    ],
    Bluehost: null,
    HostGator: null,
    Hostinger: null,
    IONOS: null,
    Wix: "builder",
    Squarespace: "builder",
    Shopify: "builder",
    Other: null,
  },
  cms: {
    WordPress: [
      "Sign in to your WordPress dashboard (usually yourbusiness.com/wp-admin).",
      "Go to *Users → Add New User*.",
      `Enter {email} as the email and "bayshore" as the username.`,
      "Set the role to *Administrator* and click *Add New User*.",
    ],
    Wix: [
      "Sign in to Wix and open your site dashboard.",
      "Go to *Settings → Roles & Permissions*.",
      "Click *Invite People* and enter {email}.",
      "Choose *Admin (Co-Owner)* and send the invite.",
    ],
    Squarespace: [
      "Sign in to Squarespace and open your site.",
      "Go to *Settings → Permissions & Ownership*.",
      "Click *Invite contributor* and enter {email}.",
      "Choose *Administrator* and send the invite.",
    ],
    Shopify: ["Sign in to your Shopify admin.", "Go to *Settings → Users*.", "Click *Add users* and enter {email}.", "Give full permissions and send the invite."],
    Webflow: [
      "Sign in to Webflow and open your Workspace.",
      "Go to *Workspace settings → Members*.",
      "Click *Invite* and enter {email}.",
      "Choose *Admin* and send the invite.",
    ],
    "GoDaddy Website Builder": null,
    "Custom / built by a developer": "dev",
    Other: null,
  },
};

export const NOT_SURE = "Not sure";

export const platformsOf = (group: PlatformGroup) => [...Object.keys(PLATFORMS[group]), NOT_SURE];

// How access to a chosen platform is given: its steps, or one of the special cases.
export const accessOf = (group: PlatformGroup, platform: string): string[] | "builder" | "dev" | "unsure" => {
  if (platform === NOT_SURE) return "unsure";
  return PLATFORMS[group][platform] ?? generic(platform);
};

// ── Accounts ─────────────────────────────────────────────────────────────────

// An account the client may already have. `steps` are how to invite us to it — none when
// the platform has no such thing, and the login has to be shared instead.
// `profile` is for a platform where access is given to a person's profile rather than to the
// access email (a Facebook Page): ours to add — its link, its username and its picture — and
// how. The picture is a file of ours, since the platform won't hand one out; it is imported
// rather than linked by its path so that it is served with the app's own files, which the
// sign-in check in proxy.ts lets through. Such an account has no steps to tick: the client
// only says that access is given, or that they need help.
//
// `via` is for an account that rides on another one (Instagram, on the Facebook Page it is
// connected to): access to that one already lets us post here, so no access of its own is asked
// for — unless the work needs the account's own login, shared through a secure link.
export type Grant = {
  method: string;
  url: string;
  open: string;
  ours: { label: string; value: string; link?: string };
  steps: string[];
  required: string;
  note?: string;
};

export type Account = {
  id: string;
  name: string;
  short: string;
  placeholder?: string;
  role?: string;
  steps: string[] | null;
  // Access given on the platform itself, to our business or account — no password: the
  // official place to do it, what to enter there, the steps, and what it lets us do.
  grant?: Grant;
  // The email account: its login, given through the secure form (the steps to say so).
  connect?: { steps: string[]; required: string; note: string };
  // The account's own login (username or email, and password) is how we get in: it is asked
  // for on the form as soon as they say they have the account.
  login?: boolean;
  // What the login's first box is called, where "username or email" isn't it.
  loginLabel?: string;
  // What is asked first, where "Do you have this account?" isn't it.
  question?: string;
  // Only a yes or a no is asked, and a no is the whole answer: nothing is offered to be created.
  yesOrNo?: boolean;
};

export const GOOGLE: Account[] = [
  {
    id: "gbp",
    name: "Google Business Profile (Google Maps)",
    short: "Google Business Profile",
    placeholder: "Business name as it shows on Google Maps",
    role: "Manager",
    steps: [
      "Go to *google.com/business* and sign in.",
      "Open your profile and click the *⋮ menu → Business Profile settings → Managers*.",
      "Click *Add* and enter {email}.",
      "Choose *Manager* and click *Invite*.",
    ],
  },
  {
    id: "ga",
    name: "Google Analytics",
    short: "Google Analytics",
    role: "Editor",
    steps: [
      "Go to *analytics.google.com* and sign in.",
      "Click *Admin* (the gear icon), then *Account access management*.",
      "Click *+ → Add users* and enter {email}.",
      "Choose *Editor* and click *Add*.",
    ],
  },
  {
    id: "gsc",
    name: "Google Search Console",
    short: "Google Search Console",
    role: "Full",
    steps: [
      "Go to *search.google.com/search-console* and sign in.",
      "Open *Settings → Users and permissions*.",
      "Click *Add user* and enter {email}.",
      "Choose *Full* and click *Add*.",
    ],
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    short: "Google Tag Manager",
    role: "Publish",
    steps: [
      "Go to *tagmanager.google.com* and sign in.",
      "Click *Admin → User Management*.",
      "Click *+ → Add users* and enter {email}.",
      "Choose *Publish* access and click *Invite*.",
    ],
  },
  {
    id: "gads",
    name: "Google Ads",
    short: "Google Ads",
    placeholder: "Customer ID (123-456-7890)",
    role: "Standard",
    steps: [
      "Go to *ads.google.com* and sign in.",
      "Click *Admin → Access and security*.",
      "Click *+* and enter {email}.",
      "Choose *Standard* access and send the invite.",
    ],
  },
];

export const SOCIAL: Account[] = [
  {
    id: "fb",
    name: "Facebook Page",
    short: "Facebook",
    placeholder: "facebook.com/yourbusiness",
    steps: null,
    grant: {
      method: "Meta Business Suite / Business Portfolio",
      url: "https://business.facebook.com/",
      open: "Open Meta Business Suite",
      ours: { label: "Our Business ID", value: AGENCY_META_BUSINESS_ID },
      steps: [
        "Log in to Facebook and open *business.facebook.com*.",
        "Open *Business Settings* or *Business Portfolio settings*.",
        "Select *Users*, then *Partners*.",
        "Click *Add* and enter our Business ID.",
        "Select your Facebook Page and assign the required permissions.",
        "Save or confirm the changes.",
      ],
      required: "Access to manage your Facebook Page and publish approved content. Your Facebook password isn't needed.",
      note: "No Business Portfolio? Use your Page's own access invitation instead.",
    },
  },
  {
    id: "ig",
    name: "Instagram Business Account",
    short: "Instagram",
    placeholder: "@yourbusiness",
    steps: null,
    grant: {
      method: "Meta Business Suite",
      url: "https://business.facebook.com/",
      open: "Open Meta Business Suite",
      ours: { label: "Our Business ID", value: AGENCY_META_BUSINESS_ID },
      steps: [
        "Open *business.facebook.com*.",
        "Go to *Business Settings* or *Business Portfolio settings*.",
        "Select *Accounts*, then *Instagram Accounts*.",
        "Choose your Instagram Business Account.",
        "Assign the required permissions to our business.",
        "Save the changes.",
      ],
      required: "Access to manage your Instagram content and view insights. Your Instagram password isn't needed.",
      note: "Your Instagram may need to be connected to your Facebook Page or business portfolio first.",
    },
  },
  {
    id: "yt",
    name: "YouTube Channel",
    short: "YouTube",
    placeholder: "youtube.com/@yourbusiness",
    steps: null,
    grant: {
      method: "YouTube Studio Permissions",
      url: "https://studio.youtube.com/",
      open: "Open YouTube Studio",
      ours: { label: "Our Google account", value: AGENCY_EMAIL },
      steps: [
        "Open *studio.youtube.com*.",
        "Select *Settings*, then *Permissions*.",
        "Click *Invite*.",
        "Enter our Google account email.",
        "Choose the *Editor* role.",
        "Send the invitation. We'll accept it.",
      ],
      required: "Permission to upload and manage videos and view channel analytics. Your channel password isn't needed.",
    },
  },
  {
    id: "li",
    name: "LinkedIn Company Page",
    short: "LinkedIn",
    placeholder: "linkedin.com/company/…",
    steps: null,
    grant: {
      method: "LinkedIn Page Admin",
      url: "https://www.linkedin.com/",
      open: "Open LinkedIn",
      ours: { label: "Our LinkedIn profile", value: AGENCY_LINKEDIN, link: `https://www.${AGENCY_LINKEDIN}` },
      steps: [
        "Log in to LinkedIn and open your Company Page.",
        "Open *Settings* or *Manage admins*.",
        "Select *Add admin*.",
        "Search for and select our LinkedIn profile.",
        "Choose the *Content Admin* role.",
        "Save the changes.",
      ],
      required: "Permission to publish company updates and manage your LinkedIn Page. Your LinkedIn password isn't needed.",
      note: "The person giving access needs admin rights on the Page.",
    },
  },
  {
    id: "tt",
    name: "TikTok Account",
    short: "TikTok",
    placeholder: "@yourbusiness",
    steps: null,
    grant: {
      method: "TikTok Business Center / partner access",
      url: "https://business.tiktok.com/",
      open: "Open TikTok Business Center",
      ours: { label: "Our Business Center ID", value: AGENCY_TIKTOK_BUSINESS_CENTER_ID },
      steps: [
        "Open TikTok Business Center at *business.tiktok.com*.",
        "Open *Users* or *Partners*, depending on your account setup.",
        "Choose the option to *add a partner* or *invite a user*.",
        "Enter our Business Center ID.",
        "Select your TikTok account and the relevant assets.",
        "Assign only the permissions needed for content management or advertising.",
        "Confirm and send the invitation.",
      ],
      required: "The right permissions on your TikTok account or assets. Your TikTok password isn't needed when partner access is available.",
      note: "Menu names and permissions can differ by account type and region. If Business Center isn't available to you, use TikTok's own account authorization or invitation options.",
    },
  },
  // The email account itself, signed in to with its login. The address is its login, so no link is asked for.
  {
    id: "em",
    name: "Business Email",
    short: "Email",
    steps: null,
    login: true,
    loginLabel: "Business email address",
    question: "Do you have a business email for us to use?",
    yesOrNo: true,
    connect: {
      steps: ["Click *Connect Email*.", "Enter your business email address.", "Enter its password in the secure form.", "Save — we'll verify access and confirm when it's ready."],
      required: "Your business email address and its password.",
      note: "Never send an email password by ordinary email or chat — only through this form. If two-step sign-in is on, you may need to approve our first sign-in.",
    },
  },
];

// ── Photos and videos ────────────────────────────────────────────────────────

export type Media = { id: string; name: string; about: string; formats: string; shoot: string; notesPlaceholder: string };

// What can be uploaded for each kind of photos or videos — the backend's own rules
// (models/client.model.ts), repeated here so a file that won't be taken is turned away before
// it is sent. `kind` is the kind's name on the record, and in the upload's address.
const PHOTO_UPLOAD = { accept: ["image/jpeg", "image/png", "image/webp", "image/gif"], formats: "JPG, PNG, WEBP or GIF", maxMb: 10 };
export const MEDIA_UPLOAD: Record<string, { kind: string; accept: string[]; formats: string; maxMb: number }> = {
  pphotos: { kind: "professionalPhotos", ...PHOTO_UPLOAD },
  bphotos: { kind: "businessPhotos", ...PHOTO_UPLOAD },
  videos: { kind: "videos", accept: ["video/mp4", "video/quicktime", "video/webm"], formats: "MP4, MOV or WEBM", maxMb: 200 },
  // The logo is uploaded the same way, and kept with the logo's own answers.
  logo: { kind: "logo", accept: [...PHOTO_UPLOAD.accept, "image/svg+xml"], formats: "PNG, JPG, WEBP, GIF or SVG", maxMb: 10 },
  // And so is what they attach to the style they'd like, when the logo is ours to design.
  logoStyle: { kind: "logoStyle", accept: [...PHOTO_UPLOAD.accept, "image/svg+xml"], formats: "PNG, JPG, WEBP, GIF or SVG", maxMb: 10 },
};
// How many files a kind can hold, and how many one upload can bring.
export const MEDIA_MAX_FILES = 40;
export const MEDIA_UPLOAD_MAX_FILES = 10;

export const MEDIA: Media[] = [
  {
    id: "pphotos",
    name: "Professional photos",
    about: "Headshots, team photos, photos of you at work",
    formats: "JPG, PNG, HEIC or ZIP",
    shoot: "photo shoot",
    notesPlaceholder: "e.g. headshots for 4 people, photos of the new office",
  },
  {
    id: "bphotos",
    name: "Business photos",
    about: "Your office, storefront, location, products or finished work",
    formats: "JPG, PNG, HEIC or ZIP",
    shoot: "photo shoot",
    notesPlaceholder: "e.g. headshots for 4 people, photos of the new office",
  },
  {
    id: "videos",
    name: "Professional videos",
    about: "Intro videos, client testimonials, ads, behind the scenes",
    formats: "MP4, MOV or ZIP",
    shoot: "video",
    notesPlaceholder: "e.g. a 60-second intro video for the homepage",
  },
];

// ── The new website's pages and features ─────────────────────────────────────

export const PAGE_CHOICES = ["Home", "About", "Services", "Contact", "Blog", "Testimonials / Reviews", "FAQ", "Team", "Gallery / Portfolio", "Locations"];
export const DEFAULT_PAGES = ["Home", "About", "Services", "Contact"];
export const FEATURE_CHOICES = ["Contact form", "Online booking", "Live chat", "Online payments", "Online store", "Spanish / second language", "Client login area"];
export const DEFAULT_FEATURES = ["Contact form"];
export const MAX_COMPETITORS = 5;

export const EMAIL_PROVIDERS = ["Google Workspace (Gmail)", "Microsoft 365 (Outlook)", "My hosting company", "Other", NOT_SURE];

// The goals' choices: the backend's key, and the words for it (models/client.model.ts — the
// same choices as the steps right after signing up, clientstart/ClientSignup).
export const GOAL_TIMEFRAMES = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "12_months", label: "12 months" },
  { value: "unsure", label: "Not sure" },
];
export const GOAL_BUDGETS = [
  { value: "under_1000", label: "Under $1,000" },
  { value: "1000_3000", label: "$1k–$3k" },
  { value: "3000_5000", label: "$3k–$5k" },
  { value: "5000_10000", label: "$5k–$10k" },
  { value: "over_10000", label: "$10k+" },
  { value: "unsure", label: "Not sure yet" },
];
// The numbers the goals ask for, today and as wanted: the answer's key, and how it is asked.
export const GOAL_TARGETS = [
  { id: "goal.rev", title: "Revenue per month", about: "How much money your business brings in each month, before expenses. A rough average is fine.", money: true, now: "50000", goal: "100000" },
  { id: "goal.leads", title: "Leads per month", about: "Everyone who reaches out: phone calls, website forms, emails and messages.", money: false, now: "20", goal: "40" },
  { id: "goal.clients", title: "New clients per month", about: "Leads who sign with you or become paying customers.", money: false, now: "6", goal: "12" },
];

// The most services or areas the backend keeps.
const MAX_LIST_ITEMS = 50;

// A list typed as one line, separated by commas.
export const listOf = (line: string) =>
  line
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

// ── The steps ────────────────────────────────────────────────────────────────

export type StepId = "contact" | "web" | "domain" | "email" | "logo" | "google" | "social" | "media";

export const STEPS: { id: StepId; title: string; heading: string; sub: string }[] = [
  { id: "contact", title: "About you", heading: "About you", sub: "Who we're setting up, and how to reach you. Your answers are saved under this email." },
  { id: "web", title: "Website", heading: "Your website", sub: "Tell us about your website, and whether you need a new one." },
  { id: "domain", title: "Domain and hosting", heading: "Domain and hosting", sub: "Where your website address and files live. Answer one at a time." },
  { id: "email", title: "Business email", heading: "Business email", sub: "An email address on your own domain, like you@yourbusiness.com." },
  { id: "logo", title: "Logo", heading: "Logo and brand", sub: "Your logo, colors and fonts." },
  { id: "google", title: "Google accounts", heading: "Google accounts", sub: "Google Maps, Analytics and more. Open each one and answer a quick question." },
  { id: "social", title: "Social media", heading: "Social media", sub: "Which accounts you have, and which you'd like us to create." },
  { id: "media", title: "Photos and videos", heading: "Photos and videos", sub: "Upload what you have. If you need new ones, your account manager will get back to you." },
];

// The steps that ask the client to invite the access email — where its card is shown.
export const EMAIL_STEPS: StepId[] = ["domain", "google", "social"];

// The items each step asks about, in order. Every one is always asked, whatever the answers.
export const itemsOf = (step: StepId): string[] => {
  switch (step) {
    case "contact":
      return ["contact"];
    case "web":
      return ["website"];
    case "domain":
      return ["domain", "hosting", "cms"];
    case "email":
      return ["email"];
    case "logo":
      return ["logo"];
    case "google":
      return GOOGLE.map((account) => account.id);
    case "social":
      return SOCIAL.map((account) => account.id);
    case "media":
      return MEDIA.map((media) => media.id);
    default:
      return [];
  }
};

// Steps with several items open them one at a time.
export const isAccordion = (step: StepId) => ["domain", "google", "social", "media"].includes(step);

// ── Who is answering ─────────────────────────────────────────────────────────

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The backend's phone rule: an optional "+" then 7–15 digits, once spaces and dashes are gone.
const PHONE_SHAPE = /^[+]?[0-9]{7,15}$/;

export const cleanPhone = (phone: string) => phone.replace(/[\s\-().]/g, "");

// What is missing or wrong in the client's own details — or null when they can be saved.
export const contactProblem = (answers: Answers): string | null => {
  const of = (key: string) => (typeof answers[key] === "string" ? (answers[key] as string).trim() : "");
  if (!of("contact.name")) return "Tell us your name.";
  if (!of("contact.company")) return "Tell us your company's name.";
  if (!EMAIL_SHAPE.test(of("contact.email"))) return "Enter a valid email address.";
  if (of("contact.phone") && !PHONE_SHAPE.test(cleanPhone(of("contact.phone")))) return "Enter a valid phone number, or leave it empty.";
  return null;
};

// ── To the backend and back ──────────────────────────────────────────────────

// The form's own names for the accounts and media, against the backend's.
const GOOGLE_FIELDS = { gbp: "businessProfile", ga: "analytics", gsc: "searchConsole", gtm: "tagManager", gads: "ads" } as const;
// X (Twitter) is no longer asked: what a client gave for it before stays on their record, untouched.
const SOCIAL_FIELDS = { fb: "facebook", ig: "instagram", yt: "youtube", li: "linkedin", tt: "tiktok", em: "email" } as const;
const MEDIA_FIELDS = { pphotos: "professionalPhotos", bphotos: "businessPhotos", videos: "videos" } as const;

// What a client isn't asked until the team turns it on: every step but who they are, their
// website, their business email and their logo. It stands until the team has saved a list of
// its own (company-portal: OnboardingControls → DEFAULT_NOT_NEEDED, which is the same list).
export const DEFAULT_NOT_NEEDED = ["step:domain", "step:google", "step:social", "step:media"];

// An item as the team's controls name it (company-portal: OnboardingControls): an account or a
// kind of media by its name on the record, under its section ("social.facebook"); anything
// else by its own id. A step is "step:" and its id.
export const controlIdOf = (item: string) => {
  const under = (section: string, fields: Record<string, string>) => (item in fields ? `${section}.${fields[item]}` : null);
  return under("google", GOOGLE_FIELDS) ?? under("social", SOCIAL_FIELDS) ?? under("media", MEDIA_FIELDS) ?? item;
};

const entriesOf = <Fields extends Record<string, string>>(fields: Fields) => Object.entries(fields) as [keyof Fields & string, Fields[keyof Fields]][];

// The answers as the backend stores them (client.onboarding). An empty answer is left out:
// each section replaces what was stored for it, so what isn't sent is cleared.
export const toBackend = (answers: Answers, competitors: Competitor[], pages: string[], features: string[]): OnboardingAnswers => {
  const text = (key: string) => {
    const value = answers[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const choice = <Choice extends string>(key: string) => text(key) as Choice | undefined;
  // A ticked box, or nothing — an unticked one says no more than a missing one.
  const flag = (key: string) => (answers[key] === true ? true : undefined);
  // "Shall we create it?" → yes, no, or not answered.
  const wants = (key: string) => (answers[key] === "yes" ? true : answers[key] === "no" ? false : undefined);

  const account = (id: string): OnboardingAccount => ({
    has: choice(`${id}.has`),
    link: text(`${id}.link`),
    // An account we get into with its own login has no other way of giving access to choose.
    access: answers[`${id}.has`] === "yes" && SOCIAL.some((account) => account.id === id && account.login) ? "secure" : choice(`${id}.access`),
    loginUsername: text(`${id}.username`),
    connected: flag(`${id}.connected`),
    accessGiven: flag(`${id}.done`),
    needsHelp: flag(`${id}.help`),
    // Where a no is the whole answer, nothing is to be created: the record says so, for the team.
    wantsCreated: SOCIAL.some((account) => account.id === id && account.yesOrNo) ? (answers[`${id}.has`] === "no" ? false : undefined) : wants(`${id}.create`),
    // Only when one was typed just now: the one already stored is kept by the backend.
    ...(typeof answers[`${id}.password`] === "string" && answers[`${id}.password`] !== "" ? { loginPassword: answers[`${id}.password`] as string } : {}),
  });
  const media = (id: string): OnboardingMedia => ({ mode: choice(`${id}.mode`), link: text(`${id}.link`), notes: text(`${id}.notes`) });
  // How they let us into a platform (the domain, hosting, the website's login): an invite to our
  // email, or the login itself — the password only when typed just now.
  const login = (id: string) => ({
    access: choice<"invite" | "secure">(`${id}.access`),
    loginUsername: answers[`${id}.access`] === "secure" ? text(`${id}.username`) : undefined,
    ...(answers[`${id}.access`] === "secure" && typeof answers[`${id}.password`] === "string" && answers[`${id}.password`] !== "" ? { loginPassword: answers[`${id}.password`] as string } : {}),
  });
  const accounts = Number(text("mail.n"));
  // A count or an amount of money: 0 or more, or not answered.
  const amount = (key: string) => {
    const value = Number(text(key) ?? NaN);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  const target = (key: string) => {
    const pair = { current: amount(`${key}.now`), goal: amount(`${key}.goal`) };
    return pair.current === undefined && pair.goal === undefined ? undefined : pair;
  };
  // What signing up asked that this form doesn't (the services, the main contact, what leads
  // cost and come from) is sent back as it came, so saving these sections doesn't clear it.
  const contact = {
    isAccountOwner: typeof answers["biz.c.owner"] === "boolean" ? answers["biz.c.owner"] : undefined,
    name: text("biz.c.name"),
    email: text("biz.c.email"),
    phone: text("biz.c.phone"),
    reachBy: choice<"email" | "phone" | "text">("biz.c.reach"),
  };

  return {
    business: {
      description: text("biz.desc"),
      services: listOf(text("biz.services") ?? ""),
      areas: listOf(text("biz.areas") ?? ""),
      contact: Object.values(contact).some((value) => value !== undefined) ? contact : undefined,
    },
    goals: {
      revenue: target("goal.rev"),
      leads: target("goal.leads"),
      newClients: target("goal.clients"),
      timeframe: choice("goal.time"),
      budget: choice("goal.budget"),
      costPerLead: amount("goal.cpl"),
      clientValue: amount("goal.value"),
      leadSources: listOf(text("goal.sources") ?? "") as NonNullable<OnboardingAnswers["goals"]>["leadSources"],
    },
    website: {
      url: text("web.url"),
      hasNone: flag("web.none"),
      need: choice("web.need"),
      description: text("web.desc"),
      competitors: competitors.map(({ url, note }) => ({ url: url.trim() || undefined, note: note.trim() || undefined })).filter((row) => row.url || row.note),
      pages,
      features,
    },
    domain: {
      has: choice("dom.has"),
      name: text("dom.name"),
      platform: text("dom.platform"),
      ...login("dom"),
      accessGiven: flag("dom.done"),
      needsHelp: flag("dom.help"),
      wantsCreated: wants("dom.create"),
      wishlist: text("dom.wish"),
    },
    hosting: { has: choice("host.has"), platform: text("host.platform"), ...login("host"), accessGiven: flag("host.done"), needsHelp: flag("host.help"), wantsCreated: wants("host.create") },
    cms: {
      has: choice("cms.has"),
      giving: choice("cms.give"),
      platform: text("cms.platform"),
      developer: text("cms.dev"),
      ...login("cms"),
      accessGiven: flag("cms.done"),
      needsHelp: flag("cms.help"),
    },
    email: {
      has: choice("mail.has"),
      provider: text("mail.prov"),
      wantsCreated: wants("mail.create"),
      accounts: Number.isInteger(accounts) && accounts >= 1 ? accounts : undefined,
      addresses: text("mail.addr"),
    },
    logo: { has: choice("logo.has"), link: text("logo.link"), wantsCreated: wants("logo.create"), style: text("logo.style") },
    google: Object.fromEntries(entriesOf(GOOGLE_FIELDS).map(([id, field]) => [field, account(id)])),
    social: Object.fromEntries(entriesOf(SOCIAL_FIELDS).map(([id, field]) => [field, account(id)])),
    media: Object.fromEntries(entriesOf(MEDIA_FIELDS).map(([id, field]) => [field, media(id)])),
  };
};

// The domain in a web address: "https://www.example.com/contact" is example.com.
export const hostOf = (url?: string) =>
  (url ?? "")
    .trim()
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();

// The other way: a stored onboarding as the form holds it, to carry on from.
// `files` are the photos and videos uploaded so far, by the id of their item on the form.
export const fromBackend = (stored: Onboarding): { answers: Answers; competitors: Competitor[]; pages: string[]; features: string[]; files: Record<string, OnboardingFile[]> } => {
  const saved = stored.onboarding ?? { status: "in_progress" as const };
  const answers: Answers = {
    "contact.name": stored.contactName,
    "contact.company": stored.companyName,
    "contact.email": stored.email,
    "contact.phone": stored.phone ?? "",
  };
  const put = (key: string, value: string | boolean | number | undefined) => {
    if (value !== undefined && value !== "") answers[key] = typeof value === "number" ? String(value) : value;
  };
  const yesNo = (value?: boolean) => (value === undefined ? undefined : value ? "yes" : "no");

  const { business, goals, website, domain, hosting, cms, email, logo } = saved;
  put("biz.desc", business?.description);
  put("biz.services", business?.services?.join(", "));
  put("biz.areas", business?.areas?.join(", "));
  put("biz.c.owner", business?.contact?.isAccountOwner);
  put("biz.c.name", business?.contact?.name);
  put("biz.c.email", business?.contact?.email);
  put("biz.c.phone", business?.contact?.phone);
  put("biz.c.reach", business?.contact?.reachBy);
  put("goal.rev.now", goals?.revenue?.current);
  put("goal.rev.goal", goals?.revenue?.goal);
  put("goal.leads.now", goals?.leads?.current);
  put("goal.leads.goal", goals?.leads?.goal);
  put("goal.clients.now", goals?.newClients?.current);
  put("goal.clients.goal", goals?.newClients?.goal);
  put("goal.time", goals?.timeframe);
  put("goal.budget", goals?.budget);
  put("goal.cpl", goals?.costPerLead);
  put("goal.value", goals?.clientValue);
  put("goal.sources", goals?.leadSources?.join(","));
  put("web.url", website?.url);
  put("web.none", website?.hasNone);
  put("web.need", website?.need);
  put("web.desc", website?.description);
  put("dom.has", domain?.has);
  put("dom.name", domain?.name);
  put("dom.platform", domain?.platform);
  put("dom.done", domain?.accessGiven);
  put("dom.help", domain?.needsHelp);
  put("dom.create", yesNo(domain?.wantsCreated));
  put("dom.wish", domain?.wishlist);
  for (const [id, platform] of [["dom", domain], ["host", hosting], ["cms", cms]] as const) {
    put(`${id}.access`, platform?.access);
    put(`${id}.username`, platform?.loginUsername);
    put(`${id}.passwordSet`, platform?.loginPasswordSet);
  }
  // A website they gave is on a domain they have: the domain's answers start from it, so it
  // isn't asked again (OnboardingProcess → DomainItem).
  const siteHost = website?.hasNone ? "" : hostOf(website?.url);
  if (siteHost && !domain?.has) put("dom.has", "yes");
  if (siteHost && !domain?.name && (domain?.has ?? "yes") === "yes") put("dom.name", siteHost);
  put("host.has", hosting?.has);
  put("host.platform", hosting?.platform);
  put("host.done", hosting?.accessGiven);
  put("host.help", hosting?.needsHelp);
  put("host.create", yesNo(hosting?.wantsCreated));
  // Saved before it was asked: a platform named means there is one.
  put("cms.has", cms?.has ?? (cms?.platform ? "yes" : undefined));
  put("cms.give", cms?.giving);
  put("cms.platform", cms?.platform);
  put("cms.dev", cms?.developer);
  put("cms.done", cms?.accessGiven);
  put("cms.help", cms?.needsHelp);
  put("mail.has", email?.has);
  put("mail.prov", email?.provider);
  put("mail.create", yesNo(email?.wantsCreated));
  put("mail.n", email?.accounts ?? 1);
  put("mail.addr", email?.addresses);
  put("logo.has", logo?.has);
  put("logo.link", logo?.link);
  put("logo.create", yesNo(logo?.wantsCreated));
  put("logo.style", logo?.style);

  const accounts = [...entriesOf(GOOGLE_FIELDS).map(([id, field]) => [id, saved.google?.[field]] as const), ...entriesOf(SOCIAL_FIELDS).map(([id, field]) => [id, saved.social?.[field]] as const)];
  for (const [id, account] of accounts) {
    put(`${id}.has`, account?.has);
    put(`${id}.link`, account?.link);
    put(`${id}.access`, account?.access);
    put(`${id}.done`, account?.accessGiven);
    put(`${id}.help`, account?.needsHelp);
    put(`${id}.create`, yesNo(account?.wantsCreated));
    put(`${id}.username`, account?.loginUsername);
    put(`${id}.connected`, account?.connected);
    put(`${id}.passwordSet`, account?.loginPasswordSet);
  }
  // The logo's files, with the photos and videos: all uploaded the same way.
  const files: Record<string, OnboardingFile[]> = { logo: logo?.files ?? [], logoStyle: logo?.styleFiles ?? [] };
  put("logo.hasFiles", files.logo.length > 0);
  for (const [id, field] of entriesOf(MEDIA_FIELDS)) {
    const media = saved.media?.[field];
    put(`${id}.mode`, media?.mode);
    put(`${id}.link`, media?.link);
    put(`${id}.notes`, media?.notes);
    files[id] = media?.files ?? [];
    // For where the item stands (mediaStanding), which only sees the answers.
    put(`${id}.hasFiles`, files[id].length > 0);
  }

  const rows = (website?.competitors ?? []).map((row, index) => ({ id: index + 1, url: row.url ?? "", note: row.note ?? "" }));
  return {
    answers,
    // There is always a row to fill in.
    competitors: rows.length ? rows : [{ id: 1, url: "", note: "" }, { id: 2, url: "", note: "" }],
    // Only once the website section has been saved do its lists stand for the client's choice.
    pages: website ? (website.pages ?? []) : DEFAULT_PAGES,
    features: website ? (website.features ?? []) : DEFAULT_FEATURES,
    files,
  };
};

// ── Where each item stands ───────────────────────────────────────────────────

export type Tone = "todo" | "done" | "pending" | "create" | "followup";
export type Status = { id: string; group: string; name: string; label: string; tone: Tone };

const NOT_ANSWERED = "Not answered";
const NOT_NEEDED = "Not needed";
type Standing = [label: string, tone: Tone];
const TODO: Standing = [NOT_ANSWERED, "todo"];
const NA: Standing = [NOT_NEEDED, "todo"];

export const isAnswered = (status: Status) => status.label !== NOT_ANSWERED;

// "Do you have it?" → no → "shall we create it?"
const wanted = (answers: Answers, id: string, creating: string): Standing =>
  answers[`${id}.create`] === "yes" ? [creating, "create"] : answers[`${id}.create`] === "no" ? NA : TODO;

// Once access is being given by invite: given, stuck, or still to do.
const inviting = (answers: Answers, id: string): Standing =>
  answers[`${id}.done`] === true ? ["Access given", "done"] : answers[`${id}.help`] === true ? ["Needs help", "followup"] : ["Waiting on access", "pending"];

// Access to a platform: by invite (given, stuck, or still to do), or by the login they share.
const platformAccess = (answers: Answers, id: string): Standing => {
  if (answers[`${id}.access`] !== "secure") return inviting(answers, id);
  const username = typeof answers[`${id}.username`] === "string" && (answers[`${id}.username`] as string).trim();
  const password = answers[`${id}.passwordSet`] === true || (typeof answers[`${id}.password`] === "string" && answers[`${id}.password`] !== "");
  return username && password ? ["Login shared", "done"] : ["Waiting for the login", "pending"];
};

const platformStanding = (answers: Answers, id: string, group: PlatformGroup, creating: string): Standing => {
  const has = answers[`${id}.has`];
  if (has === "yes") {
    const platform = answers[`${id}.platform`];
    if (typeof platform !== "string" || !platform) return ["Pick a platform", "pending"];
    const access = accessOf(group, platform);
    if (access === "unsure") return ["We'll help find it", "followup"];
    if (access === "builder") return ["Included with site", "done"];
    if (access === "dev") return ["We'll contact your developer", "followup"];
    return platformAccess(answers, id);
  }
  if (has === "no") return wanted(answers, id, creating);
  if (has === "unsure") return ["We'll check", "followup"];
  return TODO;
};

// Hosting on a site builder: the builder is the CMS too, and its dashboard is the way in.
export const onBuilder = (answers: Answers) => {
  const platform = answers["host.platform"];
  return answers["host.has"] === "yes" && typeof platform === "string" && Boolean(platform) && accessOf("host", platform) === "builder";
};

// The website's login: whether there is a CMS, what access they give, and then that access.
const cmsStanding = (answers: Answers): Standing => {
  const builder = onBuilder(answers);
  const has = builder ? "yes" : answers["cms.has"];
  if (has === "no") return ["No CMS — hosting is enough", "done"];
  if (has === "unsure") return ["We'll check", "followup"];
  if (has !== "yes") return TODO;
  // Into the hosting only: the website is reached through it.
  if (!builder && answers["host.has"] === "yes" && answers["cms.give"] === "hosting") return ["Through the hosting", "done"];
  const platform = answers["cms.platform"];
  if (typeof platform !== "string" || !platform) return ["Pick a platform", "pending"];
  const access = accessOf("cms", platform);
  if (access === "unsure") return ["We'll help find it", "followup"];
  if (access === "dev") return ["We'll contact your developer", "followup"];
  return platformAccess(answers, "cms");
};

const accountStanding = (answers: Answers, id: string): Standing => {
  const has = answers[`${id}.has`];
  const own = SOCIAL.find((account) => account.id === id);
  if (has === "yes") {
    const access = own?.login ? "secure" : own?.grant ? "invite" : answers[`${id}.access`];
    if (!access) return ["Choose access", "pending"];
    // Its own login is asked for on the form itself: both halves, or it isn't answered yet.
    if (access === "secure" && own?.login) {
      return answers[`${id}.username`] && (answers[`${id}.password`] || answers[`${id}.passwordSet`] === true) ? ["Login shared", "done"] : TODO;
    }
    if (access === "secure") return ["Secure link coming", "followup"];
    return inviting(answers, id);
  }
  if (has === "no") return own?.yesOrNo ? NA : wanted(answers, id, "We'll create it");
  if (has === "unsure") return ["We'll check", "followup"];
  return TODO;
};

const mediaStanding = (answers: Answers, id: string): Standing => {
  const mode = answers[`${id}.mode`];
  if (mode === "upload") return answers[`${id}.hasFiles`] === true ? ["Files uploaded", "done"] : answers[`${id}.link`] ? ["Link shared", "done"] : ["Upload or share a link", "pending"];
  if (mode === "create") return ["Manager will follow up", "followup"];
  if (mode === "none") return NA;
  return TODO;
};

// Every item on the form, with where it stands — for its pill and the progress.
export const statusesOf = (answers: Answers): Status[] => {
  const list: Status[] = [];
  const add = (group: string, id: string, name: string, [label, tone]: Standing) => list.push({ id, group, name, label, tone });

  add("About you", "contact", "Your details", contactProblem(answers) ? TODO : ["Details added", "done"]);

  const need = answers["web.need"];
  add(
    "Website and domain",
    "website",
    "Website",
    need === "new" ? ["New website", "create"] : need === "redesign" ? ["Redesign", "create"] : need === "no" ? ["Keeping current site", "done"] : TODO,
  );
  add("Website and domain", "domain", "Domain name", platformStanding(answers, "dom", "registrar", "We'll register it"));
  add(
    "Website and domain",
    "hosting",
    "Hosting",
    // With a CMS, they can let us into its dashboard alone: the hosting is then not needed.
    answers["host.has"] === "yes" && !onBuilder(answers) && answers["cms.has"] === "yes" && answers["cms.give"] === "cms" && answers["web.none"] !== true
      ? ["Dashboard access instead", "done"]
      : platformStanding(answers, "host", "host", "We'll set it up"),
  );
  if (answers["web.none"] !== true) add("Website and domain", "cms", "Website login", cmsStanding(answers));

  const mail = answers["mail.has"];
  add("Website and domain", "email", "Business email", mail === "yes" ? ["Have it", "done"] : mail === "no" ? wanted(answers, "mail", "Google Workspace") : TODO);

  const logo = answers["logo.has"];
  add(
    "Logo",
    "logo",
    "Logo",
    logo === "yes"
      ? answers["logo.hasFiles"] === true
        ? ["Logo uploaded", "done"]
        : answers["logo.link"]
          ? ["Link shared", "done"]
          : ["Share your logo", "pending"]
      : logo === "no"
        ? wanted(answers, "logo", "We'll design it")
        : TODO,
  );

  for (const account of GOOGLE) add("Google", account.id, account.short, accountStanding(answers, account.id));
  for (const account of SOCIAL) add("Social media", account.id, account.short, accountStanding(answers, account.id));
  for (const media of MEDIA) add("Photos and videos", media.id, media.name, mediaStanding(answers, media.id));
  return list;
};
