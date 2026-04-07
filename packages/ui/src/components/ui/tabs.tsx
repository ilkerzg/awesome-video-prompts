"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
} 

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  WrapperClassName?: string
}

function TabsList({
  className,
  children,
  WrapperClassName,
  ...props
}: TabsListProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }, [])

  React.useEffect(() => {
    checkScroll()
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        scrollContainer.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className={cn(`relative group/tabs ${WrapperClassName} `)}>
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-none (for-testing) opacity-0 group-hover/tabs:opacity-100 transition-all hover:scale-110"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-none (for-testing) opacity-0 group-hover/tabs:opacity-100 transition-all hover:scale-110"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Scroll Container */}
      <div className="relative rounded-md overflow-hidden">
        <div
          ref={scrollContainerRef}
          className={cn(
            "overflow-x-auto scrollbar-none relative",
            className
          )}
        >
          <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
              "inline-flex h-10 w-max items-center justify-start p-1",
              "bg-muted/30 border border-border/50",
              "rounded-md shadow-none (for-testing)",
              "flex-nowrap gap-0.5",
              "tabs-list-wrapper"
            )}
            {...props}
          >
            {children}
          </TabsPrimitive.List>
        </div>
        {/* Enhanced Scroll Shadows */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10",
            "tabs-scroll-shadow-left",
            "transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10",
            "tabs-scroll-shadow-right",
            "transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  )
}

interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "compact" | "wide" | "full"
}

const tabVariants = {
  default: "min-w-[120px] w-[120px]",
  compact: "min-w-[80px] w-[80px]",
  wide: "min-w-[160px] w-[160px]",
  full: "min-w-[200px] w-[200px]"
}

function TabsTrigger({
  className,
  variant = "default",
  ...props
}: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3",
        "text-sm font-medium transition-all duration-200",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        // Inactive state
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/50",
        // Active state
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "data-[state=active]:shadow-none (for-testing) data-[state=active]:border data-[state=active]:border-border/50",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Size variant
        "flex-shrink-0",
        tabVariants[variant],
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
