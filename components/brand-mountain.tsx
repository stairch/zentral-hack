import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandMountainProps = {
  className?: string
  imageClassName?: string
  wide?: boolean
  variant?: "auto" | "dark" | "light"
}

export function BrandMountain({
  className,
  imageClassName,
  wide = false,
  variant = "auto"
}: BrandMountainProps) {
  const sharedImageClassName = cn("h-auto w-full", imageClassName)
  const darkSrc = wide ? "/branding/mountain-wide-dark.svg" : "/branding/mountain-dark.svg"
  const lightSrc = wide ? "/branding/mountain-wide-light.svg" : "/branding/mountain-light.svg"

  if (variant === "dark") {
    return (
      <span className={cn("relative inline-block align-middle", className)}>
        <Image
          src={darkSrc}
          alt="Berggrafik Zentral Hack"
          width={800}
          height={400}
          className={sharedImageClassName}
        />
      </span>
    )
  }

  if (variant === "light") {
    return (
      <span className={cn("relative inline-block align-middle", className)}>
        <Image
          src={lightSrc}
          alt="Berggrafik Zentral Hack"
          width={800}
          height={400}
          className={sharedImageClassName}
        />
      </span>
    )
  }

  return (
    <span className={cn("relative inline-block align-middle", className)}>
      <Image
        src={darkSrc}
        alt="Berggrafik Zentral Hack"
        width={800}
        height={400}
        className={cn(sharedImageClassName, "dark:hidden")}
      />
      <Image
        src={lightSrc}
        alt="Berggrafik Zentral Hack"
        width={800}
        height={400}
        className={cn(sharedImageClassName, "hidden dark:block")}
      />
    </span>
  )
}
