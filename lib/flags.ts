import { flag } from "flags/next"
import { vercelAdapter } from "@flags-sdk/vercel"
import { type Flag } from "flags/next"

/**
 * !! Always set defaultValue !!
 * This prevents runtime errors if the flag wasn't set properly in the Vercel production project.
 */

function makeFlag(key: string): Flag<boolean> {
  if (process.env.FLAGS) {
    return flag({ key, adapter: vercelAdapter(), defaultValue: false })
  }

  // if no flags configured and development mode, turn on all features
  if (process.env.NODE_ENV === "development") {
    return flag({ key, decide: () => true, defaultValue: true })
  }

  // No FLAGS env var and not in development: fall back to always-false so defaultValue is used.
  return flag({ key, decide: () => false, defaultValue: false })
}

export const adminDocumentsFlag = makeFlag("admin-documents")
export const adminEmailsFlag = makeFlag("admin-emails")
export const adminNewsletterFlag = makeFlag("admin-newsletter")
export const adminTeamsFlag = makeFlag("admin-teams")
export const dashboardChallengesFlag = makeFlag("dashboard-challenges")
