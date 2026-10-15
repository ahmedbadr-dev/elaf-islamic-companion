# Security Policy

## Reporting a vulnerability

If you discover a security issue in Elaf (auth, NFC claim flow, Firestore rules, or secret exposure), please email **hello@ahmedbadr.dev** instead of opening a public issue.

Please include:

- A short description of the issue
- Steps to reproduce (if possible)
- Impact assessment (what an attacker could do)

## Secrets

- Never commit `.env` files or API keys
- Rotate any key that may have been exposed
- Prefer environment variables for Gemini and similar services

## Supported versions

Security fixes are applied on the latest `main` branch of this repository.
