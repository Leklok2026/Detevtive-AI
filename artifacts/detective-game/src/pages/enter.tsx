import { useState } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useCreatePlayer } from "@workspace/api-client-react";
import { generateSessionId, setSession } from "@/lib/session";

export default function Enter() {
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const createPlayer = useCreatePlayer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sessionId = generateSessionId();
    createPlayer.mutate(
      { data: { sessionId, name: name.trim() } },
      {
        onSuccess: () => {
          setSession(sessionId, name.trim());
          setLocation("/");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background crime-texture relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-destructive/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6 gold-glow">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-cinzel text-4xl font-black text-primary tracking-widest mb-2">
            محقق
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            ادخل عالم التحقيق الجنائي
          </p>
        </div>

        {/* Entry Card */}
        <div className="bg-card border border-border rounded-2xl p-8 gold-glow">
          <h2 className="font-cinzel text-lg font-semibold text-foreground mb-1 text-center">
            ابدأ تحقيقك
          </h2>
          <p className="text-muted-foreground text-xs text-center mb-6">
            أدخل اسمك لتبدأ رحلتك كمحقق
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                اسم المحقق
              </label>
              <input
                data-testid="input-detective-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك..."
                dir="rtl"
                className="w-full px-4 py-3 rounded-lg bg-background/60 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground/50 text-sm transition-all"
                maxLength={30}
                required
              />
            </div>

            <button
              data-testid="button-start-game"
              type="submit"
              disabled={!name.trim() || createPlayer.isPending}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm tracking-wider uppercase hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {createPlayer.isPending ? "جاري التحميل..." : "ابدأ التحقيق"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "10", sub: "قضية" },
                { label: "AI", sub: "مشتبه بهم" },
                { label: "5", sub: "مستويات" },
              ].map((item, i) => (
                <div key={i} className="bg-background/40 rounded-lg py-3 px-2">
                  <div className="font-cinzel text-lg font-bold text-primary">{item.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
