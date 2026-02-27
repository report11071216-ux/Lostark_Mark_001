import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Settings,
  Database, Layers, Link as LinkIcon, Save, Info, Image as ImageIcon
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
  const [contentView, setContentView] = useState('레이드');
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
      else setProfile(null);
    });
   
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
  };

  const fetchInitialData = async () => {
    const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (postsData) setPosts(postsData);
    if (settingsData) setSettings(settingsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-purple-500 font-black italic tracking-tighter text-2xl">
        INXX SYSTEM LOADING...
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 via-red-900 to-purple-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase border-b border-white/10">
          👑 Administrator Session Active
        </div>
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />
      
      <main className={profile?.role === 'admin' ? "pt-20" : "pt-16"}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Hero settings={settings} />
              <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="flex justify-center gap-12 border-b border-white/5 pb-6">
                  {['레이드', '가디언 토벌', '클래스'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => setContentView(type)}
                      className={`text-xl font-black italic uppercase transition-all duration-500 ${contentView === type ? 'text-purple-500 scale-110 underline underline-offset-8' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <MainContentViewer type={contentView} />
              <RaidCalendar user={user} /> 
            </motion.div>
          )}

          {activeTab === 'posts' && <PostBoard posts={posts} />}
          {activeTab === 'admin' && profile?.role === 'admin' && <AdminPanel settings={settings} setSettings={setSettings} />}
          {(activeTab === 'login' || activeTab === 'signup') && <Auth mode={activeTab} setMode={setActiveTab} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- 공통 컴포넌트: AdminInput (원본 스타일) ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-3 text-left">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} placeholder={placeholder} className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all" value={value} onChange={e => onChange && onChange(e.target.value)} />
  </div>
);

// --- 이미지 업로더 ---
const ImageUploader = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `contents/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) {
      alert("이미지 업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-3 text-left">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`file-${label}`} disabled={uploading} />
        <label htmlFor={`file-${label}`} className="flex items-center justify-center gap-3 w-full bg-black border border-white/10 p-5 rounded-3xl cursor-pointer hover:border-purple-500 transition-all text-xs font-black text-gray-500 group-hover:text-white">
          {uploading ? "UPLOADING..." : <><ImageIcon size={16}/> {label} 선택</>}
        </label>
      </div>
    </div>
  );
};

// --- 관리자 패널 ---
const AdminPanel = ({ settings, setSettings }: any) => {
  const [adminTab, setAdminTab] = useState('레이드');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto p-8 text-left pb-40">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-purple-600 rounded-2xl"><Settings className="text-white" size={24} /></div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Admin Console</h2>
      </div>
      <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {['레이드', '가디언 토벌', '클래스', '길드 설정'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${adminTab === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{t}</button>
        ))}
      </div>
      <div className="bg-[#111] border border-white/5 rounded-[3rem] p-10 shadow-2xl">
        {adminTab === '레이드' && <RaidContentEditor isRaid={true} />}
        {adminTab === '가디언 토벌' && <RaidContentEditor isRaid={false} />}
        {adminTab === '클래스' && <ClassContentEditor />}
        {adminTab === '길드 설정' && <GuildSettingsEditor settings={settings} setSettings={setSettings} />}
      </div>
    </motion.div>
  );
};

// --- 레이드/가디언 편집 (삭제 기능 추가) ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [form, setForm] = useState({ name: '', image_url: '', hp: '', element: '', attribute: '', d_card: '', s_card: '', gold: 0 });
  const category = isRaid ? '레이드' : '가디언 토벌';

  useEffect(() => { fetchItems(); }, [category]);

  const fetchItems = async () => {
    const { data } = await supabase.from('contents').select('*').eq('category', category).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력해주세요.");
    const { data: contentData, error: cErr } = await supabase.from('contents').upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' }).select().single();
    if (cErr) return alert(cErr.message);
    const { error: dErr } = await supabase.from('content_details').upsert({ content_id: contentData.id, difficulty: isRaid ? difficulty : null, gate_num: isRaid ? selectedGate : 0, hp: form.hp, element_type: form.element, attribute: form.attribute, dealer_cards: form.d_card, support_cards: form.s_card, clear_gold: form.gold }, { onConflict: 'content_id, difficulty, gate_num' });
    if (dErr) alert(dErr.message); else { alert("저장 성공!"); fetchItems(); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}'을(를) 정말 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (error) alert(error.message); else { alert("삭제 완료"); fetchItems(); }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminInput label="콘텐츠 이름" placeholder="에키드나 등" value={form.name} onChange={(v:any) => setForm({...form, name: v})} />
        <ImageUploader label="배경 이미지" onUpload={(url) => setForm({...form, image_url: url})} />
      </div>
      {isRaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest block italic">Gate Selection</label>
            <div className="flex gap-2 p-1 bg-black rounded-2xl border border-white/5">
              {[1, 2, 3, 4].map(g => (
                <button key={g} onClick={() => setSelectedGate(g)} className={`flex-1 py-3 rounded-xl font-black transition-all ${selectedGate === g ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-white'}`}>{g}G</button>
              ))}
            </div>
          </div>
          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest block italic">Difficulty</label>
            <div className="flex gap-2 p-1 bg-black rounded-2xl border border-white/5">
              {['노말', '하드', '나이트메어'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${difficulty === d ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminInput label="HP" value={form.hp} onChange={(v:any) => setForm({...form, hp: v})} />
        <AdminInput label="계열" value={form.element} onChange={(v:any) => setForm({...form, element: v})} />
        <AdminInput label="약점" value={form.attribute} onChange={(v:any) => setForm({...form, attribute: v})} />
      </div>
      <AdminInput label="클리어 골드" type="number" value={form.gold} onChange={(v:any) => setForm({...form, gold: v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-purple-500 transition-all"><Save size={20} /> Update {category} Data</button>

      {/* 리스트 출력 및 삭제 */}
      <div className="pt-10 border-t border-white/5 text-left">
        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 text-gray-500"><Layers size={18}/> Registered {category}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-black border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={item.image_url} className="w-10 h-10 object-cover rounded-lg" alt="" />
                <span className="font-bold text-sm uppercase italic">{item.name}</span>
              </div>
              <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 클래스 편집 (삭제 기능 추가) ---
const ClassContentEditor = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ root: '', sub: '', eng_job: '', link: '', image_url: '' });
  const [commonEngravings, setCommonEngravings] = useState<string[]>([]);
  const [arkPassive, setArkPassive] = useState<string[]>([]);
  const [counters, setCounters] = useState<string[]>([]);

  useEffect(() => { fetchClasses(); }, []);
  const fetchClasses = async () => {
    const { data } = await supabase.from('class_infos').select('*').order('sub_class');
    if (data) setItems(data);
  };
  const addField = (list: any, set: any, max: number) => { if (list.length < max) set([...list, ""]); };
  const updateField = (list: any, set: any, index: number, val: string) => { 
    const newList = [...list]; newList[index] = val; set(newList); 
  };
  const handleSave = async () => {
    if (!form.sub) return alert("직업명을 입력하세요.");
    const { error } = await supabase.from('class_infos').upsert({ root_class: form.root, sub_class: form.sub, engraving_job: form.eng_job, engraving_common: commonEngravings.filter(Boolean), ark_passive: arkPassive.filter(Boolean), counter_skills: counters.filter(Boolean), skill_code_link: form.link, image_url: form.image_url }, { onConflict: 'sub_class' });
    if (error) alert(error.message); else { alert("클래스 저장 완료!"); fetchClasses(); }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 클래스를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('class_infos').delete().eq('id', id);
    if (error) alert(error.message); else { alert("삭제 완료"); fetchClasses(); }
  };

  return (
    <div className="space-y-12 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminInput label="Root Class" placeholder="전사 등" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
        <AdminInput label="Sub Class" placeholder="버서커 등" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminInput label="Job Engraving" value={form.eng_job} onChange={(v:any)=>setForm({...form, eng_job:v})} />
        <ImageUploader label="Class Icon" onUpload={(url)=>setForm({...form, image_url: url})} />
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-purple-500 uppercase tracking-widest italic">Common Engravings</label><button onClick={() => addField(commonEngravings, setCommonEngravings, 5)} className="p-2 bg-purple-600 rounded-xl"><Plus size={16}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {commonEngravings.map((val, i) => (
            <input key={i} value={val} onChange={(e) => updateField(commonEngravings, setCommonEngravings, i, e.target.value)} className="bg-black border border-white/10 p-4 rounded-2xl text-xs font-bold outline-none focus:border-purple-500" placeholder={`각인 ${i+1}`} />
          ))}
        </div>
      </div>
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"><Save size={20} /> Update Class Meta</button>

      <div className="pt-10 border-t border-white/5">
        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 text-gray-500"><Users size={18}/> Registered Classes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-black border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={item.image_url} className="w-10 h-10 object-cover rounded-lg" alt="" />
                <span className="font-bold text-sm italic">{item.sub_class}</span>
              </div>
              <button onClick={() => handleDelete(item.id, item.sub_class)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 길드 설정 편집 ---
const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const handleSave = async () => {
    const { error } = await supabase.from('settings').upsert({ id: 1, ...settings });
    if (error) alert(error.message); else alert("길드 설정 업데이트 완료!");
  };
  return (
    <div className="space-y-8 text-left">
      <AdminInput label="Guild Name" value={settings.guild_name} onChange={(v:any)=>setSettings({...settings, guild_name: v})} />
      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Guild Description</label>
        <textarea className="w-full bg-black border border-white/10 p-5 rounded-3xl outline-none focus:border-purple-500 font-bold text-sm text-white min-h-[120px]" value={settings.guild_description} onChange={e => setSettings({...settings, guild_description: e.target.value})} />
      </div>
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-widest">Save Settings</button>
    </div>
  );
};

// --- 네비게이션바 (원본) ---
const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
    <div onClick={() => setActiveTab('home')} className="text-3xl font-black italic tracking-tighter cursor-pointer hover:text-purple-500 transition-colors select-none">INXX.</div>
    <div className="flex gap-10 items-center">
      <NavBtn active={activeTab === 'home'} icon={<Home size={18}/>} onClick={() => setActiveTab('home')}>Portal</NavBtn>
      <NavBtn active={activeTab === 'posts'} icon={<FileText size={18}/>} onClick={() => setActiveTab('posts')}>Record</NavBtn>
      {profile?.role === 'admin' && <NavBtn active={activeTab === 'admin'} icon={<Shield size={18}/>} onClick={() => setActiveTab('admin')}>Admin</NavBtn>}
      {user ? 
        <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-8 py-3 rounded-full hover:bg-white/10 transition-all border border-white/10">Sign Out</button> 
        : <button onClick={() => setActiveTab('login')} className="text-[10px] font-black uppercase tracking-widest bg-purple-600 px-8 py-3 rounded-full hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">Access</button>
      }
    </div>
  </nav>
);

const NavBtn = ({ children, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${active ? 'text-purple-500 scale-110' : 'text-gray-500 hover:text-white'}`}>
    {icon} {children}
  </button>
);

// --- 히어로 섹션 (원본) ---
const Hero = ({ settings }: any) => (
  <section className="relative h-[85vh] flex flex-col items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-[#0a0a0a]" />
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="relative z-10 text-center px-6">
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="text-purple-500 text-[10px] font-black uppercase tracking-[1em] mb-6 block italic">Lost Ark Guild Organization</motion.span>
      <h1 className="text-8xl md:text-[14rem] font-black italic tracking-tighter leading-none mb-10 uppercase select-none opacity-90 drop-shadow-2xl">{settings.guild_name}</h1>
      <p className="max-w-2xl mx-auto text-gray-400 font-bold uppercase tracking-[0.3em] leading-relaxed text-xs opacity-60 italic">{settings.guild_description}</p>
    </motion.div>
    <div className="absolute bottom-10 animate-bounce opacity-20"><ChevronRight size={32} className="rotate-90"/></div>
  </section>
);

// --- 메인 콘텐츠 뷰어 (원본) ---
const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      if (type === '클래스') {
        const { data } = await supabase.from('class_infos').select('*').order('sub_class');
        setItems(data || []);
      } else {
        const { data } = await supabase.from('contents').select('*').eq('category', type).order('created_at', { ascending: false });
        setItems(data || []);
      }
    };
    fetchData();
  }, [type]);
  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 py-20">
      {items.map(item => (
        <motion.div whileHover={{ y: -20, scale: 1.02 }} key={item.id} onClick={() => setSelectedItem(item)} className="group relative overflow-hidden rounded-[3rem] border border-white/5 bg-black aspect-[4/5] cursor-pointer shadow-2xl">
          <img src={item.image_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-[2s]" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-12 left-12 right-12 text-left">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mb-4 block italic">{type}</span>
            <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter leading-none group-hover:text-purple-400 transition-colors">{item.name || item.sub_class}</h3>
            <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest bg-white text-black px-10 py-5 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xl">Specification <ChevronRight size={16} /></button>
          </div>
        </motion.div>
      ))}
      <AnimatePresence>{selectedItem && <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />}</AnimatePresence>
    </section>
  );
};

// --- 상세 정보 팝업 (원본) ---
const DetailPopup = ({ item, type, onClose }: any) => {
  const [gate, setGate] = useState(1);
  const [diff, setDiff] = useState('노말');
  const [details, setDetails] = useState<any>(null);
  useEffect(() => {
    if (type !== '클래스') {
      const fetchDetail = async () => {
        const { data } = await supabase.from('content_details').select('*').eq('content_id', item.id).eq('difficulty', type === '레이드' ? diff : null).eq('gate_num', type === '레이드' ? gate : 0).maybeSingle();
        setDetails(data);
      };
      fetchDetail();
    }
  }, [gate, diff, item, type]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative scrollbar-hide text-left">
        <button onClick={onClose} className="absolute top-10 right-10 text-white/30 hover:text-white"><X size={40}/></button>
        <div className="flex flex-col md:flex-row gap-12 mb-12">
          <img src={item.image_url} className="w-full md:w-64 h-64 object-cover rounded-[3rem] border border-white/10 shadow-2xl" alt="" />
          <div className="flex flex-col justify-end">
            <h2 className="text-7xl font-black italic uppercase text-purple-500 mb-4 tracking-tighter leading-none">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.5em] italic">Tactical Briefing Data</p>
          </div>
        </div>
        {type === '레이드' && (
          <div className="flex flex-wrap gap-6 mb-12">
            <div className="flex gap-2 p-2 bg-black rounded-2xl border border-white/5">
              {[1, 2, 3, 4].map(g => (<button key={g} onClick={() => setGate(g)} className={`px-8 py-3 rounded-xl font-black transition-all ${gate === g ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-white'}`}>{g}G</button>))}
            </div>
            <div className="flex gap-2 p-2 bg-black rounded-2xl border border-white/5">
              {['노말', '하드', '나이트메어'].map(d => (<button key={d} onClick={() => setDiff(d)} className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${diff === d ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}>{d}</button>))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {type === '클래스' ? (
            <><SpecBox label="직업 각인" value={item.engraving_job} /><SpecBox label="공용 각인 추천" value={item.engraving_common?.join(', ')} span={2} /><SpecBox label="아크 패시브" value={item.ark_passive?.join(' / ')} span={3} /></>
          ) : (
            details ? (
              <><SpecBox label="HP" value={details.hp} color="text-red-500" /><SpecBox label="계열" value={details.element_type} /><SpecBox label="속성/약점" value={details.attribute} /><SpecBox label="추천 카드 (딜러)" value={details.dealer_cards} /><SpecBox label="추천 카드 (서포터)" value={details.support_cards} span={2} /><SpecBox label="CLEAR GOLD" value={`${details.clear_gold?.toLocaleString()} G`} color="text-yellow-400" span={3} large /></>
            ) : <div className="col-span-3 py-24 text-center text-gray-800 font-black italic uppercase tracking-widest border border-dashed border-white/5 rounded-[2rem]">No Tactical Data</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SpecBox = ({ label, value, span = 1, color = "text-white", large = false }: any) => (
  <div className={`p-8 bg-white/5 rounded-3xl border border-white/5 ${span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''}`}>
    <label className="text-[10px] font-black text-purple-500/50 uppercase tracking-[0.3em] mb-4 block italic">{label}</label>
    <div className={`${large ? 'text-4xl' : 'text-xl'} font-black ${color} tracking-tight`}>{value || '-'}</div>
  </div>
);

// --- 게시판 (원본) ---
const PostBoard = ({ posts }: any) => {
  const [currentTab, setCurrentTab] = useState('전체');
  const tabs = ["전체", "스크린샷", "MVP", "커스터마이징 및 의상", "수집형 포인트"];
  const filteredPosts = posts.filter((p: any) => currentTab === '전체' || p.category === currentTab);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto p-12 text-left pb-40">
      <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-12 underline decoration-purple-600/30 underline-offset-[20px]">Archive Record</h2>
      <div className="flex gap-4 mb-16 overflow-x-auto pb-4 scrollbar-hide">
        {tabs.map(t => (<button key={t} onClick={() => setCurrentTab(t)} className={`whitespace-nowrap px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === t ? 'bg-purple-600 text-white shadow-xl' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{t}</button>))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post: any) => (
          <motion.div whileHover={{ y: -10 }} key={post.id} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 group cursor-pointer relative overflow-hidden h-64 flex flex-col">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity"><FileText size={80}/></div>
             <span className="text-[10px] font-black text-purple-600 uppercase mb-4 block tracking-widest">{post.category}</span>
             <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors mb-8 leading-tight">{post.title}</h3>
             <div className="flex items-center gap-3 mt-auto">
               <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-[10px] font-black italic">IN</div>
               <p className="text-gray-500 text-[10px] font-black uppercase italic tracking-tighter">{post.author} // {new Date(post.created_at).toLocaleDateString()}</p>
             </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// --- 레이드 캘린더 (원본) ---
const RaidCalendar = ({ user }: any) => (
  <section id="calendar" className="max-w-7xl mx-auto px-6 py-40 border-t border-white/5 text-left">
    <div className="flex items-center gap-6 mb-16">
      <div className="p-5 bg-purple-600/10 rounded-3xl border border-purple-500/20"><CalendarIcon className="text-purple-500" size={30} /></div>
      <h2 className="text-5xl font-black italic tracking-tighter uppercase font-mono">Operation Calendar</h2>
    </div>
    <div className="py-40 text-center border border-dashed border-white/10 rounded-[4rem] text-gray-800 font-black italic uppercase tracking-[0.5em] bg-white/[0.01]">Calendar System Synchronizing...</div>
  </section>
);

// --- 인증 (원본) ---
const Auth = ({ mode, setMode }: { mode: string, setMode: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, nickname, role: 'user' }]);
        alert("가입 성공!"); setMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else setMode('home');
    }
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto pt-32 pb-40 px-6">
      <div className="bg-[#111] p-12 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-4 text-center leading-none">{mode}</h2>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-center italic">Authorization Required</p>
        <form onSubmit={handleAuth} className="space-y-6 text-left">
          <input type="email" placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-6 rounded-3xl outline-none focus:border-purple-500 text-sm font-black text-white" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-6 rounded-3xl outline-none focus:border-purple-500 text-sm font-black text-white" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && <input type="text" placeholder="NICKNAME" className="w-full bg-black border border-white/10 p-6 rounded-3xl outline-none focus:border-purple-500 text-sm font-black text-white" value={nickname} onChange={e => setNickname(e.target.value)} required />}
          <button type="submit" className="w-full bg-purple-600 p-7 rounded-3xl font-black uppercase tracking-[0.3em] mt-8 hover:bg-purple-500 transition-all text-white">Proceed</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-12 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-[0.3em]">{mode === 'login' ? "Need an account? Sign Up" : "Already registered? Login"}</button>
      </div>
    </motion.div>
  );
};
