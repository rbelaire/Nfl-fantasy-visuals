"use client";
import { useState } from "react";

export function EmailSignup({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const company = (new FormData(e.currentTarget).get("company") as string) || "";
    try {
      const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source, company }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error ?? "That didn't go through. Try again."); setState("error"); return; }
      setState("done");
    } catch { setError("That didn't go through. Check your connection and try again."); setState("error"); }
  };
  return (
    <section className="panel p-5">
      <h2 className="text-3xl">Waiver picks, every Tuesday</h2>
      <p className="mt-1.5 max-w-prose text-mute">The top pickups for the week and why, in your inbox before waivers run. Free, and one click to unsubscribe.</p>
      {state === "done" ? (
        <p className="mt-4 font-semibold text-gold">You&apos;re on the list. Picks arrive Tuesday mornings.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
          <label htmlFor={`email-${source}`} className="sr-only">Email address</label>
          <input
            id={`email-${source}`} type="email" required autoComplete="email" placeholder="you@example.com" value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
            className="min-w-0 flex-1 basis-56 rounded-lg border border-rule bg-field px-3 py-2.5 text-chalk placeholder:text-dim"
          />
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button type="submit" disabled={state === "sending"} className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-field disabled:opacity-60">
            {state === "sending" ? "Signing up…" : "Sign up"}
          </button>
        </form>
      )}
      {state === "error" && <p role="alert" className="mt-2 text-sm text-[#ff8a8a]">{error}</p>}
    </section>
  );
}
