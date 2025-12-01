---
description: Split latest work into multiple logical PRs
alwaysApply: false
---

# CMHO Multi-PR Creation Guide

## Overview

This command analyzes your uncommitted/unstaged changes and splits them into multiple logical pull requests. Each PR should represent a cohesive, independent set of changes that can be reviewed and merged separately.

## Step 1: Analyze Current Changes

1. **Run `git status`** to identify all modified and untracked files
2. **Read and analyze each changed file** to understand:
   - What type of change it is (feature, fix, refactor, chore, etc.)
   - What domain/module it belongs to (e.g., inventory, auth, UI components)
   - Dependencies between files
   - Whether it's frontend, backend, or configuration

## Step 2: Group Changes Logically

Analyze the changes and split them using these strategies (in priority order):

### Strategy 1: By Feature/Functionality

- Group files that implement a complete feature together
- Example: All files for "Add inventory search" go together
- Example: All files for "Fix authentication bug" go together

### Strategy 2: By Domain/Module

- If multiple unrelated features, split by domain
- Example: Inventory-related changes vs. Payment-related changes
- Example: User management vs. Reporting

### Strategy 3: By Change Type

- Separate major features from bug fixes
- Separate refactoring from new features
- Keep configuration/dependency updates separate

### Strategy 4: By Independence

- Changes that can be deployed independently should be separate PRs
- Breaking changes should be isolated
- Experimental features should be separate from stable improvements

### Grouping Rules:

1. **Frontend and backend changes for the SAME feature** → Same PR
2. **Unrelated features** → Separate PRs
3. **Configuration/dependency updates** → Separate PR (unless directly part of a feature)
4. **Bug fixes unrelated to features** → Separate PR
5. **Refactoring that enables a feature** → Can be same PR or separate (analyze context)
6. **Documentation changes** → Group with related feature or separate PR
7. **Type definitions/interfaces** → Group with the feature that uses them

## Step 3: Initial Overview

Show the user a high-level overview of the proposed grouping:

```markdown
## 📦 Multi-PR Analysis

I've analyzed your changes and propose splitting them into **[N]** pull requests:

1. **[Short PR Title 1]** - [Type: feat/fix/refactor/chore] - [X files]
2. **[Short PR Title 2]** - [Type: feat/fix/refactor/chore] - [Y files]
3. **[Short PR Title 3]** - [Type: feat/fix/refactor/chore] - [Z files]
   [Continue for each proposed PR...]

---

**Process:** I'll present each PR one at a time for your approval before creating it. You can approve, modify, skip, or cancel at each step.

Ready to start with PR 1?
```

**Note:** This overview is a preliminary plan. The actual grouping may be adjusted dynamically based on user feedback during the iterative process.

## Step 4: Present PRs One at a Time

**CRITICAL:** Present and create PRs iteratively, one at a time.

### 4.1: Present Single PR

For each PR in sequence, show detailed information:

```markdown
## 📋 PR [N] of [TOTAL]: [Proposed PR Title/Description]

**Type:** [feat/fix/refactor/chore]

**Files:**

- `path/to/file1.ts` - [Brief description of changes]
- `path/to/file2.tsx` - [Brief description of changes]
- `path/to/file3.ts` - [Brief description of changes]

**Changes:**

- [Key change 1]
- [Key change 2]
- [Key change 3]

---

**Create this PR?**
```

### 4.2: Wait for User Response

**CRITICAL:** Do NOT proceed until the user explicitly responds.

Possible user responses:

- "Yes" / "Go ahead" / Any affirmative → Proceed to Step 5 for this PR
- "No" / "Skip" / Any negative → Move to next PR without creating this one

## Step 5: Create Approved PR

**Only after user approval**, create the PR following these steps:

For each approved PR group, follow these steps in order:

### 5.1: Create Feature Branch

1. **Ensure on main/base branch:**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create new feature branch:**

   ```bash
   git checkout -b [branch-name]
   ```

   Branch naming convention:
   - Features: `feature/short-descriptive-name`
   - Fixes: `fix/short-descriptive-name`
   - Refactors: `refactor/short-descriptive-name`
   - Chores: `chore/short-descriptive-name`

### 5.2: Stage Only Relevant Files

**Stage ONLY the files designated for this PR:**

```bash
git add path/to/file1.ts
git add path/to/file2.tsx
git add path/to/file3.ts
```

**IMPORTANT:**

- Do NOT use `git add .` or `git add -A`
- Only add the specific files for this PR
- Verify staged files with `git status`

