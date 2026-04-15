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

| Deployment | URL                                                           | Vercel Project                                                            | Environment    | Vercel Deployment Type |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------- | ---------------------- |
| Production | [zentralhack.ch](https://zentralhack.ch)                      | [prod-hack-zentral](https://vercel.com/stairs-projects/prod-hack-zentral) | Production     | Production (live)      |
| Demo       | [project-7ly5q.vercel.app](https://project-7ly5q.vercel.app/) | [dev-hack-zentral](https://vercel.com/stairs-projects/dev-hack-zentral)   | Development ⚠️ | Production (live) ⚠️   |

###### For more information, see below

<br/>

### Production Deployment

Every tag that is a stable release (e.g. `1.0.0`, `1.2.0`) automatically creates a Production Deployment on the [**production Vercel project**](https://vercel.com/stairs-projects/prod-hack-zentral).
This is the publicly accessible live website used by end-users.

### Demo Deployment

Every tag that is a pre-release (e.g. `1.0.0-alpha.1`, `1.2.0-beta.5`) automatically creates a Vercel production deployment on the [**development Vercel project**](https://vercel.com/stairs-projects/dev-hack-zentral).
This is used to showcase and test new features in a production-like environment before they are released to production.
