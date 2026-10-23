# Release checklist

The first version, `@tanatasa/cli@1.0.0`, was published on 23 October 2026
by `tanatasa-dev`, the owner of the free `tanatasa` npm organization.

## Trusted publisher setup

The GitHub release workflow is `.github/workflows/publish-cli.yml`. In npm
package settings, configure a GitHub Actions trusted publisher with:

- Organization: `tanatasa-beauty`
- Repository: `tanatasa`
- Workflow filename: `publish-cli.yml`
- GitHub environment: `npm`

The workflow uses OIDC and does not need a stored npm access token. Package
settings and account 2FA remain controlled by the dedicated Tanatasa npm account.

For later releases, update `cli/package.json` and the changelog, then push a
matching tag such as `cli-v1.0.1`. The publish workflow rejects untagged refs and
tags that do not match the package version. An already-published version is skipped so the bootstrap release can be tagged. Never change or reuse an existing published version.

The package allowlist ships only the executable, package metadata, README and
LICENSE. Tests, this checklist, credentials and server source are excluded.
