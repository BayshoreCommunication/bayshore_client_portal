"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, CircleAlert, CreditCard, Layers, Loader2, Lock, RefreshCw, ShieldCheck, ShoppingCart, X } from "lucide-react";
import {
  createServiceCheckoutAction,
  getServiceOrderAction,
  type CatalogService,
  type MyServicesData,
  type ServiceOrder,
} from "@/app/actions/service";
import { useServiceCart } from "@/component/services/cart";
import { dollars, plural, serviceColorOf, serviceIconOf } from "@/component/services/serviceUi";
import { poppins } from "@/component/shared/fonts";
import { useHydrated } from "@/lib/local-store";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const darkButtonClass =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]";
const outlineButtonClass =
  "flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]";

// While Stripe's confirmation is on its way: how often to ask, and for how long.
const POLL_EVERY_MS = 2500;
const POLL_TRIES = 12;

// One line of the order: a service and the sub-services being added to it.
type Line = { service: CatalogService; items: CatalogService["subServices"]; total: number; alreadyActive: boolean };

const Header = () => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Payment</div>
      <div className="mt-1 text-[12.5px] text-[#4b5563]">Confirm what you&apos;re adding and pay to start the services.</div>
    </div>
    <Link href="/services" className={outlineButtonClass}>
      <ArrowLeft size={14} strokeWidth={2} /> Back to Services
    </Link>
  </div>
);

