"use client"

import { useEffect, useState } from "react"
import { BugOff, Pencil, Plus, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { allChangelogEntries, compareVersions, type ContentSection } from "@/lib/changelog"
import { useUnseenChangelog } from "@/hooks/use-unseen-changelog"
import { useAuth } from "@/lib/auth-context"

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
}

export default function AdminChangelogPage() {
  const entries = allChangelogEntries
  const { language } = useLanguage()
  const { markAsSeen } = useUnseenChangelog()
  const { user, isLoading } = useAuth()

  // Freeze the last-seen version at page entry so dots keep pulsing
  // even after markAsSeen() fires and updates the live user state.
  const [snapshotLastSeen, setSnapshotLastSeen] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    if (snapshotLastSeen === undefined && !isLoading) {
      setSnapshotLastSeen(user?.lastSeenChangelogVersion ?? null)
    }
  }, [isLoading, user, snapshotLastSeen])

  useEffect(() => {
    markAsSeen()
  }, [markAsSeen])

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
          const isUnseen =
            snapshotLastSeen !== undefined && compareVersions(entry.version, snapshotLastSeen ?? "0.0.0") > 0
          return (
            <div key={entry.version} className="flex gap-6">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="relative mt-2 h-3 w-3 shrink-0">
                  {isUnseen && (
                    <span className="absolute inset-0 flex">
                      <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                    </span>
                  )}
                  <span className="bg-primary relative block h-3 w-3 rounded-full" />
                </div>
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
