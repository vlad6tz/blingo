import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium tracking-tight"
      >
        <img src="/favicon.svg" alt="" className="size-5" aria-hidden />
        blingo
      </Link>
    </header>
  );
}
