'use client'

import { HugeiconsIcon } from "@hugeicons/react"
import { 
  DashboardSquare01Icon,
  BrainIcon,
  PencilEdit02Icon,
  Image01Icon,
  Folder01Icon,
  BookOpen01Icon,
  Settings01Icon
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"

interface DashboardSubheaderProps {
  title: string
  description?: string
  icon?: any
  iconClassName?: string
  iconBoxClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  className?: string
  children?: React.ReactNode
  showGradient?: boolean
  iconBoxVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'purple' | 'orange' | 'cyan' | 'beta'
}

export function DashboardSubheader({
  title,
  description,
  icon = DashboardSquare01Icon,
  iconClassName,
  iconBoxClassName,
  titleClassName,
  descriptionClassName,
  className,
  children,
  showGradient = true,
  iconBoxVariant = 'primary'
}: DashboardSubheaderProps) {
  
  // Icon box color variants - matching status badge design with inner shadows
  const iconBoxVariants = {
    primary: "border-blue text-blue bg-blue/10 shadow-[inset_0_1px_2px_rgba(59,130,246,0.15)]",
    secondary: "border-gray-500 text-gray-500 bg-gray-500/10 shadow-[inset_0_1px_2px_rgba(107,114,128,0.15)]", 
    success: "border-green text-green bg-green/10 shadow-[inset_0_1px_2px_rgba(34,197,94,0.15)]",
    warning: "border-yellow text-yellow bg-yellow/10 shadow-[inset_0_1px_2px_rgba(234,179,8,0.15)]",
    destructive: "border-red text-red bg-red/10 shadow-[inset_0_1px_2px_rgba(239,68,68,0.15)]",
    purple: "border-purple text-purple bg-purple/10 shadow-[inset_0_1px_2px_rgba(168,85,247,0.15)]",
    orange: "border-orange text-orange bg-orange/10 shadow-[inset_0_1px_2px_rgba(249,115,22,0.15)]",
    cyan: "border-cyan text-cyan bg-cyan/10 shadow-[inset_0_1px_2px_rgba(6,182,212,0.15)]",
    beta: "border-[oklch(0.75_0.15_70)] text-[oklch(0.75_0.15_70)] bg-[oklch(0.75_0.15_70)]/10 shadow-[inset_0_1px_2px_rgba(255,165,0,0.15)]"
  }
  return (
    <div className={cn(
      "flex items-start justify-between gap-4 p-6 border-b border-border/50",
      showGradient && "bg-gradient-to-r from-background via-background to-background/95",
      "backdrop-blur-sm transition-all duration-200",
      className
    )}>
      {/* Left side - Icon, Title and Description */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Icon Box */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12", // Fixed size icon box
          "border font-medium", // Border like status badge
          "flex items-center justify-center",
          "backdrop-blur-sm", // Backdrop blur like status badge
          "transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "hover:shadow-sm", // Subtle hover effect
          iconBoxVariants[iconBoxVariant], // Dynamic color variants matching status badge
          iconBoxClassName
        )}>
          <HugeiconsIcon 
            icon={icon} 
            className={cn(
              "w-6 h-6", // Remove text-primary since color comes from parent
              iconClassName
            )} 
          />
        </div>

        {/* Title and Description */}
        <div className="min-w-0 flex-1">
          <h1 className={cn(
            "text-2xl font-bold tracking-tight text-foreground",
            "mb-1",
            titleClassName
          )}>
            {title}
          </h1>
          {description && (
            <p className={cn(
              "text-muted-foreground text-sm leading-relaxed",
              "max-w-2xl",
              descriptionClassName
            )}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Additional content only */}
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

// Preset variants for common dashboard pages
export const DashboardSubheaderVariants = {
  dashboard: {
    title: "Dashboard",
    description: "Welcome to your dashboard",
    icon: DashboardSquare01Icon
  },
  prompts: {
    title: "Custom Prompts", 
    description: "Create and manage your custom AI prompts",
    icon: PencilEdit02Icon
  },
  gallery: {
    title: "Gallery",
    description: "View and organize your generated images",
    icon: Image01Icon
  },
  projects: {
    title: "Projects",
    description: "Manage your creative projects and workflows",
    icon: Folder01Icon
  },
  docs: {
    title: "Documentation",
    description: "Learn how to use the platform effectively",
    icon: BookOpen01Icon
  },
  settings: {
    title: "Settings",
    description: "Configure your account and preferences",
    icon: Settings01Icon
  }
}

// Helper function to get variant by route
export function getSubheaderVariant(pathname: string) {
  if (pathname.startsWith('/dashboard/prompts') || pathname === '/prompts') {
    return DashboardSubheaderVariants.prompts
  }
  if (pathname.startsWith('/dashboard/gallery') || pathname === '/gallery') {
    return DashboardSubheaderVariants.gallery
  }
  if (pathname.startsWith('/dashboard/projects') || pathname === '/projects') {
    return DashboardSubheaderVariants.projects
  }
  if (pathname.startsWith('/dashboard/docs') || pathname === '/docs') {
    return DashboardSubheaderVariants.docs
  }
  if (pathname.startsWith('/dashboard/settings') || pathname === '/settings') {
    return DashboardSubheaderVariants.settings
  }
  return DashboardSubheaderVariants.dashboard
}
