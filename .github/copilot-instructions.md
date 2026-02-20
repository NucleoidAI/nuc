# Copilot Instructions (UI + API Review)

For UI code review, follow:

- `./.github/copilot-reviewer-instructions.md`

For API code review, follow:

- `./.github/copilot-api-reviewer-instructions.md`
  W
  Mandatory UI boundaries in `/dashboard/src`:

- `components/`: stateless and presentational
- `widgets/`: API calls and orchestration
- `layouts/`: layout composition only
- `pages/`: container/routing composition

Mandatory API boundaries in `/api/src`:

- `routes/`: HTTP layer only
- `functions/`: business logic and orchestration
- `lib/`: provider wrappers only
- `models/` + `schemas/`: data contract

Mandatory dataset rule:

- `/api/src/dataset/**` and `/api/src/seeds/**` must use JSON objects only.
- No human-language prose or markdown in dataset/seeds.

In reviews, prioritize:

1. Layer boundary violations
2. Contract and behavior regressions
3. Missing validation/loading/error handling
4. Missing tests
5. Concrete file+line fix suggestions

Avoid style-only blocking comments.
