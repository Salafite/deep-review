# Deep Review

An AI-driven code review tool featuring multi-model adversarial debate and autonomous review cycle resolution.

## Features

- **Adversarial Analysis**: Two models evaluate pull requests sequentially to eliminate hallucinations and reduce false positives.
- **Multi-Platform Support**: Works with GitHub, GitLab, Azure DevOps, and local git working directories.
- **Ecosystem Guidelines**: In-depth rules for over 20 modern programming languages and frameworks.
- **Review Babysitting**: Harvests reviewer threads, reproduces confirmed defects, applies fixes, and updates discussions automatically.

## Installation

```bash
npx skills add Salafite/deep-review
```

Or clone directly into your agent skills folder:

```bash
git clone https://github.com/Salafite/deep-review.git .agents/skills/deep-review
```

## Quick Start

### Local Working Tree Review
```bash
node scripts/review-pr.mjs --local --base main
```

### Pull Request Review
```bash
node scripts/review-pr.mjs https://github.com/owner/repo/pull/123
```

### Harvest Review Threads
```bash
bash scripts/threads.sh 123
```

## License

MIT
