# AI Coding Guardrails

This repository treats AI-generated code as untrusted until it passes the same
static analysis, tests, and human review as any other contribution.

## Common Failure Modes

| Failure mode | Typical AI-generated form | Enforced by |
| --- | --- | --- |
| Magic values | `slice(0, 20)`, raw timeout values, protocol status numbers | Custom TypeScript AST check and ESLint |
| Hardcoded domain strings | `status === "RUNNING"` or `["running"].includes(status)` | Custom TypeScript AST check |
| Type-system escape | `any`, unchecked assertions, ignored TypeScript errors | Type-aware typescript-eslint rules |
| Async errors | Promise calls without `await`, `return`, or explicit handling | `no-floating-promises` and `no-misused-promises` |
| Copy/paste growth | Near-identical handlers, forms, or rendering blocks | jscpd duplication threshold |
| Dead code | Unused files, exports, dependencies, or abandoned variants | Knip |
| Complexity growth | Very large components, nested branches, too many parameters | ESLint complexity and size ceilings |
| Unsafe rendering | Raw HTML injection or dynamic code execution | ESLint restricted syntax, `no-eval`, `no-new-func` |
| Configuration leakage | Absolute service URLs or credentials in feature code | Custom AST check and secret review |
| Fake confidence | Tests written only to confirm the generated implementation | Required existing-test preservation and human review |
| Scope expansion | Unrequested CI, deployment, permission, or infrastructure edits | Repository agent rules and required review |

## Allowed Patterns

Name values by their domain meaning and units:

```ts
const POLL_INTERVAL_MS = 15_000;
const MAX_SESSION_RESULTS = 20;
const HTTP_UNAUTHORIZED = 401;
```

Model string state once and compare through constants or predicates:

```ts
const VPS_STATUS_RUNNING = "RUNNING";

function isRunning(status: string | null): boolean {
  return status === VPS_STATUS_RUNNING;
}
```

Literal strings are still appropriate for display copy, CSS class names, object
keys, API paths centralized in the API client, and test fixtures. JSX icon sizes
are presentation values and are intentionally excluded from the magic-number
check.

## Commands

- `npm run lint`: type-aware ESLint, React Hooks, complexity, and safety rules.
- `npm run check:ai`: repository-specific AST checks for hardcoded logic.
- `npm run check:dead-code`: unused file, export, and dependency analysis.
- `npm run check:duplicates`: copy/paste detection with a 5% ceiling.
- `npm run quality`: all static quality gates.
- `npm run ci`: type checking, quality gates, unit tests, and production build.

## Exceptions

Inline suppression comments are intentionally rejected. A legitimate exception
must change the shared checker or configuration, explain the domain reason in
this document, and include a focused regression test. This keeps exceptions
visible and prevents generated code from silently disabling its own guardrails.

The React Hooks `set-state-in-effect` rule is disabled at repository level.
This application intentionally starts API synchronization from effects, and the
rule reports those request functions because they own loading state. Rules of
Hooks, exhaustive dependency checks, and ref safety remain enabled.

## References

- ESLint `no-magic-numbers`: https://eslint.org/docs/latest/rules/no-magic-numbers
- typescript-eslint `no-floating-promises`: https://typescript-eslint.io/rules/no-floating-promises/
- typescript-eslint `no-explicit-any`: https://typescript-eslint.io/rules/no-explicit-any/
- Knip unused-code analysis: https://knip.dev/explanations/how-knip-works
- jscpd copy/paste detection: https://github.com/kucherenko/jscpd
- OWASP Secure Coding with AI: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html
- GitHub review guidance for AI-generated code: https://docs.github.com/en/copilot/tutorials/review-ai-generated-code
