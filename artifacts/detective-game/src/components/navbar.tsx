import { Link, useLocation } from "wouter";
import { Shield, Lock, Star } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { useGetPlayer } from "@workspace/api-client-react";

export default function Navbar() {
  const sessionId = getSessionId() ?? "";
  const [location] = useLocation();

  const { data: player } = useGetPlayer(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: ["getPlayer", sessionId] } }
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-cinzel font-bold text-sm tracking-widest text-primary uppercase">
            محقق
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-xs font-medium tracking-wider uppercase transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            القضايا
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            <Lock className="w-3 h-3" />
            لوحة التحكم
          </Link>
        </div>

        {player && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-xs font-bold text-primary">{player.points}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {player.name}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
