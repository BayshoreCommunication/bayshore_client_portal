"use client";

import { useCallback, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { listMyMessagesAction, markMyMessagesReadAction } from "@/app/actions/messages";
import { ChatPane, announceRead, useThread, type ChatLinks, type MessagePage } from "./chat";

// Where a message's tag links to, in this portal.
export const CLIENT_LINKS: ChatLinks = {
  content: (id) => `/content/${id}`,
  report: (id) => `/reports/${id}`,
  onboarding: (message) => `/onboarding${message.onboardingStep ? `?step=${message.onboardingStep}` : ""}`,
};

const markRead = () =>
  void markMyMessagesReadAction().then((ok) => {
    if (ok) announceRead();
  });

// The client's one conversation with their BayShore team: everything written to each other —
// and the comments on their content, reports and onboarding form, tagged with where they were made.
const Messages = ({ initial }: { initial: MessagePage | null }) => {
  const load = useCallback((before?: string) => listMyMessagesAction({ before }), []);
  const thread = useThread({
    initial,
    load,
    matches: () => true,
    postUrl: "/api/messages",
    onIncoming: (message) => {
      if (message.side === "team" && document.visibilityState === "visible") markRead();
    },
  });

  // Opening it reads it.
  useEffect(markRead, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-serif text-[26px] font-bold text-[#0b1a26]">Messages</div>
        <div className="mt-1 text-[13px] text-[#657787]">Talk to your BayShore team. Comments on your content, reports and onboarding show up here too.</div>
      </div>
      <section className="flex h-[calc(100dvh-210px)] min-h-120 flex-col overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        <ChatPane
          thread={thread}
          mySide="client"
          links={CLIENT_LINKS}
          header={
            <div className="flex items-center gap-3 border-b border-[#eceef1] px-5 py-3.5">
              <span className="grid size-10 place-items-center rounded-full bg-[#0b1522] text-[13px] font-bold text-white">BC</span>
              <div>
                <div className="text-[14px] font-semibold text-[#0b1522]">BayShore team</div>
                <div className="text-[12px] text-[#6b7280]">Usually replies within a business day</div>
              </div>
            </div>
          }
          empty={
            <div>
              <MessageSquare className="mx-auto size-9 text-[#c7ccd4]" strokeWidth={1.6} />
              <p className="mt-2 text-[14px] font-semibold text-[#374151]">No messages yet</p>
              <p className="mt-1 text-[12.5px] text-[#6b7280]">Ask your team anything — they&apos;ll reply right here.</p>
            </div>
          }
        />
      </section>
    </div>
  );
};

export default Messages;
