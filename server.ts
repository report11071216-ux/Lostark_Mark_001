import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("guild.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '일반',
    sub_category TEXT,
    author TEXT DEFAULT '관리자',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS raid_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raid_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    max_participants INTEGER DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS raid_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    character_name TEXT NOT NULL,
    position TEXT NOT NULL,
    item_level TEXT NOT NULL,
    class_name TEXT NOT NULL,
    synergy TEXT NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES raid_schedules (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT '길드원',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    grade TEXT DEFAULT '신입',
    can_manage_members INTEGER DEFAULT 0,
    can_manage_content INTEGER DEFAULT 0,
    can_manage_settings INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO profiles (id, nickname, grade, can_manage_members, can_manage_content, can_manage_settings) 
  VALUES ('admin-id', '관리자', '마스터', 1, 1, 1);

  INSERT OR IGNORE INTO settings (key, value) VALUES ('guild_name', '로스트아크 INXX');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('guild_description', '최고를 지향하는 로스트아크 INXX 길드입니다.');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('primary_color', '#8B5CF6');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('raid_info', '[]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('guardians_info', '[]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('classes_info', '[]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('grade_names', '["신입", "길드원", "대리", "팀장", "임원", "부마스터", "마스터"]');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('bosses_info', '[{"id":1,"name":"카멘","image":"https://picsum.photos/seed/kamen/400/400","hp":"3000억","type":"인간/악마","attribute":"암","dealer_cards":"세상을 구하는 빛","supporter_cards":"남겨진 바람의 절벽"},{"id":2,"name":"에키드나","image":"https://picsum.photos/seed/echidna/400/400","hp":"2500억","type":"악마","attribute":"성","dealer_cards":"세상을 구하는 빛","supporter_cards":"남겨진 바람의 절벽"},{"id":3,"name":"베히모스","image":"https://picsum.photos/seed/behemoth/400/400","hp":"5000억","type":"용","attribute":"뇌","dealer_cards":"세상을 구하는 빛","supporter_cards":"남겨진 바람의 절벽"},{"id":4,"name":"일리아칸","image":"https://picsum.photos/seed/akkan/400/400","hp":"1800억","type":"불사","attribute":"성","dealer_cards":"세상을 구하는 빛","supporter_cards":"남겨진 바람의 절벽"},{"id":5,"name":"쿠크세이튼","image":"https://picsum.photos/seed/saydon/400/400","hp":"800억","type":"악마","attribute":"성","dealer_cards":"세상을 구하는 빛","supporter_cards":"남겨진 바람의 절벽"}]');

  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('[공지] INXX 길드 홈페이지 오픈!', '우리 길드만의 전용 홈페이지가 오픈되었습니다. 앞으로 여기서 다양한 소식을 확인하세요.', '공지');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('[이벤트] 길드 레이드 정기 일정 안내', '매주 토요일 오후 9시에 정기 레이드가 진행됩니다. 많은 참여 부탁드립니다.', '이벤트');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('카멘 하드 4관문 공략 팁', '카멘 하드 4관문에서 주의해야 할 패턴들을 정리해 보았습니다.', '레이드');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('베히모스 가디언 토벌 팁', '베히모스 토벌 시 주의해야 할 기믹들을 공유합니다.', '가디언토벌');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('서머너 상향 기원 클래스 게시글', '서머너 클래스의 현재 위치와 개선 방향에 대해 논의해봅시다.', '클래스');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('내실 팁: 섬의 마음 획득처 정리', '아직 섬의 마음을 다 모으지 못한 분들을 위한 정리글입니다.', '팁');
  INSERT OR IGNORE INTO posts (title, content, category) VALUES ('우리 길드 단체 스샷!', '지난 정기 레이드 끝나고 찍은 단체 사진입니다.', '스크린샷');
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes
  app.get("/api/posts", (req, res) => {
    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { title, content, category, sub_category } = req.body;
    const info = db.prepare("INSERT INTO posts (title, content, category, sub_category) VALUES (?, ?, ?, ?)").run(title, content, category, sub_category || null);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/posts/:id", (req, res) => {
    db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/posts/:id/comments", (req, res) => {
    const comments = db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", (req, res) => {
    const { content, author } = req.body;
    const postId = req.params.id;
    const info = db.prepare("INSERT INTO comments (post_id, content, author) VALUES (?, ?, ?)").run(postId, content, author || '길드원');
    
    // Broadcast new comment notification
    const post = db.prepare("SELECT title FROM posts WHERE id = ?").get(postId) as { title: string };
    broadcast({
      type: 'NEW_COMMENT',
      postId,
      postTitle: post.title,
      author: author || '길드원',
      content: content.length > 20 ? content.substring(0, 20) + '...' : content
    });

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.get("/api/members", (req, res) => {
    const members = db.prepare("SELECT * FROM profiles ORDER BY created_at ASC").all();
    res.json(members);
  });

  app.patch("/api/members/:id", (req, res) => {
    const { grade, can_manage_members, can_manage_content, can_manage_settings } = req.body;
    db.prepare(`
      UPDATE profiles 
      SET grade = COALESCE(?, grade),
          can_manage_members = COALESCE(?, can_manage_members),
          can_manage_content = COALESCE(?, can_manage_content),
          can_manage_settings = COALESCE(?, can_manage_settings)
      WHERE id = ?
    `).run(grade, can_manage_members, can_manage_content, can_manage_settings, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/members/:id", (req, res) => {
    db.prepare("DELETE FROM profiles WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/login", (req, res) => {
    const { nickname } = req.body;
    let profile = db.prepare("SELECT * FROM profiles WHERE nickname = ?").get(nickname) as any;
    
    if (!profile) {
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO profiles (id, nickname) VALUES (?, ?)").run(id, nickname);
      profile = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id);
    }
    
    res.json(profile);
  });

  // Raid Schedule Routes
  app.get("/api/raid-schedules", (req, res) => {
    const schedules = db.prepare("SELECT * FROM raid_schedules ORDER BY date ASC, time ASC").all();
    const results = schedules.map((s: any) => {
      const participants = db.prepare("SELECT * FROM raid_participants WHERE schedule_id = ?").all(s.id);
      return { ...s, participants };
    });
    res.json(results);
  });

  app.post("/api/raid-schedules", (req, res) => {
    const { raid_name, date, time, difficulty, max_participants } = req.body;
    const info = db.prepare("INSERT INTO raid_schedules (raid_name, date, time, difficulty, max_participants) VALUES (?, ?, ?, ?, ?)")
      .run(raid_name, date, time, difficulty, max_participants || 8);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/raid-schedules/:id", (req, res) => {
    db.prepare("DELETE FROM raid_schedules WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/raid-schedules/:id/participants", (req, res) => {
    const { character_name, position, item_level, class_name, synergy } = req.body;
    const scheduleId = req.params.id;
    const info = db.prepare("INSERT INTO raid_participants (schedule_id, character_name, position, item_level, class_name, synergy) VALUES (?, ?, ?, ?, ?, ?)")
      .run(scheduleId, character_name, position, item_level, class_name, synergy);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/raid-participants/:id", (req, res) => {
    db.prepare("DELETE FROM raid_participants WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Image Upload (Base64 for simplicity in this environment)
  app.post("/api/upload", express.json({ limit: '10mb' }), (req, res) => {
    const { image } = req.body;
    // In a real app, we'd save to disk. Here we just return the base64 or a mock URL.
    res.json({ url: image });
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const update = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(settings)) {
      update.run(key, String(value));
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
