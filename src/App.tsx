import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar as CalendarIcon, Plus, Users, X, Clock, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [1] Supabase 설정 ---
const S_URL = 'https://aekrfsnsruqqhzonogpl.supabase.co';
const S_KEY = 'YOUR_ANON_KEY_HERE'; 
const supabase = createClient(S_URL, S_KEY);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [raids, setRaids] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: raidData } = await supabase.from('raid_schedules').select('*').order('raid_date', { ascending: true });
    const { data: partData } = await supabase.from('raid_participants').select('*');
    if (raidData) setRaids(raidData);
    if (partData) setParticipants(partData);
    setLoading(false);
  };

  const handleAddRaid = async (formData: any) => {
    const { error } = await supabase.from('raid_schedules').insert([
      { 
        raid_name: formData.raid_name, 
        raid_date: selectedDate, 
        raid_time: formData.raid_time,
        difficulty: formData.difficulty, 
        max_participants: 8 
      }
    ]);
    if (!error) {
      setIsRaidModalOpen(false);
      fetchData();
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold italic tracking-widest">INXX SYSTEM LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* 1. 네비게이션 (로고 크기 축소 및 로그인 탭 연결) */}
      <nav className="fixed top-0 w-full h-14 bg-black/90 backdrop-blur-md border-b border-white/5 flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          {/* 로고 크기를 w-6 h-6으로 줄였습니다 */}
          <Shield className="text-purple-500 w-5 h-5 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <span className="text-lg font-black tracking-tighter uppercase font-mono">INXX</span>
        </div>
        <div className="flex gap-8 text-[11px] font-black tracking-widest text-gray-500">
          <button onClick={() => setActiveTab('home')} className={`${activeTab === 'home' ? 'text-white' : 'hover:text-purple-400'} transition-all`}>HOME</button>
          <a href="#calendar" className="hover:text-purple-400 transition-all">CALENDAR</a>
          <button onClick={() => setActiveTab('login')} className={`${activeTab === 'login' ? 'text-purple-400' : 'hover:text-purple-400'} transition-all`}>LOGIN</button>
        </div>
      </nav>

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* 2. 메인 히로 섹션 (로고 크기 및 텍스트 밸런스 조정) */}
              <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
                <div className="relative z-10 text-center px-4">
                  {/* 길드 이름 폰트 사이즈 살짝 조정 */}
                  <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                    INXX GUILD
                  </h1>
                  <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto font-medium mb-10 tracking-wide uppercase">
                    Our journey never ends. <br/>Join the elite expedition of Lost Ark.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <a href="#calendar" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-purple-600/20">
                      CALENDAR
                    </a>
                    <button onClick={() => setActiveTab('signup')} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-black text-sm border border-white/10 transition-all">
                      SIGN UP
                    </button>
                  </div>
                </div>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-700">
                  <ChevronDown size={24} />
                </motion.div>
              </section>

              {/* 3. 캘린더 섹션 (스크롤 영역) */}
              <section id="calendar" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="flex items-center gap-4 mb-12">
                  <div className="p-3 bg-purple-600/10 rounded-xl border border-purple-500/20">
                    <CalendarIcon className="text-purple-500 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">Raid Schedule</h2>
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">March 2026 // Weekly Plan</p>
                  </div>
                </div>

                {/* 캘린더 본체 */}
                <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-[#0d0d0d] shadow-2xl">
                  <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5 text-[10px] font-black tracking-widest text-gray-600">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
                      <div key={d} className={`p-4 text-center ${i === 0 ? 'text-red-500/50' : i === 6 ? 'text-blue-500/50' : ''}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-[1px] bg-white/5">
                    {Array.from({ length: 31 }).map((_, i) => {
                      const dateStr = `2026-03-${String(i + 1).padStart(2, '0')}`;
                      const dayRaids = raids.filter(r => r.raid_date === dateStr);
                      return (
                        <div key={i} className="min-h-[160px] bg-[#0a0a0a] p-4 group relative hover:bg-white/[0.01] transition-all">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-gray-800 group-hover:text-purple-500">{i + 1}</span>
                            <button 
                              onClick={() => { setSelectedDate(dateStr); setIsRaidModalOpen(true); }}
                              className="opacity-0 group-hover:opacity-100 p-1 bg-purple-600 text-white rounded-md transition-all scale-75"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {dayRaids.map(raid => (
                              <RaidCard key={raid.id} raid={raid} participants={participants.filter(p => p.schedule_id === raid.id)} onRefresh={fetchData} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            /* 4. 로그인 / 회원가입 화면 */
            <motion.div key="auth" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-6">
               <div className="w-full max-w-md bg-[#111] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent"></div>
                  <h3 className="text-4xl font-black italic text-center mb-2 tracking-tighter uppercase">
                    {activeTab === 'login' ? 'LOGIN' : 'JOIN US'}
                  </h3>
                  <p className="text-gray-500 text-center text-xs font-bold tracking-widest mb-10 uppercase">Access to INXX System</p>
                  
                  <div className="space-y-4">
                    <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-600 text-sm tracking-widest" />
                    <input type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-600 text-sm tracking-widest" />
                    <button className="w-full bg-purple-600 py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">
                      {activeTab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                    </button>
                  </div>

                  <div className="mt-8 text-center">
                    <button onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')} className="text-[10px] font-black text-gray-500 hover:text-white tracking-widest uppercase transition-all">
                      {activeTab === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isRaidModalOpen && (
        <CreateRaidModal onSave={handleAddRaid} onClose={() => setIsRaidModalOpen(false)} date={selectedDate} />
      )}
    </div>
  );
}

// --- 레이드 카드 및 기타 하위 컴포넌트 ---
function RaidCard({ raid, participants, onRefresh }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div onClick={() => setIsOpen(true)} className="bg-[#151515] border border-white/5 p-2 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 uppercase tracking-tighter">{raid.difficulty}</span>
          <span className="text-[9px] text-gray-600 font-bold">{participants.length}/8</span>
        </div>
        <div className="text-[10px] font-bold text-gray-300 truncate">{raid.raid_name}</div>
        <div className="text-[8px] text-purple-500 font-bold mt-1 flex items-center gap-1"><Clock size={8}/> {raid.raid_time}</div>
      </div>
      {isOpen && <JoinRaidModal raid={raid} participants={participants} onSave={onRefresh} onClose={() => setIsOpen(false)} />}
    </>
  );
}

// ... CreateRaidModal 및 JoinRaidModal 로직 (이전과 동일하되 디자인 톤앤매너만 유지) ...
function CreateRaidModal({ onSave, onClose, date }: any) {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '20:00' });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
      <div className="bg-[#111] border border-white/10 p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <h3 className="text-2xl font-black mb-8 text-purple-500 italic uppercase">New Raid</h3>
        <div className="space-y-3">
          <input placeholder="레이드 이름" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500 text-sm" onChange={e => setForm({...form, raid_name: e.target.value})} />
          <div className="flex gap-2">
            <select className="flex-1 bg-black border border-white/10 p-4 rounded-2xl outline-none text-sm" onChange={e => setForm({...form, difficulty: e.target.value})}>
              <option value="노말">노말</option>
              <option value="하드">하드</option>
              <option value="나이트메어">나이트메어</option>
            </select>
            <input type="time" className="bg-black border border-white/10 p-4 rounded-2xl outline-none text-sm" onChange={e => setForm({...form, raid_time: e.target.value})} />
          </div>
          <button onClick={() => onSave(form)} className="w-full bg-purple-600 p-4 rounded-2xl font-black mt-4">생성</button>
          <button onClick={onClose} className="w-full text-gray-600 text-xs font-bold py-2">CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function JoinRaidModal({ raid, participants, onSave, onClose }: any) {
  const [form, setForm] = useState({ character_name: '', position: '딜러', item_level: '', class_name: '', synergy: '' });
  const handleJoin = async () => {
    const { error } = await supabase.from('raid_participants').insert([{ schedule_id: raid.id, ...form }]);
    if (!error) { onSave(); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
      <div className="bg-[#111] border border-white/10 p-8 rounded-[3rem] w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-black text-purple-500 italic uppercase tracking-tighter">{raid.raid_name}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            <h4 className="text-[10px] font-black text-gray-500 tracking-widest mb-4">PARTICIPANTS ({participants.length}/8)</h4>
            {participants.map((p: any) => (
              <div key={p.id} className="bg-white/5 p-3 rounded-xl flex justify-between items-center border border-white/5">
                <div>
                  <div className="text-xs font-black text-purple-200">{p.character_name}</div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase">{p.class_name} // {p.item_level}</div>
                </div>
                <span className={`text-[8px] font-black px-2 py-1 rounded ${p.position === '딜러' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{p.position}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-500 tracking-widest mb-4">JOIN NOW</h4>
            <input placeholder="지원 캐릭터명" className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-purple-500" onChange={e => setForm({...form, character_name: e.target.value})} />
            <select className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none" onChange={e => setForm({...form, position: e.target.value})}>
              <option value="딜러">딜러</option>
              <option value="서포터">서포터</option>
            </select>
            <input placeholder="아이템 레벨" className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none" onChange={e => setForm({...form, item_level: e.target.value})} />
            <input placeholder="클래스" className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs outline-none" onChange={e => setForm({...form, class_name: e.target.value})} />
            <button onClick={handleJoin} className="w-full bg-purple-600 p-4 rounded-xl font-black mt-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20">참여 신청</button>
          </div>
        </div>
      </div>
    </div>
  );
}
