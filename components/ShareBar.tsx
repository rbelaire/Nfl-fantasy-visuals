"use client";
import { useState } from "react";

/** Download a share image, and copy the page link (or use the phone's share sheet). */
export function ShareBar({ image, file, label = "Download image", title }: { image: string; file: string; label?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) await navigator.share({ url, title: title ?? document.title });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch {}
  };
  return (
    <div className="flex flex-wrap gap-2">
      <a href={image} download={file} className="rounded-md bg-gold px-4 py-2 font-semibold text-field">{label}</a>
      <button type="button" onClick={share} className="rounded-md border border-rule px-4 py-2 font-semibold">{copied ? "Link copied" : "Share link"}</button>
    </div>
  );
}
