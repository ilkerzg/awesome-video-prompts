"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MagicWand01Icon,
  Image01Icon,

  NewTwitterIcon,
  Globe02Icon,
  Coffee01Icon,
  FavouriteIcon,
  RocketIcon,
  Github01Icon,
  SourceCodeIcon,
  Film02Icon,
} from "@hugeicons/core-free-icons"

 import { NavMain } from "@workspace/ui/components/nav-main"
import { NavSecondary } from "@workspace/ui/components/nav-secondary"
 import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/ui/sidebar"
import { DynamicLogo } from "@workspace/ui/components/dynamic-logo"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip"
import { Button } from "@workspace/ui/components/ui/button"
 
const data = {
  navMain: [
    {
      title: "Prompt Generator",
      url: "/prompt-generator",
      icon: MagicWand01Icon,
    },
    {
      title: "JSON Prompt Generator",
      url: "/json-prompt",
      icon: SourceCodeIcon,
    },
    {
      title: "Multi-Shot Generator",
      url: "/multi-shot",
      icon: Film02Icon,
    },
    {
      title: "Prompt Gallery",
      url: "/prompts",
      icon: Image01Icon,
    },
    {
      title: "Contribute",
      url: "/contribute",
      icon: FavouriteIcon,
    },
  ],
  socialLinks: [
    {
      title: "Follow me on X (Twitter)",
      url: "https://x.com/ailker",
      icon: NewTwitterIcon,
    },
    {
      title: "Buy me a coffee",
      url: "https://buymeacoffee.com/ilkerzg",
      icon: Coffee01Icon,
    },
    {
      title: "GitHub Repository",
      url: "https://github.com/ilkerzg/awesome-video-prompts",
      icon: Github01Icon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar 
      side="left" 
      collapsible="icon" 
      className="sticky left-0 top-0 z-40 h-screen"
      {...props}
    >
      <SidebarHeader className="group-data-[collapsible=icon]:p-3 p-6 border-b border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-0 hover:bg-transparent w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
            >
              <a href="/" className="flex items-center justify-start !p-0 gap-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                <DynamicLogo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:p-2 p-6 border-t border-border/50">
        <TooltipProvider>
          <div className="flex justify-start gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
            {data.socialLinks.map((link) => (
              <Tooltip key={link.title}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-9 w-9 p-0 rounded-md hover:bg-accent/80 transition-colors duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <HugeiconsIcon 
                        icon={link.icon} 
                        className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:h-3.5 group-data-[collapsible=icon]:w-3.5" 
                      />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">
                  <p>{link.title}</p>
                </TooltipContent>
                <TooltipContent side="top" className="group-data-[collapsible=icon]:hidden block">
                  <p>{link.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  )
}
