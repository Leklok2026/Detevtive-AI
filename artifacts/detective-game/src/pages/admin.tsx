import { useState } from "react";
import { Shield, Users, BarChart3, Settings, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight, Lock, Sparkles, Plus, X, Calendar } from "lucide-react";
import {
  useAdminGetStats,
  useAdminListCases,
  useAdminListPlayers,
  useAdminUpdateCase,
  useAdminDeleteCase,
  useAdminUpdatePlayer,
  useAdminUpdateSettings,
  useAdminCreateCase,
  useGetSettings,
  getAdminGetStatsQueryKey,
  getAdminListCasesQueryKey,
  getAdminListPlayersQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminKey, setAdminKey } from "@/lib/session";
import SeasonCountdown from "@/components/season-countdown";

const ADMIN_KEY_CORRECT = "detective123";

type Tab = "stats" | "cases" | "players" | "settings";

const SEASON_PRESETS = [
  { name: "عيد الأضحى", color: "#10b981", emoji: "🐑" },
  { name: "عيد الفطر", color: "#f59e0b", emoji: "🌙" },
  { name: "رمضان", color: "#8b5cf6", emoji: "✨" },
  { name: "الصيف", color: "#f97316", emoji: "☀️" },
  { name: "الشتاء", color: "#60a5fa", emoji: "❄️" },
  { name: "رأس السنة", color: "#ec4899", emoji: "🎆" },
];

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
        {error && <p className="text-destructive text-xs">مفتاح خاطئ. المفتاح هو: detective123</p>}
        <button data-testid="button-admin-login" type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all">
          دخول
        </button>
      </form>
    </div>
  );
}

