import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 설정 (환경변수 사용) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    guild_name: "INXX",
    guild_description: "로스트아크 길드 홈페이지에 오신 것을 환영합니다.",
  });

  useEffect(() => {
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold italic">INXX SYSTEM LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <div key="home">
              <Hero settings={settings} />
              <RaidCalendar user={user} /> 
            </div>
          )}
          {activeTab === 'posts' && (
            <motion.div key="posts" initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl mx-auto p-8">
              <h2 className="text-3xl font-bold mb-8 italic uppercase tracking-tighter">게시판</h2>
              {posts.length === 0 ? <p className="text-gray-500 font-bold">등록된 게시글이 없습니다.</p> : (
                posts.map(post => (
                  <div key={post.id} className="p-6 bg-white/5 mb-4 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
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

// --- [수정] 캘린더 컴포넌트 ---
const RaidCalendar = ({ user }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    const { data: rData } = await supabase.from('raid_schedules').select('*');
    const { data: pData } = await supabase.from('raid_participants').select('*');
    if (rData) setRaids(rData);
    if (pData) setParticipants(pData);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <section id="calendar" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <CalendarIcon className="text-purple-500" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase font-mono">
            {year}. {String(month + 1).padStart(2, '0')}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg border border-white/10 transition-all active:scale-90"><ChevronLeft size={20}/></button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg border border-white/10 transition-all active:scale-90"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5 text-[10px] font-black tracking-widest text-gray-600">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d} className="p-4 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[1px] bg-white/5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[160px]" />)}
          {dateArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRaids = raids.filter(r => r.raid_date === dateStr);
            return (
              <div key={day} className="bg-[#0a0a0a] min-h-[160px] p-4 group relative hover:bg-white/[0.01] transition-all border border-transparent hover:border-purple-500/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-gray-700 group-hover:text-purple-400">{day}</span>
                  <button onClick={() => { setSelectedDate(dateStr); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 bg-purple-600 text-white rounded transition-all scale-75 hover:bg-purple-500"><Plus size={16}/></button>
                </div>
                <div className="space-y-2">
                  {dayRaids.map(raid => (
                    <RaidItem key={raid.id} raid={raid} parts={participants.filter(p => p.schedule_id === raid.id)} onRefresh={fetchData} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {isModalOpen && <CreateRaidModal date={selectedDate} onRefresh={fetchData} onClose={() => setIsModalOpen(false)} />}
    </section>
  );
};

// --- [수정] 레이드 생성 모달 (시간 입력 텍스트화 및 오류 방지) ---
const CreateRaidModal = ({ date, onRefresh, onClose }: any) => {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '오후 8:00' });
  
  const save = async () => {
    if(!form.raid_name) return alert("레이드 이름을 입력해주세요.");
    
    const { error } = await supabase.from('raid_schedules').insert([
      { 
        raid_name: form.raid_name, 
        difficulty: form.difficulty, 
        raid_time: form.raid_time, 
        raid_date: date, 
        max_participants: 8 
      }
    ]);

    if (error) {
      console.error(error);
      alert("생성 실패: " + error.message);
    } else {
      onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>
        <h3 className="text-2xl font-black text-purple-500 italic mb-8 tracking-tighter uppercase">NEW EXPEDITION // {date}</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Raid Name</label>
            <input placeholder="예: 카멘 3관" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, raid_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Difficulty</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none" onChange={e => setForm({...form, difficulty: e.target.value})}>
                <option value="노말">노말</option>
                <option value="하드">하드</option>
                <option value="나이트메어">나이트메어</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Time (Text)</label>
              {/* 시간 입력을 텍스트로 변경 */}
              <input type="text" placeholder="예: 오후 8시" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500 text-white" value={form.raid_time} onChange={e => setForm({...form, raid_time: e.target.value})} />
            </div>
          </div>
          <button onClick={save} className="w-full bg-purple-600 p-5 rounded-2xl font-black tracking-widest hover:bg-purple-500 transition-all mt-4 shadow-lg shadow-purple-600/20 active:scale-95 uppercase">Create Raid</button>
          <button onClick={onClose} className="w-full text-gray-600 text-[10px] font-black py-2 tracking-widest hover:text-white uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// --- [수정] Auth 컴포넌트 (로그인 성공 메시지 추가) ---
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
        // 로그인 성공 알림 추가
        alert('로그인 성공! 환영합니다.');
      }
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <div className="glass p-10 rounded-[3rem] border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
        <h2 className="text-4xl font-black italic mb-2 tracking-tighter uppercase">{mode === 'login' ? 'Login' : 'Join Us'}</h2>
        <p className="text-gray-500 text-[10px] font-black tracking-widest mb-10 uppercase italic">Access to INXX Guild System</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && <input type="text" placeholder="CHARACTER NICKNAME" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-bold" value={nickname} onChange={e => setNickname(e.target.value)} required />}
          <button type="submit" className="w-full bg-purple-600 p-5 rounded-2xl font-black tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/30 uppercase mt-4 active:scale-95">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-black text-gray-500 mt-8 hover:text-white tracking-widest uppercase transition-all">
          {mode === 'login' ? "Don't have an account? Create One" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

// --- 나머지 컴포넌트 (디자인 보존) ---
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
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase font-mono">INXX</span>
        </div>
        <div className="flex gap-6">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`text-xs font-black tracking-widest transition-colors ${activeTab === item.id ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
          {user && <button onClick={onLogout} className="text-xs font-black text-gray-500 hover:text-red-400 uppercase tracking-widest">Logout</button>}
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
        <span className="inline-block px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black mb-4 border border-purple-500/20 tracking-widest uppercase italic">
          Lost Ark Elite Guild
        </span>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 font-mono">
          {settings?.guild_name}
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed font-bold italic uppercase tracking-tight">
          {settings?.guild_description}
        </p>
      </motion.div>
    </div>
  </section>
);

const RaidItem = ({ raid, parts, onRefresh }: any) => {
  const [showJoin, setShowJoin] = useState(false);
  return (
    <>
      <div onClick={() => setShowJoin(true)} className="bg-purple-900/10 border border-purple-500/20 p-2.5 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all shadow-lg">
        <div className="flex justify-between text-[8px] font-black text-purple-400 uppercase mb-1 tracking-tighter">
          <span className="bg-purple-600/20 px-1 rounded">{raid.difficulty}</span>
          <span>{parts.length}/8</span>
        </div>
        <div className="text-[10px] font-bold truncate text-gray-200">{raid.raid_name}</div>
        <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1 font-bold italic"><Clock size={9}/> {raid.raid_time}</div>
      </div>
      {showJoin && <JoinModal raid={raid} parts={parts} onRefresh={onRefresh} onClose={() => setShowJoin(false)} />}
    </>
  );
};

const JoinModal = ({ raid, parts, onRefresh, onClose }: any) => {
  const [f, setF] = useState({ character_name: '', position: '딜러', item_level: '', class_name: '' });
  const join = async () => {
    if(!f.character_name) return alert("캐릭터명을 입력해주세요.");
    const { error } = await supabase.from('raid_participants').insert([{ schedule_id: raid.id, ...f }]);
    if (!error) { onRefresh(); onClose(); }
    else { alert("신청 실패: 로그인이 필요할 수 있습니다."); }
  };
  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-3xl font-black text-purple-500 italic tracking-tighter uppercase">{raid.raid_name}</h3>
            <p className="text-gray-500 text-[10px] font-black tracking-widest uppercase mt-1">{raid.difficulty} // {raid.raid_time}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={24}/></button>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="text-[10px] font-black text-gray-500 tracking-widest mb-4 uppercase italic">Participants ({parts.length}/8)</h4>
            {parts.map((p: any) => (
              <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div><div className="text-sm font-black text-purple-200">{p.character_name}</div><div className="text-[10px] text-gray-500 font-bold">{p.class_name} // {p.item_level}</div></div>
                <span className={`text-[9px] font-black px-2 py-1 rounded ${p.position === '딜러' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{p.position}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 tracking-widest mb-4 uppercase italic">Join Expedition</h4>
            <input placeholder="캐릭터명" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-purple-500 font-bold" onChange={e => setF({...f, character_name: e.target.value})} />
            <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs outline-none font-bold" onChange={e => setF({...f, position: e.target.value})}>
              <option value="딜러">딜러</option><option value="서포터">서포터</option>
            </select>
            <input placeholder="아이템 레벨" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-purple-500 font-bold" onChange={e => setF({...f, item_level: e.target.value})} />
            <input placeholder="클래스" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs outline-none focus:border-purple-500 font-bold" onChange={e => setF({...f, class_name: e.target.value})} />
            <button onClick={join} className="w-full bg-purple-600 p-5 rounded-2xl font-black mt-4 tracking-widest hover:bg-purple-500 transition-all shadow-lg active:scale-95 uppercase">Join Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};
