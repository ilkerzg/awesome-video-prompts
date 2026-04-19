"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/generate", label: "Generate" },
  { href: "/prompt-gen", label: "Prompt Generator" },
  { href: "/shot-composer", label: "Shot Composer" },
  { href: "/multi-shot", label: "Multi-Shot" },
  { href: "/json-prompt", label: "JSON Prompt" },
  { href: "/scenario", label: "Scenario" },
  { href: "/blog", label: "Blog" },
  { href: "/shorts", label: "Shorts Creator" },
  { href: "/podcast", label: "Podcast Creator" },
  { href: "/history", label: "History" },
];

export function TopBar({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--separator)] bg-[color:var(--surface)]/80 backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger — sidebar hidden on mobile, use this instead */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md p-1 text-foreground/40 hover:text-foreground md:hidden">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-bold tracking-tight text-[color:var(--accent)] sm:block">
            fal Prompts
          </span>
          <button onClick={toggle} className="rounded-md p-1.5 text-foreground/30 hover:text-foreground" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="flex flex-col gap-0.5 border-t border-[color:var(--separator)] px-3 py-2 md:hidden">
          {mobileNavItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-[color:var(--default)] text-foreground" : "text-foreground/40"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
