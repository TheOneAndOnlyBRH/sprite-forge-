import { useState } from "react";
import { Settings, KeyRound, Trash2, Eye, EyeOff, Plug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApiKey } from "@/hooks/useApiKey";
import { testStabilityKey } from "@/lib/aiService";

export function SettingsDrawer() {
  const { apiKey, setApiKey, clearKey, isConnected } = useApiKey();
  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    const key = draft.trim();
    if (!key) {
      toast.error("Enter a Stability AI API key first.");
      return;
    }
    setTesting(true);
    try {
      await testStabilityKey(key);
      toast.success("Connection successful — key is valid.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Invalid API Key or Limit Reached. Using placeholder mode. (${msg})`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(apiKey); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
          <span
            className={`ml-1 h-2 w-2 rounded-full ${isConnected ? "bg-success" : "bg-destructive"}`}
            aria-label={isConnected ? "Connected" : "Disconnected"}
          />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-panel border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Stability AI Configuration
          </SheetTitle>
          <SheetDescription>
            Spritely uses Stability AI (SDXL) for sprite generation. Your key is stored in{" "}
            <code className="text-primary-glow">localStorage</code> only — it never touches our servers.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-6">
          <div className="space-y-2">
            <Label>Stability AI API Key</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                placeholder="sk-..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get a key at{" "}
              <a
                href="https://platform.stability.ai/account/keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary-glow underline-offset-2 hover:underline"
              >
                platform.stability.ai
              </a>
              .
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Connection</span>
            <span className={`flex items-center gap-2 font-medium ${isConnected ? "text-success" : "text-destructive"}`}>
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-success" : "bg-destructive"}`} />
              {isConnected ? "Key saved" : "No key (placeholder mode)"}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="w-full gap-2"
          >
            {testing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              <><Plug className="h-4 w-4" /> Test Connection</>
            )}
          </Button>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-primary hover:opacity-90"
              onClick={() => { setApiKey(draft.trim()); setOpen(false); toast.success("API key saved."); }}
            >
              Save Key
            </Button>
            <Button variant="outline" onClick={() => { clearKey(); setDraft(""); }} className="gap-2">
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
