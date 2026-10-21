import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium tracking-tight"
      >
        <ShieldCheck className="size-4" aria-hidden />
        blingo
      </Link>
    </header>
  );
}
