import { useEffect } from "react";
import { useLocation } from "wouter";
import { Star, MapPin, Lock, ChevronRight, Trophy, AlertCircle, Sparkles } from "lucide-react";
import { useListCases, useGetPlayer, useGetPlayerProgress, getGetPlayerQueryKey, getGetPlayerProgressQueryKey } from "@workspace/api-client-react";
import type { Case } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import SeasonCountdown from "@/components/season-countdown";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "سهل",
  2: "متوسط",
  3: "صعب",
  4: "خبير",
  5: "ماستر",
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  2: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  3: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  4: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  5: "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

const CRIME_COLORS: Record<string, string> = {
  "جريمة قتل": "bg-rose-900/40 text-rose-300",
  "سرقة": "bg-blue-900/40 text-blue-300",
  "اختفاء مشبوه": "bg-purple-900/40 text-purple-300",
  "قتل بالسلاح الناري": "bg-red-900/40 text-red-300",
  "احتيال وقتل": "bg-orange-900/40 text-orange-300",
  "طعن": "bg-pink-900/40 text-pink-300",
  "خنق": "bg-rose-900/40 text-rose-300",
  "تسميم": "bg-green-900/40 text-green-300",
  "قتل منظم": "bg-red-900/40 text-red-300",
  "قتل داخل الجهاز الأمني": "bg-slate-900/40 text-slate-300",
};

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= count ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function isExpired(endDate: string | null | undefined): boolean {
  if (!endDate) return false;
  return new Date(endDate).getTime() < Date.now();
}

export default function Home() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();

  useEffect(() => {
    if (!sessionId) setLocation("/enter");
  }, [sessionId, setLocation]);

  const { data: cases, isLoading } = useListCases();
  const { data: player } = useGetPlayer(
    { sessionId: sessionId ?? "" },
    { query: { enabled: !!sessionId, queryKey: getGetPlayerQueryKey({ sessionId: sessionId ?? "" }) } }
  );
  const { data: progress } = useGetPlayerProgress(
    { sessionId: sessionId ?? "" },
    { query: { enabled: !!sessionId, queryKey: getGetPlayerProgressQueryKey({ sessionId: sessionId ?? "" }) } }
  );

  const solvedCaseIds = new Set(progress?.filter((p) => p.isSolved).map((p) => p.caseId) ?? []);
  const solvedCount = solvedCaseIds.size;
  const totalCases = cases?.length ?? 0;

  const seasonalCases = cases?.filter((c) => c.isSeasonal && !isExpired(c.seasonEndDate)) ?? [];
  const regularCases = cases?.filter((c) => !c.isSeasonal || isExpired(c.seasonEndDate)) ?? [];

  if (!sessionId) return null;

  const renderCaseCard = (c: Case) => {
    const isSolved = solvedCaseIds.has(c.id);
    const expired = isExpired(c.seasonEndDate);
    const isLocked = c.isPremium && !player?.hasPaid && !player?.paymentExempt;

    const seasonColor = c.seasonColor ?? "#d4af37";

    return (
      <div
        key={c.id}
        data-testid={`card-case-${c.id}`}
        className="suspect-card relative bg-card border rounded-xl overflow-hidden group cursor-pointer"
        style={c.isSeasonal && !expired ? { borderColor: `${seasonColor}40` } : {}}
        onClick={() => {
          if (isLocked) {
            setLocation("/premium");
          } else {
            setLocation(`/case/${c.id}`);
          }
        }}
      >
        {/* Top accent bar */}
        {c.isSeasonal && !expired ? (
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${seasonColor}80, ${seasonColor}, ${seasonColor}80)` }} />
        ) : (
          <div className={`h-1 w-full ${isSolved ? "bg-emerald-500" : "bg-gradient-to-r from-primary/60 to-accent/60"}`} />
        )}

        {/* Seasonal glow overlay */}
        {c.isSeasonal && !expired && (
          <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: `inset 0 0 30px ${seasonColor}08` }} />
        )}

        <div className="p-5">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFFICULTY_COLORS[c.difficulty] ?? "text-muted-foreground border-muted bg-muted/20"}`}>
              {DIFFICULTY_LABELS[c.difficulty] ?? "غير محدد"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CRIME_COLORS[c.crimeType] ?? "bg-muted/40 text-muted-foreground"}`}>
              {c.crimeType}
            </span>
            {c.isSeasonal && !expired && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border"
                style={{ color: seasonColor, borderColor: `${seasonColor}50`, background: `${seasonColor}15` }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {c.seasonName ?? "موسمي"}
              </span>
            )}
            {c.isPremium && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">
                <Lock className="w-2.5 h-2.5" />
                مميز
              </span>
            )}
            {isSolved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                محلولة ✓
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base text-foreground mb-1 group-hover:text-primary transition-colors" dir="rtl">
            {c.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3" dir="rtl">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{c.location}</span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4" dir="rtl">
            {c.description}
          </p>

          {/* Countdown for seasonal */}
          {c.isSeasonal && c.seasonEndDate && !expired && (
            <div className="mb-3 pb-3 border-b" style={{ borderColor: `${seasonColor}20` }}>
              <div className="text-xs text-muted-foreground mb-1.5" dir="rtl">ينتهي الموسم خلال:</div>
              <SeasonCountdown endDate={c.seasonEndDate} color={seasonColor} compact />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <StarRating count={c.difficulty} />
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={c.isSeasonal && !expired ? { color: seasonColor } : { color: "hsl(var(--primary))" }}
            >
              <span>ابدأ التحقيق</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Premium overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs text-primary font-medium">اضغط للفتح</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">ملف القضايا</p>
            <h1 className="font-cinzel text-3xl font-black text-foreground">القضايا المفتوحة</h1>
          </div>
          {player && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">تقدمك</div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-cinzel font-bold text-primary">{solvedCount}/{totalCases}</span>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">النقاط</div>
                <div className="font-cinzel font-bold text-foreground">{player.points}</div>
              </div>
            </div>
          )}
        </div>
        {totalCases > 0 && (
          <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
              style={{ width: `${(solvedCount / totalCases) * 100}%` }}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Seasonal Cases Section */}
          {seasonalCases.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-cinzel text-xl font-bold text-foreground">قضايا موسمية</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seasonalCases.map(renderCaseCard)}
              </div>
            </section>
          )}

          {/* Regular Cases Section */}
          {regularCases.length > 0 && (
            <section>
              {seasonalCases.length > 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-cinzel text-xl font-bold text-foreground">جميع القضايا</h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularCases.map(renderCaseCard)}
              </div>
            </section>
          )}

          {cases?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد قضايا متاحة حالياً</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
