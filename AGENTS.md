# Repository Agent Rules

## Understand Before Editing

- Use CodeGraph before text search when `.codegraph/` exists.
- Read the owning module, its callers, and nearby tests before changing behavior.
- Reuse established components, types, constants, and API helpers before adding new abstractions.
- Keep changes within the requested scope. Do not rewrite unrelated code or tests.

## Coding Guardrails

- Do not compare domain state to inline string literals. Use named constants, typed maps, or predicates.
- Do not place unexplained numeric literals in logic. Constants must include domain meaning or units, such as `POLL_INTERVAL_MS`.
- JSX presentation values such as icon sizes are allowed; protocol limits, timeouts, ports, pagination, and retry counts are not presentation values.
- Do not use `any`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable`, or similar suppression comments.
- Do not leave floating promises. Await, return, or explicitly handle every asynchronous operation.
- Do not hardcode absolute URLs in application logic. Put them in configuration or a constants module.
- Do not copy a block to make a variation. Extract shared behavior when duplication is structural.
- Do not add a dependency unless existing platform or repository APIs cannot solve the problem.
- Do not weaken, delete, or bypass a quality rule to make generated code pass without documenting the reason and adding coverage.
- Do not weaken or delete existing tests to fit an implementation. Add negative and failure-path coverage for changed behavior.
- Do not treat AI-generated tests as security evidence. Security-sensitive changes require independent review and established scanners or tests.
- Do not read, write, log, or commit credentials. Use the repository's secret and environment mechanisms.
- Do not modify CI, deployment, permissions, or infrastructure unless the task explicitly includes that surface.
- Keep nonblank, noncomment source lines under 520 per file and 310 per function. Treat these as migration ceilings, not design targets.

## Verification

- Run `npm run quality` after code changes.
- Run `npm run ci` before completion.
- Run `npm run test:e2e` for rendered UI or workflow changes.
- Report any check that could not run and why.
