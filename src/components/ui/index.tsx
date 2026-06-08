import React from "react";
import { Shield, CheckCircle2, Clock, AlertTriangle, X } from "lucide-react";
import { C, STATUS } from "../../lib/constants";
import type { SiteStatus } from "../../types/db";

export const Panel: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> =
  ({ children, className = "", style = {} }) => (
    <div className={`rounded-2xl ${className}`} style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}>{children}</div>
  );

export const Centered: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bgGrad }}>{children}</div>
);

export const Brand: React.FC = () => (
  <div className="flex items-center gap-2.5 mb-8 justify-center">
    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${C.accent}1a`, border: `1px solid ${C.accent}40` }}>
      <Shield size={20} style={{ color: C.accent }} />
    </div>
    <div className="font-mono font-bold text-lg" style={{ color: C.text }}>ops.console</div>
  </div>
);

const STATUS_ICON = { ok: CheckCircle2, soon: Clock, late: AlertTriangle } as const;
export const StatusPill: React.FC<{ status: SiteStatus }> = ({ status }) => {
  const s = STATUS[status]; const Icon = STATUS_ICON[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `${s.color}1a`, color: s.color, border: `1px solid ${s.color}33` }}>
      <Icon size={12} /> {s.label}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none ${p.className || ""}`}
    style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...p }) => (
  <select {...p} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
    style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }}>{children}</select>
);

export const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <div><label className="text-xs" style={{ color: C.sub }}>{label}</label>{children}</div>
);

export const Modal: React.FC<React.PropsWithChildren<{ title: string; onClose: () => void }>> =
  ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <span className="text-sm font-semibold" style={{ color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ color: C.faint }}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
