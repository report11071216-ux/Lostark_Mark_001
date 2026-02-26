import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Plus, X, Clock, Settings, Save, ChevronRight, 
  Link as LinkIcon, Trash2, Calendar as CalendarIcon, 
  ChevronLeft, Users, Image as ImageIcon, Info
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
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold italic">INXX LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} profile={profile} onLogout={() => { supabase.auth.signOut(); setActiveTab('home'); }} />
      
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <div key="home">
              <Hero title="INXX GUILD" desc="로스트아크 콘텐츠 정보 시스템" />
              <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-center gap-12 border-b border-white/5 pb-6">
                {['레이드', '가디언 토벌', '클래스'].map(t => (
                  <button key={t} onClick={() => setContentView(t)} className={`text-xl font-black italic uppercase ${contentView === t ? 'text-purple-500 underline underline-offset-8' : 'text-gray-600'}`}>{t}</button>
                ))}
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

// --- [신규] 관리자 패널: DB 저장 로직 포함 ---
const AdminPanel = () => {
  const [adminTab, setAdminTab] = useState('레이드');
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-6xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-10"><Settings className="text-purple-500" size={32} /><h2 className="text-4xl font-black italic uppercase">Admin Console</h2></div>
      <div className="flex gap-4 mb-10 overflow-x-auto">
        {['레이드', '가디언 토벌', '클래스'].map(t => (
          <button key={t} onClick={() => setAdminTab(t)} className={`px-6 py-2 rounded-full text-xs font-black uppercase ${adminTab === t ? 'bg-purple-600' : 'bg-white/5 text-gray-500'}`}>{t}</button>
        ))}
      </div>
      <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10">
        {adminTab === '클래스' ? <ClassEditor /> : <ContentEditor category={adminTab} />}
      </div>
    </motion.div>
  );
};

