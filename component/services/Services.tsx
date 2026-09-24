"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  CUSTOM_REQUEST_PRICE,
  TIMELINES,
  formatMoney,
  serviceCategories,
  type ServiceCategory,
  type ServiceCategoryKey,
} from "./data";
import { useServices, type ServiceItem } from "./store";

const CATEGORY_ICONS: Record<ServiceCategoryKey, LucideIcon> = {
  seo: Search,
  gmb: MapPin,
  social: MessageSquare,
  web: ShieldCheck,
};

const inputClass = "w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 text-[12.5px] text-[#17242f]";

const CategoryCard = ({
  category,
  items,
  isPurchased,
  onToggle,
  onRemoveCustom,
  onRequestCustom,
}: {
  category: ServiceCategory;
  items: ServiceItem[];
  isPurchased: (id: string) => boolean;
  onToggle: (item: ServiceItem, checked: boolean) => void;
  onRemoveCustom: (id: string) => void;
  onRequestCustom: (item: ServiceItem) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState(TIMELINES[0]);
  const [nameMissing, setNameMissing] = useState(false);

  const Icon = CATEGORY_ICONS[category.key];
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const customItems = items.filter((item) => item.custom);
  const selectedIds = new Set(items.map((item) => item.id));

  const resetForm = () => {
    setFormOpen(false);
    setName("");
    setDescription("");
    setTimeline(TIMELINES[0]);
    setNameMissing(false);
  };

  const submitCustom = () => {
    if (!name.trim()) {
      setNameMissing(true);
      return;
    }
    onRequestCustom({
      id: `custom:${category.key}:${Date.now()}`,
      category: category.key,
      name: name.trim(),
      price: CUSTOM_REQUEST_PRICE,
      custom: true,
      description: description.trim() || undefined,
      timeline,
    });
    resetForm();
  };

  return (
    <div className="rounded-[10px] border border-[#dbe3de] bg-white p-5">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex min-w-0 flex-1 cursor-pointer gap-3.5" onClick={() => setOpen((value) => !value)}>
          <div
            className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[10px] text-[17px] text-white"
            style={{ background: category.color }}
          >
            <Icon size={19} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[15px] font-bold text-[#0d1e2c]">{category.title}</span>
              <span className="rounded bg-[#f1f5f3] px-2.25 py-0.75 text-[10px] font-bold tracking-[0.4px] text-[#556977]">
                {category.plan}
              </span>
              <span className="ml-0.5 inline-flex text-[10px] text-[#9aacb8]">
                {open ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
              </span>
            </div>
            <div className="mt-1.5 text-[12.5px] leading-normal text-[#556977]">{category.description}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="shrink-0 text-[19px] font-bold whitespace-nowrap text-[#0d1e2c]">
            ${formatMoney(total)}
            <span className="ml-0.5 text-[11px] font-semibold text-[#8496a3]">/mo</span>
          </div>
        </div>
      </div>

      {open ? (
        <div className="mt-1">
          <div className="mt-3.5 flex flex-col gap-2">
            {category.items.map((entry) => {
              const id = `${category.key}:${entry.name}`;
              const checked = selectedIds.has(id);
              const locked = isPurchased(id);

              return (
                <label
                  className="flex cursor-pointer items-center gap-2.5 border-b border-[#f4f7f5] px-1 py-2.5 text-[12.5px] last:border-b-0"
                  key={id}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[#2563eb]"
                    checked={checked}
                    disabled={locked}
                    onChange={(event) =>
                      onToggle(
                        { id, category: category.key, name: entry.name, price: entry.price },
                        event.target.checked
                      )
                    }
                  />
                  <span className={`flex-1 ${checked ? "font-semibold text-[#2563eb]" : "font-medium text-[#384955]"}`}>
                    {entry.name}
                  </span>
                  <span className={`text-[11.5px] font-bold whitespace-nowrap ${checked ? "text-[#17242f]" : "text-[#8496a3]"}`}>
                    ${entry.price}/mo
                  </span>
                </label>
              );
            })}

            {customItems.map((item) => (
              <label
                className="flex animate-[sc-fade-in_0.4s_ease] cursor-pointer items-center gap-2.5 border-b border-[#f4f7f5] px-1 py-2.5 text-[12.5px] last:border-b-0"
                key={item.id}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[#2563eb]"
                  checked
                  disabled={isPurchased(item.id)}
                  onChange={() => onRemoveCustom(item.id)}
                />
                <span className="flex-1 font-semibold text-[#2563eb]">
                  {item.name}
                  {item.description ? <span className="text-[11px] font-normal text-[#9aacb8]"> — {item.description}</span> : null}
                  {item.timeline ? <span className="text-[11px] font-normal text-[#9aacb8]"> · Needed: {item.timeline}</span> : null}
                </span>
                <span className="text-[11.5px] font-bold whitespace-nowrap text-[#17242f]">+${item.price}/mo</span>
              </label>
            ))}
          </div>

          <button
            className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[#93c5fd] bg-white px-3 py-2.5 text-[11px] font-bold whitespace-nowrap text-[#2563eb] hover:bg-[#eff6ff]"
            onClick={() => setFormOpen((value) => !value)}
          >
            <Plus size={13} strokeWidth={2.5} /> Request New Service
          </button>

          {formOpen ? (
            <div className="mt-3.5 rounded-lg border border-[#eef3ef] bg-[#f7f9f8] p-3.5">
              <input
                type="text"
                className={`${inputClass} ${nameMissing ? "border-[#dc2626]" : ""}`}
                placeholder={category.customPlaceholder}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameMissing(false);
                }}
              />
              <textarea
                className="mt-2 h-14 w-full resize-none rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 font-[inherit] text-xs text-[#1a252c]"
                placeholder="Short description of what this includes..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <div className="mt-2">
                <label className="mb-1.25 block text-[11px] font-semibold text-[#7a8e9b]">Timeline</label>
                <select className={inputClass} value={timeline} onChange={(event) => setTimeline(event.target.value)}>
                  {TIMELINES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2.5 flex justify-end gap-2">
                <button
                  className="cursor-pointer rounded-md border border-[#cfdcd6] bg-white px-4.5 py-2.25 text-[13px] font-semibold text-[#273847]"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white"
                  onClick={submitCustom}
                >
                  Request Service · +${CUSTOM_REQUEST_PRICE}/mo
                </button>
              </div>
            </div>
          ) : null}

          {total > 0 ? (
            <div className="mt-3.5 border-t border-[#eef3ef] pt-3 text-[11.5px] text-[#7a8e9b]">
              Your specialist: <b className="text-[#17242f]">{category.specialist}</b>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const Services = () => {
  const { pending, purchased, addPending, removePending } = useServices();
  const listRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  const active = [...purchased, ...pending];
  const activeTotal = active.reduce((sum, item) => sum + item.price, 0);
  const pendingTotal = pending.reduce((sum, item) => sum + item.price, 0);
  const purchasedIds = new Set(purchased.map((item) => item.id));

  const scrollToMyServices = () => {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlight(true);
    window.setTimeout(() => setHighlight(false), 1200);
  };

  const countLabel =
    active.length === 0 ? "No services yet" : `${active.length} service${active.length === 1 ? "" : "s"} selected`;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <b className="text-[#18232c]">Services</b>
        </div>
      </div>

      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Your Services</div>
        <div className="mt-1 text-[13px] text-[#657787]">
          Click a category to see what&apos;s included, then check off exactly what you need — your price updates as you go.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="cursor-pointer rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5" onClick={scrollToMyServices}>
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]">MY SERVICES</div>
          <div className="mb-2 text-[30px] font-bold text-[#0d1e2c]">{active.length}</div>
          <div className="text-[11px] text-[#7a8e9b]">{countLabel}</div>
        </div>
        <div className="rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5">
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]">MONTHLY INVESTMENT</div>
          <div className="mb-2 text-[30px] font-bold text-[#0d1e2c]">${formatMoney(activeTotal)}</div>
          <div className="text-[11px] text-[#7a8e9b]">
            {purchased.length === 0 ? "Nothing billed yet" : `$${formatMoney(activeTotal - pendingTotal)} billed monthly`}
          </div>
        </div>
        <div className="rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5">
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]">CLIENT SINCE</div>
          <div className="mb-2 text-xl font-bold text-[#0d1e2c]">Jan 2025</div>
          <div className="text-[11px] text-[#7a8e9b]">Plan renews annually</div>
        </div>
        <div className="rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5">
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]">NEXT RENEWAL</div>
          <div className="mb-2 text-xl font-bold text-[#0d1e2c]">{active.length === 0 ? "—" : "Jan 2027"}</div>
          <div className="text-[11px] text-[#7a8e9b]">
            {active.length === 0 ? "Starts once a service is added" : "Renews on Jan 15"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[2.2fr_1fr] items-start gap-5">
        <div className={`flex flex-col gap-4 ${highlight ? "animate-[services-pulse_1.2s_ease]" : ""}`} ref={listRef}>
          {serviceCategories.map((category) => (
            <CategoryCard
              key={category.key}
              category={category}
              items={active.filter((item) => item.category === category.key)}
              isPurchased={(id) => purchasedIds.has(id)}
              onToggle={(item, checked) => (checked ? addPending(item) : removePending(item.id))}
              onRemoveCustom={removePending}
              onRequestCustom={addPending}
            />
          ))}

          {pending.length > 0 ? (
            <div className="sticky bottom-3 mt-1 flex items-center justify-between rounded-[10px] bg-[#0d1e2e] px-5 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <div>
                <div className="text-[13px] font-bold text-white">
                  {pending.length} service{pending.length === 1 ? "" : "s"} selected
                </div>
                <div className="mt-0.5 text-[11.5px] text-[#9cb0c3]">Total: ${formatMoney(pendingTotal)}/mo</div>
              </div>
              <Link
                href="/payments"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap text-white no-underline"
              >
                Proceed to Payment <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-3.5">
              <div className="text-sm font-bold text-[#0d1e2c]">Contract Overview</div>
              <div className="mt-0.5 text-[11px] text-[#728492]">Your agreement with BayShore</div>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="text-[#7a8e9b]">Client since</span>
              <b className="text-[#17242f]">Jan 15, 2025</b>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="text-[#7a8e9b]">Current term</span>
              <b className="text-[#17242f]">12 months</b>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="text-[#7a8e9b]">Next renewal</span>
              <b className="text-[#17242f]">Jan 15, 2027</b>
            </div>
            <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0">
              <span className="text-[#7a8e9b]">Billing cycle</span>
              <b className="text-[#17242f]">Monthly, on the 1st</b>
            </div>
          </div>

          <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
            <div className="mb-2 text-sm font-bold text-[#0d1e2c]">How This Works</div>
            <div className="text-[11px] text-[#7a8e9b]">
              Click any category to see what&apos;s included. Check the specific services you want — your monthly price
              updates instantly. Don&apos;t see what you need? Use{" "}
              <b className="text-[#17242f]">+ Request New Service</b> under any category.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Services;
