---
description: Automatically create logical commits and push changes
alwaysApply: false
---

# CMHO Auto Commit and Push Command

## Overview

This command automatically analyzes uncommitted changes, groups them into logical commits following conventional commit format, and pushes them to the remote repository.

## Step 1: Check Git Status

1. **Run `git status`** to identify all modified, deleted, and untracked files
2. **Verify we're on the correct branch** (usually `main` or a feature branch)
3. **Check if there are any uncommitted changes** - if none, inform user and exit

## Step 2: Analyze and Group Changes

Analyze all changes and group them logically using these strategies:

### Grouping Strategy

1. **Backend modules** - Group by module/domain:
   - Activity tracking module changes
   - Notifications module changes
   - Stock entries module changes
   - Inventory modules (categories, items, units)
   - Gallery, admins, suppliers modules
   - Middleware changes
   - Validators (group with their modules)

2. **Frontend hooks** - Group all infinite scroll hooks together

3. **Frontend components** - Group by component type:
   - New modals/components
   - Updated modals/components
   - Navigation components
   - Inventory components

4. **Frontend pages** - Group by module:
   - Inventory manager pages
   - Salary manager pages
   - Settings pages

5. **Frontend store** - Group all store slice updates together

6. **Frontend utilities** - Group types, utils, and shared components

7. **Documentation** - Separate commits for docs (TODO.md, README, etc.)

### Grouping Rules

- **Related changes together**: All files for a specific module/feature in one commit
- **Separate concerns**: Backend and frontend can be separate unless tightly coupled
- **New files vs. modified files**: Can be in same commit if related
- **Deleted files**: Include with the commit that replaces them
- **Configuration**: Separate from feature changes
- **Documentation**: Always separate commit

## Step 3: Create Logical Commits

For each logical group, create a commit following `commits.mdc` rules:

### Commit Format

```
--{TYPE}: {Description}
```

### Commit Types

- `--feat`: New features, new components, new functionality
- `--fix`: Bug fixes
- `--refactor`: Code restructuring, improvements without functionality changes
- `--chore`: Maintenance, dependencies, tooling
- `--docs`: Documentation changes
- `--style`: Code style/formatting (rarely used)
- `--perf`: Performance improvements
- `--test`: Test additions/updates

### Commit Message Guidelines

1. **Use appropriate type** based on the changes
2. **Keep descriptions concise** but descriptive
3. **Use present tense** ("Add" not "Added")
4. **Capitalize first letter** of description
5. **No period** at end
6. **Group related changes** - one commit per logical group

### Example Commit Messages

- `--refactor: Refactor activity tracking module and improve validation`
- `--feat: Add infinite scroll hooks for pagination`
- `--refactor: Replace UpdateStockModal with AddStockModal and ReduceStockModal`
- `--feat: Add BorderedOptions component`
- `--refactor: Update inventory components and modals`
- `--refactor: Update store slices for activity, gallery, inventory and notifications`
- `--docs: Update TODO`

## Step 4: Commit Process

For each logical group:

1. **Stage the files** for this group:
   ```bash
   git add path/to/file1.ts path/to/file2.tsx ...
   ```

2. **Create the commit**:
   ```bash
   git commit -m "--{TYPE}: {Description}"
   ```

3. **Continue** with next group until all changes are committed

## Step 5: Clean Up

After all commits are created:

1. **Remove any leftover files** that were deleted in commits but still exist on disk
2. **Verify git status** is clean
3. **Check commit log** to confirm all commits were created

## Step 6: Push to Remote

1. **Push all commits** to remote:
   ```bash
   git push
   ```

2. **If push fails** (e.g., branch protection):
   - Inform user about the issue
   - Provide the commits that were created
   - Suggest next steps (create PR, etc.)

## Step 7: Report Results

Provide a summary to the user:

```markdown
✅ Successfully created [N] logical commits and pushed to remote

**Commits created:**
1. `--{TYPE}: {Description}`
2. `--{TYPE}: {Description}`
3. `--{TYPE}: {Description}`
[... continue for all commits ...]

**Status:** All changes committed and pushed to origin/[branch]
```

## Implementation Logic

### File Grouping Patterns

1. **Backend Module Pattern:**
   - Files in `apps/backend/src/modules/{module-name}/` → Group together
   - Include validators, controllers, services, models, routers, types

2. **Frontend Component Pattern:**
   - New components → `--feat: Add {ComponentName} component`
   - Updated components → `--refactor: Update {component type} components`
   - Deleted components → Include with replacement

3. **Frontend Hooks Pattern:**
   - All hooks in `apps/frontend/src/hooks/` → Group by functionality
   - Infinite scroll hooks → One commit

4. **Frontend Pages Pattern:**
   - Group by module/feature area
   - Inventory pages together
   - Settings pages together

5. **Store Pattern:**
   - All slice updates → One commit

### Commit Order

1. Backend changes first (foundation)
2. Frontend hooks/utilities (dependencies)
3. Frontend components (building blocks)
4. Frontend pages (consumers)
5. Store updates (state management)
6. Documentation last

## Error Handling

### If Commit Fails

- Check for merge conflicts
- Verify file paths are correct
- Check git status for issues
- Inform user and ask for guidance

### If Push Fails

- Check branch protection rules
- Verify remote access
- Check if branch exists on remote
- Suggest creating PR if needed

### If Files Are Left Uncommitted

- List remaining files
- Ask user if they want to commit them separately
- Or suggest they may be intentionally uncommitted

## Example Workflow

1. User says "make enough logical commits and push"
2. Run `git status` → Find 50+ changed files
3. Analyze and group:
   - Backend activity tracking (8 files) → `--refactor: Refactor activity tracking module`
   - Backend notifications (3 files) → `--feat: Add validators and improve notifications module`
   - Frontend hooks (6 files) → `--feat: Add infinite scroll hooks for pagination`
   - Frontend modals (3 files) → `--refactor: Replace UpdateStockModal with AddStockModal and ReduceStockModal`
   - ... continue grouping ...
4. Create commits one by one
5. Verify all changes committed
6. Push to remote
7. Report success with commit list

## Important Notes

- **Always follow conventional commit format** with `--` prefix
- **Group related changes** - don't create too many small commits
- **Don't create too few large commits** - balance is key
- **Separate concerns** - backend, frontend, docs should be separate when possible
- **Include deleted files** with their replacements
- **Clean up leftover files** after commits
- **Verify before pushing** - check git status and log
- **Inform user of results** - show what was committed and pushed

