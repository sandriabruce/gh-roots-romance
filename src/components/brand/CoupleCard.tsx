import { Card } from "@/components/ui/card";

export interface Couple {
  id: string;
  names: string;
  location: string;
  story: string;
}

export const SAMPLE_COUPLES: Couple[] = [
  { id: "1", names: "Akua & Kwame", location: "Accra → London", story: "Met on GH SUƆMƆ, married in 8 months." },
  { id: "2", names: "Esi & Yaw", location: "Kumasi", story: "Both widowed. Found joy again at 52." },
  { id: "3", names: "Ama & Kofi", location: "Toronto", story: "Diaspora love story — 3 years strong." },
  { id: "4", names: "Adwoa & Nana", location: "New York", story: "Pen-palled for months before meeting in Accra." },
  { id: "5", names: "Afia & Kojo", location: "Manchester", story: "Faith, family, and a shared love of jollof." },
];

export function CoupleCard({ couple }: { couple: Couple }) {
  return (
    <Card className="min-w-[220px] max-w-[220px] shrink-0 rounded-2xl border-2 border-ghana-gold/40 bg-card p-4 shadow-card">
      <div className="mb-2 h-24 rounded-xl bg-gradient-romance" />
      <h4 className="font-display text-base font-bold text-ghana-brown">{couple.names}</h4>
      <p className="text-xs text-muted-foreground">{couple.location}</p>
      <p className="mt-2 text-xs leading-snug text-foreground/80">{couple.story}</p>
    </Card>
  );
}