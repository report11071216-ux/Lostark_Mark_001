import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // motion/react 대신 framer-motion 권장
import { 
  LayoutDashboard, Home, FileText, Settings, Bold, Italic, 
  Link as LinkIcon, Image as ImageIcon, Clock, Calendar as CalendarIcon, 
  UserPlus, UserMinus, Coins, ChevronLeft, ChevronRight, Plus, 
  Trash2, Users, Shield, Sword, Menu, X, Share2, Globe, 
  MessageSquare, Search 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 설정 (환경변수) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. Types (기존 타입 유지) ---
// ... (기존에 정의하신 Post, Profile, Settings 등 인터페이스들)

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 상태 관리
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    guild_name: "INXX",
    guild_description: "로스트아크 길드 홈페이지",
    raid_info: "[]",
    guardians_info: "[]",
    classes_info: "[]"
  });

  // --- 3. 핵심: Supabase에서 데이터 직접 가져오기 (Fix 완료) ---
  useEffect(() => {
    // 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // 모든 초기 데이터 로드
    fetchAllData();

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // ⚠️ /api/... fetch 대신 supabase.from() 사용!
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      const { data: membersData } = await supabase.from('profiles').select('*');
      const { data: schedulesData } = await supabase.from('raid_schedules').select('*, participants(*)');
      const { data: settingsData } = await supabase.from('settings').select('*').single();

      if (postsData) setPosts(postsData);
      if (membersData) setMembers(membersData);
      if (schedulesData) setSchedules(schedulesData);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. UI 렌더링 로직 ---
  const renderContent = () => {
    if (loading) return <div className="pt-32 text-center text-primary">로딩 중...</div>;

    switch (activeTab) {
      case 'home':
        return <Hero settings={settings} onRaidClick={()=>{}} onGuardianClick={()=>{}} onClassClick={()=>{}} />;
      case 'posts':
        return <PostList posts={posts} />;
      case 'login':
        return <Login onSwitch={() => setActiveTab('signup')} />;
      case 'signup':
        return <SignUp onSwitch={() => setActiveTab('login')} />;
      default:
        return <Hero settings={settings} onRaidClick={()=>{}} onGuardianClick={()=>{}} onClassClick={()=>{}} />;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary/30">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        profile={profile} 
        onLogout={handleLogout} 
      />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- 하위 컴포넌트들 (Hero, Navbar 등은 주신 코드 기반으로 유지하되 에러 부분 수정) ---
// ... (기존 코드의 Hero, Navbar, SignUp, Login 컴포넌트들을 여기에 배치)
