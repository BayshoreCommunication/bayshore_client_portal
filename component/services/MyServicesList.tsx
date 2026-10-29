"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, History, Repeat, Sparkles } from "lucide-react";
import type { MyServicesData } from "@/app/actions/service";
import { inter, poppins } from "@/component/shared/fonts";
import { groupOfName } from "./serviceCatalog";
import { dollars } from "./serviceUi";

// Everything the client has with BayShore, on one card: what they pay each month, what they pay
// once, and — under it — what was finished for them, to look back on. Totals sit at the foot.

type Row = { key: string; name: string; price?: number; included: string[]; note?: string; addedAt?: string };

const dateOf = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined);

const ServiceRow = ({ row, suffix }: { row: Row; suffix: string }) => {
  const [open, setOpen] = useState(false);
  const group = groupOfName(row.name);
  const added = dateOf(row.addedAt);
  const meta = [row.note, added ? `Added ${added}` : ""].filter(Boolean).join(" · ");
  return (
    <li className="group">
      <button
        type="button"
        onClick={() => setOpen((now) => !now)}
        disabled={!row.included.length}
        aria-expanded={row.included.length ? open : undefined}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-[#f9fafb]"
      >
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: group.color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[#111827]">{row.name}</span>
          {meta ? <span className="block truncate text-[12px] text-[#6b7280]">{meta}</span> : null}
        </span>
        <span className="shrink-0 text-right">
          {row.price === undefined ? (
            <span className="text-[12.5px] font-medium text-[#6b7280]">In your plan</span>
          ) : (
            <span className={`${poppins.className} text-[15px] font-semibold text-[#111827] tabular-nums`}>
              {dollars(row.price)}
              <span className="ml-0.5 text-[12px] font-medium text-[#6b7280]">{suffix}</span>
            </span>
          )}
        </span>
        {row.included.length ? <ChevronDown className={`size-4 shrink-0 text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} /> : <span className="size-4 shrink-0" />}
      </button>
      {open ? (
        <ul className="flex flex-wrap gap-1.5 px-4 pb-3 pl-8">
          {row.included.map((line) => (
            <li key={line} className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[12px] text-[#374151]">
              <CheckCircle2 className="size-3.25 text-[#16a34a]" strokeWidth={2.25} />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const Group = ({ icon: Icon, title, hint, color, background, rows, suffix, empty }: { icon: typeof Repeat; title: string; hint: string; color: string; background: string; rows: Row[]; suffix: string; empty: string }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
      <span className="grid size-8 place-items-center rounded-lg" style={{ color, background }}>
        <Icon className="size-4" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-[#111827]">
          {title} <span className="font-medium text-[#9ca3af]">· {rows.length}</span>
        </div>
        <div className="text-[11.5px] text-[#6b7280]">{hint}</div>
      </div>
    </div>
    {rows.length ? (
      <ul className="divide-y divide-[#f1f2f4]">
        {rows.map((row) => (
          <ServiceRow key={row.key} row={row} suffix={suffix} />
        ))}
      </ul>
    ) : (
      <p className="px-4 pb-4 text-[12.5px] text-[#9ca3af]">{empty}</p>
    )}
  </div>
);

const MyServicesList = ({ mine }: { mine: MyServicesData }) => {
  const [showHistory, setShowHistory] = useState(false);

  const monthly: Row[] = [
    ...mine.services.map((entry) => ({
      key: `catalog-${entry._id}`,
      name: entry.service.title,
      price: entry.monthlyPrice,
      included: entry.subServices.map((item) => item.name),
      addedAt: entry.createdAt,
    })),
    ...(mine.plans ?? []).map((plan) => ({ key: `plan-${plan.name}`, name: plan.name, price: plan.monthly, included: plan.included, addedAt: plan.addedAt })),
    ...(mine.unpriced ?? []).map((name) => ({ key: `unpriced-${name}`, name, included: [] })),
  ];
  const oneTime: Row[] = (mine.oneTime ?? []).map((item) => ({ key: `once-${item.name}`, name: item.name, price: item.price, included: item.included ?? [], note: item.detail, addedAt: item.addedAt }));
  const history = mine.history ?? [];
  const monthlyTotal = mine.monthlyTotal + (mine.planTotal ?? 0);
  const oneTimeTotal = mine.oneTimeTotal ?? oneTime.reduce((sum, row) => sum + (row.price ?? 0), 0);

  if (!monthly.length && !oneTime.length && !history.length) return null;

  return (
    <section className={`${inter.className} mt-5 overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white`}>
      <div className="grid grid-cols-1 divide-[#f1f2f4] lg:grid-cols-2 lg:divide-x max-lg:divide-y">
        <Group icon={Repeat} title="Monthly" hint="Running each month" color="#2f855a" background="#e4f4ea" rows={monthly} suffix="/mo" empty="No monthly services right now." />
        <Group icon={Sparkles} title="One-time" hint="Paid once, not monthly" color="#c2551b" background="#fdece0" rows={oneTime} suffix=" once" empty="No one-time services right now." />
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-[#f1f2f4] bg-[#f1f2f4]">
        <div className="bg-[#f6fbf8] px-5 py-3">
          <div className="text-[11px] font-semibold tracking-[0.05em] text-[#2f855a] uppercase">Monthly total</div>
          <div className={`${poppins.className} text-[20px] font-semibold text-[#111827] tabular-nums`}>
            {dollars(monthlyTotal)}
            <span className="ml-0.5 text-[13px] font-medium text-[#6b7280]">/mo</span>
          </div>
        </div>
        <div className="bg-[#fdf8f4] px-5 py-3">
          <div className="text-[11px] font-semibold tracking-[0.05em] text-[#c2551b] uppercase">One-time total</div>
          <div className={`${poppins.className} text-[20px] font-semibold text-[#111827] tabular-nums`}>{dollars(oneTimeTotal)}</div>
        </div>
      </div>

      {history.length ? (
        <div className="border-t border-[#f1f2f4]">
          <button
            type="button"
            onClick={() => setShowHistory((now) => !now)}
            aria-expanded={showHistory}
            className="flex w-full cursor-pointer items-center gap-2.5 px-5 py-3 text-left hover:bg-[#f9fafb]"
          >
            <History className="size-4 text-[#6b7280]" strokeWidth={2} />
            <span className="flex-1 text-[13.5px] font-semibold text-[#374151]">
              Completed <span className="font-medium text-[#9ca3af]">· {history.length}</span>
            </span>
            <span className="text-[12px] text-[#6b7280]">{showHistory ? "Hide" : "Show history"}</span>
            <ChevronDown className={`size-4 text-[#9ca3af] transition-transform ${showHistory ? "rotate-180" : ""}`} strokeWidth={2} />
          </button>
          {showHistory ? (
            <ul className="divide-y divide-[#f1f2f4] border-t border-[#f1f2f4] bg-[#fafbfc]">
              {history.map((item) => (
                <li key={`${item.name}-${item.doneAt ?? ""}`} className="flex items-center gap-3 px-5 py-3">
                  <CheckCircle2 className="size-4.5 shrink-0 text-[#16a34a]" strokeWidth={2.25} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-[#374151]">{item.name}</span>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-[#6b7280]">
                      {item.doneAt ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3.25" strokeWidth={2} /> Done {dateOf(item.doneAt)}
                        </span>
                      ) : null}
                      {item.addedAt ? <span>· Started {dateOf(item.addedAt)}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12.5px] text-[#6b7280] tabular-nums">
                    {dollars(item.price)}
                    {item.billing === "monthly" ? "/mo" : " once"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default MyServicesList;
