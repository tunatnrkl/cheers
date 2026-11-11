"use client";

import { useEffect, useSyncExternalStore } from "react";
import { HAND_BY_ID, type Topic } from "@/data/hands";
import { STATIC_SITE } from "./env";
import { collectPages, rankTopics, topicTotals, type Page, type TopicStat, type TopicTotal } from "./progressData";

// İlerleme deposu. Giriş yapılmışsa veriler REST API üzerinden PostgreSQL'de,
// misafir kullanımda tarayıcının localStorage'ında tutulur. Bileşenler farkı bilmez.

export type Attempt = { handId: string; chosen: number; correct: boolean; topic: Topic; at: string };
export type Saved = { handId: string; note: string; at: string };
export type User = { id: string; email: string; displayName: string | null };

type State = {
  ready: boolean;
  user: User | null;
  accounts: boolean; // sunucuda hesap sistemi (veritabanı) açık mı
  google: boolean;
  attempts: Attempt[];
  // Sunucudaki tüm cevapların toplamı. `attempts` listesi 5000'de kesilir; toplam kesilmez (G-1).
  // Misafirde null: liste tarayıcıdakinin tamamıdır.
  totals: { total: number; ok: number } | null;
  // Sunucudaki tüm cevapların konu bazında toplamı (G-2). Misafirde null.
  topics: TopicTotal[] | null;
  saved: Saved[];
};

const LS_ATTEMPTS = "pd-cevaplar";
const LS_SAVED = "pd-kayitli";

let state: State = { ready: false, user: null, accounts: false, google: false, attempts: [], totals: null, topics: null, saved: [] };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function readLocal<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Bir şeyler ters gitti. Yeniden dener misin?");
  return data as T;
}

export async function refresh(): Promise<void> {
  let me = { user: null as User | null, accounts: false, google: false };
  try {
    if (!STATIC_SITE) me = await api("/api/auth/me");
  } catch {}
  if (me.user) {
    try {
      const [a, s] = await Promise.all([
        api<{ attempts: Attempt[]; totals?: { total: number; ok: number }; topics?: TopicTotal[] }>("/api/attempts"),
        api<{ saved: Saved[] }>("/api/saved"),
      ]);
      set({ ...me, ready: true, attempts: a.attempts, totals: a.totals ?? null, topics: a.topics ?? null, saved: s.saved });
      return;
    } catch {}
  }
  set({ ...me, ready: true, attempts: readLocal<Attempt>(LS_ATTEMPTS), totals: null, topics: null, saved: readLocal<Saved>(LS_SAVED) });
}

export function useProgress(): State {
  useEffect(() => {
    loading ??= refresh();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export async function addAttempt(handId: string, chosen: number): Promise<void> {
  const hand = HAND_BY_ID.get(handId);
  if (!hand) return;
  const item: Attempt = {
    handId,
    chosen,
    correct: chosen === hand.correct,
    topic: hand.topic,
    at: new Date().toISOString(),
  };
  const attempts = [item, ...state.attempts];
  const t = state.totals;
  const ok = item.correct ? 1 : 0;
  const topics =
    state.topics &&
    (state.topics.some((r) => r.topic === item.topic)
      ? state.topics.map((r) => (r.topic === item.topic ? { ...r, total: r.total + 1, ok: r.ok + ok } : r))
      : [...state.topics, { topic: item.topic, total: 1, ok }]);
  set({ attempts, totals: t && { total: t.total + 1, ok: t.ok + ok }, topics });
  if (state.user) {
    await api("/api/attempts", { method: "POST", body: JSON.stringify({ items: [{ handId, chosen }] }) }).catch(() => {});
  } else {
    writeLocal(LS_ATTEMPTS, attempts.slice(0, 2000));
  }
}

export async function saveHand(handId: string, note: string): Promise<void> {
  const saved = [{ handId, note, at: new Date().toISOString() }, ...state.saved.filter((s) => s.handId !== handId)];
  set({ saved });
  if (state.user) await api("/api/saved", { method: "PUT", body: JSON.stringify({ handId, note }) });
  else writeLocal(LS_SAVED, saved);
}

export async function unsaveHand(handId: string): Promise<void> {
  const saved = state.saved.filter((s) => s.handId !== handId);
  set({ saved });
  if (state.user) await api(`/api/saved?handId=${encodeURIComponent(handId)}`, { method: "DELETE" });
  else writeLocal(LS_SAVED, saved);
}

/** Giriş ya da kayıt. Başarılıysa misafirken biriken veriler hesaba taşınır. */
export async function signIn(mode: "login" | "register", body: Record<string, unknown>): Promise<void> {
  await api(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
  await migrateLocal();
  await refresh();
}

export async function migrateLocal(): Promise<void> {
  const attempts = readLocal<Attempt>(LS_ATTEMPTS);
  const saved = readLocal<Saved>(LS_SAVED);
  try {
    for (let i = 0; i < attempts.length; i += 400) {
      const items = attempts.slice(i, i + 400).map(({ handId, chosen, at }) => ({ handId, chosen, at }));
      await api("/api/attempts", { method: "POST", body: JSON.stringify({ items }) });
    }
    for (const s of saved) {
      await api("/api/saved", { method: "PUT", body: JSON.stringify({ handId: s.handId, note: s.note }) });
    }
    localStorage.removeItem(LS_ATTEMPTS);
    localStorage.removeItem(LS_SAVED);
  } catch {}
}

export async function signOut(): Promise<void> {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  await refresh();
}

export async function deleteAccount(): Promise<void> {
  await api("/api/auth/me", { method: "DELETE", body: "{}" });
  await refresh();
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(LS_ATTEMPTS);
    localStorage.removeItem(LS_SAVED);
  } catch {}
  if (!state.user) set({ attempts: [], totals: null, topics: null, saved: [] });
}

// ───────────── İstatistik ─────────────
export type { TopicStat };

export function topicStats(attempts: { topic: Topic; correct: boolean }[]): TopicStat[] {
  return rankTopics(topicTotals(attempts));
}

/**
 * Dışa aktarma için cevapların tamamı. Üyede sunucudan sayfa sayfa okunur (G-2);
 * misafirde tarayıcıdaki liste zaten tamdır.
 */
export async function allAttempts(): Promise<Attempt[]> {
  if (!state.user) return state.attempts;
  return collectPages((before) =>
    api<Page<Attempt>>(`/api/attempts/export${before ? `?before=${encodeURIComponent(before)}` : ""}`),
  );
}

/** Zayıf konu: en az 2 soru çözülmüş ve doğruluk %60'ın altında. */
export function weakTopics(stats: TopicStat[]): TopicStat[] {
  return stats.filter((s) => s.total >= 2 && s.rate < 0.6);
}
