import { useState } from "react";
import { Shield, Users, BarChart3, Settings, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight, Lock } from "lucide-react";
import {
  useAdminGetStats,
  useAdminListCases,
  useAdminListPlayers,
  useAdminUpdateCase,
  useAdminDeleteCase,
  useAdminUpdatePlayer,
  useAdminUpdateSettings,
  useGetSettings,
  getAdminGetStatsQueryKey,
  getAdminListCasesQueryKey,
  getAdminListPlayersQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminKey, setAdminKey } from "@/lib/session";

const ADMIN_KEY_CORRECT = "detective123";

type Tab = "stats" | "cases" | "players" | "settings";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === ADMIN_KEY_CORRECT) {
      setAdminKey(key);
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 gold-glow">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h1 className="font-cinzel text-2xl font-black text-foreground mb-2">لوحة التحكم</h1>
      <p className="text-muted-foreground text-sm mb-8">أدخل مفتاح المشرف للدخول</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          data-testid="input-admin-key"
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(false); }}
          placeholder="مفتاح المشرف..."
          className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all text-center"
        />
        {error && <p className="text-destructive text-xs">مفتاح خاطئ</p>}
        <button
          data-testid="button-admin-login"
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
        >
          دخول
        </button>
      </form>
    </div>
  );
}

