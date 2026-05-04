# Contributing

## Core Principles

- `main` is always production-ready
- Only merge what can be released
- A release is what users can see
- Versions must follow [Semantic Versioning](https://semver.org)

---

## Workflow

### Branching

- Never commit directly to `main`
- Always use a branch
- Merge only via Pull Request (PR)

### Features

- Develop features in separate branches
- Do **not** merge features into `main` until they are:
  - fully complete
  - ready to be released

- It is valid to keep finished features in a branch until the planned release (e.g. milestone)

### Bug Fixes (Hotfixes)

- Create a branch from `main`
- Fix the bug
- Open PR → merge into `main`
- Release immediately as a **patch version** (e.g. `1.0.1`)

---

## Versioning (SemVer)

We follow [Semantic Versioning](https://semver.org):

- **Patch (1.0.x)** → bug fixes
- **Minor (1.x.0)** → new features
- **Major (x.0.0)** → breaking changes

---

## Releases

- Use the release script:

```bash
npm run release
```

- Choose version based on changes:
  - Only bugfix → patch
  - New features included → minor

---

## Pull Requests

- Required for all merges into `main`
- Keep PRs small and focused when possible
- Reviews are lightweight: goal is controlled merges, not perfection

---

## Rule of Thumb

If it should not be released yet → keep it in a branch  
If it's ready for users → merge to `main`
