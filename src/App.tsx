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
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#05070d] flex items-center justify-center text-purple-400 font-bold italic">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.20),_transparent_30%),radial-gradient(circle_at_20%_80%,_rgba(168,85,247,0.16),_transparent_26%),radial-gradient(circle_at_80%_30%,_rgba(59,130,246,0.14),_transparent_22%)]" />
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.9) 0.8px, transparent 0.8px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-[18%] right-[6%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/16 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[28%] h-[520px] w-[520px] rounded-full bg-sky-500/16 blur-3xl" />
        </div>

        <div className="relative z-10">INXX SYSTEM LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070d] text-white font-sans selection:bg-purple-500/30">
      {/* 우주/성운 배경 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.20),_transparent_30%),radial-gradient(circle_at_20%_80%,_rgba(168,85,247,0.16),_transparent_26%),radial-gradient(circle_at_80%_30%,_rgba(59,130,246,0.14),_transparent_22%)]" />

        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 0.8px, transparent 0.8px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-[18%] right-[6%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[28%] h-[520px] w-[520px] rounded-full bg-sky-500/16 blur-3xl" />
      </div>

      {/* 실제 페이지 내용 */}
      <div className="relative z-10">
        {profile?.role === 'admin' && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 to-red-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase">
            👑 Administrator Session Active
          </div>
        )}

        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={handleLogout} />

        <main className={profile?.role === 'admin' ? "pt-20" : "pt-16"}>
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RaidCalendar user={user} />
                <div className="max-w-7xl mx-auto px-6 mb-12">
                  <div className="flex justify-center gap-12 border-b border-white/5 pb-6">
                    {['레이드', '가디언 토벌', '클래스'].map(t => (
                      <button
                        key={t}
                        onClick={() => setContentView(t)}
                        className={`text-xl font-black italic uppercase transition-all ${
                          contentView === t
                            ? 'text-purple-500 scale-110 underline underline-offset-8'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}

                    {profile?.is_admin && (
                      <>
                        {['길드 설정', '캐릭터 관리', '레이드 관리', '회원 관리'].map(t => (
                          <button
                            key={t}
                            onClick={() => setContentView(t)}
                            className={`text-xl font-black italic uppercase transition-all ${
                              contentView === t
                                ? 'text-red-500 scale-110 underline underline-offset-8'
                                : 'text-gray-600 hover:text-gray-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <MainContentViewer type={contentView} />
              </motion.div>
            )}

            {activeTab === 'posts' && <PostBoard posts={posts} user={user} profile={profile} onRefresh={fetchInitialData} />}
            {activeTab === 'myroom' && <MyRoom user={user} profile={profile} />}
            {activeTab === 'guild' && <GuildMembersPage user={user} />}
            {activeTab === 'ranking' && <RankingPage user={user} profile={profile} />}
            {activeTab === 'admin' && profile?.role === 'admin' && <AdminPanel settings={settings} setSettings={setSettings} />}
            {(activeTab === 'login' || activeTab === 'signup') && <Auth key="auth" mode={activeTab} setMode={setActiveTab} />}
          </AnimatePresence>
        </main>
      </div>
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
{adminTab === '캐릭터 관리' && <AdminCharacterManager />}
{adminTab === '레이드 관리' && <AdminRaidManager />}
{adminTab === '회원 관리' && <AdminUserManager />}
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
  const attributeOptions = ['화속성 취약', '수속성 취약', '암속성 취약', '빛속성 취약', '토속성 취약', '뇌속성 취약'];

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
  onChange={e=>setSelectedGate(Number(e.target.value))}
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
  const [contentsList, setContentsList] = useState<any[]>([]) // 🔥 이거 추가
  const fetchContents = async () => {
  console.log("🔥 fetchContents 실행됨"); // 확인용

  const { data } = await supabase
    .from('contents')
    .select('*')

  console.log("🔥 데이터:", data); // 확인용

  if (data) setContentsList(data)
}

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

      <div className="bg-slate-950/55 rounded-[3rem] border border-white/10 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.08)]">
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
const today = new Date();

const isToday =
  today.getFullYear() === year &&
  today.getMonth() === month &&
  today.getDate() === day;
      
            return (
<div
  key={day}
  className={`min-h-[160px] p-3 border transition-all
    ${isToday
      ? "bg-purple-900/40 border-purple-500 shadow-lg shadow-purple-500/20"
      : "bg-[#0a0a0a] border-transparent"
    }
  `}
>
           

                <div className="flex justify-between mb-2">

<span
  className={`text-xs font-bold
    ${isToday ? "text-purple-400 text-sm" : "text-gray-500"}
  `}
>
  {day}
</span>

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

const CreateRaidModal = ({ date,onRefresh,onClose }:any)=>{
useEffect(() => {
  fetchRaidList()
}, [])

const fetchRaidList = async () => {
  const { data } = await supabase
    .from('contents')
    .select('*')
    .eq('category', '레이드')

  if (data) setRaidList(data)
} 
  const [raidList, setRaidList] = useState<any[]>([])
const [form,setForm] = useState({
  raid_name:"",
  difficulty:"노말",
  raid_time:"20:00",
  raid_type:"8인",
  experience:"트라이", // 🔥 추가
  type:"raid"
})
const save = async()=>{

const max = form.type === "4인" ? 4 : 8

const { error } = await supabase
.from("raid_schedules")
.insert({
  raid_name:form.raid_name,
  raid_date:date,
  raid_time:form.raid_time,
  difficulty:form.difficulty,
  raid_type:form.raid_type,
  max_participants:max,
  type: form.type, // 🔥 추가
  experience: form.experience
})

if(!error){

alert("레이드 생성 완료")

onRefresh()
onClose()

}

}

return(

<div className="fixed inset-0 bg-black/90 flex items-center justify-center">

<div className="bg-zinc-900 p-8 rounded-xl w-[350px] space-y-4">

<select
  value={form.raid_name}
  onChange={(e)=>setForm({...form, raid_name:e.target.value})}
  className="w-full p-3"
>
  <option value="">레이드 선택</option>

  {raidList.map((r)=>(
    <option key={r.id} value={r.name}>
      {r.name}
    </option>
  ))}
</select>
<select
  value={form.experience}
  onChange={(e)=>setForm({...form, experience:e.target.value})}
  className="w-full p-3"
>
  <option value="트라이">트라이</option>
  <option value="클경">클경</option>
  <option value="반숙">반숙</option>
  <option value="숙련">숙련</option>
</select>
<select
  value={form.type}
  onChange={(e)=>setForm({...form,type:e.target.value})}
  className="w-full p-3"
>
  <option value="raid">레이드</option>
  <option value="anime">영화, 애니 시청</option>
</select>

  
<select
onChange={(e)=>setForm({...form,type:e.target.value})}
className="w-full p-3"
>
<option>8인</option>
<option>4인</option>
</select>

<select
onChange={(e)=>setForm({...form,difficulty:e.target.value})}
className="w-full p-3"
>
<option>노말</option>
<option>하드</option>
<option>나이트메어</option>
</select>

<input
value={form.raid_time}
onChange={(e)=>setForm({...form,raid_time:e.target.value})}
className="w-full p-3"
/>

<button
onClick={save}
className="w-full bg-purple-600 py-2 rounded"
>
생성
</button>

</div>

</div>

)

}
const JoinModal = ({ raid, parts, onClose, onRefresh }: any) => {
  const handleLeave = async (participantId:string) => {

  const ok = confirm("레이드 참여를 취소하시겠습니까?")
  if(!ok) return

  const { error } = await supabase
    .from("raid_participants")
    .delete()
    .eq("id", participantId)

  if(!error){
    onRefresh()
  }

}

  const [showJoin,setShowJoin] = useState(false)

  const dealerLimit = raid.max_participants === 4 ? 3 : 6
const supportLimit = raid.max_participants === 4 ? 1 : 2

const dealers = parts.filter((p:any)=>p.position==="딜러").length
const supports = parts.filter((p:any)=>p.position==="서포터").length

const isFull = dealers >= dealerLimit && supports >= supportLimit
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
      <div className="bg-slate-950/75 border border-indigo-400/20 rounded-3xl p-6 w-[420px] backdrop-blur-2xl shadow-[0_0_60px_rgba(99,102,241,0.16)]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-sky-500/15 p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black tracking-wide text-white">
                {raid.raid_name}
              </div>
              <div className="mt-2 text-sm text-white/70">
                {raid.raid_date} · {raid.raid_time}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-white/50 tracking-wider">모집 현황</div>
              <div className="text-xl font-black text-violet-300">
                {parts.length} / {raid.max_participants}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold">
              {raid.raid_type}
            </span>

            {raid.experience && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-xs font-bold text-emerald-300">
                {raid.experience}
              </span>
            )}

            <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-xs font-bold text-fuchsia-300">
              딜러 {dealers}/{dealerLimit}
            </span>

            <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-xs font-bold text-sky-300">
              서포터 {supports}/{supportLimit}
            </span>

            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold">
              빈자리 {raid.max_participants - parts.length}
            </span>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold tracking-wider text-white/70">참가자 목록</div>
          <div className="text-xs text-white/40">현재 참여 현황</div>
        </div>

        <div className="space-y-2 max-h-[240px] overflow-y-auto mb-4 pr-1">
          {parts.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
              아직 참가자가 없습니다
            </div>
          )}

          {parts.map((p: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm"
            >
              <div>
                <div className="font-bold text-white">{p.character_name}</div>
                <div className="text-xs text-white/60">
                  {p.class_name} · Lv.{p.item_level}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    p.position === "서포터"
                      ? "bg-sky-500/15 text-sky-300 border-sky-400/20"
                      : "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/20"
                  }`}
                >
                  {p.position}
                </span>

                <button
                  onClick={() => handleLeave(p.id)}
                  className="text-red-400 hover:text-red-300 text-xs font-bold transition"
                >
                  취소
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {!isFull && (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.02] transition shadow-[0_0_30px_rgba(99,102,241,0.25)]"
            >
              ⚔️ 레이드 참여
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full py-3 rounded-xl font-bold bg-red-600/90 hover:bg-red-600 transition shadow-lg"
          >
            🗑 레이드 삭제
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            닫기
          </button>
        </div>

        {showJoin && (
          <JoinForm
            raid={raid}
            onClose={() => setShowJoin(false)}
            onSuccess={() => {
              setShowJoin(false)
              onRefresh()
            }}
          />
        )}
      </div>
    </div>
  )
 



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

      <div className="bg-slate-950/75 p-6 rounded-xl w-[320px] space-y-3 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(59,130,246,0.10)]">

        <div className="text-white font-bold mb-2">
          레이드 참여
        </div>

        <input
          placeholder="닉네임"
          value={nickname}
          onChange={(e)=>setNickname(e.target.value)}
          className="w-full p-3 bg-black/40 border border-white/10 text-white rounded-xl outline-none focus:border-violet-400 transition"
        />

        <input
          placeholder="아이템 레벨"
          value={level}
          onChange={(e)=>setLevel(e.target.value)}
          className="w-full p-3 bg-black/40 border border-white/10 text-white rounded-xl outline-none focus:border-violet-400 transition"
        />

        <input
          placeholder="클래스"
          value={playerClass}
          onChange={(e)=>setPlayerClass(e.target.value)}
          className="w-full p-3 bg-black/40 border border-white/10 text-white rounded-xl outline-none focus:border-violet-400 transition"
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
 const isAnime = raid.type === "anime" // 🔥 이거 추가
  
  const [showJoin,setShowJoin] = useState(false)

  const isFull = parts.length >= raid.max_participants

  const percent =
    (parts.length / raid.max_participants) * 100
const raidColor =
  isAnime
    ? "green"
    : raid.raid_type === "4인"
    ? "blue"
    : "purple"; // 🔥 세미콜론 추가

return (  // 🔥 이거 추가
  <>
      <div
        onClick={()=>setShowJoin(true)}
       className={`relative p-3 rounded-xl cursor-pointer 
hover:scale-[1.03] transition-all shadow-lg

${raidColor === "blue"
  ? "bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border-blue-500/30 hover:border-blue-400"
  : "bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border-purple-500/30 hover:border-purple-400"
}

${isFull ? "border-red-500 bg-red-900/20" : ""}
`}
      >

        {/* 상단 */}
        <div className="flex justify-between items-center mb-1">

          <span className="text-[10px] text-purple-400 font-bold">
  {isAnime
    ? "📺 시청"
    : `${raid.raid_type} · ${raid.difficulty}`
  }
</span>

         {!isAnime && (
  <span className={`text-[10px] font-bold ${
    isFull ? "text-red-400" : "text-gray-400"
  }`}>
    {parts.length}/{raid.max_participants}
    {isFull && " FULL"}
  </span>
)}

        </div>

        {/* 레이드 이름 */}
        <div className="text-xs font-bold text-white leading-tight truncate">
          {raid.raid_name}
        </div>
{!isAnime && raid.experience && (
  <div className="text-[10px] text-green-400 font-bold mt-1">
    🎯 {raid.experience}
  </div>
)}
        
        {/* 시간 */}
        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
          <Clock size={10}/>
          {raid.raid_time}
        </div>

        {/* 참여도 바 */}
        <div className="mt-2 h-[4px] bg-black/40 rounded">

          <div
            style={{ width:`${percent}%` }}
          className={`h-full rounded ${
  isFull
    ? "bg-red-500"
    : raidColor === "blue"
    ? "bg-blue-500"
    : "bg-purple-500"
}`}
          />

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

const [rankIcon,setRankIcon] = useState<string | null>(null)

const [showRegister,setShowRegister] = useState(false)

const [characterName,setCharacterName] = useState("")
const [className,setClassName] = useState("")
const [engraving,setEngraving] = useState("")
const [itemLevel,setItemLevel] = useState("")
const [characters,setCharacters] = useState<any[]>([])
const [imageFile,setImageFile] = useState<File | null>(null)
const handleAttendance = async () => {

const today = new Date().toISOString().split("T")[0]

if(profile.last_attendance === today){
alert("오늘은 이미 출석했습니다 ✅")
return
}

const { error } = await supabase.rpc("add_points",{
p_user_id:user.id,
p_points:10,
p_type:"attendance"
})

if(error){
alert("출석 실패")
return
}

await supabase
.from("profiles")
.update({ last_attendance: today })
.eq("id", user.id)

alert("출석 완료! +10 포인트 🎉")

window.location.reload()

}
const fetchCharacters = async () => {

const { data,error } = await supabase
.from("guild_members")
.select("*")
.eq("user_id",user.id)
.order("created_at",{ascending:true})

if(!error){
setCharacters(data)
}

}

useEffect(()=>{

const fetchRankIcon = async () => {

if(!profile?.rank_name) return

const { data } = await supabase
.from("ranks")
.select("icon_url")
.eq("name",profile.rank_name)
.maybeSingle()

if(data?.icon_url){
setRankIcon(data.icon_url)
}

}

fetchRankIcon()
fetchCharacters()

},[profile])

const deleteCharacter = async(id:string)=>{

const ok = confirm("캐릭터 삭제할까요?")

if(!ok) return

const { error } = await supabase
.from("guild_members")
.delete()
.eq("id",id)

if(!error){
fetchCharacters()
}

}

const saveCharacter = async()=>{

let imageUrl = null

if(imageFile){

const ext = imageFile.name.split(".").pop()

const fileName = `${user.id}-${Date.now()}.${ext}`

const { error } = await supabase
.storage
.from("guild-images")
.upload(fileName,imageFile)

if(error){
alert("이미지 업로드 실패")
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
user_id:user.id,
character_name:characterName,
class_name:className,
item_level:itemLevel,
avatar_url:imageUrl
})

if(!error){

alert("캐릭터 등록 완료")

setCharacterName("")
setClassName("")
setItemLevel("")
setImageFile(null)

fetchCharacters()

}

}

if(!user || !profile) return null

return(

<div className="max-w-4xl mx-auto py-24 px-6">

<h2 className="text-4xl font-black mb-10">
My Room
</h2>

<div className="bg-white/5 p-10 rounded-3xl space-y-6">

<div className="text-xl font-bold">
닉네임 : {profile.nickname}
</div>

<div className="text-xl">
포인트 : {profile.points || 0}
</div>
<button
onClick={handleAttendance}
className="bg-green-600 px-5 py-2 rounded-xl"
>
출석 체크 (+10P)
</button>
{rankIcon && (
<img
src={rankIcon}
className="w-20"
/>
)}

<button
onClick={()=>setShowRegister(!showRegister)}
className="bg-purple-600 px-5 py-2 rounded-xl"
>
캐릭터 등록
</button>

{showRegister && (

<div className="space-y-3">

<input
placeholder="캐릭터명"
value={characterName}
onChange={(e)=>setCharacterName(e.target.value)}
className="w-full p-3 rounded"
/>

<input
placeholder="직업"
value={className}
onChange={(e)=>setClassName(e.target.value)}
className="w-full p-3 rounded"
/>

<input
placeholder="아이템레벨"
value={itemLevel}
onChange={(e)=>setItemLevel(e.target.value)}
className="w-full p-3 rounded"
/>

<input
type="file"
onChange={(e)=>setImageFile(e.target.files?.[0] || null)}
className="w-full"
/>

<button
onClick={saveCharacter}
className="bg-blue-500 px-4 py-2 rounded"
>
저장
</button>

</div>

)}

<div className="grid grid-cols-3 gap-4 mt-8">

{characters.map((c)=>(
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

<button
onClick={()=>deleteCharacter(c.id)}
className="bg-red-500 mt-3 px-3 py-1 rounded text-sm"
>
삭제
</button>

</div>
))}

</div>

</div>

</div>

)

}



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
const GuildMembersPage = () => {

const [members,setMembers] = useState<any[]>([])

useEffect(()=>{

fetchMembers()

},[])

const fetchMembers = async()=>{

const { data } = await supabase
.from("guild_members")
.select("*")
.order("created_at",{ascending:true})

if(data){
setMembers(data)
}

}

return(

<div className="max-w-6xl mx-auto px-6 py-20">

<h1 className="text-3xl font-bold mb-10">
길드 캐릭터
</h1>

<div className="grid grid-cols-4 gap-6">

{members.map((m)=>(
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

)

}


const AdminCharacterManager = () => {

const [chars,setChars] = useState<any[]>([])

useEffect(()=>{
fetchChars()
},[])

const fetchChars = async()=>{

const { data } = await supabase
.from("guild_members")
.select("*")
.order("created_at",{ascending:false})

if(data){
setChars(data)
}

}

const deleteChar = async(id:string)=>{

if(!confirm("캐릭터 삭제할까요?")) return

await supabase
.from("guild_members")
.delete()
.eq("id",id)

fetchChars()

}

return(

<div className="space-y-4">

<h3 className="text-xl font-bold">
길드 캐릭터 관리
</h3>

{chars.map(c=>(
<div key={c.id} className="flex justify-between bg-black/40 p-4 rounded">

<div>
<div>{c.character_name}</div>
<div className="text-xs text-gray-400">{c.class_name}</div>
</div>

<button
onClick={()=>deleteChar(c.id)}
className="text-red-500"
>
삭제
</button>

</div>
))}

</div>

)

}

const AdminRaidManager = () => {

const [raids,setRaids] = useState<any[]>([])

useEffect(() => {
  fetchRaids()
  fetchContents() // 🔥 이 줄 추가
}, [])

const fetchRaids = async()=>{

const { data } = await supabase
.from("raid_schedules")
.select("*")
.order("raid_date")

if(data){
setRaids(data)
}

}

const deleteRaid = async(id:string)=>{

if(!confirm("레이드 삭제할까요?")) return

await supabase
.from("raid_schedules")
.delete()
.eq("id",id)

fetchRaids()

}
console.log(contentsList)
return(

<div className="space-y-4">

<h3 className="text-xl font-bold">
레이드 일정 관리
</h3>

{raids.map(r=>(
<div key={r.id} className="flex justify-between bg-black/40 p-4 rounded">

<div>
<div>{r.raid_name}</div>
<div className="text-xs text-gray-400">
{r.raid_date} {r.raid_time}
</div>
</div>

<button
onClick={()=>deleteRaid(r.id)}
className="text-red-500"
>
삭제
</button>

</div>
))}

</div>

)

}

const AdminUserManager = () => {

const [users,setUsers] = useState<any[]>([])

useEffect(()=>{
fetchUsers()
},[])

const fetchUsers = async()=>{

const { data } = await supabase
.from("profiles")
.select("*")

if(data){
setUsers(data)
}

}

const deleteUser = async(id:string)=>{

if(!confirm("회원 삭제할까요?")) return

await supabase
.from("profiles")
.delete()
.eq("id",id)

fetchUsers()

}

return(

<div className="space-y-4">

<h3 className="text-xl font-bold">
회원 관리
</h3>

{users.map(u=>(
<div key={u.id} className="flex justify-between bg-black/40 p-4 rounded">

<div>
<div>{u.nickname}</div>
<div className="text-xs text-gray-400">{u.rank_name}</div>
</div>

<button
onClick={()=>deleteUser(u.id)}
className="text-red-500"
>
삭제
</button>

</div>
))}

</div>

)

}
