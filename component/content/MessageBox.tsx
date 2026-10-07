"use client";

import { useEffect, useRef } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
import { PendingChip, type useAttachments } from "./contentParts";

// Somewhere to write a few lines and send them, the way a chat does: one field holding the
// words — with the attach button inside it, on the left — and a send button beside it.
// Enter sends, Shift+Enter starts a new line, and files can be pasted in. The field grows
// with what is typed. What it sends, and where, is up to whoever uses it.
const MessageBox = ({
  value,
  onChange,
  files,
  progress,
  error,
  onSend,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  // The picked files, from useAttachments.
  files: ReturnType<typeof useAttachments>;
  // How far the upload has got (0–100) while sending; null when idle.
  progress: number | null;
  error?: string | null;
  onSend: () => void;
  placeholder: string;
  // What the field and its button are for, for screen readers: "Message", "Add to this revision"…
  label: string;
}) => {
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const sending = progress !== null;
  const canSend = (value.trim() !== "" || files.files.length > 0) && !sending;

  // Once what was typed has been sent (and cleared), the field shrinks back to one line.
  useEffect(() => {
    if (!value && boxRef.current) boxRef.current.style.height = "";
  }, [value]);

  const send = () => {
    if (canSend) onSend();
  };

  return (
    <div>
      {files.files.length > 0 ? (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {files.files.map((file) => (
            <PendingChip key={file.id} file={file} disabled={sending} onRemove={() => files.remove(file.id)} />
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {/* One field: the words, with the attach button inside it. */}
        <div className="flex min-w-0 flex-1 items-end rounded-xl border border-[#e2e5e9] bg-[#f5f6f8] focus-within:border-[#9aa3af] focus-within:bg-white">
          <label
            title="Attach a file"
            className={`mb-1.5 ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
              files.full || sending ? "cursor-not-allowed text-[#c4cad2]" : "cursor-pointer text-[#6b7280] hover:bg-[#e6e8eb] hover:text-[#1f2530]"
            }`}
          >
            <Paperclip size={14} strokeWidth={2} />
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.rtf,.odt"
              disabled={files.full || sending}
              className="hidden"
              onChange={(event) => {
                files.add(Array.from(event.target.files ?? []));
                // Let the same file be picked again after removing it.
                event.target.value = "";
              }}
            />
          </label>
          <textarea
            ref={boxRef}
            rows={1}
            maxLength={1000}
            value={value}
            readOnly={sending}
            aria-label={label}
            placeholder={placeholder}
            onChange={(event) => {
              onChange(event.target.value);
              // Grows with what is typed, up to a few lines.
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            onPaste={(event) => {
              const pasted = Array.from(event.clipboardData.files);
              if (pasted.length) {
                event.preventDefault();
                files.add(pasted);
              }
            }}
            className="block min-h-10 min-w-0 flex-1 resize-none border-none bg-transparent py-2.5 pr-3.5 pl-2 text-[12.5px] leading-normal whitespace-pre-wrap text-[#1f2530] outline-none wrap-anywhere placeholder:text-[#9ca3af]"
          />
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label={`Send: ${label}`}
          aria-busy={sending}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16a34a] text-white ${
            sending ? "cursor-wait" : "cursor-pointer hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {sending ? <Loader2 size={16} strokeWidth={2.25} className="animate-spin" /> : <Send size={16} strokeWidth={2} />}
        </button>
      </div>

      {sending && files.files.length && (progress ?? 0) < 100 ? <div className="mt-2 px-1 text-[11px] text-[#6b7280]">Uploading {progress}%…</div> : null}
      {error || files.error ? (
        <div role="alert" className="mt-2 px-1 text-[11px] font-medium text-[#b91c1c]">
          {error ?? files.error}
        </div>
      ) : null}
    </div>
  );
};

export default MessageBox;
