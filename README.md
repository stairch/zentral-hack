## Release Process

The [release script](/scripts/release.mjs) automates versioning, tagging, and pushing to the repository.

A deployment is created automatically, see [Deployment](#deployment)

### Usage

Run the release script with:

```bash
npm run release
```

The script will prompt for a new version number and validate it. Versions must follow [Semantic Versioning](https://semver.org).

**Validation rules:**

- Version must be greater than the current one
- Pre-releases must follow the order: `alpha` → `beta` → stable
- Downgrading (e.g. `beta` → `alpha`) is not allowed

### What the script does

1. Prompts for a new version and validates it
2. Writes the new version to `package.json`
3. Temporarily sets the local git `user.email` to the release email (STAIR GitHub E-Mail)
4. Commits and pushes the version bump
5. Creates an annotated git tag and pushes it
6. Restores the previous local git `user.email`

> **Note:** The release email is only set locally (`.git/config`) temporary and never affects your global git configuration.

---

## Deployment

[Latest deployments](https://github.com/stairch/hack-zentral/deployments)

A deployment is created automatically whenever a tag is created that follows [Semantic Versioning](https://semver.org).

### Preview Deployment

Every tag that is a prelease (e.g. `1.0.0-alpha.1`, `1.2.0-beta.5`) automatically creates a Preview Deployment.

> **Note:** The preview is only visible when logged in with the **STAIR Vercel account**, which requires being authenticated with the **STAIR GitHub account**.
