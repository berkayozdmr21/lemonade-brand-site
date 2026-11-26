# Limonata Sitesi – API Sözleşmesi

Taban adres: aynı origin (`http://localhost:3000`). Tüm gövdeler JSON, `Content-Type: application/json`.
Statik: `/` → `web/index.html`, `/admin/` → `web/admin/index.html`.

## Genel
- Hata biçimi: `{ "ok": false, "hata": "açıklama" }` (uygun HTTP kodu: 400, 401, 404, 429, 500).
- Admin uçları `Authorization: Bearer <token>` ister; yoksa/geçersizse `401 {ok:false, hata}`.

## 1) İletişim formu (herkese açık)
`POST /api/iletisim`
```json
{ "ad": "string (2-100)", "eposta": "string (geçerli e-posta)", "telefon": "string? (opsiyonel, 5-30)", "mesaj": "string (5-2000)", "website": "" }
```
- `website` honeypot alanıdır: forma gizli eklenmeli, **boş** kalmalı. Doluysa bot sayılır (yanıt 201 döner, kayıt yapılmaz).
- Başarı: `201 {"ok": true}`
- Hata: `400 {"ok": false, "hata": "..."}`; hız sınırı aşılırsa `429 {"ok": false, "hata": "..."}` (IP başına 10 dk'da 5 istek).

## 2) Admin giriş
`POST /api/admin/giris` gövde `{ "kullanici": "string", "sifre": "string" }`
- Başarı: `200 {"token": "<jwt>"}` (8 saat geçerli). Hatalı: `401 {ok:false, hata}`.

## 3) Mesajları listele
`GET /api/admin/mesajlar?durum=yeni|okundu|arsiv` (durum opsiyonel; yoksa hepsi, yeniden eskiye)
- `200 [ { "id": 1, "ad": "", "eposta": "", "telefon": "" | null, "mesaj": "", "durum": "yeni|okundu|arsiv", "olusturma": "2026-01-01T12:00:00.000Z" } ]`
- Geçersiz durum: `400`.

## 4) Durum güncelle
`PATCH /api/admin/mesajlar/:id` gövde `{ "durum": "yeni|okundu|arsiv" }`
- `200 {"ok": true}`; yoksa `404`; geçersiz durum `400`.

## 5) Sil
`DELETE /api/admin/mesajlar/:id` → `200 {"ok": true}`; yoksa `404`.

## 6) İstatistik
`GET /api/admin/istatistik` → `200 { "toplam": 0, "yeni": 0, "okundu": 0, "arsiv": 0 }`
