#!/usr/bin/env node

/**
 * Automates the release process for this package:
 *   1. Prompts for a new version and validates it against the current one
 *   2. Writes the new version to package.json
 *   3. Temporarily switches the local git user.email to the release email
 *   4. Commits and pushes the version bump
 *   5. Creates an annotated git tag and pushes it
 *   6. Restores the previous local git user.email
 */

import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { createInterface } from "readline"
import { config } from "dotenv"

// ─── Configuration ──────────────────────────────────────────────────────────
config()

const RELEASE_EMAIL = "45304902+ch-stair@users.noreply.github.com"
const RELEASE_TOKEN = process.env.RELEASE_TOKEN
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

async function main() {
  if (!RELEASE_TOKEN) {
    console.error("Error: RELEASE_TOKEN is not set. Add it to your .env file.")
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync("package.json", "utf-8"))
  const currentVersion = pkg.version

  console.log(`\nCurrent version: v${currentVersion}`)
  console.log("Format must follow Semantic Versioning (https://semver.org)\n")

  let newVersion
  while (true) {
    const input = await ask("New version: ")
    const error = validateBump(currentVersion, input)
    if (!error) {
      newVersion = input
      break
    }
    console.log(`  ✗ ${error}\n`)
  }

  const confirmed = await ask(`v${currentVersion} → v${newVersion} — proceed? [y/N]: `)
  if (confirmed.toLowerCase() !== "y") {
    console.log("Aborted.")
    process.exit(0)
  }

  pkg.version = newVersion
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
  console.log(`✓ Version bumped: ${currentVersion} → ${newVersion}`)

  let previousEmail
  try {
    previousEmail = run("git config --local user.email")
  } catch {
    previousEmail = null
  }

  run(`git config --local user.email "${RELEASE_EMAIL}"`)
  console.log(`✓ Git email set to: ${RELEASE_EMAIL}`)

  const originalUrl = run("git remote get-url origin")
  const authedUrl = originalUrl.replace("https://", `https://x-access-token:${RELEASE_TOKEN}@`)
  run(`git remote set-url origin "${authedUrl}"`)

  try {
    run("git add package.json")
    run(`git commit -m "Bump version to v${newVersion}"`)
    run("git push")
    console.log(`✓ Commit pushed`)

    const tag = `v${newVersion}`
    run(`git tag -a ${tag} -m "Release ${tag}"`)
    run(`git push origin ${tag}`)
    console.log(`✓ Tag ${tag} pushed`)
  } finally {
    run(`git remote set-url origin "${originalUrl}"`)
    console.log(`✓ Remote URL restored`)

    if (previousEmail) {
      run(`git config --local user.email "${previousEmail}"`)
      console.log(`✓ Local git email setting restored (previous: ${previousEmail})`)
    } else {
      run("git config --local --unset user.email")
      console.log(`✓ Local git email setting restored (previous: none)`)
    }
  }

  console.log(`\n🎉 Release v${newVersion} complete.`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
