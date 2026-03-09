// ──────────────────────────────────────────────
// Echo Chamber Panel — Twitch-style side chat reacting to your roleplay
// ──────────────────────────────────────────────
import { useRef, useEffect, useMemo } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { useAgentStore } from "../../stores/agent.store";
import { useUIStore } from "../../stores/ui.store";
import { useAgentConfigs } from "../../hooks/use-agents";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function EchoChamberPanel() {
  const echoChamberOpen = useUIStore((s) => s.echoChamberOpen);
  const echoChamberSide = useUIStore((s) => s.echoChamberSide);
  const toggleEchoChamber = useUIStore((s) => s.toggleEchoChamber);
  const setEchoChamberSide = useUIStore((s) => s.setEchoChamberSide);
  const echoMessages = useAgentStore((s) => s.echoMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentConfigs } = useAgentConfigs();
  const echoEnabled = useMemo(() => {
    if (!agentConfigs) return false;
    const cfg = (agentConfigs as Array<{ type: string; enabled: string }>).find((a) => a.type === "echo-chamber");
    return cfg?.enabled === "true";
  }, [agentConfigs]);

  // Auto-scroll to bottom on new messages (smooth)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [echoMessages]);

  if (!echoChamberOpen || !echoEnabled) return null;

  // Memoize name → color mapping to avoid re-hashing every render
  const nameColorMap = useMemo(() => {
    const colors = [
      "text-red-400",
      "text-blue-400",
      "text-green-400",
      "text-yellow-400",
      "text-purple-400",
      "text-pink-400",
      "text-cyan-400",
      "text-orange-400",
      "text-emerald-400",
      "text-rose-400",
      "text-indigo-400",
      "text-amber-400",
    ];
    const map = new Map<string, string>();
    for (const msg of echoMessages) {
      if (!map.has(msg.characterName)) {
        let hash = 0;
        for (let i = 0; i < msg.characterName.length; i++)
          hash = msg.characterName.charCodeAt(i) + ((hash << 5) - hash);
        map.set(msg.characterName, colors[Math.abs(hash) % colors.length]!);
      }
    }
    return map;
  }, [echoMessages]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: echoChamberSide === "right" ? 40 : -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: echoChamberSide === "right" ? 40 : -40 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className={cn(
          "echo-chamber-panel fixed top-16 bottom-4 z-30 flex w-72 flex-col rounded-lg border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl",
          echoChamberSide === "right" ? "right-4" : "left-4",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Echo Chamber
            </span>
            {echoMessages.length > 0 && (
              <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                {echoMessages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEchoChamberSide(echoChamberSide === "right" ? "left" : "right")}
              className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
              title={`Move to ${echoChamberSide === "right" ? "left" : "right"}`}
            >
              <ArrowLeftRight size={12} />
            </button>
            <button
              onClick={toggleEchoChamber}
              className="rounded p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {echoMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-xs text-white/30">Chat reactions will appear here during roleplay...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {echoMessages.map((msg, i) => (
                <div key={i} className="group animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <span className={cn("text-xs font-bold", nameColorMap.get(msg.characterName))}>
                    {msg.characterName}
                  </span>
                  <span className="text-xs text-white/60">: </span>
                  <span className="text-xs text-white/80">{msg.reaction}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-3 py-1.5">
          <p className="text-[10px] text-white/20">Powered by Echo Chamber agent</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
