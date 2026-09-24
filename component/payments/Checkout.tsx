"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Lock, ShoppingCart } from "lucide-react";
import { categoryTitle, formatMoney } from "@/component/services/data";
import { useServices } from "@/component/services/store";
import { useSessionUser } from "@/component/shared/SessionUser";

const EMPTY_FORM = { cardholder: "", cardNumber: "", expiry: "", cvc: "", zip: "" };

const inputClass = "w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 text-[12.5px] text-[#17242f]";
const labelClass = "mb-1.25 block text-[11.5px] font-bold text-[#384b59]";

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
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-[#6a7b8a]">
            <Link href="/services" className="cursor-pointer font-bold text-[#18232c] hover:underline">
              Services
            </Link>{" "}
            / <b className="text-[#18232c]">Payment</b>
          </div>
        </div>

        <div className="mt-4.5 flex flex-col items-center rounded-[10px] border border-[#dbe3de] bg-white px-6 py-15 text-center">
          <CheckCircle2 size={46} strokeWidth={1.75} color="#16a34a" />
          <div className="mt-3.5 text-[19px] font-bold text-[#0d1e2c]">Payment Successful!</div>
          <div className="mt-2 max-w-90 text-[11px] text-[#7a8e9b]">
            {paid.join(", ")} — now active on your account. Your specialist will reach out shortly to get started.
          </div>
          <Link
            href="/services"
            className="mt-5 inline-block cursor-pointer rounded-md bg-[#0d1e2e] px-4 py-2.25 text-[12.5px] font-bold whitespace-nowrap text-white no-underline"
          >
            Back to My Services
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#6a7b8a]">
          <Link href="/services" className="cursor-pointer font-bold text-[#18232c] hover:underline">
            Services
          </Link>{" "}
          / <b className="text-[#18232c]">Payment</b>
        </div>
      </div>

      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Complete Your Payment</div>
        <div className="mt-1 text-[13px] text-[#657787]">Confirm the services below and enter your payment details to activate them.</div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-5">
        <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#0d1e2c]">
            <CreditCard size={17} strokeWidth={2} /> Payment Details
          </div>

          <label className={labelClass}>Cardholder Name</label>
          <input type="text" className={inputClass} placeholder={name} value={form.cardholder} onChange={update("cardholder")} />

          <div className="mt-3.5 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Card Number</label>
              <input
                type="text"
                className={inputClass}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={update("cardNumber")}
              />
            </div>
            <div>
              <label className={labelClass}>Expiry</label>
              <input type="text" className={inputClass} placeholder="MM / YY" value={form.expiry} onChange={update("expiry")} />
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CVC</label>
              <input type="text" className={inputClass} placeholder="123" inputMode="numeric" value={form.cvc} onChange={update("cvc")} />
            </div>
            <div>
              <label className={labelClass}>Billing ZIP</label>
              <input type="text" className={inputClass} placeholder="33602" value={form.zip} onChange={update("zip")} />
            </div>
          </div>

          {error ? <div className="mt-3 text-xs font-semibold text-[#b91c1c]">{error}</div> : null}

          <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-[#7a8e9b] italic">
            <Lock size={12} strokeWidth={2} /> This is a prototype — no real payment is processed.
          </div>
        </div>

        <div className="rounded-lg border border-[#dbe3de] bg-white px-5 py-4.5">
          <div className="mb-3 text-sm font-bold text-[#0d1e2c]">Order Summary</div>
          <div className="flex flex-col gap-2.5">
            {pending.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-[#9aacb8] italic">
                <ShoppingCart size={14} strokeWidth={2} /> No services selected.{" "}
                <Link href="/services" className="font-semibold text-[#2563eb] not-italic">
                  Choose services
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-between border-b border-[#eef3ef] pb-2.5 text-[12.5px] text-[#17242f]">
                  <span className="font-semibold">
                    {pending.length} selected service{pending.length === 1 ? "" : "s"}
                  </span>
                  <span />
                </div>
                {pending.map((item) => (
                  <div className="flex justify-between border-b border-[#eef3ef] pb-2.5 text-[12.5px] text-[#17242f]" key={item.id}>
                    <span className="font-semibold">{item.name}</span>
                    <span className="font-medium text-[#9aacb8]">{categoryTitle(item.category)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-[#dbe3de] pt-3 text-sm font-bold text-[#0d1e2c]">
            <span>Total</span>
            <span>${formatMoney(total)}/mo</span>
          </div>
          <button
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border-none bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white disabled:opacity-50"
            disabled={pending.length === 0}
            onClick={confirmPayment}
          >
            Confirm &amp; Pay
          </button>
          <Link
            href="/services"
            className="mt-2 block w-full cursor-pointer rounded-md border border-[#cfdcd6] bg-white px-4.5 py-2.25 text-center text-[13px] font-semibold text-[#273847] no-underline"
          >
            Cancel
          </Link>
        </div>
      </div>
    </>
  );
};

export default Checkout;
