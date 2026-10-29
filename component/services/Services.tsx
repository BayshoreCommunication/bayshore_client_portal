"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Check, CirclePlus, Lightbulb, LoaderCircle, Plus, Send, TrendingUp } from "lucide-react";
import { useRealtime, useRefreshing } from "@/lib/realtime";
import MyServicesList from "./MyServicesList";
import { requestServiceAction, type MyServicesData } from "@/app/actions/service";
import { inter, poppins } from "@/component/shared/fonts";
import { SERVICE_GROUPS, shortNameOf, type CatalogGroup, type CatalogItem } from "./serviceCatalog";

const errorBannerClass = "rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]";

// What the client has asked for from this page is kept on their record (backend: POST
// /services/me/requests), for their team to add — so the cards stay marked "Requested" anywhere.
// "Something else" is kept under that name.
const SOMETHING_ELSE = "Something else";

// A group's two colors, for the card and everything in it.
const tint = (group: CatalogGroup) => ({ "--c": group.color, "--soft": group.soft }) as CSSProperties;

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ── One service on offer ─────────────────────────────────────────────────────

// Where a service on offer stands for this client: running each month, asked for, or not yet.
// "added": they asked for it and the team added it (as a one-time service, under Your services).
type CardState = "idle" | "sending" | "requested" | "added" | "active";

