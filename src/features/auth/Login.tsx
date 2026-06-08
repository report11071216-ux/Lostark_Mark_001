import React, { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { C, btnPrimary } from "../../lib/constants";
import { Brand, Centered, Input, Panel } from "../../components/ui";

export const Login: React.FC = () => {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setErr("로그인 실패: 이메일/비밀번호를 확인하세요.");
    setBusy(false);
  };

  return (
    <Centered>
      <div className="w-full max-w-sm">
        <Brand />
        <Panel className="p-7">
          <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>팀 계정으로 로그인</div>
          <div className="text-xs mb-5" style={{ color: C.sub }}>승인된 엔지니어만 접근할 수 있습니다.</div>
          <div className="space-y-3">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@corp.io" type="email" />
            <Input value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" type="password" />
          </div>
          {err && <div className="text-xs mt-3" style={{ color: C.late }}>{err}</div>}
          <button onClick={submit} disabled={busy}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-5 transition-opacity hover:opacity-90"
            style={btnPrimary}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} 로그인
          </button>
        </Panel>
      </div>
    </Centered>
  );
};
