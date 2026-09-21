import { ChevronDown, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

const Topbar = ({ name, initials }: { name: string; initials: string }) => {
  return (
    <div className="top-bar">
      <div className="top-left-selector">
        <span>{name} Dashboard</span>
        <ChevronDown size={14} strokeWidth={2} />
      </div>
      <div className="top-right">
        <div className="circle-btn" style={{ background: "#0b1522" }}>
          {initials}
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "white",
              border: "1px solid #dbe3de",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#556877",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Topbar;
