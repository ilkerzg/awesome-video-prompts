"use client"

import { IconDownload, IconPhoto } from "@tabler/icons-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/ui/context-menu"

export function DynamicLogo() {
  const downloadSVG = async () => {
    try {
      const response = await fetch('/logo.svg')
      const svgBlob = await response.blob()
      const url = URL.createObjectURL(svgBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'awesome-video-prompts-logo.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading SVG:', error)
    }
  }

  const downloadPNG = async () => {
    try {
      const response = await fetch('/web-app-manifest-512x512.png')
      const pngBlob = await response.blob()
      const url = URL.createObjectURL(pngBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'awesome-video-prompts-logo.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PNG:', error)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex items-center gap-3 !p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
          <div className="flex items-center justify-center">
            <img 
              src="/logo-white.svg" 
              alt="Logo"
              className="h-6 w-auto group-data-[collapsible=icon]:h-8"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">Awesome Video Prompts</span>
            <span className="truncate text-xs text-muted-foreground">Open Source</span>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={downloadSVG}>
          <IconDownload className="mr-2 h-4 w-4" />
          Save as SVG
        </ContextMenuItem>
        <ContextMenuItem onClick={downloadPNG}>
          <IconPhoto className="mr-2 h-4 w-4" />
          Save as PNG
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
