"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@workspace/ui/components/ui/sidebar"
import { Separator } from "@workspace/ui/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage } from "@workspace/ui/components/ui/breadcrumb"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { Button } from "@workspace/ui/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@workspace/ui/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowDown01Icon,
  DashboardSquare01Icon,
  BrainIcon,
  BookOpen01Icon,
  Settings01Icon,
  UserGroupIcon,
  Cancel01Icon,
  Home01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Copy01Icon,
  Share01Icon,
  PencilEdit02Icon,
  Image01Icon,
  Folder01Icon,
  Key01Icon
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
 import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/ui/avatar"
import { IconLogout, IconSettings, IconUserCircle, IconCreditCard, IconBell } from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/ui/badge"
import { FalApiKeyDialog } from "@workspace/ui/components/fal-api-key-dialog"

// Define navigation structure with subpages
const navigationStructure = {
  dashboard: {
    name: 'Dashboard',
    icon: DashboardSquare01Icon,
    href: '/dashboard',
    subpages: [
      { name: 'Overview', href: '/dashboard' },
      { name: 'Analytics', href: '/dashboard/analytics' },
      { name: 'Recent Activity', href: '/dashboard/activity' }
    ]
  },
  prompts: {
    name: 'Custom Prompts',
    icon: PencilEdit02Icon,
    href: '/prompts',
    subpages: [
      { name: 'Video Prompts', href: '/prompts' },
      { name: 'Create Video Prompt', href: '/contribute/custom-prompt' },
      { name: 'Create Video Prompt Category', href: '/contribute/prompt-categories' },
      { name: 'Shared Prompts', href: '/prompts/shared' }
    ]
  } 
}

interface User {
  id: string
  name?: string
  email?: string
  avatar?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

interface BreadcrumbItem {
  name: string
  href: string
  isLast: boolean
  icon?: any
  subpages: any[]
  hasDropdown: boolean
  actions?: Array<{
    name: string
    icon: any
    action: () => void
  }>
}

interface DashboardHeaderProps {
  pathname?: string
  user?: User
  onNavigate?: (url: string) => void
  onSignOut?: () => void
  navigationHistory?: string[]
  className?: string
}

export function DashboardHeader({ 
  pathname = '/', 
  user, 
  onNavigate, 
  onSignOut,
  className,
  navigationHistory = []
}: DashboardHeaderProps) {
  // Always show toggle - the layout will control actual expand/collapse behavior
  const shouldShowToggle = true

  // Generate user initials
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }



