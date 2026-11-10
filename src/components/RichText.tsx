import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { TERM_BY_SLUG } from "@/data/glossary";
import { linkTerms } from "@/lib/glossaryLinker";

// Düz metni (ve yapay zekanın kullandığı basit işaretlemeyi: **kalın**, - madde, # başlık)
// güvenli biçimde React öğelerine çevirir; terimleri sözlüğe bağlar. HTML enjekte edilmez.

function inline(text: string, seen: Set<string>, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part, i) => {
    const bold = /^\*\*[^*]+\*\*$/.test(part);
    const pieces = linkTerms(bold ? part.slice(2, -2) : part, seen).map((p, j) =>
      typeof p === "string" ? (
        <Fragment key={j}>{p}</Fragment>
      ) : (
        <Link key={j} href={`/sozluk#${p.slug}`} className="term" title={TERM_BY_SLUG.get(p.slug)?.def}>
          {p.text}
        </Link>
      ),
    );
    nodes.push(bold ? <strong key={`${key}-${i}`}>{pieces}</strong> : <Fragment key={`${key}-${i}`}>{pieces}</Fragment>);
  });
  return nodes;
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const seen = new Set<string>();
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {list}
        </ul>,
      );
      list = [];
    }
  };

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return flush();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      list.push(<li key={i}>{inline(bullet[1], seen, `l${i}`)}</li>);
      return;
    }
    flush();
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      heading ? (
        <p key={i} className="pt-1 font-semibold">
          {inline(heading[1], seen, `h${i}`)}
        </p>
      ) : (
        <p key={i}>{inline(line, seen, `p${i}`)}</p>
      ),
    );
  });
  flush();

  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
}
