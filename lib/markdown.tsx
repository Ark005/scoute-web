import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        nodes.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "«" || text[i] === "»") {
      nodes.push(text[i]);
      i++;
      continue;
    }
    const next = text.indexOf("**", i);
    if (next === -1) {
      nodes.push(text.slice(i));
      break;
    }
    nodes.push(text.slice(i, next));
    i = next;
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
