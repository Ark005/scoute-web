import Link from "next/link";
import type { ReactNode } from "react";

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  const tokens: Array<{ kind: "text" | "link"; text: string; href?: string }> = [];
  let cursor = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const start = m.index ?? 0;
    if (start > cursor) tokens.push({ kind: "text", text: text.slice(cursor, start) });
    tokens.push({ kind: "link", text: m[1], href: m[2] });
    cursor = start + m[0].length;
  }
  if (cursor < text.length) tokens.push({ kind: "text", text: text.slice(cursor) });

  for (const tok of tokens) {
    if (tok.kind === "link" && tok.href) {
      const isInternal = tok.href.startsWith("/");
      if (isInternal) {
        nodes.push(
          <Link
            key={key++}
            href={tok.href}
            className="underline decoration-1 underline-offset-2 hover:decoration-2"
            style={{ color: "#F47B21" }}
          >
            {tok.text}
          </Link>
        );
      } else {
        nodes.push(
          <a
            key={key++}
            href={tok.href}
            rel="nofollow noopener"
            target="_blank"
            className="underline decoration-1 underline-offset-2 hover:decoration-2"
            style={{ color: "#F47B21" }}
          >
            {tok.text}
          </a>
        );
      }
      continue;
    }
    const t = tok.text;
    let i = 0;
    while (i < t.length) {
      if (t.startsWith("**", i)) {
        const end = t.indexOf("**", i + 2);
        if (end !== -1) {
          nodes.push(<strong key={key++}>{t.slice(i + 2, end)}</strong>);
          i = end + 2;
          continue;
        }
      }
      const next = t.indexOf("**", i);
      if (next === -1) {
        nodes.push(<span key={key++}>{t.slice(i)}</span>);
        break;
      }
      nodes.push(<span key={key++}>{t.slice(i, next)}</span>);
      i = next;
    }
  }
  return nodes;
}

export function renderGuideMarkdown(md: string): ReactNode {
  const blocks = md.split(/\n\n+/);
  const out: ReactNode[] = [];
  blocks.forEach((raw, idx) => {
    const block = raw.trim();
    if (!block) return;
    if (block.startsWith("## ")) {
      const title = block.slice(3).trim();
      const anchor = title
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
      out.push(
        <h2
          key={idx}
          id={anchor}
          className="text-2xl md:text-3xl font-extrabold mt-10 mb-4 scroll-mt-24"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: "var(--dark)" }}
        >
          {renderInline(title)}
        </h2>
      );
      return;
    }
    if (block.startsWith("> ")) {
      const lines = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ");
      out.push(
        <blockquote
          key={idx}
          className="my-6 pl-5 border-l-4 italic text-gray-700 text-lg leading-relaxed"
          style={{ borderColor: "#F47B21", fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {renderInline(lines)}
        </blockquote>
      );
      return;
    }
    out.push(
      <p key={idx} className="my-4 text-base md:text-lg leading-[1.75] text-gray-800">
        {renderInline(block)}
      </p>
    );
  });
  return <>{out}</>;
}
