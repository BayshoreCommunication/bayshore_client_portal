"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AtSign, Building2, Camera, Check, ChevronDown, CircleAlert, Copy, ExternalLink, FileText, Globe, Info, KeyRound, LifeBuoy, Link2, ListChecks, Loader2, Lock, Mail, MapPin, Palette, Pencil, Phone, Plus, Server, Upload, User, Users, X, type LucideIcon } from "lucide-react";
import { deleteOnboardingAction, startOnboardingAction, updateMyOnboardingAction, updateOnboardingAction, type Onboarding, type OnboardingFile } from "@/app/actions/onboarding";
import { formatFileSize } from "@/component/projects/projectUi";
import { poppins } from "@/component/shared/fonts";
import {
  AGENCY_EMAIL,
  DEFAULT_FEATURES,
  DEFAULT_PAGES,
  EMAIL_PROVIDERS,
  DEFAULT_NOT_NEEDED,
  EMAIL_STEPS,
  controlIdOf,
  FEATURE_CHOICES,
  GOOGLE,
  MAX_COMPETITORS,
  MEDIA,
  MEDIA_MAX_FILES,
  MEDIA_UPLOAD,
  MEDIA_UPLOAD_MAX_FILES,
  PAGE_CHOICES,
  SOCIAL,
  STEPS,
  accessOf,
  cleanPhone,
  contactProblem,
  fromBackend,
  isAccordion,
  isAnswered,
  itemsOf,
  platformsOf,
  statusesOf,
  toBackend,
  type Account,
  type Answers,
  type Competitor,
  type Media,
  type PlatformGroup,
  type StepId,
  type Tone,
} from "./onboardingData";

// The client's onboarding form: who they are, then eight short steps about their website,
// accounts and brand, one question at a time, with a running summary beside it. The answers
// are saved to the backend as the client moves through the steps (app/actions/onboarding.ts),
// so the same browser can come back later and carry on.

// ── Looks ────────────────────────────────────────────────────────────────────

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const inputClass =
  "w-full rounded-lg border border-[#e2e5e9] bg-[#fafbfc] px-3 py-2.5 text-[13px] text-[#1f2530] outline-none placeholder:text-[#9ca3af] focus:border-[#2f5fd8] focus:bg-white focus:ring-3 focus:ring-[#2f5fd8]/15 disabled:cursor-not-allowed disabled:opacity-60";
// A label or question, and the same at the top of its block (no gap above it).
const firstLabelClass = "mb-1.5 block text-[12.5px] font-semibold text-[#374151]";
const labelClass = `mt-3.5 ${firstLabelClass}`;
const firstQuestionClass = "mb-2 text-[12.5px] font-semibold text-[#374151]";
const questionClass = `mt-3.5 ${firstQuestionClass}`;
const hintClass = "text-[11.5px] text-[#6b7280]";
const smallButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1f2530] hover:border-[#2f5fd8] hover:text-[#2f5fd8] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#e2e5e9] disabled:hover:text-[#1f2530]";

const PILL: Record<Tone, string> = {
  todo: "bg-[#eef0f3] text-[#6b7280]",
  done: "bg-[#e7f6ec] text-[#15803d]",
  pending: "bg-[#fef3c7] text-[#b45309]",
  create: "bg-[#e8effd] text-[#2f5fd8]",
  followup: "bg-[#f1ebfe] text-[#6d28d9]",
};

// Where a step stands, in the colors of the team's own map of the onboarding (company-portal:
// OnboardingControls): each with how its number is drawn, and what that means to the client.
type StepStanding = "approved" | "filled" | "help" | "wait";
const STEP_STANDINGS: StepStanding[] = ["approved", "filled", "help", "wait"];
const STEP_DOTS: Record<StepStanding, [dot: string, meaning: string]> = {
  approved: ["border-[#16A34A] bg-[#16A34A] text-white", "Approved"],
  filled: ["border-[#16A34A] bg-white text-[#15803D]", "Answered, in review"],
  help: ["border-[#7C3AED] bg-[#7C3AED] text-white", "We\u2019re helping"],
  wait: ["border-[#D97706] bg-[#D97706] text-white", "Waiting on you"],
};

const NOTE = {
  blue: "bg-[#e8effd] text-[#1e3a8a]",
  green: "bg-[#e7f6ec] text-[#14532d]",
  violet: "bg-[#f1ebfe] text-[#4c1d95]",
  amber: "bg-[#fef3c7] text-[#78350f]",
};

const STEP_ICONS: Record<StepId, LucideIcon> = {
  contact: User,
  web: Globe,
  domain: Server,
  email: Mail,
  logo: Palette,
  google: MapPin,
  social: Users,
  media: Camera,
};

// ── Small pieces ─────────────────────────────────────────────────────────────

const Pill = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${PILL[tone]}`}>{children}</span>
);

const Note = ({ tone, icon: Icon, children }: { tone: keyof typeof NOTE; icon?: LucideIcon; children: ReactNode }) => (
  <div className={`mt-3 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[12.5px] leading-normal ${NOTE[tone]}`}>
    {Icon ? <Icon size={16} strokeWidth={2} className="mt-px shrink-0" /> : null}
    <span>{children}</span>
  </div>
);

const AccessEmail = () => (
  <code className="rounded-md bg-[#e8effd] px-1.5 py-px font-mono text-[11.5px] font-semibold break-all text-[#2f5fd8]">{AGENCY_EMAIL}</code>
);

// An instruction with its marks drawn: *bold*, and {email} as the access address.
const Rich = ({ text }: { text: string }) => (
  <>
    {text.split(/(\*[^*]+\*|\{email\})/).map((part, index) =>
      part === "{email}" ? (
        <AccessEmail key={index} />
      ) : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
        <b key={index} className="font-semibold">
          {part.slice(1, -1)}
        </b>
      ) : (
        part
      ),
    )}
  </>
);

// Opens and closes its content by growing and shrinking. The side padding keeps the focus
// rings of the fields inside from being cut off while it is clipped.
const Collapse = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <AnimatePresence initial={false}>
    {open ? (
      <motion.div
        key="content"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="-mx-1 overflow-hidden px-1"
      >
        {children}
      </motion.div>
    ) : null}
  </AnimatePresence>
);

// What follows from an answer: the next question, set in from the left.
const Reveal = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <Collapse open={open}>
    <div className="mt-3 border-l-[3px] border-[#e8effd] py-0.5 pb-1 pl-4">{children}</div>
  </Collapse>
);

type Choice = { value: string; label: string };
const YES_NO_UNSURE: Choice[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

// One answer out of a few, as buttons.
const Options = ({ label, value, choices, onChange }: { label: string; value: unknown; choices: Choice[]; onChange: (value: string) => void }) => (
  <div role="group" aria-label={label} className="flex flex-wrap gap-2">
    {choices.map((choice) => {
      const on = value === choice.value;
      return (
        <button
          key={choice.value}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(choice.value)}
          className={`cursor-pointer rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
            on ? "border-[#2f5fd8] bg-[#e8effd] text-[#2f5fd8]" : "border-[#e2e5e9] bg-[#fafbfc] text-[#1f2530] hover:border-[#c7cbd1]"
          }`}
        >
          {choice.label}
        </button>
      );
    })}
  </div>
);

// Several answers out of many, as chips.
const Chips = ({ choices, chosen, onToggle }: { choices: string[]; chosen: string[]; onToggle: (choice: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {choices.map((choice) => {
      const on = chosen.includes(choice);
      return (
        <button
          key={choice}
          type="button"
          aria-pressed={on}
          onClick={() => onToggle(choice)}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            on ? "border-[#2f5fd8] bg-[#e8effd] text-[#2f5fd8]" : "border-[#e2e5e9] bg-[#fafbfc] text-[#1f2530] hover:border-[#c7cbd1]"
          }`}
        >
          {choice}
        </button>
      );
    })}
  </div>
);

// ── What the form's pieces share ─────────────────────────────────────────────

type Form = {
  answers: Answers;
  set: (key: string, value: string | boolean | undefined) => void;
  patch: (changes: Answers) => void;
  // The photos and videos uploaded so far, by the id of their item; and whether more can be
  // (only someone signed in can upload — the files go onto their own record).
  files: Record<string, OnboardingFile[]>;
  setFiles: (id: string, files: OnboardingFile[]) => void;
  canUpload: boolean;
  say: (message: string) => void;
};

// The backend's limits for a short answer and a long one (models/client.model.ts).
const TEXT_MAX = 300;
const LONG_TEXT_MAX = 2000;

const text = (answers: Answers, key: string) => {
  const value = answers[key];
  return typeof value === "string" ? value : "";
};

const Field = ({
  form,
  id,
  name,
  label,
  hint,
  type = "text",
  placeholder,
  first = false,
  disabled = false,
  autoComplete,
  maxLength = TEXT_MAX,
}: {
  form: Form;
  id: string;
  // The answer's key.
  name: string;
  label: ReactNode;
  hint?: string;
  type?: "text" | "url" | "number" | "email" | "tel" | "password";
  placeholder?: string;
  first?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  maxLength?: number;
}) => (
  <div>
    <label htmlFor={id} className={first ? firstLabelClass : labelClass}>
      {label}
      {hint ? <span className={`${hintClass} font-normal`}> {hint}</span> : null}
    </label>
    <input
      id={id}
      type={type}
      min={type === "number" ? 1 : undefined}
      maxLength={type === "number" ? undefined : maxLength}
      className={inputClass}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      value={text(form.answers, name)}
      onChange={(event) => form.set(name, event.target.value)}
    />
  </div>
);

const Select = ({ form, id, name, label, choices, first = false }: { form: Form; id: string; name: string; label: string; choices: string[]; first?: boolean }) => (
  <div>
    <label htmlFor={id} className={first ? firstLabelClass : labelClass}>
      {label}
    </label>
    <select id={id} className={`${inputClass} cursor-pointer`} value={text(form.answers, name)} onChange={(event) => form.set(name, event.target.value)}>
      <option value="">Select one</option>
      {choices.map((choice) => (
        <option key={choice}>{choice}</option>
      ))}
    </select>
  </div>
);

