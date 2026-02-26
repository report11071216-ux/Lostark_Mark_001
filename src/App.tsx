import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Plus, X, Clock, Settings, Save, ChevronRight, 
  Link as LinkIcon, Trash2, Calendar as CalendarIcon, 
  ChevronLeft, Users, Image as ImageIcon, Info, Layers, Database
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 설정 ---
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentView, setContentView] = useState('레이드');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    };
    init();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('home');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-black italic">INXX SYSTEM LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {/* 관리자 배너 */}
      {profile?.role === 'admin' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 to-red-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase">
          👑 Administrator Session Active
        </div>
      )}

      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30"><Shield className="text-white w-5 h-5" /></div>
            <span className="text-2xl font-black tracking-tighter uppercase font-mono italic">INXX</span>
          </div>
          <div className="flex gap-8">
            {['home', 'posts', 'admin'].map((t) => (
              (t !== 'admin' || profile?.role === 'admin') && (
                <button key={t} onClick={() => setActiveTab(t)} className={`text-xs font-black tracking-[0.2em] transition-all uppercase ${activeTab === t ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}>
                  {t === 'home' ? '홈' : t === 'posts' ? '게시판' : '관리자'}
                </button>
              )
            ))}
            {!user && <button onClick={() => setActiveTab('login')} className="text-xs font-black text-purple-500 uppercase tracking-widest">Login</button>}
            {user && <button onClick={handleLogout} className="text-xs font-black text-gray-500 hover:text-red-400 uppercase tracking-widest">Logout</button>}
          </div>
        </div>
      </nav>
      
      <main className={profile?.role === 'admin' ? "pt-20" : "pt-16"}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <div key="home">
              <Hero />
              
              {/* 콘텐츠 탭 */}
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

          {activeTab === 'admin' && profile?.role === 'admin' && <AdminPanel />}
          {(activeTab === 'login' || activeTab === 'signup') && <Auth mode={activeTab} setMode={setActiveTab} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- [컴포넌트] Hero Section ---
const Hero = () => (
  <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent"></div>
    <div className="relative z-10 text-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <span className="inline-block px-5 py-2 rounded-full bg-purple-500/5 text-purple-400 text-[10px] font-black mb-6 border border-purple-500/10 tracking-[0.4em] uppercase italic">Lost Ark Guild System</span>
        <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 font-mono leading-none uppercase">INXX GUILD</h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto font-bold italic uppercase tracking-tight opacity-70">Experience the next level of guild management</p>
      </motion.div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
  </section>
);

// --- [컴포넌트] 메인 콘텐츠 카드 뷰어 ---
const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (type === '클래스') {
        const { data } = await supabase.from('class_infos').select('*').order('sub_class');
        setItems(data || []);
      } else {
        const { data } = await supabase.from('contents').select('*').eq('category', type).order('created_at');
        setItems(data || []);
      }
    };
    fetchData();
  }, [type]);

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
      {items.map(item => (
        <motion.div 
          whileHover={{ y: -10 }} 
          key={item.id} 
          onClick={() => setSelectedItem(item)}
          className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black aspect-[4/5] cursor-pointer shadow-2xl"
        >
          <img src={item.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-left">
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

// --- [컴포넌트] 상세 정보 팝업 ---
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative text-left">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={32}/></button>
        <div className="flex gap-8 mb-10">
          <img src={item.image_url} className="w-32 h-44 object-cover rounded-2xl border border-white/10 shadow-2xl" />
          <div>
            <h2 className="text-4xl font-black italic uppercase text-purple-500 mb-2">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest italic">{type} 상세 브리핑</p>
          </div>
        </div>
        {type === '레이드' && (
          <div className="flex gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {[1,2,3].map(g=><button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black transition-all ${gate===g?'bg-purple-600 shadow-lg shadow-purple-600/20':'text-gray-500'}`}>{g}관</button>)}
            </div>
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5">
              {['노말','하드','나이트메어'].map(d=><button key={d} onClick={()=>setDiff(d)} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${diff===d?'bg-white text-black':'text-gray-500'}`}>{d}</button>)}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {type === '클래스' ? (
            <>
              <DetailBox label="직업 각인" value={item.engraving_job} />
              <DetailBox label="공용 각인" value={item.engraving_common?.join(', ')} />
              <DetailBox label="아크 그리드" value={item.ark_passive?.join(' / ')} />
              <DetailBox label="카운터 스킬" value={item.counter_skills?.join(', ')} span={3} />
            </>
          ) : (
            details ? (
              <>
                <DetailBox label="체력(HP)" value={details.hp} />
                <DetailBox label="계열" value={details.element_type} />
                <DetailBox label="속성" value={details.attribute} />
                <DetailBox label="딜러 카드" value={details.dealer_cards} span={3} />
                <DetailBox label="서포터 카드" value={details.support_cards} span={3} />
                <DetailBox label="클리어 골드" value={`${details.clear_gold?.toLocaleString()} G`} highlight span={3} />
              </>
            ) : <div className="col-span-3 py-20 text-center text-gray-700 font-black italic uppercase tracking-widest">데이터가 존재하지 않습니다.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- [컴포넌트] 관리자 패널 ---
const AdminPanel = () => {
  const [adminTab, setAdminTab] = useState('레이드');
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-8 text-left">
      <div className="flex items-center gap-4 mb-10"><Settings className="text-purple-500" size={32} /><h2 className="text-4xl font-black italic uppercase tracking-tighter">Admin Console</h2></div>
      <div className="flex gap-6 mb-10 overflow-x-auto pb-2">
        {['레이드', '가디언 토벌', '클래스'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-black uppercase transition-all ${adminTab === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{t}</button>
        ))}
      </div>
      <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
        {adminTab === '클래스' ? <ClassEditor /> : <ContentEditor category={adminTab} />}
      </div>
    </motion.div>
  );
};

const ContentEditor = ({ category }: { category: string }) => {
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [form, setForm] = useState({ name: '', image_url: '', hp: '', element: '', attribute: '', d_card: '', s_card: '', gold: 0 });

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력하세요.");
    const { data: content, error: cErr } = await supabase.from('contents').upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' }).select().single();
    if (cErr) return alert(cErr.message);

    const { error: dErr } = await supabase.from('content_details').upsert({
      content_id: content.id, difficulty: category === '레이드' ? difficulty : null, gate_num: category === '레이드' ? selectedGate : 0,
      hp: form.hp, element_type: form.element, attribute: form.attribute, dealer_cards: form.d_card, support_cards: form.s_card, clear_gold: form.gold
    }, { onConflict: 'content_id, difficulty, gate_num' });

    if (dErr) alert(dErr.message); else alert("정보가 성공적으로 반영되었습니다.");
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminInput label="콘텐츠 명" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} />
        <AdminInput label="이미지 URL" value={form.image_url} onChange={(v:any)=>setForm({...form, image_url:v})} />
      </div>
      {category === '레이드' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Gate Selection</label>
            <div className="flex gap-2">{[1, 2, 3].map(g => (<button key={g} onClick={()=>setSelectedGate(g)} className={`flex-1 py-4 rounded-2xl font-black ${selectedGate===g?'bg-purple-600 shadow-lg':'bg-black text-gray-500'}`}>{g} Gate</button>))}</div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Difficulty</label>
            <div className="flex gap-2">{['노말','하드','나이트메어'].map(d => (<button key={d} onClick={()=>setDifficulty(d)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] ${difficulty===d?'bg-white text-black':'bg-black text-gray-500'}`}>{d}</button>))}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminInput label="HP" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} />
        <AdminInput label="계열" value={form.element} onChange={(v:any)=>setForm({...form, element:v})} />
        <AdminInput label="속성" value={form.attribute} onChange={(v:any)=>setForm({...form, attribute:v})} />
      </div>
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-purple-500 transition-all"><Save size={20}/> Update Content</button>
    </div>
  );
};

