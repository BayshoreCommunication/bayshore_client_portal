import Trend from "@/component/shared/Trend";
import { leadSources, leadStats, leads } from "./data";

const Leads = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <b className="text-[#18232c]">Leads</b>
        </div>
      </div>

      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Your Leads</div>
        <div className="mt-1 text-[13px] text-[#657787]">Every new inquiry BayShore has captured for you this month.</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {leadStats.map((stat) => (
          <div className="rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5" key={stat.label}>
            <div className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]">{stat.label}</div>
            <div className="mb-2 text-[30px] font-bold text-[#0d1e2c]">
              {stat.value}
              {stat.suffix ? <span className="text-[13px] font-semibold text-[#8496a3]"> {stat.suffix}</span> : null}
            </div>
            <Trend direction="up" value={stat.delta} note={stat.note} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2.2fr_1fr] items-stretch gap-5">
        <div className="rounded-lg border border-[#dbe3de] bg-white p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]">
                  Lead
                </th>
                <th className="border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]">
                  Case Type
                </th>
                <th className="border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]">
                  Source
                </th>
                <th className="border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]">
                  Received
                </th>
                <th className="border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.name}>
                  <td className="border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] whitespace-nowrap text-[#384955]">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: lead.avatarColor }}
                      >
                        {lead.initials}
                      </div>
                      <div className="text-[12.5px] font-bold text-[#17242f]">{lead.name}</div>
                    </div>
                  </td>
                  <td className="border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] whitespace-nowrap text-[#384955]">
                    {lead.caseType}
                  </td>
                  <td className="border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] whitespace-nowrap text-[#384955]">
                    <span className="mr-1.5 inline-block h-1.75 w-1.75 rounded-full" style={{ background: lead.sourceColor }} />{" "}
                    {lead.source}
                  </td>
                  <td className="border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] whitespace-nowrap text-[#384955]">
                    {lead.received}
                  </td>
                  <td className="border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] whitespace-nowrap text-[#384955]">
                    <span
                      className="rounded-xl px-2.75 py-1 text-[10.5px] font-bold whitespace-nowrap"
                      style={{ background: lead.statusBg, color: lead.statusColor }}
                    >
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between px-4.5 py-3.5 text-[11.5px] text-[#7a8e9b]">
            <span>Showing {leads.length} of 84 leads</span>
            <span>September 2026</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-3.5">
              <div className="text-sm font-bold text-[#0d1e2c]">Where Leads Come From</div>
              <div className="mt-0.5 text-[11px] text-[#728492]">September, month to date</div>
            </div>
            <div className="flex flex-col gap-3">
              {leadSources.map((source) => (
                <div className="flex items-center gap-2" key={source.label}>
                  <span className="inline-block h-1.75 w-1.75 rounded-full" style={{ background: source.color }} />
                  <span className="w-13 shrink-0 text-xs font-semibold text-[#17242f]">{source.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#eef3ef]">
                    <div className="h-full rounded-[3px]" style={{ width: `${source.width}%`, background: source.color }} />
                  </div>
                  <span className="w-5.5 text-right text-xs font-bold text-[#17242f]">{source.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-2 text-sm font-bold text-[#0d1e2c]">Have a question?</div>
            <div className="text-[11px] text-[#7a8e9b]">
              If any of these look unfamiliar or you&apos;d like more detail on a specific lead, message{" "}
              <b className="text-[#17242f]">Jordan Reyes</b>, your account manager.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Leads;
