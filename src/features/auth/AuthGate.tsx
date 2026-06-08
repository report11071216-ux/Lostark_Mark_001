import React from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { C } from "../../lib/constants";
import { Brand, Centered, Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { Login } from "./Login";

export const AuthGate: React.FC = () => {
  const { envMissing, authReady, session, me, signOut } = useApp();

  if (envMissing)
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <Brand />
          <Panel className="p-6">
            <div className="text-sm font-semibold mb-2" style={{ color: C.soon }}>환경변수가 설정되지 않았습니다</div>
            <div className="text-xs leading-relaxed" style={{ color: C.sub }}>
              Vercel 프로젝트에 <span className="font-mono">VITE_SUPABASE_URL</span> 과{" "}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> 를 설정한 뒤 배포하면 동작합니다.
            </div>
          </Panel>
        </div>
      </Centered>
    );

  if (!authReady)
    return <Centered><Loader2 className="animate-spin" style={{ color: C.accent }} /></Centered>;

  if (!session) return <Login />;

  if (me && !me.approved)
    return (
      <Centered>
        <div className="max-w-sm text-center">
          <Brand />
          <Panel className="p-6">
            <div className="text-sm font-semibold mb-2" style={{ color: C.soon }}>승인 대기 중</div>
            <div className="text-xs" style={{ color: C.sub }}>관리자(lead)의 승인 후 접근할 수 있습니다.</div>
            <button onClick={signOut} className="mt-4 text-xs" style={{ color: C.faint }}>로그아웃</button>
          </Panel>
        </div>
      </Centered>
    );

  return <Outlet />;
};
