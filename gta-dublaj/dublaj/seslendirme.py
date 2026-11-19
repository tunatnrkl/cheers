"""Türkçe metni Edge TTS ile seslendirir."""

from __future__ import annotations

import asyncio

import numpy as np

from .konusmacilar import Ses

TTS_HIZI = 24000


async def _sentezle(metin: str, ses: Ses) -> bytes:
    import edge_tts

    iletisim = edge_tts.Communicate(metin, ses.isim, rate=ses.hiz, pitch=ses.perde)
    veri = bytearray()
    async for parca in iletisim.stream():
        if parca["type"] == "audio":
            veri.extend(parca["data"])
    if not veri:
        raise RuntimeError(f"{ses.isim} ses üretmedi")
    return bytes(veri)


def _coz(mp3: bytes) -> np.ndarray:
    import miniaudio

    cozulmus = miniaudio.decode(
        mp3, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=TTS_HIZI
    )
    return np.asarray(cozulmus.samples, dtype=np.float32)


class Seslendirici:
    def __init__(self, yedek_erkek: str, yedek_kadin: str):
        self.yedek = {"erkek": yedek_erkek, "kadin": yedek_kadin}
        self._bozuk: set[str] = set()

    def seslendir(self, metin: str, ses: Ses, cinsiyet: str, hiz_ek: int = 0) -> np.ndarray:
        """Metni seslendirir; ses bozuksa yedek Türkçe sese düşer. Çıktı 24 kHz mono float32."""
        if hiz_ek:
            hiz = int(ses.hiz.replace("%", "")) + hiz_ek
            ses = Ses(ses.isim, ses.perde, f"{hiz:+d}%")
        if ses.isim in self._bozuk:
            ses = Ses(self.yedek[cinsiyet], ses.perde, ses.hiz)
        try:
            return _coz(asyncio.run(_sentezle(metin, ses)))
        except Exception:
            yedek = self.yedek[cinsiyet]
            if ses.isim == yedek:
                raise
            self._bozuk.add(ses.isim)
            return _coz(asyncio.run(_sentezle(metin, Ses(yedek, ses.perde, ses.hiz))))
