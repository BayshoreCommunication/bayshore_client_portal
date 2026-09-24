export type ApprovalStatus = "waiting" | "approved" | "revision" | "declined";

const LABELS: Record<ApprovalStatus, string> = {
  waiting: "Waiting for Approval",
  approved: "Approved",
  revision: "Waiting for Revision",
  declined: "Declined",
};

const STATUS_STYLES: Record<ApprovalStatus, { pill: string; dot: string }> = {
  waiting: { pill: "bg-[#fdf1de] text-[#a35a12]", dot: "bg-[#d99136]" },
  approved: { pill: "bg-[#e5f6ea] text-[#15803d]", dot: "bg-[#16a34a]" },
  revision: { pill: "bg-[#fbdada] text-[#b91c1c]", dot: "bg-[#dc2626]" },
  declined: { pill: "bg-[#fbdada] text-[#b91c1c]", dot: "bg-[#dc2626]" },
};

const StatusPill = ({
  status,
  label,
  style,
}: {
  status: ApprovalStatus;
  label?: string;
  style?: React.CSSProperties;
}) => {
  const { pill, dot } = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-bold whitespace-nowrap ${pill}`}
      style={style}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {label ?? LABELS[status]}
    </span>
  );
};

export default StatusPill;
