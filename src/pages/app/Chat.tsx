import { SafetyBanner } from "@/components/safety/SafetyBanner";

export default function Chat() {
  return (
    <div className="space-y-4">
      <SafetyBanner variant="warn" message="Never share phone numbers, WhatsApp, or money requests. Report anything suspicious." />
      <h1 className="font-display text-2xl font-bold text-ghana-brown">Chat</h1>
      <p className="text-sm text-muted-foreground">Open a conversation from Matches.</p>
    </div>
  );
}