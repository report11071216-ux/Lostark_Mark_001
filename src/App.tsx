import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Settings,
  Database, Layers, Link as LinkIcon, Save, Info, Image as ImageIcon,
  Send, Camera, MessageSquare
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

  // 초기 로드
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
    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (postsData) setPosts(postsData);
    if (settingsData) setSettings(settingsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold italic tracking-widest animate-pulse">INXX SYSTEM LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 via-red-900 to-purple-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase animate-gradient-x">
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

          {activeTab === 'posts' && <PostBoard posts={posts} user={user} profile={profile} refreshPosts={fetchInitialData} />}
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
      const filePath = `images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) { alert(`업로드 실패: ${err.message}`); } finally { setUploading(false); }
  };
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`file-${label}`} />
      <label htmlFor={`file-${label}`} className="flex items-center justify-center gap-3 w-full bg-black border border-white/10 p-4 rounded-2xl cursor-pointer hover:border-purple-500 transition-all text-xs font-black text-gray-500 hover:text-white group">
        {uploading ? "UPLOADING..." : <><ImageIcon size={16} className="group-hover:text-purple-500 transition-colors"/> {label} 업로드</>}
      </label>
    </div>
  );
};

// --- [기능] 메인 콘텐츠 뷰어 ---
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
      {items.map(item => (
        <motion.div whileHover={{ y: -10 }} key={item.id} onClick={() => setSelectedItem(item)} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black aspect-[4/5] cursor-pointer shadow-2xl">
          <img src={item.image_url || ''} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10">
            <span className="text-[10px] font-black text-purple-500 uppercase mb-2 block italic tracking-[0.2em]">{type}</span>
            <h3 className="text-3xl font-black italic mb-6 uppercase tracking-tighter leading-none">{item.name || item.sub_class}</h3>
            <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-4 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all">View Details</button>
          </div>
        </motion.div>
      ))}
      <AnimatePresence>{selectedItem && <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />}</AnimatePresence>
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
        const { data } = await supabase.from('content_details').select('*').eq('content_id', item.id).eq('difficulty', type === '레이드' ? diff : null).eq('gate_num', type === '레이드' ? gate : 0).maybeSingle();
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
          <img src={item.image_url} className="w-full md:w-56 h-56 object-cover rounded-[2rem] border border-white/10 shadow-2xl" />
          <div className="flex flex-col justify-end">
            <h2 className="text-6xl font-black italic uppercase text-purple-500 mb-2 tracking-tighter leading-none">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] italic">{type} Spec Report</p>
          </div>
        </div>

        {type === '레이드' && (
          <div className="flex gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {[1,2,3,4].map(g=><button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black transition-all ${gate===g?'bg-purple-600 text-white shadow-lg shadow-purple-600/30':'text-gray-500'}`}>{g}관문</button>)}
            </div>
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {['노말','하드','나이트메어'].map(d=><button key={d} onClick={()=>setDiff(d)} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${diff===d?'bg-white text-black':'text-gray-500'}`}>{d}</button>)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {type === '클래스' ? (
            <>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5 md:col-span-3">
                <label className="text-[10px] font-black text-purple-500/50 uppercase mb-4 block italic tracking-widest">직업 시너지 (Class Synergy)</label>
                <div className="text-3xl font-black text-white">{item.synergy || '정보 없음'}</div>
              </div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase mb-2 block italic">직업 각인</label><div className="text-xl font-black">{item.engraving_job}</div></div>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/5 md:col-span-2"><label className="text-[10px] font-black text-purple-500/50 uppercase mb-2 block italic">주요 뿌리</label><div className="text-xl font-black text-gray-400">{item.root_class}</div></div>
            </>
          ) : (
            details ? (
              <>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase mb-2 block italic">HP (체력)</label><div className="text-xl font-black">{details.hp || '-'}</div></div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase mb-2 block italic">계열</label><div className="text-xl font-black">{details.element_type || '-'}</div></div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase mb-2 block italic">속성</label><div className="text-xl font-black">{details.attribute || '-'}</div></div>
                <div className="p-8 bg-white/5 rounded-3xl border border-purple-500/20 md:col-span-3 flex justify-between items-center shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                  <label className="text-[10px] font-black text-purple-500/50 uppercase italic tracking-widest">Clear Gold Reward</label>
                  <div className="text-3xl font-black text-yellow-400">{details.clear_gold?.toLocaleString() || 0} G</div>
                </div>
              </>
            ) : <div className="col-span-3 py-24 text-center text-gray-800 font-black italic uppercase tracking-[0.5em]">No Data Registered</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- [관리자] 통합 설정 패널 ---
const AdminPanel = ({ settings, setSettings }: any) => {
  const [adminTab, setAdminTab] = useState('레이드');
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-8 text-left">
      <div className="flex items-center gap-4 mb-10"><Settings className="text-purple-500" size={32}/><h2 className="text-4xl font-black italic uppercase tracking-tighter">Admin Console</h2></div>
      <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {['레이드', '가디언 토벌', '클래스', '길드 설정'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} className={`px-8 py-3 rounded-full text-[11px] font-black uppercase transition-all tracking-widest ${adminTab === t ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{t}</button>
        ))}
      </div>
      <div className="bg-[#111] border border-white/5 rounded-[3rem] p-12 shadow-inner">
        {adminTab === '레이드' && <RaidContentEditor isRaid={true} />}
        {adminTab === '가디언 토벌' && <RaidContentEditor isRaid={false} />}
        {adminTab === '클래스' && <ClassContentEditor />}
        {adminTab === '길드 설정' && <GuildSettingsEditor settings={settings} setSettings={setSettings} />}
      </div>
    </motion.div>
  );
};

