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
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 to-red-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase">
          👑 Administrator Session Active
        </div>
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />
      
      <main className={profile?.role === 'admin' ? "pt-20" : "pt-16"}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <Hero settings={settings} />
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
            </motion.div>
          )}

          {activeTab === 'posts' && <PostBoard posts={posts} />}
          {activeTab === 'admin' && profile?.role === 'admin' && <AdminPanel settings={settings} setSettings={setSettings} />}
          {(activeTab === 'login' || activeTab === 'signup') && <Auth key="auth" mode={activeTab} setMode={setActiveTab} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- 공통 컴포넌트: 이미지 업로더 ---
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

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert(`이미지 업로드 실패: ${err.message}\n(버킷이 생성되어 있는지 확인해 주세요.)`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`file-${label}`} disabled={uploading} />
        <label htmlFor={`file-${label}`} className="flex items-center justify-center gap-3 w-full bg-black border border-white/10 p-4 rounded-2xl cursor-pointer hover:border-purple-500 transition-all text-xs font-black text-gray-500 group-hover:text-white">
          {uploading ? "UPLOADING..." : <><ImageIcon size={16}/> {label} 업로드</>}
        </label>
      </div>
    </div>
  );
};

// --- [관리자] 통합 설정 패널 ---
const AdminPanel = ({ settings, setSettings }: any) => {
  const [adminTab, setAdminTab] = useState('레이드');

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-8 text-left">
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
        {adminTab === '길드 설정' && <GuildSettingsEditor settings={settings} setSettings={setSettings} />}
      </div>
    </motion.div>
  );
};

