import { useParams } from "react-router-dom";
import {
  Download,
  FileText,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
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

export function DownloadPage() {
  const { id } = useParams();
  const { phase, file, error } = useDownload(id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-16">
      <SiteHeader />

      <div className="my-auto mt-6 space-y-4">
        {phase === "loading" && (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
            getting your file ready…
          </div>
        )}

        {phase === "invalid" && (
          <Problem title="This link looks incomplete">
            Part of it is missing, so the file can't be recovered. Ask the
            sender for a fresh link.
          </Problem>
        )}

        {phase === "expired" && (
          <Problem title="Nothing here anymore">
            This link has expired or its file was already received. Ask the
            sender for a new one.
          </Problem>
        )}

        {phase === "error" && error != null && (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>Couldn't open the file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
    </div>
  );
}
