# Release checklist

The first npm release is pending ownership of the `tanatasa` npm scope and npm
CLI authentication. No npm package has been published yet.

1. Create the free npm organization `tanatasa` from the authorized npm account,
   or confirm that account already owns this scope. GitHub organization ownership
   does not confer npm scope ownership.
2. Sign in using `npm login --auth-type=web`. Run `npm whoami` and confirm org access.
3. From `cli/`, run `npm test`, inspect `npm pack --dry-run`, then publish the
   first version with `npm publish --access public`. npm may require account 2FA.
4. On npm, open `@tanatasa/cli` package settings and configure a GitHub Actions
   trusted publisher with organization `tanatasa-beauty`, repository `tanatasa`,
   workflow filename `publish-cli.yml`, and environment `npm`.
5. Protect the GitHub `npm` environment with the intended release approval rules.
   The workflow uses OIDC and does not need a stored npm access token.
6. Verify `npx --yes @tanatasa/cli@1.0.0 --version` and a read-only live search.
   Replace the pending-release notices in the root README and `docs/cli.md`,
   regenerate `llms-full.txt`, and add the npm install command to the site guide.

For later releases, update `cli/package.json` and the changelog, then push a
matching tag such as `cli-v1.0.1`. The publish workflow rejects untagged refs and
tags that do not match the package version. Never reuse a published version.

The package allowlist ships only the executable, package metadata, README and
LICENSE. Tests, this checklist, credentials and server source are excluded.
