"use client"

import Link from "next/link"

export default function ResendRedirect() {
  const externalLink = "https://resend.com"

  window.open(externalLink, "_blank", "noopener,noreferrer")

  return (
    <div>
      <span>You should be redirected automatically. If that's not the case, click </span>
      <Link className="text-blue-500" href={externalLink} target={"_blank"}>
        here
      </Link>
      .
    </div>
  )
}
