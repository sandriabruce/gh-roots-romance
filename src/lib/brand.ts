export const BRAND = {
  name: "GH SUƆMƆ",
  tagline: "Roots & Romance",
} as const;

export const GHANA_CITIES = [
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast",
  "Ho", "Sunyani", "Koforidua", "Tema", "Wa",
];

export const DIASPORA_LOCATIONS = ["United Kingdom", "United States", "Canada", "Other (Europe)"];

export const ALL_LOCATIONS = [...GHANA_CITIES, ...DIASPORA_LOCATIONS];

export const RELIGIONS = ["Christian", "Muslim", "Traditional", "Spiritual but not religious", "Prefer not to say"];

export const ETHNICITIES = ["Akan", "Ewe", "Ga-Adangbe", "Mole-Dagbani", "Guan", "Other Ghanaian", "Mixed heritage"];

export const INTERESTS = [
  "Faith", "Family", "Cooking", "Travel", "Music",
  "Reading", "Gardening", "Football", "Movies", "Politics",
  "Business", "Volunteering", "Dance", "Hiking", "Art",
  "Photography", "Fitness", "Fashion",
];

export const PROMPTS = [
  "What I'm looking for in a partner is…",
  "A perfect Sunday for me looks like…",
  "The proudest moment of my life so far…",
  "My family means to me…",
  "Something not many people know about me…",
  "If I could move anywhere in Ghana, I would choose…",
];

export const REPORT_REASONS = [
  "Romance scam / asking for money",
  "Inappropriate photos",
  "Fake profile",
  "Harassment or insults",
  "Underage user",
  "Other",
];

export type Currency = "GHS" | "GBP" | "USD" | "CAD";

export interface PlanInfo {
  id: "explorer" | "verified" | "premium" | "diamond";
  name: string;
  tagline: string;
  prices: Partial<Record<Currency, number>>;
  features: string[];
}

export const PLANS: PlanInfo[] = [
  {
    id: "explorer",
    name: "Explorer",
    tagline: "Browse and explore",
    prices: { GHS: 0 },
    features: ["Browse profiles", "2 matches per week", "No chat"],
  },
  {
    id: "verified",
    name: "Verified",
    tagline: "Show you're real",
    prices: { GHS: 80 },
    features: ["Verified badge", "Browse profiles", "No chat"],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Most popular",
    prices: { GHS: 180, GBP: 12, USD: 15, CAD: 20 },
    features: ["Unlimited matches", "Unlimited chat", "Verification badge"],
  },
  {
    id: "diamond",
    name: "Diamond",
    tagline: "Concierge matchmaking",
    prices: { GHS: 350, GBP: 22, USD: 28, CAD: 38 },
    features: ["Everything in Premium", "Personal matchmaker call", "Priority profile"],
  },
];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GHS: "GH₵", GBP: "£", USD: "$", CAD: "C$",
};

export const SAFETY_TIPS = [
  "Never send money to someone you have not met in person.",
  "Be cautious of anyone declaring strong feelings within days.",
  "Watch out for excuses to avoid video calls.",
  "Keep conversations on the app — don't move to WhatsApp early.",
  "Verified badges help, but always trust your instincts.",
];

export const RED_FLAGS = [
  "Asks for money, gift cards, or mobile money 'just this once'.",
  "Story keeps changing or details don't add up.",
  "Refuses video calls or only sends old photos.",
  "Pushes very fast for marriage, visa help, or money.",
  "Claims to be Ghanaian but cannot speak any local language.",
  "Pressures you to move chat off GH SUƆMƆ immediately.",
];