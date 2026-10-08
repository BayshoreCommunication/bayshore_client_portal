"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Camera, Check, ChevronDown, CircleAlert, Globe, Info, ListChecks, Loader2, Lock, Mail, MapPin, Palette, Plus, Server, User, Users, X, type LucideIcon } from "lucide-react";
import { deleteOnboardingAction, startOnboardingAction, updateOnboardingAction, type Onboarding } from "@/app/actions/onboarding";
import { poppins } from "@/component/shared/fonts";
import {
  AGENCY_EMAIL,
  DEFAULT_FEATURES,
  DEFAULT_PAGES,
  EMAIL_PROVIDERS,
  EMAIL_STEPS,
  FEATURE_CHOICES,
  GOOGLE,
  MAX_COMPETITORS,
  MEDIA,
  PAGE_CHOICES,
  SOCIAL,
  STEPS,
  accessGivenIds,
  accessOf,
  cleanPhone,
  contactProblem,
  fromBackend,
  isAccordion,
  isAnswered,
  itemsOf,
  platformsOf,
  statusesOf,
  stepOfItem,
  toBackend,
  type Account,
  type Answers,
  type Competitor,
  type Media,
  type PlatformGroup,
  type Status,
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
  review: ListChecks,
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
  // Which of an item's access steps are ticked.
  ticks: Record<string, boolean[]>;
  set: (key: string, value: string | boolean | undefined) => void;
  patch: (changes: Answers) => void;
  setTicks: (id: string, ticks: boolean[]) => void;
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
  type?: "text" | "url" | "number" | "email" | "tel";
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

// The steps for inviting us to an account, ticked off one by one. Once all are ticked the
// client can say access is given — or, at any point, that they need help with it.
const AccessSteps = ({ form, id, steps }: { form: Form; id: string; steps: string[] }) => {
  const ticked = steps.map((_, index) => Boolean(form.ticks[id]?.[index]));
  const allTicked = ticked.every(Boolean);
  const given = form.answers[`${id}.done`] === true;
  const needsHelp = form.answers[`${id}.help`] === true;

  const tick = (index: number) => {
    const next = ticked.map((on, at) => (at === index ? !on : on));
    form.setTicks(id, next);
    // Unticking a step takes back "access given".
    if (given && !next.every(Boolean)) form.set(`${id}.done`, false);
  };

  return (
    <>
      <div className="mt-3 rounded-lg border border-[#e6e8eb] bg-[#fcfcfd] px-4 py-3.5">
        <h4 className="mb-2 text-[12.5px] font-semibold text-[#0b0c24]">Give us access in {steps.length} steps</h4>
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li key={index}>
              <label className="flex cursor-pointer items-start gap-2.5 py-1.5 text-[12.5px] leading-normal">
                <input
                  type="checkbox"
                  checked={ticked[index]}
                  onChange={() => tick(index)}
                  aria-label={`Mark step ${index + 1} done`}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#16a34a]"
                />
                <span className={ticked[index] ? "text-[#6b7280] line-through" : "text-[#1f2530]"}>
                  <Rich text={step} />
                </span>
              </label>
            </li>
          ))}
        </ol>
        <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-[#e6e8eb] pt-2.5">
          <button
            type="button"
            disabled={!allTicked || given}
            onClick={() => {
              form.set(`${id}.done`, true);
              form.say("Thanks! We'll accept the invite and confirm by email.");
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#16a34a]"
          >
            {given ? (
              <>
                Access given <Check size={13} strokeWidth={2.5} />
              </>
            ) : (
              "I've given access"
            )}
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-[#374151]">
            <input type="checkbox" checked={needsHelp} onChange={(event) => form.set(`${id}.help`, event.target.checked)} className="h-4 w-4 accent-[#6d28d9]" />I need help with
            this
          </label>
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
        onChange={(event) => {
          // Another platform has other steps: what was ticked for the last one no longer counts.
          form.patch({ [`${id}.platform`]: event.target.value, [`${id}.done`]: false, [`${id}.help`]: false });
          form.setTicks(id, []);
        }}
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
      {Array.isArray(access) ? <AccessSteps key={platform} form={form} id={id} steps={access} /> : null}
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
      <Reveal open={has === "yes"}>
        <Field form={form} id="logo-link" name="logo.link" type="url" label="Link to your logo files" placeholder="Google Drive, Dropbox or WeTransfer link" first />
        <div className={`${hintClass} mt-1.5`}>
          Put your logo — plus brand colors and fonts if you have them — in a shared folder and paste its link. PNG, SVG, PDF, AI or EPS; the highest quality version you have.
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
        </Collapse>
      </Reveal>
    </>
  );
};

// A Google or social account: whether they have it, and then either how we get in, or
// whether we should make one.
const AccountItem = ({ form, account, google }: { form: Form; account: Account; google: boolean }) => {
  const { id, steps } = account;
  const has = form.answers[`${id}.has`];
  const access = form.answers[`${id}.access`];

  return (
    <>
      <p className={firstQuestionClass}>Do you have {google ? "an account" : "this account"}?</p>
      <Options label={`Do you have ${account.name}?`} value={has} choices={YES_NO_UNSURE} onChange={(value) => form.set(`${id}.has`, value)} />
      <Reveal open={has === "yes"}>
        {account.placeholder ? <Field form={form} id={`${id}-link`} name={`${id}.link`} label="Link or name" hint="(optional)" placeholder={account.placeholder} first /> : null}
        <p className={account.placeholder ? questionClass : firstQuestionClass}>How would you like to give us access?</p>
        <Options
          label="How would you like to give us access?"
          value={access}
          onChange={(value) => form.set(`${id}.access`, value)}
          choices={[
            ...(steps ? [{ value: "invite", label: `${google ? `Give us ${account.role?.toLowerCase()} access` : "Add us as an admin"} (recommended)` }] : []),
            { value: "secure", label: "Share login securely" },
          ]}
        />
        {steps ? (
          <Collapse open={access === "invite"}>
            <AccessSteps form={form} id={id} steps={steps} />
          </Collapse>
        ) : null}
        <Collapse open={access === "secure"}>
          <Note tone="blue" icon={Lock}>
            Please don&apos;t type your password here. We&apos;ll email you a private, secure link to share your login.
          </Note>
        </Collapse>
      </Reveal>
      <Reveal open={has === "no"}>
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
        <Field form={form} id={`${id}-link`} name={`${id}.link`} type="url" label="Shared folder link" placeholder="Google Drive, Dropbox or WeTransfer link" first />
        <div className={`${hintClass} mt-1.5`}>
          Put your {media.name.toLowerCase()} in a shared folder and paste its link. {media.formats}.
        </div>
      </Reveal>
      <Reveal open={mode === "create"}>
        <Note tone="violet">Your account manager will get back to you to plan the {media.shoot}: what to capture, where and when.</Note>
        <Field form={form} id={`${id}-notes`} name={`${id}.notes`} label="Anything we should know?" hint="(optional)" placeholder={media.notesPlaceholder} />
      </Reveal>
    </>
  );
};

// ── The review, and what happens after submitting ────────────────────────────

const LEGEND: [Tone, string][] = [
  ["done", "Done"],
  ["pending", "Waiting on you"],
  ["create", "We'll create it"],
  ["followup", "Manager will follow up"],
];

const Review = ({ statuses, onEdit }: { statuses: Status[]; onEdit: (item: string) => void }) => {
  const groups = [...new Set(statuses.map((status) => status.group))];
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {LEGEND.map(([tone, label]) => (
          <Pill key={tone} tone={tone}>
            {label}
          </Pill>
        ))}
      </div>
      <div className="flex flex-col gap-4.5">
        {groups.map((group) => (
          <div key={group}>
            <h4 className="mb-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-[#6b7280] uppercase">{group}</h4>
            <div className="flex flex-col gap-1.5">
              {statuses
                .filter((status) => status.group === group)
                .map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => onEdit(status.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2.5 text-left text-[12.5px] font-medium text-[#1f2530] transition-colors hover:border-[#2f5fd8]"
                  >
                    <span>{status.name}</span>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// The popup that says the onboarding went through: a tick that draws itself, and a thank-you
// by name — nothing more. Its one button goes home; Escape or a click outside closes it.
const Submitted = ({ name, company, onClose }: { name: string; company: string; onClose: () => void }) => {
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
            Onboarding submitted successfully
          </h2>
          <p className="mx-auto mt-1.5 max-w-105 text-[13px] leading-[1.6] text-[#4b5563]">
            Thank you{firstName ? `, ${firstName}` : ""}. We&apos;ve received your answers{company.trim() ? ` for ${company.trim()}` : ""} — your BayShore account manager will be in touch
            soon.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 border-t border-[#eef0f2] px-7 py-4">
          <Link href="/" autoFocus className="rounded-lg bg-[#0b0c24] px-5 py-2.5 text-[13px] font-semibold text-white no-underline hover:bg-[#1e2140]">
            Back to home
          </Link>
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

// What is being sent just now, so the right button shows it.
type Saving = "step" | "later" | "submit" | "delete" | null;

// `initial` is the onboarding this browser started earlier, if there is one: the form opens
// with those answers, past the step that asks who is answering.
const OnboardingProcess = ({ initial = null }: { initial?: Onboarding | null }) => {
  const [seed] = useState(() => (initial ? fromBackend(initial) : null));
  const [answers, setAnswers] = useState<Answers>(seed?.answers ?? BLANK_ANSWERS);
  // Access that was given was given by ticking every step: they show ticked again.
  const [ticks, setAllTicks] = useState<Record<string, boolean[]>>(() =>
    Object.fromEntries(accessGivenIds(seed?.answers ?? {}).map((id) => [id, Array.from({ length: 8 }, () => true)])),
  );
  const [competitors, setCompetitors] = useState<Competitor[]>(seed?.competitors ?? BLANK_COMPETITORS);
  const [pages, setPages] = useState(seed?.pages ?? DEFAULT_PAGES);
  const [features, setFeatures] = useState(seed?.features ?? DEFAULT_FEATURES);

  // Whether the backend holds this onboarding yet. It does from the first save on.
  const [started, setStarted] = useState(Boolean(initial));
  const [saving, setSaving] = useState<Saving>(null);

  const [current, setCurrent] = useState(initial ? 1 : 0);
  // The item open in a step that shows its items one at a time.
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  // Whose onboarding has just been handed in — for the popup that says so. The form itself is
  // emptied at that moment, so the popup keeps the name it thanks.
  const [submitted, setSubmitted] = useState<{ name: string; company: string } | null>(null);
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
    ticks,
    set: (key, value) => setAnswers((now) => ({ ...now, [key]: value })),
    patch: (changes) => setAnswers((now) => ({ ...now, ...changes })),
    setTicks: (id, next) => setAllTicks((now) => ({ ...now, [id]: next })),
    say,
  };

  const step = STEPS[current];
  const statuses = statusesOf(answers);
  const statusOf = (item: string) => statuses.find((status) => status.id === item);
  const answered = statuses.filter(isAnswered).length;
  const items = itemsOf(step.id, answers);
  const accordion = isAccordion(step.id);
  const StepIcon = STEP_ICONS[step.id];

  // A step is finished once every item on it has an answer.
  const finished = (id: StepId) => {
    const own = itemsOf(id, answers);
    return own.length > 0 && own.every((item) => {
      const status = statusOf(item);
      return status ? isAnswered(status) : false;
    });
  };

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
    let result = started ? await updateOnboardingAction(details) : await start();
    // What this browser had saved is gone (it was deleted, or its key was lost): everything is
    // still on the form, so it is simply saved again as a new onboarding.
    if (started && !result.ok && result.status === 404) result = await start();
    setSaving(null);

    if (!result.ok) {
      // Taken on by the team: it is theirs now, and no longer editable from here.
      if (started && result.status === 409) setStarted(false);
      setFailure({ message: result.error ?? "Couldn't save your answers. Please try again.", details: result.fieldErrors ?? [] });
      return false;
    }
    setStarted(true);
    return true;
  };

  // Opens a step — at the item named, or else at the first one still unanswered. What is on
  // the form is saved first; if that fails, the step stays where it is.
  const go = async (index: number, item?: string) => {
    if (index < 0 || index >= STEPS.length || saving) return false;
    if (!(await save("step"))) return false;
    const next = STEPS[index];
    const own = itemsOf(next.id, answers);
    setCurrent(index);
    const unanswered = own.find((id) => {
      const status = statusOf(id);
      return !status || !isAnswered(status);
    });
    setOpenItem(isAccordion(next.id) ? (item ?? unanswered ?? own[0] ?? null) : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  // From the review: opens the item where it is asked, and brings it into view once it is drawn.
  const edit = async (item: string) => {
    if (!(await go(STEPS.findIndex((entry) => entry.id === stepOfItem(item)), item))) return;
    setTimeout(() => document.getElementById(`onboarding-${item}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
  };

  const saveForLater = async () => {
    if (await save("later")) say("Saved. Come back on this browser any time to finish.");
  };

  // Empties the form, back to its first step.
  const reset = () => {
    setAnswers(BLANK_ANSWERS);
    setAllTicks({});
    setCompetitors(BLANK_COMPETITORS);
    setPages(DEFAULT_PAGES);
    setFeatures(DEFAULT_FEATURES);
    setStarted(false);
    setFailure(null);
    setCurrent(0);
    setOpenItem(null);
  };

  // Hands the onboarding in. Once it has gone through, the form is emptied: the answers are
  // with the team now, and this browser no longer holds them.
  const submit = async () => {
    const who = { name: text(answers, "contact.name"), company: text(answers, "contact.company") };
    if (!(await save("submit", true))) return;
    setSubmitted(who);
    reset();
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

  const nextStep = STEPS[current + 1];

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${poppins.className} flex flex-col gap-4.5`}>
        <div>
          <div className="text-[11px] font-semibold tracking-[0.04em] text-[#2f5fd8] uppercase">BayShore · Client onboarding</div>
          <h1 className="mt-1 text-[28px] leading-tight font-bold text-[#0b0c24]">Let&apos;s get your accounts set up</h1>
          <p className="mt-1.5 max-w-180 text-[13px] text-[#6b7280]">One step at a time. It takes about 10 minutes, and you can skip anything you&apos;re not sure about.</p>
        </div>

        {/* On a narrow screen the step list is out of sight, so the step in hand is named here. */}
        <div className={`${cardClass} px-4 py-3 lg:hidden`}>
          <div className="flex justify-between text-[12.5px]">
            <b className="font-semibold text-[#0b0c24]">{step.title}</b>
            <span className="text-[#6b7280]">
              Step {current + 1} of {STEPS.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
            <motion.div className="h-full rounded-full bg-[#2f5fd8]" initial={false} animate={{ width: `${((current + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.3 }} />
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
                      Step {current + 1} of {STEPS.length}
                    </div>
                    <h2 className="text-[17px] leading-snug font-semibold text-[#0b0c24]">{step.heading}</h2>
                    <p className="mt-0.5 text-[12.5px] text-[#6b7280]">{step.sub}</p>
                  </div>
                </div>

                {step.id === "review" ? (
                  <Review statuses={statuses} onEdit={edit} />
                ) : (
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
                                {bodyOf(item)}
                                <div className="mt-4 flex justify-end border-t border-[#e6e8eb] pt-3.5">
                                  <button type="button" className={smallButton} onClick={() => (after ? setOpenItem(after) : go(current + 1))}>
                                    {after ? `Next: ${ITEM_TITLES[after]} →` : nextStep ? `Done, go to ${nextStep.title} →` : "Done"}
                                  </button>
                                </div>
                              </div>
                            </Collapse>
                          ) : (
                            bodyOf(item)
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => go(current - 1)}
                className={`cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-wait disabled:opacity-60 ${current === 0 ? "invisible" : ""}`}
              >
                Back
              </button>
              <div className="ml-auto flex items-center gap-4">
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
                  ) : (
                    "Submit onboarding"
                  )}
                </button>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-4.5 lg:sticky lg:top-4">
            <div className={`${cardClass} hidden p-5.5 lg:block`}>
              <h3 className="text-[15px] font-semibold text-[#0b0c24]">Your progress</h3>
              <div className="mt-2.5 mb-1.5 h-2 overflow-hidden rounded-full bg-[#eef0f3]">
                <motion.div className="h-full rounded-full bg-[#16a34a]" initial={false} animate={{ width: `${(answered / statuses.length) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="text-[12.5px] text-[#6b7280]">
                {answered} of {statuses.length} questions answered
              </p>
              <ol className="mt-3.5 flex flex-col">
                {STEPS.map((entry, index) => {
                  const done = entry.id !== "review" && finished(entry.id);
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
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] ${
                            done ? "border-[#16a34a] bg-[#16a34a] text-white" : here ? "border-[#2f5fd8] bg-white text-[#2f5fd8]" : "border-[#d1d5db] bg-white"
                          }`}
                        >
                          {done ? <Check size={12} strokeWidth={3} /> : index + 1}
                        </span>
                        {entry.title}
                      </button>
                    </li>
                  );
                })}
              </ol>
              {started ? (
                <div className="mt-3.5 border-t border-[#eef0f2] pt-3 text-[11.5px] leading-normal text-[#6b7280]">
                  Saved under <b className="font-semibold break-all text-[#1f2530]">{text(answers, "contact.email")}</b>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={startOver}
                    className="mt-1 block cursor-pointer underline underline-offset-[3px] hover:text-[#b42318] disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving === "delete" ? "Deleting…" : "Delete my answers and start over"}
                  </button>
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
                    Never type passwords on this page. If a platform needs one, choose &quot;Share login securely&quot; and we&apos;ll send you a private link.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </aside>
        </div>

        <AnimatePresence>
          {submitted ? <Submitted name={submitted.name} company={submitted.company} onClose={() => setSubmitted(null)} /> : null}
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
