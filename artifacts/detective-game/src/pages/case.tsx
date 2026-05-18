import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowRight, FileText, User, ChevronRight, Star } from "lucide-react";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= count ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

const PERSONALITY_COLORS: Record<string, string> = {
  calm: "text-blue-400",
  nervous: "text-yellow-400",
  angry: "text-red-400",
  defensive: "text-orange-400",
  crying: "text-purple-400",
};

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const caseId = parseInt(params.id, 10);

  useEffect(() => {
    if (!sessionId) setLocation("/enter");
  }, [sessionId, setLocation]);

  const { data: caseData, isLoading } = useGetCase(caseId, {
    query: { enabled: !isNaN(caseId), queryKey: getGetCaseQueryKey(caseId) },
  });

  if (!sessionId) return null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-card rounded animate-pulse w-1/3" />
        <div className="h-48 bg-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-card rounded-xl animate-pulse" />
          <div className="h-40 bg-card rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">القضية غير موجودة</p>
        <Link href="/" className="text-primary text-sm mt-4 inline-block">العودة للقضايا</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors" data-testid="button-back">
        <ArrowRight className="w-4 h-4" />
        العودة للقضايا
      </button>

      {/* Case Header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/60 via-primary/60 to-accent/60" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{caseData.crimeType}</div>
            <h1 className="font-cinzel text-2xl font-black text-foreground" dir="rtl">{caseData.title}</h1>
            <p className="text-muted-foreground text-sm mt-1" dir="rtl">{caseData.location}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StarRating count={caseData.difficulty} />
            <div className="text-xs text-primary font-medium">{caseData.reward} نقطة</div>
          </div>
        </div>

        <p className="text-foreground/80 text-sm leading-relaxed border-t border-border/50 pt-4" dir="rtl">
          {caseData.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Evidence */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">الأدلة المتاحة</h2>
          </div>
          <ul className="space-y-2">
            {caseData.evidenceList.map((ev, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80" dir="rtl">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {ev}
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              المشتبه بهم ({caseData.suspects.length})
            </h2>
          </div>
          <div className="text-sm text-muted-foreground mb-6" dir="rtl">
            لديك <span className="text-foreground font-semibold">{caseData.suspects.length}</span> مشتبهين للاستجواب.
            واحد منهم فقط هو القاتل الحقيقي. استخدم أسئلتك بذكاء.
          </div>
          <Link
            href={`/accuse/${caseData.id}`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 text-sm font-medium transition-all"
            data-testid="button-accuse"
          >
            اتهم الآن
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Suspects Grid */}
      <div>
        <h2 className="font-cinzel text-lg font-bold text-foreground mb-4">المشتبه بهم</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseData.suspects.map((suspect) => (
            <div
              key={suspect.id}
              data-testid={`card-suspect-${suspect.id}`}
              className="suspect-card bg-card border border-border rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setLocation(`/interrogate/${caseData.id}/${suspect.id}`)}
            >
              {/* Photo placeholder */}
              <div className="relative h-32 bg-gradient-to-br from-muted to-card flex items-center justify-center border-b border-border">
                {suspect.photoUrl ? (
                  <img src={suspect.photoUrl} alt={suspect.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted-foreground/10 border border-border flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors" dir="rtl">
                  {suspect.name}
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5" dir="rtl">{suspect.role}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-0.5" title="مستوى المراوغة">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-3 rounded-full ${i < Math.ceil(suspect.deceptionLevel / 2) ? "bg-destructive" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    استجواب
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
