import { useMemo, useState } from "react";
import {
  Sparkles, Download, Copy, Loader2, Image as ImageIcon, Trash2, History, Wand2,
  Gamepad2, CheckCircle2, Circle,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SettingsDrawer } from "./SettingsDrawer";
import { useApiKey } from "@/hooks/useApiKey";
import { generateSprite } from "@/lib/aiService";

const POSITIONS = ["Front", "Side", "Back", "Attack"] as const;

type Position = typeof POSITIONS[number];

interface Sprite {
  id: string;
  position: Position;
  url: string;
  prompt: string;
  createdAt: number;
  mocked: boolean;
}

interface HistoryBatch {
  id: string;
  prompt: string;
  createdAt: number;
  sprites: Sprite[];
}

export function StudioApp() {
  const { apiKey, isConnected } = useApiKey();
  const [character, setCharacter] = useState("A pixel-art knight with crimson cape and silver armor");
  const [style, setStyle] = useState("16-bit retro RPG, clean outlines, vibrant palette");
  const [selected, setSelected] = useState<Set<Position>>(new Set(["Front", "Side"]));
  const [loadingPos, setLoadingPos] = useState<Set<Position>>(new Set());
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [history, setHistory] = useState<HistoryBatch[]>([]);

  const togglePos = (p: Position) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  };

  const characterDNA = useMemo(
    () => [character.trim(), style.trim()].filter(Boolean).join(", "),
    [character, style],
  );

  const generate = async () => {
    if (!character.trim()) { toast.error("Add a character description first."); return; }
    if (selected.size === 0) { toast.error("Select at least one sprite position."); return; }

    const positions = Array.from(selected);
    setLoadingPos(new Set(positions));
    setSprites([]);

    const results: Sprite[] = [];
    let sawError = false;
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const { url, mocked, error } = await generateSprite(
        { apiKey, characterDNA, position: pos },
        i,
      );
      if (error) sawError = true;
      const sprite: Sprite = {
        id: `${Date.now()}-${i}`,
        position: pos,
        url,
        prompt: `${characterDNA}, ${pos}`,
        createdAt: Date.now(),
        mocked,
      };
      results.push(sprite);
      setSprites((s) => [...s, sprite]);
      setLoadingPos((prev) => {
        const n = new Set(prev); n.delete(pos); return n;
      });
    }

    if (sawError) {
      toast.error("Invalid API Key or Limit Reached. Using placeholder mode.");
    }

    const batch: HistoryBatch = {
      id: `batch-${Date.now()}`,
      prompt: characterDNA,
      createdAt: Date.now(),
      sprites: results,
    };
    setHistory((h) => [batch, ...h].slice(0, 12));
    toast.success(`Generated ${results.length} sprite${results.length > 1 ? "s" : ""}`);
  };

  const downloadZip = async () => {
    if (sprites.length === 0) { toast.error("Nothing to export yet."); return; }
    const zip = new JSZip();
    const folder = zip.folder("spritely-export")!;
    for (const s of sprites) {
      const ext = s.url.startsWith("data:image/svg") ? "svg" : "png";
      const blob = await (await fetch(s.url)).blob();
      folder.file(`${s.position.replace(/\s+/g, "_")}.${ext}`, blob);
    }
    folder.file("prompt.txt", characterDNA);
    const out = await zip.generateAsync({ type: "blob" });
    saveAs(out, `spritely-${Date.now()}.zip`);
    toast.success("Exported sprite sheet ZIP");
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-panel/60 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Spritely<span className="text-gradient">.AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">2D Game Asset Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {isConnected ? "Live · Stability AI" : "Placeholder mode"}
          </span>
          <SettingsDrawer />
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr_300px]">
        {/* LEFT — Configuration */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-border bg-panel/40 p-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" /> Asset Configuration
            </h2>
          </div>

          <div className="space-y-2">
            <Label>Character</Label>
            <Textarea
              rows={4}
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              placeholder="A pixel-art knight with crimson cape..."
              className="resize-none bg-input/60"
            />
          </div>

          <div className="space-y-2">
            <Label>Art Style</Label>
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="16-bit retro RPG..."
              className="bg-input/60"
            />
          </div>

          <div className="space-y-2">
            <Label>Sprite Sheet Checklist</Label>
            <div className="space-y-1.5">
              {POSITIONS.map((p) => {
                const active = selected.has(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePos(p)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-all ${
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground shadow-glow"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {active ? (
                        <CheckCircle2 className="h-4 w-4 text-primary-glow" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {p}
                    </span>
                    <span className="text-xs opacity-60">{active ? "ON" : "OFF"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loadingPos.size > 0}
            className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
          >
            {loadingPos.size > 0 ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generate Sprites</>
            )}
          </Button>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Each selected position will be appended to your prompt and generated sequentially
            for character consistency.
          </p>
        </aside>

        {/* CENTER — Preview */}
        <main className="flex flex-col overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sprite Preview
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sprites.length} of {selected.size || 0} generated
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadZip} disabled={sprites.length === 0} className="gap-2">
                <Download className="h-4 w-4" /> Download ZIP
              </Button>
            </div>
          </div>

          {sprites.length === 0 && loadingPos.size === 0 ? (
            <EmptyPreview />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from(selected).map((pos) => {
                const sprite = sprites.find((s) => s.position === pos);
                const loading = loadingPos.has(pos);
                return (
                  <SpriteCard
                    key={pos}
                    position={pos}
                    sprite={sprite}
                    loading={loading}
                    onCopy={copyUrl}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* RIGHT — History */}
        <aside className="hidden flex-col overflow-y-auto border-l border-border bg-panel/40 p-5 lg:flex">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <History className="h-3.5 w-3.5" /> History
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Clear history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No generations yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((b) => (
                <div key={b.id} className="rounded-lg border border-border bg-card/60 p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{new Date(b.createdAt).toLocaleTimeString()}</span>
                    <span>{b.sprites.length} sprite{b.sprites.length !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-foreground/90">{b.prompt}</p>
                  <div className="mt-2 flex gap-1.5 overflow-hidden">
                    {b.sprites.slice(0, 4).map((s) => (
                      <div key={s.id} className="h-12 w-12 overflow-hidden rounded border border-border bg-muted">
                        <img src={s.url} alt={s.position} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-panel/20 p-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <ImageIcon className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="text-base font-semibold">Your sprites will appear here</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Configure your character on the left, pick the poses you want, and hit
          <span className="text-primary-glow"> Generate Sprites</span>.
        </p>
      </div>
    </div>
  );
}

function SpriteCard({
  position, sprite, loading, onCopy,
}: {
  position: string;
  sprite?: { url: string; mocked: boolean };
  loading: boolean;
  onCopy: (url: string) => void;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-gradient-panel shadow-panel transition-all hover:border-primary/50">
      <div className="relative aspect-square bg-muted/40">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
            <span className="text-xs">Rendering {position}...</span>
          </div>
        ) : sprite ? (
          <img src={sprite.url} alt={position} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            queued
          </div>
        )}
        {sprite?.mocked && (
          <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
            mock
          </span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-sm font-medium">{position}</span>
        {sprite && (
          <button
            onClick={() => onCopy(sprite.url)}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Copy URL"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
