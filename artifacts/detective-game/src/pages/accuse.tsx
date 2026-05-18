import { useState, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowRight, User, CheckCircle, XCircle, Star } from "lucide-react";
import { useGetCase, useSubmitGuess, getGetCaseQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";

export default function AccusePage() {
  const params = useParams<{ caseId: string }>();
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const caseId = parseInt(params.caseId, 10);

  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; message: string; pointsEarned: number } | null>(null);

  useEffect(() => {
    if (!sessionId) setLocation("/enter");
  }, [sessionId, setLocation]);

  const { data: caseData, isLoading } = useGetCase(caseId, {
    query: { enabled: !isNaN(caseId), queryKey: getGetCaseQueryKey(caseId) },
  });

  const submitGuess = useSubmitGuess();

  const handleSubmit = () => {
    if (!selected || !sessionId) return;
    submitGuess.mutate(
      { data: { caseId, sessionId, suspectId: selected } },
      {
        onSuccess: (data) => setResult(data),
      }
    );
  };

  if (!sessionId) return null;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${result.correct ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-destructive/15 border border-destructive/30"}`}>
          {result.correct ? (
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          ) : (
            <XCircle className="w-12 h-12 text-destructive" />
          )}
        </div>

        <h2 className={`font-cinzel text-2xl font-black mb-3 ${result.correct ? "text-emerald-400" : "text-destructive"}`}>
          {result.correct ? "صحيح!" : "خطأ!"}
        </h2>

        <p className="text-foreground/80 text-sm leading-relaxed mb-6 max-w-md" dir="rtl">
          {result.message}
        </p>

        {result.correct && result.pointsEarned > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 mb-8">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <span className="font-cinzel font-bold text-primary text-lg">+{result.pointsEarned} نقطة</span>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => { setResult(null); setSelected(null); }}
            className="px-6 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            data-testid="button-try-again"
          >
            حاول مجدداً
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
            data-testid="link-back-home"
          >
            قضايا أخرى
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => setLocation(`/case/${caseId}`)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        data-testid="button-back"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للقضية
      </button>

      <div className="text-center mb-8">
        <h1 className="font-cinzel text-2xl font-black text-foreground mb-2">الاتهام النهائي</h1>
        <p className="text-muted-foreground text-sm" dir="rtl">
          من تعتقد أنه المذنب؟ اختر بعناية — لديك فرصة واحدة.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {caseData?.suspects.map((suspect) => (
            <button
              key={suspect.id}
              data-testid={`button-suspect-${suspect.id}`}
              onClick={() => setSelected(suspect.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selected === suspect.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                  : "border-border bg-card hover:border-border/80 hover:bg-card/80"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {suspect.photoUrl ? (
                  <img src={suspect.photoUrl} alt={suspect.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 text-right" dir="rtl">
                <div className="font-semibold text-sm text-foreground">{suspect.name}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{suspect.role}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selected === suspect.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                {selected === suspect.id && (
                  <div className="w-full h-full rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        data-testid="button-submit-accusation"
        onClick={handleSubmit}
        disabled={!selected || submitGuess.isPending}
        className="w-full py-3.5 rounded-xl bg-destructive text-destructive-foreground font-semibold tracking-wider uppercase text-sm hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] red-glow"
      >
        {submitGuess.isPending ? "جاري..." : "أتهم هذا الشخص"}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-3" dir="rtl">
        تحذير: الاختيار الخاطئ سيخصم من سمعتك
      </p>
    </div>
  );
}
