import React, { useState } from "react";

interface MarkdownNoteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

// ─── Inline renderer ───────────────────────────────────────────────────────
function renderInline(text: string, key: string | number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Pattern order matters: bold, italic, code, then plain text
  const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={`${key}-b${idx}`} className="font-semibold text-text">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={`${key}-i${idx}`} className="italic text-muted">{m[4]}</em>);
    else if (m[5]) parts.push(<code key={`${key}-c${idx}`} className="font-mono text-[0.82em] bg-violet-dim/60 text-violet px-[0.35em] py-[0.1em] rounded-[4px] border border-violet/20">{m[6]}</code>);
    last = m.index + m[0].length;
    idx++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

function parseMarkdown(raw: string): React.ReactNode {
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ## Heading 2
    if (/^## (.+)/.test(line)) {
      const text = line.replace(/^## /, "");
      nodes.push(
        <h3 key={i} className="text-[0.82rem] font-semibold text-violet tracking-tight uppercase mt-2.5 mb-0.5 first:mt-0">
          {text}
        </h3>
      );
      i++;
      continue;
    }

    // # Heading 1
    if (/^# (.+)/.test(line)) {
      const text = line.replace(/^# /, "");
      nodes.push(
        <h2 key={i} className="text-[0.88rem] font-bold text-text tracking-tight mt-2.5 mb-1 first:mt-0">
          {text}
        </h2>
      );
      i++;
      continue;
    }

    // > Blockquote
    if (/^> (.*)/.test(line)) {
      const text = line.replace(/^> /, "");
      nodes.push(
        <blockquote key={i} className="border-l-2 border-faint/60 pl-2.5 text-muted italic text-[0.82rem] my-1">
          {renderInline(text, i)}
        </blockquote>
      );
      i++;
      continue;
    }

    // - or * list item — collect consecutive list items
    if (/^[-*] (.*)/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] (.*)/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      nodes.push(
        <ul key={`list-${i}`} className="my-1 flex flex-col gap-0.5 list-none pl-0">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-1.5 text-[0.82rem] text-text leading-relaxed">
              <span className="text-violet mt-[3px] shrink-0 text-[0.65rem]">◆</span>
              <span>{renderInline(item, j)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Plain paragraph
    nodes.push(
      <p key={i} className="text-[0.82rem] text-text leading-relaxed my-0.5">
        {renderInline(line, i)}
      </p>
    );
    i++;
  }

  return <>{nodes}</>;
}

// ─── Component ─────────────────────────────────────────────────────────────
export const MarkdownNote: React.FC<MarkdownNoteProps> = ({
  value,
  onChange,
  placeholder = "Notes, ideas, errors...",
  className = "",
}) => {
  const [mode, setMode] = useState<"edit" | "preview">(value ? "preview" : "edit");
  const hasContent = value.trim().length > 0;

  return (
    <div className={`flex flex-col min-h-0 flex-1 gap-1 ${className}`}>
      {/* Mode toggle pill */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[0.7rem] font-semibold tracking-[0.04em] uppercase text-muted">Scratchpad</span>
        {hasContent && (
          <div className="flex gap-0.5 bg-elevated/80 border border-line/60 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`text-[0.65rem] font-mono font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                mode === "edit"
                  ? "bg-elevated-hi text-text border border-line shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              ✎ Edit
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`text-[0.65rem] font-mono font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                mode === "preview"
                  ? "bg-elevated-hi text-text border border-line shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              ◉ Preview
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      {mode === "edit" || !hasContent ? (
        <textarea
          className="tile-field flex-1 resize-none font-mono text-[0.8125rem] leading-relaxed text-text min-h-0"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onBlur={() => { if (value.trim()) setMode("preview"); }}
          onFocus={() => setMode("edit")}
          data-lenis-prevent="true"
        />
      ) : (
        <div
          className="tile-scroll flex-1 min-h-0 rounded-xl bg-elevated/40 border border-line/50 p-3 cursor-text overflow-y-auto"
          onClick={() => setMode("edit")}
          title="Click to edit"
          data-lenis-prevent="true"
        >
          {parseMarkdown(value)}
        </div>
      )}
    </div>
  );
};
