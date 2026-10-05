// The Leads page's shape while it loads — same tiles, filter bar, table and side
// cards as component/leads/Leads.tsx, so nothing jumps when the data arrives.
// Changing a filter doesn't show this: the list dims in place instead.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const ROWS = 6;

const Bone = ({ className }: { className: string }) => <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} />;

const LeadsLoading = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading leads">
    <div>
      <Bone className="h-8 w-28" />
      <Bone className="mt-2 h-3.5 w-80 max-w-full" />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${cardClass} px-4 pt-3.5 pb-4`}>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Bone className="h-3 w-24" />
              <Bone className="mt-1.5 h-2.5 w-32" />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <Bone className="h-7.5 w-12" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>

    <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
      {Array.from({ length: 4 }, (_, index) => (
        <Bone key={index} className="h-9.5 w-full rounded-lg sm:w-42" />
      ))}
      <Bone className="h-9.5 w-full rounded-lg xl:ml-auto xl:max-w-72" />
    </div>

    <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={`${cardClass} p-3.5`}>
        <div className="h-9.5 rounded-lg bg-[#f3f4f6]" />
        {Array.from({ length: ROWS }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-[#eef0f2] px-3 py-3">
            <Bone className="h-9 w-9 shrink-0 rounded-full" />
            <div className="w-[28%] min-w-28">
              <Bone className="h-3 w-3/4" />
              <Bone className="mt-1.5 h-2.5 w-1/2" />
            </div>
            <Bone className="hidden h-3 w-[16%] sm:block" />
            <Bone className="hidden h-3 w-[14%] md:block" />
            <Bone className="hidden h-3 w-[12%] md:block" />
            <Bone className="ml-auto h-6 w-24 rounded-md" />
          </div>
        ))}
        <div className="mt-4 flex items-center justify-between px-1">
          <Bone className="h-3 w-36" />
          <Bone className="h-8 w-28 rounded-md" />
        </div>
      </div>

      <div className="flex flex-col gap-4.5">
        {[3, 4].map((bars, index) => (
          <div key={index} className={`${cardClass} p-4.5`}>
            <div className="mb-4 flex items-center gap-3">
              <Bone className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Bone className="h-3 w-36" />
                <Bone className="mt-1.5 h-2.5 w-20" />
              </div>
            </div>
            <div className="flex flex-col gap-3.5">
              {Array.from({ length: bars }, (_, bar) => (
                <div key={bar}>
                  <div className="mb-1.5 flex justify-between">
                    <Bone className="h-3 w-24" />
                    <Bone className="h-3 w-12" />
                  </div>
                  <Bone className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className={`${cardClass} p-4.5`}>
          <div className="mb-3 flex items-center gap-3">
            <Bone className="h-9 w-9 shrink-0 rounded-lg" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="h-3 w-full" />
          <Bone className="mt-1.5 h-3 w-4/5" />
          <Bone className="mt-3.5 h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
    <span className="sr-only">Loading leads…</span>
  </div>
);

export default LeadsLoading;
