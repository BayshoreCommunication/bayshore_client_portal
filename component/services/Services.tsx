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
    <div className="service-cat-card">
      <div className="sc-header">
        <div className="sc-header-left" onClick={() => setOpen((value) => !value)} style={{ cursor: "pointer" }}>
          <div className="sd-icon" style={{ background: category.color }}>
            <Icon size={19} strokeWidth={2} />
          </div>
          <div>
            <div className="sd-title-row">
              <span className="sd-title">{category.title}</span>
              <span className="plan-pill">{category.plan}</span>
              <span className="expand-arrow" style={{ display: "inline-flex" }}>
                {open ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
              </span>
            </div>
            <div className="sd-desc">{category.description}</div>
          </div>
        </div>
        <div className="sc-header-right">
          <div className="sc-price">
            ${formatMoney(total)}
            <span className="sc-price-mo">/mo</span>
          </div>
        </div>
      </div>

      {open ? (
        <div className="sc-body">
          <div className="sc-service-list">
            {category.items.map((entry) => {
              const id = `${category.key}:${entry.name}`;
              const checked = selectedIds.has(id);
              const locked = isPurchased(id);

              return (
                <label className={`sc-check-item${checked ? " item-checked" : ""}`} key={id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={locked}
                    onChange={(event) =>
                      onToggle(
                        { id, category: category.key, name: entry.name, price: entry.price },
                        event.target.checked
                      )
                    }
                  />
                  <span className="chk-text">{entry.name}</span>
                  <span className="item-price">${entry.price}/mo</span>
                </label>
              );
            })}

            {customItems.map((item) => (
              <label className="sc-check-item item-checked new-item" key={item.id}>
                <input
                  type="checkbox"
                  checked
                  disabled={isPurchased(item.id)}
                  onChange={() => onRemoveCustom(item.id)}
                />
                <span className="chk-text">
                  {item.name}
                  {item.description ? <span className="item-desc"> — {item.description}</span> : null}
                  {item.timeline ? <span className="item-desc"> · Needed: {item.timeline}</span> : null}
                </span>
                <span className="item-price">+${item.price}/mo</span>
              </label>
            ))}
          </div>

          <button
            className="btn-request-service btn-request-service-below"
            onClick={() => setFormOpen((value) => !value)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Plus size={13} strokeWidth={2.5} /> Request New Service
          </button>

          {formOpen ? (
            <div className="sc-add-form">
              <input
                type="text"
                className="input-text"
                placeholder={category.customPlaceholder}
                value={name}
                style={nameMissing ? { borderColor: "#dc2626" } : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameMissing(false);
                }}
              />
              <textarea
                className="textarea-caption"
                style={{ height: 56, marginTop: 8 }}
                placeholder="Short description of what this includes..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <label className="field-label" style={{ fontWeight: 600, color: "#7a8e9b", fontSize: 11 }}>
                  Timeline
                </label>
                <select className="input-text" value={timeline} onChange={(event) => setTimeline(event.target.value)}>
                  {TIMELINES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="sc-form-actions">
                <button className="btn-draft" onClick={resetForm}>
                  Cancel
                </button>
                <button className="btn-save-client" onClick={submitCustom}>
                  Request Service · +${CUSTOM_REQUEST_PRICE}/mo
                </button>
              </div>
            </div>
          ) : null}

          {total > 0 ? (
            <div className="sd-footer">
              Your specialist: <b>{category.specialist}</b>
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
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <b>Services</b>
        </div>
      </div>

      <div>
        <div className="page-title">Your Services</div>
        <div className="page-desc">
          Click a category to see what&apos;s included, then check off exactly what you need — your price updates as
          you go.
        </div>
      </div>

      <div className="dash-metrics-grid">
        <div className="dash-metric-card" onClick={scrollToMyServices} style={{ cursor: "pointer" }}>
          <div className="dash-metric-lbl">MY SERVICES</div>
          <div className="dash-metric-val">{active.length}</div>
          <div className="dash-pending-sub">{countLabel}</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-lbl">MONTHLY INVESTMENT</div>
          <div className="dash-metric-val">${formatMoney(activeTotal)}</div>
          <div className="dash-pending-sub">
            {purchased.length === 0 ? "Nothing billed yet" : `$${formatMoney(activeTotal - pendingTotal)} billed monthly`}
          </div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-lbl">CLIENT SINCE</div>
          <div className="dash-metric-val" style={{ fontSize: 20 }}>
            Jan 2025
          </div>
          <div className="dash-pending-sub">Plan renews annually</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-lbl">NEXT RENEWAL</div>
          <div className="dash-metric-val" style={{ fontSize: 20 }}>
            {active.length === 0 ? "—" : "Jan 2027"}
          </div>
          <div className="dash-pending-sub">
            {active.length === 0 ? "Starts once a service is added" : "Renews on Jan 15"}
          </div>
        </div>
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "2.2fr 1fr" }}>
        <div className={`dash-side-col${highlight ? " services-highlight" : ""}`} ref={listRef}>
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
            <div className="cart-bar">
              <div>
                <div className="cart-bar-count">
                  {pending.length} service{pending.length === 1 ? "" : "s"} selected
                </div>
                <div className="cart-bar-total">Total: ${formatMoney(pendingTotal)}/mo</div>
              </div>
              <Link
                href="/payments"
                className="btn-proceed-payment"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                Proceed to Payment <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="dash-side-col">
          <div className="side-card">
            <div className="side-header">
              <div className="side-title">Contract Overview</div>
              <div className="side-sub">Your agreement with BayShore</div>
            </div>
            <div className="contract-row">
              <span>Client since</span>
              <b>Jan 15, 2025</b>
            </div>
            <div className="contract-row">
              <span>Current term</span>
              <b>12 months</b>
            </div>
            <div className="contract-row">
              <span>Next renewal</span>
              <b>Jan 15, 2027</b>
            </div>
            <div className="contract-row">
              <span>Billing cycle</span>
              <b>Monthly, on the 1st</b>
            </div>
          </div>

          <div className="side-card">
            <div className="side-title" style={{ marginBottom: 8 }}>
              How This Works
            </div>
            <div className="dash-pending-sub">
              Click any category to see what&apos;s included. Check the specific services you want — your monthly price
              updates instantly. Don&apos;t see what you need? Use{" "}
              <b style={{ color: "#17242f" }}>+ Request New Service</b> under any category.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Services;
