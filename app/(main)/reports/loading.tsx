// The My Reports page's shape while it loads — same heading, filter bar and table as
// component/reports/Reports.tsx, so nothing jumps when the reports arrive.
// (A single report has its own skeleton, in [slug]/loading.tsx.)

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const thClass = "bg-[#f3f4f6] px-3 py-2.5";
const tdClass = "border-b border-[#eef0f2] px-3 py-3.5";

// A page of reports is ten rows; eight fills the screen without overshooting a short list.
const ROWS = 8;

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

const ReportsLoading = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading reports">
    <div>
      <Bone className="h-8 w-44" />
      <Bone className="mt-2 h-3.5 w-120 max-w-full" />
    </div>

    <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
      <Bone className="h-9.5 w-45 rounded-lg" delay={60} />
      <Bone className="h-9.5 w-45 rounded-lg" delay={110} />
      <Bone className="ml-auto h-9.5 w-full max-w-112.5 rounded-lg" delay={160} />
    </div>

    <div className={`${cardClass} p-3.5`}>
      <table className="w-full border-separate border-spacing-0" aria-hidden="true">
        <thead>
          <tr>
            <th className={`${thClass} w-14 rounded-l-lg`}>
              <Bone className="mx-auto my-0.75 h-2.5 w-3 bg-[#e2e5e9]" />
            </th>
            <th className={thClass}>
              <Bone className="my-0.75 h-2.5 w-24 bg-[#e2e5e9]" />
            </th>
            {["w-10", "w-12", "w-16"].map((width) => (
              <th key={width} className={thClass}>
                <Bone className={`mx-auto my-0.75 h-2.5 bg-[#e2e5e9] ${width}`} />
              </th>
            ))}
            <th className={`${thClass} w-40 rounded-r-lg`}>
              <Bone className="mx-auto my-0.75 h-2.5 w-12 bg-[#e2e5e9]" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, index) => {
            const delay = 200 + index * 70;
            return (
              <tr key={index}>
                <td className={tdClass}>
                  <Bone className="mx-auto h-3 w-5" delay={delay} />
                </td>
                <td className={tdClass}>
                  {/* Report names aren't all the same length. */}
                  <Bone className={`my-0.75 h-3 ${["w-72", "w-60", "w-80", "w-64"][index % 4]} max-w-full`} delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-5.5 w-18" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-3 w-28" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-3 w-24" delay={delay} />
                </td>
                <td className={tdClass}>
                  <div className="flex items-center justify-center gap-2">
                    <Bone className="h-6.5 w-16" delay={delay} />
                    <Bone className="h-6.5 w-6.5" delay={delay} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between px-1">
        <Bone className="h-3 w-40" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-6.5 w-6.5" />
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading reports…</span>
  </div>
);

export default ReportsLoading;
