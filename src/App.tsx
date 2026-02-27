import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, FileText, Calendar as CalendarIcon, 
  UserPlus, Shield, Plus, X, Clock, Users,
  ChevronLeft, ChevronRight, Trash2, Settings,
  Database, Layers, Link as LinkIcon, Save, Info, Image as ImageIcon,
  Send, Edit3
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

          {activeTab === 'posts' && <PostBoard posts={posts} user={user} profile={profile} onRefresh={fetchInitialData} />}
          {activeTab === 'myroom' && <MyRoom user={user} profile={profile} />}
          {activeTab === 'ranking' && <RankingPage user={user} profile={profile} />}
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
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert(`이미지 업로드 실패: ${err.message}`);
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
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-10">
      {items.length === 0 && <div className="col-span-full text-center text-gray-600 font-black italic py-10 uppercase">No Contents Registered.</div>}
      {items.map(item => (
        <motion.div whileHover={{ y: -5 }} key={item.id} onClick={() => setSelectedItem(item)} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-square cursor-pointer shadow-xl">
          <img src={item.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1 block italic">{type}</span>
            <h3 className="text-sm font-black italic uppercase tracking-tighter leading-tight truncate">{item.name || item.sub_class}</h3>
          </div>
        </motion.div>
      ))}
      <AnimatePresence>
        {selectedItem && <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </section>
  );
};

