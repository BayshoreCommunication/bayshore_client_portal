"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { addMyEmailAction, removeMyEmailAction, type MyEmails } from "@/app/actions/emails";
import { poppins } from "@/component/shared/fonts";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// As the backend allows (client.model.ts → CLIENT_SECONDARY_EMAILS_MAX).
const MAX_SECONDARY = 10;

// The client's email addresses: the one they sign in with, and as many others as they like — each
// sent a copy of every email from BayShore (but passwords and sign-in changes, which stay with the first).
const EmailSettings = ({ initial, error: loadError }: { initial?: MyEmails; error?: string }) => {
  const [emails, setEmails] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const email = draft.trim().toLowerCase();
    if (!EMAIL.test(email)) return setError("Please enter a valid email address.");
    if (email === emails?.primary) return setError("This is already your primary email.");
    if (emails?.secondary.includes(email)) return setError("This email is already added.");
    setError(null);
    setBusy("add");
    const result = await addMyEmailAction(email);
    setBusy(null);
    if (!result.ok) return setError(result.error);
    setEmails(result.data);
    setDraft("");
  };

  const remove = async (email: string) => {
    setError(null);
    setBusy(email);
    const result = await removeMyEmailAction(email);
    setBusy(null);
    setConfirming(null);
    if (!result.ok) return setError(result.error);
    setEmails(result.data);
  };

  const full = (emails?.secondary.length ?? 0) >= MAX_SECONDARY;

  return (
    <div className={`${poppins.className} flex flex-col gap-4.5`}>
      <div>
        <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Settings</div>
        <div className="mt-1 text-[12.5px] text-[#4b5563]">Your account&apos;s email addresses.</div>
      </div>

      <section className={cardClass}>
        <h2 className="m-0 text-[16px] font-bold text-[#0b0c24]">Email addresses</h2>
        <p className="mt-1 mb-4 max-w-160 text-[12.5px] leading-normal text-[#4b5563]">
          Every email and notification from BayShore goes to your primary email, and a copy to each secondary email you add. Your password and
          sign-in changes are only sent to your primary email.
        </p>

        {!emails ? (
          <div className="rounded-lg bg-[#fdecec] px-3.5 py-3 text-[13px] text-[#b42318]">{loadError ?? "Couldn't load your emails. Please refresh the page."}</div>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              <li className="flex items-center gap-3 rounded-xl border border-[#e6e8eb] bg-[#f8fafc] px-3.5 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e8effd] text-[#1d4ed8]">
                  <Mail size={16} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#0b0c24]">{emails.primary}</span>
                <span className="rounded-full bg-[#e8effd] px-2.5 py-1 text-[11px] font-bold text-[#1d4ed8]">Primary</span>
              </li>
              {emails.secondary.map((email) => (
                <li key={email} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e6e8eb] bg-white px-3.5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f1f5f9] text-[#475569]">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#0b0c24]">{email}</span>
                  <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">Secondary</span>
                  {confirming === email ? (
                    <span className="flex items-center gap-2">
                      <span className="text-[12px] text-[#4b5563]">Remove it?</span>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void remove(email)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 text-[12px] font-semibold text-white hover:bg-[#b91c1c] disabled:cursor-wait disabled:opacity-70"
                      >
                        {busy === email ? <Loader2 size={13} className="animate-spin" /> : null} Remove
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => setConfirming(null)}
                        className="h-8 cursor-pointer rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12px] font-semibold text-[#1f2530] hover:bg-[#f3f4f6]"
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Remove ${email}`}
                      disabled={busy !== null}
                      onClick={() => setConfirming(email)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#6b7280] hover:bg-[#fdecec] hover:text-[#dc2626] disabled:opacity-50"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {full ? (
              <p className="mt-3 mb-0 text-[12.5px] text-[#6b7280]">You&apos;ve added the most secondary emails you can ({MAX_SECONDARY}). Remove one to add another.</p>
            ) : (
              <form onSubmit={add} className="mt-4 flex flex-wrap items-center gap-2.5">
                <label htmlFor="secondary-email" className="sr-only">
                  Secondary email
                </label>
                <input
                  id="secondary-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Add a secondary email"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) setError(null);
                  }}
                  className="h-10 min-w-0 flex-1 basis-64 rounded-lg border border-[#e2e5e9] bg-white px-3 text-[13px] text-[#0b0c24] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                />
                <button
                  type="submit"
                  disabled={busy !== null || !draft.trim()}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[13px] font-semibold text-white hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "add" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.5} />} Add email
                </button>
              </form>
            )}
            {error ? <p className="mt-2.5 mb-0 text-[12.5px] font-medium text-[#b42318]">{error}</p> : null}
          </>
        )}
      </section>
    </div>
  );
};

export default EmailSettings;
