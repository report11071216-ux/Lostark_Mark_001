import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Home, FileText, Settings, Bold, Italic, 
  Link as LinkIcon, Image as ImageIcon, Clock, Calendar as CalendarIcon, 
  UserPlus, UserMinus, Coins, ChevronLeft, ChevronRight, Plus, 
  Trash2, Users, Shield, Sword, Menu, X, Share2, Globe, 
  MessageSquare, Search 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 설정 (환경변수 필수!) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. 메인 App 컴포넌트 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 상태
  const [posts, setPosts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    guild_name: "INXX",
    guild_description: "로스트아크 길드 홈페이지에 오신 것을 환영합니다.",
    raid_info: "[]"
  });

  useEffect(() => {
    // 세션 및 데이터 로드
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      await fetchInitialData();
      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchInitialData = async () => {
    const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
    if (postsData) setPosts(postsData);
    if (settingsData) setSettings(settingsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-primary">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        profile={profile} 
        onLogout={handleLogout} 
      />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <Hero key="home" settings={settings} />
          )}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl mx-auto p-8">
              <h2 className="text-3xl font-bold mb-8">게시판</h2>
              {posts.length === 0 ? <p className="text-gray-500">등록된 게시글이 없습니다.</p> : (
                posts.map(post => (
                  <div key={post.id} className="p-4 glass mb-4 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold">{post.title}</h3>
                    <p className="text-gray-400 text-sm mt-2">{post.author}</p>
                  </div>
                ))
              )}
            </motion.div>
          )}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <Auth key="auth" mode={activeTab} setMode={setActiveTab} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- 3. 하위 부품 컴포넌트 (App 함수 바깥에 작성) ---

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => {
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'posts', label: '게시판', icon: FileText },
    ...(user ? [] : [
      { id: 'login', label: '로그인', icon: Users },
      { id: 'signup', label: '회원가입', icon: UserPlus },
    ]),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tighter">INXX</span>
        </div>
        <div className="flex gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-sm font-medium transition-colors ${activeTab === item.id ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button onClick={onLogout} className="text-sm font-medium text-gray-400 hover:text-red-400">로그아웃</button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ settings }: any) => (
  <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent z-0"></div>
    <div className="relative z-10 text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <span className="inline-block px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold mb-4 border border-purple-500/20">
          LOST ARK GUILD
        </span>
        <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter">
          {settings?.guild_name}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          {settings?.guild_description}
        </p>
      </motion.div>
    </div>
  </section>
);

const Auth = ({ mode, setMode }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname } } });
        if (error) throw error;
        await supabase.from('profiles').insert([{ id: data.user?.id, nickname, grade: '신입' }]);
        alert('회원가입 성공! 이메일을 확인하세요.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <div className="glass p-8 rounded-3xl border border-white/10 bg-white/5">
        <h2 className="text-3xl font-bold mb-6 text-center">{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="이메일" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-purple-500" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-purple-500" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && <input type="text" placeholder="닉네임" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-purple-500" value={nickname} onChange={e => setNickname(e.target.value)} required />}
          <button type="submit" className="w-full bg-purple-600 p-4 rounded-xl font-bold hover:bg-purple-700 transition-all">
            {mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-sm text-gray-500 mt-4 hover:text-white">
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>
    </div>
  );
};
