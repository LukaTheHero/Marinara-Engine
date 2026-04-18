// ──────────────────────────────────────────────
// Seed: Default Game Assets
// Copies bundled game-mode assets (music, SFX, sprites)
// into the data/game-assets directory on first boot.
// All assets are CC0 — see CREDITS.md in the bundle.
// ──────────────────────────────────────────────
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GAME_ASSETS_DIR } from "../services/game/asset-manifest.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLED_DIR = join(__dirname, "..", "assets", "default-game-assets");

/**
 * Recursively copy a source directory into a destination,
 * skipping files that already exist at the destination.
 * Returns the number of files copied.
 */
function copyDirRecursive(src: string, dest: string): number {
  if (!existsSync(src)) return 0;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  let copied = 0;
  const entries = readdirSync(src);

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copied += copyDirRecursive(srcPath, destPath);
    } else {
      if (!existsSync(destPath)) {
        copyFileSync(srcPath, destPath);
        copied++;
      }
    }
  }

  return copied;
}

export async function seedDefaultGameAssets(): Promise<void> {
  if (!existsSync(BUNDLED_DIR)) {
    console.warn("[seed] Default game assets bundle not found — skipping");
    return;
  }

  // Check if user already has assets (don't overwrite)
  const hasExistingAssets =
    existsSync(GAME_ASSETS_DIR) &&
    readdirSync(GAME_ASSETS_DIR).some(
      (f) => !f.startsWith(".") && f !== "manifest.json" && statSync(join(GAME_ASSETS_DIR, f)).isDirectory(),
    );

  // If directories exist but are empty, still seed
  if (hasExistingAssets) {
    // Count actual files (not just dirs) to determine if seeded already
    let fileCount = 0;
    const categories = ["music", "sfx", "sprites", "backgrounds"];
    for (const cat of categories) {
      const catDir = join(GAME_ASSETS_DIR, cat);
      if (!existsSync(catDir)) continue;
      try {
        const scan = (dir: string): number => {
          let count = 0;
          for (const e of readdirSync(dir)) {
            if (e.startsWith(".")) continue;
            const p = join(dir, e);
            const s = statSync(p);
            if (s.isDirectory()) count += scan(p);
            else count++;
          }
          return count;
        };
        fileCount += scan(catDir);
      } catch {
        /* skip unreadable */
      }
    }
    if (fileCount > 0) return; // User already has assets
  }

  const copied = copyDirRecursive(BUNDLED_DIR, GAME_ASSETS_DIR);

  if (copied > 0) {
    console.log(`[seed] Installed ${copied} default game asset${copied > 1 ? "s" : ""} (music, SFX, sprites)`);
  }
}
