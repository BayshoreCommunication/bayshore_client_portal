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
import type { CatalogService, MyServicesData, ServicePlan } from "@/app/actions/service";
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

// ── The Services page ────────────────────────────────────────────────────────

// Everything BayShore offers in one list: the services this client takes (and what
// they pay each month), and the ones they could add. Sub-services they don't have
// yet can be ticked here; they're added once the payment page is confirmed
// (component/payments/Checkout.tsx). Taking something away goes through their
// account manager.
// `mine` / `catalog` are missing when they couldn't be loaded; the matching error says why.
const Services = ({
  mine,
  mineError,
  catalog,
  catalogError,
}: {
  mine?: MyServicesData;
  mineError?: string;
  catalog?: CatalogService[];
  catalogError?: string;
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

  const monthlyTotal = mine?.monthlyTotal ?? 0;

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

  const myCount = rows.filter((row) => row.included.length > 0).length;
  const includedCount = rows.reduce((sum, row) => sum + row.included.length, 0);
  const availableCount = rows.filter((row) => row.included.length === 0).length;

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
          The services you take from BayShore Communication, what you pay each month, and everything else we offer.
        </div>
      </div>

      {mine ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile icon={Layers} label="My Services" sub="Active on your account" value={String(myCount)} color="#2f5fd8" background="#d9e0ef" />
          <SummaryTile icon={CircleDollarSign} label="Monthly Payment" sub="For everything included" value={dollars(monthlyTotal)} color="#16a34a" background="#d2e7d8" />
          <SummaryTile icon={ListChecks} label="Sub-services" sub="Included across your services" value={String(includedCount)} color="#d97706" background="#f8e4c6" />
          <SummaryTile
            icon={Sparkles}
            label="Available to Add"
            sub="Services you don't take yet"
            value={catalog ? String(availableCount) : "—"}
            color="#7c3aed"
            background="#ece4fb"
          />
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

          <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-w-0 flex-col gap-3">
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
                                <tr className={`cursor-pointer ${open || ticked.length ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]"}`} onClick={toggle}>
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
                {mine.services.length === 0 ? (
                  <div className="py-1 text-[12px] leading-normal text-[#6b7280]">Nothing yet — tick a service in the list to add it.</div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {mine.services.map((entry) => (
                      <div key={entry._id}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                          <span className="flex min-w-0 items-center gap-2 font-medium text-[#1f2530]">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: serviceColorOf(entry.service) }} />
                            <span className="truncate" title={entry.service.title}>
                              {entry.service.title}
                            </span>
                          </span>
                          <span className="shrink-0 text-[#4b5260]">
                            <span className="font-semibold text-[#0b0c24]">{dollars(entry.monthlyPrice)}</span> ·{" "}
                            {monthlyTotal ? Math.round((entry.monthlyPrice / monthlyTotal) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${monthlyTotal ? (entry.monthlyPrice / monthlyTotal) * 100 : 0}%`, background: serviceColorOf(entry.service) }}
                          />
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
                  You can add services here any time — they start once the payment is confirmed. To remove one, or if you need something that isn&apos;t listed, message your account manager.
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
