"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const PLACEHOLDER_SPONSORS = [
  { name: "Sponsor A", logo: "https://placehold.co/130x20/e2e8f0/94a3b8?text=Sponsor A" },
  { name: "Sponsor B", logo: "https://placehold.co/110x35/e2e8f0/94a3b8?text=Sponsor B" }
]

export default function LogoMarqueePreview({
  currentLogo,
  currentBgColor,
  currentLogoSize,
  currentWebsite
}: {
  currentLogo: string
  currentBgColor: string | null
  currentLogoSize: number
  currentWebsite: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const logoWidthPx = currentLogoSize * 2 + 20

  const allItems = [
    ...PLACEHOLDER_SPONSORS,
    { name: "current", logo: currentLogo, isCurrent: true },
    ...PLACEHOLDER_SPONSORS,
    { name: "current2", logo: currentLogo, isCurrent: true }
  ]
  const duplicatedItems = [...allItems, ...allItems, ...allItems]

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(() => {
      if (ref.current) {
        setContainerWidth(ref.current.scrollWidth / 2)
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [currentLogo, currentLogoSize])

  return (
    <div className="relative overflow-hidden py-3">
      <motion.div
        ref={ref}
        className="flex gap-6"
        style={{ willChange: "transform" }}
        animate={containerWidth ? { x: [0, -containerWidth] } : {}}
        transition={{
          x: { duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" }
        }}>
        {duplicatedItems.map((item, index) => {
          const isCurrent = "isCurrent" in item && item.isCurrent
          return (
            <div
              key={`preview-${item.name}-${index}`}
              className="flex shrink-0 items-center rounded-lg px-6 py-3">
              {isCurrent ? (
                <a
                  href={currentWebsite || "#"}
                  className="rounded-xs"
                  style={{ backgroundColor: currentBgColor ?? undefined }}
                  onClick={(e) => e.preventDefault()}>
                  <Image
                    src={item.logo}
                    alt="Preview logo"
                    width={100}
                    height={100}
                    style={{ width: `${logoWidthPx}px` }}
                    className="h-auto"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </a>
              ) : (
                <div className="bg-muted rounded-xs p-1">
                  <img src={item.logo} alt={item.name} className="h-auto w-20 opacity-40" />
                </div>
              )}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