// --- [관리자 전용] 레이드/가디언 리스트 & 삭제 에디터 ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', image_url: '', hp: '', element: '', attribute: '', gold: 0 });
  const category = isRaid ? '레이드' : '가디언 토벌';

  useEffect(() => { fetchItems(); }, [category]);

  const fetchItems = async () => {
    const { data } = await supabase.from('contents').select('*').eq('category', category).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 사라집니다.")) {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchItems();
    }
  };

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력하세요.");
    const { data, error } = await supabase.from('contents').upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' }).select().single();
    if (!error) {
      await supabase.from('content_details').upsert({ 
        content_id: data.id, 
        hp: form.hp, 
        element_type: form.element, 
        attribute: form.attribute, 
        clear_gold: Number(form.gold), 
        difficulty: isRaid ? '노말' : null, 
        gate_num: isRaid ? 1 : 0 
      });
      alert("데이터가 동기화되었습니다!"); fetchItems();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="space-y-6">
        <h4 className="text-xl font-black italic text-purple-500 uppercase tracking-tighter flex items-center gap-2"><Plus size={20}/> New {category} Registration</h4>
        <AdminInput label="Content Name" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} placeholder="에키드나, 에기르 등" />
        <ImageUploader label="Visual Media" onUpload={(url)=>setForm({...form, image_url: url})} />
        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="HP (체력)" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} />
          <AdminInput label="Clear Gold" type="number" value={form.gold} onChange={(v:any)=>setForm({...form, gold:v})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="Element (계열)" placeholder="인간, 악마 등" value={form.element} onChange={(v:any)=>setForm({...form, element:v})} />
          <AdminInput label="Attribute (속성)" placeholder="성속성 취약 등" value={form.attribute} onChange={(v:any)=>setForm({...form, attribute:v})} />
        </div>
        <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">Update Database</button>
      </div>

      <div className="space-y-6">
        <h4 className="text-xl font-black italic text-gray-500 uppercase tracking-tighter flex items-center gap-2"><Database size={20}/> Database Inventory</h4>
        <div className="bg-black/40 rounded-[2rem] border border-white/5 max-h-[500px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {items.length === 0 && <div className="text-center py-20 text-gray-700 font-black italic uppercase">Empty List</div>}
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-4">
                <img src={item.image_url} className="w-12 h-12 object-cover rounded-2xl shadow-xl" />
                <div>
                  <div className="font-black text-sm uppercase">{item.name}</div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase">{new Date(item.created_at).toLocaleDateString()} Registered</div>
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- [관리자 전용] 클래스 리스트 & 삭제 에디터 ---
const ClassContentEditor = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ root: '', sub: '', eng: '', synergy: '', url: '' });

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('class_infos').select('*').order('sub_class');
    if (data) setClasses(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm("클래스 정보를 영구 삭제하시겠습니까?")) {
      await supabase.from('class_infos').delete().eq('id', id);
      fetchClasses();
    }
  };

  const handleSave = async () => {
    if(!form.sub) return alert("전직 명칭을 입력하세요.");
    const { error } = await supabase.from('class_infos').upsert({ 
      root_class: form.root, 
      sub_class: form.sub, 
      engraving_job: form.eng, 
      synergy: form.synergy, 
      image_url: form.url 
    }, { onConflict: 'sub_class' });
    if (!error) { alert("클래스 동기화 완료!"); fetchClasses(); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="space-y-6">
        <h4 className="text-xl font-black italic text-purple-500 uppercase tracking-tighter flex items-center gap-2"><Plus size={20}/> New Class Registration</h4>
        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="Root Class" placeholder="전사" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
          <AdminInput label="Sub Class" placeholder="버서커" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
        </div>
        <AdminInput label="Class Synergy (시너지)" placeholder="치적, 상시 방깎 등" value={form.synergy} onChange={(v:any)=>setForm({...form, synergy:v})} />
        <AdminInput label="Job Engraving" value={form.eng} onChange={(v:any)=>setForm({...form, eng:v})} />
        <ImageUploader label="Class Visual" onUpload={(url)=>setForm({...form, url: url})} />
        <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">Register Metadata</button>
      </div>

      <div className="space-y-6">
        <h4 className="text-xl font-black italic text-gray-500 uppercase tracking-tighter flex items-center gap-2"><Layers size={20}/> Registered Classes</h4>
        <div className="bg-black/40 rounded-[2rem] border border-white/5 max-h-[500px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {classes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-4">
                <img src={c.image_url} className="w-12 h-12 object-cover rounded-2xl shadow-xl" />
                <div>
                  <div className="font-black text-sm uppercase">{c.sub_class}</div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{c.root_class} Type</div>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- [기능] 길드 메인 설정 ---
const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const handleSave = async () => {
    const { error } = await supabase.from('settings').upsert(settings);
    if (!error) alert("길드 마스터 브리핑이 업데이트되었습니다.");
  };
  return (
    <div className="space-y-8 max-w-2xl">
      <AdminInput label="Main Guild Name" value={settings.guild_name} onChange={(v:any)=>setSettings({...settings, guild_name: v})} />
      <div className="space-y-3">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Guild Message</label>
        <textarea 
          className="w-full bg-black border border-white/10 p-6 rounded-[2rem] h-48 outline-none focus:border-purple-500 font-bold text-sm text-white resize-none"
          value={settings.guild_description}
          onChange={e => setSettings({...settings, guild_description: e.target.value})}
        />
      </div>
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Apply Branding</button>
    </div>
  );
};

// --- [기능] 게시판 (전체 통합) ---
const PostBoard = ({ posts, user, profile, refreshPosts }: any) => {
  const [currentTab, setCurrentTab] = useState('전체');
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  
  const tabs = ["전체", "스크린샷", "MVP", "커스터마이징 및 의상", "자유게시판"];
  const filteredPosts = posts.filter((p: any) => currentTab === '전체' || p.category === currentTab);

  const handleDeletePost = async (id: string) => {
    if (confirm("게시글을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) alert(error.message);
      else refreshPosts();
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-12 text-left">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Guild Archive</h2>
          <p className="text-gray-600 text-xs font-bold tracking-widest uppercase italic">Member communication channel</p>
        </div>
        {user && (
          <button 
            onClick={() => setIsWriteOpen(true)}
            className="flex items-center gap-3 bg-purple-600 px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/20 active:scale-95"
          >
            <Plus size={18}/> New Publication
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
        {tabs.map(t => (
          <button 
            key={t} 
            onClick={() => setCurrentTab(t)} 
            className={`whitespace-nowrap px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === t ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPosts.length === 0 && <div className="col-span-2 py-40 text-center text-gray-800 font-black italic uppercase tracking-[0.4em] border border-dashed border-white/5 rounded-[4rem]">No Content available</div>}
        {filteredPosts.map((post: any) => (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            key={post.id} 
            className="p-10 bg-[#0f0f0f] rounded-[3.5rem] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden"
          >
            {(profile?.role === 'admin' || user?.id === post.user_id) && (
              <button onClick={() => handleDeletePost(post.id)} className="absolute top-8 right-8 text-gray-700 hover:text-red-500 transition-colors z-10"><Trash2 size={20}/></button>
            )}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-purple-500 text-[9px] font-black uppercase tracking-[0.3em] italic bg-purple-500/5 px-3 py-1 rounded-lg">{post.category}</span>
              <span className="text-gray-700 text-[9px] font-black uppercase tracking-[0.2em] italic">#{post.id.slice(0,5)}</span>
            </div>
            <h3 className="text-3xl font-black text-white group-hover:text-purple-400 mb-8 tracking-tighter transition-colors leading-tight">{post.title}</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-red-600 rounded-2xl flex items-center justify-center text-[10px] font-black">{post.author?.[0]}</div>
                <div>
                  <p className="text-white text-xs font-black uppercase tracking-tighter">{post.author || "Guest"}</p>
                  <p className="text-gray-600 text-[9px] font-bold uppercase">{post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Recently"}</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl group-hover:bg-purple-600 transition-all"><MessageSquare size={16} className="text-gray-500 group-hover:text-white" /></div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isWriteOpen && <PostWriteModal user={user} onClose={() => setIsWriteOpen(false)} onRefresh={refreshPosts} />}
      </AnimatePresence>
    </motion.div>
  );
};

// --- [기능] 게시판 글쓰기 모달 ---
const PostWriteModal = ({ user, onClose, onRefresh }: any) => {
  const [form, setForm] = useState({ title: '', content: '', category: '스크린샷', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.content) return alert("제목과 내용을 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.from('posts').insert([{
      title: form.title,
      content: form.content,
      category: form.category,
      image_url: form.imageUrl,
      user_id: user.id,
      author: user.email.split('@')[0]
    }]);

    if (!error) {
      alert("성공적으로 게시되었습니다.");
      onRefresh();
      onClose();
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[4rem] w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
        <h3 className="text-4xl font-black italic text-purple-500 mb-12 tracking-tighter uppercase">New Publication</h3>
        
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Classification</label>
            <div className="flex flex-wrap gap-2">
              {["스크린샷", "MVP", "커스터마이징 및 의상", "자유게시판"].map(cat => (
                <button key={cat} onClick={() => setForm({...form, category: cat})} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${form.category === cat ? 'bg-purple-600 text-white' : 'bg-black border border-white/5 text-gray-600'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <AdminInput label="Title" value={form.title} onChange={(v:any)=>setForm({...form, title:v})} placeholder="글 제목을 입력하세요" />
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Body Content</label>
            <textarea className="w-full bg-black border border-white/10 p-6 rounded-3xl h-40 outline-none focus:border-purple-500 font-bold text-sm text-white" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          </div>

          <ImageUploader label="Attach Media" onUpload={(url) => setForm({...form, imageUrl: url})} />
          
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? "PROCESSING..." : <><Send size={18}/> Publish Post</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- 공통 컴포넌트: 관리자 인풋 ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-3 text-left">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all hover:border-white/20" 
      value={value} 
      onChange={e => onChange && onChange(e.target.value)} 
    />
  </div>
);

// --- [기능] 레이드 캘린더 ---
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
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-purple-600/10 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-600/10"><CalendarIcon className="text-purple-500" size={32}/></div>
          <div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase font-mono">{year}. {String(month + 1).padStart(2, '0')}</h2>
            <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.5em] mt-1">Expedition Deployment Schedule</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all active:scale-90"><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-4 border border-white/10 rounded-2xl hover:bg-white/5 transition-all active:scale-90"><ChevronRight/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-[1px] bg-white/5 rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className="bg-white/5 p-4 text-[9px] font-black text-gray-500 tracking-widest text-center">{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[160px]" />)}
        {dateArray.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRaids = raids.filter(r => r.raid_date === dateStr);
          return (
            <div key={day} className="bg-[#0a0a0a] min-h-[160px] p-5 group relative hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-black text-gray-700 group-hover:text-purple-500 transition-colors">{day}</span>
                {user && <button onClick={() => { setSelectedDate(dateStr); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-purple-600 text-white rounded-lg transition-all scale-90 hover:scale-100"><Plus size={16}/></button>}
              </div>
              <div className="space-y-2">
                {dayRaids.map(raid => (
                  <div key={raid.id} className="bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-xl text-[10px] font-black truncate text-purple-200 cursor-pointer hover:bg-purple-900/40 hover:border-purple-500 transition-all">
                    {raid.raid_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {isModalOpen && <CreateRaidModal date={selectedDate} onRefresh={fetchData} onClose={() => setIsModalOpen(false)} />}
    </section>
  );
};

const CreateRaidModal = ({ date, onRefresh, onClose }: any) => {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '오후 8:00' });
  const save = async () => {
    if(!form.raid_name) return alert("레이드명을 입력하세요.");
    await supabase.from('raid_schedules').insert([{ ...form, raid_date: date, max_participants: 8 }]);
    onRefresh(); onClose();
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 text-left text-white">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[4rem] w-full max-w-sm shadow-2xl">
        <h3 className="text-3xl font-black text-purple-500 italic mb-10 uppercase tracking-tighter">New Raid Plan</h3>
        <p className="text-gray-600 text-[10px] font-black mb-8 uppercase tracking-widest italic">{date} Deployment</p>
        <div className="space-y-6">
          <AdminInput label="Mission Objective" placeholder="카멘 4관문" onChange={(v:any)=>setForm({...form, raid_name:v})} />
          <AdminInput label="Time Schedule" value={form.raid_time} onChange={(v:any)=>setForm({...form, raid_time:v})} />
          <button onClick={save} className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 active:scale-95">Establish Plan</button>
          <button onClick={onClose} className="w-full text-gray-700 text-[10px] font-black py-2 hover:text-white transition-colors uppercase">Abort Mission</button>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
    <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('home')}>
        <div className="w-10 h-10 bg-purple-600 rounded-[1rem] flex items-center justify-center shadow-2xl shadow-purple-600/40 group-hover:rotate-12 transition-transform duration-500"><Shield className="text-white w-6 h-6" /></div>
        <span className="text-2xl font-black tracking-tighter uppercase font-mono italic">INXX</span>
      </div>
      <div className="flex gap-10 items-center">
        {[
          {id: 'home', label: '홈'}, 
          {id: 'posts', label: '게시판'}, 
          ...(profile?.role === 'admin' ? [{id: 'admin', label: '관리자'}] : []),
          ...(user ? [] : [{id: 'login', label: '로그인'}, {id: 'signup', label: '회원가입'}])
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`text-[11px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === item.id ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
        {user && <button onClick={onLogout} className="text-[11px] font-black text-gray-600 hover:text-red-400 uppercase tracking-[0.2em] transition-colors border-l border-white/10 pl-10">Logout</button>}
      </div>
    </div>
  </nav>
);

const Hero = ({ settings }: any) => (
  <section className="relative h-[65vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent opacity-50"></div>
    <div className="relative z-10 text-center px-6">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        <h1 className="text-8xl md:text-[11rem] font-black mb-10 italic bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/10 font-mono tracking-tighter leading-none animate-shimmer">
          {settings?.guild_name || "INXX"}
        </h1>
        <p className="text-gray-500 text-2xl max-w-3xl mx-auto font-black italic uppercase opacity-80 whitespace-pre-line tracking-tight leading-relaxed">
          {settings?.guild_description || "Exploring the Abyss of Arkesia."}
        </p>
      </motion.div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
  </section>
);

const Auth = ({ mode, setMode }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await supabase.from('profiles').insert([{ id: data.user?.id, nickname: email.split('@')[0], grade: '신입' }]);
        alert('인증 메일을 확인해 주세요!'); setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMode('home');
      }
    } catch (err: any) { alert(err.message); }
  };
  return (
    <div className="max-w-md mx-auto py-40 px-6 text-center">
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="p-16 rounded-[4rem] border border-white/5 bg-[#0f0f0f] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
        <h2 className="text-6xl font-black italic mb-12 uppercase tracking-tighter">{mode === 'login' ? 'Infiltration' : 'Recruitment'}</h2>
        <form onSubmit={handleAuth} className="space-y-6 text-left">
          <input type="email" placeholder="USER E-MAIL" className="w-full bg-black border border-white/10 p-6 rounded-[2rem] text-sm font-black text-white focus:border-purple-500 outline-none transition-all uppercase tracking-widest" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="SECURITY KEY" className="w-full bg-black border border-white/10 p-6 rounded-[2rem] text-sm font-black text-white focus:border-purple-500 outline-none transition-all uppercase tracking-widest" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-purple-600 p-7 rounded-[2rem] font-black uppercase mt-10 hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/30 text-white tracking-[0.3em] active:scale-95">Access</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-12 text-[10px] font-black text-gray-700 hover:text-white uppercase transition-all tracking-[0.4em]">Switch Authentication Protocol</button>
      </motion.div>
    </div>
  );
};
