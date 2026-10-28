import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Download,
  FileText,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { CODE_PATTERN } from "@/crypto/code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatBytes, saveBlob } from "@/lib/browser";

function Problem({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

function CodeForm({ onEnter }: { onEnter: (code: string) => void }) {
  const [code, setCode] = useState("");
  const valid = CODE_PATTERN.test(code);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onEnter(code);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium">Enter your share code</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            aria-label="share code"
            className="h-12 text-center font-mono text-xl tracking-[0.3em]"
          />
          <Button type="submit" className="h-11 w-full" disabled={!valid}>
            Open it
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Ask the sender for the six digits that came with the file.
        </p>
      </CardContent>
    </Card>
  );
}

const CODE_HELP = "Ask the sender for a new code, the file it carried is gone.";

export function DownloadPage() {
  const { id } = useParams();
  const { mode, phase, file, error, submitCode } = useDownload(id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-16 md:max-w-3xl md:px-8">
      <SiteHeader />

      <div className="mt-12 space-y-4 md:mx-auto md:w-full md:max-w-md">
        {mode === "code" ? (
          <>
            {phase === "code" && <CodeForm onEnter={submitCode} />}

            {phase === "loading" && (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin" />
                getting your file ready…
              </div>
            )}

            {phase === "expired" && (
              <Problem title="Nothing here anymore">{CODE_HELP}</Problem>
            )}

            {phase === "error" && error != null && (
              <>
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>Couldn't open the file</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <CodeForm onEnter={submitCode} />
              </>
            )}
          </>
        ) : (
          <>
            {phase === "loading" && (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin" />
                getting your file ready…
              </div>
            )}

            {phase === "invalid" && (
              <>
                <Problem title="This link looks incomplete">
                  Part of it is missing, so the file can't be recovered. Ask the
                  sender for a fresh link.
                </Problem>
                <p className="text-center text-xs text-muted-foreground">
                  Instead have a code?{" "}
                  <Link to="/d" className="underline underline-offset-2">
                    Enter it here
                  </Link>
                </p>
              </>
            )}

            {phase === "expired" && (
              <>
                <Problem title="Nothing here anymore">
                  This link has expired or its file was already received. Ask
                  the sender for a new one.
                </Problem>
                <p className="text-center text-xs text-muted-foreground">
                  Instead have a code?{" "}
                  <Link to="/d" className="underline underline-offset-2">
                    Enter it here
                  </Link>
                </p>
              </>
            )}

            {phase === "error" && error != null && (
              <>
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>Couldn't open the file</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </>
            )}
          </>
        )}

        {phase === "ready" && file && (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {file.type || "unknown type"} · {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Button
                className="h-11 w-full"
                onClick={() => saveBlob(file.blob, file.name)}
              >
                <Download />
                Save file
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