// Giving us access to something — a registrar, a host, a website builder, a Google account —
// without a list of steps to follow: the email to add us with, and one answer — it has been
// given, or help is needed. `how` says what to do with the email, where "as an admin" isn't
// it; `account` is for a Google or social account, whose record also says access is by invite.
const EmailAccess = ({ form, id, platform, how = "Add this email to your account as an admin, then let us know.", account = false }: { form: Form; id: string; platform: string; how?: string; account?: boolean }) => {
  const given = form.answers[`${id}.done`] === true;
  const needsHelp = form.answers[`${id}.help`] === true;
  // One or the other; choosing the same one again takes it back.
  const choose = (which: "done" | "help") =>
    form.patch({ ...(account ? { [`${id}.access`]: "invite" } : {}), [`${id}.done`]: which === "done" && !given, [`${id}.help`]: which === "help" && !needsHelp });
  const copy = () => {
    if (!navigator.clipboard) return form.say(AGENCY_EMAIL);
    navigator.clipboard.writeText(AGENCY_EMAIL).then(
      () => form.say("Email copied."),
      () => form.say(AGENCY_EMAIL),
    );
  };
  const choiceClass = "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-[12.5px] font-semibold transition-colors";

  return (
    <>
      <div className="mt-3 rounded-lg border border-[#e6e8eb] bg-[#fcfcfd] px-4 py-3.5">
        <h4 className="text-[12.5px] font-semibold text-[#0b0c24]">Give us access to {platform}</h4>
        <p className={`${hintClass} mt-0.5`}>{how}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <AccessEmail />
          <button type="button" className={smallButton} onClick={copy}>
            <Copy size={12} strokeWidth={2.25} /> Copy
          </button>
        </div>
        <div role="group" aria-label={`Access to ${platform}`} className="mt-3 flex flex-wrap gap-2 border-t border-[#e6e8eb] pt-3">
          <button
            type="button"
            aria-pressed={given}
            onClick={() => choose("done")}
            className={`${choiceClass} ${given ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#e2e5e9] bg-white text-[#1f2530] hover:border-[#16a34a] hover:text-[#15803d]"}`}
          >
            <Check size={15} strokeWidth={2.5} /> I&apos;ve given access
          </button>
          <button
            type="button"
            aria-pressed={needsHelp}
            onClick={() => choose("help")}
            className={`${choiceClass} ${needsHelp ? "border-[#6d28d9] bg-[#6d28d9] text-white" : "border-[#e2e5e9] bg-white text-[#1f2530] hover:border-[#6d28d9] hover:text-[#6d28d9]"}`}
          >
            <LifeBuoy size={15} strokeWidth={2.25} /> I need help
          </button>
        </div>
      </div>
      <Collapse open={given}>
        <Note tone="green" icon={Check}>
          Thanks. We&apos;ll accept the invite and confirm by email.
        </Note>
      </Collapse>
      <Collapse open={needsHelp}>
        <Note tone="violet">Your account manager will reach out to help you with this.</Note>
      </Collapse>
    </>
  );
};

