'use strict';
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const { ADMIN_KULLANICI, ADMIN_SIFRE, JWT_SECRET } = process.env;
if (!ADMIN_KULLANICI || !ADMIN_SIFRE || !JWT_SECRET) {
  console.error('HATA: .env içinde ADMIN_KULLANICI, ADMIN_SIFRE ve JWT_SECRET tanımlı olmalı (bkz. .env.ornek).');
  process.exit(1);
}
const PORT = Number(process.env.PORT) || 3000;
const DURUMLAR = ['yeni', 'okundu', 'arsiv'];

const db = new Database(process.env.DB_DOSYA || path.join(__dirname, 'limonata.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS mesajlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,
  eposta TEXT NOT NULL,
  telefon TEXT,
  mesaj TEXT NOT NULL,
  durum TEXT NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni','okundu','arsiv')),
  olusturma TEXT NOT NULL
)`);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', false);
const origins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: '20kb' }));

// Basit bellek içi hız sınırı: IP başına 10 dk'da 5 istek
const PENCERE = 10 * 60 * 1000, LIMIT = 5;
const istekler = new Map();
function hizSiniri(req, res, next) {
  const ip = req.ip, simdi = Date.now();
  const liste = (istekler.get(ip) || []).filter(t => simdi - t < PENCERE);
  if (liste.length >= LIMIT) return res.status(429).json({ ok: false, hata: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' });
  liste.push(simdi); istekler.set(ip, liste);
  next();
}
setInterval(() => { const s = Date.now(); for (const [ip, l] of istekler) if (!l.some(t => s - t < PENCERE)) istekler.delete(ip); }, PENCERE).unref();

const metin = v => (typeof v === 'string' ? v.trim() : '');
const EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

app.post('/api/iletisim', hizSiniri, (req, res) => {
  const b = req.body || {};
  if (metin(b.website)) return res.status(201).json({ ok: true }); // honeypot: bot, sessizce yut
  const ad = metin(b.ad), eposta = metin(b.eposta), mesaj = metin(b.mesaj);
  const telefon = metin(b.telefon);
  const hata = (m) => res.status(400).json({ ok: false, hata: m });
  if (ad.length < 2 || ad.length > 100) return hata('Ad 2-100 karakter olmalı.');
  if (eposta.length > 150 || !EPOSTA_RE.test(eposta)) return hata('Geçerli bir e-posta girin.');
  if (telefon && (telefon.length < 5 || telefon.length > 30 || !/^[0-9+()\-\s]+$/.test(telefon))) return hata('Geçerli bir telefon girin.');
  if (mesaj.length < 5 || mesaj.length > 2000) return hata('Mesaj 5-2000 karakter olmalı.');
  db.prepare('INSERT INTO mesajlar (ad, eposta, telefon, mesaj, olusturma) VALUES (?, ?, ?, ?, ?)')
    .run(ad, eposta, telefon || null, mesaj, new Date().toISOString());
  res.status(201).json({ ok: true });
});

// Giriş denemeleri için ayrı, sıkı sınır: IP başına 10 dk'da 10 deneme
const girisDeneme = new Map();
function girisSiniri(req, res, next) {
  const simdi = Date.now();
  const l = (girisDeneme.get(req.ip) || []).filter(t => simdi - t < PENCERE);
  if (l.length >= 10) return res.status(429).json({ ok: false, hata: 'Çok fazla deneme. Lütfen sonra tekrar deneyin.' });
  l.push(simdi); girisDeneme.set(req.ip, l);
  next();
}

const esit = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

app.post('/api/admin/giris', girisSiniri, (req, res) => {
  const { kullanici, sifre } = req.body || {};
  if (typeof kullanici !== 'string' || typeof sifre !== 'string') return res.status(400).json({ ok: false, hata: 'Kullanıcı ve şifre gerekli.' });
  const kOk = esit(kullanici, ADMIN_KULLANICI), sOk = esit(sifre, ADMIN_SIFRE);
  if (!(kOk && sOk)) return res.status(401).json({ ok: false, hata: 'Kullanıcı adı veya şifre hatalı.' });
  const token = jwt.sign({ rol: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

function yetki(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return res.status(401).json({ ok: false, hata: 'Yetkilendirme gerekli.' });
  try { jwt.verify(m[1], JWT_SECRET, { algorithms: ['HS256'] }); next(); }
  catch { res.status(401).json({ ok: false, hata: 'Geçersiz veya süresi dolmuş token.' }); }
}

app.get('/api/admin/mesajlar', yetki, (req, res) => {
  const { durum } = req.query;
  if (durum !== undefined && !DURUMLAR.includes(durum)) return res.status(400).json({ ok: false, hata: 'durum: yeni, okundu veya arsiv olmalı.' });
  const sql = 'SELECT id, ad, eposta, telefon, mesaj, durum, olusturma FROM mesajlar' + (durum ? ' WHERE durum = ?' : '') + ' ORDER BY id DESC';
  res.json(durum ? db.prepare(sql).all(durum) : db.prepare(sql).all());
});

function idAl(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ ok: false, hata: 'Geçersiz id.' }); return null; }
  return id;
}

app.patch('/api/admin/mesajlar/:id', yetki, (req, res) => {
  const id = idAl(req, res); if (id === null) return;
  const durum = (req.body || {}).durum;
  if (!DURUMLAR.includes(durum)) return res.status(400).json({ ok: false, hata: 'durum: yeni, okundu veya arsiv olmalı.' });
  const r = db.prepare('UPDATE mesajlar SET durum = ? WHERE id = ?').run(durum, id);
  if (!r.changes) return res.status(404).json({ ok: false, hata: 'Mesaj bulunamadı.' });
  res.json({ ok: true });
});

app.delete('/api/admin/mesajlar/:id', yetki, (req, res) => {
  const id = idAl(req, res); if (id === null) return;
  const r = db.prepare('DELETE FROM mesajlar WHERE id = ?').run(id);
  if (!r.changes) return res.status(404).json({ ok: false, hata: 'Mesaj bulunamadı.' });
  res.json({ ok: true });
});

app.get('/api/admin/istatistik', yetki, (req, res) => {
  const s = db.prepare(`SELECT COUNT(*) AS toplam,
    COALESCE(SUM(durum='yeni'),0) AS yeni, COALESCE(SUM(durum='okundu'),0) AS okundu, COALESCE(SUM(durum='arsiv'),0) AS arsiv FROM mesajlar`).get();
  res.json(s);
});

app.use('/api', (req, res) => res.status(404).json({ ok: false, hata: 'Uç bulunamadı.' }));

// Statik: web/ ve web/admin/ (express.static admin/index.html'i /admin/ altında sunar)
const WEB = path.join(__dirname, '..', 'web');
app.use(express.static(WEB));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(400).json({ ok: false, hata: 'Geçersiz istek gövdesi.' });
  console.error(err);
  res.status(500).json({ ok: false, hata: 'Sunucu hatası.' });
});

if (require.main === module) app.listen(PORT, () => console.log(`Limonata sunucusu: http://localhost:${PORT}`));
module.exports = app;
