import numpy as np

from dublaj import ORNEK_HIZI
from dublaj.bolutleyici import Bolutleyici
from dublaj.dil_filtresi import dil_karari, metin_karari
from dublaj.konusmacilar import KonusmaciTakip, Ses, SesHavuzu, ortalama_perde


# ------------------------------------------------------------ dil filtresi

def test_ingilizce_cevrilir():
    assert dil_karari("en", [("en", 0.93), ("tr", 0.01)], 0.6, 0.15).cevir


def test_turkce_atlanir():
    assert not dil_karari("tr", [("tr", 0.88), ("en", 0.05)], 0.6, 0.15).cevir


def test_turkce_supheli_ingilizce_atlanir():
    # Whisper "en" dese bile Türkçe olasılığı yüksekse (karışık konuşma) atla
    assert not dil_karari("en", [("en", 0.62), ("tr", 0.30)], 0.6, 0.15).cevir


def test_emin_olunmayan_ingilizce_atlanir():
    assert not dil_karari("en", [("en", 0.40), ("de", 0.30)], 0.6, 0.15).cevir


def test_baska_dil_atlanir():
    assert not dil_karari("es", [("es", 0.9)], 0.6, 0.15).cevir


def test_metin_kontrolleri():
    assert metin_karari("Get in the car, now!").cevir
    assert not metin_karari("Thank you.").cevir
    assert not metin_karari("   ").cevir
    assert not metin_karari("Abi şuraya gel").cevir
    assert metin_karari("Abi suraya gel", turkce_harf_kontrolu=False).cevir


# ------------------------------------------------------------ ses havuzu

def test_havuz_bitince_perde_kayar():
    h = SesHavuzu([Ses("A"), Ses("B")], [Ses("X")])
    sesler = [h.sonraki("erkek") for _ in range(5)]
    assert [s.isim for s in sesler] == ["A", "B", "A", "B", "A"]
    assert sesler[0].perde == "+0Hz"
    assert sesler[2].perde == "+6Hz"
    assert sesler[4].perde == "-6Hz"
    assert len(set(sesler)) == 5  # hepsi farklı


# ------------------------------------------------------------ konuşmacı takibi

def _iz(seed, gurultu=0.0, rng=None):
    temel = np.random.default_rng(seed).normal(size=192)
    if gurultu:
        temel = temel + (rng or np.random.default_rng()).normal(size=192) * gurultu
    return temel


def test_ayni_konusmaci_ayni_sesi_alir():
    rng = np.random.default_rng(0)
    takip = KonusmaciTakip(SesHavuzu([Ses("A"), Ses("B")], [Ses("X"), Ses("Y")]))
    sira = [1, 2, 1, 3, 2, 1, 3]
    perde = {1: 110.0, 2: 220.0, 3: 130.0}
    sonuc = [takip.bul(_iz(k, 0.5, rng), 2.0, perde[k]) for k in sira]
    nolar = [k.no for k in sonuc]
    assert nolar == [1, 2, 1, 3, 2, 1, 3]
    assert sonuc[0].cinsiyet == "erkek" and sonuc[1].cinsiyet == "kadin"
    assert sonuc[0].ses.isim == "A" and sonuc[3].ses.isim == "B" and sonuc[1].ses.isim == "X"


def test_kisa_parca_yeni_konusmaci_acmaz():
    takip = KonusmaciTakip(SesHavuzu([Ses("A")], [Ses("X")]))
    ilk = takip.bul(_iz(1), 2.0, 110.0)
    kisa = takip.bul(_iz(99), 0.6, 110.0)  # alakasız ama kısa
    assert kisa is ilk and len(takip.konusmacilar) == 1
    assert takip.bul(None, 0.3, None) is ilk


def test_max_konusmaci_siniri():
    takip = KonusmaciTakip(SesHavuzu([Ses("A")], [Ses("X")]), max_konusmaci=3)
    for s in range(10):
        takip.bul(_iz(s), 2.0, 110.0)
    assert len(takip.konusmacilar) == 3


# ------------------------------------------------------------ perde tahmini

def _sesli(f0, sure=1.0):
    t = np.arange(int(ORNEK_HIZI * sure)) / ORNEK_HIZI
    return sum(np.sin(2 * np.pi * f0 * h * t) / h for h in range(1, 6)).astype(np.float32)


def test_perde_tahmini():
    assert abs(ortalama_perde(_sesli(115)) - 115) < 8
    assert abs(ortalama_perde(_sesli(215)) - 215) < 12
    assert ortalama_perde(np.zeros(ORNEK_HIZI, dtype=np.float32)) is None


# ------------------------------------------------------------ bölütleyici

def _enerji_vad(p):
    return 1.0 if np.abs(p).mean() > 0.05 else 0.0


def test_bolutleyici_cumleleri_ayirir():
    b = Bolutleyici(_enerji_vad, min_sessizlik_ms=300, min_konusma_ms=300, max_konusma_s=10)
    sessiz = np.zeros(ORNEK_HIZI, dtype=np.float32)
    akis = np.concatenate([sessiz, _sesli(150, 1.5), sessiz, _sesli(150, 0.1), sessiz, _sesli(200, 2.0), sessiz])
    parcalar = []
    for i in range(0, len(akis), 1600):  # 100 ms'lik parçalarla besle
        parcalar += list(b.ekle(akis[i : i + 1600]))
    parcalar += list(b.bitir())
    assert len(parcalar) == 2  # 0.1 s'lik ses çok kısa, atlandı
    assert 1.5 <= len(parcalar[0]) / ORNEK_HIZI <= 2.0
    assert 2.0 <= len(parcalar[1]) / ORNEK_HIZI <= 2.5


def test_bolutleyici_uzun_konusmayi_boler():
    b = Bolutleyici(_enerji_vad, max_konusma_s=3)
    parcalar = list(b.ekle(_sesli(150, 7.0))) + list(b.bitir())
    assert len(parcalar) == 3
    assert all(len(p) <= 3 * ORNEK_HIZI + 512 for p in parcalar)
