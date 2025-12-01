# Linting and Code Formatting Setup

This repository uses centralized linting and formatting configurations to ensure consistent code quality across all contributors.

## Setup

### 1. Install Dependencies

After cloning the repository, install dependencies:

```bash
pnpm install
```

This will install all linting and formatting tools (ESLint, Prettier) at both the root and workspace levels.

### 2. VS Code Setup (Recommended)

If you're using VS Code, the repository includes recommended extensions and settings:

- **Prettier** - Code formatter
- **ESLint** - JavaScript/TypeScript linter
- **EditorConfig** - Editor configuration

When you open the workspace, VS Code will prompt you to install the recommended extensions. Alternatively, you can install them manually:

```bash
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension editorconfig.editorconfig
```

The workspace settings (`.vscode/settings.json`) are configured to:
- Format code on save using Prettier
- Auto-fix ESLint issues on save
- Use consistent editor settings (2 spaces, LF line endings, etc.)

### 3. Other Editors

For other editors, ensure you have:
- **Prettier** installed and configured to use `.prettierrc`
- **ESLint** installed and configured to use `eslint.config.js`
- **EditorConfig** plugin to respect `.editorconfig`

## Available Scripts

### Root Level

```bash
# Lint all workspaces
pnpm lint

# Lint and auto-fix all workspaces
pnpm lint:fix

# Format all files
pnpm format

# Check formatting without making changes
pnpm format:check
```

### Workspace Level (Frontend/Backend)

```bash
# Lint the workspace
pnpm --filter @cmho/salary lint        # Frontend
pnpm --filter @cmho/backend lint       # Backend

# Lint and auto-fix
pnpm --filter @cmho/salary lint:fix    # Frontend
pnpm --filter @cmho/backend lint:fix   # Backend

# Format files
pnpm --filter @cmho/salary format      # Frontend
pnpm --filter @cmho/backend format     # Backend
```

Or navigate to the workspace directory:

```bash
cd apps/frontend
pnpm lint
pnpm lint:fix
pnpm format
```

## Configuration Files

### ESLint

- **Root**: `eslint.config.js` - Base configuration for the monorepo
- **Frontend**: `apps/frontend/eslint.config.js` - React-specific rules
- **Backend**: `apps/backend/eslint.config.js` - Node.js-specific rules

### Prettier

- **Root**: `.prettierrc` - Shared formatting rules
- **Ignore**: `.prettierignore` - Files to exclude from formatting

### EditorConfig

- **Root**: `.editorconfig` - Editor settings (indentation, line endings, etc.)

## Pre-commit Hooks (Optional)

Consider setting up pre-commit hooks using tools like:
- [Husky](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/lint-staged/lint-staged)

This ensures code is linted and formatted before commits.

## CI/CD Integration

The linting setup is designed to work seamlessly with CI/CD pipelines. You can add these checks to your CI:

```yaml
# Example GitHub Actions
- name: Lint
  run: pnpm lint

- name: Check Formatting
  run: pnpm format:check
```

## Troubleshooting

### ESLint not working

1. Ensure dependencies are installed: `pnpm install`
2. Check that ESLint is installed in the workspace: `pnpm list eslint`
3. Restart your editor/IDE

### Prettier not formatting

1. Ensure Prettier extension is installed in VS Code
2. Check that Prettier is set as the default formatter
3. Verify `.prettierrc` exists in the root

### Format on save not working

1. Check VS Code settings (`.vscode/settings.json`)
2. Ensure Prettier extension is installed
3. Verify `editor.formatOnSave` is set to `true`

