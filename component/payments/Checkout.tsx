"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Lock, ShoppingCart } from "lucide-react";
import { categoryTitle, formatMoney } from "@/component/services/data";
import { useServices } from "@/component/services/store";
import { useSessionUser } from "@/component/shared/SessionUser";

const EMPTY_FORM = { cardholder: "", cardNumber: "", expiry: "", cvc: "", zip: "" };

const Checkout = () => {
  const { pending, checkout } = useServices();
  const { name } = useSessionUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<string[] | null>(null);

  const total = pending.reduce((sum, item) => sum + item.price, 0);
  const update = (field: keyof typeof EMPTY_FORM) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setError(null);
  };

  const confirmPayment = () => {
    if (pending.length === 0) return;
    if (Object.values(form).some((value) => !value.trim())) {
      setError("Please fill in all payment details to continue.");
      return;
    }
    setPaid(pending.map((item) => item.name));
    checkout();
  };

  if (paid) {
    return (
      <>
        <div className="breadcrumb-row">
          <div className="breadcrumbs">
            <Link href="/services" className="breadcrumb-link">
              Services
            </Link>{" "}
            / <b>Payment</b>
          </div>
        </div>

        <div className="payment-success-card">
          <CheckCircle2 size={46} strokeWidth={1.75} color="#16a34a" />
          <div style={{ fontSize: 19, fontWeight: 700, color: "#0d1e2c", marginTop: 14 }}>Payment Successful!</div>
          <div className="dash-pending-sub" style={{ marginTop: 8, maxWidth: 360 }}>
            {paid.join(", ")} — now active on your account. Your specialist will reach out shortly to get started.
          </div>
          <Link
            href="/services"
            className="btn-view-report"
            style={{ marginTop: 20, textDecoration: "none", display: "inline-block" }}
          >
            Back to My Services
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/services" className="breadcrumb-link">
            Services
          </Link>{" "}
          / <b>Payment</b>
        </div>
      </div>

      <div>
        <div className="page-title">Complete Your Payment</div>
        <div className="page-desc">
          Confirm the services below and enter your payment details to activate them.
        </div>
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="section-card">
          <div className="section-title" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={17} strokeWidth={2} /> Payment Details
          </div>

          <label className="field-label">Cardholder Name</label>
          <input
            type="text"
            className="input-text"
            placeholder={name}
            value={form.cardholder}
            onChange={update("cardholder")}
          />

          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div>
              <label className="field-label">Card Number</label>
              <input
                type="text"
                className="input-text"
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={update("cardNumber")}
              />
            </div>
            <div>
              <label className="field-label">Expiry</label>
              <input
                type="text"
                className="input-text"
                placeholder="MM / YY"
                value={form.expiry}
                onChange={update("expiry")}
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: 14 }}>
            <div>
              <label className="field-label">CVC</label>
              <input
                type="text"
                className="input-text"
                placeholder="123"
                inputMode="numeric"
                value={form.cvc}
                onChange={update("cvc")}
              />
            </div>
            <div>
              <label className="field-label">Billing ZIP</label>
              <input
                type="text"
                className="input-text"
                placeholder="33602"
                value={form.zip}
                onChange={update("zip")}
              />
            </div>
          </div>

          {error ? (
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "#b91c1c" }}>{error}</div>
          ) : null}

          <div className="field-hint" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} strokeWidth={2} /> This is a prototype — no real payment is processed.
          </div>
        </div>

        <div className="side-card">
          <div className="side-title" style={{ marginBottom: 12 }}>
            Order Summary
          </div>
          <div className="order-summary-list">
            {pending.length === 0 ? (
              <div className="order-summary-empty" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={14} strokeWidth={2} /> No services selected.{" "}
                <Link href="/services" style={{ color: "#2563eb", fontStyle: "normal", fontWeight: 600 }}>
                  Choose services
                </Link>
              </div>
            ) : (
              <>
                <div className="order-summary-row">
                  <span>
                    {pending.length} selected service{pending.length === 1 ? "" : "s"}
                  </span>
                  <span />
                </div>
                {pending.map((item) => (
                  <div className="order-summary-row" key={item.id}>
                    <span>{item.name}</span>
                    <span style={{ color: "#9aacb8", fontWeight: 500 }}>{categoryTitle(item.category)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="order-summary-total">
            <span>Total</span>
            <span>${formatMoney(total)}/mo</span>
          </div>
          <button
            className="btn-save-client"
            style={{ width: "100%", marginTop: 16, justifyContent: "center", opacity: pending.length === 0 ? 0.5 : 1 }}
            disabled={pending.length === 0}
            onClick={confirmPayment}
          >
            Confirm &amp; Pay
          </button>
          <Link
            href="/services"
            className="btn-draft"
            style={{ width: "100%", marginTop: 8, display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </>
  );
};

export default Checkout;
