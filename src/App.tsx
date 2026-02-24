/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Home, 
  FileText, 
  Settings, 
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  Clock,
  Calendar as CalendarIcon,
  UserPlus,
  UserMinus,
  Coins,
  ChevronLeft,
  ChevronRight,
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  Sword,
  Menu,
  X,
  Share2,
  Globe,
  MessageSquare,
  Search
} from 'lucide-react';

// --- Types ---
interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  sub_category?: string;
  author: string;
  created_at: string;
}

interface Comment {
  id: number;
  post_id: number;
  content: string;
  author: string;
  created_at: string;
}

interface Settings {
  guild_name: string;
  guild_description: string;
  primary_color: string;
  raid_info?: string;
  kazeros_info?: string;
  guardians_info?: string;
  classes_info?: string;
  grade_names?: string; // JSON string of string[]
}

interface Profile {
  id: string;
  nickname: string;
  grade: string;
  avatar_url?: string;
  can_manage_members?: boolean;
  can_manage_content?: boolean;
  can_manage_settings?: boolean;
  created_at: string;
}

interface GateInfo {
  hp: string;
  type: string;
  attribute: string;
  dealer_cards: string;
  supporter_cards: string;
  gold: string;
}

interface DifficultyInfo {
  gates: {
    [key: number]: GateInfo;
  };
}

interface RaidInfo {
  id: number;
  name: string;
  image: string;
  difficulties: {
    normal: DifficultyInfo;
    hard: DifficultyInfo;
    nightmare: DifficultyInfo;
  };
}

interface GuardianInfo {
  id: number;
  name: string;
  image: string;
  hp: string;
  type: string;
  attribute: string;
  dealer_cards: string;
  supporter_cards: string;
}

interface ClassInfo {
  id: number;
  name: string;
  image: string;
  root: string;
  className: string;
  classEngraving: string;
  commonEngravings: string[];
  arkGrid: string[];
  counterSkills: string[];
  skillCodeLink: string;
}

interface Notification {
  id: number;
  message: string;
  type: 'NEW_COMMENT' | 'INFO';
  postTitle?: string;
}

interface RaidParticipant {
  id: number;
  schedule_id: number;
  character_name: string;
  position: '딜러' | '서포터';
  item_level: string;
  class_name: string;
  synergy: string;
}

interface RaidSchedule {
  id: number;
  raid_name: string;
  date: string;
  time: string;
  difficulty: '노말' | '하드' | '나이트메어' | '헬';
  max_participants: number;
  participants: RaidParticipant[];
}

const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('jpg, png, webp 이미지만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();
        handleCommand('insertImage', data.url);
      } catch (err) {
        console.error('Upload failed', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageUpload(file);
        }
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden relative">
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
        <button onClick={() => handleCommand('bold')} className="p-2 hover:bg-white/10 rounded transition-colors" title="굵게"><Bold size={16} /></button>
        <button onClick={() => handleCommand('italic')} className="p-2 hover:bg-white/10 rounded transition-colors" title="기울임"><Italic size={16} /></button>
        <button onClick={() => {
          const url = prompt('링크 주소를 입력하세요:');
          if (url) handleCommand('createLink', url);
        }} className="p-2 hover:bg-white/10 rounded transition-colors" title="링크"><LinkIcon size={16} /></button>
        <label className="p-2 hover:bg-white/10 rounded transition-colors cursor-pointer" title="이미지 업로드">
          <ImageIcon size={16} />
          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }} />
        </label>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="p-4 min-h-[200px] focus:outline-none text-gray-200 rich-text-content"
        dangerouslySetInnerHTML={{ __html: value }}
      />
      {!value && placeholder && (
        <div className="absolute top-[60px] left-4 text-gray-500 pointer-events-none">{placeholder}</div>
      )}
    </div>
  );
};

