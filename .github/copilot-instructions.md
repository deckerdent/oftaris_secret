# Project Instructions

## Session Startup And Git Discipline

- At the start of every new session, before edits or mutating tools, run `git status --short --branch` and `git branch --show-current`. Inspect the upstream and the remote's default branch, for example with `git branch -vv` and `git symbolic-ref --quiet refs/remotes/origin/HEAD`; do not assume the default is always `main`.
- Never do development, commits, or pushes on the default branch or a protected branch, including `main` and `master`. If protection is unknown, check repository policy or ask. Reading branch metadata to choose a base is allowed.
- Compare the task with the checked-out branch name. Continue only on a clearly relevant, unprotected working branch. If the branch is protected, unrelated, detached, or ambiguous, ask the user for the new branch name and its base before switching or creating it. Do not silently choose a base or move existing changes.
- Before starting work on an already checked-out working branch, always run `git pull --ff-only` against its configured upstream. If there is no upstream, the pull fails, or histories diverge, report the blocker and ask which upstream/base to use before changing tracking or integrating another branch. Do not auto-rebase, force-pull, or auto-stash.
- Preserve pre-existing edits and untracked files. Never reset, discard, stash, stage, commit, push, delete branches, or force-push without explicit authorization. Stage only task-related files when a commit is requested; inspect the diff and status first.
- Keep changes focused. Report validation results and remaining blockers; do not fix unrelated failures. Deployment from `main` does not authorize development on `main`.

## Project And Source Layout

- This is a Vue 3 single-page application using TypeScript and Vite. Pinia manages shared client state, Vue Router manages routes, and Supabase provides authentication and the database. Vitest and Vue Test Utils provide unit/component tests.
- Tailwind CSS is the intended styling system, but it is not installed or configured in the current starter. Do not assume utility classes work. Add its integration only as an explicitly scoped setup task; until then preserve the existing CSS.
- `.github/workflows/deploy-static.yml` builds pushes to `main` and deploys `dist/` through GitHub Pages Actions. This is a static site: do not introduce a runtime Node server or server-only endpoints into the frontend.
- `src/main.ts` initializes Vue, Pinia, Router, and global styles; `src/App.vue` is the root shell.
- `src/views/` holds route-level views; `src/router/index.ts` defines routes. Hash history is intentional for GitHub Pages, which does not provide SPA rewrites. Preserve `import.meta.env.BASE_URL` and the Vite base `/oftaris_secret/` unless the deployment URL changes.
- `src/components/` holds reusable components, `src/components/icons/` holds existing icons, and `src/components/supabase/` holds Supabase-related UI. Component tests live in neighboring `__tests__/` directories.
- `src/stores/` holds Pinia stores. `src/config/supabase.ts` owns the shared Supabase client; do not instantiate clients in individual components.
- `src/assets/` holds bundled styles/assets; `public/` holds assets copied without transformation. Respect the Pages base when constructing asset URLs.
- Root Vite, TypeScript, Vitest, and ESLint configuration files define the toolchain. `.vscode/tasks.json` contains shared run/build tasks. `.tools/codebase-memory/` contains local tooling/index data, not application code.

## Codebase Memory Agents And Indexing

