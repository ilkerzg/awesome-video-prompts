'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowLeft02Icon, ArrowRight02Icon, ArrowDown01Icon, VideoReplayIcon } from "@hugeicons/core-free-icons"
import { Input } from "@workspace/ui/components/ui/input"
import { Button } from "@workspace/ui/components/ui/button"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import { VideoPromptCard } from "@workspace/ui/components/prompts/video-prompt-card"
import { PromptDetailsDrawer } from "../../components/prompt-details-drawer"
import { DashboardSubheader } from "@workspace/ui/components/dashboard-subheader"
import { PromptsGridSkeleton } from "@workspace/ui/components/skeletons"
import { Skeleton } from "@workspace/ui/components/ui/skeleton"
import { clientDataApi as dataApi, type CustomPrompt } from "../../lib/client-data-loader"
import { getSourceUrl, getSourceDisplayName } from "../../types/source"
import type { VideoPrompt } from "@workspace/ui/types/prompt"

// Convert CustomPrompt to VideoPrompt format
function convertToVideoPrompt(customPrompt: CustomPrompt): VideoPrompt {
  // Convert tags from objects to strings
  const tags = Array.isArray(customPrompt.tags) 
    ? customPrompt.tags.map(tag => 
        typeof tag === 'string' ? tag : (tag as any)?.name || (tag as any)?.id || String(tag)
      )
    : []

  // Handle source using the new PromptSource interface
  const sourceUrl = getSourceUrl(customPrompt.source)
  const sourceDisplayName = getSourceDisplayName(customPrompt.source)

  return {
    id: customPrompt.id,
    title: customPrompt.title,
    description: customPrompt.description || '',
    prompt: customPrompt.prompt, // Use the actual prompt field from JSON
    category: customPrompt.category as VideoPrompt['category'],
    modelName: customPrompt.modelName || 'Unknown',
    creator: sourceDisplayName,
    source: customPrompt.source, // Preserve the original source object
    status: customPrompt.featured ? 'featured' : 'active',
    thumbnail: customPrompt.thumbnailUrl,
    previewVideo: customPrompt.video,
    createdAt: new Date().toISOString(),
    tags: tags,
    generationType: customPrompt.generationType as VideoPrompt['generationType']
  }
}

function PromptsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompts, setPrompts] = useState<CustomPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCreator, setSelectedCreator] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPrompt, setSelectedPrompt] = useState<VideoPrompt | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  const ITEMS_PER_PAGE = 10

  // Initialize state from URL parameters
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const creator = searchParams.get('creator') || ''
    const model = searchParams.get('model') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    
    setSearchQuery(search)
    setSelectedCategory(category)
    setSelectedTags(tags)
    setSelectedCreator(creator)
    setSelectedModel(model)
    setCurrentPage(page)
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback((params: Record<string, string | number | string[]>) => {
    const url = new URL(window.location.href)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','))
        } else {
          url.searchParams.set(key, String(value))
        }
      } else {
        url.searchParams.delete(key)
      }
    })
    
    router.push(url.pathname + url.search, { scroll: false })
  }, [router])

  // Load prompts from API
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setLoading(true)
        const response = await dataApi.getCustomPrompts({ limit: 100 })
        setPrompts(response.prompts)
      } catch (error) {
        console.error('Failed to load prompts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPrompts()
  }, [])

  // Filter prompts based on all criteria
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => 
        Array.isArray(prompt.tags) && 
        prompt.tags.some(promptTag => 
          typeof promptTag === 'string' 
            ? promptTag.toLowerCase().includes(tag.toLowerCase())
            : (promptTag as any)?.name?.toLowerCase().includes(tag.toLowerCase())
        )
      )
    
    const matchesCreator = selectedCreator === '' || 
      (prompt.source && getSourceDisplayName(prompt.source).toLowerCase().includes(selectedCreator.toLowerCase()))
    
    const matchesModel = selectedModel === '' || 
      (prompt.modelName && prompt.modelName.toLowerCase().includes(selectedModel.toLowerCase()))
    
    return matchesSearch && matchesCategory && matchesTags && matchesCreator && matchesModel
  })

  // Pagination
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPrompts = filteredPrompts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Get unique values for filters
  const categories = ['all', ...Array.from(new Set(prompts.map(p => p.category)))]
  const allTags = Array.from(new Set(
    prompts.flatMap(p => 
      Array.isArray(p.tags) 
        ? p.tags.map(tag => typeof tag === 'string' ? tag : (tag as any)?.name || String(tag))
        : []
    )
  )).filter(Boolean)
  const allCreators = Array.from(new Set(
    prompts.map(p => p.source ? getSourceDisplayName(p.source) : '').filter(Boolean)
  ))
  const allModels = Array.from(new Set(
    prompts.map(p => p.modelName || '').filter(Boolean)
  ))

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    updateURL({ search: value, category: selectedCategory, tags: selectedTags, creator: selectedCreator, model: selectedModel, page: 1 })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    updateURL({ search: searchQuery, category, tags: selectedTags, creator: selectedCreator, model: selectedModel, page: 1 })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    setCurrentPage(1)
    updateURL({ search: searchQuery, category: selectedCategory, tags: newTags, creator: selectedCreator, model: selectedModel, page: 1 })
  }

  const handleCreatorChange = (creator: string) => {
    setSelectedCreator(creator)
    setCurrentPage(1)
    updateURL({ search: searchQuery, category: selectedCategory, tags: selectedTags, creator, model: selectedModel, page: 1 })
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    setCurrentPage(1)
    updateURL({ search: searchQuery, category: selectedCategory, tags: selectedTags, creator: selectedCreator, model, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({ search: searchQuery, category: selectedCategory, tags: selectedTags, creator: selectedCreator, model: selectedModel, page })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedTags([])
    setSelectedCreator('')
    setSelectedModel('')
    setCurrentPage(1)
    updateURL({})
  }

  // Drawer handlers
  const handleOpenDrawer = (prompt: VideoPrompt) => {
    setSelectedPrompt(prompt)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedPrompt(null)
  }

  if (loading) {
    return (
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="flex-1 p-0 bg-background">
          <div className="min-h-screen bg-muted/30">
            {/* Header — matches DashboardSubheader */}
            <div className="flex items-start gap-4 p-6 border-b border-border/50">
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-7 w-48 mb-1.5" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <div className="space-y-6 p-6">
              {/* Search + Filters */}
              <div className="space-y-4">
                <Skeleton className="h-9 w-full rounded-md" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-9 w-[180px] rounded-md" />
                  <Skeleton className="h-9 w-[180px] rounded-md" />
                  <Skeleton className="h-9 w-[180px] rounded-md" />
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-36" />
              <PromptsGridSkeleton />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="flex-1 p-0 bg-background">
        <div className="min-h-screen bg-muted/30">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-border/50 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm transition-all duration-200">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="flex-shrink-0 w-12 h-12 border font-medium flex items-center justify-center backdrop-blur-sm transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:shadow-sm border-purple text-purple bg-purple/10 shadow-[inset_0_1px_2px_rgba(168,85,247,0.15)]">
                <HugeiconsIcon icon={VideoReplayIcon} className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Video Prompts</h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">Discover and explore curated video generation prompts from the community</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <HugeiconsIcon 
                  icon={Search01Icon} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" 
                />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-10"
                />
              </div>
              
              {/* Filter Row */}
              <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[180px]">
                  {selectedCategory === 'all' ? 'All Categories' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                {categories.map(category => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className="cursor-pointer"
                  >
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Creator Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[180px]">
                  {selectedCreator || 'All Creators'}
                  <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuItem
                  onClick={() => handleCreatorChange('')}
                  className="cursor-pointer"
                >
                  All Creators
                </DropdownMenuItem>
                {allCreators.map(creator => (
                  <DropdownMenuItem
                    key={creator}
                    onClick={() => handleCreatorChange(creator)}
                    className="cursor-pointer"
                  >
                    {creator}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Model Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[180px]">
                  {selectedModel || 'All Models'}
                  <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[180px]">
                <DropdownMenuItem
                  onClick={() => handleModelChange('')}
                  className="cursor-pointer"
                >
                  All Models
                </DropdownMenuItem>
                {allModels.map(model => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelChange(model)}
                    className="cursor-pointer"
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="whitespace-nowrap"
            >
              Clear All
            </Button>
          </div>

       

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 || selectedCreator || selectedModel) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => handleSearchChange('')} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory}
                  <button onClick={() => handleCategoryChange('all')} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  Tag: {tag}
                  <button onClick={() => handleTagToggle(tag)} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              ))}
              {selectedCreator && (
                <Badge variant="secondary" className="gap-1">
                  Creator: {selectedCreator}
                  <button onClick={() => handleCreatorChange('')} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {selectedModel && (
                <Badge variant="secondary" className="gap-1">
                  Model: {selectedModel}
                  <button onClick={() => handleModelChange('')} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

            {/* Results Count */}
            <div className="flex items-center px-6 justify-between mb-0">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredPrompts.length)} of {filteredPrompts.length} prompts
                {filteredPrompts.length !== prompts.length && ` (filtered from ${prompts.length} total)`}
              </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <HugeiconsIcon icon={ArrowRight02Icon} className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

            {/* Prompts Grid */}
            <div className="!w-full p-6 grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPrompts.map((prompt) => (
                <VideoPromptCard
                  key={prompt.id}
                  prompt={convertToVideoPrompt(prompt)}
                  onNavigate={(url) => router.push(url)}
                  onOpenDrawer={handleOpenDrawer}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <HugeiconsIcon icon={ArrowRight02Icon} className="w-4 h-4 ml-1" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {paginatedPrompts.length === 0 && filteredPrompts.length === 0 && (
              <div className="text-center py-12">
                <HugeiconsIcon icon={Search01Icon} className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No prompts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms, category, tags, creator, or model filter.
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Prompt Details Drawer */}
            <PromptDetailsDrawer
              prompt={selectedPrompt}
              isOpen={isDrawerOpen}
              onClose={handleCloseDrawer}
              onNavigate={(url) => router.push(url)}
            />
          </div>
        </div>
    </main>
  )
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <PromptsPageContent />
    </Suspense>
  )
}
