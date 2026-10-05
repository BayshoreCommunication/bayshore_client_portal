// A single report's shape while it loads — same heading, summary and sections of stat
// tiles and charts as component/reports/ReportDetails.tsx, so nothing jumps when it
// arrives. Without this file, a report would borrow the list's skeleton from ../loading.tsx.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const tileClass = "rounded-xl border border-[#e6e8eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0, height }: { className: string; delay?: number; height?: string }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined, height }} />
);

// One stat: badge, label and a short description on top; the figure and its change below.
const StatTile = ({ delay }: { delay: number }) => (
  <div className={`${tileClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <Bone className="h-10 w-10 shrink-0 rounded-lg" delay={delay} />
      <div className="flex-1">
        <Bone className="h-3 w-24" delay={delay} />
        <Bone className="mt-1.5 h-2.5 w-32 max-w-full" delay={delay} />
      </div>
    </div>
    <div className="mt-3 flex items-end justify-between gap-2">
      <Bone className="h-7.5 w-16" delay={delay} />
      <Bone className="h-3 w-12" delay={delay} />
    </div>
  </div>
);

const StatGrid = ({ tiles, delay }: { tiles: number; delay: number }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
    {Array.from({ length: tiles }, (_, index) => (
      <StatTile key={index} delay={delay + index * 70} />
    ))}
  </div>
);

// A comparison chart: the last period's bar beside this period's, with two figures underneath.
const ChartTile = ({ delay }: { delay: number }) => (
  <div className={`${tileClass} p-4`}>
    <div className="mb-4 flex items-center gap-3">
      <Bone className="h-10 w-10 shrink-0 rounded-lg" delay={delay} />
      <div className="flex-1">
        <Bone className="h-3 w-32" delay={delay} />
        <Bone className="mt-1.5 h-2.5 w-44 max-w-full" delay={delay} />
      </div>
      <Bone className="h-3 w-12 shrink-0" delay={delay} />
    </div>
    <div className="relative h-37.5">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
      ))}
      <div className="absolute inset-0 flex items-end justify-center gap-5">
        <Bone className="w-13.5 rounded-t-[3px] rounded-b-none" delay={delay + 80} height="66%" />
        <Bone className="w-13.5 rounded-t-[3px] rounded-b-none bg-[#e2e5e9]" delay={delay + 140} height="78%" />
      </div>
    </div>
    <div className="mt-2 flex h-4 items-center justify-center gap-5">
      <Bone className="h-2.5 w-13.5" />
      <Bone className="h-2.5 w-13.5" />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eef0f2] pt-3.5">
      {[0, 1].map((index) => (
        <div key={index}>
          <Bone className="h-2.5 w-24" delay={delay + 200 + index * 50} />
          <Bone className="mt-2 h-5 w-20" delay={delay + 200 + index * 50} />
        </div>
      ))}
    </div>
  </div>
);

// A report section: icon + title header, then the body.
const Section = ({ delay, children }: { delay: number; children: React.ReactNode }) => (
  <div className={cardClass}>
    <div className="flex items-center gap-3 px-6 pt-5">
      <Bone className="h-9 w-9 shrink-0 rounded-lg" delay={delay} />
      <Bone className="h-3.5 w-64 max-w-full" delay={delay} />
    </div>
    <div className="flex flex-col gap-4 px-6 pt-4.5 pb-6">{children}</div>
  </div>
);

const ReportLoading = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading report">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Bone className="mb-2 h-3 w-40" />
        <Bone className="h-8 w-96 max-w-full" />
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Bone className="h-5.5 w-16" />
          <Bone className="h-5.5 w-18" />
          <Bone className="h-3 w-80 max-w-full" />
        </div>
      </div>
      <Bone className="h-10 w-38 rounded-lg bg-[#d9dce1]" />
    </div>

    {/* The jump-to-section links. */}
    <div className="flex flex-wrap gap-2">
      {["w-20", "w-28", "w-16", "w-36", "w-40"].map((width, index) => (
        <Bone key={width} className={`h-7.5 rounded-lg bg-white ${width}`} delay={index * 50} />
      ))}
    </div>

    {/* The summary letter. */}
    <div className={`${cardClass} px-6 py-5`}>
      <Bone className="h-3 w-24" delay={100} />
      {["w-full", "w-11/12", "w-full", "w-4/5"].map((width, index) => (
        <Bone key={index} className={`mt-3 h-3 ${width}`} delay={140 + index * 50} />
      ))}
      <Bone className="mt-4 h-3 w-64 max-w-full" delay={340} />
    </div>

    {/* Social media: four stat tiles. */}
    <Section delay={220}>
      <StatGrid tiles={4} delay={260} />
    </Section>

    {/* Website: two comparison charts, each carrying its own figures. */}
    <Section delay={420}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        <ChartTile delay={460} />
        <ChartTile delay={540} />
      </div>
    </Section>

    {/* Google Business Profile: four stat tiles. */}
    <Section delay={640}>
      <StatGrid tiles={4} delay={680} />
    </Section>
    <span className="sr-only">Loading report…</span>
  </div>
);

export default ReportLoading;
