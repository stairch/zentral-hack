"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

export interface GridPreviewItem {
  logo: string
  name: string
  bgColor?: string | null
  width: number
  isCurrent?: boolean
  description?: string | null
}

const PREVIEW_GRID_COLS = ["grid-cols-1", "grid-cols-2", "grid-cols-2", "grid-cols-3"] as const

export default function LogoGridPreview({
  items,
  tierIndex = 2
}: {
  items: GridPreviewItem[]
  tierIndex?: number
}) {
  if (items.length === 0) return null
  const gridCols = PREVIEW_GRID_COLS[Math.min(tierIndex, PREVIEW_GRID_COLS.length - 1)]

  return (
    <div className={cn("border-border bg-border grid gap-px border", gridCols)}>
      {items.map((item, i) => (
        <div
          key={`${item.name}-${i}`}
          className={cn(
            "bg-background flex min-h-16 flex-col items-center justify-center gap-2",
            item.description ? "px-4 pb-3 pt-4" : "p-4",
            item.isCurrent && "ring-primary ring-2 ring-inset"
          )}>
          <Image
            src={item.logo}
            alt={item.name}
            width={500}
            height={200}
            style={{
              width: `${item.width}px`,
              maxWidth: "100%",
              background: item.bgColor && item.bgColor !== "transparent" ? item.bgColor : undefined
            }}
            className="h-auto object-contain"
          />
          {item.description && (
            <p className={cn(
              "text-muted-foreground max-w-[160px] text-center leading-snug",
              tierIndex === 3 ? "text-[10px]" : "text-xs"
            )}>
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
