import { useState, useRef, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowRight, Send, User, Shield } from "lucide-react";
import { useGetSuspect, getGetSuspectQueryKey } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MOOD_LABELS: Record<string, string> = {
  calm: "هادئ",
  nervous: "متوتر",
  angry: "غاضب",
  defensive: "دفاعي",
  crying: "منهار",
};

const MOOD_COLORS: Record<string, string> = {
  calm: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  nervous: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  angry: "text-red-400 border-red-400/30 bg-red-400/10",
  defensive: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  crying: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

export default function InterrogatePage() {
  const params = useParams<{ caseId: string; suspectId: string }>();
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const caseId = parseInt(params.caseId, 10);
  const suspectId = parseInt(params.suspectId, 10);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState("calm");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) setLocation("/enter");
  }, [sessionId, setLocation]);

  const { data: suspect } = useGetSuspect(suspectId, {
    query: { enabled: !isNaN(suspectId), queryKey: getGetSuspectQueryKey(suspectId) },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return;
    const userMessage = input.trim();
    setInput("");

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suspectId,
          caseId,
          sessionId,
          message: userMessage,
          history: messages,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setMood(data.suspectMood ?? "calm");
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!sessionId) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setLocation(`/case/${caseId}`)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back-case"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          {/* Suspect avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-card border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            {suspect?.photoUrl ? (
              <img src={suspect.photoUrl} alt={suspect.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm text-foreground" dir="rtl">
              {suspect?.name ?? "..."}
            </h1>
            <p className="text-muted-foreground text-xs" dir="rtl">
              {suspect?.role ?? ""}
            </p>
          </div>

          {/* Mood indicator */}
          <span className={`text-xs px-3 py-1 rounded-full border font-medium flex-shrink-0 ${MOOD_COLORS[mood] ?? MOOD_COLORS.calm}`}>
            {MOOD_LABELS[mood] ?? mood}
          </span>
        </div>
      </div>

      {/* Deception meter */}
      {suspect && (
        <div className="mb-4 bg-card border border-border rounded-lg px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">مستوى المراوغة:</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-red-600 rounded-full transition-all"
              style={{ width: `${suspect.deceptionLevel * 10}%` }}
            />
          </div>
          <span className="text-xs font-bold text-destructive">{suspect.deceptionLevel}/10</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-sm" dir="rtl">
              ابدأ الاستجواب. اطرح أسئلة ذكية لكشف الحقيقة.
            </p>
            <p className="text-muted-foreground/50 text-xs mt-2" dir="rtl">
              المشتبه به سيحاول المراوغة...
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${msg.role === "user" ? "chat-detective ml-2" : "chat-suspect mr-2"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {msg.role === "user" ? (
                  <>
                    <span className="text-xs font-medium text-primary">المحقق</span>
                    <Shield className="w-3 h-3 text-primary" />
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-destructive/70" />
                    <span className="text-xs font-medium text-destructive/80">{suspect?.name}</span>
                  </>
                )}
              </div>
              <p className="text-foreground/90 leading-relaxed" dir="rtl">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-suspect rounded-xl px-4 py-3 mr-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border border-border rounded-xl p-3 flex gap-3">
        <textarea
          data-testid="input-interrogation-message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب سؤالك هنا... (Enter للإرسال)"
          dir="rtl"
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed max-h-24"
          disabled={isLoading}
        />
        <button
          data-testid="button-send-message"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 self-end"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {/* Accuse button */}
      <div className="mt-3 text-center">
        <Link
          href={`/accuse/${caseId}`}
          className="text-xs text-destructive/70 hover:text-destructive transition-colors"
          data-testid="link-accuse"
        >
          جاهز للاتهام؟ اضغط هنا
        </Link>
      </div>
    </div>
  );
}