const ServiceCard = ({ item, group, state, error, onRequest }: { item: CatalogItem; group: CatalogGroup; state: CardState; error?: string; onRequest: () => void }) => {
  const Icon = item.icon;
  const done = state !== "idle" && state !== "sending";
  return (
    <div
      style={tint(group)}
      className={`relative flex flex-col rounded-2xl border p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.75 hover:shadow-[0_12px_28px_rgba(15,23,41,0.08)] ${
        done ? "border-[#7cc59a] bg-[#f7fcf9] shadow-[0_0_0_3px_#e3f4ea]" : "border-[#e6e8eb] bg-white hover:border-[#d5d9df]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-(--soft) text-(--c)">
          <Icon className="size-5.25" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h4 className={`${poppins.className} text-[15.5px] leading-snug font-semibold text-[#111827]`}>{item.name}</h4>
          {item.popular ? <span className="mt-1 inline-block rounded-full bg-[#fff3e2] px-2 py-0.5 text-[10.5px] font-semibold text-[#b45f0c]">★ Popular</span> : null}
          {item.isNew ? <span className="mt-1 inline-block rounded-full bg-[#e6efff] px-2 py-0.5 text-[10.5px] font-semibold text-[#2559c9]">New</span> : null}
        </div>
      </div>
      <p className="mt-3 text-[13.5px] leading-[1.55] text-[#4b5563]">{item.description}</p>
      <ul className="mt-3 flex list-none flex-col gap-1.5">
        {item.includes.map((line) => (
          <li key={line} className="flex items-start gap-2 text-[13px] text-[#374151]">
            <Check className="mt-0.5 size-3.75 shrink-0 text-(--c)" strokeWidth={2.5} />
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-3.5 flex gap-2 rounded-[10px] bg-(--soft) px-3 py-2.5 text-[12.5px] leading-[1.45] text-[#1f2937]">
        <Lightbulb className="mt-px size-3.75 shrink-0 text-(--c)" strokeWidth={2} />
        <span>
          <b className="font-semibold">How it helps:</b> {item.helps}
        </span>
      </div>
      <div className="mt-auto pt-4">
        <button
          type="button"
          disabled={state !== "idle"}
          onClick={onRequest}
          className={`flex w-full items-center justify-center gap-1.75 rounded-[10px] border-[1.5px] py-2.25 text-[13.5px] font-semibold transition-colors ${
            done
              ? "cursor-default border-[#1f7a47] bg-[#1f7a47] text-white"
              : state === "sending"
                ? "cursor-wait border-[#0f1729] bg-white text-[#0f1729] opacity-70"
                : "cursor-pointer border-[#0f1729] bg-white text-[#0f1729] hover:bg-[#0f1729] hover:text-white"
          }`}
        >
          {state === "active" ? (
            <>
              <Check className="size-3.75" strokeWidth={2.5} /> Running service · monthly
            </>
          ) : state === "added" ? (
            <>
              <Check className="size-3.75" strokeWidth={2.5} /> Added · in your services above
            </>
          ) : state === "requested" ? (
            <>
              <Check className="size-3.75" strokeWidth={2.5} /> Requested · we&apos;ll be in touch
            </>
          ) : state === "sending" ? (
            <>
              <LoaderCircle className="size-3.75 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Plus className="size-3.75" strokeWidth={2.5} /> Request this service
            </>
          )}
        </button>
        {error ? (
          <p role="alert" className="mt-2 text-center text-[12px] font-medium text-[#b42318]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};

// ── The Services page ────────────────────────────────────────────────────────

// At the top, what the client has now (MyServicesList): each service, monthly and one-time, with
// the totals and what was finished. Under it, everything BayShore offers in groups, to read and
// request; a request goes to their account manager as a message, who comes back with a plan and
// a quote. `mine` is missing when it couldn't be loaded; `mineError` says why.
const Services = ({ mine, mineError }: { mine?: MyServicesData; mineError?: string }) => {
  // What they asked for that the team hasn't added yet: these count as "Your requests".
  // As the server last said, plus what was sent from this page since. Fresh from the server (the
  // team added or set one aside — a live refresh), only the server's answer counts.
  const [sent, setSent] = useState<string[]>([]);
  const [seen, setSeen] = useState(mine);
  if (seen !== mine) {
    setSeen(mine);
    setSent([]);
  }
  const addedRequests = (mine?.requests ?? []).filter((entry) => entry.status === "added").map((entry) => entry.name);
  const requests = [...new Set([...(mine?.requests ?? []).filter((entry) => entry.status === "open").map((entry) => entry.name), ...sent])];
  const [sending, setSending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState("");

  // The services they run each month, by name. A custom service is one-time, and listed under
  // one-time services instead (MyServicesList).
  const active = mine ? [...new Set([...(mine.plans ?? []).map((plan) => plan.name), ...mine.services.map((entry) => entry.service.title), ...(mine.unpriced ?? [])])] : [];

  // The team added, changed or finished a service: shown at once (and every minute, if the live
  // connection is down).
  const router = useRouter();
  useRealtime<{ type?: string }>("notifications:new", (news) => {
    if (news?.type === "services_updated") router.refresh();
  });
  useRefreshing(() => router.refresh(), 60_000);
  const total = SERVICE_GROUPS.reduce((sum, group) => sum + group.items.length, 0);

  // A service of theirs by another name is still this one ("Search Engine Optimization (SEO)" is SEO).
  const sameAs = (item: CatalogItem, name: string) =>
    Boolean(item.match?.test(name)) || normalize(name) === normalize(item.name) || (shortNameOf(name) !== name && normalize(shortNameOf(name)) === normalize(shortNameOf(item.name)));
  const isActive = (item: CatalogItem) => active.some((name) => sameAs(item, name));
  const stateOf = (item: CatalogItem): CardState =>
    isActive(item) ? "active" : requests.includes(item.name) ? "requested" : addedRequests.includes(item.name) ? "added" : sending === item.name ? "sending" : "idle";

  const request = async (key: string, service: string | null, text?: string) => {
    setSending(key);
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    const result = await requestServiceAction(service, text);
    setSending(null);
    if (!result.ok) {
      setErrors((previous) => ({ ...previous, [key]: result.error || "Couldn't send your request. Please try again." }));
      return false;
    }
    const open = result.data?.requests.filter((entry) => entry.status === "open").map((entry) => entry.name);
    setSent((previous) => [...new Set([...previous, ...(open ?? [key])])]);
    return true;
  };

  const sendSomethingElse = async () => {
    if (!note.trim()) return;
    if (await request(SOMETHING_ELSE, null, note)) {
      setWriting(false);
      setNote("");
    }
  };

  const shown = filter === "all" ? SERVICE_GROUPS : SERVICE_GROUPS.filter((group) => group.id === filter);
  const sentSomethingElse = requests.includes(SOMETHING_ELSE);

  return (
    <div className={`${inter.className} flex flex-col text-[#111827]`}>
      <h1 className={`${poppins.className} text-[30px] leading-tight font-bold`}>Services</h1>
      <p className="mt-1 text-[14.5px] text-[#4b5563]">What we&apos;re doing for you today, and everything else we can help your business with.</p>

      {/* What the client has now: each service, monthly and one-time, and what was finished. */}
      {mine ? (
        <MyServicesList mine={mine} />
      ) : (
        <div role="alert" className={`${errorBannerClass} mt-5.5`}>
          {mineError ?? "Could not load your services."} Please refresh the page to try again.
        </div>
      )}


      {/* Everything else on offer. */}
      <section className="relative mt-7 overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_85%_20%,rgba(232,150,58,0.35),transparent_45%),linear-gradient(120deg,#0f1729_0%,#1d2b4d_100%)] px-8 py-7.5 text-white max-md:px-5 max-md:py-6">
        <div className="text-[12px] font-semibold tracking-[0.14em] text-[#f5b874]">EXPLORE WHAT WE DO</div>
        <h2 className={`${poppins.className} mt-2 max-w-155 text-[26px] leading-[1.3] font-semibold max-md:text-[21px]`}>Find the help your business needs to grow.</h2>
        <p className="mt-2.5 max-w-150 text-[14.5px] leading-[1.55] text-[#c4cee0]">
          Browse our services below to see what each one includes and how it helps. When something fits, tap <b className="text-white">Request</b>. There&apos;s no commitment.
          We&apos;ll build a plan and price around your goals.
        </p>
        <div className="mt-5.5 flex flex-wrap gap-5.5">
          {["Request a service", "We review your business", "You get a custom plan & quote"].map((label, index) => (
            <div key={label} className="flex items-center gap-2.5 text-[13.5px] text-[#e2e8f0]">
              <b className="grid size-6.5 place-items-center rounded-full bg-white/12 text-[12.5px] text-white">{index + 1}</b>
              {label}
            </div>
          ))}
        </div>
        <TrendingUp aria-hidden className="pointer-events-none absolute -bottom-7.5 right-7 size-55 text-white opacity-12" strokeWidth={1.2} />
      </section>

      <div className="sticky top-0 z-5 mt-7.5 flex flex-wrap gap-2 bg-[#f2f5f3] py-3" role="toolbar" aria-label="Filter services">
        {[{ id: "all", name: "All services", count: total, group: null as CatalogGroup | null }, ...SERVICE_GROUPS.map((group) => ({ id: group.id, name: group.name, count: group.items.length, group }))].map(
          (chip) => {
            const on = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(chip.id)}
                style={chip.group ? tint(chip.group) : undefined}
                className={`flex cursor-pointer items-center gap-1.75 rounded-full border px-3.75 py-2 text-[13.5px] font-medium transition-colors ${
                  on ? "border-[#0f1729] bg-[#0f1729] text-white" : "border-[#dde1e6] bg-white text-[#111827] hover:border-[#b9c0ca]"
                }`}
              >
                {chip.group ? <span className="size-2 rounded-full bg-(--c)" /> : null}
                {chip.name}
                <span className="text-[11.5px] opacity-60">{chip.count}</span>
              </button>
            );
          },
        )}
      </div>

      {shown.map((group) => {
        const GroupIcon = group.icon;
        return (
          <section key={group.id} className="mt-7.5" style={tint(group)}>
            <div className="mb-4 flex items-center gap-3.5">
              <span className="grid size-10.5 shrink-0 place-items-center rounded-xl bg-(--c) text-white">
                <GroupIcon className="size-5" strokeWidth={2} />
              </span>
              <div>
                <h3 className={`${poppins.className} text-[19px] font-semibold`}>{group.name}</h3>
                <p className="mt-px text-[13.5px] text-[#6b7280]">{group.blurb}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <ServiceCard key={item.name} item={item} group={group} state={stateOf(item)} error={errors[item.name]} onRequest={() => void request(item.name, item.name)} />
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-9 flex items-center gap-4.5 rounded-2xl border-[1.5px] border-dashed border-[#d5d9df] bg-white px-6.5 py-6 max-md:flex-col max-md:items-start">
        <span className="grid size-12.5 shrink-0 place-items-center rounded-[14px] bg-[#f1ece0] text-[#6b5a2e]">
          <CirclePlus className="size-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={`${poppins.className} text-[16px] font-semibold`}>Don&apos;t see what you need?</h4>
          <p className="mt-0.75 text-[13.5px] text-[#4b5563]">Tell us what you&apos;re trying to do and we&apos;ll tell you how we can help, even if it isn&apos;t listed here.</p>
          {writing ? (
            <div className="mt-3.5">
              <textarea
                autoFocus
                rows={3}
                maxLength={1500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What would you like help with?"
                aria-label="What would you like help with?"
                className="w-full resize-y rounded-[10px] border border-[#dde1e6] bg-white px-3.5 py-2.5 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#0f1729]"
              />
              {errors[SOMETHING_ELSE] ? (
                <p role="alert" className="mt-1.5 text-[12px] font-medium text-[#b42318]">
                  {errors[SOMETHING_ELSE]}
                </p>
              ) : null}
              <div className="mt-2.5 flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={!note.trim() || sending === SOMETHING_ELSE}
                  onClick={() => void sendSomethingElse()}
                  className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#0f1729] px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#1b2742] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending === SOMETHING_ELSE ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {sending === SOMETHING_ELSE ? "Sending…" : "Send request"}
                </button>
                <button type="button" onClick={() => setWriting(false)} className="cursor-pointer rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium text-[#4b5563] hover:text-[#111827]">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {writing ? null : (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-white ${
              sentSomethingElse ? "bg-[#1f7a47] hover:bg-[#19673b]" : "bg-[#0f1729] hover:bg-[#1b2742]"
            }`}
          >
            {sentSomethingElse ? <Check className="size-4" strokeWidth={2.5} /> : <Plus className="size-4" strokeWidth={2.5} />}
            {sentSomethingElse ? "Request sent · ask another" : "Request something else"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Services;
