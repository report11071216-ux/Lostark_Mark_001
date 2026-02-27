import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Settings,
  Database, Layers, Link as LinkIcon, Save, Info, Image as ImageIcon,
  Send, Camera, MessageSquare, AlertCircle, CheckCircle2,
  ExternalLink, ArrowRight, Filter, Search, MoreVertical
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [시스템 설정] Supabase 클라이언트 초기화 ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- [애니메이션 프리셋] ---
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "circOut" }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 20 }
};

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

  // 시스템 초기화 로직
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
        
        await fetchGlobalData();
      } catch (error) {
        console.error("System Initialization Failed:", error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    initializeSystem();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });
   
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
    if (error) console.error("Profile Fetch Error:", error);
  };

  const fetchGlobalData = async () => {
    const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    const { data: settingsData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    
    if (postsData) setPosts(postsData);
    if (settingsData) setSettings(settingsData);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setActiveTab('home');
    }
  };

  // --- [UI] 로딩 스크린 ---
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <div className="w-24 h-24 border-t-2 border-purple-500 rounded-full animate-spin"></div>
        <Shield className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32} />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-white font-black italic tracking-[0.5em] text-xl animate-pulse">INXX SYSTEM</h2>
        <p className="text-gray-600 text-[10px] font-bold tracking-widest mt-2 uppercase">Connecting to Database...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* 관리자 공지 표시줄 */}
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-[10px] font-black py-1.5 text-center tracking-[0.3em] uppercase border-b border-white/10">
          <span className="inline-block animate-pulse mr-2">●</span> Administrator Mode Engaged - Data Modification Access Granted
        </div>
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />
      
      <main className={`${profile?.role === 'admin' ? "pt-24" : "pt-16"} transition-all duration-500`}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" {...pageTransition}>
              <Hero settings={settings} />
              
              {/* 메인 콘텐츠 내비게이션 */}
              <div className="max-w-7xl mx-auto px-8 mb-16">
                <div className="flex flex-wrap justify-center gap-6 md:gap-16 border-b border-white/5 pb-8">
                  {['레이드', '가디언 토벌', '클래스'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => setContentView(type)}
                      className={`relative group px-4 py-2 text-2xl font-black italic uppercase transition-all ${contentView === type ? 'text-purple-500 scale-105' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {type}
                      {contentView === type && (
                        <motion.div layoutId="underline" className="absolute -bottom-[2px] left-0 right-0 h-1 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <MainContentViewer type={contentView} />
              <RaidCalendar user={user} /> 
              <Footer settings={settings} />
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <PostBoard key="posts" posts={posts} user={user} profile={profile} refreshPosts={fetchGlobalData} />
          )}

          {activeTab === 'admin' && profile?.role === 'admin' && (
            <AdminPanel key="admin" settings={settings} setSettings={setSettings} />
          )}

          {(activeTab === 'login' || activeTab === 'signup') && (
            <Auth key="auth" mode={activeTab} setMode={setActiveTab} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- [공통] 이미지 업로더 컴포넌트 ---
const ImageUploader = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // 프리뷰 생성
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) { 
      alert(`업로드 중 오류 발생: ${err.message}`); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
        {preview && <span className="text-[9px] font-black text-purple-500 uppercase italic">Preview Ready</span>}
      </div>
      
      <div className="relative group">
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`file-${label}`} />
        <label 
          htmlFor={`file-${label}`} 
          className="flex flex-col items-center justify-center gap-4 w-full h-32 bg-black border border-dashed border-white/10 rounded-[2rem] cursor-pointer group-hover:border-purple-500/50 group-hover:bg-purple-500/5 transition-all duration-500 overflow-hidden"
        >
          {preview ? (
            <img src={preview} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px]" />
          ) : null}
          
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`p-3 rounded-2xl ${uploading ? 'bg-purple-500 animate-bounce' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
              <ImageIcon size={20} />
            </div>
            <span className="text-[11px] font-black text-gray-500 group-hover:text-white tracking-tighter uppercase transition-colors">
              {uploading ? "Uploading to Cloud..." : `Select ${label} Image`}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

// --- [콘텐츠] 메인 카드 뷰어 ---
const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setCardLoading(true);
      let query;
      if (type === '클래스') {
        query = supabase.from('class_infos').select('*').order('sub_class');
      } else {
        query = supabase.from('contents').select('*').eq('category', type).order('created_at', { ascending: false });
      }
      
      const { data } = await query;
      setItems(data || []);
      setCardLoading(false);
    };
    fetchData();
  }, [type]);

  if (cardLoading) return (
    <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 py-12">
      {[1,2,3].map(i => (
        <div key={i} className="aspect-[4/5] bg-white/5 rounded-[3rem] animate-pulse border border-white/5" />
      ))}
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-12">
      {items.length === 0 && (
        <div className="col-span-full py-32 text-center border border-dashed border-white/5 rounded-[4rem]">
          <Database className="mx-auto text-gray-800 mb-6" size={48} />
          <p className="text-gray-700 text-xl font-black italic uppercase tracking-[0.3em]">No Records Found In Database</p>
        </div>
      )}
      
      {items.map((item, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          viewport={{ once: true }}
          whileHover={{ y: -15, scale: 1.02 }} 
          key={item.id} 
          onClick={() => setSelectedItem(item)} 
          className="group relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#0f0f0f] aspect-[4/5] cursor-pointer shadow-2xl transition-all duration-700"
        >
          {/* 이미지 배경 */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={item.image_url || 'https://via.placeholder.com/600x800?text=NO+IMAGE'} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000 ease-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
          </div>

          {/* 콘텐츠 정보 */}
          <div className="absolute bottom-12 left-10 right-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-8 bg-purple-500 group-hover:w-12 transition-all duration-500"></span>
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] italic">{type}</span>
            </div>
            <h3 className="text-4xl font-black italic mb-8 uppercase tracking-tighter leading-none group-hover:text-purple-400 transition-colors">
              {item.name || item.sub_class}
            </h3>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                <ArrowRight size={20} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-x-4 group-hover:translate-x-0">
                Detailed Report
              </span>
            </div>
          </div>

          {/* 데코 요소 */}
          <div className="absolute top-8 right-8 text-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700">
            <Shield size={80} />
          </div>
        </motion.div>
      ))}
      
      <AnimatePresence>
        {selectedItem && <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </section>
  );
};

