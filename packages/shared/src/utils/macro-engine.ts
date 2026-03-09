// ──────────────────────────────────────────────
// Macro Engine — {{user}}, {{char}}, {{date}}, etc.
// ──────────────────────────────────────────────

export interface MacroContext {
  user: string;
  char: string;
  /** All characters in the chat */
  characters: string[];
  /** Custom variables from prompt toggle groups */
  variables: Record<string, string>;
  /** Last user input message (for {{input}}) */
  lastInput?: string;
  /** Chat ID (for {{chatId}}) */
  chatId?: string;
  /** Model name (for {{model}}) */
  model?: string;
  /** Agent data keyed by agent type (for {{agent::TYPE}}) */
  agentData?: Record<string, string>;
}

/**
 * Replace macros in a prompt string with their values.
 *
 * Supported macros (SillyTavern-compatible):
 *  - {{user}} / {{persona}} — user's display name
 *  - {{char}} — current character name
 *  - {{characters}} — comma-separated list of all character names
 *  - {{date}} — current real date (YYYY-MM-DD)
 *  - {{time}} — current real time (HH:MM)
 *  - {{datetime}} — full ISO datetime string
 *  - {{weekday}} — current day name (Monday, etc.)
 *  - {{isotime}} — ISO timestamp
 *  - {{random}} — random number 0-100
 *  - {{random:X:Y}} — random number X-Y
 *  - {{roll:XdY}} — dice roll (e.g. {{roll:2d6}})
 *  - {{getvar::name}} — read a dynamic variable
 *  - {{setvar::name::value}} — set a variable
 *  - {{addvar::name::value}} — append to a variable
 *  - {{incvar::name}} — increment numeric variable by 1
 *  - {{decvar::name}} — decrement numeric variable by 1
 *  - {{input}} — last user message
 *  - {{model}} — current model name
 *  - {{chatId}} — current chat ID
 *  - {{// comment}} — removed (author comments)
 *  - {{trim}} — remove surrounding whitespace
 *  - {{trimStart}} / {{trimEnd}} — directional trim markers
 *  - {{newline}} / {{\n}} — literal newline
 *  - {{noop}} — no operation, removed
 *  - {{banned "text"}} — content filter (removed for now)
 *  - {{uppercase}}...{{/uppercase}} — convert to uppercase
 *  - {{lowercase}}...{{/lowercase}} — convert to lowercase
 */
export function resolveMacros(template: string, ctx: MacroContext): string {
  let result = template;

  // ── Comments — strip first so they don't interfere ──
  result = result.replace(/\{\{\/\/[^}]*\}\}/g, "");

  // ── No-op & banned ──
  result = result.replace(/\{\{noop\}\}/gi, "");
  result = result.replace(/\{\{banned\s+"[^"]*"\}\}/gi, "");

  // ── Static substitutions ──
  result = result.replace(/\{\{user\}\}/gi, ctx.user);
  result = result.replace(/\{\{persona\}\}/gi, ctx.user);
  result = result.replace(/\{\{char\}\}/gi, ctx.char);
  result = result.replace(/\{\{characters\}\}/gi, ctx.characters.join(", "));
  result = result.replace(/\{\{input\}\}/gi, ctx.lastInput ?? "");
  result = result.replace(/\{\{model\}\}/gi, ctx.model ?? "");
  result = result.replace(/\{\{chatId\}\}/gi, ctx.chatId ?? "");

  // ── Agent data ──
  result = result.replace(/\{\{agent::([\w-]+)\}\}/gi, (_, type) => {
    return ctx.agentData?.[type] ?? "";
  });

  // ── Date/time ──
  const now = new Date();
  result = result.replace(/\{\{date\}\}/gi, now.toISOString().slice(0, 10));
  result = result.replace(/\{\{time\}\}/gi, now.toTimeString().slice(0, 5));
  result = result.replace(/\{\{datetime\}\}/gi, now.toISOString());
  result = result.replace(/\{\{isotime\}\}/gi, now.toISOString());
  result = result.replace(/\{\{weekday\}\}/gi, now.toLocaleDateString("en-US", { weekday: "long" }));

  // ── Random numbers ──
  result = result.replace(/\{\{random\}\}/gi, () => String(Math.floor(Math.random() * 101)));
  result = result.replace(/\{\{random:(\d+):(\d+)\}\}/gi, (_, min, max) => {
    const lo = parseInt(min, 10);
    const hi = parseInt(max, 10);
    return String(Math.floor(Math.random() * (hi - lo + 1)) + lo);
  });

  // ── Dice rolls: {{roll:2d6}} ──
  result = result.replace(/\{\{roll:(\d+)d(\d+)\}\}/gi, (_, count, sides) => {
    const n = parseInt(count, 10);
    const s = parseInt(sides, 10);
    let total = 0;
    for (let i = 0; i < n; i++) total += Math.floor(Math.random() * s) + 1;
    return String(total);
  });

  // ── Variable operations ──
  result = result.replace(/\{\{getvar::(\w+)\}\}/gi, (_, name) => {
    return ctx.variables[name] ?? "";
  });
  result = result.replace(/\{\{setvar::(\w+)::([^}]*)\}\}/gi, (_, name, val) => {
    ctx.variables[name] = val;
    return "";
  });
  result = result.replace(/\{\{addvar::(\w+)::([^}]*)\}\}/gi, (_, name, val) => {
    ctx.variables[name] = (ctx.variables[name] ?? "") + val;
    return "";
  });
  result = result.replace(/\{\{incvar::(\w+)\}\}/gi, (_, name) => {
    ctx.variables[name] = String((parseInt(ctx.variables[name] ?? "0", 10) || 0) + 1);
    return "";
  });
  result = result.replace(/\{\{decvar::(\w+)\}\}/gi, (_, name) => {
    ctx.variables[name] = String((parseInt(ctx.variables[name] ?? "0", 10) || 0) - 1);
    return "";
  });

  // ── Case transforms ──
  result = result.replace(/\{\{uppercase\}\}([\s\S]*?)\{\{\/uppercase\}\}/gi, (_, inner) =>
    (inner as string).toUpperCase(),
  );
  result = result.replace(/\{\{lowercase\}\}([\s\S]*?)\{\{\/lowercase\}\}/gi, (_, inner) =>
    (inner as string).toLowerCase(),
  );

  // ── Newlines ──
  result = result.replace(/\{\{newline\}\}/gi, "\n");
  result = result.replace(/\{\{\\n\}\}/g, "\n");

  // ── Trim markers (processed last) ──
  result = result.replace(/\{\{trimStart\}\}/gi, "\x00TRIM_START\x00");
  result = result.replace(/\{\{trimEnd\}\}/gi, "\x00TRIM_END\x00");
  result = result.replace(/\{\{trim\}\}/gi, "");

  // Apply directional trims
  if (result.includes("\x00TRIM_START\x00")) {
    result = result.replace(/\x00TRIM_START\x00\s*/g, "");
  }
  if (result.includes("\x00TRIM_END\x00")) {
    result = result.replace(/\s*\x00TRIM_END\x00/g, "");
  }

  // ── Catch-all: resolve any remaining {{name}} from variables ──
  // This allows preset variables like {{POV}} to resolve directly
  result = result.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const val = ctx.variables[name];
    return val !== undefined ? val : match; // leave unknown macros as-is
  });

  result = result.trim();

  return result;
}
