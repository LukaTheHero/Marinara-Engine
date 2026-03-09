// ──────────────────────────────────────────────
// Peek Prompt Modal — collapsible section viewer
// ──────────────────────────────────────────────
import { useState, useMemo } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Rough token estimate: ~4 characters per token on average.
 * This is a common heuristic that works reasonably well across
 * most LLM tokenizers (GPT, Claude, Llama, etc.).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Format a token number with commas for readability. */
function fmtTokens(n: number): string {
  return n.toLocaleString();
}

interface PeekPromptModalProps {
  data: { messages: Array<{ role: string; content: string }>; parameters: unknown; agentNote?: string };
  onClose: () => void;
}

/** A parsed block: either an XML-wrapped section or raw content. */
interface ContentBlock {
  label: string;
  content: string;
  isChatHistory: boolean;
}

/**
 * Parse a message's content into named blocks by detecting XML section tags.
 * E.g. `<system_prompt>\ncontent\n</system_prompt>` → { label: "system_prompt", content }
 * Anything not inside a tag becomes an "Ungrouped" block.
 * Also detects partial `<chat_history>` / `</chat_history>` that span across messages.
 */
function parseContentBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  // Match top-level XML tags: <tag_name>\n...\n</tag_name>
  const tagRegex = /<([a-z_][a-z0-9_-]*)>\n?([\s\S]*?)\n?<\/\1>/gi;
  let lastIndex = 0;

  for (const match of content.matchAll(tagRegex)) {
    const before = content.slice(lastIndex, match.index);
    if (before.trim()) {
      blocks.push({ label: "Ungrouped", content: before.trim(), isChatHistory: false });
    }
    const tagName = match[1]!;
    const innerContent = match[2]!;
    const isCH = /chat.?history/i.test(tagName);
    // Include the XML tags in displayed content so the user sees exactly what's sent
    blocks.push({ label: tagName, content: match[0], isChatHistory: isCH });
    lastIndex = match.index! + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining.trim()) {
    // Check if the remaining text starts with <chat_history> (open tag spanning messages)
    const hasChatHistoryOpen = /^<chat_history>/i.test(remaining.trim());
    // Check if it ends with </chat_history> (close tag spanning messages)
    const hasChatHistoryClose = /<\/chat_history>\s*$/i.test(remaining.trim());
    blocks.push({
      label: "Ungrouped",
      content: remaining.trim(),
      isChatHistory: hasChatHistoryOpen || hasChatHistoryClose,
    });
  }

  return blocks;
}

/** Prettify a snake_case tag name → "System Prompt" */
function prettifyTag(tag: string): string {
  return tag.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CollapsibleBlock({
  label,
  content,
  defaultOpen,
  roleColor,
}: {
  label: string;
  content: string;
  defaultOpen: boolean;
  roleColor: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tokens = estimateTokens(content);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--accent)]/50"
      >
        {open ? (
          <ChevronDown size={12} className="shrink-0 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight size={12} className="shrink-0 text-[var(--muted-foreground)]" />
        )}
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", roleColor)}>
          {prettifyTag(label)}
        </span>
        <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
          ~{fmtTokens(tokens)} token{tokens !== 1 ? "s" : ""}
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--border)]/50 px-3 py-2">
          <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--foreground)]/80">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

export function PeekPromptModal({ data, onClose }: PeekPromptModalProps) {
  // Parse all messages into collapsible blocks
  const sections = useMemo(() => {
    const result: Array<{
      role: string;
      label: string;
      content: string;
      isChatHistory: boolean;
    }> = [];

    for (const msg of data.messages) {
      const blocks = parseContentBlocks(msg.content);
      if (blocks.length === 0) {
        // Empty message, skip
        continue;
      }

      if (blocks.length === 1 && blocks[0]!.label === "Ungrouped") {
        // No XML tags found — show as a single role block
        result.push({
          role: msg.role,
          label: msg.role,
          content: blocks[0]!.content,
          isChatHistory: false,
        });
      } else {
        for (const block of blocks) {
          result.push({
            role: msg.role,
            label: block.label,
            content: block.content,
            isChatHistory: block.isChatHistory,
          });
        }
      }
    }

    // Group consecutive chat history entries into one block.
    // Also detect runs of bare user/assistant messages as chat history.
    const grouped: typeof result = [];
    let chatHistoryBuffer: string[] = [];
    let inChatHistory = false;

    for (let i = 0; i < result.length; i++) {
      const section = result[i]!;
      const isBareChat = (section.role === "user" || section.role === "assistant") && section.label === section.role;

      // Start or continue grouping chat history
      if (
        section.isChatHistory ||
        (inChatHistory && isBareChat) ||
        // Detect start of a bare user/assistant run: next is also bare chat
        (!inChatHistory &&
          isBareChat &&
          result[i + 1] &&
          (result[i + 1]!.role === "user" || result[i + 1]!.role === "assistant") &&
          result[i + 1]!.label === result[i + 1]!.role)
      ) {
        inChatHistory = true;
        chatHistoryBuffer.push(`[${section.role.toUpperCase()}]\n${section.content}`);
      } else {
        if (chatHistoryBuffer.length > 0) {
          grouped.push({
            role: "system",
            label: "Chat History",
            content: chatHistoryBuffer.join("\n\n"),
            isChatHistory: true,
          });
          chatHistoryBuffer = [];
          inChatHistory = false;
        }
        grouped.push(section);
      }
    }
    if (chatHistoryBuffer.length > 0) {
      grouped.push({
        role: "system",
        label: "Chat History",
        content: chatHistoryBuffer.join("\n\n"),
        isChatHistory: true,
      });
    }

    return grouped;
  }, [data.messages]);

  const totalTokens = useMemo(() => estimateTokens(data.messages.map((m) => m.content).join("")), [data.messages]);

  const roleColor = (role: string, label: string) => {
    if (label === "Chat History") return "bg-green-500/20 text-green-400";
    if (role === "system") return "bg-amber-500/20 text-amber-400";
    if (role === "user") return "bg-blue-500/20 text-blue-400";
    return "bg-purple-500/20 text-purple-400";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold">Assembled Prompt</h3>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {sections.length} section{sections.length !== 1 ? "s" : ""} &middot; ~{fmtTokens(totalTokens)} tokens
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-all hover:bg-[var(--accent)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-2">
          {data.agentNote && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300/80">
              ⚠ {data.agentNote}
            </div>
          )}
          {sections.map((s, i) => (
            <CollapsibleBlock
              key={i}
              label={s.label}
              content={s.content}
              defaultOpen={false}
              roleColor={roleColor(s.role, s.label)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
