// The Content page's shape while it loads — same heading, summary tiles, filter bar and
// table as component/content/ContentList.tsx, so nothing jumps when the content arrives.
// (A single piece has its own skeleton, in [id]/loading.tsx.)

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const thClass = "bg-[#f3f4f6] px-3 py-2.5";
const tdClass = "border-b border-[#eef0f2] px-3 py-3";

// A page of content is ten rows; eight fills the screen without overshooting a short list.
const ROWS = 8;

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

const ContentLoading = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading content">
    <div>
      <Bone className="h-8 w-36" />
      <Bone className="mt-2 h-3.5 w-150 max-w-full" />
    </div>

    <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${cardClass} px-4 pt-3.5 pb-4`}>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 shrink-0 rounded-lg" delay={index * 80} />
            <div className="flex-1">
              <Bone className="h-3 w-28" delay={index * 80} />
              <Bone className="mt-1.5 h-2.5 w-36 max-w-full" delay={index * 80} />
            </div>
          </div>
          <Bone className="mt-3 h-7.5 w-10" delay={index * 80} />
        </div>
      ))}
    </div>

    <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
      {Array.from({ length: 3 }, (_, index) => (
        <Bone key={index} className="h-9.5 w-45 rounded-lg" delay={100 + index * 50} />
      ))}
      <Bone className="ml-auto h-9.5 w-full max-w-112.5 rounded-lg" delay={250} />
    </div>

    <div className={`${cardClass} p-3.5`}>
      <table className="w-full border-separate border-spacing-0" aria-hidden="true">
        <thead>
          <tr>
            <th className={`${thClass} w-14 rounded-l-lg`}>
              <Bone className="mx-auto my-0.75 h-2.5 w-3 bg-[#e2e5e9]" />
            </th>
            <th className={thClass}>
              <Bone className="my-0.75 h-2.5 w-16 bg-[#e2e5e9]" />
            </th>
            {["w-10", "w-12", "w-18", "w-12"].map((width, index) => (
              <th key={index} className={thClass}>
                <Bone className={`mx-auto my-0.75 h-2.5 bg-[#e2e5e9] ${width}`} />
              </th>
            ))}
            <th className={`${thClass} w-20 rounded-r-lg`}>
              <Bone className="mx-auto my-0.75 h-2.5 w-10 bg-[#e2e5e9]" />
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
                  <div className="flex items-center gap-3">
                    <Bone className="h-9 w-9 shrink-0 rounded-lg" delay={delay} />
                    <div className="min-w-0 flex-1">
                      {/* Titles aren't all the same length. */}
                      <Bone className={`h-3 ${["w-64", "w-52", "w-72", "w-44"][index % 4]} max-w-full`} delay={delay} />
                      <Bone className="mt-1.5 h-2.5 w-40" delay={delay} />
                    </div>
                  </div>
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-5.5 w-22" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-3 w-24" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-3 w-20" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-5.5 w-32" delay={delay} />
                </td>
                <td className={tdClass}>
                  <Bone className="mx-auto h-5 w-5" delay={delay} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between px-1">
        <Bone className="h-3 w-36" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-6.5 w-6.5" />
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading content…</span>
  </div>
);

export default ContentLoading;
