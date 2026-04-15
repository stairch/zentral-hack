import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
  variant?: "auto" | "dark" | "light"
}

export function BrandMark({ className, imageClassName, priority = false, variant = "auto" }: BrandMarkProps) {
  const sharedImageClassName = cn("h-auto w-full", imageClassName)

  if (variant === "dark") {
    return (
      <span className={cn("relative inline-block align-middle", className)}>
        <Image
          src="/branding/logo-dark.svg"
          alt="Zentral Hack"
          width={340}
          height={340}
          priority={priority}
          className={sharedImageClassName}
        />
      </span>
    )
  }

  if (variant === "light") {
    return (
      <span className={cn("relative inline-block align-middle", className)}>
        <Image
          src="/branding/logo-light.svg"
          alt="Zentral Hack"
          width={340}
          height={340}
          priority={priority}
          className={sharedImageClassName}
        />
      </span>
    )
  }

  return (
    <span className={cn("relative inline-block align-middle", className)}>
      <Image
        src="/branding/logo-dark.svg"
        alt="Zentral Hack"
        width={340}
        height={340}
        priority={priority}
        className={cn(sharedImageClassName, "dark:hidden")}
      />
      <Image
        src="/branding/logo-light.svg"
        alt="Zentral Hack"
        width={340}
        height={340}
        priority={priority}
        className={cn(sharedImageClassName, "hidden dark:block")}
      />
    </span>
  )
}