### 5.3: Commit Changes

Follow the `commits.mdc` rules:

1. **Create logical commits** within this PR if needed:
   - Group related changes together
   - Use format: `--{TYPE}: {description}`
   - Examples:
     - `--feat: Add inventory search functionality`
     - `--fix: Resolve token expiration issue`
     - `--refactor: Simplify payment validation logic`

2. **Commit the staged changes:**
   ```bash
   git commit -m "--{TYPE}: {description}"
   ```

### 5.4: Run Linting

Before creating PR, ensure code quality:

```bash
pnpm lint
```

If linting errors occur:

- Fix the errors
- Stage the lint fixes: `git add [fixed-files]`
- Amend the commit: `git commit --amend --no-edit`

### 5.5: Push Branch

```bash
git push -u origin [branch-name]
```

### 5.6: Create PR Using create-pr.md Command

Now follow **ALL steps** from `.cursor/commands/create-pr.md`:

1. **Extract repository information** from git remote
2. **Get current branch name** for PR title
3. **Generate PR description** following the template:
   - Description section
   - GitHub Issue (check user's original prompt for issue links)
   - Related PRs
   - Changes section
   - Screenshots section

4. **Create PR using GitHub MCP:**

   ```
   mcp_github_create_pull_request with:
   - owner: [from git remote]
   - repo: [from git remote]
   - title: [branch name]
   - head: [feature branch]
   - base: "main"
   - body: [generated description]
   ```

5. **Report success to user:**
   ```markdown
   ✅ PR 1 Created Successfully!
   🔗 [View Pull Request #[number]]([URL])
   ```

### 5.7: Return to Base Branch

After this PR is created successfully:

```bash
git checkout main
```

### 5.8: Report PR Creation

Report success for this specific PR:

```markdown
✅ **PR [N] Created Successfully!**
🔗 [View Pull Request #[number]]([URL])

---

[If more PRs remaining]
Moving to next PR...
```

### 5.9: Continue to Next PR

**Repeat Step 4 for the next PR** in the sequence.

- Present the next PR details (Step 4.1)
- Wait for user approval (Step 4.2)
- Create the PR if approved (Step 5)
- Continue until all proposed PRs are processed

## Step 6: Final Summary

After all PRs are processed (created or skipped), provide a summary:

```markdown
## 🎉 Multi-PR Process Complete!

**Summary:**

- Total PRs proposed: [N]
- PRs created: [X]
- PRs skipped: [Y]
- PRs cancelled: [Z]

---

**Created Pull Requests:**

1. **[PR Title]** - [#123](https://github.com/owner/repo/pull/123)
   - Type: [feat/fix/etc]
   - Files: [count]
2. **[PR Title]** - [#124](https://github.com/owner/repo/pull/124)
   - Type: [feat/fix/etc]
   - Files: [count]

[Continue for all created PRs...]

---

**Note:** Your local repository is now on the `main` branch. All feature branches have been pushed to remote.

[If there are remaining uncommitted changes]
**Remaining uncommitted changes:**

- [List files that weren't included in any PR]
```

## Important Considerations

### Iterative Workflow Benefits

The one-at-a-time approach provides:

1. **Error recovery** - If one PR fails, others aren't affected
2. **User control** - Simple yes/no decision for each PR
3. **Dynamic adjustment** - Remaining files can be regrouped if PRs are skipped

### Dependencies Between PRs

If PRs have dependencies:

1. **Present dependent PRs in order** (base PR first, dependent PR second)
2. **Note the dependency** in the PR description
3. **Link related PRs** in the "Related PRs" section
4. **Consider regrouping** if dependencies are tight
5. **User can skip** a base PR and adjust dependent PR accordingly

### Conflicting Changes

If files need to be in multiple PRs:

1. **Analyze if the file should be split** into separate logical changes
2. **Create base PR first** with shared changes
3. **Create dependent PR** that builds on the first
4. **Or reconsider grouping** - maybe they should be one PR

### Partially Modified Files

If a file has changes for multiple PRs:

1. **Prefer splitting into one PR** if changes are tightly coupled
2. **Use interactive staging** if changes can be separated:
   ```bash
   git add -p path/to/file.ts
   ```
3. **Explain the situation** to the user and ask for guidance

### Dynamic Regrouping

With the iterative workflow:

1. **After each PR is created**, remaining files are still uncommitted
2. **If user skips a PR**, those files remain available and can be manually grouped later
3. **Adjust subsequent proposals** based on what's already been committed

### Testing Considerations

Each PR should ideally:

- Have all tests passing
- Be deployable independently
- Not break existing functionality
- Have complete feature implementation (not half-done)

## Error Handling

### If PR Creation Fails:

1. Check if branch is pushed to remote
2. Verify repository access and permissions
3. Ensure all commits are valid
4. Check for merge conflicts with base branch
5. Report specific error to user
6. **Ask user:** "Try again or skip to next PR?"
7. **Continue to next PR** if user says skip

### If Linting Fails:

1. Show linting errors to user
2. Fix errors automatically if possible
3. Ask user if they want to continue despite errors

### If Branch Already Exists:

1. Check if there's an existing PR for this branch
2. Ask user if they want to:
   - Use a different branch name
   - Update the existing branch
   - Skip this PR

## Best Practices

1. **Keep PRs focused** - Each PR should have one clear purpose
2. **Size matters** - Aim for reviewable PRs (not too large)
3. **Independence** - PRs should be independently mergeable when possible
4. **Clear descriptions** - Each PR description should stand alone
5. **Logical ordering** - Present base PRs before dependent PRs
6. **Test each PR** - Each should pass linting and tests
7. **Communicate dependencies** - Link related PRs clearly
8. **Simple approval** - Just ask "Create this PR?" and wait for yes/no
9. **Flexible grouping** - Remaining files can be regrouped after each PR is created

## Example Scenarios

### Scenario 1: Feature + Bug Fix + Config

**Changes:**

- 5 files for new inventory feature
- 2 files fixing authentication bug
- 1 file updating dependencies

**Proposed split (3 PRs):**

1. `feature/inventory-management` - 5 inventory files
2. `fix/authentication-token` - 2 auth files
3. `chore/update-dependencies` - 1 package file

**Workflow:**

1. Show overview: "3 PRs proposed"
2. Present PR 1 → "Create this PR?" → User: "yes" → Create PR 1
3. Present PR 2 → "Create this PR?" → User: "yes" → Create PR 2
4. Present PR 3 → "Create this PR?" → User: "no" → Skip PR 3
5. Final summary: 2 PRs created, 1 skipped, 1 file remaining uncommitted

### Scenario 2: Large Feature with Components

**Changes:**

- 3 new UI components
- 4 backend API endpoints
- 2 database migrations
- 1 configuration file
- 2 type definition files

**Proposed split (2 PRs):**

1. `feature/user-dashboard-backend` - APIs + migrations + types
2. `feature/user-dashboard-frontend` - UI components + types + config

**Workflow:**

1. Show overview: "2 PRs proposed"
2. Present PR 1 (backend) → "Create this PR?" → User: "yes" → Create PR 1
3. Present PR 2 (frontend) → "Create this PR?" → User: "yes" → Create PR 2
4. Final summary: 2 PRs created, noting PR 2 depends on PR 1

**Rationale:** Backend can be merged first, frontend depends on it

### Scenario 3: Related Features

**Changes:**

- 4 files for search functionality
- 3 files for filtering functionality
- Both use shared utility functions

**Initial proposal (2 PRs):**

1. `feature/search-implementation` - search files + utils
2. `feature/filter-implementation` - filter files + utils

**Workflow:**

1. Show overview: "2 PRs proposed"
2. Present PR 1 (search) → "Create this PR?" → User: "yes" → Create PR 1
3. Present PR 2 (filter) → "Create this PR?" → User: "yes" → Create PR 2
4. Final summary: 2 PRs created

**Alternative:** If tightly coupled, propose 1 combined PR from the start

## Summary Checklist

Before and during multi-PR creation:

**Initial Setup:**

- [ ] Analyzed all changed files
- [ ] Grouped changes logically
- [ ] Presented high-level overview to user

**For Each PR (Iterative):**

- [ ] Presented detailed PR proposal
- [ ] Asked: "Create this PR?"
- [ ] Waited for yes/no response
- [ ] If yes (approved):
  - [ ] Created feature branch
  - [ ] Staged only relevant files
  - [ ] Created logical commits
  - [ ] Ran linting
  - [ ] Fixed any errors
  - [ ] Pushed branch
  - [ ] Created PR via GitHub MCP
  - [ ] Reported PR creation success
  - [ ] Returned to main branch
- [ ] If no (skipped):
  - [ ] Moved to next PR
  - [ ] Noted skipped PR for summary

**Completion:**

- [ ] Processed all proposed PRs
- [ ] Provided final summary to user
- [ ] Listed any remaining uncommitted changes
