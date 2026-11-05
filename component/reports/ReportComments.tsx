"use client";

import { useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { listMyMessagesAction } from "@/app/actions/messages";
import { CLIENT_LINKS } from "@/component/messages/Messages";
import { Composer, MessageList, useInBrowser, useThread } from "@/component/messages/chat";

// Under a report: the comments on it, between the client and their team. They are messages in
// the client's conversation, tied to this report — so they show on the Messages page too, and a
// reply from either place lands in both.
const ReportComments = ({ reportId }: { reportId: string }) => {
  const inBrowser = useInBrowser();
  const load = useCallback((before?: string) => listMyMessagesAction({ before, report: reportId }), [reportId]);
  const thread = useThread({
    initial: null,
    load,
    matches: (message) => message.report === reportId,
    postPath: "/messages/me",
    extra: { report: reportId },
  });

  return (
    <section className="rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)] print:hidden" aria-label="Comments">
      <div className="flex items-center gap-2.5 border-b border-[#eceef1] px-6 py-4">
        <MessageSquare size={17} strokeWidth={2} className="text-[#4b5563]" />
        <div className="text-[15px] font-semibold text-[#0b0c24]">
          Comments {thread.items.length ? <span className="font-medium text-[#9ca3af]">· {thread.items.length}</span> : null}
        </div>
        <span className="ml-auto text-[11.5px] text-[#9ca3af]">Also in your Messages</span>
      </div>
      <div className="px-6 pb-2">
        {!inBrowser || !thread.loaded ? (
          <div className="flex flex-col gap-2 py-4">
            <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-[#eceef1]" />
            <div className="h-10 w-1/3 animate-pulse self-end rounded-2xl bg-[#eceef1]" />
          </div>
        ) : thread.items.length ? (
          <>
            {thread.hasMore ? (
              <button type="button" onClick={() => void thread.older()} className="mt-3 cursor-pointer text-[12px] font-medium text-[#2f5fd8] hover:underline">
                Show earlier comments
              </button>
            ) : null}
            <MessageList items={thread.items.map((message) => ({ ...message, report: undefined }))} mySide="client" links={CLIENT_LINKS} />
          </>
        ) : (
          <p className="py-5 text-[12.5px] text-[#6b7280]">Questions about this report? Ask your team here.</p>
        )}
        {thread.error ? <p className="py-2 text-[12px] font-medium text-[#b91c1c]">{thread.error}</p> : null}
      </div>
      <div className="border-t border-[#eceef1] px-6 py-4">
        <Composer onSend={thread.send} placeholder="Write a comment about this report…" />
      </div>
    </section>
  );
};

export default ReportComments;
