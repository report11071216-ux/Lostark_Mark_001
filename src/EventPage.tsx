import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shuffle, Sparkles } from "lucide-react";
import TeamPicker from "./TeamPicker";

// ─────────────────────────────────────────────────────────────
// EventsPage — 길드 이벤트 허브
//   현재는 팀원 뽑기 1종. 추후 룰렛 / 사다리 / 가위바위보 등 추가 시
//   EVENTS 배열과 하단 분기에 한 줄씩만 추가하면 됩니다.
// ─────────────────────────────────────────────────────────────

type EventKey = "team_picker"; // 추후: | "roulette" | "ladder" | "rps"

type Props = {
  user?: any;
  profile?: any;
  supabase: any;
};

type EventDef = {
  key: EventKey;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const EVENTS: EventDef[] = [
  {
    key: "team_picker",
    label: "팀원 뽑기",
    icon: <Shuffle size={14} />,
    description: "길드원을 랜덤으로 팀에 배정",
  },
  // 추후 추가 예시:
  // { key: "roulette", label: "룰렛 돌리기", icon: <RotateCw size={14}/>, description: "..." },
];

export default function EventsPage({ user, profile, supabase }: Props) {
  const [active, setActive] = useState<EventKey>("team_picker");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 페이지 헤더 + 이벤트 탭 */}
      <div
        className="rounded-[2rem] overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, rgba(28,23,51,0.85) 0%, rgba(15,13,32,0.95) 100%)",
          border: "1px solid rgba(139,92,246,0.16)",
          boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
        }}
      >
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: "#a78bfa" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: "#c4b5fd" }}
            >
              Events
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">길드 이벤트</h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(155,159,196,0.65)" }}
          >
            길드원과 함께 즐길 수 있는 미니 이벤트 모음입니다.
          </p>
        </div>

        {/* 이벤트 탭 */}
        <div className="px-4 pb-4 flex gap-1.5 overflow-x-auto">
          {EVENTS.map((ev) => {
            const isActive = ev.key === active;
            return (
              <button
                key={ev.key}
                onClick={() => setActive(ev.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(124,58,237,0.18))"
                    : "rgba(255,255,255,0.025)",
                  border: isActive
                    ? "1px solid rgba(167,139,250,0.5)"
                    : "1px solid rgba(255,255,255,0.05)",
                  color: isActive ? "#fff" : "rgba(226,232,240,0.7)",
                  boxShadow: isActive
                    ? "0 0 16px rgba(139,92,246,0.18)"
                    : "none",
                }}
              >
                {ev.icon}
                {ev.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 이벤트 본문 */}
      {active === "team_picker" && (
        <TeamPicker user={user} profile={profile} supabase={supabase} />
      )}
      {/* 추후 추가:
      {active === "roulette" && <RoulettePage ... />} */}
    </motion.div>
  );
}
