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
  // No FLAGS env var (e.g. local builds): fall back to always-false so defaultValue is used.
  return flag({ key, decide: () => false, defaultValue: false })
}

export const adminDocumentsFlag = makeFlag("admin-documents")
export const adminEmailsFlag = makeFlag("admin-emails")
export const adminNewsletterFlag = makeFlag("admin-newsletter")
export const adminTeamsFlag = makeFlag("admin-teams")
