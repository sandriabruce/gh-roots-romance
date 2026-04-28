import { SafetyBanner } from "@/components/safety/SafetyBanner";
import { Card } from "@/components/ui/card";

const FLAGS = [
  "Asks for money, gift cards, or crypto — even small amounts",
  "Pushes to move chat off GH SUƆMƆ to WhatsApp or Telegram",
  "Story changes or doesn't add up; refuses video calls",
  "Claims to be stranded, sick, or in trouble after short contact",
  "Sends overly polished photos that look stock or AI-generated",
];

export default function Safety() {
  return (
    <div className="space-y-4">
      <SafetyBanner variant="warn" message="If something feels off, it probably is. Report and block — we'll review within 24 hours." />
      <h1 className="heading-gold font-display text-2xl font-bold">Stay safe on GH SUƆMƆ</h1>
      <Card className="rounded-2xl p-4">
        <h2 className="font-display text-lg font-bold text-ghana-red">Red flags</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {FLAGS.map((f) => <li key={f} className="flex gap-2"><span className="text-ghana-red">•</span><span>{f}</span></li>)}
        </ul>
      </Card>
    </div>
  );
}