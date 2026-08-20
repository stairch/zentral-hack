"use client"

import { BugOff, Pencil, Plus, X } from "lucide-react"
import MdChangelog from "@/CHANGELOG.md"
import { useLanguage } from "@/lib/language-context"

interface ContentSection {
  type: "Added" | "Fixed" | "Changed" | "Removed" | "Other"
  title: string
  items: string[]
}

interface ChangelogEntry {
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
      // Top-level bullets without a ### heading (e.g. v1.0.0)
      if (sections.length === 0 || sections[sections.length - 1].type !== "Other") {
        current = { type: "Other", title: "", items: [] }
        sections.push(current)
      }
      sections[sections.length - 1].items.push(line.replace(/^- /, "").trim())
    }
  }

  return sections
}

function parseChangelog(raw: string): ChangelogEntry[] {
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

const sectionConfig = {
  Added: {
    icon: Plus,
    color: "text-green-600 dark:text-green-400"
  },
  Fixed: {
    icon: BugOff,
    color: "text-red-500 dark:text-red-400"
  },
  Changed: {
    icon: Pencil,
    color: "text-yellow-500 dark:text-yellow-400"
  },
  Removed: {
    icon: X,
    color: "text-red-500 dark:text-red-400"
  },
  Other: {
    icon: null,
    color: ""
  }
} satisfies Record<
  ContentSection["type"],
  { icon: React.ComponentType<{ className?: string }> | null; color: string }
>

export default function AdminChangelogPage() {
  const entries = parseChangelog(MdChangelog)
  const { language } = useLanguage()

  const description =
    language === "de"
      ? "Alle Änderungen an der Zentral Hack Plattform."
      : "All changes to the Zentral Hack platform."

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Changelog</h1>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div>
        {entries.map((entry, i) => {
          const isLast = i === entries.length - 1
          return (
            <div key={entry.version} className="flex gap-6">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="bg-primary mt-2 h-3 w-3 shrink-0 rounded-full" />
                {!isLast && <div className="bg-border mt-1 w-px flex-1" />}
              </div>

              {/* Content */}
              <div className="pb-18">
                <div className="mb-6 flex w-fit flex-col gap-2">
                  <span className="bg-primary/10 text-primary w-fit rounded-full px-3 py-1 text-sm font-semibold">
                    v{entry.version}
                  </span>
                  <span className="text-muted-foreground ml-0.5 text-xs">{entry.date}</span>
                </div>

                <div className="space-y-6">
                  {entry.sections.map((section, j) => {
                    const config = sectionConfig[section.type]
                    const Icon = config.icon
                    return (
                      <div key={j}>
                        {section.title && Icon && (
                          <div className="mb-2 flex items-center gap-1.5">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className={`text-sm font-semibold tracking-wider uppercase`}>
                              {section.title}
                            </span>
                          </div>
                        )}
                        <ul className="text-muted-foreground ml-5 space-y-0.5 text-sm">
                          {section.items.map((item, k) => (
                            <li key={k} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
