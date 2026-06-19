import React from "react";
import { NavLink, Outlet } from "react-router-dom";
iimport { Shield, LayoutDashboard, CalendarDays, AlertTriangle, FileText, Users, Server, RefreshCw, LogOut, Activity } from "lucide-react";
import { C } from "../lib/constants";
import { useApp } from "../data/AppProvider";
import { AlertsBell, AlertBanner } from "../features/alerts/AlertsBell";

const TABS = [
  { to: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { to: "/inspections", label: "점검 현황", icon: Activity },
  { to: "/schedule", label: "점검 일정", icon: CalendarDays },
  { to: "/sites", label: "사이트", icon: Server },
  { to: "/issues", label: "이슈 로그", icon: AlertTriangle },
  { to: "/report", label: "보고서", icon: FileText },
];

export const AppShell: React.FC = () => {
  const { me, alerts, loading, reload, signOut, isLead } = useApp();
  const tabs = isLead ? [...TABS, { to: "/team", label: "팀원 관리", icon: Users }] : TABS;
  return (
    <div className="min-h-screen" style={{ background: C.bgGrad, color: C.text }}>
      <header className="flex items-center gap-4 px-6 py-3.5 sticky top-0 z-40"
        style={{ background: "rgba(10,13,18,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${C.accent}1a`, border: `1px solid ${C.accent}40` }}>
            <Shield size={16} style={{ color: C.accent }} />
          </div>
          <span className="font-mono font-bold text-sm">ops.console</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <NavLink key={t.to} to={t.to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
                style={({ isActive }) => ({ background: isActive ? `${C.accent}14` : "transparent", color: isActive ? C.accent : C.sub })}>
                <Icon size={14} /> {t.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <button onClick={reload} className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }} title="새로고침">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <AlertsBell alerts={alerts} />
          <span className="text-xs font-medium" style={{ color: C.sub }}>
            {me?.name}{me?.role === "lead" && <span className="ml-1" style={{ color: C.accent }}>(lead)</span>}
          </span>
          <button onClick={signOut} className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }} title="로그아웃">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <AlertBanner alerts={alerts} />

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};
