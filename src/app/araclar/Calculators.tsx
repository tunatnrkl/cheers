"use client";

import { useId, useState } from "react";
import { bluffBreakEven, icm, outsProbability, potOddsRatio, requiredEquity, spr } from "@/lib/poker/math";
import { parseIcmList } from "@/lib/poker/icmInput";

const pct = (x: number) => `%${(x * 100).toFixed(1).replace(".", ",")}`;
const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Result({ items, note }: { items: [string, string][]; note: string }) {
  return (
    <div aria-live="polite">
      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-soft px-2 py-3">
            <dd className="text-xl font-bold">{v}</dd>
            <dt className="text-xs text-muted">{k}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-xl border border-line p-3 text-sm">
        <strong>Ne anlama geliyor? </strong>
        {note}
      </p>
    </div>
  );
}

function PotOdds() {
  const [pot, setPot] = useState("10");
  const [bet, setBet] = useState("5");
  const p = num(pot);
  const b = num(bet);
  const total = p + b; // rakibin bahsi dahil pot
  const eq = requiredEquity(total, b);
  return (
    <section className="card" id="pot-odds">
      <h2 className="h2">Pot odds ve gerekli equity</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Bahisten önceki pot" value={pot} onChange={setPot} />
        <Field label="Rakibin bahsi" value={bet} onChange={setBet} hint="Görmen gereken miktar" />
      </div>
      {b > 0 ? (
        <Result
          items={[
            ["Gerekli equity", pct(eq)],
            ["Pot odds", `${potOddsRatio(total, b).toFixed(1).replace(".", ",")} : 1`],
            ["Rakibin blöfü için gereken fold", pct(bluffBreakEven(p, b))],
            ["Call sonrası pot", String(total + b)],
          ]}
          note={`Elinin kazanma ihtimali ${pct(eq)} değerinden yüksekse call uzun vadede kârlıdır; düşükse fold. Rakip bu bahsi blöf olarak yapıyorsa, senin ${pct(bluffBreakEven(p, b))} oranından sık fold etmen ona otomatik kâr sağlar.`}
        />
      ) : (
        <p className="mt-3 text-sm text-muted">Hesap için rakibin bahsini gir.</p>
      )}
    </section>
  );
}

