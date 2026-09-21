export type ContentType = "image" | "video" | "blog";

export type ContentComment = {
  author: "client" | "team";
  name?: string;
  date: string;
  text: string;
};

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  meta: string;
  status: "waiting" | "approved";
  img?: string;
  imgAlt?: string;
  caption?: string;
  tags: string[];
  comments?: ContentComment[];
  docName?: string;
  docTitle?: string;
  docLink?: string;
  approvedFooter?: string;
  sentReason?: string;
};

export const INDIVIDUAL_CONTENT = "Individual Content";

export const contentBatches: Record<string, ContentItem[]> = {
  "September 2026": [
    {
      id: "sep-slip-fall",
      type: "image",
      title: "Slip & Fall — Static Post",
      meta: "Submitted Sep 10 by BayShore Communication",
      status: "waiting",
      img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&q=80",
      imgAlt: "Slip and fall static post graphic",
      caption:
        "Slip & fall? It could be worse than it seems 🙁 If unsafe conditions caused your pain, we'll fight for your compensation — and we won't ask for a penny unless we win! Call Carter Injury Law now for a FREE consultation at (813) 922-0228.",
      tags: ["#SlipAndFall", "#CarterInjuryLaw", "Facebook · Instagram · LinkedIn"],
    },
    {
      id: "sep-car-wreck-reel",
      type: "video",
      title: "Car Wreck? We've Got You Covered — Reel",
      meta: "Re-submitted Sep 12 by BayShore Communication",
      status: "waiting",
      caption:
        "Car wreck? 🚗💥 We'll handle the headache while you recover! No fees unless we win 💪 Call now for your FREE consultation at (813) 922-0228.",
      tags: ["#CarWreck", "Instagram Reels · TikTok", "0:32"],
      comments: [
        {
          author: "client",
          date: "Sep 9",
          text: "Feels a little slow to start — can we trim the first 3 seconds before the hook kicks in?",
        },
        {
          author: "team",
          name: "Jordan Reyes · BayShore",
          date: "Sep 12",
          text: "Trimmed the intro and tightened the cut — ready for another look 👍",
        },
      ],
    },
    {
      id: "sep-product-liability",
      type: "blog",
      title: "Blog — Product Liability Guide",
      meta: "Submitted Sep 11 by BayShore Communication",
      status: "approved",
      docName: "Understanding Product Liability",
      docTitle: "Understanding Product Liability: What Consumers Need to Know",
      docLink: "https://docs.google.com/document/d/understanding-product-liability-fl",
      tags: ["2 graphics", "~1,150 words"],
      approvedFooter: "Approved by Carter Injury Law on Sep 12, 2026",
    },
  ],
  "August 2026": [
    {
      id: "aug-labor-day",
      type: "image",
      title: "Labor Day — Static Post",
      meta: "Submitted Aug 20 by BayShore Communication",
      status: "approved",
      img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80",
      imgAlt: "Labor Day static post graphic",
      caption:
        "Honoring the hardworking people of Tampa Bay this Labor Day 🎉 If a workplace injury has held you back, Carter Injury Law is here to help. Call (813) 922-0228 for a FREE consultation.",
      tags: ["#LaborDay", "#CarterInjuryLaw", "Facebook · Instagram"],
      approvedFooter: "Approved by Carter Injury Law on Aug 22, 2026",
    },
    {
      id: "aug-medical-injury",
      type: "image",
      title: "Medical Injury — Static Post",
      meta: "Submitted Aug 18 by BayShore Communication",
      status: "approved",
      img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80",
      imgAlt: "Medical injury static post graphic",
      caption:
        "Medical mistakes shouldn't cost you your health. If you or a loved one has been affected by medical negligence, we can help. Call Carter Injury Law today at (813) 922-0228.",
      tags: ["#MedicalInjury", "#CarterInjuryLaw", "Facebook · LinkedIn"],
      approvedFooter: "Approved by Carter Injury Law on Aug 22, 2026",
    },
  ],
  [INDIVIDUAL_CONTENT]: [
    {
      id: "ind-labor-weekend",
      type: "image",
      title: "Labor Day Weekend Flash Promo — Static Post",
      meta: "Submitted Sep 15 by BayShore Communication",
      status: "waiting",
      img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80",
      imgAlt: "Labor Day weekend flash promo graphic",
      caption:
        "This Labor Day Weekend only: FREE case reviews, 24/7 📞 If you or a loved one was hurt, don't wait — call Carter Injury Law at (813) 922-0228 before the weekend's over.",
      tags: ["#LaborDayWeekend", "#CarterInjuryLaw", "Facebook · Instagram"],
      sentReason: "Time-sensitive holiday weekend post — needed to go out before the regular monthly batch.",
    },
  ],
};

export const MONTH_OPTIONS = [
  { value: "September 2026", label: "September 2026 (Latest)" },
  { value: "August 2026", label: "August 2026" },
];