const ClassEditor = () => {
  const [form, setForm] = useState({ root: '', sub: '', eng: '', link: '' });
  const [comm, setComm] = useState<string[]>([]);
  const [ark, setArk] = useState<string[]>([]);
  const [cnt, setCnt] = useState<string[]>([]);

  const handleSave = async () => {
    const { error } = await supabase.from('class_infos').upsert({ root_class: form.root, sub_class: form.sub, engraving_job: form.eng, engraving_common: comm, ark_passive: ark, counter_skills: cnt, skill_code_link: form.link }, { onConflict: 'sub_class' });
    if (error) alert(error.message); else alert("클래스 정보가 저장되었습니다.");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <AdminInput label="뿌리 클래스" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
        <AdminInput label="전직 클래스" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
      </div>
      <DynamicField label="공용 각인" list={comm} set={setComm} max={5} />
      <DynamicField label="아크 그리드" list={ark} set={setArk} max={6} />
      <DynamicField label="카운터 스킬" list={cnt} set={setCnt} max={3} />
      <AdminInput label="스킬코드 링크" value={form.link} onChange={(v:any)=>setForm({...form, link:v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest"><Save size={20}/> Save Class Data</button>
    </div>
  );
};

// --- [컴포넌트] 레이드 캘린더 (기존 기능 완전 보존) ---
const RaidCalendar = ({ user }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetchData(); }, [currentDate]);

  const fetchData = async () => {
    const { data: rData } = await supabase.from('raid_schedules').select('*');
    const { data: pData } = await supabase.from('raid_participants').select('*');
    if (rData) setRaids(rData);
    if (pData) setParticipants(pData);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <section id="calendar" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5 text-left">
          <div className="p-4 bg-purple-600/10 rounded-2xl border border-purple-500/20 shadow-lg text-purple-500"><CalendarIcon size={28} /></div>
          <div><h2 className="text-4xl font-black italic tracking-tighter uppercase font-mono">{year}. {String(month + 1).padStart(2, '0')}</h2></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} className="p-3 bg-white/5 rounded-xl border border-white/10 transition-all"><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} className="p-3 bg-white/5 rounded-xl border border-white/10 transition-all"><ChevronRight/></button>
        </div>
      </div>
      <div className="bg-[#0f0f0f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5 text-[10px] font-black tracking-widest text-gray-500 p-5 uppercase italic text-center">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[1px] bg-white/5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={i} className="bg-[#0a0a0a] min-h-[180px]" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i+1).padStart(2, '0')}`;
            const dayRaids = raids.filter(r => r.raid_date === dateStr);
            return (
              <div key={i} className="bg-[#0a0a0a] min-h-[180px] p-5 group relative hover:bg-white/[0.02] transition-all text-left">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-xs font-black text-gray-700 group-hover:text-purple-500 transition-colors">{i+1}</span>
                  <button onClick={() => { setSelectedDate(dateStr); setIsModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 bg-purple-600 text-white rounded-lg transition-all"><Plus size={18}/></button>
                </div>
                <div className="space-y-2">
                  {dayRaids.map(raid => (
                    <div key={raid.id} className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl cursor-pointer hover:border-purple-500/60 transition-all shadow-xl">
                      <div className="text-[8px] font-black text-purple-400 uppercase mb-1">{raid.difficulty} // {raid.raid_time}</div>
                      <div className="text-[10px] font-black truncate">{raid.raid_name}</div>
                    </div>
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

// --- [헬퍼 컴포넌트] ---
const DetailBox = ({ label, value, span=1, highlight=false }: any) => (
  <div className={`p-6 bg-white/5 rounded-2xl border border-white/5 ${span > 1 ? 'md:col-span-'+span : ''}`}>
    <label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">{label}</label>
    <div className={`text-lg font-black ${highlight ? 'text-yellow-400' : 'text-gray-200'}`}>{value || '-'}</div>
  </div>
);

const AdminInput = ({ label, ...props }: any) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 font-bold" {...props} />
  </div>
);

const DynamicField = ({ label, list, set, max }: any) => (
  <div className="space-y-4 text-left">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{label}</label>
      <button onClick={() => list.length < max && set([...list, ""])} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {list.map((v:any, i:number) => (
        <input key={i} className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" value={v} onChange={e => { const newList = [...list]; newList[i] = e.target.value; set(newList); }} />
      ))}
    </div>
  </div>
);

const CreateRaidModal = ({ date, onRefresh, onClose }: any) => {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '오후 8:00' });
  const save = async () => {
    const { error } = await supabase.from('raid_schedules').insert([{ ...form, raid_date: date }]);
    if (error) alert(error.message); else { onRefresh(); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative">
        <h3 className="text-3xl font-black text-purple-500 italic mb-10 tracking-tighter uppercase underline decoration-purple-600/30 underline-offset-8">New Raid Event</h3>
        <div className="space-y-5">
          <AdminInput label="Raid Name" value={form.raid_name} onChange={(v:any)=>setForm({...form, raid_name:v})} />
          <AdminInput label="Time" value={form.raid_time} onChange={(v:any)=>setForm({...form, raid_time:v})} />
          <button onClick={save} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest mt-4">Confirm</button>
          <button onClick={onClose} className="w-full text-gray-600 text-[10px] font-black mt-4 uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const Auth = ({ mode, setMode }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e: any) => {
    e.preventDefault();
    const { error } = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message); else { window.location.reload(); }
  };
  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <div className="p-12 rounded-[4rem] bg-[#0f0f0f] border border-white/10 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
        <h2 className="text-5xl font-black italic mb-12 tracking-tighter uppercase">{mode}</h2>
        <form onSubmit={handleAuth} className="space-y-5">
          <input type="email" placeholder="E-MAIL" className="w-full bg-black border border-white/10 p-5 rounded-3xl font-black focus:border-purple-500 outline-none" onChange={e=>setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-5 rounded-3xl font-black focus:border-purple-500 outline-none" onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-[0.3em] mt-6">Proceed</button>
        </form>
        <button onClick={()=>setMode(mode==='login'?'signup':'login')} className="mt-8 text-[10px] font-black text-gray-600 hover:text-white uppercase transition-all">Switch to {mode==='login'?'signup':'login'}</button>
      </div>
    </div>
  );
};
