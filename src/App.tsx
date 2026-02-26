import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar as CalendarIcon, Plus, Users, X, Clock, ChevronDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [1] Supabase 설정 (본인의 정보를 입력하세요) ---
const S_URL = 'https://aekrfsnsruqqhzonogpl.supabase.co';
const S_KEY = 'YOUR_ANON_KEY_HERE'; 
const supabase = createClient(S_URL, S_KEY);

export default function App() {
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
        raid_time: formData.raid_time, // 시간 추가
        difficulty: formData.difficulty, 
        max_participants: 8 
      }
    ]);
    if (!error) {
      setIsRaidModalOpen(false);
      fetchData();
    } else {
      alert("생성 권한이 없거나 로그인이 필요합니다.");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold italic">INXX SYSTEM LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {/* 1. 네비게이션 */}
      <nav className="fixed top-0 w-full h-16 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-2 cursor-pointer">
          <Shield className="text-purple-500 w-6 h-6 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <span className="text-xl font-black tracking-tighter uppercase">INXX</span>
        </div>
        <div className="flex gap-6 text-sm font-bold text-gray-400">
          <a href="#" className="text-white">HOME</a>
          <a href="#calendar" className="hover:text-purple-400 transition-colors">CALENDAR</a>
          <button className="bg-purple-600 px-4 py-1.5 rounded-lg text-white">LOGIN</button>
        </div>
      </nav>

      {/* 2. 기존 메인 히로 섹션 (디자인 복구) */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50"></div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-4">
          <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-600">
            INXX GUILD
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-10">
            로스트아크 최정예 인원이 모인 길드, <br/>우리의 여정은 멈추지 않습니다.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#calendar" className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-purple-600/20">
              레이드 일정 보기
            </a>
          </div>
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500">
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* 3. 스크롤 내리면 나오는 캘린더 섹션 */}
      <section id="calendar" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-600/20 rounded-2xl border border-purple-500/30">
              <CalendarIcon className="text-purple-500 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">Raid Schedule</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">March 2026 // Weekly Update</p>
            </div>
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div className="rounded-[3rem] border border-white/5 overflow-hidden bg-[#0d0d0d] shadow-2xl">
          <div className="grid grid-cols-7 bg-white/[0.03] border-b border-white/5">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
              <div key={d} className={`p-5 text-center text-[10px] font-black tracking-widest ${i === 0 ? 'text-red-500/70' : i === 6 ? 'text-blue-500/70' : 'text-gray-500'}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[1px] bg-white/5">
            {Array.from({ length: 31 }).map((_, i) => {
              const dateStr = `2026-03-${String(i + 1).padStart(2, '0')}`;
              const dayRaids = raids.filter(r => r.raid_date === dateStr);
              return (
                <div key={i} className="min-h-[200px] bg-[#0a0a0a] p-4 hover:bg-white/[0.01] transition-all group relative">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-purple-400">{i + 1}</span>
                    <button 
                      onClick={() => { setSelectedDate(dateStr); setIsRaidModalOpen(true); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-purple-600 text-white rounded-lg transition-all"
                    >
                      <Plus size={14} />
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

      {/* 레이드 생성 모달 */}
      {isRaidModalOpen && (
        <CreateRaidModal onSave={handleAddRaid} onClose={() => setIsRaidModalOpen(false)} date={selectedDate} />
      )}
    </div>
  );
}

// --- 레이드 카드 컴포넌트 ---
function RaidCard({ raid, participants, onRefresh }: any) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsJoinModalOpen(true)}
        className="bg-[#151515] border border-white/10 p-3 rounded-2xl hover:border-purple-500/50 transition-all cursor-pointer shadow-xl"
      >
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${raid.difficulty === '나이트메어' ? 'bg-red-600' : 'bg-purple-600'} text-white uppercase`}>{raid.difficulty}</span>
          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
             {participants.length}/{raid.max_participants}
          </span>
        </div>
        <div className="text-[12px] font-bold text-gray-200 truncate mb-1">{raid.raid_name}</div>
        <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold">
          <Clock size={10} /> {raid.raid_time || "시간 미정"}
        </div>
      </div>

      {isJoinModalOpen && (
        <JoinRaidModal raid={raid} participants={participants} onSave={onRefresh} onClose={() => setIsJoinModalOpen(false)} />
      )}
    </>
  );
}

