"use client";

import { type ReactNode, useId, useState } from "react";
import { Alan, Hap, Kart, NotKutusu, Tablo, hapSinifi } from "@/components/ui";
import { bluffBreakEven, icm, outsProbability, potOddsRatio, requiredEquity, spr } from "@/lib/poker/math";

const pct = (x: number) => `%${(x * 100).toFixed(1).replace(".", ",")}`;
const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const id = useId();
  return <Alan id={id} etiket={label} yardim={hint} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />;
}

function Not({ children }: { children: ReactNode }) {
  return (
    <NotKutusu className="mt-3">
      <strong>Ne anlama geliyor? </strong>
      {children}
    </NotKutusu>
  );
}

function Result({ items, note }: { items: [string, string][]; note: string }) {
  return (
    <div aria-live="polite">
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {items.map(([k, v]) => (
          <div key={k} className="olcu">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <Not>{note}</Not>
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
    <Kart id="pot-odds" baslik="Pot odds ve gerekli equity" baslikId="pot-odds-baslik">
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
    </Kart>
  );
}

function Outs() {
  const [outs, setOuts] = useState("9");
  const [street, setStreet] = useState<"flop" | "turn">("flop");
  const o = Math.min(20, Math.round(num(outs)));
  const r = outsProbability(o, street);
  return (
    <Kart id="outs" baslik="Outs'tan yüzde" baslikId="outs-baslik">
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Out sayısı" value={outs} onChange={setOuts} hint="Floş çekişi 9, çift uçlu kent 8, gutshot 4" />
        <fieldset>
          <legend className="label">Hangi sokaktasın?</legend>
          <div className="flex gap-2">
            {(["flop", "turn"] as const).map((s) => (
              <Hap key={s} secili={street === s} className="flex-1 justify-center" onClick={() => setStreet(s)}>
                {s === "flop" ? "Flop" : "Turn"}
              </Hap>
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
    </Kart>
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
    <Kart id="spr" baslik="Efektif stack ve SPR" baslikId="spr-baslik">
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
    </Kart>
  );
}

function Icm() {
  const [stacks, setStacks] = useState("5000, 3000, 1500, 500");
  const [payouts, setPayouts] = useState("50, 30, 20");
  const parse = (s: string) => s.split(/[\s;,]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const st = parse(stacks).slice(0, 9);
  const pay = parse(payouts).slice(0, 9);
  const valid = st.length >= 2 && pay.length >= 1;
  const res = valid ? icm(st, pay) : [];
  const totalChips = st.reduce((a, b) => a + b, 0);
  const totalPay = pay.slice(0, st.length).reduce((a, b) => a + b, 0);
  return (
    <Kart id="icm" baslik="Basit ICM" baslikId="icm-baslik">
      <div className="mt-3 grid gap-3">
        <Field label="Stack'ler (virgülle ayır, en fazla 9 oyuncu)" value={stacks} onChange={setStacks} />
        <Field label="Ödüller (1.'den başlayarak)" value={payouts} onChange={setPayouts} hint="Yüzde ya da tutar; birimi sen seçersin" />
      </div>
      {valid ? (
        <div aria-live="polite">
          <Tablo
            className="mt-4"
            baslik="ICM sonucu"
            gizliBaslik
            sutunlar={["Oyuncu", "Stack", "Chip payı", "ICM değeri", "Ödül payı"]}
            sayi={[1, 2, 3, 4]}
            satirBasligi
            satirlar={st.map((s, i) => [
              `${i + 1}. oyuncu`,
              s,
              pct(s / totalChips),
              <strong key="d">{res[i].toFixed(2).replace(".", ",")}</strong>,
              pct(res[i] / totalPay),
            ])}
          />
          <Not>
            “ICM değeri”, o stack'in ödül havuzundan beklenen payıdır. Büyük stack'in ödül payı chip payından küçük, kısa
            stack'inki büyüktür: chip'ler doğrusal olarak ödüle dönüşmez. Bir all-in'i değerlendirmek için kazandığın ve
            kaybettiğin durumdaki stack'leri ayrı ayrı girip aradaki farka bak; kaybın çoğu zaman kazancından büyük çıkar.
          </Not>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">En az iki stack ve bir ödül gir.</p>
      )}
    </Kart>
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
          <a key={h} href={h} className={hapSinifi()}>
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
