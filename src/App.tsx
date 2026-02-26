import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Settings,
  Database, Layers, Link as LinkIcon, Save, Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 설정 ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentView, setContentView] = useState('레이드'); // 메인 화면 뷰 선택

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
      {/* 관리자 배너 */}
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 to-red-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase">
          👑 Administrator Session Active
        </div>
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />
      
      <main className={profile?.role === 'admin' ? "pt-20" : "pt-16"}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <div key="home">
              <Hero settings={settings} />
              
              {/* 메인 화면 콘텐츠 세분화 탭 */}
              <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="flex justify-center gap-12 border-b border-white/5 pb-6">
                  {['레이드', '가디언 토벌', '클래스'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => setContentView(type)}
                      className={`text-xl font-black italic uppercase transition-all ${contentView === type ? 'text-purple-500 scale-110 underline underline-offset-8' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <MainContentViewer type={contentView} />
              <RaidCalendar user={user} /> 
            </div>
          )}

          {activeTab === 'posts' && <PostBoard posts={posts} />}
          
          {activeTab === 'admin' && profile?.role === 'admin' && <AdminPanel />}

          {(activeTab === 'login' || activeTab === 'signup') && (
            <Auth key="auth" mode={activeTab} setMode={setActiveTab} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- [관리자] 통합 설정 패널 ---
const AdminPanel = () => {
  const [adminTab, setAdminTab] = useState('레이드');

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-10">
        <Settings className="text-purple-500" size={32} />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Admin Console</h2>
      </div>

      <div className="flex gap-6 mb-10 overflow-x-auto pb-2">
        {['레이드', '가디언 토벌', '클래스', '길드 설정'].map(t => (
          <button 
            key={t} 
            onClick={() => setAdminTab(t)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all ${adminTab === t ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10">
        {adminTab === '레이드' && <RaidContentEditor isRaid={true} />}
        {adminTab === '가디언 토벌' && <RaidContentEditor isRaid={false} />}
        {adminTab === '클래스' && <ClassContentEditor />}
      </div>
    </motion.div>
  );
};

// --- [관리자] 레이드 & 가디언 에디터 ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [form, setForm] = useState({
    name: '', hp: '', element: '', attribute: '', d_card: '', s_card: '', gold: 0
  });

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Target Content Name</label>
          <input 
            placeholder={isRaid ? "예: 카제로스 - 에키드나" : "예: 에기르"} 
            className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold"
            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>
        {isRaid && (
          <div className="space-y-4">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Gate Selection</label>
            <div className="flex gap-2">
              {[1, 2, 3].map(g => (
                <button key={g} onClick={() => setSelectedGate(g)} className={`flex-1 py-4 rounded-2xl font-black transition-all ${selectedGate === g ? 'bg-purple-600' : 'bg-black border border-white/10'}`}>{g} Gate</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 p-1 bg-black rounded-2xl border border-white/5">
        {['노말', '하드', '나이트메어'].map(d => (
          <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${difficulty === d ? 'bg-white/10 text-white' : 'text-gray-600'}`}>{d}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminInput label="HP (체력)" value={form.hp} onChange={v => setForm({...form, hp: v})} />
        <AdminInput label="Element (계열)" value={form.element} onChange={v => setForm({...form, element: v})} />
        <AdminInput label="Attribute (속성)" value={form.attribute} onChange={v => setForm({...form, attribute: v})} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminInput label="Dealer Card Set" value={form.d_card} onChange={v => setForm({...form, d_card: v})} />
        <AdminInput label="Support Card Set" value={form.s_card} onChange={v => setForm({...form, s_card: v})} />
      </div>

      <AdminInput label="Clear Gold (관문당)" type="number" value={form.gold} onChange={v => setForm({...form, gold: v})} />

      <button className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-purple-500 transition-all">
        <Save size={20} /> Update Content Info
      </button>
    </div>
  );
};

