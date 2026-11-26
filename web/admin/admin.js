(function () {
  'use strict';
  var TOKEN_KEY = 'limonca_admin_token';
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = { mesajlar: [], durum: '', arama: '', sirala: 'yeni', secili: null, ilkYuk: true, timer: null, yukleniyor: false };
  var sonSayilar = { toplam: 0, yeni: 0, okundu: 0, arsiv: 0 };
  var DURUM_AD = { yeni: 'Yeni', okundu: 'Okundu', arsiv: 'Arşiv' };

  /* ---------- API ---------- */
  function api(yol, secenek) {
    secenek = secenek || {};
    var h = { 'Content-Type': 'application/json' };
    var t = localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(yol, { method: secenek.method || 'GET', headers: h, body: secenek.body ? JSON.stringify(secenek.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (veri) {
          if (r.status === 401 && !secenek.girisIstegi) { cikis(true); throw new Error('Oturum sona erdi.'); }
          if (!r.ok) throw new Error((veri && veri.hata) || 'İstek başarısız (' + r.status + ').');
          return veri;
        });
      }, function () { throw new Error('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.'); });
  }

  /* ---------- Giriş / çıkış ---------- */
  function goster(girisMi) {
    $('girisEkrani').hidden = !girisMi;
    $('panel').hidden = girisMi;
  }
  function cikis(sureBitti) {
    localStorage.removeItem(TOKEN_KEY);
    clearInterval(state.timer);
    state.mesajlar = []; state.secili = null; state.ilkYuk = true;
    detayKapat();
    goster(true);
    if (sureBitti) {
      var e = $('girisHata'); e.textContent = 'Oturumunuz sona erdi, lütfen tekrar giriş yapın.'; e.hidden = false;
    }
    $('kullanici').focus();
  }
  $('girisForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var k = $('kullanici').value.trim(), s = $('sifre').value, hata = $('girisHata');
    hata.hidden = true;
    if (!k || !s) { hata.textContent = 'Kullanıcı adı ve şifre gerekli.'; hata.hidden = false; return; }
    var b = $('girisBtn'); b.disabled = true; b.textContent = 'Giriş yapılıyor…';
    api('/api/admin/giris', { method: 'POST', body: { kullanici: k, sifre: s }, girisIstegi: true })
      .then(function (v) {
        if (!v || !v.token) throw new Error('Beklenmeyen yanıt.');
        localStorage.setItem(TOKEN_KEY, v.token);
        $('sifre').value = '';
        baslat();
      })
      .catch(function (e) { hata.textContent = e.message; hata.hidden = false; })
      .then(function () { b.disabled = false; b.textContent = 'Giriş yap'; });
  });
  $('cikisBtn').addEventListener('click', function () { cikis(false); });

  function baslat() {
    goster(false);
    yukle();
    clearInterval(state.timer);
    state.timer = setInterval(function () { if (!document.hidden) yukle(true); }, 30000);
  }

  /* ---------- Veri ---------- */
  function yukle(sessiz) {
    if (state.yukleniyor) return;
    state.yukleniyor = true;
    var kap = document.querySelector('.liste-kap');
    if (!sessiz && !state.mesajlar.length) durumGoster('yukle');
    kap.setAttribute('aria-busy', 'true');
    return Promise.all([api('/api/admin/mesajlar'), api('/api/admin/istatistik')])
      .then(function (s) {
        state.mesajlar = Array.isArray(s[0]) ? s[0] : [];
        sayilar(s[1]);
        $('sonYenileme').textContent = 'Son güncelleme: ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (state.secili && !state.mesajlar.some(function (m) { return m.id === state.secili; })) detayKapat();
        ciz();
        if (state.secili) detayDoldur();
      })
      .catch(function (e) {
        if (!$('panel').hidden && (!sessiz || !state.mesajlar.length)) durumGoster('hata', e.message);
      })
      .then(function () { state.yukleniyor = false; kap.setAttribute('aria-busy', 'false'); });
  }
  $('yenileBtn').addEventListener('click', function () { yukle(); });

  /* ---------- İstatistik sayaç ---------- */
  function sayilar(s) {
    ['toplam', 'yeni', 'okundu', 'arsiv'].forEach(function (k) {
      var el = document.querySelector('[data-stat="' + k + '"]');
      var hedef = Number(s && s[k]) || 0, bas = sonSayilar[k];
      sonSayilar[k] = hedef;
      if (reduce || bas === hedef) { el.textContent = hedef; return; }
      var t0 = performance.now(), sure = 700;
      (function adim(t) {
        var p = Math.min(1, (t - t0) / sure), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(bas + (hedef - bas) * e);
        if (p < 1) requestAnimationFrame(adim);
      })(t0);
    });
  }

  /* ---------- Liste ---------- */
  function tarihYaz(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '-';
    return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function durumGoster(tur, metin) {
    var k = $('durumKutu');
    k.className = 'durum-kutu' + (tur === 'hata' ? ' hata' : '');
    k.textContent = '';
    if (tur === 'yukle') {
      var d = document.createElement('div'); d.className = 'donen'; d.setAttribute('aria-hidden', 'true');
      k.appendChild(d); k.appendChild(document.createTextNode('Mesajlar yükleniyor…'));
    } else if (tur === 'hata') {
      var em = document.createElement('span'); em.className = 'emoji'; em.textContent = '⚠️';
      var p = document.createElement('div'); p.textContent = metin || 'Bir hata oluştu.';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn ikincil'; b.textContent = 'Tekrar dene';
      b.addEventListener('click', function () { yukle(); });
      k.appendChild(em); k.appendChild(p); k.appendChild(b);
    } else {
      var e2 = document.createElement('span'); e2.className = 'emoji'; e2.textContent = '🍋';
      k.appendChild(e2); k.appendChild(document.createTextNode(metin));
    }
    k.hidden = false;
    $('tablo').hidden = true;
  }
  function filtreli() {
    var q = state.arama.toLocaleLowerCase('tr-TR');
    var l = state.mesajlar.filter(function (m) {
      if (state.durum && m.durum !== state.durum) return false;
      if (!q) return true;
      return [m.ad, m.eposta, m.mesaj].some(function (a) { return String(a || '').toLocaleLowerCase('tr-TR').indexOf(q) !== -1; });
    });
    l.sort(function (a, b) {
      var f = new Date(a.olusturma) - new Date(b.olusturma);
      return state.sirala === 'eski' ? f : -f;
    });
    return l;
  }
  function ciz() {
    var liste = filtreli(), gv = $('govde');
    gv.textContent = '';
    if (!liste.length) {
      durumGoster('bos', state.mesajlar.length ? 'Filtreyle eşleşen mesaj yok.' : 'Henüz mesaj yok. Formdan gelen mesajlar burada görünecek.');
      return;
    }
    $('durumKutu').hidden = true;
    $('tablo').hidden = false;
    liste.forEach(function (m, i) {
      var tr = document.createElement('tr');
      tr.tabIndex = 0;
      tr.dataset.id = m.id;
      tr.className = (m.durum === 'yeni' ? 'yeni-satir ' : '') + (m.id === state.secili ? 'secili' : '');
      tr.setAttribute('aria-label', m.ad + ' – ' + (DURUM_AD[m.durum] || m.durum) + ' mesaj. Detay için Enter.');
      if (state.ilkYuk) tr.style.animationDelay = Math.min(i, 12) * 30 + 'ms'; else tr.style.animation = 'none';

      var td1 = document.createElement('td'); td1.className = 'gonderen';
      var b = document.createElement('b'); b.textContent = m.ad;
      var sp = document.createElement('span'); sp.textContent = m.eposta;
      td1.appendChild(b); td1.appendChild(sp);
      var td2 = document.createElement('td'); var on = document.createElement('div'); on.className = 'onizle'; on.textContent = m.mesaj; td2.appendChild(on);
      var td3 = document.createElement('td'); var r = document.createElement('span'); r.className = 'rozet ' + m.durum; r.textContent = DURUM_AD[m.durum] || m.durum; td3.appendChild(r);
      var td4 = document.createElement('td'); td4.className = 'tarih'; td4.textContent = tarihYaz(m.olusturma);
      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4);
      gv.appendChild(tr);
    });
    state.ilkYuk = false;
  }
  $('govde').addEventListener('click', function (e) {
    var tr = e.target.closest('tr'); if (tr) ac(Number(tr.dataset.id));
  });
  $('govde').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var tr = e.target.closest('tr'); if (tr) { e.preventDefault(); ac(Number(tr.dataset.id)); }
  });

  document.querySelectorAll('.sekme').forEach(function (b) {
    b.addEventListener('click', function () {
      state.durum = b.dataset.durum;
      document.querySelectorAll('.sekme').forEach(function (x) {
        var a = x === b; x.classList.toggle('aktif', a); x.setAttribute('aria-pressed', a);
      });
      ciz();
    });
  });
  var aramaT;
  $('arama').addEventListener('input', function (e) {
    clearTimeout(aramaT);
    aramaT = setTimeout(function () { state.arama = e.target.value.trim(); ciz(); }, 150);
  });
  $('sirala').addEventListener('change', function (e) { state.sirala = e.target.value; ciz(); });

  /* ---------- Detay ---------- */
  function bul() { return state.mesajlar.filter(function (m) { return m.id === state.secili; })[0]; }
  function ac(id) {
    state.secili = id;
    $('dHata').hidden = true;
    detayDoldur();
    $('detay').hidden = false;
    $('dAd').focus({ preventScroll: false });
    var m = bul();
    if (m && m.durum === 'yeni') durumDegis('okundu', true); // açılınca otomatik okundu
    else ciz();
  }
  function detayDoldur() {
    var m = bul(); if (!m) return;
    $('dAd').textContent = m.ad;
    $('dEposta').textContent = m.eposta;
    $('dTelefon').textContent = m.telefon || '—';
    $('dTarih').textContent = tarihYaz(m.olusturma);
    $('dDurum').textContent = DURUM_AD[m.durum] || m.durum;
    $('dMesaj').textContent = m.mesaj;
    var konu = encodeURIComponent('Mesajınız hakkında – Limonca');
    var govde = encodeURIComponent('Merhaba ' + m.ad + ',\n\n\n\n--- Mesajınız ---\n' + m.mesaj);
    $('dYanit').href = 'mailto:' + m.eposta + '?subject=' + konu + '&body=' + govde;
    $('dOkundu').disabled = m.durum === 'okundu';
    $('dArsiv').disabled = m.durum === 'arsiv';
  }
  function detayKapat() {
    var onceki = state.secili;
    state.secili = null; $('detay').hidden = true; ciz();
    if (onceki) { var tr = document.querySelector('tr[data-id="' + onceki + '"]'); if (tr) tr.focus(); }
  }
  $('detayKapat').addEventListener('click', detayKapat);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('detay').hidden && !$('onay').open) detayKapat();
  });

  function durumDegis(yeniDurum, sessiz) {
    var m = bul(); if (!m) return;
    var eski = m.durum;
    m.durum = yeniDurum; // iyimser güncelleme
    ciz(); detayDoldur();
    return api('/api/admin/mesajlar/' + m.id, { method: 'PATCH', body: { durum: yeniDurum } })
      .then(function () { return api('/api/admin/istatistik').then(sayilar); })
      .catch(function (e) {
        m.durum = eski; ciz(); detayDoldur();
        $('dHata').textContent = 'İşlem başarısız: ' + e.message; $('dHata').hidden = false;
      });
  }
  $('dOkundu').addEventListener('click', function () { $('dHata').hidden = true; durumDegis('okundu'); });
  $('dArsiv').addEventListener('click', function () { $('dHata').hidden = true; durumDegis('arsiv'); });

  $('dSil').addEventListener('click', function () {
    var m = bul(); if (!m) return;
    $('onayMetin').textContent = m.ad + ' kişisinin mesajı kalıcı olarak silinecek. Bu işlem geri alınamaz.';
    $('onay').returnValue = '';
    $('onay').showModal();
    $('onayIptal').focus();
  });
  $('onay').addEventListener('close', function () {
    if ($('onay').returnValue !== 'tamam') return;
    var m = bul(); if (!m) return;
    api('/api/admin/mesajlar/' + m.id, { method: 'DELETE' })
      .then(function () {
        state.mesajlar = state.mesajlar.filter(function (x) { return x.id !== m.id; });
        detayKapat();
        return api('/api/admin/istatistik').then(sayilar);
      })
      .catch(function (e) { $('dHata').textContent = 'Silinemedi: ' + e.message; $('dHata').hidden = false; });
    $('onay').returnValue = '';
  });

  /* ---------- Başlangıç ---------- */
  if (localStorage.getItem(TOKEN_KEY)) baslat(); else { goster(true); $('kullanici').focus(); }
})();
