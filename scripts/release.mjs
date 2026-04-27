#!/usr/bin/env node

/**
 * Automates the release process for this package:
 *   1. Prompts for a new version and validates it against the current one
 *   2. Checks if flags in lib/flags.ts are available in production Vercel project
 *   3. Writes the new version to package.json
 *   4. Temporarily switches the local git user.email and remote URL with PAT to the release account
 *   5. Commits and pushes the version bump
 *   6. Creates an annotated git tag and pushes it
 *   7. Restores the previous local git user.email
 */

import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { createInterface } from "readline"
import { config } from "dotenv"

// ─── Configuration ──────────────────────────────────────────────────────────
config()

const RELEASE_EMAIL = "45304902+ch-stair@users.noreply.github.com"
const RELEASE_TOKEN = process.env.RELEASE_TOKEN
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROD_PROJECT_ID = process.env.VERCEL_PROD_PROJECT_ID
// ────────────────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf-8", ...opts }).trim()
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta)\.(\d+))?$/)
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre: match[4] ?? null,
    preNum: match[5] ? Number(match[5]) : null
  }
}

function validateBump(current, next) {
  const c = parseVersion(current)
  const n = parseVersion(next)

  if (!n) {
    return "Invalid format. Allowed: X.Y.Z | X.Y.Z-alpha.A | X.Y.Z-beta.A"
  }

  const cNum = c.major * 1e8 + c.minor * 1e4 + c.patch
  const nNum = n.major * 1e8 + n.minor * 1e4 + n.patch

  if (nNum < cNum) {
    return `Version must be greater than the current one (${current}).`
  }

  if (nNum === cNum) {
    if (!c.pre && !n.pre) {
      return `Version is identical to the current one (${current}).`
    }
    if (c.pre && !n.pre) {
      return null
    }
    if (!c.pre && n.pre) {
      return `Pre-release on the same base as a stable version is not allowed. Bump patch/minor/major first.`
    }
    if (c.pre && n.pre) {
      if (c.pre === "alpha" && n.pre === "beta") return null
      if (c.pre === "beta" && n.pre === "alpha") {
        return "Downgrade from beta to alpha is not allowed."
      }
      if (c.pre === n.pre && n.preNum <= c.preNum) {
        return `${n.pre} number must be greater than ${c.preNum}.`
      }
    }
  }

  return null
}

function isStableRelease(version) {
  return parseVersion(version)?.pre === null
}

function extractFlagKeys() {
  const flagsFile = readFileSync("lib/flags.ts", "utf-8")
  const matches = [...flagsFile.matchAll(/key:\s*['"]([^'"]+)['"]/g)]
  return matches.map((m) => m[1])
}

async function fetchVercelFlags() {
  console.log("   ⚙️  Fetching flags from Vercel API...")
  const res = await fetch(
    `https://api.vercel.com/v1/projects/${VERCEL_PROD_PROJECT_ID}/feature-flags/flags`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" } }
  )

  if (!res.ok) {
    console.error(`   ❌ Vercel API error: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const data = await res.json()
  return data.data?.map((f) => f.slug) ?? []
}

async function checkFlagsOnProd(newVersion) {
  if (!isStableRelease(newVersion)) return

  console.log("\n🚩 Checking feature flags on production project...")

  const localKeys = extractFlagKeys()
  if (localKeys.length === 0) {
    console.log("   ⚠️  No flags found in lib/flags.ts, skipping.")
    return
  }

  console.log(
    `   ✅ Found ${localKeys.length} flag(s) in lib/flags.ts: ${localKeys.map((k) => `"${k}"`).join(", ")}`
  )

  const remoteKeys = await fetchVercelFlags()
  if (remoteKeys === null) return

  const missing = localKeys.filter((k) => !remoteKeys.includes(k))

  if (missing.length > 0) {
    console.error("\n   ❌ The following flags are missing in the production Vercel project:")
    missing.forEach((k) => console.error(`      - ${k}`))
    console.error("\n   👉 Add them in the Vercel Dashboard on production Vercel project before releasing.\n")
    process.exit(1)
  }

  console.log(`   ✅ All ${localKeys.length} flags found on production project.`)
}

async function main() {
  if (!RELEASE_TOKEN) {
    console.error("❌ Error: RELEASE_TOKEN is not set. Add it to your .env file.")
    process.exit(1)
  }
  if (!VERCEL_TOKEN) {
    console.error("❌ Error: VERCEL_TOKEN is not set. Add it to your .env file.")
    process.exit(1)
  }
  if (!VERCEL_PROD_PROJECT_ID) {
    console.error("❌ Error: VERCEL_PROD_PROJECT_ID is not set. Add it to your .env file.")
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync("package.json", "utf-8"))
  const currentVersion = pkg.version

  console.log(`\n📦 Current version: v${currentVersion}`)
  console.log("📐 Format must follow Semantic Versioning (https://semver.org)\n")

  let newVersion
  while (true) {
    const input = await ask("New version: ")
    const error = validateBump(currentVersion, input)
    if (!error) {
      newVersion = input
      break
    }
    console.log(`  ❌ ${error}\n`)
  }

  const confirmed = await ask(`\n🚀 v${currentVersion} ➡️  v${newVersion} — proceed? [y/N]: `)
  if (confirmed.toLowerCase() !== "y") {
    console.log("❌ Aborted.")
    process.exit(0)
  }

  // check feature flags on production project
  await checkFlagsOnProd(newVersion)

  pkg.version = newVersion
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
  console.log(`✅ Version bumped: ${currentVersion} ➡️  ${newVersion}`)

  let previousEmail
  try {
    previousEmail = run("git config --local user.email")
  } catch {
    previousEmail = null
  }

  run(`git config --local user.email "${RELEASE_EMAIL}"`)
  console.log(`✅ Git email set to: ${RELEASE_EMAIL}`)

  const originalUrl = run("git remote get-url origin")
  const authedUrl = originalUrl.replace("https://", `https://x-access-token:${RELEASE_TOKEN}@`)
  run(`git remote set-url origin "${authedUrl}"`)

  try {
    run("git add package.json")
    run(`git commit -m "Bump version to v${newVersion}"`)
    run("git push")
    console.log(`✅ Commit pushed`)

    const tag = `v${newVersion}`
    run(`git tag -a ${tag} -m "Release ${tag}"`)
    run(`git push origin ${tag}`)
    console.log(`✅ Tag ${tag} pushed`)
  } finally {
    run(`git remote set-url origin "${originalUrl}"`)
    console.log(`✅ Remote URL restored`)

    if (previousEmail) {
      run(`git config --local user.email "${previousEmail}"`)
      console.log(`✅ Local git email restored (previous: ${previousEmail})`)
    } else {
      run("git config --local --unset user.email")
      console.log(`✅ Local git email restored (previous: none)`)
    }
  }

  console.log(`\n🎉 Release v${newVersion} complete.`)
}

main().catch((err) => {
  console.error("❌ Error:", err.message)
  process.exit(1)
})
