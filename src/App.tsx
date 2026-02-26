import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Calendar as CalendarIcon, Plus, Users, X, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [1] Supabase 설정 (본인의 정보를 입력하세요) ---
const S_URL = 'https://aekrfsnsruqqhzonogpl.supabase.co';
const S_KEY = 'YOUR_ANON_KEY_HERE'; // 여기에 Supabase ANON KEY를 입력하세요
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

  // 레이드 생성 (SQL 구조 반영)
  const handleAddRaid = async (formData: any) => {
    const { error } = await supabase.from('raid_schedules').insert([
      { 
        raid_name: formData.raid_name, 
        raid_date: selectedDate, 
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
      {/* 네비게이션 */}
      <nav className="fixed top-0 w-full h-16 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center px-6 justify-between z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase font-mono">INXX</span>
        </div>
      </nav>

      <main className="pt-20 pb-20">
        {/* 상단 타이틀 섹션 */}
        <section className="h-[20vh] flex flex-col items-center justify-center text-center px-4">
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl md:text-6xl font-black mb-4 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            RAID CALENDAR
          </motion.h1>
        </section>

        {/* 월간 캘린더 섹션 (중단) */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <CalendarIcon className="text-purple-500 w-8 h-8" />
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">MARCH 2026</h2>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 overflow-hidden bg-[#0f0f0f] shadow-2xl">
            {/* 요일 */}
            <div className="grid grid-cols-7 bg-white/5 border-b border-white/10">
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
                <div key={d} className={`p-4 text-center text-[10px] font-black tracking-widest ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
              ))}
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-7 gap-[1px] bg-white/10">
              {Array.from({ length: 31 }).map((_, i) => {
                const dateStr = `2026-03-${String(i + 1).padStart(2, '0')}`;
                const dayRaids = raids.filter(r => r.raid_date === dateStr);
                return (
                  <div key={i} className="min-h-[180px] bg-[#0a0a0a] p-3 hover:bg-white/[0.02] transition-all group relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-600 group-hover:text-purple-400">{i + 1}</span>
                      <button 
                        onClick={() => { setSelectedDate(dateStr); setIsRaidModalOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-purple-600/20 text-purple-400 rounded-md hover:bg-purple-600 hover:text-white transition-all"
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
        </div>
      </main>

      {/* [모달 1] 레이드 생성 */}
      {isRaidModalOpen && (
        <CreateRaidModal onSave={handleAddRaid} onClose={() => setIsRaidModalOpen(false)} date={selectedDate} />
      )}
    </div>
  );
}

// --- 레이드 카드 컴포넌트 (참여 인원 표시 및 클릭 시 참여 모달) ---
function RaidCard({ raid, participants, onRefresh }: any) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleJoin = async (formData: any) => {
    const { error } = await supabase.from('raid_participants').insert([
      { 
        schedule_id: raid.id, 
        character_name: formData.character_name,
        position: formData.position,
        item_level: formData.item_level,
        class_name: formData.class_name,
        synergy: formData.synergy
      }
    ]);
    if (!error) {
      setIsJoinModalOpen(false);
      onRefresh();
    } else {
      alert("이미 신청했거나 로그인이 필요합니다.");
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsJoinModalOpen(true)}
        className="bg-purple-900/10 border border-purple-500/20 p-2.5 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer group/card"
      >
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-600 text-white uppercase">{raid.difficulty}</span>
          <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
            <Users size={10} /> {participants.length}/{raid.max_participants}
          </span>
        </div>
        <div className="text-[11px] font-bold text-gray-200 truncate leading-tight">{raid.raid_name}</div>
      </div>

      {isJoinModalOpen && (
        <JoinRaidModal raid={raid} participants={participants} onSave={handleJoin} onClose={() => setIsJoinModalOpen(false)} />
      )}
    </>
  );
}

// --- 하위 컴포넌트 (모달창 디자인) ---
function CreateRaidModal({ onSave, onClose, date }: any) {
  const [form, setForm] = useState({ raid_name: '', difficulty: '노말' });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md">
        <h3 className="text-2xl font-black mb-6 text-purple-500 italic uppercase">NEW EXPEDITION</h3>
        <div className="space-y-4">
          <input placeholder="레이드 명칭 (예: 카멘 3관)" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-purple-500" onChange={e => setForm({...form, raid_name: e.target.value})} />
          <select className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none appearance-none" onChange={e => setForm({...form, difficulty: e.target.value})}>
            <option value="노말">노말</option>
            <option value="하드">하드</option>
            <option value="나이트메어">나이트메어</option>
          </select>
          <div className="flex gap-3 pt-4">
            <button onClick={() => onSave(form)} className="flex-1 bg-purple-600 p-4 rounded-2xl font-black hover:bg-purple-500">생성</button>
            <button onClick={onClose} className="px-6 bg-white/5 rounded-2xl font-bold">취소</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function JoinRaidModal({ raid, participants, onSave, onClose }: any) {
  const [form, setForm] = useState({ character_name: '', position: '딜러', item_level: '', class_name: '', synergy: '' });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#111] border border-white/10 p-8 rounded-[3rem] w-full max-w-2xl my-auto shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black text-purple-500 italic tracking-tighter uppercase">{raid.raid_name}</h3>
            <p className="text-gray-500 font-bold mt-1 text-xs uppercase">{raid.difficulty} // {raid.raid_date}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={20}/></button>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* 현황 */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase">Participants ({participants.length}/{raid.max_participants})</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {participants.map((p: any) => (
                <div key={p.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-black text-purple-300">{p.character_name}</div>
                    <div className="text-[10px] text-gray-500">{p.class_name} · {p.item_level}</div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded ${p.position === '딜러' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{p.position}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 신청 폼 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-500 tracking-widest uppercase">Join Expedition</h4>
            <input placeholder="지원 캐릭터명" className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, character_name: e.target.value})} />
            <select className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm outline-none" onChange={e => setForm({...form, position: e.target.value as any})}>
              <option value="딜러">딜러</option>
              <option value="서포터">서포터</option>
            </select>
            <input placeholder="아이템 레벨" className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, item_level: e.target.value})} />
            <input placeholder="클래스 (예: 점화 소서리스)" className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, class_name: e.target.value})} />
            <input placeholder="보유 시너지" className="w-full bg-black border border-white/10 p-3 rounded-xl text-sm outline-none focus:border-purple-500" onChange={e => setForm({...form, synergy: e.target.value})} />
            <button onClick={() => onSave(form)} className="w-full bg-purple-600 p-4 rounded-xl font-black mt-4 hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95 transition-all">신청 완료</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