// --- [기능] 상세 정보 팝업 (관문별 데이터 로드 수정) ---
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
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl custom-scrollbar">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={32}/></button>
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <img src={item.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'} className="w-full md:w-48 h-48 object-cover rounded-3xl border border-white/10 shadow-2xl" />
          <div className="flex flex-col justify-end">
            <h2 className="text-5xl font-black italic uppercase text-purple-500 mb-2">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest italic">{type} Specification</p>
          </div>
        </div>
        
        {type === '레이드' && (
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {[1,2,3,4].map(g=>(
                <button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black transition-all ${gate===g?'bg-purple-600 shadow-lg shadow-purple-600/20':'text-gray-500 hover:text-gray-300'}`}>
                  {g}관문
                </button>
              ))}
            </div>
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {['노말','하드','나이트메어'].map(d=>(
                <button key={d} onClick={()=>setDiff(d)} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${diff===d?'bg-white text-black':'text-gray-500 hover:text-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {type === '클래스' ? (
            <>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">직업 각인</label><div className="text-lg font-black">{item.engraving_job || '-'}</div></div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 md:col-span-2"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">공용 각인</label><div className="text-lg font-black">{item.engraving_common?.join(', ') || '-'}</div></div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 md:col-span-3"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">아크 패시브</label><div className="text-lg font-black">{item.ark_passive?.join(' / ') || '-'}</div></div>
            </>
          ) : (
            details ? (
              <>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">HP (체력)</label><div className="text-lg font-black text-white">{details.hp || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">계열</label><div className="text-lg font-black text-white">{details.element_type || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">속성</label><div className="text-lg font-black text-white">{details.attribute || '-'}</div></div>
                <div className="p-6 bg-white/5 rounded-2xl border border-purple-500/20 md:col-span-3"><label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">클리어 골드</label><div className="text-2xl font-black text-yellow-400">{details.clear_gold?.toLocaleString() || '0'} G</div></div>
              </>
            ) : <div className="col-span-3 py-20 text-center text-gray-700 font-black italic uppercase tracking-widest">데이터가 없습니다.</div>
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
      <div className="flex items-center gap-4 mb-10">
        <Settings className="text-purple-500" size={32} />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Admin Console</h2>
      </div>

      <div className="flex gap-6 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        {['레이드', '가디언 토벌', '클래스', '길드 설정'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all ${adminTab === t ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
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

const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const handleSave = async () => {
    const { error } = await supabase.from('settings').upsert(settings);
    if (error) alert(error.message); else alert("길드 설정 업데이트 완료!");
  };
  return (
    <div className="space-y-8">
      <AdminInput label="Guild Name" value={settings.guild_name} onChange={(v:any)=>setSettings({...settings, guild_name: v})} />
      <AdminInput label="Guild Description" value={settings.guild_description} onChange={(v:any)=>setSettings({...settings, guild_description: v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Update Hero Section</button>
    </div>
  );
};

// --- [관리자] 레이드 & 가디언 에디터 (관문별 선택 및 속성 선택 추가) ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [list, setList] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    image_url: '',
    hp: '',
    element: '',
    attribute: '',
    gold: 0
  });

  const elementOptions = ['악마형', '야수형', '인간형', '정령형', '기계형', '고대', '불사', '신'];
  const attributeOptions = ['화속성', '수속성', '암속성', '빛속성', '토속성', '성속성'];

  useEffect(() => { fetchList(); }, [isRaid]);

  // 관문이나 난이도가 바뀔 때마다 해당 데이터를 다시 불러옵니다.
  useEffect(() => {
    if (editingId) {
      loadGateSpecificData(editingId);
    }
  }, [selectedGate, difficulty]);

  const fetchList = async () => {
    const { data } = await supabase.from('contents').select('*').eq('category', isRaid ? '레이드' : '가디언 토벌').order('name');
    if (data) setList(data);
  };

  const loadItem = async (item: any) => {
    setEditingId(item.id);
    setForm(prev => ({ ...prev, name: item.name, image_url: item.image_url || '' }));
    loadGateSpecificData(item.id);
  };

  const loadGateSpecificData = async (contentId: string) => {
    const { data } = await supabase.from('content_details').select('*')
      .eq('content_id', contentId)
      .eq('difficulty', isRaid ? difficulty : null)
      .eq('gate_num', isRaid ? selectedGate : 0)
      .maybeSingle();

    if (data) {
      setForm(prev => ({
        ...prev,
        hp: data.hp || '',
        element: data.element_type || '',
        attribute: data.attribute || '',
        gold: data.clear_gold || 0
      }));
    } else {
      setForm(prev => ({ ...prev, hp: '', element: '', attribute: '', gold: 0 }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', image_url: '', hp: '', element: '', attribute: '', gold: 0 });
  };

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력하세요.");
    const { data, error: cErr } = await supabase.from('contents').upsert({
      id: editingId || undefined,
      name: form.name,
      category: isRaid ? '레이드' : '가디언 토벌',
      image_url: form.image_url
    }).select().single();

    if (cErr) return alert(cErr.message);

    const { error: dErr } = await supabase.from('content_details').upsert({
      content_id: data.id,
      difficulty: isRaid ? difficulty : null,
      gate_num: isRaid ? selectedGate : 0,
      hp: form.hp,
      element_type: form.element,
      attribute: form.attribute,
      clear_gold: form.gold
    }, { onConflict: 'content_id, difficulty, gate_num' });

    if (!dErr) {
      alert(`${isRaid ? selectedGate + '관문 ' : ''}저장 완료!`);
      fetchList();
      if (!editingId) resetForm();
    } else {
      alert(dErr.message);
    }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return;
    await supabase.from('content_details').delete().eq('content_id', id);
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (!error) { alert("삭제 완료"); fetchList(); resetForm(); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase text-purple-500 tracking-widest">Current List</h4>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {list.map(item => (
            <div key={item.id} onClick={() => loadItem(item)} className={`flex items-center justify-between bg-black/40 p-4 rounded-xl border cursor-pointer transition-all ${editingId === item.id ? 'border-purple-500' : 'border-white/5 hover:border-white/20'}`}>
              <span className="text-sm font-bold text-gray-300">{item.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.name); }} className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {editingId && <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">🔧 수정 모드: {form.name}</div>}
        <AdminInput label="Content Name" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} />
        <ImageUploader label="Image" onUpload={(url)=>setForm({...form, image_url:url})} />

        {isRaid && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">관문 선택</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" value={selectedGate} onChange={e=>setSelectedGate(Number(e.target.value))}>
                {[1,2,3,4].map(g=><option key={g} value={g}>{g}관문</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">난이도 선택</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                {['노말','하드','나이트메어'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="HP (체력)" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} />
          <AdminInput label="Clear Gold" type="number" value={form.gold} onChange={(v:any)=>setForm({...form, gold:v})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">계열 (드롭다운)</label>
            <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" value={form.element} onChange={e=>setForm({...form, element:e.target.value})}>
              <option value="">계열 선택</option>
              {elementOptions.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">속성 (드롭다운)</label>
            <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" value={form.attribute} onChange={e=>setForm({...form, attribute:e.target.value})}>
              <option value="">속성 선택</option>
              {attributeOptions.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all">
            {editingId ? "Update Info" : "Register Content"}
          </button>
          {editingId && <button onClick={resetForm} className="bg-gray-700 px-4 rounded-xl font-black uppercase">Cancel</button>}
        </div>
      </div>
    </div>
  );
};

// --- [관리자] 클래스 에디터 ---
const ClassContentEditor = () => {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ root: '', sub: '', eng_job: '', link: '', image_url: '' });
  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    const { data } = await supabase.from('class_infos').select('*').order('sub_class');
    if (data) setList(data);
  };
  const handleSave = async () => {
    if(!form.sub) return alert("직업명을 입력하세요.");
    const { error } = await supabase.from('class_infos').upsert({ root_class: form.root, sub_class: form.sub, engraving_job: form.eng_job, skill_code_link: form.link, image_url: form.image_url }, { onConflict: 'sub_class' });
    if (!error) { alert("저장 완료!"); fetchList(); }
  };
  const deleteItem = async (sub_class: string) => {
    if (!confirm(`[${sub_class}] 클래스를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('class_infos').delete().eq('sub_class', sub_class);
    if (!error) { alert("삭제 완료"); fetchList(); }
  };
  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase text-purple-500 tracking-widest">Class List</h4>
        <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {list.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-gray-400">{item.sub_class}</span>
              <button onClick={() => deleteItem(item.sub_class)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="Root Class" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
          <AdminInput label="Sub Class" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
        </div>
        <AdminInput label="Job Engraving" value={form.eng_job} onChange={(v:any)=>setForm({...form, eng_job:v})} />
        <ImageUploader label="Class Image" onUpload={(url)=>setForm({...form, image_url: url})} />
        <button onClick={handleSave} className="w-full bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all">Update Class</button>
      </div>
    </div>
  );
};

// --- [기능] 게시판 ---
const PostBoard = ({ posts, user, profile, onRefresh }: any) => {
  const [currentTab, setCurrentTab] = useState('전체');
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const tabs = ["전체", "스크린샷", "MVP", "커스터마이징 및 의상", "수집형 포인트"];
  const filteredPosts = posts.filter((p: any) => currentTab === '전체' || p.category === currentTab);
  const handleDelete = async (postId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) onRefresh();
  };
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center space-y-6">
        <Shield size={64} className="mx-auto text-gray-800" />
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Access Denied</h2>
        <p className="text-gray-500 font-bold">게시판은 로그인한 회원만 이용 가능합니다.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-12 text-left">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Bulletin Board</h2>
        <button onClick={() => setIsWriteOpen(true)} className="bg-purple-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg flex items-center gap-2">
          <Edit3 size={16}/> Write Post
        </button>
      </div>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(t => (
          <button key={t} onClick={() => setCurrentTab(t)} className={`whitespace-nowrap px-8 py-3 rounded-full text-[10px] font-black uppercase transition-all ${currentTab === t ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post: any) => (
          <div key={post.id} className="group p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-purple-500/30 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-purple-500 text-[9px] font-black uppercase italic">{post.category}</span>
              {(profile?.role === 'admin' || user?.id === post.user_id) && (
                <button onClick={() => handleDelete(post.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
              )}
            </div>
            {post.image_url && <img src={post.image_url} className="w-full h-48 object-cover rounded-2xl mb-4 border border-white/5" />}
            <h3 className="text-2xl font-black text-white mb-4">{post.title}</h3>
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{post.content}</p>
            <div className="flex justify-between items-center text-[10px] text-gray-600 font-black uppercase">
              <span>{post.author}</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {isWriteOpen && (
          <PostWriteModal user={user} profile={profile} onRefresh={onRefresh} onClose={() => setIsWriteOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- [기능] 게시판 글쓰기 모달 ---
const PostWriteModal = ({ user, profile, onRefresh, onClose }: any) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('스크린샷');
  const [imgUrl, setImgUrl] = useState('');
  const handlePost = async () => {
    if (!title || !content) return alert("제목과 내용을 입력하세요.");
    const { error } = await supabase.from('posts').insert([{
      title, content, category, image_url: imgUrl, author: profile?.nickname || 'Anonymous', user_id: user.id
    }]);
    if (error) alert(error.message);
    else { alert("게시글 작성 완료!"); onRefresh(); onClose(); }
  };
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white"><X/></button>
        <h3 className="text-3xl font-black italic uppercase text-purple-500 mb-8">Create New Post</h3>
        <div className="space-y-5">
          <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold" value={category} onChange={e=>setCategory(e.target.value)}>
            {["스크린샷", "MVP", "커스터마이징 및 의상", "수집형 포인트"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold" placeholder="TITLE" value={title} onChange={e=>setTitle(e.target.value)} />
          <textarea className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold h-40" placeholder="CONTENT" value={content} onChange={e=>setContent(e.target.value)} />
          <ImageUploader label="Attach Image" onUpload={(url)=>setImgUrl(url)} />
          {imgUrl && <div className="text-[10px] text-purple-500 font-bold">✓ Image Ready</div>}
          <button onClick={handlePost} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
            <Send size={18}/> Publish
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- 공통 컴포넌트: 관리자 인풋 ---
const AdminInput = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="space-y-3 text-left w-full">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} placeholder={placeholder} className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all" value={value} onChange={e => onChange && onChange(e.target.value)} />
  </div>
);

// --- 나머지 기존 컴포넌트들 (Navbar, Hero, RaidCalendar, MyRoom, RankingPage, Auth 등) ---
// (기존 1210줄에 포함된 나머지 모든 UI 로직은 여기에 그대로 위치하게 됩니다.)
// 지면 관계상 핵심 수정 로직 위주로 구성하였으며, 실제 파일에 덮어쓰실 때는 위 구조에 맞춰 붙여넣으시면 됩니다.
