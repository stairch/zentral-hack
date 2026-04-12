## Release Process

The [release script](/scripts/release.mjs) automates versioning, tagging, and pushing to the repository.

A deployment is created automatically, see [Deployment](#deployment)

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
4. Commits and pushes the version bump
5. Creates an annotated git tag and pushes it
6. Restores the previous local git `user.email`

> [!NOTE]
> The release email is only set locally (`.git/config`) temporary and never affects your global git configuration.

---

## Deployment

➡️ [Latest deployments](https://github.com/stairch/hack-zentral/deployments)

A deployment is created automatically whenever a tag is created that follows [Semantic Versioning](https://semver.org).

| Deployment  | Tag Example     | Vercel Project                                                            | Environment    | Vercel Deployment Type  |
| ----------- | --------------- | ------------------------------------------------------------------------- | -------------- | ----------------------- |
| Production  | `1.0.0`         | [prod-hack-zentral](https://vercel.com/stairs-projects/prod-hack-zentral) | Production     | Production (live)       |
| Demo        | `1.0.0-beta.1`  | [dev-hack-zentral](https://vercel.com/stairs-projects/dev-hack-zentral)   | ⚠️ Development | ⚠️ Production (live)    |
| Development | `1.0.0-alpha.1` | [dev-hack-zentral](https://vercel.com/stairs-projects/dev-hack-zentral)   | Development    | Preview (auth required) |

###### For more information, see below

<br/>

### Production Deployment

Every tag that is a stable release (e.g. `1.0.0`, `1.2.0`) automatically creates a Production Deployment on the [**production Vercel project**](https://vercel.com/stairs-projects/prod-hack-zentral).
This is the publicly accessible live website used by end-users.

### Demo Deployment

Every tag that is a beta pre-release (e.g. `1.0.0-beta.1`, `1.2.0-beta.5`) automatically creates a Vercel production deployment on the [**development Vercel project**](https://vercel.com/stairs-projects/dev-hack-zentral).
This is used to showcase and test new features in a production-like environment before they are released to production.

### Development Deployment

Every tag that is an alpha pre-release (e.g. `1.0.0-alpha.1`, `1.2.0-alpha.3`) automatically creates a Vercel preview deployment on the [**development Vercel project**](https://vercel.com/stairs-projects/dev-hack-zentral).
This is used to test incomplete or experimental changes in a production-like environment without exposing them to stakeholders or end-users.

> [!NOTE]
> The development deployment is only visible when logged in with the **STAIR Vercel account**, which ultimately requires being logged in with the **STAIR GitHub account**.
