"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Layers,
  ListChecks,
  MessageCircle,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import type { CatalogService, MyService, MyServicePlan, MyServicesData, ServicePlan } from "@/app/actions/service";
import { poppins } from "@/component/shared/fonts";
import { useServiceCart, type ServiceCart } from "./cart";
import { SERVICE_PLANS, SERVICE_PLAN_KEYS, dollars, plural, serviceColorOf, serviceIconOf } from "./serviceUi";
import TriCheckbox from "./TriCheckbox";

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const darkButtonClass =
  "flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]";
const errorBannerClass = "rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]";

type Show = "all" | "mine" | "available";
// A row of the table: a service on offer, and the sub-services (by id) the client already takes.
type Row = { service: CatalogService; included: string[] };

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="relative w-full sm:w-44">
    <select
      // A chosen filter gets a darker border so it's clear the list is narrowed.
      className={`${inputClass} ${value === "all" ? "border-[#e2e5e9]" : "border-[#0b0c24]"}`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
  </div>
);

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: string;
  color: string;
  background: string;
}) => (
  <div className={`${cardClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background, color }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{sub}</div>
      </div>
    </div>
    <div className="mt-3 text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
  </div>
);

// The head of one of the page's two parts: its name, a line about it, and a figure beside them.
const SectionHead = ({ title, sub, aside }: { title: string; sub: string; aside?: React.ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1.5">
    <div>
      <h2 className="text-[17px] leading-tight font-semibold text-[#0b0c24]">{title}</h2>
      <p className="mt-0.5 text-[12px] text-[#6b7280]">{sub}</p>
    </div>
    {aside ? <div className="text-[12px] text-[#4b5260]">{aside}</div> : null}
  </div>
);

// One service the client takes: what it is, what of it they have, and what it costs a month.
// `more` is how many of its sub-services they could still add; `onMore` shows them where.
const MyServiceCard = ({ entry, icon: Icon, more, onMore }: { entry: MyService; icon: LucideIcon; more: number; onMore: () => void }) => (
  <div className={`${cardClass} flex flex-col p-4.5`}>
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(entry.service) }}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[#0b0c24]" title={entry.service.title}>
          {entry.service.title}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d6eadb] px-2 py-0.5 text-[11px] font-medium text-[#15803d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            Active
          </span>
          <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#4b5260]">{SERVICE_PLANS[entry.service.plan] ?? entry.service.plan}</span>
        </div>
      </div>
      <div className="shrink-0 text-right whitespace-nowrap">
        <span className="text-[17px] font-semibold text-[#0b0c24]">{dollars(entry.monthlyPrice)}</span>
        <span className="text-[11px] text-[#6b7280]">/mo</span>
      </div>
    </div>
    {entry.service.description ? <p className="mt-3 line-clamp-2 text-[12px] leading-normal text-[#4b5563]">{entry.service.description}</p> : null}
    <div className="mt-3.5 border-t border-[#eef0f2] pt-3">
      <div className="mb-2 text-[11px] font-medium text-[#6b7280]">What we do for you · {plural(entry.subServices.length, "sub-service")}</div>
      <ul className="flex list-none flex-col gap-1.5">
        {entry.subServices.map((item) => (
          <li key={item.subService} className="flex items-center gap-2 text-[12px]">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
              <Check size={11} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1 text-[#1f2530]">{item.name}</span>
            <span className="shrink-0 text-[#6b7280]">{dollars(item.price)}/mo</span>
          </li>
        ))}
      </ul>
    </div>
    {more > 0 ? (
      <button type="button" className="mt-3.5 flex cursor-pointer items-center gap-1 self-start text-[12px] font-medium text-[#2f5fd8] hover:underline" onClick={onMore}>
        <Plus size={13} strokeWidth={2.5} /> {plural(more, "more sub-service")} you can add
      </button>
    ) : null}
  </div>
);

// A service the client's team set up for them on their record: what it is, its quantities and
// prices, what it covers, and what it costs a month — as their client page in the company portal
// shows it. A field with a price or a fee in its name is in dollars.
const PLAN_COLOR = "#2f5fd8";
const PlanCard = ({ plan }: { plan: MyServicePlan }) => (
  <div className={`${cardClass} flex flex-col p-4.5`}>
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: PLAN_COLOR }}>
        <Layers size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[#0b0c24]" title={plan.name}>
          {plan.name}
        </div>
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d6eadb] px-2 py-0.5 text-[11px] font-medium text-[#15803d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            Active
          </span>
        </div>
      </div>
      {/* A service on the record that was never priced there has no price to show yet. */}
      {plan.monthly || plan.fields.length ? (
        <div className="shrink-0 text-right whitespace-nowrap">
          <span className="text-[17px] font-semibold text-[#0b0c24]">{dollars(plan.monthly)}</span>
          <span className="text-[11px] text-[#6b7280]">/mo</span>
        </div>
      ) : (
        <span className="shrink-0 text-[11.5px] text-[#6b7280]">Price being set up</span>
      )}
    </div>
    {plan.fields.length ? (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {plan.fields.map((field) => (
          <span key={field.label} className="rounded-md bg-[#f3f4f6] px-2 py-1 text-[11px] text-[#4b5260]">
            {field.label}: <b className="font-semibold text-[#0b0c24]">{/price|fee/i.test(field.label) ? dollars(field.value) : field.value}</b>
          </span>
        ))}
      </div>
    ) : null}
    {plan.included.length ? (
      <div className="mt-3.5 border-t border-[#eef0f2] pt-3">
        <div className="mb-2 text-[11px] font-medium text-[#6b7280]">What we do for you · {plural(plan.included.length, "item")}</div>
        <ul className="flex list-none flex-col gap-1.5">
          {plan.included.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12px]">
              <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
                <Check size={11} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 text-[#1f2530]">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

// A service BayShore offers that the client doesn't take: what it is, what is in it, and what
// it costs a month. Only to read — there is nothing on it to tick.
const OfferCard = ({ service, icon: Icon }: { service: CatalogService; icon: LucideIcon }) => (
  <div className={`${cardClass} flex flex-col p-4.5`}>
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(service) }}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[#0b0c24]" title={service.title}>
          {service.title}
        </div>
        <div className="mt-1.5">
          <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-medium text-[#4b5260]">{SERVICE_PLANS[service.plan] ?? service.plan}</span>
        </div>
      </div>
      <div className="shrink-0 text-right whitespace-nowrap">
        <span className="text-[17px] font-semibold text-[#0b0c24]">{dollars(service.monthlyPrice)}</span>
        <span className="text-[11px] text-[#6b7280]">/mo</span>
      </div>
    </div>
    {service.description ? <p className="mt-3 line-clamp-2 text-[12px] leading-normal text-[#4b5563]">{service.description}</p> : null}
    {service.subServices.length ? (
      <div className="mt-3.5 border-t border-[#eef0f2] pt-3">
        <div className="mb-2 text-[11px] font-medium text-[#6b7280]">What&apos;s in it · {plural(service.subServices.length, "sub-service")}</div>
        <ul className="flex list-none flex-col gap-1.5">
          {service.subServices.map((item) => (
            <li key={item._id} className="flex items-center gap-2 text-[12px]">
              <span className="mx-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: serviceColorOf(service) }} />
              <span className="min-w-0 flex-1 text-[#1f2530]">{item.name}</span>
              <span className="shrink-0 text-[#6b7280]">{dollars(item.price)}/mo</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

// ── The Services page ────────────────────────────────────────────────────────

// In two parts. "Your Services": what BayShore does for this client, a card to each service,
// with what of it they have and what it costs a month. "All Our Services": everything BayShore
// offers in one list — theirs among them — where sub-services they don't have yet can be
// ticked; they're added once the payment page is confirmed (component/payments/Checkout.tsx).
// Taking something away goes through their account manager.
//
// That list to tick from is only there with `browse`. Without it — as the page is now — the
// second part is only to read: a card to each service the client doesn't take (theirs are
// above, and aren't repeated), with nothing to select. Adding one goes through their account
// manager too.
// `mine` / `catalog` are missing when they couldn't be loaded; the matching error says why.
const Services = ({
  mine,
  mineError,
  catalog,
  catalogError,
  browse = false,
}: {
  mine?: MyServicesData;
  mineError?: string;
  catalog?: CatalogService[];
  catalogError?: string;
  browse?: boolean;
}) => {
  const [show, setShow] = useState<Show>("all");
  const [plan, setPlan] = useState<ServicePlan | "all">("all");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  // What's ticked to add (never sub-services already taken). Kept in the cart so the
  // payment page gets it.
  const { cart: picks, setCart: setPicks } = useServiceCart();
  const [confirming, setConfirming] = useState(false);

  // The services on the client's record (see PlanCard), beside the catalog ones they take.
  const plans = mine?.plans ?? [];
  const unpriced = mine?.unpriced ?? [];
  const monthlyTotal = (mine?.monthlyTotal ?? 0) + (mine?.planTotal ?? 0);
  const serviceCount = (mine?.services.length ?? 0) + plans.length + unpriced.length;
  // Each thing paid for each month, for "Where Your Payment Goes".
  const payments = [
    ...plans.map((plan) => ({ key: `plan-${plan.name}`, name: plan.name, amount: plan.monthly, color: PLAN_COLOR })),
    ...(mine?.services ?? []).map((entry) => ({ key: entry._id, name: entry.service.title, amount: entry.monthlyPrice, color: serviceColorOf(entry.service) })),
  ];

  // Every service on offer with what the client has of it. Without the catalog,
  // only their own services can be listed (with just the sub-services they take).
  const rows: Row[] = useMemo(() => {
    const taken = new Map((mine?.services ?? []).map((entry) => [entry.service._id, entry]));
    if (catalog) {
      return catalog.map((service) => ({ service, included: taken.get(service._id)?.subServices.map((item) => item.subService) ?? [] }));
    }
    return (mine?.services ?? []).map((entry) => ({
      service: {
        ...entry.service,
        subServices: entry.subServices.map((item) => ({ _id: item.subService, name: item.name, price: item.price })),
        monthlyPrice: entry.monthlyPrice,
      },
      included: entry.subServices.map((item) => item.subService),
    }));
  }, [mine, catalog]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(
      ({ service, included }) =>
        (show === "all" || (show === "mine" ? included.length > 0 : included.length < service.subServices.length)) &&
        (plan === "all" || service.plan === plan) &&
        // Search looks inside the services too, so "backlink" finds SEO.
        (!needle || [service.title, service.description ?? "", ...service.subServices.map((item) => item.name)].join(" ").toLowerCase().includes(needle)),
    );
  }, [rows, show, plan, query]);

  const priceOf = (service: CatalogService, ids: string[]) =>
    service.subServices.reduce((sum, item) => (ids.includes(item._id) ? sum + item.price : sum), 0);

  // What's ticked that can still be added — a kept cart may name something the
  // client has since been given, or that is no longer offered.
  const tickedOf = ({ service, included }: Row) =>
    (picks[service._id] ?? []).filter((id) => !included.includes(id) && service.subServices.some((item) => item._id === id));
  const picked = rows.filter((row) => tickedOf(row).length);
  const pickedCount = picked.reduce((sum, row) => sum + tickedOf(row).length, 0);
  const pickedTotal = picked.reduce((sum, row) => sum + priceOf(row.service, tickedOf(row)), 0);

  const myCount = rows.filter((row) => row.included.length > 0).length + plans.length + unpriced.length;
  const includedCount = rows.reduce((sum, row) => sum + row.included.length, 0) + plans.reduce((sum, plan) => sum + plan.included.length, 0);
  // What is on offer that the client has none of.
  const others = rows.filter((row) => row.included.length === 0);
  const availableCount = others.length;

  const hasFilters = show !== "all" || plan !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setShow("all");
    setPlan("all");
    setQuery("");
  };

  const change = (update: (previous: ServiceCart) => ServiceCart) => {
    setPicks(update);
    setConfirming(false);
  };

  // The row's checkbox: every sub-service the client doesn't have yet, or none.
  const toggleService = ({ service, included }: Row) => {
    const rest = service.subServices.filter((item) => !included.includes(item._id)).map((item) => item._id);
    change((previous) => {
      const next = { ...previous };
      if (next[service._id]?.length === rest.length) delete next[service._id];
      else next[service._id] = rest;
      return next;
    });
    setOpenId(service._id);
  };

  const showInList = (serviceId: string) => {
    clearFilters();
    setOpenId(serviceId);
    requestAnimationFrame(() => document.getElementById(`service-${serviceId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const toggleItem = (serviceId: string, id: string) =>
    change((previous) => {
      const current = previous[serviceId] ?? [];
      const items = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
      const next = { ...previous };
      if (items.length) next[serviceId] = items;
      else delete next[serviceId];
      return next;
    });

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Services</div>
        <div className="mt-1 text-[12.5px] text-[#4b5563]">
          {browse
            ? "The services you take from BayShore Communication, what you pay each month, and everything else we offer."
            : "The services BayShore Communication provides for you, and what you pay each month."}
        </div>
      </div>

      {mine ? (
        <div className={`grid grid-cols-1 gap-4 ${browse ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
          <SummaryTile icon={Layers} label="My Services" sub="Active on your account" value={String(myCount)} color="#2f5fd8" background="#d9e0ef" />
          <SummaryTile icon={CircleDollarSign} label="Monthly Payment" sub="For everything included" value={dollars(monthlyTotal)} color="#16a34a" background="#d2e7d8" />
          <SummaryTile icon={ListChecks} label="Sub-services" sub="Included across your services" value={String(includedCount)} color="#d97706" background="#f8e4c6" />
          {browse ? (
            <SummaryTile
              icon={Sparkles}
              label="Available to Add"
              sub="Services you don't take yet"
              value={catalog ? String(availableCount) : "—"}
              color="#7c3aed"
              background="#ece4fb"
            />
          ) : null}
        </div>
      ) : (
        <div role="alert" className={errorBannerClass}>
          {mineError ?? "Could not load your services."} Please refresh the page to try again.
        </div>
      )}

      {mine && !catalog ? (
        <div role="alert" className={errorBannerClass}>
          {catalogError ?? "Could not load the other services on offer."} Your own services are shown below; refresh the page to see the rest.
        </div>
      ) : null}

      {mine ? (
        <>
          {/* The client's own services, then everything on offer; what they pay, beside both. */}
          <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-w-0 flex-col gap-3">
              <SectionHead
                title="Your Services"
                sub="What BayShore Communication is doing for you right now."
                aside={
                  serviceCount ? (
                    <>
                      {plural(serviceCount, "service")} · <span className="font-semibold text-[#0b0c24]">{dollars(monthlyTotal)}</span> a month
                    </>
                  ) : null
                }
              />
              {serviceCount === 0 ? (
                <div className={`${cardClass} flex flex-col items-center px-5 py-9 text-center`}>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                    <Layers size={22} strokeWidth={1.8} />
                  </div>
                  <div className="text-[15px] font-semibold text-[#0b0c24]">No services on your account yet</div>
                  <div className="mt-1.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                    Once your BayShore team sets up your services they&apos;ll show here.{browse ? " You can also pick from everything we offer below." : ""}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-2">
                  {plans.map((plan) => (
                    <PlanCard key={plan.name} plan={plan} />
                  ))}
                  {mine.services.map((entry) => {
                    const row = rows.find(({ service }) => service._id === entry.service._id);
                    return <MyServiceCard key={entry._id} entry={entry} icon={serviceIconOf(entry.service)} more={browse && row ? row.service.subServices.length - row.included.length : 0} onMore={() => showInList(entry.service._id)} />;
                  })}
                  {/* On the record, but not priced there yet. */}
                  {unpriced.map((name) => (
                    <PlanCard key={`unpriced-${name}`} plan={{ name, fields: [], monthly: 0, included: [] }} />
                  ))}
                </div>
              )}

              {browse ? null : catalog ? (
                <>
                  <div className="mt-3.5">
                    <SectionHead
                      title="All Our Services"
                      sub="Everything else BayShore Communication offers. To add one, message your account manager."
                      aside={others.length ? plural(others.length, "service") : null}
                    />
                  </div>
                  {others.length === 0 ? (
                    <div className={`${cardClass} px-5 py-6 text-center text-[12.5px] text-[#4b5563]`}>You already have every service we offer.</div>
                  ) : (
                    <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-2">
                      {others.map(({ service }) => (
                        <OfferCard key={service._id} service={service} icon={serviceIconOf(service)} />
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {browse ? (
                <>
                  <div className="mt-3.5">
                    <SectionHead
                      title="All Our Services"
                      sub="Everything BayShore Communication offers. Open a service to see what's in it, and tick anything you'd like to add."
                      aside={catalog ? plural(rows.length, "service") : null}
                    />
                  </div>
                <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
                  <SelectBox label="Show" value={show} onChange={(value) => setShow(value as Show)}>
                    <option value="all">All Services</option>
                    <option value="mine">My Services</option>
                    <option value="available">Available to Add</option>
                  </SelectBox>
                  <SelectBox label="Plan" value={plan} onChange={(value) => setPlan(value as ServicePlan | "all")}>
                    <option value="all">All Plans</option>
                    {SERVICE_PLAN_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {SERVICE_PLANS[key]}
                      </option>
                    ))}
                  </SelectBox>
                  {hasFilters ? (
                    <button
                      type="button"
                      className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#0b0c24]"
                      onClick={clearFilters}
                    >
                      <RotateCcw size={13} strokeWidth={2} /> Clear
                    </button>
                  ) : null}
                  <div
                    className="flex h-9.5 w-full items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af] xl:ml-auto xl:max-w-80"
                    role="search"
                  >
                    <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
                    <input
                      type="search"
                      placeholder="Search services or what's included..."
                      aria-label="Search services"
                      autoComplete="off"
                      className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280] [&::-webkit-search-cancel-button]:hidden"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    {query ? (
                      <button type="button" className="inline-flex cursor-pointer text-[#6b7280] hover:text-[#0b0c24]" aria-label="Clear search" onClick={() => setQuery("")}>
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </div>
                </div>
                  <div className={`${cardClass} p-3.5`}>
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center px-5 py-11 text-center">
                        <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                          {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Layers size={24} strokeWidth={1.8} />}
                        </div>
                        <div className="text-lg font-semibold text-[#0b0c24]">{hasFilters ? "No services match these filters" : "No services yet"}</div>
                        <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                          {hasFilters
                            ? "Try a different view, plan or search."
                            : "The services BayShore Communication offers will appear here. Message your account manager to get started."}
                        </div>
                        {hasFilters ? (
                          <button type="button" className={`${darkButtonClass} px-4.5 py-2.25`} onClick={clearFilters}>
                            <RotateCcw size={13} strokeWidth={2} /> Clear filters
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-0">
                            <thead>
                              <tr>
                                <th className={`${thClass} w-10 rounded-l-lg`}>
                                  <span className="sr-only">Add</span>
                                </th>
                                <th className={thClass}>Service</th>
                                <th className={thClass}>Plan</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} text-right`}>Monthly</th>
                                <th className={`${thClass} w-12 rounded-r-lg`}>
                                  <span className="sr-only">Details</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((row) => {
                                const { service, included } = row;
                                const Icon = serviceIconOf(service);
                                const open = openId === service._id;
                                const toggle = () => setOpenId(open ? null : service._id);
                                const ticked = tickedOf(row);
                                const remaining = service.subServices.length - included.length;
                                const active = included.length > 0;

                                return (
                                  <Fragment key={service._id}>
                                    {/* The whole row opens the service; the chevron is the keyboard way in. */}
                                    <tr id={`service-${service._id}`} className={`cursor-pointer ${open || ticked.length ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]"}`} onClick={toggle}>
                                      {/* Clicks on the checkbox tick it; they don't open the row. */}
                                      <td className={tdClass} onClick={(event) => event.stopPropagation()}>
                                        {remaining > 0 ? (
                                          <TriCheckbox
                                            className="block"
                                            label={active ? `Add the rest of ${service.title}` : `Add ${service.title} with all its sub-services`}
                                            checked={ticked.length === remaining}
                                            partial={ticked.length > 0}
                                            onChange={() => toggleService(row)}
                                          />
                                        ) : (
                                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]" title="You have all of this service">
                                            <Check size={11} strokeWidth={3} />
                                          </span>
                                        )}
                                      </td>
                                      <td className={tdClass}>
                                        <div className="flex items-center gap-3">
                                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(service) }}>
                                            <Icon size={16} strokeWidth={2} />
                                          </span>
                                          <span className="min-w-0">
                                            <span className="block max-w-72 truncate font-medium text-[#1f2530]" title={service.title}>
                                              {service.title}
                                            </span>
                                            {service.description ? (
                                              <span className="mt-0.5 block max-w-72 truncate text-[11px] text-[#6b7280]" title={service.description}>
                                                {service.description}
                                              </span>
                                            ) : null}
                                          </span>
                                        </div>
                                      </td>
                                      <td className={tdClass}>
                                        <span className="inline-block rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-medium text-[#4b5260]">
                                          {SERVICE_PLANS[service.plan] ?? service.plan}
                                        </span>
                                      </td>
                                      <td className={tdClass}>
                                        {active ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d6eadb] px-2.5 py-1 text-[11px] font-medium text-[#15803d]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                                            Active · {included.length} of {service.subServices.length}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e8ecf1] px-2.5 py-1 text-[11px] font-medium text-[#475569]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#64748b]" />
                                            Not added
                                          </span>
                                        )}
                                        {ticked.length ? <span className="ml-2 text-[11px] font-medium text-[#2f5fd8]">+{ticked.length} to add</span> : null}
                                      </td>
                                      <td className={`${tdClass} text-right`}>
                                        <span className={`text-[13.5px] font-semibold ${active ? "text-[#0b0c24]" : "text-[#6b7280]"}`}>
                                          {dollars(active ? priceOf(service, included) : service.monthlyPrice)}
                                        </span>
                                        <span className="text-[11px] text-[#6b7280]">/mo</span>
                                      </td>
                                      <td className={`${tdClass} text-right`}>
                                        <button
                                          type="button"
                                          className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] hover:bg-[#eef0f2] hover:text-[#0b0c24]"
                                          aria-expanded={open}
                                          aria-label={`${open ? "Hide" : "Show"} what's in ${service.title}`}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            toggle();
                                          }}
                                        >
                                          <ChevronDown size={16} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                                        </button>
                                      </td>
                                    </tr>
                                    {open ? (
                                      <tr>
                                        <td colSpan={6} className="border-b border-[#eef0f2] bg-[#f9fafb] px-3 pt-1 pb-3.5">
                                          <div className="rounded-xl bg-[#f6f7f9] p-4 whitespace-normal">
                                            <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                                              <div className="text-[11px] text-[#6b7280]">What&apos;s in this service</div>
                                              <div className="text-[11px] text-[#6b7280]">
                                                {active ? `You have ${included.length} of ${service.subServices.length}` : plural(service.subServices.length, "sub-service")}
                                                {remaining > 0 && catalog ? " · tick one to add it" : ""}
                                              </div>
                                            </div>
                                            <ul className="grid list-none grid-cols-1 gap-2 md:grid-cols-2">
                                              {service.subServices.map((item) => {
                                                const have = included.includes(item._id);
                                                const on = ticked.includes(item._id);

                                                return have ? (
                                                  <li key={item._id} className="flex items-center gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2 text-[12px]">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
                                                      <Check size={12} strokeWidth={2.75} />
                                                    </span>
                                                    <span className="min-w-0 flex-1 text-[#1f2530]">{item.name}</span>
                                                    <span className="shrink-0 font-medium text-[#4b5260]">{dollars(item.price)}/mo</span>
                                                  </li>
                                                ) : (
                                                  <li key={item._id}>
                                                    <label
                                                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] ${
                                                        on ? "border-[#0b0c24] bg-white" : "border-dashed border-[#d5d9df] bg-transparent hover:bg-white"
                                                      }`}
                                                    >
                                                      <TriCheckbox className="mx-0.5" label={`Add ${item.name}`} checked={on} onChange={() => toggleItem(service._id, item._id)} />
                                                      <span className={`min-w-0 flex-1 ${on ? "text-[#1f2530]" : "text-[#4b5260]"}`}>{item.name}</span>
                                                      <span className={`shrink-0 font-medium ${on ? "text-[#1f2530]" : "text-[#6b7280]"}`}>+{dollars(item.price)}/mo</span>
                                                    </label>
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          </div>
                                        </td>
                                      </tr>
                                    ) : null}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[#1f2530]">
                          <span>
                            Showing {filtered.length} of {plural(rows.length, "service")}
                          </span>
                          <span>
                            Your monthly payment <span className="font-semibold text-[#0b0c24]">{dollars(monthlyTotal)}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stays in view while there is something ticked, so the total and the button are never off screen. */}
                  {pickedCount > 0 ? (
                    <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0b0c24] px-5 py-3.5 shadow-[0_10px_28px_rgba(11,12,36,0.28)]">
                      {confirming ? (
                        <>
                          <div className="text-white">
                            <div className="text-[13px] font-semibold">
                              Your monthly payment will go from {dollars(monthlyTotal)} to {dollars(monthlyTotal + pickedTotal)}.
                            </div>
                            <div className="mt-0.5 text-[11.5px] text-[#b4bacb]">
                              {plural(pickedCount, "sub-service")} · +{dollars(pickedTotal)}/mo. They&apos;re added once the payment is confirmed.
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              className="flex h-9.5 cursor-pointer items-center rounded-lg border border-[#3a3d5c] px-4 text-[12.5px] font-medium text-white hover:bg-[#1e2140]"
                              onClick={() => setConfirming(false)}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-4.5 text-[12.5px] font-semibold text-[#0b0c24] hover:bg-[#eef0f2]"
                              onClick={() => router.push("/payments")}
                            >
                              Continue to Payment <ArrowRight size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-white">
                            <div className="text-[13px] font-semibold">
                              {plural(pickedCount, "sub-service")} selected{picked.length > 1 ? ` across ${picked.length} services` : ""}
                            </div>
                            <div className="mt-0.5 text-[11.5px] text-[#b4bacb]">+{dollars(pickedTotal)}/mo on top of what you pay now</div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              className="flex h-9.5 cursor-pointer items-center rounded-lg px-3 text-[12.5px] font-medium text-[#b4bacb] hover:text-white"
                              onClick={() => change(() => ({}))}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-4.5 text-[12.5px] font-semibold text-[#0b0c24] hover:bg-[#eef0f2]"
                              onClick={() => setConfirming(true)}
                            >
                              <Plus size={14} strokeWidth={2.5} /> Add to My Services
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="flex flex-col gap-4.5">
              <div className={`${cardClass} p-4.5`}>
                <div className="mb-3.5 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
                    <PieChart size={17} strokeWidth={2} />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold text-[#0b0c24]">Where Your Payment Goes</div>
                    <div className="mt-0.5 text-[11px] text-[#6b7280]">{dollars(monthlyTotal)} a month</div>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <div className="py-1 text-[12px] leading-normal text-[#6b7280]">{browse ? "Nothing yet — tick a service in the list to add it." : "Nothing yet — your services will show here once they are set up."}</div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {payments.map((entry) => (
                      <div key={entry.key}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                          <span className="flex min-w-0 items-center gap-2 font-medium text-[#1f2530]">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                            <span className="truncate" title={entry.name}>
                              {entry.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-[#4b5260]">
                            <span className="font-semibold text-[#0b0c24]">{dollars(entry.amount)}</span> · {monthlyTotal ? Math.round((entry.amount / monthlyTotal) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                          <div className="h-full rounded-full" style={{ width: `${monthlyTotal ? (entry.amount / monthlyTotal) * 100 : 0}%`, background: entry.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${cardClass} p-4.5`}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#0b0c24]">
                    <MessageCircle size={17} strokeWidth={2} />
                  </span>
                  <div className="text-[13px] font-semibold text-[#0b0c24]">Need to change something?</div>
                </div>
                <div className="text-[12px] leading-normal text-[#4b5563]">
                  {browse
                    ? "You can add services here any time — they start once the payment is confirmed. To remove one, or if you need something that isn\u2019t listed, message your account manager."
                    : "To add a service, remove one, or ask about anything else we offer, message your account manager."}
                </div>
                <Link href="/messages" className={`${darkButtonClass} mt-3.5 justify-center px-4 py-2.25`}>
                  <MessageCircle size={14} strokeWidth={2} /> Send a Message
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Services;