// --- [수정] 레이드 & 가디언 에디터: 이미지 URL 및 DB 연동 ---
const ContentEditor = ({ category }: { category: string }) => {
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState('노말');
  const [form, setForm] = useState({ name: '', image_url: '', hp: '', element: '', attribute: '', d_card: '', s_card: '', gold: 0 });

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력해주세요.");
    // 1. 콘텐츠 기본 정보 저장/업데이트
    const { data: content, error: cErr } = await supabase.from('contents').upsert({ name: form.name, category, image_url: form.image_url }, { onConflict: 'name' }).select().single();
    if (cErr) return alert("콘텐츠 저장 실패: " + cErr.message);

    // 2. 상세 정보(관문/난이도별) 저장
    const { error: dErr } = await supabase.from('content_details').upsert({
      content_id: content.id,
      difficulty: category === '레이드' ? difficulty : null,
      gate_num: category === '레이드' ? selectedGate : 0,
      hp: form.hp, element_type: form.element, attribute: form.attribute,
      dealer_cards: form.d_card, support_cards: form.s_card, clear_gold: form.gold
    }, { onConflict: 'content_id, difficulty, gate_num' });

    if (dErr) alert("상세 정보 저장 실패: " + dErr.message);
    else alert(`${form.name} 정보가 반영되었습니다!`);
  };

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminInput label="콘텐츠 명" placeholder="예: 에키드나" value={form.name} onChange={(v:any)=>setForm({...form, name:v})} />
        <AdminInput label="이미지 URL" placeholder="https://..." value={form.image_url} onChange={(v:any)=>setForm({...form, image_url:v})} />
      </div>
      {category === '레이드' && (
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gate Selection</label>
            <div className="flex gap-2">{[1, 2, 3].map(g => (<button key={g} onClick={()=>setSelectedGate(g)} className={`flex-1 py-3 rounded-xl font-bold ${selectedGate===g?'bg-purple-600':'bg-black'}`}>{g}관</button>))}</div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Difficulty</label>
            <div className="flex gap-2">{['노말','하드','나이트메어'].map(d => (<button key={d} onClick={()=>setDifficulty(d)} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${difficulty===d?'bg-white text-black':'bg-black text-gray-500'}`}>{d}</button>))}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminInput label="HP" value={form.hp} onChange={(v:any)=>setForm({...form, hp:v})} />
        <AdminInput label="계열" value={form.element} onChange={(v:any)=>setForm({...form, element:v})} />
        <AdminInput label="속성" value={form.attribute} onChange={(v:any)=>setForm({...form, attribute:v})} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminInput label="딜러 카드" value={form.d_card} onChange={(v:any)=>setForm({...form, d_card:v})} />
        <AdminInput label="서포터 카드" value={form.s_card} onChange={(v:any)=>setForm({...form, s_card:v})} />
      </div>
      <AdminInput label="클리어 골드 (관문당)" type="number" value={form.gold} onChange={(v:any)=>setForm({...form, gold:v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500"><Save size={20}/> 반영하기</button>
    </div>
  );
};

// --- [수정] 클래스 에디터: 배열 데이터 저장 로직 추가 ---
const ClassEditor = () => {
  const [form, setForm] = useState({ root: '', sub: '', engraving: '', link: '' });
  const [common, setCommon] = useState<string[]>([]);
  const [ark, setArk] = useState<string[]>([]);
  const [counters, setCounters] = useState<string[]>([]);

  const handleSave = async () => {
    const { error } = await supabase.from('class_infos').upsert({
      root_class: form.root, sub_class: form.sub, engraving_job: form.engraving,
      engraving_common: common, ark_passive: ark, counter_skills: counters, skill_code_link: form.link
    }, { onConflict: 'sub_class' });
    if (error) alert(error.message); else alert("클래스 정보 저장 완료!");
  };

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-2 gap-6">
        <AdminInput label="뿌리 클래스" value={form.root} onChange={(v:any)=>setForm({...form, root:v})} />
        <AdminInput label="전직 클래스" value={form.sub} onChange={(v:any)=>setForm({...form, sub:v})} />
      </div>
      <DynamicField label="공용 각인 (최대 5)" list={common} set={setCommon} max={5} />
      <DynamicField label="아크 그리드 (최대 6)" list={ark} set={setArk} max={6} />
      <DynamicField label="카운터 스킬 (최대 3)" list={counters} set={setCounters} max={3} />
      <AdminInput label="스킬코드 링크" value={form.link} onChange={(v:any)=>setForm({...form, link:v})} />
      <button onClick={handleSave} className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase"><Save size={20}/> 클래스 데이터 반영</button>
    </div>
  );
};

// --- [수정] 메인 뷰어: DB 데이터 기반으로 카드 렌더링 & 클릭 이벤트 ---
const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const fetchContents = async () => {
      if (type === '클래스') {
        const { data } = await supabase.from('class_infos').select('*');
        setItems(data || []);
      } else {
        const { data } = await supabase.from('contents').select('*').eq('category', type);
        setItems(data || []);
      }
    };
    fetchContents();
  }, [type]);

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
      {items.map(item => (
        <motion.div whileHover={{y:-10}} key={item.id} onClick={()=>setSelectedItem(item)} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black aspect-[4/5] cursor-pointer">
          <img src={item.image_url || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-left">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2 block">{type}</span>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{item.name || item.sub_class}</h3>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase bg-white text-black px-6 py-3 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all">VIEW DETAILS <ChevronRight size={14}/></button>
          </div>
        </motion.div>
      ))}
      <AnimatePresence>
        {selectedItem && (
          <DetailPopup 
            item={selectedItem} 
            type={type} 
            onClose={()=>setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// --- [신규] 상세 정보 팝업: 관문/난이도별 데이터 실시간 전환 ---
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
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={32}/></button>
        
        <div className="flex gap-8 mb-10">
          <img src={item.image_url || item.img} className="w-32 h-44 object-cover rounded-2xl border border-white/10 shadow-2xl" />
          <div>
            <h2 className="text-4xl font-black italic uppercase text-purple-500 mb-2">{item.name || item.sub_class}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest">{type} 정보 // {item.root_class || '콘텐츠 상세'}</p>
          </div>
        </div>

        {type === '레이드' && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl">{[1,2,3].map(g=><button key={g} onClick={()=>setGate(g)} className={`px-6 py-2 rounded-lg font-black ${gate===g?'bg-purple-600':'text-gray-500'}`}>{g}관문</button>)}</div>
            <div className="flex gap-2 p-1 bg-black rounded-xl">{['노말','하드','나이트메어'].map(d=><button key={d} onClick={()=>setDiff(d)} className={`px-6 py-2 rounded-lg font-black text-xs ${diff===d?'bg-white text-black':'text-gray-500'}`}>{d}</button>)}</div>
          </div>
        )}

        {type === '클래스' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <DetailBox label="직업 각인" value={item.engraving_job} />
            <DetailBox label="공용 각인" value={item.engraving_common?.join(', ')} />
            <DetailBox label="아크 그리드" value={item.ark_passive?.join(' / ')} />
            <DetailBox label="카운터 스킬" value={item.counter_skills?.join(', ')} />
            {item.skill_code_link && <a href={item.skill_code_link} target="_blank" className="col-span-2 p-6 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 font-black"><LinkIcon size={20}/> 스킬코드 확인하기 (외부 링크)</a>}
          </div>
        ) : (
          details ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <DetailBox label="보스 HP" value={details.hp} />
              <DetailBox label="계열" value={details.element_type} />
              <DetailBox label="속성" value={details.attribute} />
              <DetailBox label="딜러 추천 카드" value={details.dealer_cards} span={2} />
              <DetailBox label="서포터 추천 카드" value={details.support_cards} span={2} />
              <DetailBox label="클리어 골드" value={`${details.clear_gold?.toLocaleString()} G`} highlight />
            </div>
          ) : <div className="py-20 text-center text-gray-600 font-black italic uppercase tracking-widest">등록된 상세 정보가 없습니다.</div>
        )}
      </div>
    </motion.div>
  );
};

// --- 유틸리티 컴포넌트 ---
const AdminInput = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 font-bold" {...props} />
  </div>
);

const DetailBox = ({ label, value, span=1, highlight=false }: any) => (
  <div className={`p-6 bg-white/5 rounded-2xl border border-white/5 ${span > 1 ? 'md:col-span-'+span : ''}`}>
    <label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block">{label}</label>
    <div className={`text-lg font-black ${highlight ? 'text-yellow-400' : 'text-gray-200'}`}>{value || '-'}</div>
  </div>
);

const DynamicField = ({ label, list, set, max }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{label}</label>
      <button onClick={() => list.length < max && set([...list, ""])} className="p-1 bg-purple-600 rounded-lg"><Plus size={16}/></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {list.map((v:any, i:number) => (
        <input key={i} className="bg-black border border-white/10 p-4 rounded-xl text-xs" value={v} onChange={e => {
          const newList = [...list]; newList[i] = e.target.value; set(newList);
        }} />
      ))}
    </div>
  </div>
);

// --- [보존] Hero, Navbar, Calendar 등 기존 컴포넌트 생략 (기존 코드 사용) ---
const Hero = ({ title, desc }: any) => (
  <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
    <div className="relative z-10 text-center">
      <h1 className="text-8xl font-black italic tracking-tighter uppercase font-mono mb-4">{title}</h1>
      <p className="text-gray-500 font-bold uppercase tracking-widest">{desc}</p>
    </div>
  </section>
);

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 h-16 flex items-center justify-between px-8">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}><Shield className="text-purple-600" /><span className="text-xl font-black uppercase italic">INXX</span></div>
    <div className="flex gap-8 items-center">
      {['home', 'posts', 'admin'].map(t => (
        (t !== 'admin' || profile?.role === 'admin') && <button key={t} onClick={() => setActiveTab(t)} className={`text-xs font-black uppercase ${activeTab === t ? 'text-purple-500' : 'text-gray-500'}`}>{t}</button>
      ))}
      {user ? <button onClick={onLogout} className="text-xs font-black text-gray-500 hover:text-red-400">LOGOUT</button> : <button onClick={() => setActiveTab('login')} className="text-xs font-black text-purple-500">LOGIN</button>}
    </div>
  </nav>
);

// 캘린더 컴포넌트는 이전 답변의 코드를 그대로 사용하세요. (분량 관계상 핵심 로직 위주로 재구성)
const RaidCalendar = ({ user }: any) => <div className="py-20 text-gray-800 uppercase font-black text-center border-t border-white/5">Calendar Module Integrated</div>;
const Auth = ({ mode, setMode }: any) => <div className="py-20 text-center uppercase font-black">Auth Module Integrated (Login/Signup)</div>;