- Use the workspace-configured `codebase-memory` MCP server. Discover its registered tool schemas before invoking tools; do not invent commands, tool names, or registration parameters. Never launch an alternate MCP client or inspect index databases as a substitute for missing tools.
- Use `list_projects` to select the project whose indexed root exactly matches this workspace, not just a similarly named project. For initial setup, create/register a project only if that root is missing, using the exposed registration tool; `oftaris-secret` is the package's project name. If an existing root/name conflicts, ask instead of replacing it.
- Index after initial registration, before relying on graph answers. Check `index_status` for generation, freshness, and warnings; after pulls, branch switches, dependency/configuration changes, or meaningful source changes, use `detect_changes` when available and refresh the relevant stale index before relying on it. Prefer supported incremental indexing; do not rebuild after every read or trivial edit.
- Index this repository only. Preserve the existing `/docs/` exclusion, exclude generated/vendor/cache directories such as `node_modules/`, `dist/`, `coverage/`, `.git/`, and `.tools/`, and never index credentials or local environment files. Read excluded documentation directly when relevant.
- After indexing, verify completion and freshness with `index_status`. A queued request or an existing database is not proof of a completed index. If MCP tools are unavailable, report registration/indexing as blocked and use direct source reads for the coding task; never claim an index was created.
- Summon **Codebase Memory Scout** for quick orientation, finding likely owners, and provisional discovery across unfamiliar code. Its results are leads, not exhaustive impact or absence claims.
- Summon **Codebase Memory Verify** by default for codebase questions requiring reliable answers, source-backed behavior checks, or validation of Scout leads. Verify material claims against current source and indexed-path coverage.
- Summon **Codebase Memory Auditor** for bounded, thorough caller/callee tracing, change-impact analysis, cross-module risks, or claims requiring comprehensive coverage. Define the question and boundary explicitly.
- These three agents are read-only. Registration and indexing belong to the coordinating assistant using the available write-capable MCP tools, not to the agents. Small, already-local edits do not need delegation.
- Each agent must select the exact project root, check `index_status`, follow relevant pagination, and use `check_index_coverage` for evidence paths. Partial, stale, skipped, excluded, or unknown coverage requires direct source inspection and qualified conclusions, especially for negative claims.

## Vue, TypeScript, And State

- Follow nearby conventions and favor Vue SFCs with `<script setup lang="ts">` and the Composition API. Type props, emits, store state, and external data; avoid `any`, unsafe casts, and non-null assertions that hide missing states.
- Keep components focused. Use props down and events up; never mutate props. Use computed values for derived state, watchers for actual side effects, and clean up listeners, timers, subscriptions, and asynchronous work on unmount.
- Preserve reactivity when destructuring Pinia stores with `storeToRefs`. Keep local UI state local; use Pinia only for genuinely shared state and put reusable stateful logic in composables when needed.
- Use stable keys for lists, accessible semantic controls, and explicit loading, empty, and error states. Do not render untrusted HTML through `v-html`.
- Reuse existing components and styles. Once Tailwind is configured, follow its project conventions instead of adding a competing styling framework. Keep layouts responsive and keyboard accessible.
- Keep routes centralized, prefer named navigation, and lazy-load route views where appropriate. Client-side guards improve UX but are not an authorization boundary.

## Supabase And Static-Site Security

- Use the shared client and handle both Supabase errors and nullable data explicitly. Keep auth session state reactive; unsubscribe from auth listeners and clear user-specific state on logout.
- All `VITE_*` values are public build-time data. Only a public/publishable or anonymous Supabase key belongs in the browser. Never expose a service-role key, database password, token, or private environment file in source, logs, tasks, or the index.
- Enforce data access through Supabase Row Level Security and database policies, not just route guards or hidden UI. Privileged operations must run in a trusted backend/Edge Function, not this static bundle.
- Respect the existing PKCE auth flow. Configure Supabase redirect allowlists and callback URLs for both localhost and the deployed Pages base; do not change hash routing or callback behavior without testing the auth return path.

## Commands And Validation

- Respect the Node engine in `package.json` and use npm with the existing lockfile. Use `npm ci` for a clean install; do not replace the package manager or churn dependencies incidentally.
- `npm run dev` starts Vite. In VS Code, run **Vue: Start Dev Server**; stop it with **Tasks: Terminate Task** or **Vue: Stop Dev Server**, the Windows-only task scoped to this workspace's Vite process. Never kill every Node process or an arbitrary port owner.
- `npm run build` runs type-checking and the production bundle; **Vue: Build** is the default VS Code build task. `npm run preview` serves the production output locally.
- Use `npm run test:unit -- --run` for a non-watching test run, adding a test path to focus on the touched behavior. Use `npm run type-check` for Vue/TypeScript validation. Add or update neighboring tests for changed behavior.
- Run the cheapest meaningful check immediately after an edit, then the relevant test/type/build gates. `npm run lint` and `npm run format` modify files; avoid unrelated formatting or automatic fixes in a dirty worktree.
- Instructions guide agent behavior; they are not an enforced Git hook. Report any startup command or required check that could not complete.