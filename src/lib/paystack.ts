// Paystack publishable key — safe to expose in frontend code.
// Secret key (sk_...) must NEVER be placed here; it belongs in an edge function secret.
export const PAYSTACK_PUBLIC_KEY = "pk_live_e736afdb48b363e96ff071cff9c8ef13e0590c78";

export const isPaystackTestMode = PAYSTACK_PUBLIC_KEY.startsWith("pk_test_");