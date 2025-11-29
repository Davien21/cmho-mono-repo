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

## Step 5: PR Creation

Use GitHub MCP to create the pull request:

1. **Check branch status** - ensure branch is pushed to remote
2. **Get current branch name** to use as PR title
3. **Create PR** with:

   - `title`: Current branch name
   - `head`: Current feature branch name
   - `base`: Target branch (usually "main")
   - `body`: Generated description following template

4. **Provide user with:**
   - Direct link to the created PR
   - PR number and ID
   - Confirmation of successful creation

## Step 6: Response Format

After creating the PR, provide this information with a clickable markdown link:

```markdown
🎉 Pull Request Created Successfully!

🔗 [View Pull Request #[number]]([GitHub PR URL])

**Details:**

- **Title:** [PR Title]
- **Base branch:** [target branch]
- **Head branch:** [feature branch]
```

Example output:

```markdown
🎉 Pull Request Created Successfully!

🔗 [View Pull Request #123](https://github.com/owner/repo/pull/123)

**Details:**

- **Title:** feature/add-inventory-system
- **Base branch:** main
- **Head branch:** feature/add-inventory-system
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
7. Analyze commits to understand what was implemented
8. Generate PR description following template
9. Create PR with GitHub MCP (if available) or provide instructions
10. Provide user with link and details

## Important Notes

- Always follow the exact template structure
- Keep changes list flat (no frontend/backend separation)
- **Create logical commits** - group related changes together, separate unrelated changes
- Run `pnpm lint` before creating PR to ensure code quality
- Use GitHub MCP functions when available
- Provide complete PR link and details to user
- Ensure all commits follow conventional commit format before creating PR
- Each commit should represent a cohesive, logical set of changes