// --- [콘텐츠] 상세 정보 팝업 모달 ---
const DetailPopup = ({ item, type, onClose }: any) => {
  const [gate, setGate] = useState(1);
  const [diff, setDiff] = useState('노말');
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type !== '클래스') {
      const fetchDetail = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('content_details')
          .select('*')
          .eq('content_id', item.id)
          .eq('difficulty', type === '레이드' ? diff : null)
          .eq('gate_num', type === '레이드' ? gate : 0)
          .maybeSingle();
        setDetails(data);
        setLoading(false);
      };
      fetchDetail();
    }
  }, [gate, diff, item, type]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
    >
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-[#111] border border-white/10 rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.8)]"
      >
        <button onClick={onClose} className="absolute top-10 right-10 z-20 text-white/30 hover:text-white hover:rotate-90 transition-all duration-500">
          <X size={36}/>
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* 왼쪽 사이드: 비주얼 */}
          <div className="w-full lg:w-2/5 h-64 lg:h-auto relative group">
            <img src={item.image_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 lg:from-transparent to-transparent" />
            <div className="absolute bottom-10 left-10">
              <span className="px-4 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl mb-4 inline-block">
                Confirmed Entry
              </span>
              <h2 className="text-5xl lg:text-7xl font-black italic uppercase text-white tracking-tighter leading-none">{item.name || item.sub_class}</h2>
            </div>
          </div>

          {/* 오른쪽 사이드: 데이터 */}
          <div className="w-full lg:w-3/5 p-10 lg:p-16 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-500">
                <Info size={24} />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Expedition Data Sheet</p>
                <h4 className="text-xl font-black italic uppercase">Detailed Intelligence Report</h4>
              </div>
            </div>

            {type === '레이드' && (
              <div className="flex flex-wrap gap-8 mb-12">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Engagement Gate</label>
                  <div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/5">
                    {[1, 2, 3, 4].map(g => (
                      <button key={g} onClick={() => setGate(g)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${gate === g ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-400'}`}>G{g}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Threat Level</label>
                  <div className="flex gap-2 p-1.5 bg-black rounded-2xl border border-white/5">
                    {['노말', '하드'].map(d => (
                      <button key={d} onClick={() => setDiff(d)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${diff === d ? 'bg-white text-black' : 'text-gray-600 hover:text-gray-400'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 py-20 text-center animate-pulse text-purple-500 font-black italic uppercase">Syncing Data...</div>
              ) : type === '클래스' ? (
                <>
                  <DataCard label="Class Synergy" value={item.synergy} fullWidth icon={<Layers size={18}/>} />
                  <DataCard label="Job Engraving" value={item.engraving_job} icon={<CheckCircle2 size={18}/>} />
                  <DataCard label="Root Path" value={item.root_class} icon={<Shield size={18}/>} />
                </>
              ) : details ? (
                <>
                  <DataCard label="Hostile HP" value={details.hp} icon={<AlertCircle size={18}/>} />
                  <DataCard label="Element Type" value={details.element_type} icon={<Filter size={18}/>} />
                  <DataCard label="Attribute Weakness" value={details.attribute} icon={<Send size={18}/>} />
                  <DataCard label="Gold Reward" value={`${details.clear_gold?.toLocaleString()} G`} highlight icon={<Database size={18}/>} />
                </>
              ) : (
                <div className="col-span-2 py-20 text-center text-gray-800 font-black italic border border-dashed border-white/5 rounded-3xl uppercase tracking-widest">
                  No Engagement Data Recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DataCard = ({ label, value, fullWidth, highlight, icon }: any) => (
  <div className={`p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:border-purple-500/20 transition-all group ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-3 mb-4 text-purple-500/50 group-hover:text-purple-500 transition-colors">
      {icon}
      <label className="text-[10px] font-black uppercase tracking-widest italic">{label}</label>
    </div>
    <div className={`text-2xl font-black tracking-tight ${highlight ? 'text-yellow-400' : 'text-white'}`}>
      {value || 'Unknown'}
    </div>
  </div>
);

// --- [관리자] 통합 대시보드 ---
const AdminPanel = ({ settings, setSettings }: any) => {
  const [adminTab, setAdminTab] = useState('레이드');
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-8 py-12 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-purple-600/30">
            <Settings className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">Command Center</h2>
            <p className="text-gray-600 text-[10px] font-bold tracking-[0.4em] uppercase mt-2">Core System Configuration & Database Management</p>
          </div>
        </div>
        
        <div className="flex gap-3 bg-white/5 p-2 rounded-3xl border border-white/5">
          {['레이드', '가디언 토벌', '클래스', '길드 설정'].map(t => (
            <button 
              key={t} 
              onClick={() => setAdminTab(t)} 
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${adminTab === t ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-[4rem] p-10 md:p-16 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-white/[0.02] -mr-10 -mt-10 pointer-events-none">
          <Settings size={200} />
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={adminTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {adminTab === '레이드' && <ContentManager isRaid={true} />}
            {adminTab === '가디언 토벌' && <ContentManager isRaid={false} />}
            {adminTab === '클래스' && <ClassManager />}
            {adminTab === '길드 설정' && <GuildManager settings={settings} setSettings={setSettings} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- [관리자] 레이드/가디언 관리 모듈 ---
const ContentManager = ({ isRaid }: { isRaid: boolean }) => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', image_url: '', hp: '', element: '', attribute: '', gold: 0 });
  const [saving, setSaving] = useState(false);
  const category = isRaid ? '레이드' : '가디언 토벌';

  useEffect(() => { fetchItems(); }, [category]);

  const fetchItems = async () => {
    const { data } = await supabase.from('contents').select('*').eq('category', category).order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const handleSave = async () => {
    if (!form.name) return alert("데이터 명칭은 필수입니다.");
    setSaving(true);
    
    const { data, error } = await supabase
      .from('contents')
      .upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' })
      .select()
      .single();

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
      alert("데이터 동기화 완료!");
      fetchItems();
    } else {
      alert("오류: " + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 이 데이터를 삭제하시겠습니까? 관련 상세 정보도 모두 제거됩니다.")) {
      const { error } = await supabase.from('contents').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchItems();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
      <div className="space-y-10">
        <h4 className="text-2xl font-black italic text-purple-500 uppercase flex items-center gap-3">
          <Plus size={24}/> Create/Modify {category}
        </h4>
        <div className="space-y-6">
          <AdminInput label="Content Designation" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} placeholder="에키드나, 에기르 등" />
          <ImageUploader label="Primary Visual Media" onUpload={(url)=>setForm({...form, image_url: url})} />
          <div className="grid grid-cols-2 gap-6">
            <AdminInput label="Total HP Value" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} placeholder="5000억" />
            <AdminInput label="Gold Extraction" type="number" value={form.gold} onChange={(v:any)=>setForm({...form, gold:v})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <AdminInput label="Hostile Element" placeholder="악마, 인간 등" value={form.element} onChange={(v:any)=>setForm({...form, element:v})} />
            <AdminInput label="Weakness Attribute" placeholder="성속성 취약 등" value={form.attribute} onChange={(v:any)=>setForm({...form, attribute:v})} />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-purple-600 p-7 rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/30 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Syncing...' : 'Deploy To Production'}
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <h4 className="text-2xl font-black italic text-gray-500 uppercase flex items-center gap-3">
          <Database size={24}/> Global Repository
        </h4>
        <div className="bg-black/50 rounded-[3rem] border border-white/5 max-h-[600px] overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-all">
                  <img src={item.image_url} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-black text-lg uppercase group-hover:text-purple-400 transition-colors">{item.name}</div>
                  <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                    Registered: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)} 
                className="p-4 text-gray-700 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"
              >
                <Trash2 size={24}/>
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="py-20 text-center text-gray-800 font-black italic uppercase">Empty Repository</div>}
        </div>
      </div>
    </div>
  );
};

// --- [관리자] 클래스 관리 모듈 ---
const ClassManager = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ root: '', sub: '', eng: '', synergy: '', url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('class_infos').select('*').order('sub_class');
    if (data) setClasses(data);
  };

  const handleSave = async () => {
    if (!form.sub) return alert("전직 명칭은 필수입니다.");
    setSaving(true);
    const { error } = await supabase.from('class_infos').upsert({ 
      root_class: form.root, 
      sub_class: form.sub, 
      engraving_job: form.eng, 
      synergy: form.synergy, 
      image_url: form.url 
    }, { onConflict: 'sub_class' });
    
    if (!error) { 
      alert("클래스 데이터 동기화 완료!"); 
      fetchClasses(); 
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 클래스 메타데이터를 삭제하시겠습니까?")) {
      await supabase.from('class_infos').delete().eq('id', id);
      fetchClasses();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
      <div className="space-y-10">
        <h4 className="text-2xl font-black italic text-purple-500 uppercase flex items-center gap-3"><Layers size={24}/> Class Metadata</h4>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <AdminInput label="Root Archetype" placeholder="전사, 무도가 등" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
            <AdminInput label="Advanced Class" placeholder="버서커, 슬레이어 등" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
          </div>
          <AdminInput label="Group Synergy" placeholder="치명타 적중률, 백헤드 피해 등" value={form.synergy} onChange={(v:any)=>setForm({...form, synergy:v})} />
          <AdminInput label="Job Engraving Profile" placeholder="광기, 비기 등" value={form.eng} onChange={(v:any)=>setForm({...form, eng:v})} />
          <ImageUploader label="Class Visual Portrait" onUpload={(url)=>setForm({...form, url: url})} />
          <button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 p-7 rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-purple-500 shadow-2xl active:scale-95 disabled:opacity-50">
            {saving ? 'Processing...' : 'Register Meta Info'}
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <h4 className="text-2xl font-black italic text-gray-500 uppercase flex items-center gap-3"><Database size={24}/> Class Database</h4>
        <div className="bg-black/50 rounded-[3rem] border border-white/5 max-h-[600px] overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {classes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center gap-6">
                <img src={c.image_url} className="w-16 h-16 object-cover rounded-2xl shadow-xl" />
                <div>
                  <div className="font-black text-lg uppercase group-hover:text-purple-400">{c.sub_class}</div>
                  <div className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">{c.root_class} Archetype</div>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-4 text-gray-700 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- [관리자] 길드 설정 모듈 ---
const GuildManager = ({ settings, setSettings }: any) => {
  const [updating, setUpdating] = useState(false);
  
  const handleSave = async () => {
    setUpdating(true);
    const { error } = await supabase.from('settings').upsert(settings);
    if (!error) alert("길드 마스터 브리핑이 전송되었습니다.");
    setUpdating(false);
  };

  return (
    <div className="max-w-3xl space-y-10">
      <h4 className="text-2xl font-black italic text-purple-500 uppercase flex items-center gap-3"><Shield size={24}/> Branding & Communication</h4>
      <div className="space-y-8">
        <AdminInput label="Guild Official Name" value={settings.guild_name} onChange={(v:any)=>setSettings({...settings, guild_name: v})} />
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-1">Grand Master's Message</label>
          <textarea 
            className="w-full bg-black border border-white/10 p-8 rounded-[2.5rem] h-56 outline-none focus:border-purple-500 font-bold text-sm text-white resize-none shadow-inner transition-all hover:border-white/20"
            value={settings.guild_description}
            onChange={e => setSettings({...settings, guild_description: e.target.value})}
            placeholder="길드원에게 전할 말을 입력하세요..."
          />
        </div>
        <button 
          onClick={handleSave} 
          disabled={updating}
          className="w-full bg-purple-600 p-8 rounded-[2rem] font-black uppercase tracking-[0.4em] hover:bg-purple-500 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {updating ? 'Transmitting...' : 'Apply Global Branding'}
        </button>
      </div>
    </div>
  );
};

// --- [게시판] 메인 모듈 ---
const PostBoard = ({ posts, user, profile, refreshPosts }: any) => {
  const [currentTab, setCurrentTab] = useState('전체');
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const tabs = ["전체", "스크린샷", "MVP", "커스터마이징 및 의상", "자유게시판"];
  const filteredPosts = posts.filter((p: any) => currentTab === '전체' || p.category === currentTab);

  const handleDeletePost = async (e: any, id: string) => {
    e.stopPropagation();
    if (confirm("이 게시글을 삭제하시겠습니까? 데이터는 복구되지 않습니다.")) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) alert(error.message);
      else refreshPosts();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-8 py-16 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-[2px] bg-purple-500"></span>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.5em] italic">Intelligence Exchange</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Guild Bulletin</h2>
        </div>
        
        {user && (
          <button 
            onClick={() => setIsWriteOpen(true)}
            className="flex items-center gap-4 bg-purple-600 px-12 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/30 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500"/> Create New Entry
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-16 overflow-x-auto pb-6 scrollbar-hide">
        {tabs.map(t => (
          <button 
            key={t} 
            onClick={() => setCurrentTab(t)} 
            className={`whitespace-nowrap px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${currentTab === t ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredPosts.length === 0 && (
          <div className="col-span-full py-48 text-center border border-dashed border-white/5 rounded-[4rem]">
            <p className="text-gray-800 text-xl font-black italic uppercase tracking-[0.5em]">The Archive is Empty</p>
          </div>
        )}
        
        {filteredPosts.map((post: any, idx: number) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -10, borderColor: 'rgba(168,85,247,0.3)' }}
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="p-10 bg-[#0f0f0f] rounded-[3.5rem] border border-white/5 transition-all group relative cursor-pointer overflow-hidden shadow-xl"
          >
            {(profile?.role === 'admin' || user?.id === post.user_id) && (
              <button onClick={(e) => handleDeletePost(e, post.id)} className="absolute top-10 right-10 text-gray-800 hover:text-red-500 transition-all z-10 p-2">
                <Trash2 size={20}/>
              </button>
            )}
            
            <div className="flex items-center gap-4 mb-8">
              <span className="text-purple-500 text-[10px] font-black uppercase tracking-[0.3em] italic bg-purple-500/10 px-4 py-1.5 rounded-full">{post.category}</span>
              <span className="text-gray-700 text-[9px] font-black uppercase tracking-widest">{post.id.slice(0,8)}</span>
            </div>

            <h3 className="text-3xl font-black text-white group-hover:text-purple-400 mb-10 tracking-tighter leading-tight transition-colors">
              {post.title}
            </h3>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-8">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg">
                  {post.author?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="text-white text-sm font-black uppercase tracking-tighter leading-none mb-1">{post.author || "Unknown Guest"}</p>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Recently Published"}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-700 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
                <ArrowRight size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isWriteOpen && <PostWriteModal user={user} onClose={() => setIsWriteOpen(false)} onRefresh={refreshPosts} />}
        {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// --- [게시판] 상세 읽기 모달 ---
const PostDetailModal = ({ post, onClose }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 text-left">
    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-[#111] border border-white/10 p-12 lg:p-20 rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
      <button onClick={onClose} className="absolute top-12 right-12 text-gray-600 hover:text-white transition-all"><X size={36}/></button>
      
      <div className="flex items-center gap-4 mb-8">
        <span className="px-5 py-2 bg-purple-600/20 text-purple-500 text-[10px] font-black uppercase tracking-[0.3em] italic rounded-full border border-purple-500/20">
          {post.category}
        </span>
        <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest italic">
          Entry Dated: {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>

      <h2 className="text-5xl lg:text-7xl font-black italic text-white mb-16 tracking-tighter leading-none">{post.title}</h2>
      
      <div className="flex items-center gap-6 mb-16 pb-16 border-b border-white/5">
        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-purple-500 border border-white/5"><Users size={24}/></div>
        <div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Authenticated Author</p>
          <p className="text-2xl font-black uppercase italic tracking-tighter">{post.author}</p>
        </div>
      </div>

      {post.image_url && (
        <div className="mb-16 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
          <img src={post.image_url} className="w-full h-auto" />
        </div>
      )}

      <div className="text-gray-400 text-xl font-medium leading-relaxed whitespace-pre-wrap font-serif italic mb-20">
        {post.content}
      </div>

      <button onClick={onClose} className="w-full py-8 border border-white/10 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all">Close Entry</button>
    </motion.div>
  </motion.div>
);

// --- [게시판] 글쓰기 모달 ---
const PostWriteModal = ({ user, onClose, onRefresh }: any) => {
  const [form, setForm] = useState({ title: '', content: '', category: '스크린샷', imageUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.content) return alert("필수 입력 항목이 누락되었습니다.");
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 text-left">
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-[#111] border border-white/10 p-12 lg:p-16 rounded-[4rem] w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
        <button onClick={onClose} className="absolute top-12 right-12 text-gray-500 hover:text-white transition-all"><X size={32}/></button>
        <h3 className="text-5xl font-black italic text-purple-500 mb-12 tracking-tighter uppercase leading-none">New Entry</h3>
        
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-1">Archive Classification</label>
            <div className="flex flex-wrap gap-3">
              {["스크린샷", "MVP", "커스터마이징 및 의상", "자유게시판"].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setForm({...form, category: cat})} 
                  className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.category === cat ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'bg-black border border-white/10 text-gray-600 hover:text-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AdminInput label="Entry Subject" value={form.title} onChange={(v:any)=>setForm({...form, title:v})} placeholder="제목을 입력하세요" />
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-1">Main Intelligence Content</label>
            <textarea 
              className="w-full bg-black border border-white/10 p-8 rounded-[2.5rem] h-48 outline-none focus:border-purple-500 font-bold text-sm text-white resize-none shadow-inner" 
              value={form.content} 
              onChange={e => setForm({...form, content: e.target.value})} 
              placeholder="내용을 작성하세요..."
            />
          </div>

          <ImageUploader label="Supportive Media Media" onUpload={(url) => setForm({...form, imageUrl: url})} />
          
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-purple-600 p-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/30 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Transmitting..." : <><Send size={20}/> Publish To Archive</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- [공통 UI] 어드민 전용 인풋 ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-4 text-left group">
    <label className="text-[10px] font-black text-gray-700 group-hover:text-purple-500 uppercase tracking-[0.3em] ml-1 transition-colors">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all hover:border-white/20 shadow-inner" 
      value={value} 
      onChange={e => onChange && onChange(e.target.value)} 
    />
  </div>
);

// --- [일정] 레이드 캘린더 ---
const RaidCalendar = ({ user }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchData(); }, [currentDate]);

  const fetchData = async () => {
    const { data: rData } = await supabase.from('raid_schedules').select('*').order('created_at', { ascending: true });
    if (rData) setRaids(rData);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section id="calendar" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20">
        <div className="flex items-center gap-8 text-left">
          <div className="p-6 bg-purple-600/10 rounded-[2rem] border border-purple-500/20 shadow-2xl"><CalendarIcon className="text-purple-500" size={40}/></div>
          <div>
            <h2 className="text-6xl font-black italic tracking-tighter uppercase font-mono leading-none">{year}. {String(month + 1).padStart(2, '0')}</h2>
            <p className="text-gray-700 text-[11px] font-black uppercase tracking-[0.6em] mt-2 italic">Operation Deployment Window</p>
          </div>
        </div>
        <div className="flex gap-4 p-2 bg-white/5 rounded-3xl border border-white/5">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-5 hover:bg-white/5 rounded-2xl transition-all"><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-5 hover:bg-white/5 rounded-2xl transition-all"><ChevronRight/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-[1px] bg-white/5 rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
          <div key={d} className={`bg-white/5 p-5 text-[10px] font-black tracking-[0.3em] text-center ${d === 'SUN' ? 'text-red-500/50' : d === 'SAT' ? 'text-blue-500/50' : 'text-gray-500'}`}>{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[180px]" />)}
        {dateArray.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayRaids = raids.filter(r => r.raid_date === dateStr);
          return (
            <div key={day} className="bg-[#0a0a0a] min-h-[180px] p-6 group relative hover:bg-white/[0.02] transition-all duration-500 border-r border-b border-white/[0.02]">
              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs font-black transition-colors ${dayRaids.length > 0 ? 'text-purple-500' : 'text-gray-800 group-hover:text-gray-500'}`}>{day}</span>
                {user && <button onClick={() => { setSelectedDate(dateStr); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-2 bg-purple-600 text-white rounded-xl transition-all scale-90 hover:scale-110 shadow-lg shadow-purple-600/30"><Plus size={16}/></button>}
              </div>
              <div className="space-y-3">
                {dayRaids.map(raid => (
                  <div key={raid.id} className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-2xl text-[10px] font-black truncate text-purple-200 cursor-pointer hover:bg-purple-900/40 hover:border-purple-500 transition-all shadow-sm">
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
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 text-white">
      <motion.div variants={modalVariants} initial="hidden" animate="visible" className="bg-[#111] border border-white/10 p-12 rounded-[4rem] w-full max-w-sm shadow-2xl">
        <h3 className="text-4xl font-black text-purple-500 italic mb-10 uppercase tracking-tighter leading-none">Raid Planning</h3>
        <p className="text-gray-600 text-[10px] font-black mb-10 uppercase tracking-[0.4em] italic border-l-2 border-purple-500 pl-4">{date} Deployment</p>
        <div className="space-y-8">
          <AdminInput label="Mission Name" placeholder="카멘 4관문 등" onChange={(v:any)=>setForm({...form, raid_name:v})} />
          <AdminInput label="Target Time" value={form.raid_time} onChange={(v:any)=>setForm({...form, raid_time:v})} />
          <button onClick={save} className="w-full bg-purple-600 p-7 rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-purple-500 transition-all shadow-2xl active:scale-95">Establish Order</button>
          <button onClick={onClose} className="w-full text-gray-700 text-[11px] font-black py-2 hover:text-white transition-colors uppercase tracking-widest">Abort Creation</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- [공통] 네비게이션 바 ---
const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-3xl border-b border-white/5 h-20 flex items-center">
    <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
      <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setActiveTab('home')}>
        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500">
          <Shield className="text-white w-7 h-7" />
        </div>
        <span className="text-3xl font-black tracking-tighter uppercase font-mono italic group-hover:text-purple-400 transition-colors">INXX</span>
      </div>
      <div className="hidden md:flex gap-12 items-center">
        {[
          {id: 'home', label: '홈'}, 
          {id: 'posts', label: '게시판'}, 
          ...(profile?.role === 'admin' ? [{id: 'admin', label: '관리자'}] : [])
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`text-[12px] font-black tracking-[0.3em] transition-all uppercase relative py-2 ${activeTab === item.id ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            {item.label}
            {activeTab === item.id && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full" />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6">
        {user ? (
          <button onClick={onLogout} className="text-[11px] font-black text-gray-500 hover:text-red-400 uppercase tracking-[0.3em] transition-all border-l border-white/10 pl-8">Logout</button>
        ) : (
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('login')} className="text-[11px] font-black text-gray-500 hover:text-white uppercase tracking-[0.3em]">Sign In</button>
            <button onClick={() => setActiveTab('signup')} className="px-6 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-white/5">Join</button>
          </div>
        )}
      </div>
    </div>
  </nav>
);

// --- [홈] 히어로 섹션 ---
const Hero = ({ settings }: any) => (
  <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-60"></div>
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
    <div className="relative z-10 text-center px-6">
      <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "circOut" }}>
        <h1 className="text-8xl md:text-[13rem] font-black mb-12 italic bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/5 font-mono tracking-tighter leading-none">
          {settings?.guild_name || "INXX"}
        </h1>
        <div className="flex items-center justify-center gap-6 mb-12">
          <span className="h-[1px] w-12 bg-purple-500/50"></span>
          <p className="text-gray-500 text-3xl font-black italic uppercase tracking-tight opacity-80 max-w-2xl leading-relaxed">
            {settings?.guild_description || "Defining New Standards In Arkesia."}
          </p>
          <span className="h-[1px] w-12 bg-purple-500/50"></span>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-16 py-6 border-2 border-white text-white text-[13px] font-black uppercase tracking-[0.5em] rounded-full hover:bg-white hover:text-black transition-all duration-500 shadow-2xl shadow-white/5"
        >
          Discover Expedition
        </motion.button>
      </motion.div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
  </section>
);

// --- [푸터] 하단 정보 섹션 ---
const Footer = ({ settings }: any) => (
  <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 text-center">
    <div className="flex flex-col items-center space-y-12">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Shield size={20} className="text-gray-500"/></div>
        <span className="text-2xl font-black italic tracking-tighter uppercase font-mono">{settings?.guild_name}</span>
      </div>
      <div className="flex gap-12 text-[10px] font-black text-gray-700 uppercase tracking-[0.5em]">
        <a href="#" className="hover:text-purple-500 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-purple-500 transition-colors">Terms of Engagement</a>
        <a href="#" className="hover:text-purple-500 transition-colors">Discord Status</a>
      </div>
      <p className="text-gray-800 text-[9px] font-bold uppercase tracking-[0.3em]">© 2026 INXX GUILD COMMAND. ALL SYSTEMS OPERATIONAL.</p>
    </div>
  </footer>
);

// --- [인증] 로그인/회원가입 모듈 ---
const Auth = ({ mode, setMode }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await supabase.from('profiles').insert([{ id: data.user?.id, nickname: email.split('@')[0], grade: '신입' }]);
        alert('이메일 인증 링크를 확인해 주세요!'); 
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMode('home');
      }
    } catch (err: any) { 
      alert("인증 실패: " + err.message); 
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-48 px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-16 rounded-[5rem] border border-white/5 bg-[#0f0f0f] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <h2 className="text-7xl font-black italic mb-16 uppercase tracking-tighter leading-none">{mode === 'login' ? 'Inflow' : 'Ascent'}</h2>
        <form onSubmit={handleAuth} className="space-y-6 text-left">
          <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-black border border-white/10 p-7 rounded-[2.5rem] text-sm font-black text-white focus:border-purple-500 outline-none transition-all uppercase tracking-widest" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="SECURITY CODE" className="w-full bg-black border border-white/10 p-7 rounded-[2.5rem] text-sm font-black text-white focus:border-purple-500 outline-none transition-all uppercase tracking-widest" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={authLoading} className="w-full bg-purple-600 p-8 rounded-[2.5rem] font-black uppercase mt-12 hover:bg-purple-500 transition-all shadow-2xl shadow-purple-600/30 text-white tracking-[0.4em] active:scale-95 disabled:opacity-50">
            {authLoading ? 'Verifying...' : 'Establish Connection'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-16 text-[11px] font-black text-gray-700 hover:text-white uppercase transition-all tracking-[0.5em]">Switch Authentication Protocol</button>
      </motion.div>
    </div>
  );
};
