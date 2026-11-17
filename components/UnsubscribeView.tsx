"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function UnsubscribeView() {
  const t = useSearchParams().get("t") ?? "";
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  // A button, not an automatic action, so email scanners that open links can't unsubscribe people.
  const go = async () => {
    setState("busy");
    const r = await fetch("/api/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t }) }).catch(() => null);
    if (r?.ok) setState("done");
    else { setError((await r?.json().catch(() => null))?.error ?? "That didn't go through. Try again."); setState("error"); }
  };
  return (
    <div className="max-w-xl space-y-4 py-6">
      <h1 className="text-5xl">{state === "done" ? "You're unsubscribed" : "Unsubscribe"}</h1>
      {state === "done" ? (
        <>
          <p className="text-mute">You won&apos;t get the weekly waiver email anymore. Changed your mind? Sign up again any time from the home page.</p>
          <Link href="/waivers" className="inline-block rounded-md bg-gold px-4 py-2 font-semibold text-field">Go to waivers</Link>
        </>
      ) : (
        <>
          <p className="text-mute">Stop getting the weekly waiver picks email.</p>
          <button type="button" onClick={go} disabled={state === "busy" || !t} className="rounded-md bg-gold px-5 py-2.5 font-semibold text-field disabled:opacity-60">
            {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
          {!t && <p className="text-sm text-dim">Open this page from the unsubscribe link at the bottom of the email.</p>}
          {state === "error" && <p role="alert" className="text-[#ff8a8a]">{error}</p>}
        </>
      )}
    </div>
  );
}
