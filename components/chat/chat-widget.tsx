"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, X, ChevronLeft, Megaphone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { TeamChat } from "@/components/chat/team-chat"
import { AnnouncementsFeed } from "@/components/chat/announcements-feed"

interface MyTeam {
  id: string
  name: string
}

interface AdminTeamSummary {
  team_id: string
  team_name: string
  last_message_at: string | null
  last_sender_id: string | null
}

interface LatestAnnouncement {
  id: string
  created_at: string
  created_by: string | null
}

const copy = {
  de: {
    teamTab: "Team-Chat",
    announcementsTab: "Ankündigungen",
    pickTeam: "Wähle ein Team",
    noTeams: "Keine Teams verfügbar."
  },
  en: {
    teamTab: "Team Chat",
    announcementsTab: "Announcements",
    pickTeam: "Select a team",
    noTeams: "No teams available."
  }
} as const

// Lazily created, resumed on first user gesture to satisfy browser autoplay policies.
let audioCtx: AudioContext | null = null
function ensureAudioContext() {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctx) audioCtx = new Ctx()
  }
  if (audioCtx?.state === "suspended") void audioCtx.resume()
  return audioCtx
}

function playNotificationSound() {
  const ctx = ensureAudioContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.25)
}

function getSeen(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function markSeen(key: string, timestamp: string) {
  try {
    localStorage.setItem(key, timestamp)
  } catch {
    // ignore (private browsing, etc.)
  }
}

export function ChatWidget() {
  const { user, isLoading } = useAuth()
  const { language } = useLanguage()
  const t = copy[language]
  const isAdmin = user?.role === "admin" || user?.role === "category_partner"
  const isParticipant = user?.role === "user"

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"team" | "announcements">("team")
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [adminTeams, setAdminTeams] = useState<AdminTeamSummary[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [unreadTeamIds, setUnreadTeamIds] = useState<Set<string>>(new Set())
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(false)
  const hadUnreadRef = useRef(false)
  const soundArmedRef = useRef(false)

  const hasTeamChatAccess = (isParticipant && !!myTeam) || isAdmin
  const announcementsSeenKey = user ? `announcementsSeen:${user.id}` : ""

  // Resume/create the AudioContext on the first user interaction (autoplay policy).
  useEffect(() => {
    const arm = () => {
      if (soundArmedRef.current) return
      soundArmedRef.current = true
      ensureAudioContext()
    }
    window.addEventListener("pointerdown", arm, { once: true })
    window.addEventListener("keydown", arm, { once: true })
    return () => {
      window.removeEventListener("pointerdown", arm)
      window.removeEventListener("keydown", arm)
    }
  }, [])

  // Discover the relevant team(s) once we know who's logged in.
  useEffect(() => {
    if (!user) return
    if (isParticipant) {
      fetch("/api/team", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => setMyTeam(json?.data?.team || null))
        .catch(() => setMyTeam(null))
    }
  }, [user, isParticipant])

  // Default to whichever view is actually available.
  useEffect(() => {
    if (!hasTeamChatAccess) setView("announcements")
  }, [hasTeamChatAccess])

  // Poll for unread team messages while relevant.
  useEffect(() => {
    if (!user) return
    if (!isParticipant && !isAdmin) return

    const checkOnce = async () => {
      if (isParticipant && myTeam) {
        const res = await fetch(`/api/teams/chat?teamId=${myTeam.id}`, { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        const messages = (json.data?.messages || []).filter(
          (m: { deleted_at: string | null }) => !m.deleted_at
        )
        const last = messages[messages.length - 1]
        const seenKey = `chatSeen:${user.id}:${myTeam.id}`
        if (!last || last.sender_id === user.id) {
          setUnreadTeamIds(new Set())
          return
        }
        const seen = getSeen(seenKey)
        const isUnread = !seen || new Date(last.created_at) > new Date(seen)
        if (open && view === "team") {
          markSeen(seenKey, last.created_at)
          setUnreadTeamIds(new Set())
        } else {
          setUnreadTeamIds(isUnread ? new Set([myTeam.id]) : new Set())
        }
      } else if (isAdmin) {
        const res = await fetch("/api/admin/teams/chat-summary", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        const teams = (json.data?.teams || []) as AdminTeamSummary[]
        setAdminTeams(teams)
        const nextUnread = new Set<string>()
        for (const team of teams) {
          if (!team.last_message_at || team.last_sender_id === user.id) continue
          const seenKey = `chatSeen:${user.id}:${team.team_id}`
          if (open && view === "team" && team.team_id === activeTeamId) {
            markSeen(seenKey, team.last_message_at)
            continue
          }
          const seen = getSeen(seenKey)
          if (!seen || new Date(team.last_message_at) > new Date(seen)) {
            nextUnread.add(team.team_id)
          }
        }
        setUnreadTeamIds(nextUnread)
      }
    }

    void checkOnce()
    const interval = setInterval(() => void checkOnce(), 5000)
    return () => clearInterval(interval)
  }, [user, isParticipant, isAdmin, myTeam, open, view, activeTeamId])

  // Poll for unread announcements (relevant to every logged-in role).
  useEffect(() => {
    if (!user) return

    const checkOnce = async () => {
      const res = await fetch("/api/announcements", { credentials: "include" })
      if (!res.ok) return
      const json = await res.json()
      const latest = (json.data?.announcements?.[0] || null) as LatestAnnouncement | null
      if (!latest || latest.created_by === user.id) {
        setUnreadAnnouncements(false)
        return
      }
      if (open && view === "announcements") {
        markSeen(announcementsSeenKey, latest.created_at)
        setUnreadAnnouncements(false)
      } else {
        const seen = getSeen(announcementsSeenKey)
        setUnreadAnnouncements(!seen || new Date(latest.created_at) > new Date(seen))
      }
    }

    void checkOnce()
    const interval = setInterval(() => void checkOnce(), 5000)
    return () => clearInterval(interval)
  }, [user, open, view, announcementsSeenKey])

  // Ding once when unread goes from "none" to "some".
  useEffect(() => {
    const hasUnread = unreadTeamIds.size > 0 || unreadAnnouncements
    if (hasUnread && !hadUnreadRef.current) {
      playNotificationSound()
    }
    hadUnreadRef.current = hasUnread
  }, [unreadTeamIds, unreadAnnouncements])

  if (isLoading || !user) return null

  const openTeam = (teamId: string) => {
    setActiveTeamId(teamId)
    if (user) markSeen(`chatSeen:${user.id}:${teamId}`, new Date().toISOString())
    setUnreadTeamIds((prev) => {
      const next = new Set(prev)
      next.delete(teamId)
      return next
    })
  }

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next && view === "team" && isParticipant && myTeam) openTeam(myTeam.id)
      return next
    })
  }

  const hasUnread = unreadTeamIds.size > 0 || unreadAnnouncements
  const panelTitle =
    view === "announcements"
      ? t.announcementsTab
      : isParticipant
        ? t.teamTab
        : activeTeamId
          ? adminTeams.find((team) => team.team_id === activeTeamId)?.team_name
          : t.teamTab

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      {open && (
        <div className="bg-card border-border mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border shadow-2xl">
          <div className="bg-violet flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {isAdmin && view === "team" && activeTeamId && (
                <button
                  type="button"
                  onClick={() => setActiveTeamId(null)}
                  className="rounded p-1 hover:bg-white/10">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <span className="text-sm font-semibold">{panelTitle}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {hasTeamChatAccess && (
            <div className="border-border flex shrink-0 border-b">
              <button
                type="button"
                onClick={() => setView("team")}
                className={`relative flex-1 py-2 text-xs font-semibold transition-colors ${
                  view === "team" ? "text-violet" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.teamTab}
                {unreadTeamIds.size > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-28px)] h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
                {view === "team" && <span className="bg-violet absolute right-0 -bottom-px left-0 h-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setView("announcements")}
                className={`relative flex-1 py-2 text-xs font-semibold transition-colors ${
                  view === "announcements" ? "text-violet" : "text-muted-foreground hover:text-foreground"
                }`}>
                <span className="inline-flex items-center gap-1">
                  <Megaphone className="h-3 w-3" />
                  {t.announcementsTab}
                </span>
                {unreadAnnouncements && (
                  <span className="absolute top-1.5 right-[calc(50%-28px)] h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
                {view === "announcements" && (
                  <span className="bg-violet absolute right-0 -bottom-px left-0 h-0.5" />
                )}
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1">
            {view === "announcements" ? (
              <AnnouncementsFeed />
            ) : (
              <>
                {isParticipant && myTeam && <TeamChat teamId={myTeam.id} />}
                {isAdmin && !activeTeamId && (
                  <div className="h-full space-y-1 overflow-y-auto p-2">
                    {adminTeams.length === 0 && (
                      <p className="text-muted-foreground p-4 text-center text-sm">{t.noTeams}</p>
                    )}
                    {adminTeams.map((team) => (
                      <button
                        key={team.team_id}
                        type="button"
                        onClick={() => openTeam(team.team_id)}
                        className="hover:bg-muted flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors">
                        <span className="truncate">{team.team_name}</span>
                        {unreadTeamIds.has(team.team_id) && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {isAdmin && activeTeamId && <TeamChat teamId={activeTeamId} />}
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="bg-violet hover:bg-violet/90 relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && hasUnread && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
          </span>
        )}
      </button>
    </div>
  )
}
