---
description: How cursor should create pull requests and commits for CMHO
alwaysApply: false
---

# CMHO Pull Request Creation Guide

## Overview

When creating pull requests, Cursor should follow this systematic approach to ensure consistency and completeness.

## Step 1: Commit Management

Before creating a PR, ensure all changes are properly committed following `commits.mdc` rules:

1. **Check git status** and stage any uncommitted changes
2. **Analyze the changes** and group related modifications together
3. **Create logical commits** - each commit should represent a cohesive set of changes:
   - Group related changes together (e.g., all changes for a specific feature or fix)
   - Separate unrelated changes into different commits
   - Frontend and backend changes for the same feature can be in one commit
   - Configuration changes should be separate from feature changes
4. **Use the format**: `--{TYPE}: {description}`
   - Use conventional commit types with "--" prefix
   - Examples:
     - `--feat: Add inventory management system`
     - `--fix: Resolve authentication token expiry issue`
     - `--refactor: Restructure payment components`
     - `--chore: Update dependencies and configuration`

## Step 2: PR Description Generation

Use the `.github/pull_request_template.md` structure and follow this format:

### Template Structure:

```markdown
# Pull Request

## :spiral_notepad: Description

[Brief explanation of what was implemented/changed]

## :ticket: GitHub Issue

[Link to GitHub issue or "N/A"]

## :link: Related PRs

[Links to related PRs or "N/A"]

## :pencil2: Changes

- [List of specific changes made]
- [One bullet point per significant change]
- [Focus on what was added/modified/removed]

## :camera_flash: Screenshots

[Screenshots or "N/A" if not applicable]
```

### PR Description Guidelines:

1. **Description Section:**

   - Single paragraph explaining the overall feature/fix
   - Focus on the user-facing impact or business value
   - Keep it concise but informative

2. **GitHub Issue:**

   - Provide link to GitHub issue if available
   - Format: `https://github.com/{owner}/{repo}/issues/{number}`
   - Use "N/A" if not applicable

3. **Related PRs:**

   - Include links to related PRs if any
   - Use "N/A" if none

4. **Changes Section:**

   - List concrete technical changes made
   - One bullet point per significant change
   - Avoid separating by frontend/backend/etc - keep flat list
   - Focus on what was implemented, not implementation details
   - Order from most important to least important changes

5. **Screenshots:**
   - Keep the heading even if no screenshots
   - Use "N/A" or remove content if not applicable

## Step 3: PR Title Generation

The PR title should be the branch name:

- Format: Use the current branch name as the PR title
- Examples:
  - Branch: `feature/add-inventory-system` → PR Title: `feature/add-inventory-system`
  - Branch: `fix/auth-token-expiry` → PR Title: `fix/auth-token-expiry`
  - Branch: `refactor/payment-components` → PR Title: `refactor/payment-components`

## Step 4: Linting

Before creating a PR, run linting to ensure code quality:

1. **Run lint command** from the root directory:

   ```bash
   pnpm lint
   ```

   This will lint both frontend and backend applications.

2. **Fix any linting errors** before proceeding with the PR

## Step 5: GitHub CLI Setup (If Needed)

Before creating a PR, ensure GitHub CLI is installed and authenticated:

1. **Check if GitHub CLI is installed:**
   ```bash
   gh --version
   ```

2. **If not installed, install it:**
   - macOS: `brew install gh`
   - Linux: Follow [GitHub CLI installation guide](https://github.com/cli/cli#installation)
   - Windows: `winget install --id GitHub.cli`

3. **Authenticate with GitHub:**
   ```bash
   gh auth login
   ```
   Follow the prompts to authenticate using your GitHub account.

4. **Verify authentication:**
   ```bash
   gh auth status
   ```

## Step 6: PR Creation

### Automated PR Creation Process

1. **Ensure branch is pushed** to remote (use `git push -u origin branch-name`)
2. **Get current branch name** to use as PR title
3. **Generate PR description** following the template format
4. **Create PR using GitHub CLI:**
   
   ```bash
   gh pr create --title "branch-name" --body "PR description" --base main
   ```
   
   The command will output the PR URL which you should extract.

5. **Parse the PR URL** from the command output

6. **If GitHub CLI fails:**
   - Check authentication status
   - Ensure branch is pushed to remote
   - Verify repository access
   
7. **Only as last resort:**
   - Fall back to providing clickable link for manual PR creation

## Step 7: Response Format

### After Successfully Creating PR (Automated):

```markdown
🎉 Pull Request Created Successfully!

🔗 [View Pull Request #[number]]([GitHub PR URL])

**Details:**
- **Title:** [PR Title]
- **Base branch:** [target branch]
- **Head branch:** [feature branch]
```

**Example:**

```markdown
🎉 Pull Request Created Successfully!

🔗 [View Pull Request #123](https://github.com/owner/repo/pull/123)

**Details:**
- **Title:** feature/add-inventory-system
- **Base branch:** main
- **Head branch:** feature/add-inventory-system
```

### If Manual Creation Required:

Only if automated creation is not possible:

```markdown
## Pull Request Ready to Create

🔗 [Click here to create the Pull Request](https://github.com/owner/repo/pull/new/feature/add-inventory-system)

**Branch:** feature/add-inventory-system

**Copy and paste this PR description:**

[Full PR description following template]
```

## Common Patterns

### Feature PRs:

- Type: `--feat`
- Focus on user-facing functionality
- Include UI/UX changes in description

### Bug Fix PRs:

- Type: `--fix`
- Explain what issue was resolved
- Include error scenarios that are now handled

### Maintenance PRs:

- Type: `--chore` or `--refactor`
- Explain why the changes were needed
- Focus on improvements made

## Example Workflow

1. User says "commit my changes and create a PR"
2. Run `git status` to check for changes
3. Analyze changes and group them logically
4. Stage and commit related changes together using commits.mdc format
5. Run `pnpm lint` to check code quality
6. Fix any linting errors if present
7. Push branch to remote
8. Analyze commits to understand what was implemented
9. Generate PR description following template
10. Check if GitHub CLI is available (`gh --version`)
11. Create PR using `gh pr create` command
12. Extract PR URL from the CLI output
13. Provide user with clickable markdown link to the created PR

## Important Notes

- Always follow the exact template structure
- Keep changes list flat (no frontend/backend separation)
- **Create logical commits** - group related changes together, separate unrelated changes
- Run `pnpm lint` before creating PR to ensure code quality
- **Always use GitHub CLI (`gh`) to create PRs automatically** - don't just provide compare links
- If GitHub CLI is not installed, install it first using `brew install gh` (macOS) or appropriate command
- Authenticate with `gh auth login` if not already authenticated
- **Always provide clickable markdown links** - never provide plain URLs
- Provide complete PR link and details to user
- Ensure all commits follow conventional commit format before creating PR
- Each commit should represent a cohesive, logical set of changes
