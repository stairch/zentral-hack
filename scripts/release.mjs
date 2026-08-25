#!/usr/bin/env node

/**
 * Automates the release process for this package:
 *   1. Prompts for a new version and validates it against the current one
 *   2. Checks if flags in lib/flags.ts are available in production Vercel project
 *   3. Writes the new version to package.json
 *   4. Temporarily switches the local git user.email and remote URL with PAT to the release account
 *   5. Creates a release branch, commits and pushes the version bump
 *   6. Opens a PR via GitHub API and merges it as soon as checks passed
 *   7. Creates an annotated git tag on the merge commit and pushes it
 *   8. Deletes the release branch (local + remote)
 *   9. Restores the previous local git user.email
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
  const matches = [...flagsFile.matchAll(/makeFlag\(['"]([^'"]+)['"]\)/g)]
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

function getRepoOwnerAndName(remoteUrl) {
  // Supports both https and ssh remote URLs
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
  if (!match) throw new Error(`Could not parse GitHub owner/repo from remote URL: ${remoteUrl}`)
  return { owner: match[1], repo: match[2] }
}

async function githubApi(path, method, body, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      `GitHub API ${method} ${path} failed: ${res.status} — ${data.message ?? JSON.stringify(data)}`
    )
  }

  return data
}

// ─── GitHub API helpers ──────────────────────────────────────────────────────

async function ghCreatePR({ owner, repo, token, releaseBranch, newVersion, currentVersion }) {
  return githubApi(
    `/repos/${owner}/${repo}/pulls`,
    "POST",
    {
      title: `Release v${newVersion}`,
      head: releaseBranch,
      base: "main",
      body: `Automated version bump: \`${currentVersion}\` → \`${newVersion}\``
    },
    token
  )
}

async function ghGetCommitStatus({ owner, repo, token, sha }) {
  return githubApi(`/repos/${owner}/${repo}/commits/${sha}/status`, "GET", null, token)
}

async function ghGetCheckRuns({ owner, repo, token, sha }) {
  return githubApi(`/repos/${owner}/${repo}/commits/${sha}/check-runs`, "GET", null, token)
}

async function ghMergePR({ owner, repo, token, prNumber, newVersion }) {
  return githubApi(
    `/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
    "PUT",
    {
      commit_title: `Release v${newVersion}`,
      merge_method: "squash"
    },
    token
  )
}

async function ghCreateTag({ owner, repo, token, tag, sha }) {
  await githubApi(
    `/repos/${owner}/${repo}/git/tags`,
    "POST",
    {
      tag,
      message: `Release ${tag}`,
      object: sha,
      type: "commit"
    },
    token
  )

  await githubApi(
    `/repos/${owner}/${repo}/git/refs`,
    "POST",
    {
      ref: `refs/tags/${tag}`,
      sha
    },
    token
  )
}

// ─── Changelog helpers ───────────────────────────────────────────────────────

function findChangelogEntry(content, version) {
  const escaped = version.replace(/\./g, "\\.")
  const regex = new RegExp(`## \\[${escaped}\\][^\\n]*\\n[\\s\\S]*?(?=\\n## \\[|$)`)
  const match = content.match(regex)
  return match ? match[0].trim() : null
}

async function prepareChangelog(newVersion) {
  let content
  try {
    content = readFileSync("CHANGELOG.md", "utf-8")
  } catch {
    content = "# Changelog\n"
  }

  const existingEntry = findChangelogEntry(content, newVersion)

  if (existingEntry) {
    console.log(`\n📋 Existing changelog entry for v${newVersion}:\n`)
    console.log(
      existingEntry
        .split("\n")
        .map((l) => `   ${l}`)
        .join("\n")
    )
    const keep = await ask("\nInclude this entry in the release commit? [Y/n]: ")
    if (keep.toLowerCase() === "n") {
      console.log("⏭️  Skipping changelog.")
      return null
    }
    return content
  }

  console.warn(`\n⚠️  No changelog entry found for v${newVersion} in CHANGELOG.md.`)
  const proceed = await ask("Continue without a changelog entry? [y/N]: ")
  if (proceed.toLowerCase() !== "y") {
    console.log("❌ Aborted. Add an entry to CHANGELOG.md and re-run.")
    process.exit(0)
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────

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

  // Prepare changelog before stash so we can read the current working tree
  const changelogContent = await prepareChangelog(newVersion)

  // Check feature flags on production project
  await checkFlagsOnProd(newVersion)

  const releaseBranch = `release/v${newVersion}`
  const tag = `v${newVersion}`

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

  // Stash uncommitted changes so they don't end up on the release branch
  let stashed = false
  try {
    const stashOut = run("git stash push --include-untracked -m 'release-script: temp stash'")
    stashed = !stashOut.includes("No local changes to save")
    if (stashed) console.log("✅ Uncommitted changes stashed")
  } catch {
    /* ignore */
  }

  try {
    // Create and push release branch
    run(`git checkout -b ${releaseBranch}`)

    // Write version bump after checkout so it's not caught by the stash
    pkg.version = newVersion
    writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
    console.log(`✅ Version bumped: ${currentVersion} ➡️  ${newVersion}`)

    if (changelogContent !== null) {
      writeFileSync("CHANGELOG.md", changelogContent)
      console.log(`✅ CHANGELOG.md updated`)
      run("git add package.json CHANGELOG.md")
    } else {
      run("git add package.json")
    }
    run(`git commit -m "Bump version to v${newVersion}"`)
    run(`git push origin ${releaseBranch}`)
    console.log(`✅ Branch ${releaseBranch} pushed`)

    // Open PR and merge via GitHub API
    const { owner, repo } = getRepoOwnerAndName(originalUrl)
    const gh = { owner, repo, token: RELEASE_TOKEN }

    console.log(`\n🔀 Creating pull request...`)
    const pr = await ghCreatePR({ ...gh, releaseBranch, newVersion, currentVersion })
    console.log(`✅ PR #${pr.number} created: ${pr.html_url}`)

    // Poll until all required checks pass
    console.log(`\n⏳ Waiting for required checks to pass...`)
    const headSha = pr.head.sha
    const POLL_INTERVAL_MS = 10_000
    const TIMEOUT_MS = 10 * 60_000 // 10 minutes
    const deadline = Date.now() + TIMEOUT_MS

    while (true) {
      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for required checks to pass.")
      }

      const { state } = await ghGetCommitStatus({ ...gh, sha: headSha })
      const { check_runs: runs = [] } = await ghGetCheckRuns({ ...gh, sha: headSha })

      const pending = runs.filter((r) => r.status !== "completed")
      const failed = runs.filter(
        (r) => r.status === "completed" && !["success", "skipped", "neutral"].includes(r.conclusion)
      )

      if (failed.length > 0) {
        throw new Error(`Required check(s) failed: ${failed.map((r) => r.name).join(", ")}`)
      }

      if (pending.length === 0 && runs.length > 0 && state !== "failure") {
        console.log(`✅ All checks passed`)
        break
      }

      process.stdout.write(
        `   ⏳ Still running: ${pending.map((r) => r.name).join(", ")} — retrying in ${POLL_INTERVAL_MS / 1000}s...\r`
      )
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }

    const merge = await ghMergePR({ ...gh, prNumber: pr.number, newVersion })
    console.log(`✅ PR #${pr.number} merged`)

    await ghCreateTag({ ...gh, tag, sha: merge.sha })
    console.log(`✅ Tag ${tag} created on merge commit`)
  } catch (err) {
    // Restore package.json version on failure (only if it was already written)
    if (pkg.version === newVersion) {
      pkg.version = currentVersion
      writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n")
    }
    throw err
  } finally {
    // Switch back to original branch, then delete release branch, then restore stash
    try {
      run("git checkout -")
    } catch {
      /* ignore */
    }

    try {
      run(`git branch -D ${releaseBranch}`)
      console.log(`✅ Local branch ${releaseBranch} deleted`)
    } catch {
      /* ignore */
    }

    if (stashed) {
      try {
        run("git stash pop")
        console.log("✅ Uncommitted changes restored from stash")
      } catch {
        console.warn("⚠️  Could not restore stash automatically. Run 'git stash pop' manually.")
      }
    }

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
