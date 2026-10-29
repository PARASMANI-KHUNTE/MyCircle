# Security Policy

## Supported versions

Security fixes are applied to the `main` branch and the latest deployed release.

## Reporting a vulnerability

Please do not open a public issue for security problems.

- Use GitHub's private vulnerability reporting: <https://github.com/PARASMANI-KHUNTE/MyCircle/security/advisories/new>
- Include a description, affected component (Server/Web/Mobile), reproduction steps and impact.
- We will acknowledge reports as soon as possible and keep you informed of the fix.

## Handling secrets

- Never commit `.env` files, credentials, private keys or keystores.
- Use the provided `.env.example` files as templates.
- Rotate any credential that may have been exposed. If a secret is committed, remove it from history and rotate it immediately.

## Dependency updates

Dependabot is configured for all apps. Review and merge security updates promptly.
