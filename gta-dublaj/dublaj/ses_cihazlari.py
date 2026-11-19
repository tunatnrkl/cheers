"""Ses yakalama (oyun sesi) ve çalma (dublaj) işlemleri."""

from __future__ import annotations

import queue
import sys
import threading
import time
from math import gcd
from typing import Callable

import numpy as np

from . import ORNEK_HIZI

WINDOWS = sys.platform == "win32"


def yeniden_ornekle(ses: np.ndarray, kaynak: int, hedef: int) -> np.ndarray:
    if kaynak == hedef:
        return ses.astype(np.float32)
    from scipy.signal import resample_poly

    g = gcd(kaynak, hedef)
    return resample_poly(ses, hedef // g, kaynak // g).astype(np.float32)


def mono(veri: np.ndarray, kanal: int) -> np.ndarray:
    if kanal <= 1:
        return veri.reshape(-1)
    return veri.reshape(-1, kanal).mean(axis=1)


# ---------------------------------------------------------------- listeleme

def cihazlari_yazdir() -> None:
    import sounddevice as sd

    print("\n=== Çıkış cihazları (dublajın çalınacağı yer: [ses_cikisi] cihaz) ===")
    for i, d in enumerate(sd.query_devices()):
        if d["max_output_channels"] > 0:
            print(f"  [{i}] {d['name']}")
    print("\n=== Mikrofonlar / giriş cihazları ([ses_girisi] mod = \"mikrofon\") ===")
    for i, d in enumerate(sd.query_devices()):
        if d["max_input_channels"] > 0:
            print(f"  [{i}] {d['name']}")
    if WINDOWS:
        import pyaudiowpatch as pyaudio

        p = pyaudio.PyAudio()
        try:
            print("\n=== Loopback kaynakları ([ses_girisi] mod = \"loopback\") ===")
            for d in p.get_loopback_device_info_generator():
                print(f"  {d['name'].replace(' [Loopback]', '')}")
        finally:
            p.terminate()
    print()


# ---------------------------------------------------------------- yakalama

class Yakalayici:
    """Oyun sesini yakalar ve 16 kHz mono parçalar halinde geri çağırıma verir."""

    def __init__(self, mod: str, cihaz_adi: str, geri_cagir: Callable[[np.ndarray], None]):
        self.mod = mod
        self.cihaz_adi = cihaz_adi.strip()
        self.geri_cagir = geri_cagir
        self._kapat: Callable[[], None] | None = None
        self.aciklama = ""

    def baslat(self) -> None:
        if self.mod == "loopback":
            if not WINDOWS:
                raise SystemExit(
                    "Loopback modu sadece Windows'ta çalışır. config.toml'da mod = \"mikrofon\" kullanın."
                )
            self._loopback_baslat()
        elif self.mod in ("mikrofon", "giris"):
            self._giris_baslat()
        else:
            raise SystemExit(f"Bilinmeyen ses_girisi.mod: {self.mod!r} (mikrofon veya loopback olmalı)")

    def _loopback_baslat(self) -> None:
        import pyaudiowpatch as pyaudio

        p = pyaudio.PyAudio()
        wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
        hedef = self.cihaz_adi.lower()
        if not hedef:
            hedef = p.get_device_info_by_index(wasapi["defaultOutputDevice"])["name"].lower()
        secilen = None
        for d in p.get_loopback_device_info_generator():
            if hedef in d["name"].lower():
                secilen = d
                break
        if secilen is None:
            p.terminate()
            raise SystemExit(
                f"'{self.cihaz_adi or hedef}' için loopback cihazı bulunamadı. "
                "Liste için: python -m dublaj --cihazlar"
            )
        kanal = int(secilen["maxInputChannels"])
        hiz = int(secilen["defaultSampleRate"])

        def cb(in_data, frame_count, time_info, status):
            veri = np.frombuffer(in_data, dtype=np.float32)
            self.geri_cagir(yeniden_ornekle(mono(veri, kanal), hiz, ORNEK_HIZI))
            return (None, pyaudio.paContinue)

        akis = p.open(
            format=pyaudio.paFloat32,
            channels=kanal,
            rate=hiz,
            input=True,
            input_device_index=secilen["index"],
            frames_per_buffer=int(hiz * 0.1),
            stream_callback=cb,
        )
        akis.start_stream()
        self.aciklama = f"loopback: {secilen['name']}"

        def kapat():
            akis.stop_stream()
            akis.close()
            p.terminate()

        self._kapat = kapat

    def _giris_baslat(self) -> None:
        import sounddevice as sd

        cihaz = cihaz_bul(self.cihaz_adi, giris=True)
        bilgi = sd.query_devices(cihaz, "input")
        hiz = int(bilgi["default_samplerate"])
        kanal = min(2, int(bilgi["max_input_channels"]))

        def cb(veri, frames, time_info, status):
            self.geri_cagir(yeniden_ornekle(mono(veri.copy(), kanal), hiz, ORNEK_HIZI))

        akis = sd.InputStream(
            device=cihaz, channels=kanal, samplerate=hiz, dtype="float32",
            blocksize=int(hiz * 0.1), callback=cb,
        )
        akis.start()
        self.aciklama = f"giriş: {bilgi['name']}"
        self._kapat = lambda: (akis.stop(), akis.close())

    def durdur(self) -> None:
        if self._kapat:
            self._kapat()
            self._kapat = None


def dosyadan_besle(yol: str, geri_cagir: Callable[[np.ndarray], None], gercek_zamanli: bool) -> None:
    """Test için: bir ses dosyasını sanki oyundan geliyormuş gibi akıtır."""
    import miniaudio

    c = miniaudio.decode_file(
        yol, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=ORNEK_HIZI
    )
    ses = np.asarray(c.samples, dtype=np.float32)
    adim = ORNEK_HIZI // 10
    for i in range(0, len(ses), adim):
        geri_cagir(ses[i : i + adim])
        if gercek_zamanli:
            time.sleep(0.1)
    geri_cagir(np.zeros(ORNEK_HIZI, dtype=np.float32))  # son cümle kapansın


def cihaz_bul(ad: str, giris: bool) -> int | None:
    import sounddevice as sd

    if not ad:
        return None
    anahtar = "max_input_channels" if giris else "max_output_channels"
    for i, d in enumerate(sd.query_devices()):
        if d[anahtar] > 0 and ad.lower() in d["name"].lower():
            return i
    raise SystemExit(f"'{ad}' adlı cihaz bulunamadı. Liste için: python -m dublaj --cihazlar")


# ---------------------------------------------------------------- çalma

class Calici:
    """Dublaj seslerini sırayla çalar. Kuyruk uzarsa eski replikleri atlar."""

    def __init__(self, cihaz_adi: str, ses_seviyesi: float, max_bekleyen: int, hiz: int):
        self.cihaz = cihaz_bul(cihaz_adi, giris=False)
        self.seviye = ses_seviyesi
        self.max_bekleyen = max_bekleyen
        self.hiz = hiz
        self.kuyruk: queue.Queue[np.ndarray | None] = queue.Queue()
        self.caliyor = threading.Event()
        self._is = threading.Thread(target=self._dongu, daemon=True)

    def baslat(self) -> None:
        self._is.start()

    def bekleyen(self) -> int:
        return self.kuyruk.qsize()

    def ekle(self, ses: np.ndarray) -> None:
        while self.kuyruk.qsize() >= self.max_bekleyen:
            try:
                self.kuyruk.get_nowait()
            except queue.Empty:
                break
        self.kuyruk.put(ses)

    def durdur(self) -> None:
        self.kuyruk.put(None)
        self._is.join(timeout=5)

    def _dongu(self) -> None:
        import sounddevice as sd

        with sd.OutputStream(device=self.cihaz, samplerate=self.hiz, channels=1, dtype="float32") as akis:
            while True:
                ses = self.kuyruk.get()
                if ses is None:
                    return
                self.caliyor.set()
                try:
                    akis.write(np.clip(ses * self.seviye, -1, 1).reshape(-1, 1).astype(np.float32))
                finally:
                    if self.kuyruk.empty():
                        self.caliyor.clear()
