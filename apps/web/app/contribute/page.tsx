'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings02Icon,
  FileEditIcon,
  PaintBrushIcon,
  ArrowRight01Icon,
  VideoReplayIcon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"
import { DashboardSubheader } from "@workspace/ui/components/dashboard-subheader"

const items = [
  {
    title: 'Share Your Prompts',
    description: 'Contribute video generation prompts that others can discover and use.',
    icon: VideoReplayIcon,
    path: '/contribute/custom-prompt',
    count: 'Prompt Gallery',
  },
  {
    title: 'Organize Categories',
    description: 'Create new categories to help organize and filter prompts in the gallery.',
    icon: Settings02Icon,
    path: '/contribute/prompt-categories',
    count: 'Gallery Filters',
  },
  {
    title: 'Add Prompt Elements',
    description: 'Contribute individual prompt building blocks for the prompt generator.',
    icon: FileEditIcon,
    path: '/contribute/base-prompt',
    count: 'Generator Options',
  },
  {
    title: 'Create Element Types',
    description: 'Define new types of prompt elements for advanced prompt generator.',
    icon: PaintBrushIcon,
    path: '/contribute/base-prompt-category',
    count: 'Generator Structure',
  },
]

export default function ContributePage() {
  const router = useRouter()

  return (
    <div className="w-full">
      <DashboardSubheader
        title="Contribute"
        description="Help build the world of AI video generation by sharing your prompts and ideas with the community."
        icon={FavouriteIcon}
        iconBoxVariant="purple"
      />

      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <Card
                key={item.title}
                className="cursor-pointer hover:border-primary/40 transition-all group"
                onClick={() => router.push(item.path)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <HugeiconsIcon icon={item.icon} className="size-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      <span className="text-xs text-muted-foreground/60 mt-2 block">{item.count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
