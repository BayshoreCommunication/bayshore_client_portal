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
    <div
      className={`flex items-center gap-1.25 text-xs font-bold ${direction === "up" ? "text-[#16a34a]" : "text-[#dc2626]"}`}
    >
      <Icon size={12} strokeWidth={2.5} /> {value} {note ? <span className="font-medium text-[#8496a3]">{note}</span> : null}
    </div>
  );
};

export default Trend;
