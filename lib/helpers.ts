export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

export function resolveCSSVar(variable: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim().toUpperCase()
}

export function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "")
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim()
  return trimmed.toUpperCase()
}

export function isDarkContrastForegroundColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "")
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return false
  }

  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness > 165 ? true : false
}

export function getContrastForegroundColor(hexColor: string): string {
  return isDarkContrastForegroundColor(hexColor) ? "#1A1A1A" : "#FFFFFF"
}

export function srcWithVersion(url: string, version: string | number) {
  // adds timestamp via 'v' query param
  // this forces next to retrieve new image instead of using the cached, outdated one
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${version}`
}
