"use client"

import { Fragment, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ArrowRight, Loader2, Lock, Radio } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { EVENT_PHASES, parseEventPhaseConfig, type EventPhase } from "@/lib/event-phase"
import { useWebsiteMode } from "@/components/admin/website-mode-context"
import {
  LIVE_CONTENT_SECTIONS,
  RECAP_CONTENT_SECTIONS,
  WEBSITE_MODE_LABELS
} from "@/components/admin/website-content-sections"

const copy = {
  de: {
    heading: "WEBSITE-MODUS",
    subtitle: "Festlegen, welche Startseite angezeigt wird und wer sich einloggen kann",
    modes: {
      live: {
        description:
          "Normale Startseite mit Anmeldung. Teilnehmende, Partner und Sponsoren können sich einloggen und alles nutzen."
      },
      post: {
        description:
          "Rückblick-Startseite. Login, Anmeldung, Uploads und alle anderen Aktionen sind gesperrt, nur Admins können sich noch einloggen."
      }
    },
    current: "Aktiv",
    activate: { live: "Live-Modus aktivieren", post: "Rückblick-Modus aktivieren" },
    editContent: "Inhalte bearbeiten",
    success: { live: "Live-Modus ist aktiv", post: "Rückblick-Modus ist aktiv" },
    switchError: "Fehler beim Umschalten",
    confirm: {
      live: {
        title: "Live-Modus aktivieren?",
        description:
          "Die Startseite zeigt wieder den regulären Inhalt mit Anmeldung. Teilnehmende, Partner und Sponsoren können sich wieder einloggen und alles nutzen.",
        label: "Live aktivieren"
      },
      post: {
        title: "Rückblick-Modus aktivieren?",
        description:
          "Die Startseite zeigt danach den Rückblick. Logins, Anmeldung und Uploads sowie alle anderen Aktionen werden gesperrt. Alle ausser Admins werden sofort ausgeloggt. Das bleibt so, bis du wieder auf „Live“ umschaltest.",
        label: "Sperren und Rückblick aktivieren"
      }
    },
    cancel: "Abbrechen"
  },
  en: {
    heading: "WEBSITE MODE",
    subtitle: "Choose which homepage is shown and who can sign in",
    modes: {
      live: {
        description:
          "Regular homepage with registration. Participants, partners and sponsors can sign in and use everything."
      },
      post: {
        description:
          "Recap homepage. Login, registration, uploads and every other action are locked, only admins can still sign in."
      }
    },
    current: "Active",
    activate: { live: "Activate live mode", post: "Activate recap mode" },
    editContent: "Edit content",
    success: { live: "Live mode is active", post: "Recap mode is active" },
    switchError: "Failed to switch mode",
    confirm: {
      live: {
        title: "Activate live mode?",
        description:
          "The homepage shows its regular content with registration again. Participants, partners and sponsors can sign in and use everything again.",
        label: "Activate live"
      },
      post: {
        title: "Activate recap mode?",
        description:
          "The homepage then shows the recap. Logins, registration, uploads and every other action are locked. Everyone except admins is signed out immediately. This stays until you switch back to “Live”.",
        label: "Lock and activate recap"
      }
    },
    cancel: "Cancel"
  }
} as const

const MODE_ICONS = { live: Radio, post: Lock } as const
const MODE_SECTIONS = { live: LIVE_CONTENT_SECTIONS, post: RECAP_CONTENT_SECTIONS } as const

export function WebsiteModePage() {
  const { language } = useLanguage()
  const text = copy[language]

  // Shared with the sidebar chip and visibility notices, so a switch shows up everywhere at once
  const { phase, loaded, setPhase } = useWebsiteMode()
  // target is kept after closing so the dialog text does not vanish during the close animation
  const [target, setTarget] = useState<EventPhase>("post")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const requestSwitch = (mode: EventPhase) => {
    setTarget(mode)
    setConfirmOpen(true)
  }

  const switchMode = async () => {
    setSwitching(true)
    try {
      const res = await fetch("/api/admin/event-phase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phase: target })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || text.switchError)
      setPhase(parseEventPhaseConfig(data.data?.config).phase)
      setConfirmOpen(false)
      toast.success(text.success[target])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.switchError)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2">{text.subtitle}</p>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {EVENT_PHASES.map((mode) => {
            const active = phase === mode
            const Icon = MODE_ICONS[mode]
            return (
              <Card
                key={mode}
                className={cn(
                  "border-2",
                  active
                    ? mode === "post"
                      ? "border-destructive bg-destructive/10"
                      : "border-violet bg-secondary"
                    : "border-border"
                )}>
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-lg font-semibold">
                      <Icon className={cn("h-5 w-5", mode === "post" && active && "text-destructive")} />
                      {WEBSITE_MODE_LABELS[mode][language]}
                    </span>
                    {active && (
                      <Badge variant={mode === "post" ? "destructive" : "default"}>{text.current}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{text.modes[mode].description}</p>

                  <div className="text-sm">
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      {text.editContent}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>{" "}
                    {MODE_SECTIONS[mode].map((section, index) => (
                      <Fragment key={section.id}>
                        {index > 0 && ", "}
                        <Link href={section.href} className="text-violet font-medium hover:underline">
                          {section.label[language]}
                        </Link>
                      </Fragment>
                    ))}
                  </div>

                  {!active && (
                    <Button
                      onClick={() => requestSwitch(mode)}
                      disabled={switching}
                      variant={mode === "post" ? "destructive" : "default"}
                      className="mt-auto w-fit gap-2">
                      <Icon className="h-4 w-4" />
                      {text.activate[mode]}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Every switch is confirmed, switching to recap locks the platform for everyone but admins */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={text.confirm[target].title}
        description={text.confirm[target].description}
        confirmLabel={text.confirm[target].label}
        confirmVariant={target === "post" ? "destructive" : "default"}
        cancelLabel={text.cancel}
        onConfirm={() => void switchMode()}
        loading={switching}
      />
    </div>
  )
}
