# NodeWave Delivery Web

Responsive delivery dashboard for Product Managers, UI/UX, Frontend, Backend,
and isolated Client Guest users. The interface consumes the NodeWave Delivery
API and renders only the operations allowed by backend supplied permissions.

- **Live application:** `<VERCEL_FRONTEND_URL>`
- **Live API:** `<RAILWAY_BACKEND_URL>`
- **Backend repository:**
  [DanielRidho/nodewave-delivery-api](https://github.com/DanielRidho/nodewave-delivery-api)

Replace the two URL placeholders after deployment.

## Technology

- Next.js 16 App Router, React 19, and strict TypeScript
- Tailwind CSS 4 and Radix UI
- TanStack Query 5 and Axios
- Zustand 5
- React Hook Form and Zod
- Vitest, Testing Library, Biome, Husky, and Commitlint

## Run locally

Run and seed the backend first by following its README. Then clone this
repository:

```powershell
git clone https://github.com/DanielRidho/nodewave-delivery-web.git
cd nodewave-delivery-web
Copy-Item .env.example .env.local
bun install --frozen-lockfile
bun run dev
```

The example environment file contains:

```text
NEXT_PUBLIC_BE_URL=http://localhost:3001/api
```

Open `http://localhost:3000`. The login form intentionally starts empty and
does not display seeded credentials.

## Seeded accounts

All accounts use password `Password123!`.

| Actor | Email | Evaluation flow |
|---|---|---|
| Product Manager | `pm@nodewave.test` | Create/edit projects and tasks, dependencies, visibility, audit preview |
| UI/UX | `uiux@nodewave.test` | Complete assigned UI/UX work |
| Frontend | `frontend@nodewave.test` | Observe and unlock a dependency blocked task |
| Backend | `backend@nodewave.test` | Complete the API prerequisite |
| Client Nusa | `client@nusa.test` | See only approved Nusa milestones and aggregate metrics |
| Client Aruna | `client@aruna.test` | See only approved Aruna milestones and aggregate metrics |

## What to evaluate

1. Sign in as Frontend. `Frontend checkout slicing` is shown as Blocked while
   `Checkout API integration` is unfinished, and its Start button is disabled.
2. Sign in as Backend and complete `Checkout API integration`.
3. Sign in as Frontend again. The slicing task is now Todo and can be started.
4. Sign in as PM. Create or edit a project, edit task core fields, define a
   dependency, and inspect the audit preview. PM cannot complete an executor's
   in progress task.
5. Sign in as Client Nusa and Client Aruna. Each account sees exactly one own
   project and only tasks marked client visible. Internal identity and comments
   are absent from the API response.

## Frontend security model

The UI treats the backend as the source of truth. Task controls use the
`permissions` object returned by the API, while every mutation is validated
again server-side. A disabled dependency action is therefore an explanation to
the user rather than the security boundary.

Authentication is persisted with Zustand. TanStack Query keys include the
authenticated user ID, and the query cache is cleared on login and logout. This
prevents data cached during a PM session from being rendered after switching to
a client account in the same browser.

The Client Guest UI only receives the backend's masked response. Engineer names,
avatars, departments, internal comments, audit data, attachments, permissions,
and dependency details are not hidden with CSS; they are omitted by the API.

## Query contract

The task board sends the standard NodeWave parameters directly:

- `filters` for exact department/status filters.
- `searchFilters` for title and description contains matching.
- `rangedFilters` for inclusive ranges where applicable.
- `page`, `rows`, `orderKey`, and `orderRule` for list navigation.

Object and array values are serialized using `JSON.stringify`. The frontend
does not use custom aliases outside the documented API contract.

## Quality checks

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
```

The UI tests verify that a blocked executor sees a disabled Start action and
that a Client Guest task card does not render internal identity details.

## Vercel deployment

Import this repository in Vercel and configure the production environment
variable:

```text
NEXT_PUBLIC_BE_URL=https://YOUR-RAILWAY-DOMAIN/api
```

Redeploy after changing this value because `NEXT_PUBLIC_` variables are embedded
during the Next.js build. Copy the final Vercel origin into the backend
Railway service as `FRONTEND_URL`, without a trailing slash, and redeploy the
backend so its CORS policy accepts the live frontend.
