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

export type AppMode = "romance" | "spark";

export interface ModeTagged {
  label: string;
  modes: AppMode[];
}

/**
 * Interests catalog. `modes` declares which member pools an interest is valid for.
 * Items tagged only with "spark" are blocked in Romance mode and vice versa.
 */
export const INTERESTS_CATALOG: ModeTagged[] = [
  { label: "Faith",         modes: ["romance"] },
  { label: "Family",        modes: ["romance"] },
  { label: "Cooking",       modes: ["romance", "spark"] },
  { label: "Travel",        modes: ["romance", "spark"] },
  { label: "Music",         modes: ["romance", "spark"] },
  { label: "Reading",       modes: ["romance", "spark"] },
  { label: "Gardening",     modes: ["romance"] },
  { label: "Football",      modes: ["romance", "spark"] },
  { label: "Movies",        modes: ["romance", "spark"] },
  { label: "Politics",      modes: ["romance"] },
  { label: "Business",      modes: ["romance", "spark"] },
  { label: "Volunteering",  modes: ["romance"] },
  { label: "Dance",         modes: ["romance", "spark"] },
  { label: "Hiking",        modes: ["romance", "spark"] },
  { label: "Art",           modes: ["romance", "spark"] },
  { label: "Photography",   modes: ["romance", "spark"] },
  { label: "Fitness",       modes: ["romance", "spark"] },
  { label: "Fashion",       modes: ["romance", "spark"] },
  // Spark-only
  { label: "Nightlife",     modes: ["spark"] },
  { label: "Discretion",    modes: ["spark"] },
  { label: "Weekend escapes", modes: ["spark"] },
];

export const PROMPTS_CATALOG: ModeTagged[] = [
  { label: "What I'm looking for in a partner is…",        modes: ["romance"] },
  { label: "A perfect Sunday for me looks like…",          modes: ["romance", "spark"] },
  { label: "The proudest moment of my life so far…",       modes: ["romance"] },
  { label: "My family means to me…",                       modes: ["romance"] },
  { label: "Something not many people know about me…",     modes: ["romance", "spark"] },
  { label: "If I could move anywhere in Ghana, I would choose…", modes: ["romance", "spark"] },
  // Spark-only
  { label: "What I want from a casual connection is…",     modes: ["spark"] },
  { label: "My idea of a memorable night out is…",         modes: ["spark"] },
];

export function interestsForMode(mode: AppMode): string[] {
  return INTERESTS_CATALOG.filter((i) => i.modes.includes(mode)).map((i) => i.label);
}

export function promptsForMode(mode: AppMode): string[] {
  return PROMPTS_CATALOG.filter((p) => p.modes.includes(mode)).map((p) => p.label);
}

export function isInterestAllowed(label: string, mode: AppMode): boolean {
  const item = INTERESTS_CATALOG.find((i) => i.label === label);
  return !item || item.modes.includes(mode);
}

export function isPromptAllowed(label: string, mode: AppMode): boolean {
  const item = PROMPTS_CATALOG.find((p) => p.label === label);
  return !item || item.modes.includes(mode);
}

// Back-compat: existing Onboarding code imports these flat arrays.
// Default to the Romance catalog (the original list).
export const INTERESTS = interestsForMode("romance");
export const PROMPTS = promptsForMode("romance");

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