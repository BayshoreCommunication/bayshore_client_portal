export type ApprovalStatus = "waiting" | "approved" | "revision" | "declined";

const LABELS: Record<ApprovalStatus, string> = {
  waiting: "Waiting for Approval",
  approved: "Approved",
  revision: "Waiting for Revision",
  declined: "Declined",
};

const DANGER_STYLE = { background: "#fbdada", color: "#b91c1c" };

const StatusPill = ({
  status,
  label,
  style,
}: {
  status: ApprovalStatus;
  label?: string;
  style?: React.CSSProperties;
}) => {
  const isDanger = status === "revision" || status === "declined";
  const className = `status-pill-lg${
    status === "approved" ? " status-approved" : status === "waiting" ? " status-waiting" : ""
  }`;

  return (
    <span className={className} style={{ ...(isDanger ? DANGER_STYLE : {}), ...style }}>
      <span
        className="status-dot-sm"
        style={isDanger ? { background: "#dc2626" } : undefined}
      />{" "}
      {label ?? LABELS[status]}
    </span>
  );
};

export default StatusPill;
