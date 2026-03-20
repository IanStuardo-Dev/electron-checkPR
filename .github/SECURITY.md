# Security Policy

Last updated: 2026-03-20

Thank you for helping keep `electron-checkPR` and its users safe.

## Supported Versions

This project currently supports security fixes for the latest state of `main`.

| Version / Branch | Supported | Notes |
| --- | --- | --- |
| `main` (latest commit) | :white_check_mark: | Receives security updates and dependency fixes. |
| Older commits/tags/branches | :x: | No guaranteed fixes. Upgrade to latest `main`. |

## Reporting a Vulnerability

Please report vulnerabilities **privately** using GitHub's private reporting flow:

- Preferred: GitHub Security Advisories / private vulnerability report  
  `https://github.com/IanStuardo-Dev/electron-checkPR/security/advisories/new`

If private reporting is not available in your UI, open a minimal issue titled
`[SECURITY-CONTACT] Request private channel` with **no technical details** and we
will move to a private channel.

Do **not** disclose exploit details in public issues, discussions, or PRs before
a fix is available.

## What to Include in Your Report

Please include as much of the following as possible:

- Short summary and impact
- Affected component(s) and file/path references
- Reproduction steps (clear and minimal)
- Proof of concept (if available)
- Attack prerequisites and threat model assumptions
- Suggested severity (CVSS if you have it)
- Environment details (OS, Node/NPM, app/runtime context)
- Whether sensitive data or tokens were exposed

## Response and Disclosure Timeline

We aim for the following SLA targets:

| Stage | Target |
| --- | --- |
| Initial acknowledgement | Within 72 hours |
| Triage decision | Within 7 calendar days |
| First remediation plan | Within 14 calendar days after triage |
| Status updates (while open) | At least every 7 calendar days |

Target patch windows (best effort):

- Critical / High: as soon as possible, typically <= 30 days
- Medium: typically <= 60 days
- Low: next planned maintenance cycle

We follow coordinated disclosure. Public disclosure should happen only after a
fix (or mitigation guidance) is available and communicated.

## Scope

Examples of security-relevant areas for this repository:

- Electron security boundaries (`main`/`preload`/renderer IPC boundaries)
- Privilege escalation or arbitrary code execution paths
- Secret/token exposure risks
- Unsafe dependency behavior that is exploitable in runtime/build workflows
- Injection vulnerabilities in repository/provider/analysis flows

Out of scope:

- Social engineering, phishing, spam, or physical access scenarios
- Vulnerabilities only present in modified forks or unsupported versions
- Denial of service requiring unrealistic local-only assumptions
- Public disclosure without prior private report

## Research Guidelines (Safe Harbor)

When testing, please:

- Act in good faith and avoid privacy violations
- Do not exfiltrate or retain data beyond what is needed for the report
- Do not degrade service availability for others
- Stop testing once sensitive data exposure is confirmed and report immediately

We will not pursue action against good-faith research that follows this policy.

## Security Practices for Contributors and Users

- Use supported runtime versions from `package.json` (`engines`)
- Keep dependencies updated and review Dependabot alerts
- Run local checks before submitting changes:
  - `npm run quality:check`
  - `npm audit`
- Use least-privilege tokens for GitHub/GitLab/Azure integrations
- Never commit credentials, tokens, or secrets

## Credit

If you want, we are happy to acknowledge your report in the advisory or changelog
after the issue is resolved.
