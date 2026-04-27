import { Card } from "@/components/ui/card";
import akuaKwame from "@/assets/couples/akua-kwame.jpg";
import esiYaw from "@/assets/couples/esi-yaw.jpg";
import amaKofi from "@/assets/couples/ama-kofi.jpg";
import adwoaNana from "@/assets/couples/adwoa-nana.jpg";
import afiaKojo from "@/assets/couples/afia-kojo.jpg";

export interface Couple {
  id: string;
  names: string;
  location: string;
  story: string;
  image: string;
}

export const SAMPLE_COUPLES: Couple[] = [
  { id: "1", names: "Akua & Kwame", location: "Accra → London", story: "Met on GH SUƆMƆ, married in 8 months.", image: akuaKwame },
  { id: "2", names: "Esi & Yaw", location: "Kumasi", story: "Both widowed. Found joy again at 52.", image: esiYaw },
  { id: "3", names: "Ama & Kofi", location: "Toronto", story: "Diaspora love story — 3 years strong.", image: amaKofi },
  { id: "4", names: "Adwoa & Nana", location: "New York", story: "Pen-palled for months before meeting in Accra.", image: adwoaNana },
  { id: "5", names: "Afia & Kojo", location: "Manchester", story: "Faith, family, and a shared love of jollof.", image: afiaKojo },
];

export function CoupleCard({ couple }: { couple: Couple }) {
  return (
    <Card className="min-w-[220px] max-w-[220px] shrink-0 rounded-2xl border-2 border-ghana-gold/40 bg-card p-4 shadow-card">
      <img
        src={couple.image}
        alt={`${couple.names} — ${couple.location}`}
        loading="lazy"
        width={512}
        height={512}
        className="mb-2 h-32 w-full rounded-xl object-cover"
      />
      <h4 className="font-display text-base font-bold text-foreground">{couple.names}</h4>
      <p className="text-xs text-muted-foreground">{couple.location}</p>
      <p className="mt-2 text-xs leading-snug text-foreground/90">{couple.story}</p>
    </Card>
  );
}