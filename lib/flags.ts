import { flag } from "flags/next"
import { vercelAdapter } from "@flags-sdk/vercel"
import { type Flag } from "flags/next"

/**
 * !! Always set defaultValue !!
 * This prevents runtime errors if the flag wasn't set properly in the Vercel production project.
 */

export const adminDocumentsFlag: Flag<boolean> = flag({
  key: "admin-documents",
  adapter: vercelAdapter(),
  defaultValue: false
})

export const adminEmailsFlag: Flag<boolean> = flag({
  key: "admin-emails",
  adapter: vercelAdapter(),
  defaultValue: false
})

export const adminNewsletterFlag: Flag<boolean> = flag({
  key: "admin-newsletter",
  adapter: vercelAdapter(),
  defaultValue: false
})

export const adminTeamsFlag: Flag<boolean> = flag({
  key: "admin-teams",
  adapter: vercelAdapter(),
  defaultValue: false
})
