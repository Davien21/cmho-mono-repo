---
description: How cursor should create pull requests and commits for CMHO
alwaysApply: false
---

# CMHO Pull Request Creation Guide

## Overview

When creating pull requests, Cursor should follow this systematic approach to ensure consistency and completeness.

## Step 0: Branch Setup

Before committing changes or creating a PR, always work from a fresh branch off `main`:

1. **Switch to `main` and pull latest changes**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Decide on a branch name**

   - Base it on the type of work and a short description.
   - Examples:
     - `feature/add-inventory-system`
     - `fix/auth-token-expiry`
     - `refactor/payment-components`

3. **Create and switch to the new branch**

   ```bash
   git checkout -b feature/add-inventory-system
   ```

4. Make your changes on this branch, then continue with **Step 1: Commit Management**.

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

   - **IMPORTANT: Check the user's prompt for issue links first**
   - If an issue link is provided in the prompt (e.g., `https://github.com/{owner}/{repo}/issues/{number}` or `#123`), use it in the PR description
   - Extract issue links from various formats:
     - Full URL: `https://github.com/owner/repo/issues/123`
     - Issue reference: `#123`
     - Text mention: "closes #123", "fixes #123", "resolves #123"
   - If issue link is found in prompt, use the full URL format: `https://github.com/{owner}/{repo}/issues/{number}`
   - If no issue link is provided in prompt, use "N/A"

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

## Step 5: PR Creation with GitHub MCP

### Automated PR Creation Process

Use the GitHub MCP tools to create the pull request automatically:

1. **Ensure branch is pushed** to remote (use `git push -u origin branch-name`)

2. **Extract repository information** from the git remote:

   - Parse `owner` and `repo` from the remote URL
   - Example: `https://github.com/owner/repo.git` → owner: `owner`, repo: `repo`

3. **Get current branch name** to use as PR title

4. **Generate PR description** following the template format

5. **Create PR using GitHub MCP:**

   - Use the `mcp_github_create_pull_request` tool
   - Parameters:
     - `owner`: Repository owner (from git remote)
     - `repo`: Repository name (from git remote)
     - `title`: Current branch name
     - `head`: Current feature branch name
     - `base`: Target branch (usually "main")
     - `body`: Generated PR description following template

6. **Extract PR information** from the MCP response:

   - PR number
   - PR URL
   - PR ID

7. **If MCP creation fails:**
   - Check if branch is pushed to remote
   - Verify repository access
   - Ensure user has write permissions to the repository

## Step 6: Response Format

### After Successfully Creating PR with MCP:

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

1. User says "commit my changes and create a PR" (optionally with issue link)
2. **Check user's prompt for any GitHub issue links** (e.g., `#123`, `https://github.com/owner/repo/issues/123`, or "closes #123")
3. Switch to `main` and pull latest changes (`git checkout main`, then `git pull origin main`)
4. Decide on a descriptive feature branch name (e.g., `feature/add-inventory-system`, `fix/auth-token-expiry`)
5. Create and switch to the new branch with `git checkout -b <branch-name>`
6. Run `git status` to check for changes
7. Analyze changes and group them logically
8. Stage and commit related changes together using commits.mdc format
9. Run `pnpm lint` to check code quality
10. Fix any linting errors if present
11. Push branch to remote (e.g., `git push -u origin <branch-name>`)
12. Extract repository owner and name from git remote URL
13. Analyze commits to understand what was implemented
14. Generate PR description following template, **using the issue link from prompt if provided**
15. Use `mcp_github_create_pull_request` to create the PR
16. Extract PR URL and number from the MCP response
17. Provide user with clickable markdown link to the created PR

## Important Notes

- Always follow the exact template structure
- Keep changes list flat (no frontend/backend separation)
- **Create logical commits** - group related changes together, separate unrelated changes
- Run `pnpm lint` before creating PR to ensure code quality
- **Always use GitHub MCP (`mcp_github_create_pull_request`) to create PRs automatically** - don't just provide compare links
- Extract repository owner and name from git remote URL
- **Always provide clickable markdown links** - never provide plain URLs
- Provide complete PR link and details to user
- Ensure all commits follow conventional commit format before creating PR
- Each commit should represent a cohesive, logical set of changes
- **Check user's prompt for issue links** - if provided, extract and use them in the PR description's GitHub Issue section
