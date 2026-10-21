import { useState } from "react";
import type { DragEvent } from "react";
import {
  Check,
  Copy,
  FileText,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site-header";
import { cryptoAvailable, copyToClipboard, formatBytes } from "@/lib/browser";

export function UploadPage() {
  const { phase, progress, result, error, start, reset } = useUpload();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const busy = phase === "encrypting" || phase === "uploading";

  const pick = (f: File | undefined | null) => {
    if (!f || busy || phase === "done") return;
    setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const onCopy = async () => {
    if (!result) return;
    if (await copyToClipboard(result.link)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const restart = () => {
    setFile(null);
    reset();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-16">
      <SiteHeader />

      <Card className="my-auto mt-6">
        <CardContent className="space-y-4">
          {!cryptoAvailable() ? (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>Open over https</AlertTitle>
              <AlertDescription>
                Your browser blocks secure pages on plain http. Open this page
                over https (or on localhost) and try again.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error != null && (
                <Alert variant="destructive">
                  <TriangleAlert />
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {phase === "done" && result ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    Here's your one-time link — send it:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={result.link}
                      aria-label="share link"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                      variant="outline"
                      size="icon-lg"
                      onClick={onCopy}
                      aria-label={copied ? "copied" : "copy link"}
                    >
                      {copied ? <Check /> : <Copy />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The link only works for one person and expires on its own —
                    about 10 minutes from now, or shortly after the first
                    download.
                  </p>
                  <Button variant="outline" className="h-11 w-full" onClick={restart}>
                    Send another file
                  </Button>
                </div>
              ) : (
                <>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!dragging) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    data-dragging={dragging || undefined}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50 data-dragging:border-foreground/40 data-dragging:bg-muted"
                  >
                    <Input
                      type="file"
                      className="sr-only"
                      disabled={busy}
                      onChange={(e) => {
                        pick(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Tap to choose, or drop a file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      the file should be up to 100 MB
                    </span>
                  </label>

                  {file && (
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <FileText
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                      {!busy && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setFile(null)}
                          aria-label="remove file"
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  )}

                  {phase === "encrypting" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoaderCircle className="size-4 animate-spin" />
                      preparing your file…
                    </div>
                  )}

                  {phase === "uploading" && (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-xs text-muted-foreground">
                        uploading… {progress}%
                      </p>
                    </div>
                  )}

                  {file && !busy && (
                    <Button className="h-11 w-full" onClick={() => start(file)}>
                      Send
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