// --- [기능] 레이드 & 가디언 에디터 + 삭제 기능 ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', image_url: '', hp: '', element: '', attribute: '', d_card: '', s_card: '', gold: 0
  });

  const category = isRaid ? '레이드' : '가디언 토벌';

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    const { data } = await supabase.from('contents').select('*').eq('category', category).order('created_at', { ascending: false });
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.name) return alert("콘텐츠 이름을 입력해주세요.");
    const { data: contentData, error: cErr } = await supabase.from('contents')
      .upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' })
      .select().single();

    if (cErr) return alert("저장 실패: " + cErr.message);

    const { error: dErr } = await supabase.from('content_details')
      .upsert({
        content_id: contentData.id,
        difficulty: isRaid ? difficulty : null,
        gate_num: isRaid ? selectedGate : 0,
        hp: form.hp,
        element_type: form.element,
        attribute: form.attribute,
        dealer_cards: form.d_card,
        support_cards: form.s_card,
        clear_gold: form.gold
      }, { onConflict: 'content_id, difficulty, gate_num' });

    if (dErr) alert("상세 정보 저장 실패: " + dErr.message);
    else {
      alert(`[${form.name}] 업데이트 완료!`);
      fetchItems();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 항목을 정말 삭제하시겠습니까? 관련 상세 정보도 모두 삭제됩니다.`)) return;
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert("삭제되었습니다.");
      fetchItems();
    }
  };

  return (
    <div className="space-y-12">
      {/* 입력 폼 */}
      <div className="space-y-8 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminInput label="Content Name" placeholder={isRaid ? "카제로스 - 에키드나" : "에기르"} value={form.name} onChange={(v:any) => setForm({...form, name: v})} />
          <ImageUploader label="Background Image" onUpload={(url) => setForm({...form, image_url: url})} />
        </div>

        {isRaid && (
          <div className="space-y-4">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest block italic">Gate & Difficulty</label>
            <div className="flex flex-wrap gap-4">
              <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/10">
                {[1, 2, 3, 4].map(g => (
                  <button key={g} onClick={() => setSelectedGate(g)} className={`px-4 py-2 rounded-lg font-black transition-all ${selectedGate === g ? 'bg-purple-600' : 'text-gray-500 hover:text-white'}`}>{g}G</button>
                ))}
              </div>
              <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/10">
                {['노말', '하드', '나이트메어'].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${difficulty === d ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminInput label="HP" value={form.hp} onChange={(v:any) => setForm({...form, hp: v})} />
          <AdminInput label="Element" value={form.element} onChange={(v:any) => setForm({...form, element: v})} />
          <AdminInput label="Attribute" value={form.attribute} onChange={(v:any) => setForm({...form, attribute: v})} />
        </div>

        <AdminInput label="Clear Gold" type="number" value={form.gold} onChange={(v:any) => setForm({...form, gold: v})} />

        <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 transition-all">
          <Save size={20} /> Update {category}
        </button>
      </div>

      {/* 목록 및 삭제 섹션 */}
      <div className="pt-10 border-t border-white/5">
        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><Layers size={20} className="text-purple-500"/> Current {category} List</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-black/50 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-12 h-12 object-cover rounded-lg border border-white/10" alt="" />
                <span className="font-black text-sm uppercase italic tracking-tighter">{item.name}</span>
              </div>
              <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-full py-10 text-center text-gray-700 font-black italic uppercase">No contents found.</div>}
        </div>
      </div>
    </div>
  );
};

// --- [기능] 클래스 에디터 + 삭제 기능 ---
const ClassContentEditor = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ root: '', sub: '', eng_job: '', link: '', image_url: '' });
  const [commonEngravings, setCommonEngravings] = useState<string[]>([]);
  const [arkPassive, setArkPassive] = useState<string[]>([]);
  const [counters, setCounters] = useState<string[]>([]);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('class_infos').select('*').order('sub_class');
    setItems(data || []);
  };

  const addField = (list: any, set: any, max: number) => { if(list.length < max) set([...list, ""]); };
  const updateField = (list: any, set: any, index: number, val: string) => { const newList = [...list]; newList[index] = val; set(newList); };

  const handleSave = async () => {
    if(!form.sub) return alert("직업명을 입력하세요.");
    const { error } = await supabase.from('class_infos').upsert({ 
      root_class: form.root, sub_class: form.sub, engraving_job: form.eng_job, 
      engraving_common: commonEngravings.filter(Boolean), 
      ark_passive: arkPassive.filter(Boolean), 
      counter_skills: counters.filter(Boolean), 
      skill_code_link: form.link,
      image_url: form.image_url
    }, { onConflict: 'sub_class' });

    if (error) alert(error.message); 
    else {
      alert("클래스 정보가 저장되었습니다.");
      fetchClasses();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 클래스를 정말 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('class_infos').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      alert("삭제되었습니다.");
      fetchClasses();
    }
  };

  return (
    <div className="space-y-12 text-left">
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput label="Root Class" placeholder="전사" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
          <AdminInput label="Sub Class" placeholder="버서커" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput label="Job Engraving" value={form.eng_job} onChange={(v:any)=>setForm({...form, eng_job:v})} />
          <ImageUploader label="Class Image" onUpload={(url)=>setForm({...form, image_url: url})} />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center"><label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Common Engravings (Max 5)</label><button onClick={() => addField(commonEngravings, setCommonEngravings, 5)} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {commonEngravings.map((val, i) => (
              <input key={i} value={val} onChange={(e) => updateField(commonEngravings, setCommonEngravings, i, e.target.value)} className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:border-purple-500" placeholder={`각인 ${i+1}`} />
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 transition-all">
          <Save size={20} /> Update Class Metadata
        </button>
      </div>

      <div className="pt-10 border-t border-white/5">
        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2"><Users size={20} className="text-purple-500"/> Registered Classes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-black/50 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-12 h-12 object-cover rounded-lg border border-white/10" alt="" />
                <span className="font-black text-sm uppercase italic tracking-tighter">{item.sub_class}</span>
              </div>
              <button onClick={() => handleDelete(item.id, item.sub_class)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- [기능] 길드 설정 에디터 ---
const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const handleSave = async () => {
    const { error } = await supabase.from('settings').upsert(settings);
    if (error) alert(error.message); else alert("길드 설정이 업데이트되었습니다!");
  };

  return (
    <div className="space-y-8">
      <AdminInput label="Guild Name (Main Title)" value={settings.guild_name} onChange={(v:any)=>setSettings({...settings, guild_name: v})} />
      <AdminInput label="Guild Description" value={settings.guild_description} onChange={(v:any)=>setSettings({...settings, guild_description: v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all">
        Update Hero Section
      </button>
    </div>
  );
};

// --- 기타 공통 컴포넌트 ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-3 text-left">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} placeholder={placeholder} className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all" value={value} onChange={e => onChange && onChange(e.target.value)} />
  </div>
);

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
    <h1 onClick={() => setActiveTab('home')} className="text-3xl font-black italic tracking-tighter cursor-pointer hover:text-purple-500 transition-colors">INXX.</h1>
    <div className="flex gap-8 items-center">
      <NavBtn active={activeTab === 'home'} icon={<Home size={18}/>} onClick={() => setActiveTab('home')}>Portal</NavBtn>
      <NavBtn active={activeTab === 'posts'} icon={<FileText size={18}/>} onClick={() => setActiveTab('posts')}>Record</NavBtn>
      {profile?.role === 'admin' && <NavBtn active={activeTab === 'admin'} icon={<Shield size={18}/>} onClick={() => setActiveTab('admin')}>Admin</NavBtn>}
      {user ? 
        <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full hover:bg-white/10 transition-all border border-white/10">Sign Out</button> 
        : <button onClick={() => setActiveTab('login')} className="text-[10px] font-black uppercase tracking-widest bg-purple-600 px-6 py-2 rounded-full hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">Access</button>
      }
    </div>
  </nav>
);

const NavBtn = ({ children, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'text-purple-500' : 'text-gray-500 hover:text-white'}`}>
    {icon} {children}
  </button>
);