// --- 모달 컴포넌트 (생성 시 시간 선택 추가) ---
function CreateRaidModal({ onSave, onClose, date }: any) {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말', raid_time: '20:00' });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
        <h3 className="text-3xl font-black mb-8 text-purple-500 italic uppercase">CREATE EXPEDITION</h3>
        <div className="space-y-4">
          <input placeholder="레이드 명칭" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500" onChange={e => setForm({...form, raid_name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="bg-black border border-white/10 p-4 rounded-2xl outline-none" onChange={e => setForm({...form, difficulty: e.target.value})}>
              <option value="노말">노말</option>
              <option value="하드">하드</option>
              <option value="나이트메어">나이트메어</option>
            </select>
            <input type="time" defaultValue="20:00" className="bg-black border border-white/10 p-4 rounded-2xl outline-none text-white" onChange={e => setForm({...form, raid_time: e.target.value})} />
          </div>
          <button onClick={() => onSave(form)} className="w-full bg-purple-600 p-5 rounded-2xl font-black mt-6 hover:bg-purple-500 transition-all">레이드 생성</button>
          <button onClick={onClose} className="w-full text-gray-500 font-bold py-2">CANCEL</button>
        </div>
      </motion.div>
    </div>
  );
}

// 참여 모달 (JoinRaidModal)은 위와 동일한 로직...
function JoinRaidModal({ raid, participants, onSave, onClose }: any) {
  const [form, setForm] = useState({ character_name: '', position: '딜러', item_level: '', class_name: '', synergy: '' });

  const handleJoin = async () => {
    const { error } = await supabase.from('raid_participants').insert([{ 
      schedule_id: raid.id, ...form 
    }]);
    if (!error) { onSave(); onClose(); }
    else { alert("로그인이 필요합니다."); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl overflow-y-auto">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-2xl my-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-4xl font-black text-purple-500 italic uppercase tracking-tighter">{raid.raid_name}</h3>
            <div className="flex gap-3 text-gray-500 text-xs font-bold mt-2">
              <span className="bg-white/5 px-2 py-1 rounded">{raid.difficulty}</span>
              <span className="bg-white/5 px-2 py-1 rounded">{raid.raid_date}</span>
              <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded">{raid.raid_time}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10"><X size={24}/></button>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* 현황 */}
          <div>
            <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-6 flex items-center gap-2">
              <Users size={14}/> Participants ({participants.length}/{raid.max_participants})
            </h4>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {participants.map((p: any) => (
                <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-black text-purple-200">{p.character_name}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase">{p.class_name} // {p.item_level}</div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded ${p.position === '딜러' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{p.position}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 신청 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase mb-6 flex items-center gap-2">
              <Plus size={14}/> Join Expedition
            </h4>
            <input placeholder="지원 캐릭터명" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, character_name: e.target.value})} />
            <select className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none" onChange={e => setForm({...form, position: e.target.value as any})}>
              <option value="딜러">딜러</option>
              <option value="서포터">서포터</option>
            </select>
            <input placeholder="아이템 레벨" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, item_level: e.target.value})} />
            <input placeholder="클래스" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, class_name: e.target.value})} />
            <input placeholder="시너지" className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, synergy: e.target.value})} />
            <button onClick={handleJoin} className="w-full bg-purple-600 p-5 rounded-2xl font-black mt-4 hover:bg-purple-500 shadow-xl shadow-purple-600/20 active:scale-95 transition-all">참여 신청 완료</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
