"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/generate", label: "Generate" },
  { href: "/gallery", label: "Gallery" },
  { href: "/history", label: "History" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.04em] text-foreground"
        >
          fal<span className="text-[color:var(--accent)]">.</span>prompts
        </Link>

        {/* Pill Nav */}
        <nav className="hidden items-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface)]/60 p-1 backdrop-blur-sm md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex size-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link
            href="/generate"
            className="hidden rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 sm:block"
          >
            Start Creating
          </Link>
        </div>
      </div>
    </header>
  );
}
