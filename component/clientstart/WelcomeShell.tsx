import { Fragment, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { fraunces, inter } from "@/component/shared/fonts";

// The front door's look, from the "bayshore-signup-v3" design — sand and sea with a warm
// accent, set in Inter and Fraunces — shared by creating an account (the front page,
// component/clientstart/ClientSignup.tsx) and logging in (/sign-in, component/auth/SigninForm.tsx).
// The page is the same for both: the header, the pitch and "how it works" on the left, and a
// card on the right that holds each page's own form. Its animations are the su-* keyframes in
// app/globals.css.

// Fades and rises into place, `after` the delay given.
const rise = "animate-[su-rise_0.7s_cubic-bezier(.2,.7,.2,1)_both]";
const after = (seconds: number) => ({ animationDelay: `${seconds}s` });

// 16px text on a phone: anything smaller and iOS zooms in when the box is tapped.
export const suInputClass =
  "h-12 w-full rounded-xl border-[1.5px] px-3.5 text-[15px] text-[#1d2731] max-[640px]:text-[16px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#a3a9b0] hover:border-[#c8bfae] focus:border-[#2e7d8c] focus:ring-4 focus:ring-[#2e7d8c]/15 group-data-[invalid]/field:border-[#b42318]!";
// A box filled in as it should be turns faintly green.
export const suInputState = (done: boolean) => (done ? "border-[#b9d8c8] bg-[linear-gradient(90deg,#fff_85%,#f1f8f4)]" : "border-[#ddd6c8] bg-white");
export const suFocusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e7d8c]";

// The card's main button. A glint passes over it now and then; once everything is filled in
// (`ready`) it turns sea-blue and glows.
export const suButtonClass = (ready: boolean) =>
  `group relative flex h-13.5 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-xl text-[16px] font-semibold text-white transition-[background-color,translate,box-shadow] duration-200 after:absolute after:top-0 after:-left-[60%] after:h-full after:w-[40%] after:animate-[su-shine_3.5s_2s_ease-in-out_infinite] after:bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.25),transparent)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_rgba(15,42,61,.7)] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70 ${ready ? "animate-[su-glow_1.6s_ease-in-out_infinite] bg-linear-to-r from-[#0f2a3d] to-[#2e7d8c]" : "bg-[#0f2a3d] hover:bg-[#173a52]"} ${suFocusRing}`;

