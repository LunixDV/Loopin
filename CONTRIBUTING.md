# Contributing to loopin

Thank you for contributing to **loopin**! To maintain clean code and tracking directories, please follow the guidelines and workflows detailed below.

---

## 1. Ralph's Method (Track Management)

We maintain feature specifications, implementation plans, and development history inside the `.agents/` folder of the workspace. Follow these steps for every new task:

1. **Verify Tracks Registry**: Read [.agents/tracks.md](file:///home/zenmi/Projects/Loopin/.agents/tracks.md) to inspect active and completed tracks.
2. **Define a New Track**: Create a folder for the track under `.agents/tracks/<track_name>_<YYYYMMDD>/`.
3. **Write Specifications & Plans**:
   - Write a `spec.md` in the track's folder describing the problem and proposed technical changes.
   - Write a `plan.md` in the track's folder detailing step-by-step implementation tasks and verification criteria.
4. **Register the Track**: Append the track under the `Active Tracks` section in [.agents/tracks.md](file:///home/zenmi/Projects/Loopin/.agents/tracks.md).
5. **Mark Progress**: Update the checkboxes (`[ ]` to `[x]`) in `plan.md` as you implement and verify tasks.
6. **Complete the Track**: Move the track record to the `Completed Tracks` section in [.agents/tracks.md](file:///home/zenmi/Projects/Loopin/.agents/tracks.md) once finished and fully verified.

---

## 2. Coding Conventions

- **Next.js & React**:
  - Keep components modular and readable.
  - Rely on Next.js Server Actions for state updates, avoiding client-side credential transmission.
- **Styling**:
  - Use Tailwind CSS v4 variables and theme properties.
  - Implement dynamic viewports (`dvh`) for height dimensions and ensure mobile layouts do not scroll horizontally.
  - Utilize modern styling (glassmorphism overlays, border/outline shadows, transition transformations) for interactive controls.
- **Validation**:
  - Define Zod schemas inside [event-types.ts](file:///home/zenmi/Projects/Loopin/lib/event-types.ts) and validate response structures.

---

## 3. Formatting, Linting & Testing

We enforce automated checks to prevent pushing broken or unformatted code.

### Pre-commit Git Hook

A Husky git pre-commit hook runs before every commit. It enforces the following pipeline:

```bash
bun run format:check && bun run lint && bun test
```

If any step in the pipeline fails, the git commit is aborted.

### Development Commands

- **Run unit tests**:
  ```bash
  bun run test
  ```
- **Run format checks**:
  ```bash
  bun run format:check
  ```
- **Apply formatting**:
  ```bash
  bun run format
  ```
- **Run linter**:
  ```bash
  bun run lint
  ```