  // Function to copy URL to clipboard
  const copyUrlToClipboard = async (url: string) => {
    try {
      const fullUrl = (typeof window !== 'undefined' ? window.location.origin : '') + url
      await navigator.clipboard.writeText(fullUrl)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  // Generate advanced breadcrumbs with enhanced features
  const generateAdvancedBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname?.split('/').filter(Boolean) || []
    const breadcrumbs: BreadcrumbItem[] = []

    // Always add home as first breadcrumb if not on root
    if (segments.length > 0) {
      breadcrumbs.push({
        name: 'Home',
        href: '/',
        isLast: false,
        icon: Home01Icon,
        subpages: [],
        hasDropdown: false,
        actions: [
          {
            name: 'Go to Dashboard',
            icon: DashboardSquare01Icon,
            action: () => onNavigate?.('/dashboard')
          }
        ]
      })
    }

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (!segment) continue
      
      const href = '/' + segments.slice(0, i + 1).join('/')
      const isLast = i === segments.length - 1

      // Find matching navigation structure
      let name = segment
      let icon = null
      let subpages: any[] = []
      let actions: Array<{ name: string; icon: any; action: () => void }> = []

      // Check if this segment matches a main navigation item
      Object.values(navigationStructure).forEach((nav: any) => {
        if (nav.href === href || (nav.href === `/${segment}` && i === 0)) {
          name = nav.name
          icon = nav.icon
          subpages = nav.subpages
        }
      })

      // Handle special cases for dynamic routes
      if (segment === 'dashboard') {
        name = 'Dashboard'
        icon = DashboardSquare01Icon
        actions = [
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]
      } else if (segment === 'prompts') {
        name = 'Custom Prompts'
        icon = PencilEdit02Icon
        subpages = navigationStructure.prompts.subpages
        actions = [
          {
            name: 'Create New Prompt',
            icon: PencilEdit02Icon,
            action: () => onNavigate?.('/prompts/create')
          },
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]

      } else if (segment === 'users') {
        name = 'Users'
        icon = UserGroupIcon
        actions = [
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]
      } else if (segment === 'quick-start') {
        name = 'Quick Start'
        actions = [
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]
      } else if (segment.match(/^[a-f0-9-]{36}$/)) {
        // Handle UUID segments (like app/model IDs)
        name = `ID: ${segment.slice(0, 8)}...`
        actions = [
          {
            name: 'Copy Full ID',
            icon: Copy01Icon,
            action: () => navigator.clipboard.writeText(segment)
          },
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]
      } else {
        // Capitalize first letter for other segments
        name = segment.charAt(0).toUpperCase() + segment.slice(1)
        actions = [
          {
            name: 'Copy URL',
            icon: Copy01Icon,
            action: () => copyUrlToClipboard(href)
          }
        ]
      }

      breadcrumbs.push({
        name,
        href,
        isLast,
        icon,
        subpages,
        hasDropdown: subpages.length > 0 || actions.length > 0,
        actions
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateAdvancedBreadcrumbs()

  // Recent navigation for quick access
  const recentNavigation = navigationHistory.slice(-5).reverse().filter(path => path !== pathname)

  return (
    <header className={cn(
      "sticky top-0 z-[51] flex h-16 shrink-0 items-center gap-2",
      "backdrop-blur-xl bg-background/95 border-b border-border/50",
      "transition-[width,height] ease-linear",
      "will-change-transform", // Performance hint for sticky positioning
      "[contain:layout_style]", // CSS containment for better performance
      className
    )}>
      {/* Left side - Logo, Sidebar toggle and breadcrumbs */}
      <div className="flex items-center gap-2 px-4">
        
        
        {shouldShowToggle && (
          <>
             <SidebarTrigger className="" />
            <Separator orientation="vertical" className="mx-2 h-4" />
          </>
        )}
        
        {/* Advanced Breadcrumbs with Enhanced Features */}
        <div className="flex items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList className="flex items-center">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden sm:block mx-1">
                      <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3 text-muted-foreground" />
                    </BreadcrumbSeparator>
                  )}
                  <BreadcrumbItem className={cn(
                    "transition-all duration-200",
                    index === 0 ? "block" : "hidden sm:block"
                  )}>
                    {crumb.hasDropdown ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className={cn(
                              "h-auto px-2 py-1 font-normal text-sm transition-all duration-200",
                              "hover:bg-accent/50 hover:text-accent-foreground",
                              "focus:bg-accent/50 focus:text-accent-foreground",
                              crumb.isLast ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              {crumb.icon && (
                                <HugeiconsIcon 
                                  icon={crumb.icon} 
                                  className="w-4 h-4 transition-colors"
                                />
                              )}
                              <span className="max-w-[120px] truncate">{crumb.name}</span>
                              {!crumb.isLast && (
                                <HugeiconsIcon 
                                  icon={ArrowDown01Icon} 
                                  className="w-3 h-3 opacity-50 transition-transform group-data-[state=open]:rotate-180" 
                                />
                              )}
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 p-1">
                          {/* Navigation Subpages */}
                          {crumb.subpages.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Navigate
                              </div>
                              {crumb.subpages.map((subpage: any) => (
                                <DropdownMenuItem 
                                  key={subpage.href} 
                                  onClick={() => onNavigate?.(subpage.href)}
                                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                                >
                                  <span>{subpage.name}</span>
                                </DropdownMenuItem>
                              ))}
                              {crumb.actions && crumb.actions.length > 0 && <DropdownMenuSeparator />}
                            </>
                          )}
                          
                          {/* Contextual Actions */}
                          {crumb.actions && crumb.actions.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                              </div>
                              {crumb.actions.map((action, actionIndex) => (
                                <DropdownMenuItem 
                                  key={actionIndex}
                                  onClick={action.action}
                                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                                >
                                  <HugeiconsIcon icon={action.icon} className="w-4 h-4" />
                                  <span>{action.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : crumb.isLast ? (
                      <BreadcrumbPage className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
                        "text-foreground font-medium bg-accent/30"
                      )}>
                        {crumb.icon && (
                          <HugeiconsIcon 
                            icon={crumb.icon} 
                            className="w-4 h-4 mr-2 text-muted-foreground"
                          />
                        )}
                        <span className="max-w-[120px] truncate">{crumb.name}</span>
                      </BreadcrumbPage>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => onNavigate?.(crumb.href)}
                        className={cn(
                          "h-auto px-2 py-1 font-normal text-sm transition-all duration-200",
                          "hover:bg-accent/50 hover:text-accent-foreground",
                          "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {crumb.icon && (
                            <HugeiconsIcon 
                              icon={crumb.icon} 
                              className="w-4 h-4"
                            />
                          )}
                          <span className="max-w-[120px] truncate">{crumb.name}</span>
                        </div>
                      </Button>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Recent Navigation Quick Access */}
          {recentNavigation.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <HugeiconsIcon icon={Clock01Icon} className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent
                </div>
                {recentNavigation.map((path) => {
                  const pathSegments = path.split('/').filter(Boolean)
                  const lastSegment = pathSegments[pathSegments.length - 1]
                  const displayName = lastSegment && lastSegment.length > 0
                    ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
                    : 'Home'
                  
                  return (
                    <DropdownMenuItem 
                      key={path}
                      onClick={() => onNavigate?.(path)}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                    >
                      <HugeiconsIcon icon={Clock01Icon} className="w-4 h-4 opacity-50" />
                      <span className="truncate">{displayName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{path}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Right side - Theme toggle, API Key, and User Avatar */}
      <div className="ml-auto flex items-center gap-3 px-4">
        <ThemeToggle />
        
        {/* FAL API Key Button */}
        <FalApiKeyDialog>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HugeiconsIcon icon={Key01Icon} className="h-4 w-4" />
          </Button>
        </FalApiKeyDialog>
        
        {/* User Avatar Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || user.email || ''} 
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.user_metadata?.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {/* User Info Section */}
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || user.email || ''} 
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(user.user_metadata?.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 leading-none">
                  <p className="font-semibold text-sm text-foreground">
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {/* Credits & Plan Section */}
              <div className="px-2 pb-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                  <div className="flex items-center gap-2">
                    <IconCreditCard className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">4,231 Credits</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Pro Plan
                  </Badge>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Notifications */}
              <DropdownMenuItem asChild>
                <button 
                  onClick={() => onNavigate?.('/notifications')} 
                  className="flex items-center justify-between gap-2 px-2 py-2 w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <IconBell className="h-4 w-4" />
                    <span className="text-sm">Notifications</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </button>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Profile */}
              <DropdownMenuItem asChild>
                <button 
                  onClick={() => onNavigate?.('/profile')} 
                  className="flex items-center gap-2 px-2 py-2 w-full text-left"
                >
                  <IconUserCircle className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </button>
              </DropdownMenuItem>
              
              {/* Settings */}
              <DropdownMenuItem asChild>
                <button 
                  onClick={() => onNavigate?.('/settings')} 
                  className="flex items-center gap-2 px-2 py-2 w-full text-left"
                >
                  <IconSettings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </button>
              </DropdownMenuItem>
              
              {/* Billing */}
              <DropdownMenuItem asChild>
                <button 
                  onClick={() => onNavigate?.('/billing')} 
                  className="flex items-center gap-2 px-2 py-2 w-full text-left"
                >
                  <IconCreditCard className="h-4 w-4" />
                  <span className="text-sm">Billing</span>
                </button>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Log out */}
              <DropdownMenuItem 
                onClick={() => onSignOut?.()}
                className="flex items-center gap-2 px-2 py-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <IconLogout className="h-4 w-4" />
                <span className="text-sm">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>


    </header>
  )
}
