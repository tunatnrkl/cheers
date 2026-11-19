"""Sürekli ses akışını konuşma parçalarına (cümlelere) böler."""

from __future__ import annotations

from collections import deque
from typing import Callable, Iterator

import numpy as np

from . import ORNEK_HIZI

PARCA = 512  # Silero VAD 16 kHz'de 512 örneklik parçalar ister (32 ms)


class Bolutleyici:
    """Konuşma olasılığı veren bir fonksiyonla (VAD) sesi cümlelere ayırır."""

    def __init__(
        self,
        olasilik: Callable[[np.ndarray], float],
        esik: float = 0.5,
        min_sessizlik_ms: int = 450,
        min_konusma_ms: int = 400,
        max_konusma_s: float = 12,
        on_dolgu_ms: int = 200,
    ):
        self.olasilik = olasilik
        self.esik = esik
        self.bitis_esigi = max(esik - 0.15, 0.05)
        ms = ORNEK_HIZI / 1000
        self.sessizlik_parca = max(1, int(min_sessizlik_ms * ms / PARCA))
        self.min_ornek = int(min_konusma_ms * ms)
        self.max_ornek = int(max_konusma_s * ORNEK_HIZI)
        self._on = deque(maxlen=max(1, int(on_dolgu_ms * ms / PARCA)))
        self._artik = np.zeros(0, dtype=np.float32)
        self._aktif: list[np.ndarray] = []
        self._sessiz = 0
        self._konusma = 0  # dolgu hariç, gerçekten konuşma olan parça sayısı

    def ekle(self, ses: np.ndarray) -> Iterator[np.ndarray]:
        """16 kHz mono ses ekler; tamamlanan konuşma parçalarını üretir."""
        veri = np.concatenate([self._artik, ses.astype(np.float32)])
        n = len(veri) // PARCA * PARCA
        self._artik = veri[n:]
        for i in range(0, n, PARCA):
            yield from self._isle(veri[i : i + PARCA])

    def _isle(self, parca: np.ndarray) -> Iterator[np.ndarray]:
        p = self.olasilik(parca)
        if not self._aktif:
            if p >= self.esik:
                self._aktif = list(self._on) + [parca]
                self._sessiz = 0
                self._konusma = 1
            else:
                self._on.append(parca)
            return

        self._aktif.append(parca)
        if p < self.bitis_esigi:
            self._sessiz += 1
        else:
            self._sessiz = 0
            self._konusma += 1
        uzunluk = len(self._aktif) * PARCA
        if self._sessiz >= self.sessizlik_parca or uzunluk >= self.max_ornek:
            parcalar = self._aktif
            if self._sessiz >= self.sessizlik_parca:
                # sondaki sessizliğin çoğunu at
                parcalar = parcalar[: len(parcalar) - self._sessiz + 2]
            self._aktif = []
            self._sessiz = 0
            self._on.clear()
            yeterli = self._konusma * PARCA >= self.min_ornek
            self._konusma = 0
            if yeterli:
                yield np.concatenate(parcalar)

    def bitir(self) -> Iterator[np.ndarray]:
        if self._aktif:
            parcalar, self._aktif = self._aktif, []
            if self._konusma * PARCA >= self.min_ornek:
                yield np.concatenate(parcalar)
            self._konusma = 0


def silero_olasilik() -> Callable[[np.ndarray], float]:
    import torch
    from silero_vad import load_silero_vad

    model = load_silero_vad()

    def f(parca: np.ndarray) -> float:
        with torch.no_grad():
            return float(model(torch.from_numpy(parca), ORNEK_HIZI).item())

    return f
