import { ArrowDown, ArrowUp } from "lucide-react";

const Trend = ({
  direction,
  value,
  note,
}: {
  direction: "up" | "down";
  value: string;
  note?: string;
}) => {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <div className={`dash-metric-trend ${direction === "up" ? "trend-up" : "trend-down"}`}>
      <Icon size={12} strokeWidth={2.5} /> {value} {note ? <span>{note}</span> : null}
    </div>
  );
};

export default Trend;
