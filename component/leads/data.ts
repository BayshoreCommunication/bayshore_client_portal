export const leadStats = [
  { label: "TOTAL LEADS", value: "84", delta: "12.0%", note: "vs Aug" },
  { label: "NEW THIS WEEK", value: "19", delta: "4.2%", note: "vs last wk" },
  { label: "QUALIFIED", value: "31", delta: "6.9%", note: "vs Aug" },
  { label: "BECAME CLIENTS", value: "22", suffix: "· 26%", delta: "3.1pt", note: "vs Aug" },
];

export type Lead = {
  name: string;
  initials: string;
  avatarColor: string;
  caseType: string;
  source: string;
  sourceColor: string;
  received: string;
  status: string;
  statusBg: string;
  statusColor: string;
};

export const leads: Lead[] = [
  { name: "Maria A.", initials: "MA", avatarColor: "#2563eb", caseType: "Car Accident", source: "GMB Call", sourceColor: "#16a34a", received: "Sep 13", status: "Consultation Set", statusBg: "#dcf3e2", statusColor: "#15803d" },
  { name: "Tyrell J.", initials: "TJ", avatarColor: "#c8973a", caseType: "Slip & Fall", source: "Website Form", sourceColor: "#c8973a", received: "Sep 13", status: "New", statusBg: "#e0e7ff", statusColor: "#4338ca" },
  { name: "Denise W.", initials: "DW", avatarColor: "#9333ea", caseType: "Car Accident", source: "Facebook", sourceColor: "#3457c9", received: "Sep 12", status: "Contacted", statusBg: "#fdf1de", statusColor: "#a35a12" },
  { name: "Marcus L.", initials: "ML", avatarColor: "#dc2626", caseType: "Product Liability", source: "Blog CTA", sourceColor: "#c8973a", received: "Sep 12", status: "Qualified", statusBg: "#fdf1de", statusColor: "#a35a12" },
  { name: "Angela R.", initials: "AR", avatarColor: "#16a34a", caseType: "Motorcycle Accident", source: "GMB Call", sourceColor: "#16a34a", received: "Sep 11", status: "Converted", statusBg: "#16a34a", statusColor: "#fff" },
  { name: "Samuel D.", initials: "SD", avatarColor: "#2f8f6f", caseType: "Car Accident", source: "GMB Call", sourceColor: "#16a34a", received: "Sep 9", status: "Consultation Set", statusBg: "#dcf3e2", statusColor: "#15803d" },
];

export const leadSources = [
  { label: "GMB", color: "#16a34a", width: 100, count: 37 },
  { label: "Website", color: "#c8973a", width: 84, count: 31 },
  { label: "Social", color: "#3457c9", width: 43, count: 16 },
];
