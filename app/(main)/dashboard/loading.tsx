// The dashboard's shape while it loads — same headline cards, channel cards and side
// cards as component/dashboard/Dashboard.tsx, so nothing jumps when the data arrives.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0, height }: { className: string; delay?: number; height?: string }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined, height }} />
);

// Six months of bars per channel, rising like most of the real ones do.
const BAR_HEIGHTS = [34, 46, 55, 68, 80, 94];

// One channel: icon tile, name and headline figure, the six-month bars, three figures.
const ChannelCard = ({ delay }: { delay: number }) => (
  <div className={`${cardClass} px-5 pt-5 pb-5`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <Bone className="h-11 w-11 shrink-0 rounded-xl" delay={delay} />
        <div>
          <Bone className="h-3.5 w-32" delay={delay} />
          <Bone className="mt-2 h-3 w-40 max-w-full" delay={delay} />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Bone className="h-6 w-20" delay={delay} />
        <Bone className="mt-2 h-2.5 w-16" delay={delay} />
      </div>
    </div>

    <div className="mt-6 flex gap-2">
      <div className="flex h-34 flex-col justify-between">
        {Array.from({ length: 5 }, (_, index) => (
          <Bone key={index} className="-my-1 h-2 w-6" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-34">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-2.5">
            {BAR_HEIGHTS.map((height, index) => (
              <Bone key={index} className="flex-1 rounded-t-[3px] rounded-b-none" delay={delay + 60 + index * 40} height={`${height}%`} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex h-4 items-center gap-2.5">
          {BAR_HEIGHTS.map((_, index) => (
            <span key={index} className="flex flex-1 justify-center">
              <Bone className="h-2 w-7" />
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index}>
          <Bone className="mt-0.5 h-3 w-16" delay={delay + 200 + index * 50} />
          <Bone className="mt-2 h-5 w-20 max-w-full" delay={delay + 200 + index * 50} />
        </div>
      ))}
    </div>
  </div>
);

// A right-column card: icon tile, title and subtitle, the list, and a footer link.
const SideCard = ({ rows, delay, pills = false }: { rows: number; delay: number; pills?: boolean }) => (
  <div className={`${cardClass} overflow-hidden`}>
    <div className="flex items-center gap-3 px-4.5 pt-4.5 pb-3.5">
      <Bone className="h-10 w-10 shrink-0 rounded-xl" delay={delay} />
      <div className="flex-1">
        <Bone className="h-3 w-44 max-w-full" delay={delay} />
        <Bone className="mt-2 h-2.5 w-32 max-w-full" delay={delay} />
      </div>
      {pills ? <Bone className="h-6.5 w-6.5 shrink-0 rounded-full" delay={delay} /> : null}
    </div>
    <div className="flex flex-col gap-1 px-2.5 pb-2">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-3 px-2 py-2.5">
          <Bone className="h-10 w-10 shrink-0 rounded-xl" delay={delay + 60 + row * 60} />
          <div className="min-w-0 flex-1">
            {/* Titles aren't all the same length. */}
            <Bone className={`h-3 ${["w-4/5", "w-3/5", "w-2/3", "w-3/4"][row % 4]}`} delay={delay + 60 + row * 60} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Bone className="h-2.5 w-24" delay={delay + 60 + row * 60} />
              {pills ? <Bone className="h-3.5 w-24 rounded" delay={delay + 60 + row * 60} /> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-center border-t border-[#eef0f2] py-4">
      <Bone className="h-3 w-28" />
    </div>
  </div>
);

const DashboardLoading = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading dashboard">
    <div className="mt-1.5">
      <Bone className="h-9 w-80 max-w-full" />
      <Bone className="mt-2.5 h-3.5 w-130 max-w-full" />
    </div>

    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border border-[#e6e8eb] bg-white px-4 pt-3.5 pb-4.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center gap-3">
            <Bone className="h-8.5 w-8.5 shrink-0 rounded-lg" delay={index * 80} />
            <Bone className="h-3 w-32 max-w-full" delay={index * 80} />
            <Bone className="ml-auto h-7 w-7 shrink-0 rounded-full" delay={index * 80} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <Bone className="h-8.5 w-20" delay={index * 80} />
            <Bone className="mb-1 h-3 w-24" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-1 flex h-6 items-center justify-between">
      <Bone className="h-4 w-44" />
      <Bone className="h-3 w-28" />
    </div>

    <div className="grid grid-cols-[minmax(0,2.7fr)_minmax(300px,1fr)] items-start gap-5">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <ChannelCard key={index} delay={120 + index * 90} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <SideCard rows={6} delay={180} pills />
        <SideCard rows={3} delay={420} />
      </div>
    </div>
    <span className="sr-only">Loading dashboard…</span>
  </div>
);

export default DashboardLoading;
