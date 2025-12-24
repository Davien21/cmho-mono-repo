# Onboarding Guide

Welcome to the CMHO Monorepo! This guide will help you get set up to run the application locally and start contributing, even if you're new to monorepos, pnpm, or backend development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Understanding the Project Structure](#understanding-the-project-structure)
3. [Installing Prerequisites](#installing-prerequisites)
4. [Setting Up the Project](#setting-up-the-project)
5. [Configuring Environment Variables](#configuring-environment-variables)
6. [Setting Up MongoDB](#setting-up-mongodb)
7. [Running the Application](#running-the-application)
8. [Making Your First Contribution](#making-your-first-contribution)
9. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
10. [Useful Commands Reference](#useful-commands-reference)

---

## Prerequisites

Before you begin, you'll need:

- **Windows 10 or 11** (this guide is Windows-specific)
- **Git** - for version control
- **Node.js** - version 22 or higher (the backend requires Node 22)
- **A code editor** - We recommend [Cursor](https://cursor.sh/)
- **A GitHub account** - for contributing code

---

## Understanding the Project Structure

### What is a Monorepo?

A **monorepo** (monolithic repository) is a single repository that contains multiple projects or applications. In our case, we have:

```
cmho-mono-repo/
├── apps/
│   ├── backend/     # The API server (Node.js/Express)
│   └── frontend/    # The web application (React)
├── package.json     # Root package.json for workspace management
└── pnpm-workspace.yaml  # Defines the workspace structure
```

**Benefits:**

- All code in one place
- Shared dependencies
- Easier to make changes across frontend and backend
- Single source of truth

### What is pnpm?

**pnpm** is a fast, disk space efficient package manager for Node.js. Think of it like npm or yarn, but better:

- **Faster** - Uses hard links to save disk space
- **Stricter** - Prevents phantom dependencies
- **Efficient** - Shares packages across projects

**Key pnpm commands:**

- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add a package to a specific app
- `pnpm --filter <app> <command>` - Run a command in a specific app

---

## Installing Prerequisites

### 1. Install Git

1. Download Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer with default settings
3. Verify installation by opening PowerShell or Command Prompt and running:
   ```bash
   git --version
   ```

### 2. Install Node.js

1. Download Node.js v22 or higher from [https://nodejs.org/](https://nodejs.org/)
   - Choose the LTS (Long Term Support) version
   - Make sure it's version 22 or higher (check the version number)
2. Run the installer
3. Verify installation:
   ```bash
   node --version
   ```
   Should show v22.x.x or higher

### 3. Install pnpm

pnpm is not included with Node.js, so you need to install it separately.

**Option 1: Using npm (recommended for beginners)**

```bash
npm install -g pnpm
```

**Option 2: Using PowerShell (Windows)**

```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**Option 3: Using standalone script**
Download and run the installer from [https://pnpm.io/installation](https://pnpm.io/installation)

Verify installation:

```bash
pnpm --version
```

Should show 10.8.0 or higher

### 4. Install MongoDB

Since you're not a backend developer, we'll use the simplest setup possible.

**Option 1: MongoDB Community Server (Local Installation)**

1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Select Windows as your platform
   - Choose the MSI installer
2. Run the installer:
   - Choose "Complete" installation
   - **Important:** Check "Install MongoDB as a Service" and "Run service as Network Service user"
   - Check "Install MongoDB Compass" (optional, but helpful)
   - Click "Install"
3. MongoDB will start automatically as a Windows service
4. Verify it's running:
   - Open PowerShell and run:
     ```bash
     mongosh
     ```
   - If you see a MongoDB shell prompt, you're good! Type `exit` to leave

**Option 2: MongoDB Atlas (Cloud - No Local Installation)**

If you prefer not to install MongoDB locally, you can use MongoDB Atlas (free tier available):

1. Sign up at [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a free cluster
3. Create a database user
4. Get your connection string (we'll use this in environment variables)

**Note:** For local development, we'll use `mongodb://localhost:27017/cmho` by default.

---

## Setting Up the Project

### 1. Clone the Repository

1. Open PowerShell or Command Prompt
2. Navigate to where you want the project (e.g., `cd Documents\projects`)
3. Clone the repository:
   ```bash
   git clone https://github.com/Davien21/cmho-mono-repo.git
   ```
4. Navigate into the project:
   ```bash
   cd cmho-mono-repo
   ```

### 2. Install Dependencies

From the root of the project, run:

```bash
pnpm install
```

This will:

- Install all dependencies for the root workspace
- Install dependencies for the backend
- Install dependencies for the frontend
- Set up the workspace structure

**This may take a few minutes the first time.** You'll see progress for each package being installed.

### 3. Verify Installation

Check that everything installed correctly:

```bash
pnpm --filter @cmho/backend typecheck
pnpm --filter @cmho/salary typecheck
```

If both commands complete without errors, you're good to go!

---

## Configuring Environment Variables

The application needs environment variables to run. These are configuration values that change between development and production.

### Backend Environment Variables

1. Navigate to the backend directory:

   ```bash
   cd apps/backend
   ```

2. Create a `.env` file (this file is gitignored, so it won't be committed):

   ```bash
   # In PowerShell
   New-Item .env

   # Or create it manually in your code editor
   ```

3. Add the following content to `apps/backend/.env`:

   ```env
   # Application
   NODE_ENV=development
   PORT=3001
   APP_NAME=cmho

   # Database (use local MongoDB)
   DATABASE_URL=mongodb://localhost:27017/cmho

   # JWT Secret (generate a random string - you can use any long random string)
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

   # Cloudinary (for image uploads)
   # Get these from https://cloudinary.com/ (free tier available)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Client URL (where the frontend runs)
   CLIENT_URL=http://localhost:3000

   # Paystack (for payments - get from https://paystack.com/)
   PAYSTACK_SECRET_KEY=your-paystack-secret-key

   # Platform Password (for admin operations)
   PLATFORM_PASSWORD=your-platform-password
   ```

   **Important Notes:**

   - For **local development**, you can use placeholder values for Cloudinary and Paystack if you're not testing those features
   - The `DATABASE_URL` should point to your local MongoDB: `mongodb://localhost:27017/cmho`
   - If using MongoDB Atlas, replace `DATABASE_URL` with your Atlas connection string

### Frontend Environment Variables

1. Navigate to the frontend directory:

   ```bash
   cd apps/frontend
   ```

2. Create a `.env.local` file:

   ```bash
   # In PowerShell
   New-Item .env.local
   ```

3. Add the following content to `apps/frontend/.env.local`:

   ```env
   # API Base URL - points to your local backend
   PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
   ```

   **Note:** The backend runs on port 3001 by default, and the frontend runs on port 3000.

---

## Setting Up MongoDB

### If You Installed MongoDB Locally

MongoDB should be running as a Windows service. To verify:

1. Open **Services** (press `Win + R`, type `services.msc`, press Enter)
2. Look for "MongoDB" service
3. It should be "Running"

If it's not running:

- Right-click on "MongoDB" → Start

### If You're Using MongoDB Atlas

1. Make sure you've created a cluster
2. Create a database user (Database Access → Add New Database User)
3. Whititelist your IP address (Network Access → Add IP Address → Add Current IP Address)
4. Get your connection string (Connect → Connect your application)
5. Update `DATABASE_URL` in `apps/backend/.env` with your Atlas connection string

### Creating the Database

The database will be created automatically when you first run the backend. The default database name is `cmho`.

### Seeding the Database (Optional)

If you want to populate the database with sample data:

```bash
# From the root directory
pnpm --filter @cmho/backend seed
```

This will create initial data like admin users, inventory items, etc.

---

## Database Backups

The application includes an **automated daily backup system** that stores database backups to a private GitHub repository.

### 🎯 Features

- ✅ **Automated daily backups** at 2:00 AM UTC using node-cron
- ✅ **Keeps only 2 most recent backups** (auto-deletes older)
- ✅ **Named format**: `cmho-YYYY-MM-DD.zip`
- ✅ **Stored in private repo**: https://github.com/Davien21/cmho-backups
- ✅ **Manual trigger** via API endpoint
- ✅ **100 MB file limit** (GitHub's file size limit)
- ✅ **Pure Node.js solution** - Uses Mongoose to export collections to JSON
- ✅ **No external tools required** - Works on any hosting platform

### How It Works

The backup system:
1. Connects to MongoDB using Mongoose
2. Exports all collections to JSON files
3. Creates a metadata file with backup information
4. Zips everything using the `archiver` package
5. Uploads to GitHub via API
6. Automatically deletes old backups (keeps 2 most recent)

### Setup (Production Only)

Backups run automatically in production or when `ENABLE_BACKUPS=true` is set.

**Step 1: Create GitHub Token**

Go to https://github.com/settings/tokens and create a new token:
- Token type: **Classic**
- Scopes: ✅ **`repo`** (Full control of private repositories)
- Copy the token immediately

**Step 2: Configure Environment Variables**

Add these to your hosting platform (Railway, Heroku, etc.):

```bash
ENABLE_BACKUPS=true
GITHUB_BACKUP_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_BACKUP_REPO=Davien21/cmho-backups
```

### API Endpoints

**Check Status (includes list of available backups):**
```bash
curl https://api.cmho.xyz/api/v1/backups/status
```

Response includes:
- Configuration status
- Backup schedule
- List of all available backups with sizes and download URLs
- Total backup count

**Trigger Manual Backup:**
```bash
curl -X POST https://api.cmho.xyz/api/v1/backups/trigger
```

### Accessing Backups

**Option 1: GitHub Web Interface**
- Go to https://github.com/Davien21/cmho-backups
- Click on any `cmho-*.zip` file
- Download it

**Option 2: Via API (using status endpoint)**
- Get the list of backups from `/api/v1/backups/status`
- Use the `downloadUrl` from the response

**Option 3: Git Clone**
```bash
git clone https://github.com/Davien21/cmho-backups.git
cd cmho-backups
ls -lh  # View all backups
```

### Restoring from Backup

Backups are in JSON format (not binary). To restore:

```bash
# 1. Download and unzip
unzip cmho-2024-12-24.zip
cd cmho-2024-12-24

# 2. Each collection is a separate JSON file
# Import using mongoimport for each collection
mongoimport --uri="your-mongodb-uri" \
  --collection=collectionName \
  --file=collectionName.json \
  --jsonArray \
  --drop

# Or create a restore script to import all collections
```

The backup includes a `metadata.json` file with:
- Backup date and time
- Database name
- List of all collections
- Total collection count

**Note:** You don't need to configure backups for local development - this is for production only.

---

## Running the Application

### Option 1: Run Everything from Root (Recommended)

From the root directory, run:

```bash
pnpm dev
```

This will start both the backend and frontend simultaneously using Turbo.

You should see:

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`

### Option 2: Run Separately

**Terminal 1 - Backend:**

```bash
cd apps/backend
pnpm dev
```

**Terminal 2 - Frontend:**

```bash
cd apps/frontend
pnpm dev
```

### Accessing the Application

1. Open your browser
2. Navigate to `http://localhost:3000`
3. You should see the application!

### Verifying Backend is Running

1. Open `http://localhost:3001/api/v1` in your browser
2. You should see a response (or an API endpoint list)

---

## Making Your First Contribution

### 1. Create a Branch

Never commit directly to `main`. Always create a branch:

```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create a new branch for your feature
git checkout -b feat/your-feature-name

# Example:
git checkout -b feat/add-user-profile
```

### 2. Make Your Changes

Edit files, add features, fix bugs - do your work!

### 3. Test Your Changes

Make sure everything still works:

```bash
# Run type checking
pnpm typecheck

# Run the app and test manually
pnpm dev
```

### 4. Stage and Commit Your Changes

```bash
# See what files changed
git status

# Add specific files
git add path/to/file.tsx

# Or add all changes
git add .

# Commit with proper format (see Commit Rules below)
git commit -m "--feat: Add user profile page"
```

### 5. Push Your Branch

```bash
git push origin feat/your-feature-name
```

### 6. Create a Pull Request

1. Go to the repository on GitHub
2. You'll see a banner suggesting to create a PR for your branch
3. Click "Compare & pull request"
4. Fill out the PR description
5. Submit the PR

---

## Commit Rules

**Important:** All commits must follow this format:

```
--{TYPE}: {Description}
```

### Commit Types:

- `--feat`: New feature
- `--fix`: Bug fix
- `--chore`: Maintenance tasks, dependencies, tooling
- `--refactor`: Code restructuring without functionality changes
- `--docs`: Documentation changes
- `--style`: Code style/formatting changes
- `--test`: Adding or updating tests
- `--perf`: Performance improvements
- `--ci`: CI/CD related changes

### Rules:

1. **Always prefix with double hyphen** (`--`)
2. Use present tense ("Add" not "Added")
3. Capitalize first letter
4. No period at the end

### Examples:

✅ **Good:**

- `--feat: Add user profile page`
- `--fix: Resolve login authentication issue`
- `--refactor: Improve inventory page header layout`
- `--docs: Update onboarding guide`

❌ **Bad:**

- `feat: Add user profile` (missing `--`)
- `--feat: added user profile` (wrong tense, lowercase)
- `--feat: Add user profile.` (has period)

---

## Common Issues and Troubleshooting

### Issue: "pnpm: command not found"

**Solution:**

- Make sure pnpm is installed: `pnpm --version`
- If not installed, run: `npm install -g pnpm`
- Close and reopen your terminal

### Issue: "Cannot find module" errors

**Solution:**

```bash
# Delete node_modules and reinstall
rm -r node_modules
rm -r apps/backend/node_modules
rm -r apps/frontend/node_modules
pnpm install
```

### Issue: MongoDB connection error

**Symptoms:** Backend fails to start with "MongoServerError" or "ECONNREFUSED"

**Solutions:**

1. **If using local MongoDB:**

   - Check if MongoDB service is running (Services app)
   - Verify MongoDB is installed correctly
   - Try connecting manually: `mongosh`

2. **If using MongoDB Atlas:**
   - Check your connection string in `.env`
   - Verify your IP is whitelisted
   - Check database user credentials

### Issue: Port already in use

**Symptoms:** "EADDRINUSE: address already in use :::3001"

**Solution:**

1. Find what's using the port:
   ```bash
   # PowerShell
   netstat -ano | findstr :3001
   ```
2. Kill the process (replace PID with the number from step 1):
   ```bash
   taskkill /PID <PID> /F
   ```
3. Or change the port in `apps/backend/.env`:
   ```env
   PORT=3002
   ```
   And update frontend `.env.local`:
   ```env
   PUBLIC_API_BASE_URL=http://localhost:3002/api/v1
   ```

### Issue: Environment variables not loading

**Solution:**

- Make sure `.env` files are in the correct locations:
  - `apps/backend/.env`
  - `apps/frontend/.env.local`
- Restart your development server
- Check for typos in variable names

### Issue: TypeScript errors

**Solution:**

```bash
# Run type checking to see all errors
pnpm typecheck

# Fix the errors or ask for help
```

### Issue: "Node version mismatch"

**Symptoms:** Backend requires Node 22 but you have a different version

**Solution:**

1. Install Node.js 22 or higher
2. Verify: `node --version`
3. You might need to restart your terminal/editor

---

## Useful Commands Reference

### Root Level Commands

```bash
# Install all dependencies
pnpm install

# Run both frontend and backend in development mode
pnpm dev

# Run type checking for all apps
pnpm typecheck

# Run linting for all apps
pnpm lint

# Build all apps
pnpm build
```

### Backend-Specific Commands

```bash
# Navigate to backend
cd apps/backend

# Run backend in development mode
pnpm dev

# Run backend (production mode)
pnpm start

# Seed the database
pnpm seed

# Type check
pnpm typecheck
```

### Frontend-Specific Commands

```bash
# Navigate to frontend
cd apps/frontend

# Run frontend in development mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint
pnpm lint
```

### Git Commands

```bash
# Check status
git status

# See what changed
git diff

# Add files
git add .

# Commit
git commit -m "--feat: Your message"

# Push
git push origin branch-name

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feat/your-feature
```

### pnpm Workspace Commands

```bash
# Run command in specific app
pnpm --filter @cmho/backend <command>
pnpm --filter @cmho/salary <command>

# Add dependency to specific app
pnpm --filter @cmho/backend add <package>
pnpm --filter @cmho/salary add <package>

# Add dev dependency
pnpm --filter @cmho/backend add -D <package>
```

---

## Getting Help

If you run into issues:

1. **Check this guide first** - Most common issues are covered
2. **Check the error message** - It often tells you what's wrong
3. **Ask the team** - Don't hesitate to reach out on Slack/Discord/Teams
4. **Check GitHub Issues** - Someone might have had the same problem

---

## Next Steps

Once you're set up:

1. ✅ Explore the codebase
2. ✅ Read the code to understand the structure
3. ✅ Look for "good first issue" labels on GitHub
4. ✅ Start with small changes
5. ✅ Ask questions!

**Welcome to the team! 🎉**
