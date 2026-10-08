import type { Onboarding, OnboardingAccount, OnboardingAnswers, OnboardingMedia } from "@/app/actions/onboarding";

// What the onboarding form asks, how each answer is read, and how the answers go to the
// backend and come back. Kept apart from the form so the questions can change without
// touching how they are drawn.

// The address clients invite to their accounts. Change it to the team's access email.
export const AGENCY_EMAIL = "access@bayshorecommunication.org";

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
export type Account = { id: string; name: string; short: string; placeholder?: string; role?: string; steps: string[] | null };

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
    steps: [
      "Open *Meta Business Suite* (business.facebook.com) and choose your Page.",
      "Go to *Settings → Business assets* (or *Page access*).",
      "Click *Add people* and enter {email}.",
      "Turn on full control and send the invite.",
    ],
  },
  {
    id: "ig",
    name: "Instagram",
    short: "Instagram",
    placeholder: "@yourbusiness",
    steps: [
      "Make sure your Instagram is a *Business* or *Creator* account linked to your Facebook Page.",
      "Open *Meta Business Suite → Settings → Instagram accounts*.",
      "Click *Add people* and enter {email}.",
      "Turn on full control and send the invite.",
    ],
  },
  {
    id: "yt",
    name: "YouTube",
    short: "YouTube",
    placeholder: "youtube.com/@yourbusiness",
    steps: ["Open *YouTube Studio* (studio.youtube.com).", "Go to *Settings → Permissions*.", "Click *Invite* and enter {email}.", "Choose *Manager* and click *Save*."],
  },
  {
    id: "li",
    name: "LinkedIn Company Page",
    short: "LinkedIn",
    placeholder: "linkedin.com/company/…",
    steps: [
      "Open your Company Page as an admin.",
      "Click *Settings → Manage admins*.",
      "Click *Add admin* and search for your BayShore account manager.",
      "Choose *Super admin* and save.",
    ],
  },
  {
    id: "tt",
    name: "TikTok",
    short: "TikTok",
    placeholder: "@yourbusiness",
    steps: ["Sign in to *TikTok Business Center*.", "Open *Users → Members*.", "Click *Invite member* and enter {email}.", "Choose *Admin* and send the invite."],
  },
  { id: "x", name: "X (Twitter)", short: "X (Twitter)", placeholder: "@yourbusiness", steps: null },
];

// ── Photos and videos ────────────────────────────────────────────────────────

export type Media = { id: string; name: string; about: string; formats: string; shoot: string; notesPlaceholder: string };

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

// ── The steps ────────────────────────────────────────────────────────────────

export type StepId = "contact" | "web" | "domain" | "email" | "logo" | "google" | "social" | "media" | "review";

export const STEPS: { id: StepId; title: string; heading: string; sub: string }[] = [
  { id: "contact", title: "About you", heading: "About you", sub: "Who we're setting up, and how to reach you. Your answers are saved under this email." },
  { id: "web", title: "Website", heading: "Your website", sub: "Tell us about your website, and whether you need a new one." },
  { id: "domain", title: "Domain and hosting", heading: "Domain and hosting", sub: "Where your website address and files live. Answer one at a time." },
  { id: "email", title: "Business email", heading: "Business email", sub: "An email address on your own domain, like you@yourbusiness.com." },
  { id: "logo", title: "Logo", heading: "Logo and brand", sub: "Your logo, colors and fonts." },
  { id: "google", title: "Google accounts", heading: "Google accounts", sub: "Google Maps, Analytics and more. Open each one and answer a quick question." },
  { id: "social", title: "Social media", heading: "Social media", sub: "Which accounts you have, and which you'd like us to create." },
  { id: "media", title: "Photos and videos", heading: "Photos and videos", sub: "Upload what you have. If you need new ones, your account manager will get back to you." },
  { id: "review", title: "Review and submit", heading: "Review and submit", sub: "Here's everything at a glance. Click any item to change it." },
];

// The steps that ask the client to invite the access email — where its card is shown.
export const EMAIL_STEPS: StepId[] = ["domain", "google", "social"];

// The items each step asks about, in order. The website login is skipped without a website.
export const itemsOf = (step: StepId, answers: Answers): string[] => {
  switch (step) {
    case "contact":
      return ["contact"];
    case "web":
      return ["website"];
    case "domain":
      return ["domain", "hosting", ...(answers["web.none"] === true ? [] : ["cms"])];
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

export const stepOfItem = (item: string): StepId => STEPS.find((step) => itemsOf(step.id, {}).includes(item))?.id ?? "web";

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
const SOCIAL_FIELDS = { fb: "facebook", ig: "instagram", yt: "youtube", li: "linkedin", tt: "tiktok", x: "x" } as const;
const MEDIA_FIELDS = { pphotos: "professionalPhotos", bphotos: "businessPhotos", videos: "videos" } as const;

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
    access: choice(`${id}.access`),
    accessGiven: flag(`${id}.done`),
    needsHelp: flag(`${id}.help`),
    wantsCreated: wants(`${id}.create`),
  });
  const media = (id: string): OnboardingMedia => ({ mode: choice(`${id}.mode`), link: text(`${id}.link`), notes: text(`${id}.notes`) });
  const accounts = Number(text("mail.n"));

  return {
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
      accessGiven: flag("dom.done"),
      needsHelp: flag("dom.help"),
      wantsCreated: wants("dom.create"),
      wishlist: text("dom.wish"),
    },
    hosting: { has: choice("host.has"), platform: text("host.platform"), accessGiven: flag("host.done"), needsHelp: flag("host.help"), wantsCreated: wants("host.create") },
    cms: { platform: text("cms.platform"), developer: text("cms.dev"), accessGiven: flag("cms.done"), needsHelp: flag("cms.help") },
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

