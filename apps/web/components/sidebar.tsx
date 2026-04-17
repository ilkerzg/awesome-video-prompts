"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, Clock, Clapperboard, Camera, Layers, Braces, BookOpen, PenLine, MessageSquareText, Film, Podcast, Settings } from "lucide-react";

const mainNav = [
  { href: "/", icon: Clapperboard, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/generate", icon: Sparkles, label: "Generate" },
];

const tools = [
  { href: "/prompt-gen", icon: MessageSquareText, label: "Prompt" },
  { href: "/json-prompt", icon: Braces, label: "JSON" },
  { href: "/shot-composer", icon: Camera, label: "Shots" },
  { href: "/multi-shot", icon: Layers, label: "Multi" },
  { href: "/scenario", icon: BookOpen, label: "Scenes" },
  { href: "/shorts", icon: Film, label: "Shorts" },
  { href: "/podcast", icon: Podcast, label: "Podcast" },
];

const bottomNav = [
  { href: "/blog", icon: PenLine, label: "Blog" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; active: boolean }) {
  return (
    <Link href={href}
      className={`group relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 transition-colors ${active ? "text-[color:var(--accent)]" : "text-foreground/25 hover:text-foreground/50"}`}
    >
      {active && <span className="absolute -left-[calc(50%-1px)] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--accent)]" />}
      <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
      <span className="text-[8px] font-medium leading-tight">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[72px] flex-col items-center border-r border-[color:var(--separator)] bg-[color:var(--surface)] py-4 md:flex">
      <Link href="/" className="mb-5 flex size-8 items-center justify-center rounded-lg bg-[color:var(--accent)]">
        <Clapperboard size={15} className="text-black" />
      </Link>

      <nav className="flex flex-col items-center gap-0.5">
        {mainNav.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
      </nav>

      <div className="my-3 h-px w-8 bg-[color:var(--separator)]" />

      <nav className="flex flex-col items-center gap-0.5">
        {tools.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
      </nav>

      <div className="flex-1" />

      <nav className="flex flex-col items-center gap-0.5">
        {bottomNav.map((item) => <NavItem key={item.href} {...item} active={isActive(item.href)} />)}
      </nav>
    </aside>
  );
}