// --- [관리자] 클래스 에디터 ---
const ClassContentEditor = () => {
  const [commonEngravings, setCommonEngravings] = useState<string[]>([]);
  const [arkPassive, setArkPassive] = useState<string[]>([]);
  const [counters, setCounters] = useState<string[]>([]);

  const addField = (list: any, set: any, max: number) => { if(list.length < max) set([...list, ""]); };

  return (
    <div className="space-y-10 text-left">
      <div className="grid grid-cols-2 gap-6">
        <AdminInput label="Root Class (뿌리)" placeholder="ex) 마법사" />
        <AdminInput label="Sub Class (전직)" placeholder="ex) 소서리스" />
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Common Engravings (Max 5)</label>
          <button onClick={() => addField(commonEngravings, setCommonEngravings, 5)} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {commonEngravings.map((val, i) => (
            <input key={i} className="bg-black border border-white/10 p-4 rounded-xl text-xs" placeholder={`각인 ${i+1}`} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Ark Passive / Grid (Max 6)</label>
          <button onClick={() => addField(arkPassive, setArkPassive, 6)} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {arkPassive.map((val, i) => (
            <input key={i} className="bg-black border border-white/10 p-4 rounded-xl text-xs" placeholder={`그리드 ${i+1}`} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Counter Skills (Max 3)</label>
          <button onClick={() => addField(counters, setCounters, 3)} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {counters.map((val, i) => (
            <input key={i} className="bg-black border border-white/10 p-4 rounded-xl text-xs" placeholder={`카운터 ${i+1}`} />
          ))}
        </div>
      </div>

      <AdminInput label="Skill Code Link" placeholder="https://..." />
      
      <button className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
        <Save size={20} /> Update Class Metadata
      </button>
    </div>
  );
};

// --- 공통 컴포넌트: 관리자용 인풋 ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm"
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
    />
  </div>
);

// --- 메인 콘텐츠 뷰어 (홈 화면에서 탭별로 보여지는 카드들) ---
const MainContentViewer = ({ type }: { type: string }) => {
  // 실제 서비스 시에는 Supabase contents 테이블에서 category별로 가져옵니다.
  const dummyItems = [
    { id: 1, name: '카제로스 레이드 - 에키드나', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80' },
    { id: 2, name: '베히모스', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80' },
    { id: 3, name: '카멘', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
      {dummyItems.map(item => (
        <motion.div 
          whileHover={{ y: -10 }}
          key={item.id} 
          className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black aspect-[4/5] cursor-pointer"
        >
          <img src={item.img} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2 block italic">{type}</span>
            <h3 className="text-3xl font-black italic mb-6 uppercase tracking-tighter leading-none">{item.name}</h3>
            <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-4 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all">
              View Details <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      ))}
    </section>
  );
};

// --- 기존 캘린더 컴포넌트 (동일) ---
const RaidCalendar = ({ user }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchData(); }, [currentDate]);

  const fetchData = async () => {
    const { data: rData } = await supabase.from('raid_schedules').select('*').order('created_at', { ascending: true });
    const { data: pData } = await supabase.from('raid_participants').select('*');
    if (rData) setRaids(rData);
    if (pData) setParticipants(pData);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section id="calendar" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <CalendarIcon className="text-purple-500" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase font-mono">{year}. {String(month + 1).padStart(2, '0')}</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-3 hover:bg-white/5 rounded-xl border border-white/10 transition-all active:scale-90"><ChevronLeft size={24}/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-3 hover:bg-white/5 rounded-xl border border-white/10 transition-all active:scale-90"><ChevronRight size={24}/></button>
        </div>
      </div>

      <div className="bg-[#0f0f0f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5 text-[10px] font-black tracking-[0.2em] text-gray-500 text-center">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d} className="p-5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[1px] bg-white/5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[180px]" />)}
          {dateArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayRaids = raids.filter(r => r.raid_date === dateStr);
            return (
              <div key={day} className="bg-[#0a0a0a] min-h-[180px] p-5 group relative hover:bg-white/[0.02] transition-all">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-xs font-black text-gray-700 group-hover:text-purple-500 transition-colors">{day}</span>
                  <button onClick={() => { setSelectedDate(dateStr); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-purple-600 text-white rounded-lg transition-all scale-90 hover:scale-100 hover:bg-purple-500 shadow-lg shadow-purple-600/20"><Plus size={18}/></button>
                </div>
                <div className="space-y-2.5">
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

// --- 기존 모달들 (CreateRaidModal, JoinModal 등 유지) ---
const CreateRaidModal = ({ date, onRefresh, onClose }: any) => {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '오후 8:00' });
  const save = async () => {
    if(!form.raid_name) return alert("레이드 이름을 입력해주세요.");
    const { error } = await supabase.from('raid_schedules').insert([{ ...form, raid_date: date, max_participants: 8 }]);
    if (error) alert("생성 실패: " + error.message);
    else { alert("레이드가 성공적으로 생성되었습니다!"); onRefresh(); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative">
        <h3 className="text-3xl font-black text-purple-500 italic mb-10 tracking-tighter uppercase underline decoration-purple-600/30 underline-offset-8">New Raid Event</h3>
        <div className="space-y-5">
          <AdminInput label="Raid Name" placeholder="예: 카멘 3관" value={form.raid_name} onChange={(v:any)=>setForm({...form, raid_name:v})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Difficulty</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none font-bold" onChange={e => setForm({...form, difficulty: e.target.value})}>
                <option value="노말">노말</option><option value="하드">하드</option><option value="나이트메어">나이트메어</option>
              </select>
            </div>
            <AdminInput label="Time" value={form.raid_time} onChange={(v:any)=>setForm({...form, raid_time:v})} />
          </div>
          <button onClick={save} className="w-full bg-purple-600 p-6 rounded-2xl font-black tracking-widest hover:bg-purple-500 transition-all mt-6 shadow-xl shadow-purple-600/20 active:scale-95 uppercase">Confirm Raid</button>
          <button onClick={onClose} className="w-full text-gray-600 text-[10px] font-black py-2 tracking-widest hover:text-white uppercase transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// --- 나머지 디자인 조각들 ---

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => {
  const navItems = [
    { id: 'home', label: '홈' }, 
    { id: 'posts', label: '게시판' },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: '관리자' }] : []),
    ...(user ? [] : [{ id: 'login', label: '로그인' }, { id: 'signup', label: '회원가입' }])
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30"><Shield className="text-white w-5 h-5" /></div>
          <span className="text-2xl font-black tracking-tighter uppercase font-mono italic">INXX</span>
        </div>
        <div className="flex gap-8">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`text-xs font-black tracking-[0.2em] transition-all uppercase ${activeTab === item.id ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}>{item.label}</button>
          ))}
          {user && <button onClick={onLogout} className="text-xs font-black text-gray-500 hover:text-red-400 uppercase tracking-widest">Logout</button>}
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ settings }: any) => (
  <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent"></div>
    <div className="relative z-10 text-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <span className="inline-block px-5 py-2 rounded-full bg-purple-500/5 text-purple-400 text-[10px] font-black mb-6 border border-purple-500/10 tracking-[0.4em] uppercase italic">Lost Ark Guild System v2.0</span>
        <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 font-mono leading-none">{settings?.guild_name}</h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-bold italic uppercase tracking-tight opacity-70 leading-relaxed">{settings?.guild_description}</p>
      </motion.div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
  </section>
);

const RaidItem = ({ raid, parts, onRefresh }: any) => {
  const [showJoin, setShowJoin] = useState(false);
  return (
    <>
      <div onClick={() => setShowJoin(true)} className="bg-purple-950/20 border border-purple-500/20 p-3.5 rounded-2xl cursor-pointer hover:border-purple-500/60 hover:bg-purple-900/30 transition-all shadow-xl group/item text-left">
        <div className="flex justify-between text-[8px] font-black text-purple-400 uppercase mb-2 tracking-widest">
          <span className="bg-purple-600 text-white px-2 py-0.5 rounded-md">{raid.difficulty}</span>
          <span className="flex items-center gap-1"><Users size={8}/> {parts.length}/8</span>
        </div>
        <div className="text-xs font-black truncate text-gray-200 group-hover/item:text-white transition-colors">{raid.raid_name}</div>
        <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1.5 font-bold italic"><Clock size={10} className="text-purple-500"/> {raid.raid_time}</div>
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
    else alert("신청 실패: " + error.message);
  };
  const deleteRaid = async () => {
    if (confirm("이 레이드 일정을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('raid_schedules').delete().eq('id', raid.id);
      if (!error) { onRefresh(); onClose(); }
    }
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#0f0f0f] border border-white/10 p-12 rounded-[4rem] w-full max-w-2xl shadow-2xl relative">
        <div className="flex justify-between items-start mb-12">
          <div>
            <span className="text-purple-500 text-[10px] font-black tracking-[0.4em] uppercase mb-2 block italic">Expedition Briefing</span>
            <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{raid.raid_name}</h3>
            <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-3">{raid.difficulty} // {raid.raid_time}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={deleteRaid} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={24}/></button>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white"><X size={28}/></button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            <h4 className="text-[10px] font-black text-gray-500 tracking-[0.2em] mb-6 uppercase italic">Party Members ({parts.length}/8)</h4>
            {parts.map((p: any) => (
              <div key={p.id} className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex justify-between items-center group/p hover:border-purple-500/30 transition-all">
                <div>
                  <div className="text-base font-black text-purple-200">{p.character_name}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{p.class_name} // LV.{p.item_level}</div>
                </div>
                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase ${p.position === '딜러' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{p.position}</span>
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <h4 className="text-[10px] font-black text-gray-500 tracking-[0.2em] mb-6 uppercase italic">Sign Up Form</h4>
            <AdminInput label="Character Name" onChange={(v:any)=>setF({...f, character_name:v})} />
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Position</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none" onChange={e => setF({...f, position: e.target.value})}>
                <option value="딜러">딜러</option><option value="서포터">서포터</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminInput label="Item Level" onChange={(v:any)=>setF({...f, item_level:v})} />
              <AdminInput label="Class" onChange={(v:any)=>setF({...f, class_name:v})} />
            </div>
            <button onClick={join} className="w-full bg-purple-600 p-6 rounded-[2rem] font-black mt-4 tracking-[0.2em] hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 active:scale-95 uppercase">Apply Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostBoard = ({ posts }: any) => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-5xl mx-auto p-12">
    <div className="flex items-center justify-between mb-12">
      <h2 className="text-4xl font-black italic uppercase tracking-tighter underline decoration-purple-600/30 underline-offset-8">Bulletin Board</h2>
      <button className="bg-purple-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest">Write Post</button>
    </div>
    {posts.length === 0 ? <p className="text-gray-600 font-black italic uppercase text-center py-20 tracking-widest border border-dashed border-white/10 rounded-[3rem]">No Records Found in Database</p> : (
      <div className="grid gap-6">
        {posts.map(post => (
          <div key={post.id} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-purple-500/30 transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-all"><ChevronRight size={32}/></div>
            <span className="text-purple-500 text-[10px] font-black uppercase tracking-widest mb-2 block italic">{post.category || 'General'}</span>
            <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">{post.title}</h3>
            <div className="flex gap-4 mt-4 items-center">
              <div className="w-6 h-6 bg-white/10 rounded-full"></div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-tight">{post.author} // {new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
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
        alert('로그인 성공! 환영합니다.');
        setMode('home');
      }
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <div className="glass p-12 rounded-[4rem] border border-white/10 bg-[#0f0f0f] shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
        <h2 className="text-5xl font-black italic mb-2 tracking-tighter uppercase">{mode === 'login' ? 'Sign In' : 'Join Us'}</h2>
        <p className="text-gray-600 text-[10px] font-black tracking-[0.4em] mb-12 uppercase italic">Authentication Required</p>
        <form onSubmit={handleAuth} className="space-y-5">
          <input type="email" placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && <input type="text" placeholder="NICKNAME" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black" value={nickname} onChange={e => setNickname(e.target.value)} required />}
          <button type="submit" className="w-full bg-purple-600 p-6 rounded-3xl font-black tracking-[0.3em] hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/30 uppercase mt-6 active:scale-95">Proceed</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-black text-gray-600 mt-10 hover:text-white tracking-widest uppercase transition-all">
          {mode === 'login' ? "Create a new account" : "Back to sign in"}
        </button>
      </div>
    </div>
  );
};
