import {
  AppWindow,
  Bot,
  Camera,
  Cpu,
  FileText,
  Gem,
  Globe,
  Mail,
  Megaphone,
  MessageSquareText,
  MonitorCog,
  MonitorSmartphone,
  MousePointerClick,
  PenTool,
  Plane,
  Printer,
  Repeat2,
  Shapes,
  Share2,
  ShoppingCart,
  Sparkles,
  SquarePlay,
  Star,
  Store,
  SwatchBook,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Everything BayShore offers, for the client to read and request from the Services page. Each
// group has its own color: `color` for icons and text, `soft` for the tint behind them.

export type CatalogItem = {
  name: string;
  icon: LucideIcon;
  popular?: boolean;
  isNew?: boolean;
  description: string;
  includes: string[];
  helps: string;
  // How a service of the client's with another name is told to be this one.
  match?: RegExp;
};

export type CatalogGroup = {
  id: string;
  name: string;
  icon: LucideIcon;
  blurb: string;
  color: string;
  soft: string;
  items: CatalogItem[];
};

export const SERVICE_GROUPS: CatalogGroup[] = [
  {
    id: "org",
    name: "Organic Growth",
    icon: TrendingUp,
    color: "#2f855a",
    soft: "#e4f4ea",
    blurb: "Get found by customers already searching for what you sell. No ad spend required.",
    items: [
      {
        name: "Answer Engine Optimization (AEO)",
        icon: MessageSquareText,
        isNew: true,
        description: "We shape your content so AI assistants like ChatGPT, Google AI Overviews and Perplexity recommend your business when people ask.",
        includes: ["Answer-ready FAQ & service content", "Schema / structured data markup", "AI search visibility tracking"],
        helps: "Gets you named in AI answers, the fastest-growing way people find businesses.",
      },
      {
        name: "Reviews & Reputation",
        icon: Star,
        description: "We help you collect more 5-star reviews and respond to every review professionally.",
        includes: ["Review request campaigns", "Review monitoring & replies", "Reputation reports"],
        helps: "Builds trust so new customers choose you over competitors.",
      },
      {
        name: "Content & Blog Writing",
        icon: FileText,
        description: "Helpful articles and website pages written for your customers and optimized for search.",
        includes: ["Monthly blog posts", "Service & location pages", "Content strategy plan"],
        helps: "Answers customer questions and keeps traffic growing long-term.",
      },
      {
        name: "Local Listings & Citations",
        icon: Store,
        description: "We get your business listed correctly on directories like Yelp, Bing, Apple Maps and more.",
        includes: ["Directory submissions", "Name/address/phone cleanup", "Duplicate removal"],
        helps: "Stronger local rankings and fewer customers lost to wrong info.",
      },
      {
        name: "Email Marketing",
        icon: Mail,
        description: "Newsletters and automated emails that keep past customers coming back.",
        includes: ["Newsletter design & writing", "Automated follow-ups", "List growth & reporting"],
        helps: "Turns one-time buyers into repeat customers.",
      },
    ],
  },
  {
    id: "soc",
    name: "Organic Social Media",
    icon: Share2,
    color: "#d6336c",
    soft: "#fde7ef",
    blurb: "Show up consistently where your customers spend their time, and build a real community.",
    items: [
      {
        name: "Community Management",
        icon: Users,
        description: "We respond to comments and messages quickly and in your brand's voice.",
        includes: ["Comment & DM monitoring", "Lead hand-off to your team", "Monthly engagement report"],
        helps: "No missed leads, and followers who feel heard.",
      },
      {
        name: "Reels & Short-Form Video",
        icon: SquarePlay,
        description: "Scroll-stopping short videos for Instagram Reels, TikTok and YouTube Shorts.",
        includes: ["Concept & scripting", "Editing with captions & music", "Posting & trend tracking"],
        helps: "Reaches new audiences faster than any other content type.",
      },
    ],
  },
  {
    id: "ads",
    name: "Paid Advertising",
    icon: Megaphone,
    color: "#2563eb",
    soft: "#e3edfd",
    blurb: "Reach the right people right now, with campaigns built to generate leads and sales.",
    items: [
      {
        name: "Meta Ads",
        icon: Target,
        popular: true,
        description: "Targeted ad campaigns across Facebook and Instagram, built around your goals.",
        includes: ["Audience targeting & setup", "Ad creative & copy", "Weekly optimization"],
        helps: "A steady flow of leads you can scale up or down anytime.",
      },
      {
        name: "Facebook Ads",
        icon: ThumbsUp,
        description: "Facebook-focused campaigns for local reach, events, offers and lead forms.",
        includes: ["Lead form & offer campaigns", "Local radius targeting", "Monthly results report"],
        helps: "Fills your calendar with inquiries from your local area.",
      },
      {
        name: "Google Ads",
        icon: MousePointerClick,
        description: "Appear at the top of Google the moment someone searches for your service.",
        includes: ["Search & Maps campaigns", "Keyword & budget management", "Call & conversion tracking"],
        helps: "Captures customers at the exact moment they're ready to buy.",
      },
      {
        name: "Retargeting Campaigns",
        icon: Repeat2,
        description: "Ads that follow up with people who visited your site but didn't take action.",
        includes: ["Website pixel setup", "Custom audience ads", "Cross-platform follow-up"],
        helps: "Brings back warm visitors and lifts your conversion rate.",
      },
    ],
  },
  {
    id: "brand",
    name: "Business Branding",
    icon: Gem,
    color: "#c2551b",
    soft: "#fdece0",
    blurb: "Look professional and memorable everywhere your customers see you.",
    items: [
      {
        name: "Logo Design",
        icon: PenTool,
        description: "A custom, original logo that captures who you are and works everywhere.",
        includes: ["Multiple concepts", "Revisions until it's right", "All file formats delivered"],
        helps: "A strong first impression customers remember.",
      },
      {
        name: "Brand Identity & Guidelines",
        icon: SwatchBook,
        description: "Your full visual system: colors, fonts, voice and rules for using them.",
        includes: ["Color palette & typography", "Brand voice guide", "Brand guidelines document"],
        helps: "Makes every touchpoint look consistent and trustworthy.",
      },
      {
        name: "Graphic Design",
        icon: Shapes,
        popular: true,
        description: "Professional graphics for social posts, ads, flyers, menus, presentations and more.",
        includes: ["Social & ad graphics", "Flyers, menus & signage", "Presentation design"],
        helps: "Polished marketing that reflects the quality of your work.",
      },
      {
        name: "Print & Marketing Materials",
        icon: Printer,
        description: "Business cards, brochures, banners and vehicle wraps designed and print-ready.",
        includes: ["Business cards & stationery", "Brochures & banners", "Print vendor coordination"],
        helps: "Makes your business look established offline, too.",
      },
    ],
  },
  {
    id: "media",
    name: "Photo & Video Production",
    icon: Video,
    color: "#7c3aed",
    soft: "#efe6fd",
    blurb: "Real, professional content of your team, space and work. No stock photos.",
    items: [
      {
        name: "Photography",
        icon: Camera,
        description: "Professional photos of your team, products, space and work.",
        includes: ["On-site photo shoot", "Edited high-res images", "Web & social-ready sizes"],
        helps: "Makes your website, listings and ads look premium.",
      },
      {
        name: "Drone & Aerial Footage",
        icon: Plane,
        description: "Eye-catching aerial photos and video of your property, projects or events.",
        includes: ["Licensed drone pilot", "Aerial photos & video", "Edited highlight clips"],
        helps: "Shows off scale and location in a way nothing else can.",
      },
    ],
  },
  {
    id: "web",
    name: "Website",
    icon: Globe,
    color: "#3b5bab",
    soft: "#e3e9f6",
    blurb: "A fast, modern website that turns visitors into customers.",
    items: [
      {
        name: "Website Development",
        icon: MonitorSmartphone,
        popular: true,
        description: "A brand-new, mobile-friendly website designed around your business and customers.",
        includes: ["Custom design", "Mobile-ready & SEO-friendly", "Contact & booking forms"],
        helps: "Your 24/7 salesperson, built to convert visitors into leads.",
      },
      {
        name: "Website Rebuild",
        icon: MonitorCog,
        description: "Modernize an outdated or slow website without losing your search rankings.",
        includes: ["Fresh design & structure", "Speed & mobile upgrades", "Safe content migration"],
        helps: "A better first impression and more inquiries from the same traffic.",
      },
      {
        name: "E-commerce Store",
        icon: ShoppingCart,
        description: "Sell your products online with a store that's easy for you to manage.",
        includes: ["Store setup & product pages", "Secure checkout & payments", "Inventory & order tools"],
        helps: "Opens a new revenue stream that works around the clock.",
      },
    ],
  },
  {
    id: "tech",
    name: "AI & Business Technology",
    icon: Sparkles,
    color: "#0e7490",
    soft: "#dff3f7",
    blurb: "Save time and run smarter with tools built for how your business works.",
    items: [
      {
        name: "Business AI Integration",
        icon: Cpu,
        popular: true,
        description: "We bring practical AI into your daily work, from answering questions to drafting content.",
        includes: ["AI workflow assessment", "Tool setup & training", "Ongoing support"],
        helps: "Hours back every week for you and your team.",
      },
      {
        name: "AI Chatbot for Your Website",
        icon: Bot,
        description: "A smart assistant that answers customer questions and captures leads 24/7.",
        includes: ["Trained on your business info", "Lead capture & booking", "Hand-off to your team"],
        helps: "Never miss a lead, even after hours.",
      },
      {
        name: "Business Software Development",
        icon: AppWindow,
        description: "Custom software, portals and internal tools built for exactly how you operate.",
        includes: ["Discovery & planning", "Custom build & testing", "Training & maintenance"],
        helps: "Replaces spreadsheets and manual work with one clean system.",
      },
      {
        name: "Automation & Integrations",
        icon: Workflow,
        description: "Connect your apps (CRM, email, forms, calendar) so work flows automatically.",
        includes: ["Process mapping", "App connections & automations", "Error monitoring"],
        helps: "Fewer manual tasks and fewer things slipping through.",
      },
    ],
  },
];

// The group a service of the client's belongs with, guessed from its name, for the color of
// its chip at the top of the page.
const GROUP_HINTS: [RegExp, string][] = [
  [/social|instagram|facebook post|reel|tiktok|community/i, "soc"],
  [/ads|ppc|paid|campaign|retarget/i, "ads"],
  [/logo|brand|graphic|print/i, "brand"],
  [/photo|video|drone|film/i, "media"],
  [/ai\b|chatbot|software|automation|integration/i, "tech"],
  [/web|site|hosting|e-?commerce|store/i, "web"],
  [/seo|aeo|search|google|maps|review|reputation|content|blog|listing|citation|email/i, "org"],
];
export const groupOfName = (name: string) => SERVICE_GROUPS.find((group) => group.id === GROUP_HINTS.find(([pattern]) => pattern.test(name))?.[1]) ?? SERVICE_GROUPS[5];

// A shorter name: "Search Engine Optimization (SEO)" is SEO, and "Google Business
// Profile Management" is Google Business Profile.
export const shortNameOf = (name: string) => name.match(/\(([^)]+)\)\s*$/)?.[1] ?? name.replace(/\s+management$/i, "");