// The other way: a stored onboarding as the form holds it, to carry on from.
export const fromBackend = (stored: Onboarding): { answers: Answers; competitors: Competitor[]; pages: string[]; features: string[] } => {
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

  const { website, domain, hosting, cms, email, logo } = saved;
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
  put("host.has", hosting?.has);
  put("host.platform", hosting?.platform);
  put("host.done", hosting?.accessGiven);
  put("host.help", hosting?.needsHelp);
  put("host.create", yesNo(hosting?.wantsCreated));
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
  }
  for (const [id, field] of entriesOf(MEDIA_FIELDS)) {
    const media = saved.media?.[field];
    put(`${id}.mode`, media?.mode);
    put(`${id}.link`, media?.link);
    put(`${id}.notes`, media?.notes);
  }

  const rows = (website?.competitors ?? []).map((row, index) => ({ id: index + 1, url: row.url ?? "", note: row.note ?? "" }));
  return {
    answers,
    // There is always a row to fill in.
    competitors: rows.length ? rows : [{ id: 1, url: "", note: "" }, { id: 2, url: "", note: "" }],
    // Only once the website section has been saved do its lists stand for the client's choice.
    pages: website ? (website.pages ?? []) : DEFAULT_PAGES,
    features: website ? (website.features ?? []) : DEFAULT_FEATURES,
  };
};

// The items whose access was given by ticking off every step — so the steps show ticked again.
export const accessGivenIds = (answers: Answers) => Object.keys(answers).filter((key) => key.endsWith(".done") && answers[key] === true).map((key) => key.slice(0, -".done".length));

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

const platformStanding = (answers: Answers, id: string, group: PlatformGroup, creating: string): Standing => {
  const has = answers[`${id}.has`];
  if (has === "yes") {
    const platform = answers[`${id}.platform`];
    if (typeof platform !== "string" || !platform) return ["Pick a platform", "pending"];
    const access = accessOf(group, platform);
    if (access === "unsure") return ["We'll help find it", "followup"];
    if (access === "builder") return ["Included with site", "done"];
    if (access === "dev") return ["We'll contact your developer", "followup"];
    return inviting(answers, id);
  }
  if (has === "no") return wanted(answers, id, creating);
  if (has === "unsure") return ["We'll check", "followup"];
  return TODO;
};

const cmsStanding = (answers: Answers): Standing => {
  const platform = answers["cms.platform"];
  if (typeof platform !== "string" || !platform) return TODO;
  const access = accessOf("cms", platform);
  if (access === "unsure") return ["We'll help find it", "followup"];
  if (access === "dev") return ["We'll contact your developer", "followup"];
  return inviting(answers, "cms");
};

const accountStanding = (answers: Answers, id: string): Standing => {
  const has = answers[`${id}.has`];
  if (has === "yes") {
    const access = answers[`${id}.access`];
    if (!access) return ["Choose access", "pending"];
    if (access === "secure") return ["Secure link coming", "followup"];
    return inviting(answers, id);
  }
  if (has === "no") return wanted(answers, id, "We'll create it");
  if (has === "unsure") return ["We'll check", "followup"];
  return TODO;
};

const mediaStanding = (answers: Answers, id: string): Standing => {
  const mode = answers[`${id}.mode`];
  if (mode === "upload") return answers[`${id}.link`] ? ["Link shared", "done"] : ["Share a link", "pending"];
  if (mode === "create") return ["Manager will follow up", "followup"];
  if (mode === "none") return NA;
  return TODO;
};

// Every item on the form, with where it stands — for its pill, the progress and the review.
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
  add("Website and domain", "hosting", "Hosting", platformStanding(answers, "host", "host", "We'll set it up"));
  if (answers["web.none"] !== true) add("Website and domain", "cms", "Website login", cmsStanding(answers));

  const mail = answers["mail.has"];
  add("Website and domain", "email", "Business email", mail === "yes" ? ["Have it", "done"] : mail === "no" ? wanted(answers, "mail", "Google Workspace") : TODO);

  const logo = answers["logo.has"];
  add(
    "Logo",
    "logo",
    "Logo",
    logo === "yes" ? (answers["logo.link"] ? ["Link shared", "done"] : ["Share your logo", "pending"]) : logo === "no" ? wanted(answers, "logo", "We'll design it") : TODO,
  );

  for (const account of GOOGLE) add("Google", account.id, account.short, accountStanding(answers, account.id));
  for (const account of SOCIAL) add("Social media", account.id, account.short, accountStanding(answers, account.id));
  for (const media of MEDIA) add("Photos and videos", media.id, media.name, mediaStanding(answers, media.id));
  return list;
};
