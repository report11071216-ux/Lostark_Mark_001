import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { C, btnPrimary } from "../../lib/constants";
import { Brand, Centered, Input, Panel } from "../../components/ui";

export const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr("");
    // 1) 계정 생성
    const { data, error } = await supabase.auth.signUp({ email, password: pw });
    if (error) {
      setErr(error.message.includes("already") ? "이미 가입된 이메일입니다. 로그인해 주세요." : "가입 실패: " + error.message);
      setBusy(false); return;
    }
    // 이메일 인증이 켜져 있으면 세션이 없을 수 있음
    if (!data.session) {
      setErr("가입은 됐지만 이메일 인증이 필요합니다. 메일함을 확인한 뒤, 로그인 후 다시 코드를 입력하세요.");
      setBusy(false); return;
    }
    // 2) 가입 코드 교환 (DB 함수가 코드/도메인 검증 후 승인)
    const { data: res, error: rpcErr } = await supabase.rpc("redeem_signup_code", { p_code: code });
    setBusy(false);
    if (rpcErr) { setErr("코드 확인 중 오류: " + rpcErr.message); return; }
    if (!(res as any)?.ok) { setErr((res as any)?.error || "가입 코드/이메일 조건을 확인하세요."); return; }
    setDone(true);
  };

  if (done)
    return (
      <Centered>
        <div className="w-full max-w-sm text-center">
          <Brand />
          <Panel className="p-7">
            <CheckCircle2 size={28} style={{ color: C.ok }} className="mx-auto mb-3" />
            <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>가입 완료</div>
            <div className="text-xs mb-5" style={{ color: C.sub }}>승인까지 완료됐습니다. 로그인하면 바로 이용할 수 있어요.</div>
            <a href="/" className="inline-block w-full rounded-lg py-2.5 text-sm font-semibold" style={btnPrimary}>대시보드로 입장</a>
          </Panel>
        </div>
      </Centered>
    );

  return (
    <Centered>
      <div className="w-full max-w-sm">
        <Brand />
        <Panel className="p-7">
          <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>팀 계정 가입</div>
          <div className="text-xs mb-5" style={{ color: C.sub }}>가입 코드가 있는 팀원만 가입할 수 있습니다.</div>
          <div className="space-y-3">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kornec.com" type="email" />
            <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호 (6자 이상)" type="password" />
            <Input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="가입 코드" />
          </div>
          {err && <div className="text-xs mt-3 leading-relaxed" style={{ color: C.late }}>{err}</div>}
          <button onClick={submit} disabled={busy}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-5 transition-opacity hover:opacity-90"
            style={btnPrimary}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} 가입하기
          </button>
          <div className="text-center text-xs mt-4" style={{ color: C.faint }}>
            이미 계정이 있나요? <Link to="/" style={{ color: C.accent }}>로그인</Link>
          </div>
        </Panel>
      </div>
    </Centered>
  );
};
