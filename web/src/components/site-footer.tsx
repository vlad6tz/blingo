import { Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How long does a file stay available?",
    a: "At most 10 minutes, and it disappears shortly after the first download. After that it is gone for good.",
  },
  {
    q: "Can the server see my file?",
    a: "No. Your file is locked inside your browser before it ever leaves your device, and this server only ever handles locked bytes.",
  },
  {
    q: "What if I lose the link or the code?",
    a: "The file cannot be recovered. Nothing on the server side can open it, so keep the link or the six digits somewhere safe until your recipient has the file.",
  },
  {
    q: "What is the code for?",
    a: "A convenience. Instead of a link, the sender gets a six-digit code the recipient can type on this site. It is easier to read out over a phone call, and a little less protected than the link itself.",
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-[30dvh] space-y-8 pt-12 pb-2 text-sm text-muted-foreground md:mt-auto">
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-10">
        <div className="space-y-4">
          <p className="leading-relaxed">
            blingo is a learning project, not a certified service, so please
            don't send anything you can't afford to lose.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Questions, found a bug?</span>
            <a
              href="https://github.com/vlad6tz/blingo/issues"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              GitHub issues
            </a>
            <a
              href="mailto:vlad@vladutz.dev"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              <Mail className="size-3.5" aria-hidden />
              vlad@vladutz.dev
            </a>
          </div>
        </div>

        <div className="mt-6 md:mt-0">
          <Accordion type="single" collapsible>
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-4 text-sm">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </footer>
  );
}