// The arrow at the end of that button, nudging forward on hover.
export const ButtonArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-1">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// The logo — waves with the sun over them — and the name, as the way back to the front page.
// `dark` is for the navy bar over the steps. This flow is the front page, so mid-way `onHome`
// is there to stop the link: it would only start the flow again.
export const Logo = ({ dark = false, onHome }: { dark?: boolean; onHome?: (event: MouseEvent<HTMLAnchorElement>) => void }) => (
  <Link
    href="/"
    onClick={onHome}
    className={`flex items-center gap-2.5 rounded-lg no-underline focus-visible:outline-2 focus-visible:outline-offset-2 ${dark ? "focus-visible:outline-[#b8892f]" : "focus-visible:outline-[#2e7d8c]"}`}
  >
    <span aria-hidden="true" className={`grid size-9 flex-none place-items-center rounded-[10px] ${dark ? "bg-white/8 ring-1 ring-white/15" : "bg-[#0f2a3d]"}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4efe6" strokeWidth={2} strokeLinecap="round">
        <path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
        <path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" opacity=".6" />
        <circle cx="12" cy="7" r="3" stroke="#d98b4a" className="origin-center animate-[su-bob_3s_ease-in-out_infinite] [transform-box:fill-box] motion-reduce:animate-none" />
      </svg>
    </span>
    <span className="leading-none">
      <b className={`${fraunces.className} block text-[20px] font-semibold tracking-[-0.01em] ${dark ? "text-white" : "text-[#0f2a3d]"}`}>BayShore</b>
      <small className={`${inter.className} mt-1 block text-[10px] font-medium tracking-[.18em] uppercase ${dark ? "text-[#a3b3bc]" : "text-[#667280]"}`}>Client&apos;s Portal</small>
    </span>
  </Link>
);

// A stroke that draws itself, holds, fades and draws again — first when its stop lights up.
// Drawn with pathLength 1; with less motion it simply stays drawn.
const retrace = "animate-[su-retrace_3.2s_ease-in-out_infinite_both] [stroke-dasharray:1] motion-reduce:animate-none";

// A stroke drawn once, from its start to its end, and left drawn.
const drawOnce = "animate-[su-draw_0.6s_ease-out_forwards] [stroke-dasharray:1] [stroke-dashoffset:1]";

// One of the three cards on the left. Each icon moves in its own way once its stop is reached
// (`at`, in seconds).
type Stop = { icon: (at: number) => ReactNode; title: string; note: string; when: string; lit: number };

// Creating an account: how it goes from here.
const SIGNUP_STOPS: Stop[] = [
  {
    // The pen writes, and a line is drawn under it.
    icon: (at) => (
      <>
        <path d="M12 20h9" pathLength={1} className={retrace} style={after(at + 0.2)} />
        <path
          d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"
          className="origin-bottom-left animate-[su-write_3.2s_ease-in-out_infinite] [transform-box:fill-box] motion-reduce:animate-none"
          style={after(at + 0.2)}
        />
      </>
    ),
    title: "Tell us about your brand",
    note: "Goals, audience, what's working",
    when: "Today",
    lit: 1.3,
  },
  {
    // The calendar's rings hop, and a tick is drawn on the day.
    icon: (at) => (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M16 2v4M8 2v4" className="animate-[su-hop_3.2s_ease-in-out_infinite] motion-reduce:animate-none" style={after(at + 0.2)} />
        <path d="M9 15.5l2 2 4-4" pathLength={1} className={retrace} style={after(at + 0.35)} />
      </>
    ),
    title: "Book your onboarding call",
    note: "Pick a time that suits you",
    when: "You choose",
    lit: 2.4,
  },
  {
    // The line climbs once from low to high, and the arrow comes in at the top and stays.
    icon: (at) => (
      <>
        <path d="M3 17l6-6 4 4 8-8" pathLength={1} className="animate-[su-draw_0.9s_ease-out_forwards] [stroke-dasharray:1] [stroke-dashoffset:1]" style={after(at + 0.2)} />
        <path d="M14 7h7v7" className="animate-[su-arrow_0.4s_ease-out_both]" style={after(at + 0.95)} />
      </>
    ),
    title: "We start growing it",
    note: "Your team gets to work",
    when: "Right after",
    lit: 3.5,
  },
];

// Logging in: someone who is a client already needs no pitch — just what is waiting inside.
const SIGNIN_STOPS: Stop[] = [
  {
    // A tick drawn on the clipboard, again and again.
    icon: (at) => (
      <>
        <path d="M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" pathLength={1} className={retrace} style={after(at + 0.25)} />
      </>
    ),
    // A client who signed up themselves starts with the onboarding form.
    title: "Pick up where you left off",
    note: "Finish your onboarding anytime",
    when: "Onboarding",
    lit: 1.3,
  },
  {
    // The bars grow up from the base, one after another, and stay.
    icon: (at) => (
      <>
        <path d="M3 20h18" />
        <path d="M7 20v-5" pathLength={1} className={drawOnce} style={after(at + 0.2)} />
        <path d="M12 20v-9" pathLength={1} className={drawOnce} style={after(at + 0.4)} />
        <path d="M17 20v-14" pathLength={1} className={drawOnce} style={after(at + 0.6)} />
      </>
    ),
    title: "See your results",
    note: "Reports, leads and growth",
    when: "Live",
    lit: 2.4,
  },
  {
    // Someone typing in the bubble.
    icon: (at) => (
      <>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        {[8.5, 12, 15.5].map((cx, index) => (
          <circle
            key={cx}
            cx={cx}
            cy="12"
            r="1"
            fill="currentColor"
            stroke="none"
            className="animate-[typing-dot_1.2s_ease-in-out_infinite_both] [transform-box:fill-box] motion-reduce:animate-none"
            style={after(at + 0.2 + index * 0.15)}
          />
        ))}
      </>
    ),
    title: "Talk to your team",
    note: "Messages, approvals, updates",
    when: "Anytime",
    lit: 3.5,
  },
];

// What each page says on the left, and on the chips floating beside its card.
const COPY = {
  signup: {
    eyebrow: "You're 5 minutes away",
    title: "Your brand's growth starts",
    highlight: "in 5 minutes.",
    words: ["One form.", "One team.", "Zero agency headaches."],
    lede: "Fill this out and book your onboarding call. Your answers help us understand your brand and your goals, so we show up with a plan to grow it. No sales pitch, ever.",
    listLabel: "How it works",
    stops: SIGNUP_STOPS,
    topChip: "No sales pitch",
    bottomChip: "Growth plan",
  },
  signin: {
    eyebrow: "Welcome back",
    title: "Your growth is right",
    highlight: "where you left it.",
    words: ["Results.", "Projects.", "Your team."],
    lede: "Log in to see how your brand is doing and what your team is working on this week.",
    listLabel: "What's waiting for you",
    stops: SIGNIN_STOPS,
    topChip: "Secure login",
    bottomChip: "Leads up",
  },
};

// Soft blobs and slow waves behind the page.
const SignupBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute -top-35 -left-30 size-130 animate-[su-float1_18s_ease-in-out_infinite] rounded-full bg-[#f1d3b3] opacity-55 blur-[60px]" />
    <div className="absolute -right-20 -bottom-40 size-115 animate-[su-float2_22s_ease-in-out_infinite] rounded-full bg-[#cfe6e9] opacity-55 blur-[60px]" />
    <div className="absolute top-[40%] left-[45%] size-75 animate-[su-float1_26s_ease-in-out_infinite_reverse] rounded-full bg-[#f6e2c8] opacity-55 blur-[60px]" />
    <svg viewBox="0 0 2880 140" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-35 w-[200%] animate-[su-drift_16s_linear_infinite] opacity-60">
      <path d="M0 70 C240 20 480 120 720 70 S1200 20 1440 70 S1920 120 2160 70 S2640 20 2880 70 V140 H0Z" fill="#ebe3d4" />
    </svg>
    <svg viewBox="0 0 2880 110" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-27.5 w-[200%] animate-[su-drift_24s_linear_infinite_reverse] opacity-45">
      <path d="M0 55 C300 10 600 100 900 55 S1500 10 1800 55 S2400 100 2880 55 V110 H0Z" fill="#e2d8c6" />
    </svg>
  </div>
);

// `variant` is which page this is: what the left side says follows it. `question` and the link
// beside it in the header lead to the other page; `children` go in the card.
export const WelcomeShell = ({
  variant,
  question,
  linkHref,
  linkLabel,
  children,
}: {
  variant: keyof typeof COPY;
  question: string;
  linkHref: string;
  linkLabel: string;
  children: ReactNode;
}) => {
  const copy = COPY[variant];
  const { stops } = copy;
  // When the glint starts running down the lines: once the last stop has lit up.
  const glintAt = stops[stops.length - 1].lit + 0.4;

  return (
    <div className={`su-page ${inter.className} relative flex min-h-screen flex-col overflow-x-hidden bg-[#f4efe6] text-[14px] leading-[1.55] text-[#1d2731]`}>
      <SignupBackdrop />

      {/* Held to the same width as the page below it, so the logo and the link line up with its edges. */}
      <header className={`${rise} relative z-2 mx-auto flex w-full max-w-300 items-center justify-between px-10 py-5 max-[980px]:px-5 max-[640px]:py-4`}>
        <Logo />
        {/* The way to the other page: logging in from creating an account, and back. */}
        <div className="text-[14px] text-[#667280]">
          <span className="max-[640px]:hidden">{question}</span>
          <Link href={linkHref} className={`ml-1.5 border-b-2 border-[#d98b4a] pb-px font-semibold text-[#0f2a3d] no-underline ${suFocusRing}`}>
            {linkLabel}
          </Link>
        </div>
      </header>

      {/* Room at the top for the chip that floats over the card's corner, clear of the header. */}
      <main className="relative z-1 mx-auto grid w-full max-w-300 flex-1 grid-cols-[1.05fr_1fr] content-center items-center gap-x-14 px-10 pt-8 pb-14 max-[980px]:grid-cols-1 max-[980px]:gap-y-8 max-[980px]:px-5 max-[980px]:pt-4 max-[980px]:pb-12">
        {/* The pitch: above the "how it works" on the left, and above the form on a narrow screen. */}
        <section className="col-start-1 row-start-1 self-end">
          <span className={`${rise} inline-flex items-center gap-2 rounded-full border border-[#ddd6c8] bg-white py-1.5 pr-3 pl-2 text-[12px] font-semibold tracking-[.08em] text-[#2e7d8c] uppercase`} style={after(0.1)}>
            <span className="relative size-2 rounded-full bg-[#d98b4a] after:absolute after:inset-0 after:animate-[su-ping_1.8s_ease-out_infinite] after:rounded-full after:bg-[#d98b4a]" />
            {copy.eyebrow}
          </span>
          <h1 className={`${fraunces.className} ${rise} mt-4.5 mb-3.5 text-[clamp(36px,4.4vw,56px)] leading-[1.04] font-medium tracking-[-0.025em] text-balance text-[#0f2a3d]`} style={after(0.25)}>
            {copy.title}{" "}
            <span className="relative whitespace-nowrap text-[#2e7d8c] italic">
              {copy.highlight}
              <svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-1.5 left-0 h-3 w-full overflow-visible">
                <path
                  d="M3 8 C80 2 200 2 297 7"
                  fill="none"
                  stroke="#d98b4a"
                  strokeWidth={4}
                  strokeLinecap="round"
                  className="animate-[su-draw_1s_0.9s_ease-out_forwards] [stroke-dasharray:320] [stroke-dashoffset:320]"
                />
              </svg>
            </span>
          </h1>
          <p aria-label={copy.words.join(" ")} className={`${fraunces.className} mb-3 text-[21px] text-[#0f2a3d]`}>
            {copy.words.map((words, index) => (
              <Fragment key={words}>
                {index ? " " : null}
                <span aria-hidden="true" className="inline-block animate-[su-pop_0.5s_cubic-bezier(.3,1.6,.5,1)_both]" style={after(1.1 + index * 0.25)}>
                  {words}
                </span>
              </Fragment>
            ))}
          </p>
        </section>

        <section className="col-start-1 row-start-2 self-start max-[980px]:row-start-3">
          <p className={`${rise} mb-6.5 max-w-120 text-[16px] leading-[1.6] text-[#667280]`} style={after(0.45)}>
            {copy.lede}
          </p>
          {/* Three stops, reached one at a time: the card warms up and its icon grows in and takes
              colour, then a wavy line draws itself down to the next icon, which does the same. Once
              all three are lit, a glint keeps running down the lines. */}
          <ol aria-label={copy.listLabel} className={`${rise} grid max-w-120 gap-3.5`} style={after(0.6)}>
            {stops.map((stop, index) => {
              const next = stops[index + 1];
              return (
                <li
                  key={stop.title}
                  // Each card sits over the one after it, so its line can run down onto the next icon.
                  style={{ zIndex: stops.length - index, ...after(stop.lit) }}
                  className="relative flex animate-[su-card-lit_0.6s_ease-out_both] items-center gap-3.5 rounded-[14px] border border-[#ddd6c8] bg-white/80 py-2.5 pr-3.5 pl-3 backdrop-blur-[6px]"
                >
                  {/* Starts small and muted; grows past its size and settles, in the accent colour. */}
                  <span
                    className="relative z-1 grid size-10 flex-none animate-[su-icon-lit_0.7s_cubic-bezier(.3,1.5,.5,1)_both] place-items-center rounded-xl border border-[#ebe3d4] bg-[#f4efe6] text-[#9aa3ad]"
                    style={after(stop.lit)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      {stop.icon(stop.lit)}
                    </svg>
                  </span>
                  {/* From the bottom of this icon to the top of the next: its padding, the gap and the next one's padding. */}
                  {next ? (
                    <svg viewBox="0 0 16 36" aria-hidden="true" preserveAspectRatio="none" className="pointer-events-none absolute top-[calc(100%-10px)] left-6 h-9 w-4 overflow-visible">
                      <path
                        d="M8 0 C15 7 1 12 8 18 S1 29 8 36"
                        pathLength={1}
                        fill="none"
                        stroke="#e8c9a6"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        className="animate-[su-draw_0.75s_ease-in-out_forwards] [stroke-dasharray:1] [stroke-dashoffset:1]"
                        style={after(stop.lit + 0.35)}
                      />
                      <path
                        d="M8 0 C15 7 1 12 8 18 S1 29 8 36"
                        pathLength={1}
                        fill="none"
                        stroke="#d98b4a"
                        strokeWidth={2}
                        strokeLinecap="round"
                        className="animate-[su-show_0.4s_ease-out_both,su-flow_2.4s_linear_infinite] [stroke-dasharray:0.14_0.86] motion-reduce:hidden"
                        // After the last stop is lit, each line a beat after the one above it.
                        style={{ animationDelay: `${glintAt + index * 0.6}s, ${glintAt + index * 0.6}s` }}
                      />
                    </svg>
                  ) : null}
                  <span>
                    <b className="block text-[14px] leading-5 font-semibold text-[#0f2a3d]">{stop.title}</b>
                    <small className="mt-0.5 block text-[12px] leading-4 text-[#667280]">{stop.note}</small>
                  </span>
                  <span
                    className="ml-auto animate-[su-pop_0.5s_cubic-bezier(.3,1.6,.5,1)_both] rounded-full bg-[#e6f2f4] px-2 py-0.75 text-[11px] font-semibold whitespace-nowrap text-[#2e7d8c] max-[640px]:hidden"
                    style={after(stop.lit + 0.2)}
                  >
                    {stop.when}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* The form: on the right, the height of both of the above, and between them on a narrow screen. */}
        <section className={`${rise} relative col-start-2 row-span-2 row-start-1 max-[980px]:col-start-1 max-[980px]:row-span-1 max-[980px]:row-start-2`} style={after(0.35)}>
          <div className="absolute -top-4.5 -right-3.5 z-2 flex animate-[su-hover_5s_ease-in-out_infinite] items-center gap-2 rounded-xl border border-[#ddd6c8] bg-white px-3 py-2 text-[12px] font-semibold whitespace-nowrap text-[#0f2a3d] shadow-[0_12px_24px_-14px_rgba(15,42,61,.4)] max-[980px]:-right-1">
            <i className="grid size-5.5 place-items-center rounded-[7px] bg-[#e3f1ea] text-[12px] text-[#2e7d5b] not-italic">
              {variant === "signin" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              ) : (
                "✓"
              )}
            </i>
            {copy.topChip}
          </div>
          <div className="absolute -bottom-4.5 -left-10 z-2 flex animate-[su-hover_6s_1s_ease-in-out_infinite] items-center gap-2 rounded-xl border border-[#ddd6c8] bg-white px-3 py-2 text-[12px] font-semibold whitespace-nowrap text-[#0f2a3d] shadow-[0_12px_24px_-14px_rgba(15,42,61,.4)] max-[980px]:-left-2 max-[640px]:hidden">
            <i className="grid size-5.5 place-items-center rounded-[7px] bg-[#fbeadb] text-[12px] text-[#d98b4a] not-italic">↗</i>
            {copy.bottomChip}
            <svg viewBox="0 0 46 18" aria-hidden="true" className="h-4.5 w-11.5">
              <path
                d="M2 15 L10 12 L17 13 L25 8 L32 9 L44 3"
                fill="none"
                stroke="#d98b4a"
                strokeWidth={2}
                strokeLinecap="round"
                className="animate-[su-draw_1.6s_1.6s_ease-out_forwards,su-redraw_6s_3.2s_ease-in-out_infinite] [stroke-dasharray:80] [stroke-dashoffset:80]"
              />
            </svg>
          </div>

          {/* --su-radius is the card's corner, which the ring around it (.su-ring) follows. */}
          <div className="su-ring relative rounded-(--su-radius) border border-[#0f2a3d]/6 bg-white p-8 shadow-[0_1px_0_rgba(15,42,61,.04),0_30px_60px_-28px_rgba(15,42,61,.35)] [--su-radius:24px] max-[640px]:px-5 max-[640px]:py-6 max-[640px]:[--su-radius:20px]">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};
