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
          {activeTab === 'guild' && (
  <GuildMembersPage user={user} />
)}
          {activeTab === 'ranking' && (
  <RankingPage user={user} profile={profile} />
)}
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
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

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
        <motion.div 
          whileHover={{ y: -5 }} 
          key={item.id} 
          onClick={() => setSelectedItem(item)} 
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-square cursor-pointer shadow-xl"
        >
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
          <div className="flex gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {[1,2,3,4].map(g=><button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black transition-all ${gate===g?'bg-purple-600 shadow-lg shadow-purple-600/20':'text-gray-500'}`}>{g}관문</button>)}
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

// --- [관리자] 통합 설정 패널 (리스트 기반 삭제 로직 포함) ---
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

// --- [관리자] 레이드 & 가디언 리스트 기반 에디터 ---
const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [list, setList] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [maxGate, setMaxGate] = useState(4);
const [availableDifficulties, setAvailableDifficulties] = useState([
  "노말",
  "하드",
  "나이트메어"
]);

  const [form, setForm] = useState({
    name: '',
    image_url: '',
    hp: '',
    element: '',
    attribute: '',
gold: 0,
max_gate: 4,
available_difficulties: ["노말","하드","나이트메어"],
  });

  const elementOptions = ['악마형', '야수형', '인간형', '정령형', '기계형', '고대', '불사', '신'];
  const attributeOptions = ['화속성', '수속성', '암속성', '빛속성', '토속성'];

  useEffect(() => { fetchList(); }, [isRaid]);
  useEffect(() => {
  if (editingId) {
    const item = list.find(l => l.id === editingId);
    if (item) {
      loadItem(item);
    }
  }
}, [selectedGate, difficulty]);

  const fetchList = async () => {
    const { data } = await supabase
      .from('contents')
      .select('*')
      .eq('category', isRaid ? '레이드' : '가디언 토벌')
      .order('name');

    if (data) setList(data);
  };

  // 🔥 리스트 클릭 시 기존 데이터 불러오기
  const loadItem = async (item: any) => {
    setEditingId(item.id);
    setForm(prev => ({
  ...prev,
  name: item.name,
  image_url: item.image_url || '',
  max_gate: item.max_gate ?? 4,
  available_difficulties:
    item.available_difficulties ?? ["노말","하드","나이트메어"]
}));

    const { data } = await supabase
      .from('content_details')
      .select('*')
      .eq('content_id', item.id)
      .eq('difficulty', isRaid ? difficulty : null)
      .eq('gate_num', isRaid ? selectedGate : 0)
      .maybeSingle();

    if (data) {
      setForm({
        name: item.name,
        image_url: item.image_url || '',
        hp: data.hp || '',
        element: data.element_type || '',
        attribute: data.attribute || '',
        gold: data.clear_gold || 0
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      image_url: '',
      hp: '',
      element: '',
      attribute: '',
      gold: 0
    });
  };

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력하세요.");

    const { data, error: cErr } = await supabase
      .from('contents')
      .upsert(
        {
          id: editingId || undefined,
          name: form.name,
          category: isRaid ? '레이드' : '가디언 토벌',
          image_url: form.image_url
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (cErr) return alert(cErr.message);

    const { error: dErr } = await supabase
      .from('content_details')
      .upsert(
        {
          content_id: data.id,
          difficulty: isRaid ? difficulty : null,
          gate_num: isRaid ? Number(selectedGate) : 0,
          hp: form.hp,
          element_type: form.element,
          attribute: form.attribute,
          clear_gold: form.gold
        },
        { onConflict: 'content_id, difficulty, gate_num' }
      );

    if (!dErr) {
      alert(editingId ? "수정 완료!" : "등록 완료!");
      fetchList();
      resetForm();
    } else {
      alert(dErr.message);
    }
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return;
    await supabase.from('content_details').delete().eq('content_id', id);
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (!error) {
      alert("삭제 완료");
      fetchList();
      resetForm();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase text-purple-500 tracking-widest">
          Current List
        </h4>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {list.map(item => (
            <div
              key={item.id}
              onClick={() => loadItem(item)}
              className={`flex items-center justify-between bg-black/40 p-4 rounded-xl border cursor-pointer transition-all
                ${editingId === item.id ? 'border-purple-500' : 'border-white/5 hover:border-white/20'}`}
            >
              <span className="text-sm font-bold text-gray-300">
                {item.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteItem(item.id, item.name); }}
                className="text-gray-600 hover:text-red-500"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {editingId && (
          <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">
            🔧 수정 모드
          </div>
        )}

        <AdminInput
          label="Content Name"
          value={form.name}
          onChange={(v:any)=>setForm({...form, name:v})}
        />

        <ImageUploader
          label="Image"
          onUpload={(url)=>setForm({...form, image_url:url})}
        />

        {isRaid && (
          <div className="grid grid-cols-2 gap-4">
           <select
  value={selectedGate}
  onChange={e=>setSelectedGate(e.target.value)}
>
      <div className="flex gap-2">
  {[1,2,3,4].map(g => (
    <button
      key={g}
      type="button"
      onClick={() => setSelectedGate(g)}
      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
        selectedGate === g
          ? "bg-purple-600 text-white"
          : "bg-black border border-white/10 text-gray-400"
      }`}
    >
      {g}관문
    </button>
  ))}
</div>
            </select>

            <select
              className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold"
              value={difficulty}
              onChange={e=>setDifficulty(e.target.value)}
            >
              {['노말','하드','나이트메어'].map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="mt-4 flex gap-2">
  {[1,2,3,4].map(g => (
    <button
      key={g}
      type="button"
      onClick={() => setSelectedGate(g)}
      className={`px-4 py-2 rounded-lg text-xs font-bold ${
        selectedGate === g
          ? "bg-purple-600 text-white"
          : "bg-black border border-white/20 text-gray-400"
      }`}
    >
      {g}관문
    </button>
  ))}
</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="HP" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} />
          <AdminInput label="Gold" type="number" value={form.gold} onChange={(v:any)=>setForm({...form, gold:v})} />
        </div>

        {/* 🔥 드롭다운화 */}
        <div className="grid grid-cols-2 gap-4">
          <select
            className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold"
            value={form.element}
            onChange={e=>setForm({...form, element:e.target.value})}
          >
            <option value="">계열 선택</option>
            {elementOptions.map(e=><option key={e}>{e}</option>)}
          </select>

          <select
            className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold"
            value={form.attribute}
            onChange={e=>setForm({...form, attribute:e.target.value})}
          >
            <option value="">속성 선택</option>
            {attributeOptions.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all"
          >
            {editingId ? "Update Content" : "Register Content"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-700 px-4 rounded-xl font-black uppercase"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- [관리자] 클래스 리스트 기반 에디터 ---
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
          <AdminInput label="Root" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
          <AdminInput label="Sub" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
        </div>
        <AdminInput label="Job Engraving" value={form.eng_job} onChange={(v:any)=>setForm({...form, eng_job:v})} />
        <ImageUploader label="Class Image" onUpload={(url)=>setForm({...form, image_url: url})} />
        <button onClick={handleSave} className="w-full bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all">Update Class</button>
      </div>
    </div>
  );
};

// --- [기능] 게시판 (로그인 제한, 이미지 업로드, 삭제 기능 추가) ---
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
  <PostWriteModal 
    user={user}
    profile={profile}
    onRefresh={onRefresh}
    onClose={() => setIsWriteOpen(false)}
    refreshProfile={() => fetchProfile(user.id)}
  />
)}
      </AnimatePresence>
    </motion.div>
  );
};

// --- [기능] 게시판 글쓰기 모달 (이미지 첨부 포함) ---
const PostWriteModal = ({ user, profile, onRefresh, onClose, refreshProfile }: any) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('스크린샷');
  const [imgUrl, setImgUrl] = useState('');

  const handlePost = async () => {
  if (!title || !content) {
    alert("제목과 내용을 입력하세요.");
    return;
  }

  // 1️⃣ 게시글 저장
  const { error } = await supabase.from('posts').insert([{
    title,
    content,
    category,
    image_url: imgUrl,
    author: profile?.nickname || 'Anonymous',
    user_id: user.id
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  // 2️⃣ 포인트 +5 지급
  const { error: pointError } = await supabase.rpc('add_points', {
    p_user_id: user.id,
    p_points: 5,
    p_type: 'post'
  });

  if (pointError) {
    console.error("포인트 지급 실패:", pointError.message);
  }

  alert("게시글 작성 완료! +5 포인트 획득 🎉");

  onRefresh();
  onClose();
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
          <button onClick={handlePost} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
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
    <input 
      type={type} placeholder={placeholder}
      className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all"
      value={value} onChange={e => onChange && onChange(e.target.value)}
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
    const { data: rData } = await supabase
      .from('raid_schedules')
      .select('*')
      .order('raid_time');

    const { data: pData } = await supabase
      .from('raid_participants')
      .select('*');

    if (rData) setRaids(rData);
    if (pData) setParticipants(pData);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dateArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">

      <div className="flex items-center justify-between mb-12">

        <h2 className="text-4xl font-black italic">
          {year}.{String(month + 1).padStart(2, '0')}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-3 border border-white/10 rounded-xl"
          >
            <ChevronLeft/>
          </button>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-3 border border-white/10 rounded-xl"
          >
            <ChevronRight/>
          </button>
        </div>

      </div>

      <div className="bg-[#0f0f0f] rounded-[3rem] border border-white/5 overflow-hidden">

        <div className="grid grid-cols-7 text-center text-xs text-gray-500 border-b border-white/5">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
            <div key={d} className="p-4">{d}</div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-[1px] bg-white/5">

          {Array.from({ length: firstDayOfMonth }).map((_, i) =>
            <div key={i} className="bg-[#0a0a0a] min-h-[160px]" />
          )}

          {dateArray.map(day => {

            const dateStr =
              `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

            const dayRaids = raids.filter(r => r.raid_date === dateStr);

            return (

              <div key={day} className="bg-[#0a0a0a] min-h-[160px] p-3">

                <div className="flex justify-between mb-2">

                  <span className="text-xs text-gray-500">{day}</span>

                  <button
                    onClick={()=>{
                      setSelectedDate(dateStr);
                      setIsModalOpen(true);
                    }}
                    className="text-purple-400"
                  >
                    <Plus size={16}/>
                  </button>

                </div>

                <div className="space-y-2">

                  {dayRaids.map(raid => (
                    <RaidItem
                      key={raid.id}
                      raid={raid}
                      parts={participants.filter(p=>p.schedule_id===raid.id)}
                      onRefresh={fetchData}
                    />
                  ))}

                </div>

              </div>
            );
          })}

        </div>
      </div>

      {isModalOpen &&
        <CreateRaidModal
          date={selectedDate}
          onRefresh={fetchData}
          onClose={()=>setIsModalOpen(false)}
        />
      }

    </section>
  );
};

const CreateRaidModal = ({ date, onRefresh, onClose }: any) => {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '오후 8:00' });
  const save = async () => {
    if(!form.raid_name) return alert("레이드 이름을 입력해주세요.");
    const { error } = await supabase.from('raid_schedules').insert([{ ...form, raid_date: date, max_participants: 8 }]);
    if (error) alert("생성 실패: " + error.message);
    else { alert("레이드가 생성되었습니다!"); onRefresh(); onClose(); }
  };
  
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative">
        <h3 className="text-3xl font-black text-purple-500 italic mb-10 tracking-tighter uppercase underline decoration-purple-600/30 underline-offset-8">New Raid Event</h3>
        <div className="space-y-5">
          <AdminInput label="Raid Name" placeholder="카멘 3관" value={form.raid_name} onChange={(v:any)=>setForm({...form, raid_name:v})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 ml-1 uppercase">Difficulty</label>
              <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none font-bold text-white" onChange={e => setForm({...form, difficulty: e.target.value})}>
                <option value="노말">노말</option><option value="하드">하드</option><option value="나이트메어">나이트메어</option>
              </select>
            </div>
            <AdminInput label="Time" value={form.raid_time} onChange={(v:any)=>setForm({...form, raid_time:v})} />
          </div>
          <button onClick={save} className="w-full bg-purple-600 p-6 rounded-2xl font-black tracking-widest hover:bg-purple-500 transition-all mt-6 shadow-xl shadow-purple-600/20 active:scale-95 uppercase text-white">Confirm Raid</button>
          <button onClick={onClose} className="w-full text-gray-600 text-[10px] font-black py-2 tracking-widest hover:text-white uppercase transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const JoinModal = ({ raid, parts, onClose, onRefresh }: any) => {

  const [showJoin,setShowJoin] = useState(false)

  const dealers = parts.filter((p:any)=>p.position==="딜러").length
  const supports = parts.filter((p:any)=>p.position==="서포터").length

  const isFull = dealers >= 6 && supports >= 2

  const handleDelete = async () => {

    const ok = confirm("레이드를 삭제하시겠습니까?")

    if(!ok) return

    await supabase
      .from("raid_schedules")
      .delete()
      .eq("id", raid.id)

    onRefresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

      <div className="bg-[#0f0f1a] border border-purple-500/30 rounded-2xl p-6 w-[380px]">

        <div className="text-white text-lg font-bold mb-4">
          {raid.raid_name}
        </div>

        <div className="text-sm text-gray-400 mb-2">
          날짜 : {raid.raid_date}
        </div>

        <div className="text-sm text-gray-400 mb-2">
          시간 : {raid.raid_time}
        </div>

        <div className="text-sm text-gray-400 mb-4">
          딜러 {dealers}/6 | 서포터 {supports}/2
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">

          {parts.length === 0 && (
            <div className="text-gray-500 text-sm">
              아직 참가자가 없습니다
            </div>
          )}

          {parts.map((p:any,i:number)=>(
            <div key={i} className="flex justify-between text-sm text-gray-300">

              <div>
                {p.character_name} ({p.item_level})
              </div>

              <div className="text-purple-400">
                {p.class_name} / {p.position}
              </div>

            </div>
          ))}

        </div>

        {!isFull && (
          <button
            onClick={()=>setShowJoin(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg mb-2"
          >
            참여하기
          </button>
        )}

        <button
          onClick={handleDelete}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg mb-2"
        >
          레이드 삭제
        </button>

        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
        >
          닫기
        </button>

        {showJoin && (
          <JoinForm
            raid={raid}
            onClose={()=>setShowJoin(false)}
            onSuccess={()=>{
              setShowJoin(false)
              onRefresh()
            }}
          />
        )}

      </div>

    </div>
  )
}



const JoinForm = ({ raid, onClose, onSuccess }: any) => {

  const [nickname,setNickname] = useState("")
  const [level,setLevel] = useState("")
  const [playerClass,setPlayerClass] = useState("")
  const [role,setRole] = useState("딜러")

  const handleJoin = async () => {

    const { error } = await supabase
      .from("raid_participants")
      .insert({
        schedule_id: raid.id,
        character_name: nickname,
        item_level: level,
        class_name: playerClass,
        position: role
      })

    if(!error){
      onSuccess()
    } else {
      alert("참여 실패")
    }

  }

  return (

    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

      <div className="bg-[#0f0f1a] p-6 rounded-xl w-[320px] space-y-3">

        <div className="text-white font-bold mb-2">
          레이드 참여
        </div>

        <input
          placeholder="닉네임"
          value={nickname}
          onChange={(e)=>setNickname(e.target.value)}
          className="w-full p-2 bg-black text-white rounded"
        />

        <input
          placeholder="아이템 레벨"
          value={level}
          onChange={(e)=>setLevel(e.target.value)}
          className="w-full p-2 bg-black text-white rounded"
        />

        <input
          placeholder="클래스"
          value={playerClass}
          onChange={(e)=>setPlayerClass(e.target.value)}
          className="w-full p-2 bg-black text-white rounded"
        />

        <select
          value={role}
          onChange={(e)=>setRole(e.target.value)}
          className="w-full p-2 bg-black text-white rounded"
        >
          <option>딜러</option>
          <option>서포터</option>
        </select>

        <button
          onClick={handleJoin}
          className="w-full bg-green-600 py-2 rounded"
        >
          참가
        </button>

        <button
          onClick={onClose}
          className="w-full bg-gray-700 py-2 rounded"
        >
          취소
        </button>

      </div>

    </div>

  )
}


const RaidItem = ({ raid, parts, onRefresh }: any) => {

  const [showJoin,setShowJoin] = useState(false)

  const isFull = parts.length >= raid.max_participants

  return (
    <>
      <div
        onClick={()=>setShowJoin(true)}
        className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl cursor-pointer hover:border-purple-500"
      >

        <div className="flex justify-between text-[10px] text-purple-400 mb-1">

          <span>{raid.difficulty}</span>

          <span>
            {parts.length}/{raid.max_participants}
            {isFull && " FULL"}
          </span>

        </div>

        <div className="text-xs font-bold text-white leading-tight whitespace-normal break-words">
          {raid.raid_name}
        </div>

        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
          <Clock size={10}/>
          {raid.raid_time}
        </div>

      </div>

      {showJoin &&
        <JoinModal
          raid={raid}
          parts={parts}
          onRefresh={onRefresh}
          onClose={()=>setShowJoin(false)}
        />
      }
    </>
  )
}

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => {
const navItems = [
  { id: 'home', label: '홈' }, 
  { id: 'posts', label: '게시판' },
  { id: 'ranking', label: '랭킹' },
  { id: 'guild', label: '길드' },
  ...(user ? [{ id: 'myroom', label: '마이룸' }] : []),
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
          {user && <button onClick={onLogout} className="text-xs font-black text-gray-500 hover:text-red-400 uppercase tracking-widest transition-colors ml-4">Logout</button>}
        </div>
      </div>
    </nav>
  );
};
import { useEffect } from "react";

const Hero = ({ settings }: any) => {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@splinetool/viewer@1.12.61/build/spline-viewer.js";
    script.type = "module";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="relative h-[100vh] flex items-center justify-center overflow-hidden">

      {/* 🔥 Spline 배경 */}
      <div className="absolute inset-0 -z-10">
        <spline-viewer
          url="https://prod.spline.design/여기네URL/scene.splinecode"
          style={{ width: "100%", height: "100%" }}
        ></spline-viewer>
      </div>

      {/* 어둡게 오버레이 */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* 기존 텍스트 */}
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <span className="inline-block px-5 py-2 rounded-full bg-purple-500/5 text-purple-400 text-[10px] font-black mb-6 border border-purple-500/10 tracking-[0.4em] uppercase italic">
            Lost Ark Guild System v2.0
          </span>

          <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 font-mono leading-none">
            {settings?.guild_name}
          </h1>

          <p className="text-gray-300 text-xl max-w-2xl mx-auto font-bold italic uppercase tracking-tight opacity-80">
            {settings?.guild_description}
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
    </section>
  );
};


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
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMode('home');
      }
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <div className="p-12 rounded-[4rem] border border-white/10 bg-[#0f0f0f] shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
        <h2 className="text-5xl font-black italic mb-2 tracking-tighter uppercase">{mode === 'login' ? 'Sign In' : 'Join Us'}</h2>
        <p className="text-gray-600 text-[10px] font-black tracking-[0.4em] mb-12 uppercase italic">Authentication Required</p>
        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <input type="email" placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white" value={password} onChange={e => setPassword(e.target.value)} required />
          {mode === 'signup' && (
            <input type="text" placeholder="NICKNAME" className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white" value={nickname} onChange={e => setNickname(e.target.value)} required />
          )}
          <button type="submit" className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-[0.3em] mt-6 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 active:scale-95 text-white">Proceed</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="mt-8 text-[10px] font-black text-gray-600 hover:text-white uppercase transition-all">Switch to {mode === 'login' ? 'signup' : 'login'}</button>
      </div>
    </div>
  );
};

const MyRoom = ({ user, profile }: any) => {
  
 const [rankIcon, setRankIcon] = React.useState<string | null>(null);
  const [characterName, setCharacterName] = React.useState("")
const [className, setClassName] = React.useState("")
const [engraving, setEngraving] = React.useState("")
const [itemLevel, setItemLevel] = React.useState("")
  const [characters, setCharacters] = React.useState([])
const [imageFile, setImageFile] = React.useState<File | null>(null)

  const fetchCharacters = async () => {

const { data, error } = await supabase
.from("guild_members")
.select("*")
.eq("user_id", user.id)

if(!error){
setCharacters(data)
}

}

  useEffect(() => {
  const fetchRankIcon = async () => {
    if (!profile?.rank_name) return;

    const { data, error } = await supabase
      .from('ranks')
      .select('icon_url')
      .eq('name', profile.rank_name)
      .maybeSingle();

    if (!error && data?.icon_url) {
      setRankIcon(data.icon_url);
    }
  };

  
  fetchRankIcon();
    fetchCharacters();
}, [profile]);
  if (!user || !profile) return null;
  
const handleAttendance = async () => {
  const today = new Date().toISOString().split('T')[0];

  if (profile.last_attendance === today) {
    alert("오늘은 이미 출석했습니다 ✅");
    return;
  }

  const { error } = await supabase.rpc('add_points', {
    p_user_id: user.id,
    p_points: 10,
    p_type: 'attendance'
  });

  if (error) {
    alert("출석 실패: " + error.message);
    return;
  }

  await supabase
    .from('profiles')
    .update({ last_attendance: today })
    .eq('id', user.id);

  alert("출석 완료! +10 포인트 🎉");

  window.location.reload(); // 간단하게 새로고침
};
const saveCharacter = async () => {

let imageUrl = null

if(imageFile){

const ext = imageFile.name.split('.').pop()
const fileName = `${user.id}-${Date.now()}.${ext}`

const { error:uploadError } = await supabase
.storage
.from("guild-images")
.upload(fileName,imageFile)

if(uploadError){
alert("이미지 업로드 실패 : " + uploadError.message)
return
}

const { data } = supabase
.storage
.from("guild-images")
.getPublicUrl(fileName)

imageUrl = data.publicUrl

}

const { error } = await supabase
.from("guild_members")
.insert({
  user_id: user.id,
  character_name: characterName,
  class_name: className,
  item_level: itemLevel,
  avatar_url: imageUrl
})

if(error){
alert("캐릭터 등록 실패 : " + error.message)
}else{
alert("캐릭터 등록 완료 🎉")
fetchCharacters()
}

}
  return (
    <div className="max-w-4xl mx-auto py-24 px-6 text-center">
      <h2 className="text-4xl font-black italic mb-10 uppercase tracking-tight">
        My Room
      </h2>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 space-y-6">
        
        <div>
          <div className="text-gray-500 text-xs uppercase mb-2">닉네임</div>
          <div className="text-2xl font-black">{profile.nickname}</div>
        </div>

        <div>
          <div className="text-gray-500 text-xs uppercase mb-2">현재 포인트</div>
          <div className="text-3xl font-black text-purple-400">
            {profile.points || 0} P
          </div>
        </div>

        <div>
          <div className="text-gray-500 text-xs uppercase mb-2">현재 등급</div>
        <div className="flex flex-col items-center gap-3">
  {rankIcon && (
    <img
      src={rankIcon}
      alt="rank icon"
      className="w-20 h-20 object-contain"
    />
  )}
  <div className="text-xl font-black text-yellow-400">
    {profile.rank_name || "Seed"}
  </div>
</div>
        </div>
<button
    onClick={handleAttendance}
    className="w-full bg-purple-600 p-4 rounded-2xl font-black uppercase hover:bg-purple-500 transition-all mt-6"
  >
    출석 체크 (+10P)
  </button>
   
        <div className="mt-10 space-y-4">

  <div className="text-lg font-black">
    캐릭터 등록
  </div>

  <input
    placeholder="캐릭터명"
    value={characterName}
    onChange={(e) => setCharacterName(e.target.value)}
    className="w-full border p-3 rounded-xl"
  />

  <input
    placeholder="직업"
    value={className}
    onChange={(e) => setClassName(e.target.value)}
    className="w-full border p-3 rounded-xl"
  />

  <input
    placeholder="직업각인"
    value={engraving}
    onChange={(e) => setEngraving(e.target.value)}
    className="w-full border p-3 rounded-xl"
  />

  <input
    placeholder="아이템 레벨"
    value={itemLevel}
    onChange={(e) => setItemLevel(e.target.value)}
    className="w-full border p-3 rounded-xl"
  />

  <input
    type="file"
    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
    className="w-full border p-3 rounded-xl"
  />

  <button
    onClick={saveCharacter}
    className="w-full bg-blue-500 p-3 rounded-xl font-black"
  >
    캐릭터 저장
  </button>

</div>

<div className="mt-10">

<div className="text-xl font-bold mb-4">
내 캐릭터
</div>

<div className="grid grid-cols-3 gap-4">

{characters.map((c:any) => (

<div key={c.id} className="bg-black/40 p-4 rounded-xl">

{c.avatar_url && (
<img
src={c.avatar_url}
className="w-full h-32 object-cover rounded mb-2"
/>
)}

<div className="font-bold">
{c.character_name}
</div>

<div className="text-sm text-gray-400">
{c.class_name}
</div>

<div className="text-purple-400">
{c.item_level}
</div>

</div>

))}

</div>

</div>

      </div>
    </div>
  );
};

</div>
      </div>
    </div>
  );
};


