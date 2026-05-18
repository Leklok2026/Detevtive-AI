import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Lock, Star, ChevronRight } from "lucide-react";
import { usePurchaseCase, useGetSettings, useGetPlayer, getGetPlayerQueryKey, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";

export default function PremiumPage() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) setLocation("/enter");
  }, [sessionId, setLocation]);

  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const { data: player } = useGetPlayer(
    { sessionId: sessionId ?? "" },
    { query: { enabled: !!sessionId, queryKey: getGetPlayerQueryKey({ sessionId: sessionId ?? "" }) } }
  );

  const purchaseCase = usePurchaseCase();

  const handlePurchase = () => {
    if (!sessionId) return;
    purchaseCase.mutate(
      { data: { sessionId, caseId: 0 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey({ sessionId: sessionId ?? "" }) });
          setLocation("/");
        },
      }
    );
  };

  if (!sessionId) return null;

  const amount = settings?.paymentAmount ?? 499;

  if (player?.hasPaid || player?.paymentExempt) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-cinzel text-xl font-bold text-foreground mb-2">لديك وصول كامل</h2>
        <p className="text-muted-foreground text-sm mb-6">جميع القضايا متاحة لك</p>
        <Link href="/" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all inline-block">
          العودة للقضايا
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 gold-glow">
          <Lock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-cinzel text-3xl font-black text-primary mb-2">افتح جميع القضايا</h1>
        <p className="text-muted-foreground text-sm" dir="rtl">
          للوصول لجميع القضايا المميزة، قم بالاشتراك في الباقة الاحترافية
        </p>
      </div>

      <div className="bg-card border border-primary/30 rounded-2xl p-6 mb-6 gold-glow">
        <div className="text-center mb-6">
          <div className="font-cinzel text-4xl font-black text-primary mb-1">
            ${(amount / 100).toFixed(2)}
          </div>
          <div className="text-muted-foreground text-xs">دفعة واحدة — وصول مدى الحياة</div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            "وصول لجميع القضايا المميزة",
            "جميع القضايا المستقبلية",
            "أولوية الوصول للقضايا الجديدة",
            "شارة المحقق المحترف",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" dir="rtl">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>

        <button
          data-testid="button-purchase"
          onClick={handlePurchase}
          disabled={purchaseCase.isPending}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold tracking-wider uppercase text-sm hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {purchaseCase.isPending ? "جاري..." : (
            <>
              اشترك الآن
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ربما لاحقاً
        </Link>
      </div>
    </div>
  );
}