// A centered message card: the result of a payment, or an empty cart.
const Notice = ({
  tone,
  icon,
  title,
  children,
  actions,
}: {
  tone: "good" | "bad" | "wait" | "plain";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const tones = { good: "bg-[#d6eadb] text-[#15803d]", bad: "bg-[#fdecec] text-[#b42318]", wait: "bg-[#d9e0ef] text-[#2f5fd8]", plain: "bg-[#d9e0ef] text-[#2f5fd8]" };

  return (
    <div className={`${cardClass} flex flex-col items-center px-6 py-12 text-center`}>
      <span className={`flex h-16 w-16 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</span>
      <div className="mt-4 text-[20px] font-semibold text-[#0b0c24]">{title}</div>
      <div className="mt-2 max-w-110 text-[12.5px] leading-normal text-[#4b5563]">{children}</div>
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2.5">{actions}</div> : null}
    </div>
  );
};

// How an order went — the page a client lands on after Stripe. Stripe's
// confirmation reaches the backend separately (by webhook), so an order can still
// be pending for a moment; this asks again until it settles.
const OrderResult = ({ sessionId, initial, onPaid }: { sessionId: string; initial: ServiceOrder; onPaid: () => void }) => {
  const [order, setOrder] = useState(initial);
  const [tries, setTries] = useState(0);
  const waiting = order.status === "pending" && tries < POLL_TRIES;

  useEffect(() => {
    if (order.status === "paid") onPaid();
  }, [order.status, onPaid]);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(async () => {
      const result = await getServiceOrderAction(sessionId);
      if (result.ok && result.data) setOrder(result.data);
      setTries((count) => count + 1);
    }, POLL_EVERY_MS);
    return () => clearTimeout(timer);
  }, [waiting, tries, sessionId]);

  const names = order.items.flatMap((item) => item.subServices.map((sub) => sub.name));

  if (order.status === "paid") {
    return (
      <Notice
        tone="good"
        icon={<CheckCircle2 size={32} strokeWidth={1.9} />}
        title="Payment confirmed"
        actions={
          <Link href="/services" className={`${darkButtonClass} px-4.5 py-2.25`}>
            Back to My Services
          </Link>
        }
      >
        {plural(names.length, "sub-service")} {names.length === 1 ? "is" : "are"} now active on your account
        {order.amount ? (
          <>
            {" "}
            — {dollars(order.amount)} paid.
          </>
        ) : (
          "."
        )}{" "}
        Your monthly payment is <span className="font-semibold text-[#0b0c24]">{dollars(order.monthlyTotal)}</span>.
        <ul className="mt-4 flex list-none flex-wrap justify-center gap-2">
          {names.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[11.5px] font-medium text-[#1f2530]">
              <Check size={12} strokeWidth={2.75} className="text-[#15803d]" /> {item}
            </li>
          ))}
        </ul>
      </Notice>
    );
  }

  if (order.status === "pending") {
    return waiting ? (
      <Notice tone="wait" icon={<Loader2 size={30} strokeWidth={2} className="animate-spin" />} title="Confirming your payment…">
        This usually takes a few seconds. Your services are added as soon as the payment is confirmed — you don&apos;t need to do anything.
      </Notice>
    ) : (
      <Notice
        tone="wait"
        icon={<RefreshCw size={28} strokeWidth={2} />}
        title="Still waiting for confirmation"
        actions={
          <>
            <button type="button" className={`${darkButtonClass} px-4.5 py-2.25`} onClick={() => setTries(0)}>
              <RefreshCw size={13} strokeWidth={2} /> Check Again
            </button>
            <Link href="/services" className={outlineButtonClass}>
              Back to Services
            </Link>
          </>
        }
      >
        We haven&apos;t heard back about this payment yet. If it went through, your services will appear on their own — there&apos;s no need to pay again.
      </Notice>
    );
  }

  return (
    <Notice
      tone="bad"
      icon={<CircleAlert size={30} strokeWidth={1.9} />}
      title={order.status === "expired" ? "This payment wasn't completed" : "The payment didn't go through"}
      actions={
        <>
          <Link href="/payments" className={`${darkButtonClass} px-4.5 py-2.25`}>
            Try Again
          </Link>
          <Link href="/services" className={outlineButtonClass}>
            Back to Services
          </Link>
        </>
      }
    >
      Nothing was added to your account{order.status === "failed" ? " and you weren't charged" : ""}. Your selection is still saved, so you can try again.
    </Notice>
  );
};

// The payment step between choosing services and having them. The cart comes from
// the Services page; paying happens on Stripe's own page, so card details never
// touch this site. The services are added — and the monthly payment goes up —
// only once Stripe confirms the payment to the backend.
// `order` / `sessionId` are set when the client has come back from Stripe;
// `cancelled` when they backed out of it.
const Checkout = ({
  mine,
  catalog,
  error,
  sessionId,
  order,
  orderError,
  cancelled = false,
}: {
  mine?: MyServicesData;
  catalog?: CatalogService[];
  // Why the order couldn't be put together, when `mine` or `catalog` is missing.
  error?: string;
  sessionId?: string;
  order?: ServiceOrder;
  orderError?: string;
  cancelled?: boolean;
}) => {
  const hydrated = useHydrated();
  const { cart, clearCart } = useServiceCart();

  const [starting, setStarting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(cancelled);
  // A free order is settled without leaving the page.
  const [settled, setSettled] = useState<ServiceOrder | null>(null);

  const monthlyTotal = mine?.monthlyTotal ?? 0;

  // The order, from the cart: only sub-services that are still on offer and that
  // the client doesn't already take.
  const lines: Line[] = (catalog ?? []).flatMap((service) => {
    const have = mine?.services.find((entry) => entry.service._id === service._id)?.subServices.map((item) => item.subService) ?? [];
    const items = service.subServices.filter((item) => (cart[service._id] ?? []).includes(item._id) && !have.includes(item._id));
    return items.length ? [{ service, items, total: items.reduce((sum, item) => sum + item.price, 0), alreadyActive: have.length > 0 }] : [];
  });
  const itemCount = lines.reduce((sum, line) => sum + line.items.length, 0);
  const orderTotal = lines.reduce((sum, line) => sum + line.total, 0);

  const handlePay = async () => {
    setPayError(null);
    setShowCancelled(false);
    setStarting(true);
    const result = await createServiceCheckoutAction(lines.map((line) => ({ service: line.service._id, subServices: line.items.map((item) => item._id) })));

    if (!result.ok || !result.data) {
      setStarting(false);
      setPayError([result.error ?? "Couldn't start the payment.", ...(result.fieldErrors ?? [])].join(" "));
      return;
    }
    if (result.data.url) {
      // Off to Stripe; the button keeps spinning until the browser leaves.
      window.location.assign(result.data.url);
      return;
    }
    setStarting(false);
    clearCart();
    setSettled(result.data.order);
  };

  const shell = (content: React.ReactNode) => (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <Header />
      {content}
    </div>
  );

  // Back from Stripe.
  if (sessionId) {
    return shell(
      order ? (
        <OrderResult sessionId={sessionId} initial={order} onPaid={clearCart} />
      ) : (
        <Notice
          tone="bad"
          icon={<CircleAlert size={30} strokeWidth={1.9} />}
          title="We couldn't check this payment"
          actions={
            <Link href="/services" className={`${darkButtonClass} px-4.5 py-2.25`}>
              Back to Services
            </Link>
          }
        >
          {orderError ?? "Something went wrong."} If you paid, your services will still appear on their own — there&apos;s no need to pay again.
        </Notice>
      ),
    );
  }

  if (settled) return shell(<OrderResult sessionId="" initial={settled} onPaid={clearCart} />);

  // The cart lives in this browser, so nothing can be said about it until the page is running there.
  if (!hydrated) return shell(null);

  if (!mine || !catalog) {
    return shell(
      <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
        {error ?? "Could not load your order."} Please refresh the page to try again.
      </div>,
    );
  }

  if (lines.length === 0) {
    return shell(
      <Notice
        tone="plain"
        icon={<ShoppingCart size={28} strokeWidth={1.8} />}
        title="Nothing to pay for"
        actions={
          <Link href="/services" className={`${darkButtonClass} px-4.5 py-2.25`}>
            <Layers size={14} strokeWidth={2} /> Choose Services
          </Link>
        }
      >
        Pick the services you&apos;d like to add on the Services page, then come back here to pay and start them.
      </Notice>,
    );
  }

  return shell(
    <>
      {showCancelled ? (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#f3d9a4] bg-[#fdf6e7] px-4 py-3 text-[12.5px] font-medium text-[#8a5a10]">
          <span>The payment was cancelled — you weren&apos;t charged and nothing was added. Your selection is still here.</span>
          <button type="button" className="inline-flex cursor-pointer" aria-label="Dismiss" onClick={() => setShowCancelled(false)}>
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* What's being added. */}
        <div className={`${cardClass} p-5`}>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="text-[14px] font-semibold text-[#0b0c24]">Order Summary</div>
            <div className="text-[11.5px] text-[#6b7280]">
              {plural(itemCount, "sub-service")} · {plural(lines.length, "service")}
            </div>
          </div>
          <ul className="flex list-none flex-col gap-3">
            {lines.map(({ service, items, total, alreadyActive }) => {
              const Icon = serviceIconOf(service);
              return (
                <li key={service._id} className="rounded-xl border border-[#e6e8eb]">
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(service) }}>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-[#1f2530]">{service.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#6b7280]">{alreadyActive ? "Adding to a service you already have" : "New service"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[13.5px] font-semibold text-[#0b0c24]">+{dollars(total)}</span>
                      <span className="text-[11px] text-[#6b7280]">/mo</span>
                    </div>
                  </div>
                  <ul className="flex list-none flex-col gap-1.5 border-t border-[#eef0f2] bg-[#f9fafb] px-3.5 py-3">
                    {items.map((item) => (
                      <li key={item._id} className="flex items-center gap-2.5 text-[12px]">
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1 text-[#1f2530]">{item.name}</span>
                        <span className="shrink-0 text-[#4b5260]">{dollars(item.price)}/mo</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col gap-2 rounded-xl bg-[#f6f7f9] px-4 py-3.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-[#4b5563]">What you pay now</span>
              <span className="font-medium text-[#1f2530]">{dollars(monthlyTotal)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4b5563]">Added with this order</span>
              <span className="font-medium text-[#1f2530]">+{dollars(orderTotal)}/mo</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-[#e2e5e9] pt-2.5">
              <span className="font-medium text-[#0b0c24]">Your new monthly payment</span>
              <span className="text-[15px] font-semibold text-[#0b0c24]">{dollars(monthlyTotal + orderTotal)}/mo</span>
            </div>
          </div>
        </div>

        {/* The payment. */}
        <div className={`${cardClass} p-5`}>
          <div className="mb-3.5 flex items-center gap-2 text-[14px] font-semibold text-[#0b0c24]">
            <CreditCard size={16} strokeWidth={2} className="text-[#2f5fd8]" /> Payment
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] font-medium text-[#0b0c24]">Due today</div>
              <div className="text-[11px] text-[#6b7280]">First month of what you&apos;re adding</div>
            </div>
            <div className="text-[26px] leading-none font-semibold text-[#0b0c24]">{dollars(orderTotal)}</div>
          </div>

          {payError ? (
            <div role="alert" className="mt-3.5 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] font-medium text-[#b42318]">
              {payError}
            </div>
          ) : null}

          <button
            type="button"
            className={`${darkButtonClass} mt-4 h-10.5 w-full disabled:cursor-wait disabled:opacity-70`}
            disabled={starting}
            aria-busy={starting}
            onClick={handlePay}
          >
            {starting ? <Loader2 size={15} strokeWidth={2.5} className="animate-spin" /> : <Lock size={14} strokeWidth={2} />}
            {starting ? "Opening secure payment…" : orderTotal ? `Pay ${dollars(orderTotal)}` : "Add to My Services"}
          </button>
          <Link href="/services" className={`${outlineButtonClass} mt-2.5 w-full`}>
            Change My Selection
          </Link>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#f6f7f9] px-3 py-2.5 text-[11.5px] leading-normal text-[#4b5563]">
            <ShieldCheck size={15} strokeWidth={2} className="mt-px shrink-0 text-[#16a34a]" />
            <span>
              You&apos;ll enter your card on <span className="font-medium text-[#0b0c24]">Stripe</span>&apos;s secure page. BayShore never sees or stores your card details.
            </span>
          </div>
          <div className="mt-3 text-[11px] leading-normal text-[#6b7280]">
            Your services start as soon as the payment is confirmed. To remove a service later, message your account manager.
          </div>
        </div>
      </div>
    </>,
  );
};

export default Checkout;