function StatsPanel({ adminKey }: { adminKey: string }) {
  const { data: stats } = useAdminGetStats(
    { adminKey },
    { query: { queryKey: getAdminGetStatsQueryKey({ adminKey }) } }
  );

  const items = [
    { label: "إجمالي اللاعبين", value: stats?.totalPlayers ?? 0, color: "text-blue-400" },
    { label: "إجمالي القضايا", value: stats?.totalCases ?? 0, color: "text-primary" },
    { label: "القضايا المنشورة", value: stats?.publishedCases ?? 0, color: "text-emerald-400" },
    { label: "القضايا المحلولة", value: stats?.totalSolvedCases ?? 0, color: "text-purple-400" },
    { label: "اللاعبون الدافعون", value: stats?.paidPlayers ?? 0, color: "text-orange-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className={`font-cinzel text-3xl font-black ${item.color} mb-1`}>{item.value}</div>
          <div className="text-muted-foreground text-xs">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function CasesPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { data: cases } = useAdminListCases(
    { adminKey },
    { query: { queryKey: getAdminListCasesQueryKey({ adminKey }) } }
  );

  const updateCase = useAdminUpdateCase();
  const deleteCase = useAdminDeleteCase();

  const togglePublish = (id: number, current: boolean) => {
    updateCase.mutate(
      { id, data: { isPublished: !current, adminKey } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCasesQueryKey({ adminKey }) }) }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه القضية؟")) return;
    deleteCase.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCasesQueryKey({ adminKey }) }) }
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="text-right py-3 pr-4">القضية</th>
            <th className="text-center py-3">الصعوبة</th>
            <th className="text-center py-3">النوع</th>
            <th className="text-center py-3">مميز</th>
            <th className="text-center py-3">النشر</th>
            <th className="text-center py-3">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {cases?.map((c) => (
            <tr key={c.id} className="hover:bg-card/50 transition-colors">
              <td className="py-3 pr-4" dir="rtl">
                <div className="font-medium text-foreground text-xs">{c.title}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{c.location}</div>
              </td>
              <td className="py-3 text-center">
                <span className="font-cinzel text-primary text-sm">{c.difficulty}</span>
              </td>
              <td className="py-3 text-center">
                <span className="text-xs text-muted-foreground">{c.crimeType}</span>
              </td>
              <td className="py-3 text-center">
                <span className={`text-xs ${c.isPremium ? "text-primary" : "text-muted-foreground"}`}>
                  {c.isPremium ? "نعم" : "لا"}
                </span>
              </td>
              <td className="py-3 text-center">
                <button
                  data-testid={`button-toggle-publish-${c.id}`}
                  onClick={() => togglePublish(c.id, c.isPublished)}
                  className={`flex items-center gap-1.5 mx-auto text-xs px-3 py-1 rounded-full border transition-all ${
                    c.isPublished
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-muted text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {c.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {c.isPublished ? "منشور" : "مخفي"}
                </button>
              </td>
              <td className="py-3 text-center">
                <button
                  data-testid={`button-delete-case-${c.id}`}
                  onClick={() => handleDelete(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayersPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { data: players } = useAdminListPlayers(
    { adminKey },
    { query: { queryKey: getAdminListPlayersQueryKey({ adminKey }) } }
  );
  const updatePlayer = useAdminUpdatePlayer();

  const toggleExempt = (id: number, current: boolean) => {
    updatePlayer.mutate(
      { id, data: { paymentExempt: !current, adminKey } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListPlayersQueryKey({ adminKey }) }) }
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="text-right py-3 pr-4">اللاعب</th>
            <th className="text-center py-3">النقاط</th>
            <th className="text-center py-3">الدفع</th>
            <th className="text-center py-3">إعفاء من الدفع</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {players?.map((p) => (
            <tr key={p.id} className="hover:bg-card/50 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-medium text-foreground text-xs">{p.name}</div>
                <div className="text-muted-foreground text-xs mt-0.5 font-mono">{p.sessionId.slice(0, 20)}...</div>
              </td>
              <td className="py-3 text-center">
                <span className="font-cinzel text-primary text-sm">{p.points}</span>
              </td>
              <td className="py-3 text-center">
                <span className={`text-xs ${p.hasPaid ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {p.hasPaid ? "دفع" : "مجاني"}
                </span>
              </td>
              <td className="py-3 text-center">
                <button
                  data-testid={`button-toggle-exempt-${p.id}`}
                  onClick={() => toggleExempt(p.id, p.paymentExempt)}
                  className="flex items-center gap-1 mx-auto"
                >
                  {p.paymentExempt ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!players || players.length === 0) && (
        <div className="text-center py-8 text-muted-foreground text-sm">لا يوجد لاعبون بعد</div>
      )}
    </div>
  );
}

function SettingsPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });
  const updateSettings = useAdminUpdateSettings();

  const togglePayment = () => {
    updateSettings.mutate(
      { data: { paymentEnabled: !settings?.paymentEnabled, adminKey } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() }) }
    );
  };

  const updateFreeTrials = (val: number) => {
    updateSettings.mutate(
      { data: { freeTrialCases: val, adminKey } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() }) }
    );
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Payment toggle */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">نظام الدفع</h3>
            <p className="text-muted-foreground text-xs">تفعيل أو تعطيل نظام الدفع للقضايا المميزة</p>
          </div>
          <button
            data-testid="button-toggle-payment"
            onClick={togglePayment}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings?.paymentEnabled ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings?.paymentEnabled ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={`text-xs font-medium ${settings?.paymentEnabled ? "text-emerald-400" : "text-muted-foreground"}`}>
            {settings?.paymentEnabled ? "مفعّل - اللاعبون يجب أن يدفعوا للقضايا المميزة" : "معطّل - جميع القضايا مجانية"}
          </span>
        </div>
      </div>

      {/* Free trials */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-1">قضايا مجانية</h3>
        <p className="text-muted-foreground text-xs mb-4">عدد القضايا المجانية قبل طلب الدفع</p>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              data-testid={`button-free-trials-${n}`}
              onClick={() => updateFreeTrials(n)}
              className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                settings?.freeTrialCases === n
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Amount info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-1">سعر الاشتراك</h3>
        <p className="text-muted-foreground text-xs mb-3">السعر الحالي للوصول الكامل</p>
        <div className="font-cinzel text-2xl font-black text-primary">
          ${((settings?.paymentAmount ?? 499) / 100).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!getAdminKey());
  const [tab, setTab] = useState<Tab>("stats");

  const adminKey = getAdminKey() ?? "";

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "الإحصائيات", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "cases", label: "القضايا", icon: <Shield className="w-4 h-4" /> },
    { id: "players", label: "اللاعبون", icon: <Users className="w-4 h-4" /> },
    { id: "settings", label: "الإعدادات", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-cinzel text-xl font-black text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground text-xs">إدارة اللعبة والقضايا واللاعبين</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-card border border-border rounded-xl p-6">
        {tab === "stats" && <StatsPanel adminKey={adminKey} />}
        {tab === "cases" && <CasesPanel adminKey={adminKey} />}
        {tab === "players" && <PlayersPanel adminKey={adminKey} />}
        {tab === "settings" && <SettingsPanel adminKey={adminKey} />}
      </div>
    </div>
  );
}
