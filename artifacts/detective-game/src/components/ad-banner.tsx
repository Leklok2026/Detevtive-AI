import { useEffect, useRef, useState } from "react";

export type AdSlot = "header" | "content" | "sidebar";

interface AdSettings {
  enabled: boolean;
  slots: Record<AdSlot, string>;
}

export function getAdSettings(): AdSettings {
  try {
    const raw = localStorage.getItem("detective_ad_settings");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, slots: { header: "", content: "", sidebar: "" } };
}

export function setAdSettings(settings: AdSettings) {
  localStorage.setItem("detective_ad_settings", JSON.stringify(settings));
}

const SLOT_SIZES: Record<AdSlot, { w: number; h: number; label: string }> = {
  header:  { w: 728, h: 90,  label: "بانر عريض (728×90)" },
  content: { w: 336, h: 280, label: "مستطيل (336×280)" },
  sidebar: { w: 300, h: 250, label: "مربع متوسط (300×250)" },
};

interface AdBannerProps {
  slot: AdSlot;
  className?: string;
}

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  const settings = getAdSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const code = settings.slots[slot] ?? "";
  const size = SLOT_SIZES[slot];

  useEffect(() => {
    if (!settings.enabled || !code) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [settings.enabled, code]);

  useEffect(() => {
    if (!visible || !containerRef.current || !code) return;
    const container = containerRef.current;
    container.innerHTML = "";
    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(code);
    container.appendChild(fragment);
  }, [visible, code]);

  if (!settings.enabled) return null;

  if (!code) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/30 text-muted-foreground/40 text-xs font-mono ${className}`}
        style={{ width: "100%", maxWidth: size.w, height: size.h, margin: "0 auto" }}
      >
        {size.label}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ width: "100%", maxWidth: size.w, height: size.h, margin: "0 auto" }}
    />
  );
}
