'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, SparklesIcon, LayersIcon, HologramIcon, ShirtIcon, Loading01Icon, Settings02Icon, UserIcon, FolderIcon, PlayIcon, VideoReplayIcon, PaintBrushIcon, Image02Icon, ClipboardIcon, Leaf01Icon, SpiralsIcon, User02Icon, Share01Icon, Briefcase01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/ui/badge"

interface UnifiedSearchResult {
  id: string
  title: string
  description?: string
  type: 'model' | 'user' | 'storage' | 'generation'
  url: string
  metadata?: any
  created_at: string
}

interface SearchResponse {
  results: UnifiedSearchResult[]
  total: number
  query: string
  limit: number
  types: string[]
}

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: any
  image?: string
  action: () => void
  category?: string
  tokenCost?: number
}

interface CommandBoxProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (url: string) => void
}

export function CommandBox({ isOpen, onClose, onNavigate }: CommandBoxProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get type icon helper
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model': return LayersIcon
      case 'user': return UserIcon
      case 'storage': return FolderIcon
      case 'generation': return PlayIcon
      default: return Search01Icon
    }
  }

  // Get category icon helper for models
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return VideoReplayIcon
      case 'creative': return PaintBrushIcon
      case 'technical': return Settings02Icon
      case 'artistic': return Image02Icon
      case 'cinematic': return ClipboardIcon
      case 'nature': return Leaf01Icon
      case 'abstract': return SpiralsIcon
      case 'portrait': return User02Icon
      case 'animation': return Share01Icon
      case 'commercial': return Briefcase01Icon
      case 'editing': return LayersIcon
      case 'text': return HologramIcon
      case 'video': return VideoReplayIcon
      default: return LayersIcon
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setTotalResults(0)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search/unified?q=${encodeURIComponent(searchQuery.trim())}&limit=20`
        )
        
        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data: SearchResponse = await response.json()
        setSearchResults(data.results)
        setTotalResults(data.total)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Debounce search calls
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  const quickActions: CommandItem[] = []

  // Convert search results to command items
  const searchItems: CommandItem[] = searchResults.map(result => ({
    id: result.id,
    title: result.title,
    description: result.description || `${result.type} result`,
    // Always provide an image - either from metadata or placeholder
    image: result.type === 'model' ? (result.metadata?.image || '/placeholder2.png') : 
           result.type === 'user' ? (result.metadata?.avatar_url || '/placeholder2.png') :
           '/placeholder2.png',
    icon: result.type === 'model' && result.metadata?.category ? getCategoryIcon(result.metadata.category) : getTypeIcon(result.type),
    category: result.type,
    tokenCost: result.type === 'model' ? result.metadata?.tokens_per_generation : undefined,
    action: () => {
      onNavigate?.(result.url)
      onClose()
    }
  }))

  // Combine search results with quick actions
  const actions = query.trim() ? [
    // Add "search all" action
    {
      id: 'search-all',
      title: `Search all results for "${query.trim()}"`,
      description: `${totalResults} result${totalResults !== 1 ? 's' : ''} found`,
      icon: Search01Icon,
      category: 'Search',
      action: () => {
        onNavigate?.(`/search?q=${encodeURIComponent(query.trim())}`)
        onClose()
      }
    },
    ...searchItems
  ] : quickActions



  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }, [onClose])

  // Update keyboard event handler to use animated close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % actions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + actions.length) % actions.length)
          break
        case 'Enter':
          e.preventDefault()
          if (actions[selectedIndex]) {
            actions[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, actions, selectedIndex, handleClose])

  if (!isOpen && !isClosing) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-200"
      )}
      onClick={handleClose}
      data-state={isClosing ? "closed" : "open"}
    >
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div 
            className={cn(
              "bg-background rounded-md border border-border overflow-hidden mx-auto",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]",
              "duration-200 ease-out",
              "shadow-lg",
              "max-w-[min(640px,calc(100vw-2rem))]"
            )}
            onClick={(e) => e.stopPropagation()}
            data-state={isClosing ? "closed" : "open"}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-background/50">
              <HugeiconsIcon 
                icon={Search01Icon} 
                className="h-5 w-5 text-muted-foreground flex-shrink-0 transition-colors" 
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search AI models or navigate..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg transition-all duration-200 focus:placeholder:text-muted-foreground/70"
                autoComplete="off"
              />
              <Badge variant="secondary" className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                ESC
              </Badge>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <HugeiconsIcon icon={Loading01Icon} className="h-8 w-8 mx-auto mb-3 animate-spin" />
                  <p>Searching models...</p>
                </div>
              ) : actions.length > 0 ? (
                <div className="p-2">
                  {actions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-md text-left transition-all duration-150 group cursor-pointer",
                        "hover:bg-accent/50 active:bg-accent/70",
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                    >
                      {/* Model Image or Icon */}
                      {action.image ? (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/20 transition-all duration-150 group-hover:ring-border/40">
                          <img
                            src={action.image}
                            alt={action.title}
                            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== '/placeholder2.png') {
                                target.src = '/placeholder2.png';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/20 transition-all duration-150 group-hover:ring-border/40">
                          <img
                            src="/placeholder2.png"
                            alt={action.title}
                            className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{action.title}</div>
                        {action.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {action.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {action.tokenCost && (
                          <Badge variant="secondary" className="text-xs transition-all duration-150 group-hover:bg-secondary/80">
                            {action.tokenCost} tokens
                          </Badge>
                        )}
                        {action.category && (
                          <Badge variant="outline" className="text-xs transition-all duration-150 group-hover:border-border">
                            {action.category}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center text-muted-foreground">
                  <HugeiconsIcon icon={Search01Icon} className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No models found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <HugeiconsIcon icon={Search01Icon} className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Search AI models</p>
                  <p className="text-sm mt-1">Type to find models or browse categories</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3 bg-muted/10">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">↑↓</Badge>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">↵</Badge>
                    Select
                  </span>
                </div>
                <span className="opacity-70">Press ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