const Calendar = ({ schedules, onAddRaid, onJoinRaid }: { schedules: RaidSchedule[], onAddRaid: (date: string) => void, onJoinRaid: (schedule: RaidSchedule) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-3xl p-8 border border-white/10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
            <CalendarIcon className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">레이드 일정</h2>
            <p className="text-gray-500 text-sm">{year}년 {month + 1}월</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 glass rounded-xl hover:bg-white/10 transition-all"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 glass rounded-xl hover:bg-white/10 transition-all"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest pb-4">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-32" />;
          const dateStr = formatDate(day);
          const daySchedules = schedules.filter(s => s.date === dateStr);
          
          return (
            <div key={day} className="h-32 glass rounded-2xl p-2 border border-white/5 relative group hover:border-primary/30 transition-all overflow-hidden">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold text-gray-400">{day}</span>
                <button 
                  onClick={() => onAddRaid(dateStr)}
                  className="w-6 h-6 bg-primary/20 text-primary rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {daySchedules.map(s => (
                  <div 
                    key={s.id} 
                    className="text-[10px] p-1.5 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/20 transition-all"
                    onClick={() => onJoinRaid(s)}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-primary truncate">{s.raid_name}</span>
                      <span className="text-[8px] text-gray-500">{s.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{s.difficulty}</span>
                      <span className="text-primary font-bold">{s.participants.length}/{s.max_participants}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Components ---

const NotificationToast = ({ notifications, removeNotification }: { notifications: Notification[], removeNotification: (id: number) => void }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[200] space-y-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="glass p-4 rounded-2xl border border-primary/30 shadow-2xl pointer-events-auto min-w-[300px] flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare className="text-primary" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">새 댓글 알림</span>
                <button onClick={() => removeNotification(notif.id)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm font-bold mb-1">{notif.postTitle}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{notif.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  user: any,
  profile: Profile | null,
  onLogout: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'posts', label: '게시판', icon: FileText },
    ...(profile?.grade === '마스터' || profile?.can_manage_members || profile?.can_manage_content || profile?.can_manage_settings ? [{ id: 'admin', label: '관리자', icon: LayoutDashboard }] : []),
    ...(user ? [
      { id: 'mypage', label: '마이페이지', icon: UserPlus },
    ] : [
      { id: 'login', label: '로그인', icon: Users },
      { id: 'signup', label: '회원가입', icon: UserPlus },
    ]),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center purple-glow">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter purple-text-glow">INXX</span>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? 'text-primary' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user && (
                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-red-400 transition-colors"
                >
                  로그아웃
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ 
  settings, 
  onRaidClick,
  onGuardianClick,
  onClassClick
}: { 
  settings: Settings, 
  onRaidClick: (raid: RaidInfo) => void,
  onGuardianClick: (guardian: GuardianInfo) => void,
  onClassClick: (cls: ClassInfo) => void
}) => {
  const [activeCategory, setActiveCategory] = useState<'raid' | 'guardian' | 'class'>('raid');
  
  const raids: RaidInfo[] = (() => {
    try {
      const data = settings.raid_info ? JSON.parse(settings.raid_info) : [];
      return data.map((raid: any) => {
        if (!raid.difficulties) {
          return {
            ...raid,
            difficulties: {
              normal: { gates: { 1: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 2: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 3: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' } } },
              hard: { gates: { 1: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 2: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 3: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' } } },
              nightmare: { gates: { 1: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 2: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' }, 3: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' } } }
            }
          };
        }
        return raid;
      });
    } catch (e) { return []; }
  })();

  const guardians: GuardianInfo[] = (() => {
    try { return settings.guardians_info ? JSON.parse(settings.guardians_info) : []; } catch (e) { return []; }
  })();

  const classes: ClassInfo[] = (() => {
    try {
      const data = settings.classes_info ? JSON.parse(settings.classes_info) : [];
      return data.map((cls: any) => ({
        ...cls,
        commonEngravings: cls.commonEngravings || [cls.commonEngraving || '-'],
        arkGrid: cls.arkGrid && Array.isArray(cls.arkGrid) ? cls.arkGrid : [cls.arkGrid || '-'],
        counterSkills: cls.counterSkills && Array.isArray(cls.counterSkills) ? cls.counterSkills : [cls.counterSkill || '-']
      }));
    } catch (e) { return []; }
  })();

  const categories = [
    { id: 'raid', label: '레이드' },
    { id: 'guardian', label: '가디언 토벌' },
    { id: 'class', label: '클래스' },
  ];

  return (
    <div className="space-y-0">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/lostark/1920/1080?blur=2" 
            className="w-full h-full object-cover opacity-20"
            alt="Background"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/0 via-dark/50 to-dark"></div>
          <div className="absolute inset-0 grid-pattern opacity-50"></div>
          
          {/* Animated Blobs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 purple-glow"
              >
                <Shield className="text-primary w-8 h-8" />
              </motion.div>
            </div>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4 border border-primary/20">
              LOST ARK GUILD
            </span>
            <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tighter leading-none">
              {settings.guild_name}
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              {settings.guild_description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Info Grid Section */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-12 text-center">
          <div className="flex justify-center gap-4 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white purple-glow' 
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {categories.find(c => c.id === activeCategory)?.label} 정보
          </h2>
          <p className="text-gray-500">이미지를 클릭하여 상세 정보를 확인하세요.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {activeCategory === 'raid' && raids.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-3xl glass border border-white/10"
              onClick={() => onRaidClick(item)}
            >
              <img 
                src={item.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-tighter">
                  View Details <ChevronRight size={12} />
                </div>
              </div>
            </motion.div>
          ))}

          {activeCategory === 'guardian' && guardians.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-3xl glass border border-white/10"
              onClick={() => onGuardianClick(item)}
            >
              <img 
                src={item.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-tighter">
                  View Details <ChevronRight size={12} />
                </div>
              </div>
            </motion.div>
          ))}

          {activeCategory === 'class' && classes.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group cursor-pointer aspect-square overflow-hidden rounded-3xl glass border border-white/10"
              onClick={() => onClassClick(item)}
            >
              <img 
                src={item.image} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-tighter">
                  View Details <ChevronRight size={12} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const SignUp = ({ onSwitch }: { onSwitch: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname }
        }
      });

      if (error) throw error;
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { id: data.user.id, nickname, grade: '신입' }
          ]);
        if (profileError) throw profileError;
        alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold">회원가입</h2>
          <p className="text-gray-500 mt-2">INXX 길드의 일원이 되어보세요.</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">이메일</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">비밀번호</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">닉네임</label>
            <input 
              type="text" 
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="길드에서 사용할 닉네임" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all purple-glow mt-4 disabled:opacity-50"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요? <button type="button" onClick={onSwitch} className="text-primary font-bold hover:underline">로그인</button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

const Login = ({ onSwitch }: { onSwitch: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase가 설정되지 않았습니다. 환경 변수를 환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 확인해주세요.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border border-white/10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-primary w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold">로그인</h2>
          <p className="text-gray-500 mt-2">길드 웹사이트에 오신 것을 환영합니다.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">이메일</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">비밀번호</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all purple-glow mt-4 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            계정이 없으신가요? <button type="button" onClick={onSwitch} className="text-primary font-bold hover:underline">회원가입</button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

const MyPage = ({ profile }: { profile: Profile | null }) => {
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto py-32 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-3xl p-8 border border-white/10 text-center"
        >
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/30">
            <span className="text-4xl font-bold text-primary">{profile.nickname[0]}</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{profile.nickname}</h2>
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold border border-primary/30">
            {profile.grade}
          </span>
          <div className="mt-8 pt-8 border-t border-white/5 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">가입일</span>
              <span className="text-gray-300">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 space-y-6"
        >
          <div className="glass rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6">활동 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-gray-500 text-xs font-bold uppercase block mb-2">작성한 게시글</span>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-gray-500 text-xs font-bold uppercase block mb-2">작성한 댓글</span>
                <span className="text-2xl font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6">최근 활동</h3>
            <p className="text-gray-500 text-center py-8">최근 활동 내역이 없습니다.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const PostList = ({ posts, onSelectPost }: { posts: Post[], onSelectPost: (post: Post) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <motion.div 
          key={post.id}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group cursor-pointer"
          onClick={() => onSelectPost(post)}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
              {post.category}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
            {post.content}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <Users size={12} /> {post.author}
            </span>
            <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
              자세히 보기 <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const MemberList = ({ members }: { members: Profile[] }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {members.map(member => (
        <motion.div 
          key={member.id}
          whileHover={{ y: -5 }}
          className="glass p-4 rounded-2xl border border-white/5 text-center"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary/30">
            <span className="text-lg font-bold text-primary">{member.nickname[0]}</span>
          </div>
          <h4 className="font-bold text-sm truncate mb-1">{member.nickname}</h4>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/20">
            {member.grade}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

const AdminDashboard = ({ 
  posts, 
  settings, 
  members,
  profile,
  onAddPost, 
  onDeletePost, 
  onUpdateSettings,
  onUpdateMember,
  onDeleteMember,
  onFetchMembers
}: { 
  posts: Post[], 
  settings: Settings,
  members: Profile[],
  profile: Profile | null,
  onAddPost: (post: Partial<Post>) => void,
  onDeletePost: (id: number) => void,
  onUpdateSettings: (settings: Settings) => void,
  onUpdateMember: (id: string, updates: Partial<Profile>) => void,
  onDeleteMember: (id: string) => void,
  onFetchMembers: () => void
}) => {
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '공지', sub_category: '' });
  const [localSettings, setLocalSettings] = useState(settings);
  
  const canManageMembers = profile?.grade === '마스터' || profile?.can_manage_members;
  const canManageContent = profile?.grade === '마스터' || profile?.can_manage_content;
  const canManageSettings = profile?.grade === '마스터' || profile?.can_manage_settings;

  const [activeTab, setActiveTab] = useState<'raid' | 'guardian' | 'class' | 'members'>(
    canManageContent ? 'raid' : 'members'
  );
  
  useEffect(() => {
    if (activeTab === 'members') onFetchMembers();
  }, [activeTab]);

  const gradeNames = JSON.parse(localSettings.grade_names || '[]');
  
  const [raids, setRaids] = useState<RaidInfo[]>(() => {
    try {
      const data = settings.raid_info ? JSON.parse(settings.raid_info) : (settings.kazeros_info ? JSON.parse(settings.kazeros_info) : []);
      // Simple migration/validation
      return data.map((raid: any) => {
        if (!raid.difficulties) {
          const defaultGates = raid.gates || {
            1: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
            2: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
            3: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
          };
          // Ensure gold is in gates
          Object.keys(defaultGates).forEach(k => {
            if (!defaultGates[k].gold) defaultGates[k].gold = '0';
          });

          return {
            ...raid,
            difficulties: {
              normal: { gates: defaultGates },
              hard: { gates: defaultGates },
              nightmare: { gates: defaultGates }
            }
          };
        }
        // Migration for gold from difficulty to gates
        ['normal', 'hard', 'nightmare'].forEach(d => {
          if (raid.difficulties[d].gold !== undefined) {
            const gold = raid.difficulties[d].gold;
            Object.keys(raid.difficulties[d].gates).forEach(g => {
              if (!raid.difficulties[d].gates[g].gold) raid.difficulties[d].gates[g].gold = gold;
            });
            delete raid.difficulties[d].gold;
          }
        });
        return raid;
      });
    } catch (e) {
      return [];
    }
  });

  const [guardians, setGuardians] = useState<GuardianInfo[]>(() => {
    try {
      return settings.guardians_info ? JSON.parse(settings.guardians_info) : [];
    } catch (e) {
      return [];
    }
  });

  const [classes, setClasses] = useState<ClassInfo[]>(() => {
    try {
      const data = settings.classes_info ? JSON.parse(settings.classes_info) : [];
      return data.map((cls: any) => ({
        ...cls,
        commonEngravings: cls.commonEngravings || [cls.commonEngraving || '-'],
        arkGrid: cls.arkGrid && Array.isArray(cls.arkGrid) ? cls.arkGrid : [cls.arkGrid || '-'],
        counterSkills: cls.counterSkills && Array.isArray(cls.counterSkills) ? cls.counterSkills : [cls.counterSkill || '-']
      }));
    } catch (e) {
      return [];
    }
  });

  const [editingRaid, setEditingRaid] = useState<RaidInfo | null>(null);
  const [editingGuardian, setEditingGuardian] = useState<GuardianInfo | null>(null);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [activeGate, setActiveGate] = useState<number>(1);
  const [activeDifficulty, setActiveDifficulty] = useState<'normal' | 'hard' | 'nightmare'>('normal');

  const createDefaultDifficulty = (): DifficultyInfo => ({
    gates: {
      1: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
      2: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
      3: { hp: '-', type: '-', attribute: '-', dealer_cards: '-', supporter_cards: '-', gold: '0' },
    }
  });

  const addRaid = () => {
    const newRaid: RaidInfo = {
      id: Date.now(),
      name: '새 레이드',
      image: 'https://picsum.photos/seed/raid/400/400',
      difficulties: {
        normal: createDefaultDifficulty(),
        hard: createDefaultDifficulty(),
        nightmare: createDefaultDifficulty(),
      }
    };
    setRaids([...raids, newRaid]);
  };

  const addGuardian = () => {
    const newGuardian: GuardianInfo = {
      id: Date.now(),
      name: '새 가디언',
      image: 'https://picsum.photos/seed/guardian/400/400',
      hp: '-',
      type: '-',
      attribute: '-',
      dealer_cards: '-',
      supporter_cards: '-'
    };
    setGuardians([...guardians, newGuardian]);
  };

  const addClass = () => {
    const newClass: ClassInfo = {
      id: Date.now(),
      name: '새 클래스',
      image: 'https://picsum.photos/seed/class/400/400',
      root: '-',
      className: '-',
      classEngraving: '-',
      commonEngravings: ['-'],
      arkGrid: ['-'],
      counterSkills: ['-'],
      skillCodeLink: ''
    };
    setClasses([...classes, newClass]);
  };

  const saveRaid = (raid: RaidInfo) => {
    setRaids(raids.map(r => r.id === raid.id ? raid : r));
    setEditingRaid(null);
  };

  const saveGuardian = (guardian: GuardianInfo) => {
    setGuardians(guardians.map(g => g.id === guardian.id ? guardian : g));
    setEditingGuardian(null);
  };

  const saveClass = (cls: ClassInfo) => {
    setClasses(classes.map(c => c.id === cls.id ? cls : c));
    setEditingClass(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-24">
      <div className="flex items-center gap-3 mb-12">
        <LayoutDashboard className="text-primary" size={32} />
        <h2 className="text-3xl font-bold">관리자 대시보드</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          {canManageSettings && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings size={20} className="text-primary" />
                <h3 className="text-xl font-bold">기본 설정</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">길드명</label>
                  <input 
                    type="text" 
                    value={localSettings.guild_name}
                    onChange={(e) => setLocalSettings({...localSettings, guild_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">길드 설명</label>
                  <textarea 
                    value={localSettings.guild_description}
                    onChange={(e) => setLocalSettings({...localSettings, guild_description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 h-24 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">테마 컬러</label>
                  <input 
                    type="color" 
                    value={localSettings.primary_color} 
                    onChange={(e) => setLocalSettings({...localSettings, primary_color: e.target.value})} 
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-1 py-1 focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">등급 명칭 설정 (순서대로 입력, 쉼표로 구분)</label>
                  <input 
                    type="text" 
                    value={gradeNames.join(', ')} 
                    onChange={(e) => {
                      const newGrades = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                      setLocalSettings({...localSettings, grade_names: JSON.stringify(newGrades)});
                    }} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                    placeholder="신입, 길드원, 대리, 팀장, 임원, 부마스터, 마스터"
                  />
                </div>
                <button 
                  onClick={() => onUpdateSettings({
                    ...localSettings, 
                    raid_info: JSON.stringify(raids),
                    guardians_info: JSON.stringify(guardians),
                    classes_info: JSON.stringify(classes)
                  })}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all"
                >
                  전체 설정 저장
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sword size={20} className="text-primary" />
                <h3 className="text-xl font-bold">콘텐츠 관리</h3>
              </div>
            </div>
            
            <div className="flex gap-2 mb-6">
              {canManageContent && (
                <>
                  <button onClick={() => setActiveTab('raid')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'raid' ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>레이드</button>
                  <button onClick={() => setActiveTab('guardian')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'guardian' ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>가디언</button>
                  <button onClick={() => setActiveTab('class')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'class' ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>클래스</button>
                </>
              )}
              {canManageMembers && (
                <button onClick={() => setActiveTab('members')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'members' ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>멤버</button>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-400">목록</span>
              <button 
                onClick={() => {
                  if (activeTab === 'raid') addRaid();
                  else if (activeTab === 'guardian') addGuardian();
                  else addClass();
                }}
                className="p-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {activeTab === 'raid' && raids.map(item => (
                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingRaid(item)} className="p-2 text-gray-500 hover:text-primary transition-colors"><Settings size={16} /></button>
                    <button onClick={() => setRaids(raids.filter(k => k.id !== item.id))} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {activeTab === 'guardian' && guardians.map(item => (
                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingGuardian(item)} className="p-2 text-gray-500 hover:text-primary transition-colors"><Settings size={16} /></button>
                    <button onClick={() => setGuardians(guardians.filter(g => g.id !== item.id))} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {activeTab === 'class' && classes.map(item => (
                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingClass(item)} className="p-2 text-gray-500 hover:text-primary transition-colors"><Settings size={16} /></button>
                    <button onClick={() => setClasses(classes.filter(c => c.id !== item.id))} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {activeTab === 'members' && members.map(member => (
                <div key={member.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{member.nickname[0]}</span>
                      </div>
                      <span className="font-bold text-sm">{member.nickname}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                      {member.grade}
                    </span>
                    <select 
                      value={member.grade}
                      onChange={(e) => onUpdateMember(member.id, { grade: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-primary"
                    >
                      {gradeNames.map((g: string) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        if (confirm(`${member.nickname} 멤버를 추방하시겠습니까?`)) {
                          onDeleteMember(member.id);
                        }
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={member.can_manage_members} 
                        onChange={(e) => onUpdateMember(member.id, { can_manage_members: e.target.checked })}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary" 
                      />
                      <span className="text-[10px] text-gray-400">멤버 관리</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={member.can_manage_content} 
                        onChange={(e) => onUpdateMember(member.id, { can_manage_content: e.target.checked })}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary" 
                      />
                      <span className="text-[10px] text-gray-400">콘텐츠 관리</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={member.can_manage_settings} 
                        onChange={(e) => onUpdateMember(member.id, { can_manage_settings: e.target.checked })}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary" 
                      />
                      <span className="text-[10px] text-gray-400">설정 관리</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Modals */}
        {editingRaid && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl glass rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">레이드 수정</h3>
                <button onClick={() => setEditingRaid(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <img src={editingRaid.image} className="w-24 h-24 rounded-2xl object-cover border border-white/10" alt="" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Plus className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditingRaid({ ...editingRaid, image: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">레이드 이름</label>
                    <input type="text" value={editingRaid.name} onChange={(e) => setEditingRaid({...editingRaid, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>

                <div className="flex gap-2 border-b border-white/10 pb-4">
                  {(['normal', 'hard', 'nightmare'] as const).map(diff => (
                    <button 
                      key={diff} 
                      onClick={() => setActiveDifficulty(diff)} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${activeDifficulty === diff ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}
                    >
                      {diff === 'normal' ? '노말' : diff === 'hard' ? '하드' : '나이트메어'}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 border-b border-white/10 pb-4">
                  {[1, 2, 3].map(gate => (
                    <button key={gate} onClick={() => setActiveGate(gate)} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeGate === gate ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>{gate}관문</button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">클리어 골드</label>
                    <input 
                      type="text" 
                      value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].gold} 
                      onChange={(e) => setEditingRaid({
                        ...editingRaid, 
                        difficulties: {
                          ...editingRaid.difficulties, 
                          [activeDifficulty]: {
                            ...editingRaid.difficulties[activeDifficulty], 
                            gates: {
                              ...editingRaid.difficulties[activeDifficulty].gates, 
                              [activeGate]: {
                                ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                                gold: e.target.value
                              }
                            }
                          }
                        }
                      })} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">체력</label>
                    <input 
                      type="text" 
                      value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].hp} 
                      onChange={(e) => setEditingRaid({
                        ...editingRaid, 
                        difficulties: {
                          ...editingRaid.difficulties, 
                          [activeDifficulty]: {
                            ...editingRaid.difficulties[activeDifficulty], 
                            gates: {
                              ...editingRaid.difficulties[activeDifficulty].gates, 
                              [activeGate]: {
                                ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                                hp: e.target.value
                              }
                            }
                          }
                        }
                      })} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">계열</label>
                    <input 
                      type="text" 
                      value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].type} 
                      onChange={(e) => setEditingRaid({
                        ...editingRaid, 
                        difficulties: {
                          ...editingRaid.difficulties, 
                          [activeDifficulty]: {
                            ...editingRaid.difficulties[activeDifficulty], 
                            gates: {
                              ...editingRaid.difficulties[activeDifficulty].gates, 
                              [activeGate]: {
                                ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                                type: e.target.value
                              }
                            }
                          }
                        }
                      })} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">속성</label>
                  <input 
                    type="text" 
                    value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].attribute} 
                    onChange={(e) => setEditingRaid({
                      ...editingRaid, 
                      difficulties: {
                        ...editingRaid.difficulties, 
                        [activeDifficulty]: {
                          ...editingRaid.difficulties[activeDifficulty], 
                          gates: {
                            ...editingRaid.difficulties[activeDifficulty].gates, 
                            [activeGate]: {
                              ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                              attribute: e.target.value
                            }
                          }
                        }
                      }
                    })} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">딜러 카드</label>
                  <input 
                    type="text" 
                    value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].dealer_cards} 
                    onChange={(e) => setEditingRaid({
                      ...editingRaid, 
                      difficulties: {
                        ...editingRaid.difficulties, 
                        [activeDifficulty]: {
                          ...editingRaid.difficulties[activeDifficulty], 
                          gates: {
                            ...editingRaid.difficulties[activeDifficulty].gates, 
                            [activeGate]: {
                              ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                              dealer_cards: e.target.value
                            }
                          }
                        }
                      }
                    })} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">서포터 카드</label>
                  <input 
                    type="text" 
                    value={editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3].supporter_cards} 
                    onChange={(e) => setEditingRaid({
                      ...editingRaid, 
                      difficulties: {
                        ...editingRaid.difficulties, 
                        [activeDifficulty]: {
                          ...editingRaid.difficulties[activeDifficulty], 
                          gates: {
                            ...editingRaid.difficulties[activeDifficulty].gates, 
                            [activeGate]: {
                              ...editingRaid.difficulties[activeDifficulty].gates[activeGate as 1|2|3], 
                              supporter_cards: e.target.value
                            }
                          }
                        }
                      }
                    })} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                  />
                </div>

                <button onClick={() => saveRaid(editingRaid)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all mt-4">저장</button>
              </div>
            </div>
          </div>
        )}

        {editingGuardian && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl glass rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">가디언 정보 수정</h3>
                <button onClick={() => setEditingGuardian(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group">
                    <img src={editingGuardian.image} className="w-24 h-24 rounded-2xl object-cover border border-white/10" alt="" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Plus className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditingGuardian({ ...editingGuardian, image: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">가디언 이름</label>
                    <input type="text" value={editingGuardian.name} onChange={(e) => setEditingGuardian({...editingGuardian, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">체력</label>
                    <input type="text" value={editingGuardian.hp} onChange={(e) => setEditingGuardian({...editingGuardian, hp: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">계열</label>
                    <input type="text" value={editingGuardian.type} onChange={(e) => setEditingGuardian({...editingGuardian, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">속성</label>
                  <input type="text" value={editingGuardian.attribute} onChange={(e) => setEditingGuardian({...editingGuardian, attribute: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">딜러 카드</label>
                  <input type="text" value={editingGuardian.dealer_cards} onChange={(e) => setEditingGuardian({...editingGuardian, dealer_cards: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">서포터 카드</label>
                  <input type="text" value={editingGuardian.supporter_cards} onChange={(e) => setEditingGuardian({...editingGuardian, supporter_cards: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                <button onClick={() => saveGuardian(editingGuardian)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all mt-4">저장</button>
              </div>
            </div>
          </div>
        )}

        {editingClass && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl glass rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">클래스 정보 수정</h3>
                <button onClick={() => setEditingClass(null)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group">
                    <img src={editingClass.image} className="w-24 h-24 rounded-2xl object-cover border border-white/10" alt="" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Plus className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditingClass({ ...editingClass, image: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">클래스 이름</label>
                    <input type="text" value={editingClass.name} onChange={(e) => setEditingClass({...editingClass, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">뿌리</label>
                    <input type="text" value={editingClass.root} onChange={(e) => setEditingClass({...editingClass, root: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">클래스</label>
                    <input type="text" value={editingClass.className} onChange={(e) => setEditingClass({...editingClass, className: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">직업 각인</label>
                  <input type="text" value={editingClass.classEngraving} onChange={(e) => setEditingClass({...editingClass, classEngraving: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                
                {/* Common Engravings */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">공용 각인 (최대 5개)</label>
                    {editingClass.commonEngravings.length < 5 && (
                      <button 
                        onClick={() => setEditingClass({...editingClass, commonEngravings: [...editingClass.commonEngravings, '']})}
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {editingClass.commonEngravings.map((eng, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={eng} 
                          onChange={(e) => {
                            const newEngs = [...editingClass.commonEngravings];
                            newEngs[idx] = e.target.value;
                            setEditingClass({...editingClass, commonEngravings: newEngs});
                          }} 
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                        />
                        {editingClass.commonEngravings.length > 1 && (
                          <button 
                            onClick={() => setEditingClass({...editingClass, commonEngravings: editingClass.commonEngravings.filter((_, i) => i !== idx)})}
                            className="text-red-500 hover:text-red-400 p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ark Grid */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">아크 그리드 (최대 6개)</label>
                    {editingClass.arkGrid.length < 6 && (
                      <button 
                        onClick={() => setEditingClass({...editingClass, arkGrid: [...editingClass.arkGrid, '']})}
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {editingClass.arkGrid.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={item} 
                          onChange={(e) => {
                            const newGrid = [...editingClass.arkGrid];
                            newGrid[idx] = e.target.value;
                            setEditingClass({...editingClass, arkGrid: newGrid});
                          }} 
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                        />
                        {editingClass.arkGrid.length > 1 && (
                          <button 
                            onClick={() => setEditingClass({...editingClass, arkGrid: editingClass.arkGrid.filter((_, i) => i !== idx)})}
                            className="text-red-500 hover:text-red-400 p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counter Skills */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">카운터 스킬 (최대 3개)</label>
                    {editingClass.counterSkills.length < 3 && (
                      <button 
                        onClick={() => setEditingClass({...editingClass, counterSkills: [...editingClass.counterSkills, '']})}
                        className="text-primary hover:text-primary/80"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {editingClass.counterSkills.map((skill, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={skill} 
                          onChange={(e) => {
                            const newSkills = [...editingClass.counterSkills];
                            newSkills[idx] = e.target.value;
                            setEditingClass({...editingClass, counterSkills: newSkills});
                          }} 
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" 
                        />
                        {editingClass.counterSkills.length > 1 && (
                          <button 
                            onClick={() => setEditingClass({...editingClass, counterSkills: editingClass.counterSkills.filter((_, i) => i !== idx)})}
                            className="text-red-500 hover:text-red-400 p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">스킬코드 링크</label>
                  <input type="text" value={editingClass.skillCodeLink} onChange={(e) => setEditingClass({...editingClass, skillCodeLink: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                <button onClick={() => saveClass(editingClass)} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all mt-4">저장</button>
              </div>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
              <Share2 size={20} className="text-primary" />
              <h3 className="text-xl font-bold">SEO & 소셜</h3>
            </div>
            <p className="text-gray-500 text-sm mb-4">검색 엔진 최적화 및 소셜 미디어 연동 설정입니다.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm">메타 태그 자동 생성</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm">디스코드 웹훅 연동</span>
                <div className="w-10 h-5 bg-gray-700 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Plus size={20} className="text-primary" />
              <h3 className="text-xl font-bold">새 게시글 작성</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <input 
                    type="text" 
                    placeholder="제목을 입력하세요"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <select 
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="공지">공지</option>
                    <option value="이벤트">이벤트</option>
                    <option value="레이드">레이드</option>
                    <option value="가디언토벌">가디언토벌</option>
                    <option value="클래스">클래스</option>
                    <option value="팁">팁</option>
                    <option value="스크린샷">스크린샷</option>
                    <option value="자유">자유</option>
                    <option value="수집형 포인트">수집형 포인트</option>
                  </select>
                </div>
              </div>

              {newPost.category === '수집형 포인트' && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    '섬의 마음', '거인의 심장', '오르페우스의 별', '위대한 미술품', 
                    '기억의 오르골', '모코코 씨앗', '세계수의 잎', '항해 모험물', 
                    '크림스네일의 해도', '누크만의 환영석'
                  ].map(sub => (
                    <button
                      key={sub}
                      onClick={() => setNewPost({...newPost, sub_category: sub})}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                        newPost.sub_category === sub 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              <RichTextEditor 
                placeholder="내용을 입력하세요"
                value={newPost.content}
                onChange={(content) => setNewPost({...newPost, content})}
              />
              <button 
                onClick={() => {
                  onAddPost(newPost);
                  setNewPost({ title: '', content: '', category: '공지', sub_category: '' });
                }}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all"
              >
                게시글 등록
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6">게시글 목록</h3>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-primary uppercase">{post.category}</span>
                      <h4 className="font-bold">{post.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => onDeletePost(post.id)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-center text-gray-500 py-10">작성된 게시글이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<RaidInfo | null>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianInfo | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'normal' | 'hard' | 'nightmare'>('normal');
  const [activeGate, setActiveGate] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modalPost, setModalPost] = useState({ title: '', content: '', category: '자유', sub_category: '' });
  const [schedules, setSchedules] = useState<RaidSchedule[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeSchedule, setActiveSchedule] = useState<RaidSchedule | null>(null);

  const [newSchedule, setNewSchedule] = useState({
    raid_name: '',
    time: '20:00',
    difficulty: '노말' as const,
    max_participants: 8
  });

  const [newParticipant, setNewParticipant] = useState({
    character_name: '',
    position: '딜러' as const,
    item_level: '',
    class_name: '',
    synergy: ''
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_COMMENT') {
        const newNotif: Notification = {
          id: Date.now(),
          type: 'NEW_COMMENT',
          message: `${data.author}: ${data.content}`,
          postTitle: data.postTitle
        };
        setNotifications(prev => [...prev, newNotif]);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 5000);

        // If we are viewing the post that got a new comment, refresh comments
        if (selectedPost && selectedPost.id === parseInt(data.postId)) {
          fetchComments(selectedPost.id);
        }
      }
    };

    return () => ws.close();
  }, [selectedPost]);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const [settings, setSettings] = useState<Settings>({
    guild_name: '로스트아크 INXX',
    guild_description: '최고를 지향하는 로스트아크 INXX 길드입니다.',
    primary_color: '#8B5CF6',
    raid_info: '[]',
    guardians_info: '[]',
    classes_info: '[]',
    grade_names: JSON.stringify(['신입', '길드원', '대리', '팀장', '임원', '부마스터', '마스터'])
  });

  useEffect(() => {
    // Mock profile for now since login is removed
    setProfile({
      id: 'admin-id',
      nickname: '관리자',
      grade: '마스터',
      can_manage_members: true,
      can_manage_content: true,
      can_manage_settings: true,
      created_at: new Date().toISOString()
    });
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSettings();
    fetchSchedules();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  const fetchComments = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    try {
      await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      setNewComment('');
      fetchComments(selectedPost.id);
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/raid-schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    }
  };

  const handleAddSchedule = async () => {
    try {
      await fetch('/api/raid-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSchedule, date: selectedDate })
      });
      setIsScheduleModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to add schedule', err);
    }
  };

  const handleJoinRaid = async () => {
    if (!activeSchedule) return;
    try {
      await fetch(`/api/raid-schedules/${activeSchedule.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParticipant)
      });
      setIsJoinModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to join raid', err);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('일정을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/raid-schedules/${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule', err);
    }
  };

  const handleDeleteParticipant = async (id: number) => {
    if (!confirm('참여를 취소하시겠습니까?')) return;
    try {
      await fetch(`/api/raid-participants/${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete participant', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (Object.keys(data).length > 0) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleAddPost = async (post: Partial<Post>) => {
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      fetchPosts();
    } catch (err) {
      console.error('Failed to add post', err);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setActiveTab('home');
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<Profile>) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', memberId);
      
      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSettings = async (newSettings: Settings) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      });
      setSettings(newSettings);
      alert('설정이 저장되었습니다.');
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white selection:bg-primary/30">
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        profile={profile}
        onLogout={handleLogout}
      />
      
      <main>
        {activeTab === 'home' && (
          <>
            <Hero 
              settings={settings} 
              onRaidClick={setSelectedRaid} 
              onGuardianClick={setSelectedGuardian}
              onClassClick={setSelectedClass}
            />

            <section className="max-w-7xl mx-auto px-4 py-12">
              <Calendar 
                schedules={schedules} 
                onAddRaid={(date) => {
                  setSelectedDate(date);
                  setIsScheduleModalOpen(true);
                }} 
                onJoinRaid={(s) => {
                  setActiveSchedule(s);
                  setIsJoinModalOpen(true);
                }}
              />
            </section>
            
            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-4 py-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass p-8 rounded-3xl border-l-4 border-primary">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Sword className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">레이드 공략</h3>
                  <p className="text-gray-400">최신 레이드 공략과 길드만의 노하우를 공유합니다.</p>
                </div>
                <div className="glass p-8 rounded-3xl border-l-4 border-primary">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">활발한 커뮤니티</h3>
                  <p className="text-gray-400">매너 있고 즐거운 분위기에서 함께 성장합니다.</p>
                </div>
                <div className="glass p-8 rounded-3xl border-l-4 border-primary">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <Globe className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">다양한 이벤트</h3>
                  <p className="text-gray-400">길드원들을 위한 풍성한 내부 이벤트가 준비되어 있습니다.</p>
                </div>
              </div>
            </section>

            {/* Recent Posts Preview */}
            <section className="max-w-7xl mx-auto px-4 py-24 border-t border-white/5">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-bold mb-4">최신 소식</h2>
                  <p className="text-gray-500">길드의 새로운 소식과 공지사항을 확인하세요.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="text-primary font-bold flex items-center gap-2 hover:underline"
                >
                  전체 보기 <ChevronRight size={20} />
                </button>
              </div>
              <PostList posts={posts.slice(0, 3)} onSelectPost={setSelectedPost} />
            </section>

            {/* Guild Members Section */}
            <section className="max-w-7xl mx-auto px-4 py-24 border-t border-white/5">
              <div className="mb-12">
                <h2 className="text-4xl font-bold mb-4">길드 멤버</h2>
                <p className="text-gray-500">함께 모험을 즐기는 INXX 길드원들입니다.</p>
              </div>
              <MemberList members={members} />
            </section>
          </>
        )}

        {activeTab === 'login' && <Login onSwitch={() => setActiveTab('signup')} />}
        {activeTab === 'signup' && <SignUp onSwitch={() => setActiveTab('login')} />}
        {activeTab === 'mypage' && <MyPage profile={profile} />}

        {activeTab === 'posts' && (
          <section className="max-w-7xl mx-auto px-4 py-32 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-4xl font-bold">길드 게시판</h2>
                  <button 
                    onClick={() => setIsWriteModalOpen(true)}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center purple-glow hover:scale-110 transition-transform"
                  >
                    <Plus className="text-white" size={24} />
                  </button>
                </div>
                <p className="text-gray-500">길드원들의 다양한 이야기를 만나보세요.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['전체', '공지', '이벤트', '레이드', '가디언토벌', '클래스', '팁', '스크린샷', '자유', '커스터마이징 및 의상', '수집형 포인트'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('전체');
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-primary text-white purple-glow' 
                        : 'glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {selectedCategory === '수집형 포인트' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {['전체', '섬의 마음', '거인의 심장', '오르페우스의 별', '위대한 미술품', '기억의 오르골', '모코코 씨앗', '세계수의 잎', '향해 모험물', '크림스네일의 해도', '누크만의 환영석'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        selectedSubCategory === sub 
                          ? 'bg-primary text-white purple-glow' 
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <PostList 
              posts={
                selectedCategory === '전체' 
                  ? posts 
                  : selectedCategory === '수집형 포인트' && selectedSubCategory !== '전체'
                    ? posts.filter(p => p.category === selectedCategory && p.sub_category === selectedSubCategory)
                    : posts.filter(p => p.category === selectedCategory)
              } 
              onSelectPost={setSelectedPost}
            />
            {(selectedCategory === '전체' ? posts : posts.filter(p => p.category === selectedCategory)).length === 0 && (
              <div className="text-center py-20 glass rounded-3xl">
                <FileText className="mx-auto text-gray-700 mb-4" size={48} />
                <p className="text-gray-500">해당 카테고리에 게시글이 없습니다.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'admin' && (profile?.grade === '마스터' || profile?.can_manage_members || profile?.can_manage_content || profile?.can_manage_settings) && (
          <AdminDashboard 
            posts={posts} 
            settings={settings}
            members={members}
            profile={profile}
            onAddPost={handleAddPost}
            onDeletePost={handleDeletePost}
            onUpdateSettings={handleUpdateSettings}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onFetchMembers={fetchMembers}
          />
        )}
      </main>

      <footer className="glass border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tighter">{settings.guild_name}</span>
            </div>
            <div className="flex gap-6 text-gray-500 text-sm">
              <a href="#" className="hover:text-primary transition-colors">이용약관</a>
              <a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-primary transition-colors">문의하기</a>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 {settings.guild_name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Raid Detail Modal */}
      <AnimatePresence>
        {selectedRaid && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRaid(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="relative h-48 md:h-64">
                <img 
                  src={selectedRaid.image} 
                  className="w-full h-full object-cover"
                  alt="Raid"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent"></div>
                <button 
                  onClick={() => setSelectedRaid(null)}
                  className="absolute top-4 right-4 p-2 glass rounded-full text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-8">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">Raid</span>
                  <h2 className="text-4xl font-bold">{selectedRaid.name}</h2>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex gap-2 mb-6">
                  {(['normal', 'hard', 'nightmare'] as const).map(diff => (
                    <button 
                      key={diff} 
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
                        selectedDifficulty === diff 
                          ? 'bg-primary text-white purple-glow' 
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {diff === 'normal' ? '노말' : diff === 'hard' ? '하드' : '나이트메어'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[1, 2, 3].map(gate => (
                    <div key={gate} className="glass p-4 rounded-2xl border border-white/5">
                      <h4 className="text-primary font-bold text-sm mb-4">{gate}관문</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">골드</span><span className="text-primary font-bold">{selectedRaid.difficulties[selectedDifficulty].gates[gate as 1|2|3].gold}G</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">체력</span><span>{selectedRaid.difficulties[selectedDifficulty].gates[gate as 1|2|3].hp}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">계열</span><span>{selectedRaid.difficulties[selectedDifficulty].gates[gate as 1|2|3].type}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">속성</span><span>{selectedRaid.difficulties[selectedDifficulty].gates[gate as 1|2|3].attribute}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setSelectedRaid(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all purple-glow"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guardian Detail Modal */}
      <AnimatePresence>
        {selectedGuardian && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuardian(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="relative h-48 md:h-64">
                <img 
                  src={selectedGuardian.image} 
                  className="w-full h-full object-cover"
                  alt="Guardian"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent"></div>
                <button 
                  onClick={() => setSelectedGuardian(null)}
                  className="absolute top-4 right-4 p-2 glass rounded-full text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-8">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">Guardian Raid</span>
                  <h2 className="text-4xl font-bold">{selectedGuardian.name}</h2>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-sm font-bold uppercase">체력</span>
                    <span className="font-bold text-primary">{selectedGuardian.hp}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-sm font-bold uppercase">계열</span>
                    <span className="font-bold">{selectedGuardian.type}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-sm font-bold uppercase">속성</span>
                    <span className="font-bold">{selectedGuardian.attribute}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-xs font-bold uppercase block mb-2">추천 카드</span>
                    <p className="font-bold text-sm">{selectedGuardian.dealer_cards}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 pt-0">
                <button 
                  onClick={() => setSelectedGuardian(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all purple-glow"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Class Detail Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClass(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="relative h-48 md:h-64">
                <img 
                  src={selectedClass.image} 
                  className="w-full h-full object-cover"
                  alt="Class"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent"></div>
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="absolute top-4 right-4 p-2 glass rounded-full text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-8">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest mb-2 block">{selectedClass.root}</span>
                  <h2 className="text-4xl font-bold">{selectedClass.name}</h2>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-xs font-bold uppercase block mb-1">직업 각인</span>
                    <p className="font-bold">{selectedClass.classEngraving}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-gray-500 text-xs font-bold uppercase block mb-1">공용 각인</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedClass.commonEngravings.map((eng, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold">{eng}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-gray-500 text-xs font-bold uppercase block mb-1">아크 그리드</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedClass.arkGrid.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-bold border border-primary/20">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-gray-500 text-xs font-bold uppercase block mb-1">카운터 스킬</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedClass.counterSkills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20">{skill}</span>
                    ))}
                  </div>
                </div>
                {selectedClass.skillCodeLink && (
                  <a 
                    href={selectedClass.skillCodeLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    <Globe size={18} /> 스킬코드 링크 바로가기
                  </a>
                )}
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all purple-glow"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raid Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScheduleModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md glass rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">레이드 일정 추가</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">날짜</label>
                  <input type="text" value={selectedDate} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">레이드명</label>
                  <input type="text" value={newSchedule.raid_name} onChange={(e) => setNewSchedule({...newSchedule, raid_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" placeholder="예: 카멘 하드" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">시간</label>
                    <input type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">난이도</label>
                    <select value={newSchedule.difficulty} onChange={(e) => setNewSchedule({...newSchedule, difficulty: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all">
                      <option value="노말">노말</option>
                      <option value="하드">하드</option>
                      <option value="나이트메어">나이트메어</option>
                      <option value="헬">헬</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">최대 인원</label>
                  <input type="number" value={newSchedule.max_participants} onChange={(e) => setNewSchedule({...newSchedule, max_participants: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                </div>
                <button onClick={handleAddSchedule} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all mt-4 purple-glow">일정 등록</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Raid Modal */}
      <AnimatePresence>
        {isJoinModalOpen && activeSchedule && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsJoinModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl glass rounded-3xl p-8 border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{activeSchedule.raid_name}</h3>
                  <p className="text-gray-500 text-sm">{activeSchedule.date} {activeSchedule.time} | {activeSchedule.difficulty}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteSchedule(activeSchedule.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={20} /></button>
                  <button onClick={() => setIsJoinModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">참여 인원 ({activeSchedule.participants.length}/{activeSchedule.max_participants})</h4>
                  <div className="space-y-2">
                    {activeSchedule.participants.map(p => (
                      <div key={p.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === '딜러' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{p.position}</span>
                            <span className="font-bold">{p.character_name}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{p.class_name} | Lv.{p.item_level} | {p.synergy}</p>
                        </div>
                        <button onClick={() => handleDeleteParticipant(p.id)} className="text-gray-600 hover:text-red-500 transition-colors"><UserMinus size={16} /></button>
                      </div>
                    ))}
                    {activeSchedule.participants.length === 0 && <p className="text-center py-8 text-gray-600 text-sm italic">아직 참여자가 없습니다.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">참여 신청</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">캐릭터명</label>
                      <input type="text" value={newParticipant.character_name} onChange={(e) => setNewParticipant({...newParticipant, character_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">포지션</label>
                        <select value={newParticipant.position} onChange={(e) => setNewParticipant({...newParticipant, position: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all">
                          <option value="딜러">딜러</option>
                          <option value="서포터">서포터</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">아이템 레벨</label>
                        <input type="text" value={newParticipant.item_level} onChange={(e) => setNewParticipant({...newParticipant, item_level: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">클래스</label>
                      <input type="text" value={newParticipant.class_name} onChange={(e) => setNewParticipant({...newParticipant, class_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">시너지</label>
                      <input type="text" value={newParticipant.synergy} onChange={(e) => setNewParticipant({...newParticipant, synergy: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all" />
                    </div>
                    <button 
                      onClick={handleJoinRaid} 
                      disabled={activeSchedule.participants.length >= activeSchedule.max_participants}
                      className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all mt-4 purple-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeSchedule.participants.length >= activeSchedule.max_participants ? '인원 마감' : '참여 신청'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl glass rounded-3xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {selectedPost.category}
                    </span>
                    {selectedPost.sub_category && (
                      <span className="px-2 py-1 rounded bg-white/10 text-gray-400 text-[10px] font-bold uppercase">
                        {selectedPost.sub_category}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <h2 className="text-3xl font-bold mb-4">{selectedPost.title}</h2>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                  <span className="flex items-center gap-1"><Users size={14} /> {selectedPost.author}</span>
                  <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                <div 
                  className="text-gray-300 leading-relaxed mb-12 rich-text-content"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />

                {/* Comments Section */}
                <div className="border-t border-white/5 pt-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    댓글 <span className="text-primary text-sm">{comments.length}</span>
                  </h3>
                  
                  <div className="space-y-6 mb-8">
                    <AnimatePresence initial={false}>
                      {comments.map((comment) => (
                        <motion.div 
                          key={comment.id} 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-300">{comment.author}</span>
                              {new Date().getTime() - new Date(comment.created_at).getTime() < 10000 && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="px-1.5 py-0.5 rounded bg-primary text-[8px] font-bold text-white uppercase"
                                >
                                  New
                                </motion.span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-400 text-sm">{comment.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {comments.length === 0 && (
                      <p className="text-center text-gray-500 py-4">첫 번째 댓글을 남겨보세요!</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="댓글을 입력하세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm"
                    />
                    <button 
                      onClick={handleAddComment}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all text-sm"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl p-8 border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">새 게시글 작성</h3>
                <button onClick={() => setIsWriteModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">제목</label>
                    <input 
                      type="text" 
                      placeholder="제목을 입력하세요"
                      value={modalPost.title}
                      onChange={(e) => setModalPost({...modalPost, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">카테고리</label>
                    <select 
                      value={modalPost.category}
                      onChange={(e) => setModalPost({...modalPost, category: e.target.value, sub_category: ''})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="자유">자유</option>
                      <option value="레이드">레이드</option>
                      <option value="가디언토벌">가디언토벌</option>
                      <option value="클래스">클래스</option>
                      <option value="팁">팁</option>
                      <option value="스크린샷">스크린샷</option>
                      <option value="수집형 포인트">수집형 포인트</option>
                    </select>
                  </div>
                </div>

                {modalPost.category === '수집형 포인트' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      '섬의 마음', '거인의 심장', '오르페우스의 별', '위대한 미술품', 
                      '기억의 오르골', '모코코 씨앗', '세계수의 잎', '항해 모험물', 
                      '크림스네일의 해도', '누크만의 환영석'
                    ].map(sub => (
                      <button
                        key={sub}
                        onClick={() => setModalPost({...modalPost, sub_category: sub})}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          modalPost.sub_category === sub 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">내용</label>
                  <RichTextEditor 
                    placeholder="내용을 입력하세요"
                    value={modalPost.content}
                    onChange={(content) => setModalPost({...modalPost, content})}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => setIsWriteModalOpen(false)}
                    className="px-6 py-3 glass rounded-xl font-bold hover:bg-white/5 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    onClick={async () => {
                      if (!modalPost.title || !modalPost.content) {
                        alert('제목과 내용을 모두 입력해주세요.');
                        return;
                      }
                      await handleAddPost(modalPost);
                      setIsWriteModalOpen(false);
                      setModalPost({ title: '', content: '', category: '자유', sub_category: '' });
                    }}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all purple-glow"
                  >
                    게시글 등록
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
