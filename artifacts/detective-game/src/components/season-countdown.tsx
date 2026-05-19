import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface SeasonCountdownProps {
  endDate: string;
  color: string;
  compact?: boolean;
}

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function SeasonCountdown({ endDate, color, compact = false }: SeasonCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) {
    return (
      <span className="text-xs text-muted-foreground">انتهى الموسم</span>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color }}>
        <Clock className="w-3 h-3" />
        {timeLeft.days > 0 && <span>{timeLeft.days}ي</span>}
        <span>{String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="font-mono font-black text-lg leading-none" style={{ color }}>{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground mt-0.5">يوم</div>
          </div>
        )}
        <div className="text-center">
          <div className="font-mono font-black text-lg leading-none" style={{ color }}>{String(timeLeft.hours).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">ساعة</div>
        </div>
        <div className="font-black text-lg" style={{ color }}>:</div>
        <div className="text-center">
          <div className="font-mono font-black text-lg leading-none" style={{ color }}>{String(timeLeft.minutes).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">دقيقة</div>
        </div>
        <div className="font-black text-lg" style={{ color }}>:</div>
        <div className="text-center">
          <div className="font-mono font-black text-lg leading-none" style={{ color }}>{String(timeLeft.seconds).padStart(2, "0")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">ثانية</div>
        </div>
      </div>
    </div>
  );
}