const RankingPage = ({ user, profile }: any) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [myRank, setMyRank] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, points, rank_name')
      .order('points', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (data) {
      setUsers(data);

      if (user) {
        const index = data.findIndex((u: any) => u.id === user.id);
        if (index !== -1) {
          setMyRank(index + 1);
        }
      }
    }

    setLoading(false);
  };

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <div className="text-gray-500 font-black">LOADING RANKING...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-24 px-6 text-left">
      <h2 className="text-4xl font-black italic mb-12 uppercase tracking-tight">
        Guild Ranking
      </h2>

      <div className="space-y-4">
        {users.slice(0, 10).map((u, i) => (
          <div
            key={u.id}
            className={`flex justify-between items-center p-6 rounded-2xl border transition-all
              ${user?.id === u.id
                ? "bg-purple-600/10 border-purple-500"
                : "bg-white/5 border-white/10"}`}
          >
            <div className="flex items-center gap-6">
              <div className="text-2xl font-black w-12 text-center">
                {getMedal(i)}
              </div>

              <div>
                <div className="text-lg font-black">
                  {u.nickname}
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  {u.rank_name || "Seed"}
                </div>
              </div>
            </div>

            <div className="text-xl font-black text-purple-400">
              {u.points || 0} P
            </div>
          </div>
        ))}
      </div>

      {user && myRank && (
        <div className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <div className="text-sm text-gray-400 mb-2 uppercase">
            My Rank
          </div>
          <div className="text-3xl font-black text-yellow-400">
            #{myRank}
          </div>
        </div>
      )}
    </div>
  );
};

const GuildMembersPage = ({ user }: any) => {

  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {

    const { data, error } = await supabase
      .from("guild_members")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMembers(data)
    }

    setLoading(false)
  }

const deleteMember = async (id: string) => {

  const ok = confirm("캐릭터 삭제할까요?")

  if (!ok) return

  const { error } = await supabase
    .from("guild_members")
    .delete()
    .eq("id", id)

  if (!error) {
    fetchMembers()
  }

}
  
  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        길드 멤버 불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">

      <h1 className="text-3xl font-bold mb-10">
        길드 멤버
      </h1>

      <div className="grid grid-cols-4 gap-6">
{members.map((m) => (
  <div key={m.id} className="bg-zinc-900 p-5 rounded-xl">

    {m.avatar_url && (
      <img
        src={m.avatar_url}
        className="w-full h-40 object-cover rounded-lg mb-3"
      />
    )}

    <div className="text-lg font-bold">
      {m.character_name}
    </div>

    <div className="text-sm text-gray-400">
      {m.class_name}
    </div>

    <div className="text-sm text-purple-400 mt-2">
      {m.item_level}
    </div>

  </div>
))}

</div>
</div>
);
}
        