function Outs() {
  const [outs, setOuts] = useState("9");
  const [street, setStreet] = useState<"flop" | "turn">("flop");
  const o = Math.min(20, Math.round(num(outs)));
  const r = outsProbability(o, street);
  return (
    <section className="card" id="outs">
      <h2 className="h2">Outs'tan yüzde</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Out sayısı" value={outs} onChange={setOuts} hint="Floş çekişi 9, çift uçlu kent 8, gutshot 4" />
        <fieldset>
          <legend className="label">Hangi sokaktasın?</legend>
          <div className="flex gap-2">
            {(["flop", "turn"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={street === s} className={`chip flex-1 justify-center ${street === s ? "chip-on" : ""}`} onClick={() => setStreet(s)}>
                {s === "flop" ? "Flop" : "Turn"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <Result
        items={
          street === "flop"
            ? [["Turn'de tutma", pct(r.nextCard)], ["River'a kadar tutma", pct(r.byRiver)], ["4 kuralı (yaklaşık)", pct(r.rule)], ["Kabaca", `${(1 / r.byRiver).toFixed(1).replace(".", ",")} elde 1`]]
            : [["River'da tutma", pct(r.byRiver)], ["2 kuralı (yaklaşık)", pct(r.rule)]]
        }
        note={
          street === "flop"
            ? `“River'a kadar” yüzdesi (${pct(r.byRiver)}) yalnızca iki kartı da bedavaya ya da tek bir bahisle görebileceksen geçerlidir. Rakip turn'de yeniden bahis yapacaksa call kararını “turn'de tutma” yüzdesiyle (${pct(r.nextCard)}) ver. Bu sayıyı pot odds'taki gerekli equity ile karşılaştır.`
            : `Tek kart kaldı: ${o} out ile river'da tutma ihtimalin ${pct(r.byRiver)}. Pot odds'un istediği equity bundan yüksekse, yalnızca tuttuğunda ek chip kazanabileceksen (implied odds) call düşünülür.`
        }
      />
    </section>
  );
}

function Spr() {
  const [hero, setHero] = useState("100");
  const [villain, setVillain] = useState("60");
  const [pot, setPot] = useState("7");
  const r = spr(num(hero), num(villain), num(pot));
  const band =
    r.spr <= 3
      ? "Düşük SPR: top pair ya da overpair ile tüm stack'i ortaya koymak genelde rahattır; çekişlerin implied odds'u azdır."
      : r.spr <= 8
        ? "Orta SPR: top pair iyi bir eldir ama üç sokak büyük bahis için genelde iki per ve üstü istenir. Pot kontrolü önem kazanır."
        : "Yüksek SPR: tek per büyük potları nadiren kazanır. Set, kent, floş gibi güçlü eller ve onlara dönüşebilecek çekişler değer kazanır.";
  return (
    <section className="card" id="spr">
      <h2 className="h2">Efektif stack ve SPR</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Field label="Senin stack'in" value={hero} onChange={setHero} />
        <Field label="Rakibin stack'i" value={villain} onChange={setVillain} />
        <Field label="Flop'taki pot" value={pot} onChange={setPot} />
      </div>
      {num(pot) > 0 ? (
        <Result
          items={[
            ["Efektif stack", String(r.effective)],
            ["SPR", r.spr.toFixed(1).replace(".", ",")],
          ]}
          note={`Efektif stack, iki stack'ten küçük olanıdır; o elde en fazla bu kadar kazanıp kaybedebilirsin. ${band}`}
        />
      ) : (
        <p className="mt-3 text-sm text-muted">Hesap için flop'taki potu gir.</p>
      )}
    </section>
  );
}

function Icm() {
  const [stacks, setStacks] = useState("5000, 3000, 1500, 500");
  const [payouts, setPayouts] = useState("50, 30, 20");
  // Sıfır ya da sayı olmayan girişler atılır, 9'dan fazlası kesilir; kullanıcı numaraların kaydığını bilmeli (I-1).
  // "5.000" binlik sayılır (I-2). Mantık ve testler: src/lib/poker/icmInput.ts
  const sp = parseIcmList(stacks);
  const pp = parseIcmList(payouts);
  const st = sp.values;
  const pay = pp.values;
  const dropped = sp.dropped;
  const valid = st.length >= 2 && pay.length >= 1;
  const res = valid ? icm(st, pay) : [];
  const totalChips = st.reduce((a, b) => a + b, 0);
  const totalPay = pay.slice(0, st.length).reduce((a, b) => a + b, 0);
  return (
    <section className="card" id="icm">
      <h2 className="h2">Basit ICM</h2>
      <div className="mt-3 grid gap-3">
        <Field label="Stack'ler (virgülle ayır, en fazla 9 oyuncu)" value={stacks} onChange={setStacks} />
        <Field label="Ödüller (1.'den başlayarak)" value={payouts} onChange={setPayouts} hint="Yüzde ya da tutar; birimi sen seçersin" />
      </div>
      {valid ? (
        <div aria-live="polite">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="py-2 font-medium">Oyuncu</th>
                  <th className="py-2 text-right font-medium">Stack</th>
                  <th className="py-2 text-right font-medium">Chip payı</th>
                  <th className="py-2 text-right font-medium">ICM değeri</th>
                  <th className="py-2 text-right font-medium">Ödül payı</th>
                </tr>
              </thead>
              <tbody>
                {st.map((s, i) => (
                  <tr key={i} className="border-b border-line">
                    <td className="py-2">{i + 1}. oyuncu</td>
                    <td className="py-2 text-right">{s}</td>
                    <td className="py-2 text-right">{pct(s / totalChips)}</td>
                    <td className="py-2 text-right font-semibold">{res[i].toFixed(2).replace(".", ",")}</td>
                    <td className="py-2 text-right">{pct(res[i] / totalPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dropped > 0 && (
            <p className="mt-3 text-sm text-muted">
              {dropped} giriş hesaba katılmadı (0 ya da sayı değil); oyuncular kalan stack'lerin sırasıyla numaralandı. Elenen
              oyuncu ICM'ye girmez: onun aldığı ödülü listeden çıkarıp yalnızca kalan ödülleri yaz.
            </p>
          )}
          {sp.truncated + pp.truncated > 0 && (
            <p className="mt-3 text-sm text-muted">
              Hesap makinesi en fazla 9 oyuncu ve 9 ödül alır; fazladan {sp.truncated > 0 ? `${sp.truncated} stack` : ""}
              {sp.truncated > 0 && pp.truncated > 0 ? " ve " : ""}
              {pp.truncated > 0 ? `${pp.truncated} ödül` : ""} hesaba katılmadı.
            </p>
          )}
          {pp.dropped > 0 && (
            <p className="mt-3 text-sm text-muted">
              Ödüllerden {pp.dropped} giriş hesaba katılmadı (0 ya da sayı değil).
            </p>
          )}
          <p className="mt-3 rounded-xl border border-line p-3 text-sm">
            <strong>Ne anlama geliyor? </strong>
            “ICM değeri”, o stack'in ödül havuzundan beklenen payıdır. Büyük stack'in ödül payı chip payından küçük, kısa
            stack'inki büyüktür: chip'ler doğrusal olarak ödüle dönüşmez. Bir all-in'i değerlendirmek için kazandığın ve
            kaybettiğin durumdaki stack'leri ayrı ayrı girip aradaki farka bak; kaybın çoğu zaman kazancından büyük çıkar.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">En az iki stack ve bir ödül gir.</p>
      )}
    </section>
  );
}

export function Calculators() {
  return (
    <>
      <nav aria-label="Hesap makineleri" className="flex flex-wrap gap-2">
        {[
          ["#pot-odds", "Pot odds"],
          ["#outs", "Outs"],
          ["#spr", "SPR"],
          ["#icm", "ICM"],
        ].map(([h, l]) => (
          <a key={h} href={h} className="chip">
            {l}
          </a>
        ))}
      </nav>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <PotOdds />
        <Outs />
        <Spr />
        <Icm />
      </div>
    </>
  );
}