const Hero = ({ settings }: any) => (
  <section className="relative h-[70vh] flex flex-col items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-[#0a0a0a]" />
    <motion.div initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} className="relative z-10 text-center px-6">
      <span className="text-purple-500 text-[10px] font-black uppercase tracking-[1em] mb-4 block italic">Lost Ark Guild Organization</span>
      <h1 className="text-8xl md:text-[12rem] font-black italic tracking-tighter leading-none mb-8 uppercase select-none opacity-90">{settings.guild_name}</h1>
      <p className="max-w-xl mx-auto text-gray-400 font-bold uppercase tracking-widest leading-relaxed text-sm opacity-60">{settings.guild_description}</p>
    </motion.div>
  </section>
);

// --- [컴포넌트] 메인 콘텐츠 뷰어 (상세정보 팝업 포함) ---
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
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
      {items.length === 0 && <div className="col-span-3 text-center text-gray-600 font-black italic py-10 uppercase">No Contents Registered.</div>}
      {items.map(item => (
        <motion.div whileHover={{ y: -10 }} key={item.id} onClick={() => setSelectedItem(item)} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black aspect-[4/5] cursor-pointer shadow-2xl">
          <img src={item.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2 block italic">{type}</span>
            <h3 className="text-3xl font-black italic mb-6 uppercase tracking-tighter leading-none">{item.name || item.sub_class}</h3>
            <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-4 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all">
              View Details <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      ))}
      <AnimatePresence>
        {selectedItem && <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </section>
  );
};

