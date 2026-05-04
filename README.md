## Project Overview

| Type                                 | URL                                      | Vercel Project                                                            | Environment    | Vercel Deployment Type | [Vercel Flags](#feature-flags) |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------- | -------------- | ---------------------- | ------------------------------ |
| [Production](#production-deployment) | [zentralhack.ch](https://zentralhack.ch) | [prod-zentral-hack](https://vercel.com/stairs-projects/prod-zentral-hack) | Production     | Production (live)      | Production                     |
| [Demo](#demo-deployment)             | See Bitwarden                            | [dev-zentral-hack](https://vercel.com/stairs-projects/dev-zentral-hack)   | Development ⚠️ | Production (live) ⚠️   | Production                     |
| Development                          | localhost                                | [dev-zentral-hack](https://vercel.com/stairs-projects/dev-zentral-hack)   | Development    | -                      | Development                    |

## Release Process

The [release script](/scripts/release.mjs) automates versioning, tagging, and pushing to the repository.

A deployment is created automatically, see [Deployment](#deployment)

### Setup

Create a `.env` file from `.env.example` in the project root if not already and add the GitHub PAT (see Bitwarden):

```
RELEASE_TOKEN=ghp_xxxxxxxxxxxx
```

### Usage

Run the release script with:

```bash
npm run release
```

The script will prompt for a new version number and validate it. Versions must follow [Semantic Versioning](https://semver.org).

### What the script does

1. Prompts for a new version and validates it
2. Writes the new version to `package.json`
3. Temporarily sets the local git `user.email` to the release email (STAIR GitHub E-Mail)
4. Temporarily authenticates as the STAIR release account via token
5. Commits and pushes the version bump
6. Creates an annotated git tag and pushes it
7. Restores the previous local git `user.email` and remote URL

> [!NOTE]
> The release email and token are only used temporarily during the script execution and never affect your global git configuration.

---

## Deployment

A deployment is created automatically whenever a tag is created that follows [Semantic Versioning](https://semver.org).

<br/>

### Production Deployment

Every tag that is a stable release (e.g. `1.0.0`, `1.2.0`) automatically creates a Production Deployment on the [**production Vercel project**](https://vercel.com/stairs-projects/prod-zentral-hack).
This is the publicly accessible live website used by end-users.

### Demo Deployment

Every tag that is a pre-release (e.g. `1.0.0-alpha.1`, `1.2.0-beta.5`) automatically creates a Vercel production deployment on the [**development Vercel project**](https://vercel.com/stairs-projects/dev-zentral-hack).
This is used to showcase and test new features in a production-like environment before they are released to production.

---

## Feature Flags

This project uses [Vercel Flags](https://vercel.com/docs/flags) with the Vercel adapter.

See [Project Overview](#project-overview) which Vercel Flags Environment to use.

### How it works

Flags are defined centrally in `lib/flags.ts`:

```ts
import { flag } from "flags/next"
import { vercelAdapter } from "@flags-sdk/vercel"

// example
export const adminDocumentsFlag = flag({
  key: "admin-documentss",
  adapter: vercelAdapter(),
  defaultValue: false
})
```

> [!WARNING]
> `defaultValue` must be set for every flag. This prevents a runtime error if a flag is missing or not configured correctly in Vercel.

#### Usage in a component

```tsx
import { adminDocumentsFlag } from "@/lib/flags"

export async function AdminDocumentsGate() {
  const showDocuments = await adminDocumentsFlag()

  if (!showDocuments) {
    return <p>Feature is currently disabled.</p>
  }

  return <DocumentsManagementPage />
}
```

#### Usage in a route

```ts
import { NextResponse } from "next/server"
import { adminDocumentsFlag } from "@/lib/flags"

export async function GET() {
  const showDocuments = await adminDocumentsFlag()

  if (!showDocuments) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 })
  }

  // ...
}
```

### How to add a new flag

1. Add a new flag in `lib/flags.ts` with (minimum):
   - unique `key`
   - `adapter: vercelAdapter()`
   - explicit `defaultValue`
2. Create the same flag key in **both Vercel projects** via Vercel project > `Flags` on Sidebar:
   - [prod-zentral-hack](https://vercel.com/stairs-projects/prod-zentral-hack)
   - [dev-zentral-hack](https://vercel.com/stairs-projects/dev-zentral-hack)

> [!WARNING]
> `defaultValue` must be set for every flag. This prevents a runtime error if a flag is missing or not configured correctly in Vercel.