// A platform picked from a list, and how to give access to that one. `beside` is a field to
// sit next to the list; what follows from the choice runs the full width below both.
const PlatformAccess = ({
  form,
  id,
  group,
  label,
  first = false,
  beside,
}: {
  form: Form;
  id: string;
  group: PlatformGroup;
  label: string;
  first?: boolean;
  beside?: ReactNode;
}) => {
  const platform = text(form.answers, `${id}.platform`);
  const access = platform ? accessOf(group, platform) : null;

  const picker = (
    <div>
      <label htmlFor={`${id}-platform`} className={first ? firstLabelClass : labelClass}>
        {label}
      </label>
      <select
        id={`${id}-platform`}
        className={`${inputClass} cursor-pointer`}
        value={platform}
        // Another platform is another account to be let into: access given to the last one no longer counts.
        onChange={(event) => form.patch({ [`${id}.platform`]: event.target.value, [`${id}.done`]: false, [`${id}.help`]: false })}
      >
        <option value="">Select one</option>
        {platformsOf(group).map((choice) => (
          <option key={choice}>{choice}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {beside ? (
        <div className="grid gap-x-3.5 sm:grid-cols-2">
          {beside}
          {picker}
        </div>
      ) : (
        picker
      )}
      {access === "unsure" ? <Note tone="violet">No problem. Your account manager will help you find it.</Note> : null}
      {access === "builder" ? (
        <Note tone="blue">
          Hosting is included with {platform}. Give us access in the <b className="font-semibold">Website login</b> section below and you&apos;re covered.
        </Note>
      ) : null}
      {access === "dev" ? (
        <>
          <Field form={form} id={`${id}-dev`} name={`${id}.dev`} label="Developer's name and email" placeholder="Who built or maintains the site?" />
          <Note tone="violet">We&apos;ll contact your developer to arrange access, with your permission.</Note>
        </>
      ) : null}
      {Array.isArray(access) ? <EmailAccess key={platform} form={form} id={id} platform={platform} /> : null}
    </>
  );
};

// ── The items ────────────────────────────────────────────────────────────────

const WebsiteItem = ({
  form,
  competitors,
  setCompetitors,
  pages,
  togglePage,
  features,
  toggleFeature,
}: {
  form: Form;
  competitors: Competitor[];
  setCompetitors: (next: Competitor[]) => void;
  pages: string[];
  togglePage: (page: string) => void;
  features: string[];
  toggleFeature: (feature: string) => void;
}) => {
  const { answers } = form;
  const noSite = answers["web.none"] === true;
  const need = answers["web.need"];

  return (
    <>
      <label htmlFor="web-url" className={firstLabelClass}>
        Current website (if you have one)
      </label>
      <input
        id="web-url"
        type="url"
        className={inputClass}
        placeholder="https://www.yourbusiness.com"
        value={text(answers, "web.url")}
        disabled={noSite}
        onChange={(event) => form.set("web.url", event.target.value)}
      />
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-[#374151]">
        <input
          type="checkbox"
          checked={noSite}
          className="h-4 w-4 accent-[#2f5fd8]"
          onChange={(event) =>
            // Without a website there is nothing to keep or redesign.
            form.patch(
              event.target.checked
                ? { "web.none": true, "web.url": "", ...(need === "redesign" ? { "web.need": undefined } : {}) }
                : { "web.none": false },
            )
          }
        />
        I don&apos;t have a website yet
      </label>

      <p className={questionClass}>Do you need a new website?</p>
      <Options
        label="Do you need a new website?"
        value={need}
        onChange={(value) => form.set("web.need", value)}
        choices={[
          { value: "new", label: "Yes, build a new one" },
          ...(noSite ? [] : [{ value: "redesign", label: "Redesign my current site" }]),
          { value: "no", label: "No, not right now" },
        ]}
      />

      <Reveal open={need === "new" || need === "redesign"}>
        <Note tone="blue" icon={Info}>
          The more detail you give us, the closer the first design will be to what you have in mind.
        </Note>
        <label htmlFor="web-desc" className={labelClass}>
          Describe how you want your website
        </label>
        <textarea
          id="web-desc"
          maxLength={LONG_TEXT_MAX}
          className={`${inputClass} min-h-24 resize-y leading-normal`}
          placeholder="Look and feel, colors, the feeling you want visitors to get, what you want them to do (call, book, buy), anything you don't like about your current site"
          value={text(answers, "web.desc")}
          onChange={(event) => form.set("web.desc", event.target.value)}
        />

        <div className={labelClass}>Competitor or example websites you like</div>
        <div className="flex flex-col gap-2">
          {competitors.map((row, index) => (
            <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="url"
                className={inputClass}
                placeholder="https://example.com"
                aria-label={`Website ${index + 1}`}
                value={row.url}
                onChange={(event) => setCompetitors(competitors.map((other) => (other.id === row.id ? { ...other, url: event.target.value } : other)))}
              />
              <input
                type="text"
                className={inputClass}
                placeholder="What you like about it"
                aria-label={`What you like about website ${index + 1}`}
                value={row.note}
                onChange={(event) => setCompetitors(competitors.map((other) => (other.id === row.id ? { ...other, note: event.target.value } : other)))}
              />
              <button
                type="button"
                aria-label={`Remove website ${index + 1}`}
                // There is always one row to fill in.
                onClick={() => setCompetitors(competitors.length > 1 ? competitors.filter((other) => other.id !== row.id) : [{ id: row.id + 1, url: "", note: "" }])}
                className="flex h-10.5 w-10.5 cursor-pointer items-center justify-center rounded-lg border border-[#e2e5e9] bg-white text-[#6b7280] hover:border-[#f0b8b8] hover:text-[#b42318]"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${smallButton} mt-2`}
          disabled={competitors.length >= MAX_COMPETITORS}
          onClick={() => setCompetitors([...competitors, { id: Math.max(...competitors.map((row) => row.id)) + 1, url: "", note: "" }])}
        >
          <Plus size={13} strokeWidth={2.5} /> Add another website
        </button>
        <div className={`${hintClass} mt-1.5`}>
          Add up to {MAX_COMPETITORS}. Tell us what you like about each one: the layout, the colors, the photos, the wording.
        </div>

        <div className={labelClass}>Pages you&apos;ll need</div>
        <Chips choices={PAGE_CHOICES} chosen={pages} onToggle={togglePage} />
        <div className={labelClass}>Features you&apos;ll need</div>
        <Chips choices={FEATURE_CHOICES} chosen={features} onToggle={toggleFeature} />
      </Reveal>
    </>
  );
};

// Who is answering. The answers are saved under this email, which is fixed once they are —
// so it is asked first, before anything else can be saved.
const ContactItem = ({ form, started }: { form: Form; started: boolean }) => (
  <>
    <div className="grid gap-3.5 sm:grid-cols-2">
      <Field form={form} id="contact-name" name="contact.name" label="Your name" placeholder="e.g. Sarah Carter" autoComplete="name" maxLength={150} first />
      <Field form={form} id="contact-company" name="contact.company" label="Company name" placeholder="e.g. Carter Injury Law" autoComplete="organization" maxLength={150} first />
      <Field form={form} id="contact-email" name="contact.email" type="email" label="Email" placeholder="you@yourbusiness.com" autoComplete="email" disabled={started} first />
      <Field form={form} id="contact-phone" name="contact.phone" type="tel" label="Phone" hint="(optional)" placeholder="e.g. +1 813 706 5778" autoComplete="tel" maxLength={30} first />
    </div>
    {started ? (
      <p className={`${hintClass} mt-2.5`}>Your answers are saved under this email. To change it, ask your BayShore team.</p>
    ) : (
      <Note tone="blue" icon={Info}>
        We save your answers under this email as you go, so you can come back on this browser and finish later.
      </Note>
    )}
  </>
);

const YES_NO_NOW: Choice[] = [
  { value: "yes", label: "Yes, please" },
  { value: "no", label: "No, not now" },
];

const DomainItem = ({ form }: { form: Form }) => {
  const has = form.answers["dom.has"];
  return (
    <>
      <p className={firstQuestionClass}>
        Do you have a domain? <span className={`${hintClass} font-normal`}>(the address people type, like yourbusiness.com)</span>
      </p>
      <Options label="Do you have a domain?" value={has} choices={YES_NO_UNSURE} onChange={(value) => form.set("dom.has", value)} />
      <Reveal open={has === "yes"}>
        <PlatformAccess
          form={form}
          id="dom"
          group="registrar"
          label="Where is your domain registered?"
          first
          beside={<Field form={form} id="dom-name" name="dom.name" label="Your domain" placeholder="yourbusiness.com" first />}
        />
      </Reveal>
      <Reveal open={has === "no"}>
        <p className={firstQuestionClass}>Do you want us to register a domain for you?</p>
        <Options label="Do you want us to register a domain for you?" value={form.answers["dom.create"]} choices={YES_NO_NOW} onChange={(value) => form.set("dom.create", value)} />
        <Collapse open={form.answers["dom.create"] === "yes"}>
          <Field form={form} id="dom-wish" name="dom.wish" label="Domain names you'd like (in order of preference)" placeholder="yourbusiness.com, yourbusinessfl.com" />
        </Collapse>
      </Reveal>
      <Reveal open={has === "unsure"}>
        <Note tone="violet">No problem. Your account manager will look it up and get back to you.</Note>
      </Reveal>
    </>
  );
};

const HostingItem = ({ form }: { form: Form }) => {
  const has = form.answers["host.has"];
  return (
    <>
      <p className={firstQuestionClass}>
        Do you have a hosting account? <span className={`${hintClass} font-normal`}>(the company that keeps your website online)</span>
      </p>
      <Options label="Do you have a hosting account?" value={has} choices={YES_NO_UNSURE} onChange={(value) => form.set("host.has", value)} />
      <Reveal open={has === "yes"}>
        <PlatformAccess form={form} id="host" group="host" label="Where is your website hosted?" first />
      </Reveal>
      <Reveal open={has === "no"}>
        <p className={firstQuestionClass}>Do you want us to set up hosting for you?</p>
        <Options label="Do you want us to set up hosting for you?" value={form.answers["host.create"]} choices={YES_NO_NOW} onChange={(value) => form.set("host.create", value)} />
      </Reveal>
      <Reveal open={has === "unsure"}>
        <Note tone="violet">No problem. Your account manager will find out where your site is hosted.</Note>
      </Reveal>
    </>
  );
};

const EmailItem = ({ form }: { form: Form }) => {
  const has = form.answers["mail.has"];
  return (
    <>
      <p className={firstQuestionClass}>
        Do you have a business email on your domain? <span className={`${hintClass} font-normal`}>(like you@yourbusiness.com)</span>
      </p>
      <Options
        label="Do you have a business email?"
        value={has}
        onChange={(value) => form.set("mail.has", value)}
        choices={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
      <Reveal open={has === "yes"}>
        <Select form={form} id="mail-prov" name="mail.prov" label="Who provides it?" choices={EMAIL_PROVIDERS} first />
      </Reveal>
      <Reveal open={has === "no"}>
        <p className={firstQuestionClass}>Do you need us to create a business Gmail with Google Workspace?</p>
        <Options
          label="Do you need us to create a business Gmail?"
          value={form.answers["mail.create"]}
          onChange={(value) => form.set("mail.create", value)}
          choices={[
            { value: "yes", label: "Yes, please" },
            { value: "no", label: "No, thanks" },
          ]}
        />
        <Collapse open={form.answers["mail.create"] === "yes"}>
          <div className="grid gap-x-3.5 sm:grid-cols-2">
            <Field form={form} id="mail-n" name="mail.n" type="number" label="How many email accounts?" />
            <Field form={form} id="mail-addr" name="mail.addr" label="Addresses you want" placeholder="info@, david@, intake@" />
          </div>
          <Note tone="amber">Google bills Workspace per user each month. Your account manager will confirm the price before anything is set up.</Note>
        </Collapse>
      </Reveal>
    </>
  );
};

const LogoItem = ({ form }: { form: Form }) => {
  const has = form.answers["logo.has"];
  return (
    <>
      <p className={firstQuestionClass}>Do you have a logo?</p>
      <Options
        label="Do you have a logo?"
        value={has}
        onChange={(value) => form.set("logo.has", value)}
        choices={[
          { value: "yes", label: "Yes, I have one" },
          { value: "no", label: "No" },
        ]}
      />
      {/* Upload it here, share a link to it, or both — as with the photos and videos. */}
      <Reveal open={has === "yes"}>
        {form.canUpload ? (
          <>
            <p className={firstQuestionClass}>Upload your logo</p>
            <MediaUpload form={form} media={{ id: "logo" }} />
          </>
        ) : null}
        <Field
          form={form}
          id="logo-link"
          name="logo.link"
          type="url"
          label={form.canUpload ? "Or share a link" : "Link to your logo files"}
          hint={form.canUpload ? "(optional)" : undefined}
          placeholder="Google Drive, Dropbox or WeTransfer link"
          first={!form.canUpload}
        />
        <div className={`${hintClass} mt-1.5`}>
          {form.canUpload ? "PDF, AI or EPS files, or brand colors and fonts? Put them" : "Put your logo — plus brand colors and fonts if you have them —"} in a shared folder and paste its link. The highest quality version you
          have.
        </div>
      </Reveal>
      <Reveal open={has === "no"}>
        <p className={firstQuestionClass}>Do you need us to design a logo?</p>
        <Options label="Do you need us to design a logo?" value={form.answers["logo.create"]} choices={YES_NO_NOW} onChange={(value) => form.set("logo.create", value)} />
        <Collapse open={form.answers["logo.create"] === "yes"}>
          <label htmlFor="logo-style" className={labelClass}>
            Style preferences
          </label>
          <textarea
            id="logo-style"
            maxLength={LONG_TEXT_MAX}
            className={`${inputClass} min-h-24 resize-y leading-normal`}
            placeholder="Colors you like, logos you admire, words that describe your brand (modern, trustworthy, bold…)"
            value={text(form.answers, "logo.style")}
            onChange={(event) => form.set("logo.style", event.target.value)}
          />
          {/* Easier shown than said: logos they like, their colors, a sketch. */}
          {form.canUpload ? (
            <>
              <p className={questionClass}>
                Attach files <span className="font-normal text-[#6b7280]">(optional)</span>
              </p>
              <MediaUpload form={form} media={{ id: "logoStyle" }} />
              <div className={`${hintClass} mt-1.5`}>Logos you like, your colors, a sketch — anything that shows the style you have in mind.</div>
            </>
          ) : null}
        </Collapse>
      </Reveal>
    </>
  );
};

// A Google or social account: whether they have it, and then either how we get in, or
// whether we should make one.
// Access given to our own profile on the platform — a Facebook Page is shared with a person,
// not with an email. It shows the profile to add, and then there are just two things to say:
// access is given, or help is needed. (One takes the other back; a second click takes it back itself.)
const ProfileAccess = ({ form, account }: { form: Form; account: Account & { profile: NonNullable<Account["profile"]> } }) => {
  const { id, profile } = account;
  const given = form.answers[`${id}.done`] === true;
  const needsHelp = form.answers[`${id}.help`] === true;
  const shown = profile.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  const choose = (which: "done" | "help") =>
    form.patch({ [`${id}.access`]: "invite", [`${id}.done`]: which === "done" && !given, [`${id}.help`]: which === "help" && !needsHelp });
  // The username is what gets typed into the platform's "add people" search.
  const copy = () => {
    if (!navigator.clipboard) return form.say(profile.username);
    navigator.clipboard.writeText(profile.username).then(
      () => form.say("Username copied."),
      () => form.say(profile.username),
    );
  };

  const choiceClass = "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-[12.5px] font-semibold transition-colors";

  return (
    <>
      <p className={questionClass}>Add our {account.short} profile as an admin of your Page</p>
      <div className="rounded-xl border border-[#cfdcf6] bg-[#eff4fd] p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* The profile's picture, with the platform's mark on its corner. */}
          <span className="relative shrink-0">
            <Image src={profile.image} alt="" width={48} height={48} className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-[0_1px_3px_rgba(15,23,42,0.18)]" />
            <span aria-hidden="true" className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#1877f2] font-serif text-[12px] leading-none font-bold text-white">
              f
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-[#6b7280]">Our {account.short} profile</div>
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-semibold text-[#0b0c24]">{profile.username}</span>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy username"
                title="Copy username"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-[#cfdcf6] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#2f5fd8] hover:border-[#2f5fd8]"
              >
                <Copy size={12} strokeWidth={2.25} /> Copy
              </button>
            </div>
            <a href={profile.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[12px] font-medium text-[#2f5fd8] underline underline-offset-[3px]">
              {shown}
            </a>
          </div>
          <a href={profile.url} target="_blank" rel="noopener noreferrer" className={`${smallButton} shrink-0 no-underline`}>
            Open <ExternalLink size={13} strokeWidth={2.25} />
          </a>
        </div>
        <p className="mt-3 border-t border-[#cfdcf6] pt-3 text-[12px] leading-normal text-[#374151]">
          <Rich text={profile.how} />
        </p>
      </div>

      <div role="group" aria-label={`Access to your ${account.name}`} className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={given}
          onClick={() => choose("done")}
          className={`${choiceClass} ${given ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#e2e5e9] bg-white text-[#1f2530] hover:border-[#16a34a] hover:text-[#15803d]"}`}
        >
          <Check size={15} strokeWidth={2.5} /> I&apos;ve given access
        </button>
        <button
          type="button"
          aria-pressed={needsHelp}
          onClick={() => choose("help")}
          className={`${choiceClass} ${needsHelp ? "border-[#6d28d9] bg-[#6d28d9] text-white" : "border-[#e2e5e9] bg-white text-[#1f2530] hover:border-[#6d28d9] hover:text-[#6d28d9]"}`}
        >
          <LifeBuoy size={15} strokeWidth={2.25} /> I need help
        </button>
      </div>
      <Collapse open={given}>
        <Note tone="green" icon={Check}>
          Thanks. We&apos;ll accept the invite and confirm by email.
        </Note>
      </Collapse>
      <Collapse open={needsHelp}>
        <Note tone="violet">Your account manager will reach out to help you with this.</Note>
      </Collapse>
    </>
  );
};

// An account's own login, asked for on the form: the username or email it is signed in with,
// and its password. The password is sent as typed, sealed by the backend before it is stored,
// and never comes back — once saved, the page only knows that there is one.
const LoginFields = ({ form, account }: { form: Form; account: Account }) => {
  const { id } = account;
  const passwordSaved = form.answers[`${id}.passwordSet`] === true;

  return (
    <>
      <div className="grid gap-x-3.5 sm:grid-cols-2">
        <Field form={form} id={`${id}-username`} name={`${id}.username`} label={account.loginLabel ?? `${account.short} username or email`} placeholder="you@yourbusiness.com" autoComplete="off" />
        <Field
          form={form}
          id={`${id}-password`}
          name={`${id}.password`}
          type="password"
          label={`${account.short} password`}
          hint={passwordSaved ? "(saved — type a new one to replace it)" : undefined}
          placeholder={passwordSaved ? "••••••••" : undefined}
          autoComplete="off"
          maxLength={200}
        />
      </div>
      <Note tone="blue" icon={Lock}>
        We need both to sign in to your {account.short}. Your password is encrypted before it is stored, and it isn&apos;t shown on this page again.
      </Note>
    </>
  );
};

// An account that rides on another one — Instagram, on the Facebook Page it is connected to.
// Access to that one already lets us post here, so for posting nothing more is asked. Work on
// the account itself (its profile, its settings, setting it up) needs its own login.
const LinkedAccess = ({ form, account, via }: { form: Form; account: Account; via: Account }) => {
  const { id } = account;
  const access = form.answers[`${id}.access`];
  const viaGiven = form.answers[`${via.id}.done`] === true;

  return (
    <>
      {/* Only a box to tick: whether the two are connected already is all it asks. */}
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-[#374151]">
        <input
          type="checkbox"
          checked={form.answers[`${id}.connected`] === true}
          className="h-4 w-4 accent-[#2f5fd8]"
          onChange={(event) =>
            // Connected already, posting needs nothing more: ticking it picks "Just post for me" —
            // which gives the login up, as picking it by hand does. The other choice is still theirs to make.
            form.patch(event.target.checked ? { [`${id}.connected`]: true, [`${id}.access`]: "invite", [`${id}.password`]: "", [`${id}.passwordSet`]: false } : { [`${id}.connected`]: false })
          }
        />
        My {account.short} is already connected to my {via.name}
      </label>
      <p className={questionClass}>What do you need us to do on {account.short}?</p>
      <Options
        label={`What do you need us to do on ${account.short}?`}
        value={access}
        // Leaving "edit, update or set it up" gives the login up: the backend drops the password with it.
        onChange={(value) => form.patch({ [`${id}.access`]: value, ...(value === "secure" ? {} : { [`${id}.password`]: "", [`${id}.passwordSet`]: false }) })}
        choices={[
          { value: "invite", label: "Just post for me" },
          { value: "secure", label: "Edit, update or set it up" },
        ]}
      />
      <Collapse open={access === "invite"}>
        {viaGiven ? (
          <Note tone="green" icon={Check}>
            Nothing more to do here. You&apos;ve given us access to your {via.name}, and that lets us post to the {account.short} connected to it.
          </Note>
        ) : (
          <Note tone="blue" icon={Info}>
            Nothing more to do here. Access to your {via.name} lets us post to the {account.short} connected to it — give it in the {via.name} item above.
          </Note>
        )}
      </Collapse>
      <Collapse open={access === "secure"}>
        <LoginFields form={form} account={account} />
      </Collapse>
    </>
  );
};

const AccountItem = ({ form, account, google }: { form: Form; account: Account; google: boolean }) => {
  const { id, steps, profile } = account;
  const via = account.via ? SOCIAL.find((other) => other.id === account.via) : undefined;
  // Our profile to add, the account it rides on, or its own login: each has its own way in,
  // in place of the choice between an invite and a secure link.
  const special = Boolean(profile || via || account.login);
  const has = form.answers[`${id}.has`];
  const access = form.answers[`${id}.access`];

  return (
    <>
      <p className={firstQuestionClass}>{account.question ?? `Do you have ${google ? "an account" : "this account"}?`}</p>
      <Options
        label={`Do you have ${account.name}?`}
        value={has}
        choices={account.yesOrNo ? YES_NO_UNSURE.filter((choice) => choice.value !== "unsure") : YES_NO_UNSURE}
        // With a profile to add, or an email to invite, there is only one way to give access, so it isn't asked.
        onChange={(value) => form.patch({ [`${id}.has`]: value, ...((profile || steps) && value === "yes" ? { [`${id}.access`]: "invite" } : {}) })}
      />
      {/* Every account they have starts with where it is; how we get in differs from one to the next. */}
      <Reveal open={has === "yes" && special}>
        {account.placeholder ? <Field form={form} id={`${id}-link`} name={`${id}.link`} label="Link or name" hint="(optional)" placeholder={account.placeholder} first /> : null}
        {profile ? <ProfileAccess form={form} account={{ ...account, profile }} /> : via ? <LinkedAccess form={form} account={account} via={via} /> : <LoginFields form={form} account={account} />}
      </Reveal>
      <Reveal open={has === "yes" && !special}>
        {account.placeholder ? <Field form={form} id={`${id}-link`} name={`${id}.link`} label="Link or name" hint="(optional)" placeholder={account.placeholder} first /> : null}
        {steps ? (
          // An account we are invited to by email: the email, and whether that has been done.
          <EmailAccess
            form={form}
            id={id}
            platform={account.name}
            how={google && account.role ? `Give this email ${account.role.toLowerCase()} access to your account, then let us know.` : undefined}
            account
          />
        ) : (
          <>
            <p className={account.placeholder ? questionClass : firstQuestionClass}>How would you like to give us access?</p>
            <Options label="How would you like to give us access?" value={access} onChange={(value) => form.set(`${id}.access`, value)} choices={[{ value: "secure", label: "Share login securely" }]} />
            <Collapse open={access === "secure"}>
              <Note tone="blue" icon={Lock}>
                Please don&apos;t type your password here. We&apos;ll email you a private, secure link to share your login.
              </Note>
            </Collapse>
          </>
        )}
      </Reveal>
      <Reveal open={has === "no" && !account.yesOrNo}>
        <p className={firstQuestionClass}>Do you want us to create it for you?</p>
        <Options
          label="Do you want us to create it for you?"
          value={form.answers[`${id}.create`]}
          onChange={(value) => form.set(`${id}.create`, value)}
          choices={[
            { value: "yes", label: "Yes, create it" },
            { value: "no", label: "No, not now" },
          ]}
        />
      </Reveal>
      <Reveal open={has === "unsure"}>
        <Note tone="violet">No problem. We&apos;ll check whether one exists and let you know.</Note>
      </Reveal>
    </>
  );
};

// Uploading photos or videos of one kind: pick or drop them, and they go straight to storage
// (DigitalOcean Spaces, through app/api/onboarding/media) — there is nothing to save afterwards.
// What is uploaded shows inside the same box, as a picture of each one, with a way to take it
// back; the ones on their way up show there at once, dimmed, from the files on this device.
const MediaUpload = ({ form, media }: { form: Form; media: Pick<Media, "id"> }) => {
  const rule = MEDIA_UPLOAD[media.id];
  const list = form.files[media.id] ?? [];
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // The file being taken back, by its URL.
  const [removing, setRemoving] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // The files being uploaded just now, pictured from this device until the stored ones replace them.
  const [pending, setPending] = useState<{ name: string; url: string; video: boolean }[]>([]);
  // What couldn't be uploaded on the last try, and why.
  const [problems, setProblems] = useState<string[]>([]);
  const busy = uploading || removing !== null;

  // Takes what fits — the right type, within the size limit, and as many as there is room
  // for — and says what was left out.
  const upload = async (picked: File[]) => {
    if (!picked.length || busy) return;
    const skipped: string[] = [];
    const fitting = picked.filter((file) => {
      if (!rule.accept.includes(file.type)) return skipped.push(`${file.name}: only ${rule.formats} here.`) && false;
      if (file.size > rule.maxMb * 1024 * 1024) return skipped.push(`${file.name}: larger than ${rule.maxMb}MB.`) && false;
      return true;
    });
    const room = Math.min(MEDIA_UPLOAD_MAX_FILES, MEDIA_MAX_FILES - list.length);
    const sending = fitting.slice(0, Math.max(room, 0));
    if (fitting.length > sending.length) skipped.push(`${fitting.length - sending.length} more left out: up to ${MEDIA_UPLOAD_MAX_FILES} at a time, ${MEDIA_MAX_FILES} in all.`);
    setProblems(skipped);
    if (!sending.length) return;

    setUploading(true);
    const previews = sending.map((file) => ({ name: file.name, url: URL.createObjectURL(file), video: file.type.startsWith("video/") }));
    setPending(previews);
    try {
      const body = new FormData();
      for (const file of sending) body.append("files", file);
      const response = await fetch(`/api/onboarding/media/${rule.kind}`, { method: "POST", body });
      const result = await response.json().catch(() => null);
      if (response.ok && Array.isArray(result?.data?.files)) {
        form.setFiles(media.id, result.data.files);
        form.say(sending.length === 1 ? "1 file uploaded." : `${sending.length} files uploaded.`);
      } else {
        setProblems([...skipped, result?.message ?? "Couldn't upload. Please try again.", ...(Array.isArray(result?.errors) ? result.errors : [])]);
      }
    } catch {
      setProblems([...skipped, "Network error. Please try again."]);
    }
    setPending([]);
    for (const preview of previews) URL.revokeObjectURL(preview.url);
    setUploading(false);
  };

  const remove = async (file: OnboardingFile) => {
    if (busy) return;
    setRemoving(file.url);
    try {
      const response = await fetch(`/api/onboarding/media/${rule.kind}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: file.url }) });
      const result = await response.json().catch(() => null);
      if (response.ok && Array.isArray(result?.data?.files)) form.setFiles(media.id, result.data.files);
      else setProblems([result?.message ?? `Couldn't remove ${file.name}.`]);
    } catch {
      setProblems(["Network error. Please try again."]);
    }
    setRemoving(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    upload(Array.from(event.dataTransfer.files));
  };

  // A picture of one file: the image itself, or the video's opening frame.
  const picture = (url: string, video: boolean) =>
    video ? (
      <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
    ) : (
      // A stored file sits on the storage's own address, and one on its way up is a blob from
      // this device: neither can go through next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="h-full w-full object-cover" />
    );

  const tileClass = "relative aspect-square overflow-hidden rounded-lg border border-[#e6e8eb] bg-white";
  const nameClass = "pointer-events-none absolute inset-x-0 bottom-0 truncate bg-[#0b0c24]/65 px-1.5 py-0.5 text-[10px] font-medium text-white";
  const hint = `${rule.formats} · up to ${rule.maxMb}MB each · up to ${MEDIA_UPLOAD_MAX_FILES} at a time`;
  const empty = list.length === 0 && pending.length === 0;

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        accept={rule.accept.join(",")}
        className="hidden"
        onChange={(event) => {
          upload(Array.from(event.target.files ?? []));
          // Clear it so picking the same file again still fires a change.
          event.target.value = "";
        }}
      />
      <div
        className={`rounded-xl border-[1.5px] border-dashed transition-colors ${dragging ? "border-[#2f5fd8] bg-[#eef3fd]" : "border-[#d5d9df] bg-[#f9fafb]"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {empty ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center rounded-xl px-3 py-5 text-center hover:bg-[#f3f6fd] disabled:cursor-wait disabled:opacity-70"
          >
            <Upload size={22} strokeWidth={2} className="mb-1.5 text-[#2f5fd8]" />
            <span className="text-[12.5px] font-medium text-[#0b0c24]">{dragging ? "Drop to upload" : "Click to upload, or drag files here"}</span>
            <span className="mt-0.5 text-[11px] text-[#6b7280]">{hint}</span>
          </button>
        ) : (
          <div className="p-3">
            <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
              {list.map((file) => (
                <li key={file.url} className={`${tileClass} ${removing === file.url ? "opacity-55" : ""}`}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" title={`${file.name} · ${formatFileSize(file.size)}`} className="block h-full w-full">
                    {picture(file.url, file.mimeType.startsWith("video/"))}
                  </a>
                  <span className={nameClass}>{file.name}</span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => remove(file)}
                    className="absolute top-1 right-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#4b5260] shadow-[0_1px_3px_rgba(15,23,42,0.25)] hover:bg-[#fdecec] hover:text-[#b42318] disabled:cursor-wait"
                  >
                    {removing === file.url ? <Loader2 size={12} strokeWidth={2.5} className="animate-spin" /> : <X size={13} strokeWidth={2.5} />}
                  </button>
                </li>
              ))}
              {pending.map((file) => (
                <li key={file.url} className={tileClass} aria-busy="true">
                  <span className="block h-full w-full opacity-45">{picture(file.url, file.video)}</span>
                  <span className="absolute inset-0 grid place-items-center">
                    <Loader2 size={20} strokeWidth={2.5} className="animate-spin text-[#2f5fd8]" />
                  </span>
                  <span className={nameClass}>{file.name}</span>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                  className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-[#c7cbd1] bg-white text-[11.5px] font-medium text-[#2f5fd8] hover:border-[#2f5fd8] hover:bg-[#f3f6fd] disabled:cursor-wait disabled:opacity-70"
                >
                  <Plus size={18} strokeWidth={2.25} />
                  {uploading ? "Uploading…" : "Add more"}
                </button>
              </li>
            </ul>
            <p className="mt-2.5 text-center text-[11px] text-[#6b7280]">
              {dragging ? "Drop to upload" : `${list.length} uploaded · ${hint}`}
            </p>
          </div>
        )}
      </div>

      {problems.length ? (
        <div role="alert" className="mt-2.5 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] text-[#b42318]">
          {problems.map((problem) => (
            <div key={problem}>{problem}</div>
          ))}
        </div>
      ) : null}
    </>
  );
};

const MediaItem = ({ form, media }: { form: Form; media: Media }) => {
  const { id } = media;
  const mode = form.answers[`${id}.mode`];
  return (
    <>
      <p className={`${hintClass} -mt-1`}>{media.about}</p>
      <p className={questionClass}>What would you like to do?</p>
      <Options
        label="What would you like to do?"
        value={mode}
        onChange={(value) => form.set(`${id}.mode`, value)}
        choices={[
          { value: "upload", label: "Share what I have" },
          { value: "create", label: "I need these created" },
          { value: "none", label: "I don't need these" },
        ]}
      />
      <Reveal open={mode === "upload"}>
        {form.canUpload ? (
          <>
            <p className={firstQuestionClass}>Upload your {media.name.toLowerCase()}</p>
            <MediaUpload form={form} media={media} />
          </>
        ) : null}
        <Field
          form={form}
          id={`${id}-link`}
          name={`${id}.link`}
          type="url"
          label={form.canUpload ? "Or share a link" : "Shared folder link"}
          hint={form.canUpload ? "(optional)" : undefined}
          placeholder="Google Drive, Dropbox or WeTransfer link"
          first={!form.canUpload}
        />
        <div className={`${hintClass} mt-1.5`}>
          {form.canUpload ? "Too many or too large to upload? Put" : "Put"} your {media.name.toLowerCase()} in a shared folder and paste its link. {media.formats}.
        </div>
      </Reveal>
      <Reveal open={mode === "create"}>
        <Note tone="violet">Your account manager will get back to you to plan the {media.shoot}: what to capture, where and when.</Note>
        <Field form={form} id={`${id}-notes`} name={`${id}.notes`} label="Anything we should know?" hint="(optional)" placeholder={media.notesPlaceholder} />
      </Reveal>
    </>
  );
};

// ── What happens after submitting ────────────────────────────────────────────

// The popup that says the onboarding went through — the first time, or `again` after a change:
// a tick that draws itself, and a thank-you by name. One button goes home; for a signed-in
// client another closes it, as Escape or a click outside does, onto their answers.
const Submitted = ({ name, company, mine, again, onClose }: { name: string; company: string; mine: boolean; again: boolean; onClose: () => void }) => {
  const firstName = name.trim().split(/\s+/)[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-60 grid place-items-center bg-[#0b0c24]/55 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-submitted"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`${poppins.className} w-full max-w-120 overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_24px_60px_rgba(11,12,36,0.3)]`}
      >
        <div className="bg-[linear-gradient(180deg,#ecf8ef_0%,#ffffff_100%)] px-7 pt-9 pb-7 text-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a] shadow-[0_0_0_8px_rgba(22,163,74,0.14)]"
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }} />
            </svg>
          </motion.span>
          <h2 id="onboarding-submitted" className="mt-4 text-[22px] leading-tight font-bold text-[#0b0c24]">
            {again ? "Your changes were submitted" : "Onboarding submitted successfully"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-105 text-[13px] leading-[1.6] text-[#4b5563]">
            {again ? (
              <>
                Thank you{firstName ? `, ${firstName}` : ""}. Your BayShore account manager now sees the updated answers{company.trim() ? ` for ${company.trim()}` : ""}.
              </>
            ) : (
              <>
                Thank you{firstName ? `, ${firstName}` : ""}. We&apos;ve received your answers{company.trim() ? ` for ${company.trim()}` : ""} — your BayShore account manager will be in touch
                soon.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 border-t border-[#eef0f2] px-7 py-4">
          <Link href={mine ? "/dashboard" : "/"} autoFocus className="rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white no-underline hover:bg-[#1e2140]">
            {mine ? "Go to my dashboard" : "Back to home"}
          </Link>
          {mine ? (
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6]">
              View my answers
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── The form ─────────────────────────────────────────────────────────────────

const ITEM_TITLES: Record<string, string> = {
  contact: "Your details",
  website: "Website",
  domain: "Domain name",
  hosting: "Hosting",
  cms: "Website login (CMS access)",
  email: "Business email",
  logo: "Logo",
  ...Object.fromEntries([...GOOGLE, ...SOCIAL, ...MEDIA].map((entry) => [entry.id, entry.name])),
};

const BLANK_ANSWERS: Answers = { "mail.n": "1" };
const BLANK_COMPETITORS: Competitor[] = [
  { id: 1, url: "", note: "" },
  { id: 2, url: "", note: "" },
];

// ── The form itself ──────────────────────────────────────────────────────────

// ── Reading the answers back ─────────────────────────────────────────────────

// One answer as it is read back: an icon, what was asked, and what was answered. A `wide`
// one (a description, a list) takes the whole row.
type Row = { icon: LucideIcon; label: string; value: string; wide?: boolean };

const HAS_WORDS: Record<string, string> = { yes: "Yes", no: "No", unsure: "Not sure" };
const NEED_WORDS: Record<string, string> = { new: "Yes, build a new one", redesign: "Redesign my current site", no: "No, not right now" };
const MEDIA_WORDS: Record<string, string> = { upload: "Sharing what I have", create: "I need these created", none: "I don't need these" };

// Everything an item asked that applies to how it was answered, in the form's own order:
// what the client sees of a submitted onboarding, in place of the item's questions.
const readBack = (item: string, answers: Answers, lists: { competitors: Competitor[]; pages: string[]; features: string[]; files: Record<string, OnboardingFile[]> }): Row[] => {
  const of = (key: string) => text(answers, key).trim();
  const word = (key: string, words = HAS_WORDS) => words[of(key)] ?? "";
  // Where giving us access stands.
  const access = (id: string) => (answers[`${id}.done`] === true ? "Access given" : answers[`${id}.help`] === true ? "Needs help" : "Not given yet");

  switch (item) {
    case "contact":
      return [
        { icon: User, label: "Your name", value: of("contact.name") },
        { icon: Building2, label: "Company name", value: of("contact.company") },
        { icon: Mail, label: "Email", value: of("contact.email") },
        { icon: Phone, label: "Phone", value: of("contact.phone") },
      ];
    case "website": {
      const building = of("web.need") === "new" || of("web.need") === "redesign";
      const liked = lists.competitors.filter((row) => row.url.trim() || row.note.trim()).map((row) => [row.url.trim(), row.note.trim()].filter(Boolean).join(" — "));
      return [
        { icon: Globe, label: "Current website", value: answers["web.none"] === true ? "No website yet" : of("web.url") },
        { icon: Info, label: "Do you need a new website?", value: word("web.need", NEED_WORDS) },
        ...(building
          ? [
              { icon: FileText, label: "How you want your website", value: of("web.desc"), wide: true },
              { icon: Link2, label: "Websites you like", value: liked.join("\n"), wide: true },
              { icon: ListChecks, label: "Pages you'll need", value: lists.pages.join(", "), wide: true },
              { icon: ListChecks, label: "Features you'll need", value: lists.features.join(", "), wide: true },
            ]
          : []),
      ];
    }
    case "domain":
      return [
        { icon: Globe, label: "Do you have a domain?", value: word("dom.has") },
        ...(of("dom.has") === "yes"
          ? [
              { icon: AtSign, label: "Your domain", value: of("dom.name") },
              { icon: Server, label: "Registered with", value: of("dom.platform") },
              { icon: Lock, label: "Access", value: access("dom") },
            ]
          : []),
        ...(of("dom.has") === "no" ? [{ icon: Plus, label: "Register a domain for you?", value: word("dom.create") }] : []),
        ...(of("dom.has") === "no" && of("dom.create") === "yes" ? [{ icon: FileText, label: "Domain names you'd like", value: of("dom.wish") }] : []),
      ];
    case "hosting":
      return [
        { icon: Server, label: "Do you have a hosting account?", value: word("host.has") },
        ...(of("host.has") === "yes"
          ? [
              { icon: Globe, label: "Hosted with", value: of("host.platform") },
              { icon: Lock, label: "Access", value: access("host") },
            ]
          : []),
        ...(of("host.has") === "no" ? [{ icon: Plus, label: "Set up hosting for you?", value: word("host.create") }] : []),
      ];
    case "cms":
      return [
        { icon: Globe, label: "Website built with", value: of("cms.platform") },
        ...(of("cms.dev") ? [{ icon: User, label: "Developer", value: of("cms.dev") }] : []),
        { icon: Lock, label: "Access", value: access("cms") },
      ];
    case "email":
      return [
        { icon: Mail, label: "Business email on your domain?", value: word("mail.has") },
        ...(of("mail.has") === "yes" ? [{ icon: Server, label: "Provided by", value: of("mail.prov") }] : []),
        ...(of("mail.has") === "no" ? [{ icon: Plus, label: "Create a business Gmail for you?", value: word("mail.create") }] : []),
        ...(of("mail.has") === "no" && of("mail.create") === "yes"
          ? [
              { icon: Users, label: "Email accounts", value: of("mail.n") },
              { icon: AtSign, label: "Addresses you want", value: of("mail.addr") },
            ]
          : []),
      ];
    case "logo":
      return [
        { icon: Palette, label: "Do you have a logo?", value: word("logo.has") },
        ...(of("logo.has") === "yes"
          ? [
              { icon: Upload, label: "Uploaded", value: lists.files.logo?.length ? `${lists.files.logo.length} file${lists.files.logo.length > 1 ? "s" : ""}` : "" },
              { icon: Link2, label: "Link to your logo files", value: of("logo.link") },
            ]
          : []),
        ...(of("logo.has") === "no" ? [{ icon: Plus, label: "Design a logo for you?", value: word("logo.create") }] : []),
        ...(of("logo.has") === "no" && of("logo.create") === "yes" ? [{ icon: FileText, label: "Style preferences", value: of("logo.style"), wide: true }] : []),
        ...(of("logo.has") === "no" && of("logo.create") === "yes" && lists.files.logoStyle?.length
          ? [{ icon: Upload, label: "Attached files", value: `${lists.files.logoStyle.length} file${lists.files.logoStyle.length > 1 ? "s" : ""}` }]
          : []),
      ];
    default: {
      if (MEDIA.some((media) => media.id === item)) {
        const count = lists.files[item]?.length ?? 0;
        return [
          { icon: Camera, label: "What you'd like to do", value: word(`${item}.mode`, MEDIA_WORDS) },
          ...(of(`${item}.mode`) === "upload"
            ? [
                { icon: Upload, label: "Uploaded", value: count ? `${count} file${count > 1 ? "s" : ""}` : "" },
                { icon: Link2, label: "Shared folder link", value: of(`${item}.link`) },
              ]
            : []),
          ...(of(`${item}.notes`) ? [{ icon: FileText, label: "Anything we should know", value: of(`${item}.notes`), wide: true }] : []),
        ];
      }
      // A Google or social account. One we sign in to shows its login; any other, where access stands.
      const account = [...GOOGLE, ...SOCIAL].find((entry) => entry.id === item);
      const saved = answers[`${item}.passwordSet`] === true;
      const login = [of(`${item}.username`), saved ? "password saved" : ""].filter(Boolean).join(" · ");
      return [
        { icon: Check, label: account?.question ?? "Do you have this account?", value: word(`${item}.has`) },
        ...(of(`${item}.has`) === "yes" && account?.placeholder ? [{ icon: Link2, label: "Link or name", value: of(`${item}.link`) }] : []),
        ...(of(`${item}.has`) === "yes" && account?.via ? [{ icon: Link2, label: "Already connected to your Facebook Page", value: answers[`${item}.connected`] === true ? "Yes" : "No" }] : []),
        ...(of(`${item}.has`) === "yes"
          ? [login ? { icon: KeyRound, label: "Login", value: login } : { icon: Lock, label: "Access", value: of(`${item}.access`) === "secure" ? "Sharing the login securely" : access(item) }]
          : []),
        ...(of(`${item}.has`) === "no" && !account?.yesOrNo ? [{ icon: Plus, label: "Create it for you?", value: word(`${item}.create`) }] : []),
      ];
    }
  }
};

// One answer: its icon, then the question over what was answered.
const Shown = ({ row }: { row: Row }) => (
  <div className={`flex items-start gap-3 ${row.wide ? "sm:col-span-2" : ""}`}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef3fd] text-[#2f5fd8]">
      <row.icon size={16} strokeWidth={2} />
    </span>
    <div className="min-w-0">
      <div className="text-[11.5px] font-medium text-[#6b7280]">{row.label}</div>
      <div className={`text-[13.5px] leading-snug font-medium break-words whitespace-pre-wrap ${row.value ? "text-[#0b0c24]" : "text-[#9ca3af]"}`}>{row.value || "Not given"}</div>
    </div>
  </div>
);

// An item's answers, two to a row.
const ReadBack = ({ rows }: { rows: Row[] }) => (
  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {rows.map((row) => (
      <Shown key={row.label} row={row} />
    ))}
  </div>
);

// What is being sent just now, so the right button shows it.
type Saving = "step" | "later" | "submit" | "delete" | null;

// `initial` is the onboarding this browser started earlier, if there is one: the form opens
// with those answers, past the step that asks who is answering.
//
// `mine` is for a client who is signed in: `initial` is then their own client record — so the
// form opens already filled in with what we hold on them — and their answers are saved on it.
const OnboardingProcess = ({ initial = null, mine = false }: { initial?: Onboarding | null; mine?: boolean }) => {
  const [seed] = useState(() => (initial ? fromBackend(initial) : null));
  const [answers, setAnswers] = useState<Answers>(seed?.answers ?? BLANK_ANSWERS);
  const [competitors, setCompetitors] = useState<Competitor[]>(seed?.competitors ?? BLANK_COMPETITORS);
  const [pages, setPages] = useState(seed?.pages ?? DEFAULT_PAGES);
  const [features, setFeatures] = useState(seed?.features ?? DEFAULT_FEATURES);
  const [files, setAllFiles] = useState<Record<string, OnboardingFile[]>>(seed?.files ?? {});

  // Whether the backend holds this onboarding yet. It does from the first save on.
  const [started, setStarted] = useState(mine || Boolean(initial));
  const [saving, setSaving] = useState<Saving>(null);

  // A signed-in client starts on their details: they were filled in for them, and are worth a look.
  const [current, setCurrent] = useState(initial && !mine ? 1 : 0);
  // The item open in a step that shows its items one at a time.
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  // Whose onboarding has just been handed in — for the popup that says so. The form itself is
  // emptied at that moment, so the popup keeps the name it thanks.
  const [submitted, setSubmitted] = useState<{ name: string; company: string; again: boolean } | null>(null);
  // When the onboarding was handed in ("" if that isn't known) — null until it has been. Once
  // it has, the form opens for reading only: the same steps, each item showing what was
  // answered (readBack) in place of its questions. "Edit" (`editing`) brings the questions back.
  const [submittedAt, setSubmittedAt] = useState<string | null>(initial?.onboarding?.status === "submitted" ? (initial.onboarding.submittedAt ?? "") : null);
  const [editing, setEditing] = useState(false);
  const handedIn = submittedAt !== null;
  const viewing = handedIn && !editing;
  // Why the last save didn't go through. It stays in view, above the buttons, until the next try.
  const [failure, setFailure] = useState<{ message: string; details: string[] } | null>(null);

  // Each message gets the next number, so saying the same thing twice shows it afresh.
  const say = (message: string) => setToast((last) => ({ id: (last?.id ?? 0) + 1, message }));
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const form: Form = {
    answers,
    set: (key, value) => setAnswers((now) => ({ ...now, [key]: value })),
    patch: (changes) => setAnswers((now) => ({ ...now, ...changes })),
    files,
    // Whether an item has files is also kept with the answers, for where the item stands.
    setFiles: (id, next) => {
      setAllFiles((now) => ({ ...now, [id]: next }));
      // Uploading photos or videos is choosing "share what I have"; a logo has no such choice.
      setAnswers((now) => ({ ...now, [`${id}.hasFiles`]: next.length > 0, ...(next.length && MEDIA.some((media) => media.id === id) ? { [`${id}.mode`]: "upload" } : {}) }));
    },
    canUpload: mine,
    say,
  };

  // What the team took off this client's form (company-portal: OnboardingControls): steps and
  // items they don't need, which are then not asked — nor counted. Who is answering always is.
  // Until the team has said, it is the steps a client starts without.
  const [notNeeded] = useState(() => new Set(initial?.onboarding?.notNeeded ?? DEFAULT_NOT_NEEDED));
  const ownItems = (id: StepId) => (id === "contact" ? itemsOf(id, answers) : notNeeded.has(`step:${id}`) ? [] : itemsOf(id, answers).filter((item) => !notNeeded.has(controlIdOf(item))));
  const steps = STEPS.filter((entry) => ownItems(entry.id).length > 0);
  const asked = new Set(steps.flatMap((entry) => ownItems(entry.id)));

  // A step can leave the list while it is open (its last item went with the website): the one before it then.
  const step = steps[Math.min(current, steps.length - 1)];
  const statuses = statusesOf(answers).filter((status) => asked.has(status.id));
  const statusOf = (item: string) => statuses.find((status) => status.id === item);
  const answered = statuses.filter(isAnswered).length;
  const items = ownItems(step.id);
  const accordion = isAccordion(step.id);
  const StepIcon = STEP_ICONS[step.id];

  // What the account manager has approved (company-portal: OnboardingControls), by item.
  const [approved] = useState(() => new Set(initial?.onboarding?.approved ?? []));
  // Where a step stands, as the team's own map of the onboarding shows it — and in its colors:
  // approved once every item on it is; else waiting on the client while one has no answer, with
  // us while one needs our help, and otherwise answered and ours to check.
  const standingOf = (id: StepId): StepStanding => {
    const own = ownItems(id);
    if (own.length && own.every((item) => approved.has(controlIdOf(item)))) return "approved";
    const tones = own.map((item) => statusOf(item)?.tone);
    if (own.some((item, at) => tones[at] === undefined || tones[at] === "pending" || !isAnswered(statusOf(item)!))) return "wait";
    return tones.some((tone) => tone === "followup" || tone === "create") ? "help" : "filled";
  };
  // The whole onboarding is approved once every item the client is asked is.
  const allApproved = asked.size > 0 && [...asked].every((item) => approved.has(controlIdOf(item)));

  // Sends what is on the form to the backend. The first time, that starts the onboarding —
  // from then on the email is fixed — and after that it updates it. `submit` hands it in.
  // Says what went wrong and returns false when it couldn't be saved.
  const save = async (why: Exclude<Saving, null>, submit?: boolean) => {
    // Nothing can be saved before we know whose answers these are.
    const missing = contactProblem(answers);
    if (missing) {
      setCurrent(0);
      setOpenItem(null);
      setFailure({ message: `${missing} We need your details on the first step before your answers can be saved.`, details: [] });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    setFailure(null);
    setSaving(why);
    const details = {
      contactName: text(answers, "contact.name").trim(),
      companyName: text(answers, "contact.company").trim(),
      phone: cleanPhone(text(answers, "contact.phone").trim()),
      answers: toBackend(answers, competitors, pages, features),
      ...(submit === undefined ? {} : { submit }),
    };
    const start = () => startOnboardingAction({ ...details, email: text(answers, "contact.email").trim() });
    let result = mine ? await updateMyOnboardingAction(details) : started ? await updateOnboardingAction(details) : await start();
    // What this browser had saved is gone (it was deleted, or its key was lost): everything is
    // still on the form, so it is simply saved again as a new onboarding.
    if (!mine && started && !result.ok && result.status === 404) result = await start();
    setSaving(null);

    if (!result.ok) {
      // Taken on by the team: it is theirs now, and no longer editable from here.
      if (!mine && started && result.status === 409) setStarted(false);
      setFailure({ message: result.error ?? "Couldn't save your answers. Please try again.", details: result.fieldErrors ?? [] });
      return false;
    }
    setStarted(true);
    // A password typed just now is with the backend, sealed: the page lets go of it, and
    // remembers only that one is stored.
    setAnswers((now) => {
      const typed = Object.keys(now).filter((key) => key.endsWith(".password") && now[key]);
      if (!typed.length) return now;
      const next = { ...now };
      for (const key of typed) {
        delete next[key];
        next[`${key.slice(0, -".password".length)}.passwordSet`] = true;
      }
      return next;
    });
    return true;
  };

  // Opens a step — at the item named, or else at the first one still unanswered. What is on
  // the form is saved first; if that fails, the step stays where it is.
  //
  // No question has to be answered to move on, forward or back: any of them can be left for
  // later, or for good. (Who is answering is checked by `save`, which has its own words for it.)
  const go = async (target: number, item?: string) => {
    if (target < 0 || target >= steps.length || saving) return false;
    // Only reading: there is nothing to check and nothing to save.
    if (viewing) {
      const own = ownItems(steps[target].id);
      setCurrent(target);
      setOpenItem(isAccordion(steps[target].id) ? (item ?? own[0] ?? null) : null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }
    if (!(await save("step"))) return false;
    const next = steps[target];
    const own = ownItems(next.id);
    setCurrent(target);
    const unanswered = own.find((id) => {
      const status = statusOf(id);
      return !status || !isAnswered(status);
    });
    setOpenItem(isAccordion(next.id) ? (item ?? unanswered ?? own[0] ?? null) : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  const saveForLater = async () => {
    if (await save("later")) say(mine ? "Saved. Come back any time to finish." : "Saved. Come back on this browser any time to finish.");
  };

  // Empties the form, back to its first step.
  const reset = () => {
    setAnswers(BLANK_ANSWERS);
    setCompetitors(BLANK_COMPETITORS);
    setPages(DEFAULT_PAGES);
    setFeatures(DEFAULT_FEATURES);
    setAllFiles({});
    setStarted(false);
    setFailure(null);
    setCurrent(0);
    setOpenItem(null);
  };

  // Hands the onboarding in — or, after a change to one already handed in, hands it in again.
  // A signed-in client then sees their answers again, for reading. Without an account the form
  // is emptied: the answers are with the team now, and this browser no longer holds them.
  const submit = async () => {
    // It is handed in as it stands: a question left unanswered doesn't hold it back.
    const who = { name: text(answers, "contact.name"), company: text(answers, "contact.company"), again: handedIn };
    if (!(await save("submit", true))) return;
    setSubmitted(who);
    // A signed-in client's answers stay on their record, and so on the page.
    if (mine) {
      setSubmittedAt(new Date().toISOString());
      setEditing(false);
    } else reset();
    window.scrollTo({ top: 0 });
  };

  // From reading to changing — at a step, and an item on it, if they are named.
  const edit = (index = current, item?: string) => {
    const own = ownItems(steps[index].id);
    setFailure(null);
    setCurrent(index);
    setOpenItem(isAccordion(steps[index].id) ? (item ?? own[0] ?? null) : null);
    setEditing(true);
    window.scrollTo({ top: 0 });
  };

  // And back. What is on the form is saved first, so what is read is never an answer the
  // team doesn't have; if that fails, the form stays open and says why.
  const stopEditing = async () => {
    if (saving || !(await save("later"))) return;
    setEditing(false);
    window.scrollTo({ top: 0 });
  };

  // Deletes what was saved and empties the form.
  const startOver = async () => {
    if (saving || !window.confirm("Delete your answers and start again? This can't be undone.")) return;
    if (started) {
      setSaving("delete");
      const result = await deleteOnboardingAction();
      setSaving(null);
      // Already gone is as good as deleted.
      if (!result.ok && result.status !== 404) return say(result.error ?? "Couldn't delete your answers.");
    }
    reset();
    say("Your answers were deleted.");
  };

  const copyEmail = () => {
    if (!navigator.clipboard) return say(AGENCY_EMAIL);
    navigator.clipboard.writeText(AGENCY_EMAIL).then(
      () => say("Email copied."),
      () => say(AGENCY_EMAIL),
    );
  };

  const toggleIn = (list: string[], entry: string) => (list.includes(entry) ? list.filter((other) => other !== entry) : [...list, entry]);

  const bodyOf = (item: string) => {
    switch (item) {
      case "contact":
        return <ContactItem form={form} started={started} />;
      case "website":
        return (
          <WebsiteItem
            form={form}
            competitors={competitors}
            setCompetitors={setCompetitors}
            pages={pages}
            togglePage={(page) => setPages((now) => toggleIn(now, page))}
            features={features}
            toggleFeature={(feature) => setFeatures((now) => toggleIn(now, feature))}
          />
        );
      case "domain":
        return <DomainItem form={form} />;
      case "hosting":
        return <HostingItem form={form} />;
      case "cms":
        return <PlatformAccess form={form} id="cms" group="cms" label="What is your website built with?" first />;
      case "email":
        return <EmailItem form={form} />;
      case "logo":
        return <LogoItem form={form} />;
      default: {
        const google = GOOGLE.find((account) => account.id === item);
        if (google) return <AccountItem form={form} account={google} google />;
        const social = SOCIAL.find((account) => account.id === item);
        if (social) return <AccountItem form={form} account={social} google={false} />;
        const media = MEDIA.find((entry) => entry.id === item);
        return media ? <MediaItem form={form} media={media} /> : null;
      }
    }
  };

  // The same item as it is read back, once the onboarding has been handed in.
  const viewOf = (item: string) => <ReadBack rows={readBack(item, answers, { competitors, pages, features, files })} />;

  const nextStep = steps[current + 1];

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        {/* The title — and, once the onboarding has been handed in, that it has, with the way
            into editing it (or, while editing, out of it and to handing it in again). */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.04em] text-[#2f5fd8] uppercase">BayShore · Client onboarding</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-[28px] leading-tight font-bold text-[#0b0c24]">{viewing ? "Your onboarding" : handedIn ? "Edit your onboarding" : "Let\u2019s get your accounts set up"}</h1>
              {handedIn ? (
                // The date is the reader's own, which the server can't know.
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ec] px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap text-[#15803d]" suppressHydrationWarning>
                  <Check size={12} strokeWidth={3} /> Submitted{submittedAt ? ` ${new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                </span>
              ) : null}
            </div>
            {handedIn ? null : <p className="mt-1.5 max-w-180 text-[13px] text-[#6b7280]">One step at a time. It takes about 10 minutes, and you can skip anything you&apos;re not sure about.</p>}
          </div>
          {viewing ? (
            <button type="button" onClick={() => edit(current, openItem ?? undefined)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e2140]">
              <Pencil size={14} strokeWidth={2.25} /> Edit
            </button>
          ) : handedIn ? (
            <div className="flex items-center gap-2.5">
              <button type="button" disabled={saving !== null} onClick={stopEditing} className="cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-wait disabled:opacity-60">
                Stop editing
              </button>
              <button type="button" disabled={saving !== null} onClick={submit} className="cursor-pointer rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-80">
                Resubmit
              </button>
            </div>
          ) : null}
        </div>

        {/* On a narrow screen the step list is out of sight, so the step in hand is named here. */}
        <div className={`${cardClass} px-4 py-3 lg:hidden`}>
          <div className="flex justify-between text-[12.5px]">
            <b className="font-semibold text-[#0b0c24]">{step.title}</b>
            <span className="text-[#6b7280]">
              Step {current + 1} of {steps.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
            <motion.div className="h-full rounded-full bg-[#2f5fd8]" initial={false} animate={{ width: `${((current + 1) / steps.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form noValidate onSubmit={(event) => event.preventDefault()} className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`${cardClass} p-5 sm:p-7`}
              >
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8effd] text-[#2f5fd8]">
                    <StepIcon size={22} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-[0.04em] text-[#2f5fd8] uppercase">
                      Step {current + 1} of {steps.length}
                    </div>
                    <h2 className="text-[17px] leading-snug font-semibold text-[#0b0c24]">{step.heading}</h2>
                    <p className="mt-0.5 text-[12.5px] text-[#6b7280]">{step.sub}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  {items.map((item, index) => {
                    const status = statusOf(item);
                    const open = !accordion || openItem === item;
                    const after = items[index + 1];
                    return (
                      <div
                        key={item}
                        id={`onboarding-${item}`}
                        className={`scroll-mt-4 rounded-xl border p-4.5 transition-[border-color,box-shadow,background-color] ${
                          !accordion
                            ? "border-[#e6e8eb] bg-white"
                            : open
                              ? "border-[#c9d6f5] bg-white shadow-[0_0_0_3px_#e8effd]"
                              : "border-[#e6e8eb] bg-[#fcfcfd] hover:border-[#c7cbd1]"
                        }`}
                      >
                        {accordion ? (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenItem(open ? null : item)}
                            className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 py-0.5 text-left"
                          >
                            <span className="flex items-center gap-2.5 text-[14px] font-semibold text-[#0b0c24]">
                              <ChevronDown size={15} strokeWidth={2.25} className={`shrink-0 text-[#6b7280] transition-transform ${open ? "" : "-rotate-90"}`} />
                              {ITEM_TITLES[item]}
                            </span>
                            {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                          </button>
                        ) : (
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[14px] font-semibold text-[#0b0c24]">{ITEM_TITLES[item]}</h3>
                            {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                          </div>
                        )}

                        {accordion ? (
                          <Collapse open={open}>
                            <div className="pt-3">
                              {viewing ? viewOf(item) : bodyOf(item)}
                              <div className="mt-4 flex justify-end border-t border-[#e6e8eb] pt-3.5">
                                <button type="button" className={smallButton} onClick={() => (after ? setOpenItem(after) : nextStep ? go(current + 1) : setOpenItem(null))}>
                                  {after ? `Next: ${ITEM_TITLES[after]} →` : nextStep ? `${viewing ? "Go" : "Done, go"} to ${nextStep.title} →` : "Done"}
                                </button>
                              </div>
                            </div>
                          </Collapse>
                        ) : viewing ? (
                          viewOf(item)
                        ) : (
                          bodyOf(item)
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {failure ? (
                <motion.div
                  key="failure"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] leading-normal text-[#b42318]"
                >
                  <CircleAlert size={16} strokeWidth={2} className="mt-px shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{failure.message}</div>
                    {failure.details.length ? (
                      <ul className="mt-1 list-disc pl-4.5">
                        {failure.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <button type="button" aria-label="Dismiss" onClick={() => setFailure(null)} className="shrink-0 cursor-pointer rounded p-0.5 hover:bg-[#f9d5d5]">
                    <X size={14} strokeWidth={2.25} />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* While only reading, the steps are moved between from the list beside the form; on a
                narrow screen that list is out of sight, so Back and Next stay there. */}
            <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 ${viewing ? "lg:hidden" : ""}`}>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => go(current - 1)}
                className={`cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-wait disabled:opacity-60 ${current === 0 ? "invisible" : ""}`}
              >
                Back
              </button>
              <div className="ml-auto flex items-center gap-4">
                {viewing ? (
                  nextStep ? (
                    <button type="button" onClick={() => go(current + 1)} className="cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6]">
                      Next: {nextStep.title}
                    </button>
                  ) : null
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={saveForLater}
                      className="cursor-pointer p-1.5 text-[12.5px] font-medium text-[#6b7280] underline underline-offset-[3px] hover:text-[#1f2530] disabled:cursor-wait disabled:opacity-60"
                    >
                      {saving === "later" ? "Saving…" : "Save and finish later"}
                    </button>
                    <button
                      type="button"
                      disabled={saving !== null}
                      aria-busy={saving === "step" || saving === "submit"}
                      onClick={() => (nextStep ? go(current + 1) : submit())}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-80"
                    >
                      {saving === "step" || saving === "submit" ? (
                        <>
                          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> {saving === "submit" ? "Submitting…" : "Saving…"}
                        </>
                      ) : nextStep ? (
                        `Next: ${nextStep.title}`
                      ) : handedIn ? (
                        "Resubmit onboarding"
                      ) : (
                        "Submit onboarding"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-4.5 lg:sticky lg:top-4">
            <div className={`${cardClass} hidden p-5.5 lg:block`}>
              <h3 className="text-[15px] font-semibold text-[#0b0c24]">Your progress</h3>
              <div className="mt-2.5 mb-1.5 h-2 overflow-hidden rounded-full bg-[#eef0f3]">
                {/* Yellow until the team has approved everything; green from then on. */}
                <motion.div
                  className={`h-full rounded-full transition-colors duration-300 ${allApproved ? "bg-[#16a34a]" : "bg-[#FACC15]"}`}
                  initial={false}
                  animate={{ width: `${(answered / statuses.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[12.5px] text-[#6b7280]">
                {answered} of {statuses.length} questions answered
              </p>
              <ol className="mt-3.5 flex flex-col">
                {steps.map((entry, index) => {
                  const standing = standingOf(entry.id);
                  const here = index === current;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        aria-current={here ? "step" : undefined}
                        onClick={() => go(index)}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.75 text-left text-[12.5px] transition-colors ${
                          here ? "bg-[#e8effd] font-semibold text-[#2f5fd8]" : "font-medium text-[#6b7280] hover:bg-[#f5f6f8]"
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${STEP_DOTS[standing][0]}`}>
                          {standing === "approved" ? <Check size={12} strokeWidth={3} /> : index + 1}
                        </span>
                        {entry.title}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-[#eef0f2] pt-3 text-[11px] text-[#6b7280]">
                {STEP_STANDINGS.map((standing) => (
                  <span key={standing} className="inline-flex items-center gap-1.5">
                    <i className={`inline-block size-2.5 rounded-full border-2 ${STEP_DOTS[standing][0]}`} />
                    {STEP_DOTS[standing][1]}
                  </span>
                ))}
              </div>
              {started ? (
                <div className="mt-3.5 border-t border-[#eef0f2] pt-3 text-[11.5px] leading-normal text-[#6b7280]">
                  Saved under <b className="font-semibold break-all text-[#1f2530]">{text(answers, "contact.email")}</b>
                  {/* Deleting would take the whole client record with it — not for a client with an account. */}
                  {mine ? null : (
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={startOver}
                      className="mt-1 block cursor-pointer underline underline-offset-[3px] hover:text-[#b42318] disabled:cursor-wait disabled:opacity-60"
                    >
                      {saving === "delete" ? "Deleting…" : "Delete my answers and start over"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <AnimatePresence initial={false}>
              {EMAIL_STEPS.includes(step.id) ? (
                <motion.div
                  key="access-email"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-[#cfdcf6] bg-[#eff4fd] p-5.5"
                >
                  <h3 className="text-[14px] font-semibold text-[#0b0c24]">Our access email</h3>
                  <p className="mt-1 text-[12.5px] text-[#6b7280]">When a step asks you to invite us, use this email.</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <AccessEmail />
                    <button type="button" className={smallButton} onClick={copyEmail}>
                      Copy
                    </button>
                  </div>
                  <p className="mt-3 text-[11.5px] leading-normal text-[#6b7280]">
                    Only type a password where this page asks for one. For anything else, choose &quot;Share login securely&quot; and we&apos;ll send you a private link.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </aside>
        </div>

        <AnimatePresence>
          {submitted ? <Submitted name={submitted.name} company={submitted.company} mine={mine} again={submitted.again} onClose={() => setSubmitted(null)} /> : null}
        </AnimatePresence>

        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 20, x: "-50%" }}
              transition={{ duration: 0.22 }}
              className="fixed bottom-6 left-1/2 z-70 max-w-[calc(100%-2rem)] rounded-lg bg-[#0b0c24] px-4.5 py-3 text-[12.5px] text-white shadow-[0_8px_24px_rgba(11,12,36,0.25)]"
            >
              {toast.message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};

export default OnboardingProcess;