// --- [기능] 상세 정보 팝업 ---
const DetailPopup = ({ item, type, onClose }: any) => {
  const [gate, setGate] = useState(1);
  const [diff, setDiff] = useState('노말');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (type !== '클래스') {
      const fetchDetail = async () => {
        const { data } = await supabase.from('content_details').select('*')
          .eq('content_id', item.id)
          .eq('difficulty', type === '레이드' ? diff : null)
          .eq('gate_num', type === '레이드' ? gate : 0)
          .maybeSingle();
        setDetails(data);
      };
      fetchDetail();
    }
  }, [gate, diff, item, type]);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={32}/></button>
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <img src={item.image_url} className="w-full md:w-48 h-48 object-cover rounded-3xl border border-white/10 shadow-2xl" alt="" />
          <div className="flex flex-col justify-end">
            <h2 className="text-5xl font-black italic uppercase text-purple-500 mb-2">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest italic">{type} Detailed Specification</p>
          </div>
        </div>
        
        {type === '레이드' && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {[1,2,3,4].map(g=><button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black transition-all ${gate===g?'bg-purple-600':'text-gray-500'}`}>{g}관문</button>)}
            </div>
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {['노말','하드','나이트메어'].map(d=><button key={d} onClick={()=>setDiff(d)} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${diff===d?'bg-white text-black':'text-gray-500'}`}>{d}</button>)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {type === '클래스' ? (
            <>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">직업 각인</label><div className="text-lg font-black">{item.engraving_job || '-'}</div></div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 md:col-span-2"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">공용 각인</label><div className="text-lg font-black">{item.engraving_common?.join(', ') || '-'}</div></div>
            </>
          ) : (
            details ? (
              <>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">HP (체력)</label><div className="text-lg font-black text-white">{details.hp || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">계열</label><div className="text-lg font-black text-white">{details.element_type || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">속성</label><div className="text-lg font-black text-white">{details.attribute || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-purple-500/20 md:col-span-3"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">클리어 골드</label><div className="text-2xl font-black text-yellow-400">{details.clear_gold?.toLocaleString() || '0'} G</div></div>
              </>
            ) : <div className="col-span-3 py-20 text-center text-gray-700 font-black italic uppercase tracking-widest">해당 관문/난이도의 데이터가 없습니다.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- [기능] 게시판 (생략 가능하나 구조 유지) ---
const PostBoard = ({ posts }: any) => {
  const [currentTab, setCurrentTab] = useState('전체');
  const tabs = ["전체", "스크린샷", "MVP", "커스터마이징 및 의상", "수집형 포인트"];
  const filteredPosts = posts.filter((p: any) => currentTab === '전체' || p.category === currentTab);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-12 text-left">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter underline decoration-purple-600/30 underline-offset-8">Bulletin Board</h2>
      </div>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setCurrentTab(t)} className={`whitespace-nowrap px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${currentTab === t ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post: any) => (
          <div key={post.id} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-purple-500/30 transition-all group">
            <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors mb-4">{post.title}</h3>
            <p className="text-gray-500 text-[10px] font-black uppercase italic">{post.author} // {new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// --- [기능] 로그인/회원가입 ---
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
        await supabase.from('profiles').insert([{ id: data.user.id, nickname }]);
        alert("회원가입 성공!");
        setMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setMode('home');
    }
  };

  return (
    <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="max-w-md mx-auto pt-20 pb-40">
      <div className="bg-[#111] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
        <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-center">{mode}</h2>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 text-center italic">Authorization Required</p>
        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <input type="email" placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm font-black text-white" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm font-black text-white" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && (
            <input type="text" placeholder="NICKNAME" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm font-black text-white" value={nickname} onChange={e => setNickname(e.target.value)} required />
          )}
          <button type="submit" className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-widest mt-6 hover:bg-purple-500 transition-colors shadow-lg active:scale-95 text-white">Proceed</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-8 text-[10px] font-black text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]">
          {mode === 'login' ? "Need an account? Sign Up" : "Already registered? Login"}
        </button>
      </div>
    </motion.div>
  );
};

// --- [기능] 레이드 캘린더 (기본 구조) ---
const RaidCalendar = ({ user }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <section id="calendar" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
      <div className="flex items-center gap-5 mb-12">
        <div className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20">
          <CalendarIcon className="text-purple-500" />
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter uppercase font-mono">{year}. {String(month + 1).padStart(2, '0')}</h2>
      </div>
      <div className="py-20 text-center border border-dashed border-white/10 rounded-[3rem] text-gray-700 font-black italic uppercase">
        Calendar details will be displayed here.
      </div>
    </section>
  );
};