function StatsPanel({ adminKey }: { adminKey: string }) {
  const { data: stats } = useAdminGetStats({ adminKey }, { query: { queryKey: getAdminGetStatsQueryKey({ adminKey }) } });

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
        <div key={i} className="bg-background/60 border border-border rounded-xl p-5">
          <div className={`font-cinzel text-3xl font-black ${item.color} mb-1`}>{item.value}</div>
          <div className="text-muted-foreground text-xs">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

interface CreateSeasonalFormProps {
  adminKey: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateSeasonalForm({ adminKey, onClose, onSuccess }: CreateSeasonalFormProps) {
  const createCase = useAdminCreateCase();
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: 3,
    isPremium: false,
    location: "",
    crimeType: "جريمة قتل",
    reward: 500,
    evidenceList: "",
    seasonName: SEASON_PRESETS[0].name,
    seasonColor: SEASON_PRESETS[0].color,
    seasonEndDate: "",
  });

  const handlePreset = (preset: typeof SEASON_PRESETS[0]) => {
    setForm((f) => ({ ...f, seasonName: preset.name, seasonColor: preset.color }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.seasonEndDate) return;

    createCase.mutate(
      {
        data: {
          ...form,
          adminKey,
          isSeasonal: true,
          evidenceList: form.evidenceList.split("\n").map((s) => s.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-cinzel font-bold text-foreground">إنشاء قضية موسمية</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Season presets */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">اختر الموسم</label>
            <div className="grid grid-cols-3 gap-2">
              {SEASON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all"
                  style={
                    form.seasonName === preset.name
                      ? { borderColor: preset.color, background: `${preset.color}15`, color: preset.color }
                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  <span className="text-lg">{preset.emoji}</span>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom season name & color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">اسم الموسم</label>
              <input
                value={form.seasonName}
                onChange={(e) => setForm((f) => ({ ...f, seasonName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground"
                dir="rtl"
                placeholder="عيد الأضحى"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">لون الموسم</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.seasonColor}
                  onChange={(e) => setForm((f) => ({ ...f, seasonColor: e.target.value }))}
                  className="w-10 h-9 rounded cursor-pointer border border-border"
                />
                <input
                  value={form.seasonColor}
                  onChange={(e) => setForm((f) => ({ ...f, seasonColor: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground font-mono"
                />
              </div>
            </div>
          </div>

          {/* End date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              تاريخ انتهاء الموسم
            </label>
            <input
              type="datetime-local"
              value={form.seasonEndDate}
              onChange={(e) => setForm((f) => ({ ...f, seasonEndDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground"
              required
            />
          </div>

          <div className="border-t border-border/50 pt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">عنوان القضية</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground" dir="rtl" placeholder="جريمة ليلة العيد" required />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">الوصف</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground resize-none" dir="rtl" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">الموقع</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground" dir="rtl" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">نوع الجريمة</label>
                <input value={form.crimeType} onChange={(e) => setForm((f) => ({ ...f, crimeType: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">الصعوبة (1-5)</label>
                <input type="number" min={1} max={5} value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">المكافأة (نقطة)</label>
                <input type="number" value={form.reward} onChange={(e) => setForm((f) => ({ ...f, reward: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">الأدلة (سطر لكل دليل)</label>
              <textarea value={form.evidenceList} onChange={(e) => setForm((f) => ({ ...f, evidenceList: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/60 outline-none text-sm text-foreground resize-none" dir="rtl" placeholder="دليل أول&#10;دليل ثاني&#10;دليل ثالث" />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isPremium: !f.isPremium }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isPremium ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPremium ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-sm text-foreground">قضية مميزة (تتطلب دفع)</span>
            </div>
          </div>

          {/* Preview */}
          {form.seasonEndDate && (
            <div className="rounded-lg p-3 border" style={{ borderColor: `${form.seasonColor}40`, background: `${form.seasonColor}08` }}>
              <div className="text-xs text-muted-foreground mb-1">معاينة العداد:</div>
              <SeasonCountdown endDate={new Date(form.seasonEndDate).toISOString()} color={form.seasonColor} />
            </div>
          )}

          <button
            type="submit"
            disabled={createCase.isPending}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: form.seasonColor, color: "#fff" }}
          >
            {createCase.isPending ? "جاري الإنشاء..." : `إنشاء قضية ${form.seasonName}`}
          </button>
        </form>
      </div>
    </div>
  );
}

function CasesPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: cases } = useAdminListCases({ adminKey }, { query: { queryKey: getAdminListCasesQueryKey({ adminKey }) } });

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

  const handleSeasonEnd = (id: number, endDate: string) => {
    updateCase.mutate(
      { id, data: { seasonEndDate: endDate, adminKey } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCasesQueryKey({ adminKey }) }) }
    );
  };

  const invalidateCases = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListCasesQueryKey({ adminKey }) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">جميع القضايا ({cases?.length ?? 0})</h3>
        <button
          data-testid="button-create-seasonal"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "#10b98120", border: "1px solid #10b98140", color: "#10b981" }}
        >
          <Plus className="w-4 h-4" />
          <Sparkles className="w-3.5 h-3.5" />
          قضية موسمية جديدة
        </button>
      </div>

      {showCreateForm && (
        <CreateSeasonalForm
          adminKey={adminKey}
          onClose={() => setShowCreateForm(false)}
          onSuccess={invalidateCases}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-right py-3 pr-4">القضية</th>
              <th className="text-center py-3">الصعوبة</th>
              <th className="text-center py-3">النوع</th>
              <th className="text-center py-3">الموسم</th>
              <th className="text-center py-3">النشر</th>
              <th className="text-center py-3">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {cases?.map((c) => {
              const seasonColor = c.seasonColor ?? "#d4af37";
              const isExpired = c.seasonEndDate ? new Date(c.seasonEndDate).getTime() < Date.now() : false;

              return (
                <tr key={c.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-3 pr-4" dir="rtl">
                    <div className="flex items-center gap-2">
                      {c.isSeasonal && !isExpired && (
                        <span className="text-base" title={c.seasonName ?? ""}>✨</span>
                      )}
                      <div>
                        <div className="font-medium text-foreground text-xs">{c.title}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{c.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="font-cinzel text-primary text-sm">{c.difficulty}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-xs text-muted-foreground">{c.crimeType}</span>
                  </td>
                  <td className="py-3 text-center min-w-[140px]">
                    {c.isSeasonal ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border" style={{ color: seasonColor, borderColor: `${seasonColor}40`, background: `${seasonColor}15` }}>
                          {c.seasonName}
                        </span>
                        {c.seasonEndDate && !isExpired && (
                          <SeasonCountdown endDate={c.seasonEndDate} color={seasonColor} compact />
                        )}
                        {isExpired && <span className="text-xs text-muted-foreground">منتهي</span>}
                        {c.seasonEndDate && (
                          <input
                            type="datetime-local"
                            defaultValue={new Date(c.seasonEndDate).toISOString().slice(0, 16)}
                            onChange={(e) => {
                              if (e.target.value) handleSeasonEnd(c.id, new Date(e.target.value).toISOString());
                            }}
                            className="text-xs bg-background border border-border rounded px-1 py-0.5 text-muted-foreground w-36 mt-1"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayersPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { data: players } = useAdminListPlayers({ adminKey }, { query: { queryKey: getAdminListPlayersQueryKey({ adminKey }) } });
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
            <th className="text-center py-3">إعفاء</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {players?.map((p) => (
            <tr key={p.id} className="hover:bg-background/40 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-medium text-foreground text-xs">{p.name}</div>
                <div className="text-muted-foreground text-xs mt-0.5 font-mono">{p.sessionId.slice(0, 24)}...</div>
              </td>
              <td className="py-3 text-center"><span className="font-cinzel text-primary text-sm">{p.points}</span></td>
              <td className="py-3 text-center"><span className={`text-xs ${p.hasPaid ? "text-emerald-400" : "text-muted-foreground"}`}>{p.hasPaid ? "دفع" : "مجاني"}</span></td>
              <td className="py-3 text-center">
                <button data-testid={`button-toggle-exempt-${p.id}`} onClick={() => toggleExempt(p.id, p.paymentExempt)} className="flex items-center gap-1 mx-auto">
                  {p.paymentExempt ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!players || players.length === 0) && <div className="text-center py-8 text-muted-foreground text-sm">لا يوجد لاعبون بعد</div>}
    </div>
  );
}

function SettingsPanel({ adminKey }: { adminKey: string }) {
  const queryClient = useQueryClient();
  const { data: settings } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
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
      <div className="bg-background/60 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-1">نظام الدفع</h3>
            <p className="text-muted-foreground text-xs">تفعيل أو تعطيل نظام الدفع للقضايا المميزة</p>
          </div>
          <button data-testid="button-toggle-payment" onClick={togglePayment} className={`relative w-12 h-6 rounded-full transition-colors ${settings?.paymentEnabled ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings?.paymentEnabled ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={`text-xs font-medium ${settings?.paymentEnabled ? "text-emerald-400" : "text-muted-foreground"}`}>
            {settings?.paymentEnabled ? "مفعّل" : "معطّل — جميع القضايا مجانية"}
          </span>
        </div>
      </div>

      <div className="bg-background/60 border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-1">قضايا مجانية</h3>
        <p className="text-muted-foreground text-xs mb-4">عدد القضايا المجانية قبل طلب الدفع</p>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              data-testid={`button-free-trials-${n}`}
              onClick={() => updateFreeTrials(n)}
              className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${settings?.freeTrialCases === n ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background/60 border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground text-sm mb-1">سعر الاشتراك</h3>
        <div className="font-cinzel text-2xl font-black text-primary mt-2">
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

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

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
          <p className="text-muted-foreground text-xs">إدارة اللعبة والقضايا والمواسم</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {tab === "stats" && <StatsPanel adminKey={adminKey} />}
        {tab === "cases" && <CasesPanel adminKey={adminKey} />}
        {tab === "players" && <PlayersPanel adminKey={adminKey} />}
        {tab === "settings" && <SettingsPanel adminKey={adminKey} />}
      </div>
    </div>
  );
}
