"""GTA Dublaj - komut satırı girişi.

Kullanım:
    python -m dublaj                     # config.toml ile canlı dublaj
    python -m dublaj --cihazlar          # ses cihazlarını listele
    python -m dublaj --dosya ornek.mp3   # bir kayıt üzerinde dene
"""

from __future__ import annotations

import argparse
import queue
import sys
import threading
import time
import tomllib
import wave
from pathlib import Path

import numpy as np

from . import ORNEK_HIZI

RENKLER = ["\033[96m", "\033[93m", "\033[95m", "\033[92m", "\033[94m", "\033[91m"]
SIFIRLA = "\033[0m"
SOLUK = "\033[90m"


def ayar_yukle(yol: Path) -> dict:
    with open(yol, "rb") as f:
        return tomllib.load(f)


class DosyayaYazici:
    """--kaydet ile: dublajı hoparlöre değil bir WAV dosyasına yazar."""

    def __init__(self, yol: str, hiz: int):
        self.yol, self.hiz, self.parcalar = yol, hiz, []
        self.caliyor = threading.Event()

    def baslat(self): ...

    def bekleyen(self) -> int:
        return 0

    def ekle(self, ses: np.ndarray):
        self.parcalar.append(ses)
        self.parcalar.append(np.zeros(int(self.hiz * 0.3), dtype=np.float32))

    def durdur(self):
        ses = np.concatenate(self.parcalar) if self.parcalar else np.zeros(1, dtype=np.float32)
        with wave.open(self.yol, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(self.hiz)
            w.writeframes((np.clip(ses, -1, 1) * 32767).astype(np.int16).tobytes())
        print(f"Dublaj kaydedildi: {self.yol}")


def main() -> None:
    if sys.platform == "win32":
        import os

        os.system("")  # Windows konsolunda renkleri aç
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    ap = argparse.ArgumentParser(prog="dublaj", description="GTA için canlı İngilizce→Türkçe dublaj")
    ap.add_argument("--ayar", default=str(Path(__file__).resolve().parent.parent / "config.toml"))
    ap.add_argument("--cihazlar", action="store_true", help="ses cihazlarını listele ve çık")
    ap.add_argument("--dosya", help="canlı ses yerine bu ses dosyasını kullan (test için)")
    ap.add_argument("--hizli", action="store_true", help="--dosya'yı gerçek zamanlı değil, hızlı işle")
    ap.add_argument("--kaydet", help="dublajı çalmak yerine bu WAV dosyasına yaz")
    ap.add_argument("--sessiz", action="store_true", help="atlanan (Türkçe vb.) konuşmaları gösterme")
    args = ap.parse_args()

    from .ses_cihazlari import Calici, Yakalayici, cihazlari_yazdir, dosyadan_besle

    if args.cihazlar:
        cihazlari_yazdir()
        return

    ayar = ayar_yukle(Path(args.ayar))
    print("Modeller yükleniyor (ilk açılışta indirilir, birkaç dakika sürebilir)...")

    from .bolutleyici import Bolutleyici, silero_olasilik
    from .konusmacilar import KonusmaciTakip, Ses, SesHavuzu, SesIziCikarici, ortalama_perde
    from .modeller import Ceviri, Tanima, cuda_var_mi
    from .seslendirme import TTS_HIZI, Seslendirici

    vad = ayar["konusma_algilama"]
    bolutleyici = Bolutleyici(
        silero_olasilik(),
        esik=vad["esik"],
        min_sessizlik_ms=vad["min_sessizlik_ms"],
        min_konusma_ms=vad["min_konusma_ms"],
        max_konusma_s=vad["max_konusma_s"],
        on_dolgu_ms=vad["on_dolgu_ms"],
    )
    t = ayar["tanima"]
    tanima = Tanima(t["model"], t["cihaz"], t["hesap_tipi"], t["beam_size"], ayar["dil_filtresi"])
    print(f"  Konuşma tanıma: whisper-{t['model']} ({tanima.cihaz})")
    c = ayar["ceviri"]
    ceviri = Ceviri(c["model"], c["cihaz"])
    print(f"  Çeviri: {c['model']} ({ceviri.cihaz})")
    iz_cikarici = SesIziCikarici("cuda" if cuda_var_mi() else "cpu")
    print("  Konuşmacı ayırt etme: ECAPA-TDNN")

    d = ayar["dublaj"]
    havuz = SesHavuzu(
        [Ses(*s) for s in d["erkek_sesleri"]], [Ses(*s) for s in d["kadin_sesleri"]]
    )
    k = ayar["konusmaci"]
    takip = KonusmaciTakip(
        havuz, k["benzerlik_esigi"], k["max_konusmaci"], k["min_sure_s"], k["erkek_perde_siniri"]
    )
    seslendirici = Seslendirici(d["yedek_erkek"], d["yedek_kadin"])

    cikis = ayar["ses_cikisi"]
    if args.kaydet:
        calici = DosyayaYazici(args.kaydet, TTS_HIZI)
    else:
        calici = Calici(cikis["cihaz"], cikis["ses_seviyesi"], cikis["max_bekleyen"], TTS_HIZI)
    calici.baslat()

    ham: queue.Queue[np.ndarray | None] = queue.Queue()
    cumleler: queue.Queue[np.ndarray | None] = queue.Queue()

    def bolutle():
        while (veri := ham.get()) is not None:
            for s in bolutleyici.ekle(veri):
                cumleler.put(s)
        for s in bolutleyici.bitir():
            cumleler.put(s)
        cumleler.put(None)

    def isle():
        while (ses := cumleler.get()) is not None:
            try:
                tek_cumle(ses)
            except Exception as e:  # tek bir cümle hatası her şeyi durdurmasın
                print(f"{SOLUK}[hata] {type(e).__name__}: {e}{SIFIRLA}")

    def tek_cumle(ses: np.ndarray):
        bas = time.perf_counter()
        sure = len(ses) / ORNEK_HIZI
        sonuc = tanima.tani(ses)
        if not sonuc.karar.cevir:
            if not args.sessiz:
                ek = f' "{sonuc.metin}"' if sonuc.metin else ""
                print(f"{SOLUK}  ({sure:.1f}s) {sonuc.karar.sebep}{ek}{SIFIRLA}")
            return
        konusmaci = takip.bul(
            iz_cikarici(ses) if sure >= 0.5 else None, sure, ortalama_perde(ses)
        )
        turkce = ceviri.cevir(sonuc.metin)
        # Dublaj geride kalıyorsa biraz hızlı konuştur
        hiz_ek = min(25, 10 * calici.bekleyen())
        dublaj = seslendirici.seslendir(turkce, konusmaci.ses, konusmaci.cinsiyet, hiz_ek)
        calici.ekle(dublaj)
        renk = RENKLER[(konusmaci.no - 1) % len(RENKLER)]
        isaret = "♂" if konusmaci.cinsiyet == "erkek" else "♀"
        gecikme = time.perf_counter() - bas
        print(
            f"{renk}[Karakter {konusmaci.no} {isaret}]{SIFIRLA} {SOLUK}{sonuc.metin}{SIFIRLA}\n"
            f"   → {turkce}  {SOLUK}({konusmaci.ses.isim} {konusmaci.ses.perde}, {gecikme:.1f}s){SIFIRLA}"
        )

    t_bol = threading.Thread(target=bolutle, daemon=True)
    t_isle = threading.Thread(target=isle, daemon=True)
    t_bol.start()
    t_isle.start()

    try:
        if args.dosya:
            print(f"\nDosya işleniyor: {args.dosya}\n")
            dosyadan_besle(args.dosya, ham.put, gercek_zamanli=not args.hizli)
            ham.put(None)
            t_isle.join()
        else:
            g = ayar["ses_girisi"]
            son_ses = [time.monotonic()]

            def gelen(veri):
                son_ses[0] = time.monotonic()
                ham.put(veri)

            yakalayici = Yakalayici(g["mod"], g["cihaz"], gelen)
            yakalayici.baslat()
            print(f"\nDinleniyor → {yakalayici.aciklama}")
            print("Sürekli açık. Sadece İngilizce konuşmalar Türkçe'ye çevrilir. Çıkmak için Ctrl+C.\n")
            try:
                while t_isle.is_alive():
                    time.sleep(1)
                    # Cihaz koparsa / ses akışı durursa kendini yeniden başlatsın
                    if time.monotonic() - son_ses[0] > 5:
                        print(f"{SOLUK}[ses gelmiyor, dinleme yeniden başlatılıyor]{SIFIRLA}")
                        try:
                            yakalayici.durdur()
                        except Exception:
                            pass
                        try:
                            yakalayici = Yakalayici(g["mod"], g["cihaz"], gelen)
                            yakalayici.baslat()
                        except BaseException as e:
                            if isinstance(e, KeyboardInterrupt):
                                raise
                            print(f"{SOLUK}[cihaz bulunamadı, tekrar denenecek]{SIFIRLA}")
                        son_ses[0] = time.monotonic()
            finally:
                yakalayici.durdur()
    except KeyboardInterrupt:
        print("\nKapatılıyor...")
    finally:
        if args.dosya:
            # Kalan dublajların çalınması bitsin
            while calici.bekleyen() or calici.caliyor.is_set():
                time.sleep(0.2)
        calici.durdur()


if __name__ == "__main__":
    main()
