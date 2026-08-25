import MdChangelog from "@/CHANGELOG.md"

export interface ContentSection {
  type: "Added" | "Fixed" | "Changed" | "Removed" | "Other"
  title: string
  items: string[]
}

export interface ChangelogEntry {
  version: string
  date: string
  sections: ContentSection[]
}

const SECTION_TYPE_MAP: Record<string, ContentSection["type"]> = {
  Added: "Added",
  Hinzugefügt: "Added",
  Fixed: "Fixed",
  Behoben: "Fixed",
  Changed: "Changed",
  Geändert: "Changed",
  Removed: "Removed",
  Entfernt: "Removed"
}

function parseSections(content: string): ContentSection[] {
  const lines = content.split("\n")
  const sections: ContentSection[] = []
  let current: ContentSection | null = null

  for (const line of lines) {
    if (line.startsWith("### ")) {
      const title = line.replace("### ", "").trim()
      const type = SECTION_TYPE_MAP[title] ?? "Other"
      current = { type, title, items: [] }
      sections.push(current)
    } else if (line.startsWith("- ") && current) {
      current.items.push(line.replace(/^- /, "").trim())
    } else if (line.startsWith("- ") && !current) {
      if (sections.length === 0 || sections[sections.length - 1].type !== "Other") {
        current = { type: "Other", title: "", items: [] }
        sections.push(current)
      }
      sections[sections.length - 1].items.push(line.replace(/^- /, "").trim())
    }
  }

  return sections
}

export function parseChangelog(raw: string): ChangelogEntry[] {
  return raw
    .split(/\n(?=## \[)/)
    .filter((s) => s.startsWith("## ["))
    .map((section) => {
      const lines = section.split("\n")
      const heading = lines[0]
      const version = heading.match(/## \[(.+?)\]/)?.[1] ?? ""
      const rawDate = heading.match(/\] - (\d{4}-\d{2}-\d{2})/)?.[1] ?? ""
      const date = rawDate
        ? new Intl.DateTimeFormat("de-CH", { year: "numeric", month: "long", day: "numeric" }).format(
            new Date(rawDate + "T00:00:00")
          )
        : ""
      const content = lines.slice(1).join("\n").trim()
      return { version, date, sections: parseSections(content) }
    })
}

function parseVersionParts(version: string): [number, number, number] {
  const parts = version.split(".").map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

/** Returns positive if a > b, negative if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseVersionParts(a)
  const [bMaj, bMin, bPat] = parseVersionParts(b)
  return aMaj !== bMaj ? aMaj - bMaj : aMin !== bMin ? aMin - bMin : aPat - bPat
}

export function isMinorOrMajorRelease(
  latestVersion: string,
  lastSeenVersion: string | null | undefined
): boolean {
  const [latestMajor, latestMinor] = parseVersionParts(latestVersion)
  const [seenMajor, seenMinor] = parseVersionParts(lastSeenVersion ?? "0.0.0")
  return latestMajor > seenMajor || latestMinor > seenMinor
}

export const allChangelogEntries: ChangelogEntry[] = parseChangelog(MdChangelog)
export const latestChangelogEntry: ChangelogEntry | null = allChangelogEntries[0] ?? null
