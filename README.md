# Research Abstract Classification & Trend Discovery Platform
> **B.Tech Artificial Intelligence & Data Science Mini-Project**  
> *Tagline: Transform Research Papers into Intelligent Insights.*

A full-stack AI research intelligence application that performs scientific NLP preprocessing, TF-IDF vectorization, supervised machine learning classification (Naive Bayes, Logistic Regression, Linear SVM), unsupervised topic discovery (K-Means++), temporal trend analysis with transparent emerging-topic scoring, interactive knowledge graphs, and multi-format reports (CSV, JSON, printable PDF).

Backed by a **real persistent SQLite 3.x relational database engine** (`/data/research_intelligence.sqlite`).

---

## 1. How to Push the Code to GitHub

### Step A: Initialize Git in the Project Root
Open your terminal in the project root folder:

```bash
# 1. Initialize git repository
git init

# 2. Add all files (respects .gitignore)
git add .

# 3. Create the initial commit
git commit -m "feat: complete research abstract classification and trend discovery platform with SQLite"

# 4. Rename default branch to main
git branch -M main
```

### Step B: Create a New Repository on GitHub
1. Go to [github.com](https://github.com/) and sign in.
2. Click the **"+"** icon in the top right and select **New repository**.
3. Name your repository (e.g., `research-abstract-intelligence` or `ai-trend-discovery`).
4. Choose **Public** (or **Private**).
5. **Do NOT** check "Add a README file" (we already have a complete one).
6. Click **Create repository**.

### Step C: Push Your Code to GitHub
Copy the commands shown on your new GitHub repo page:

```bash
# Link your local folder to GitHub (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push code to GitHub
git push -u origin main
```

---

## 2. Automated GitHub Actions CI/CD

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/ci.yml`.  
Whenever you push to `main`, GitHub automatically:
1. Sets up Node.js 20.
2. Runs type and lint checks (`npm run lint`).
3. Executes the full 24-test suite (`npx tsx tests/pipeline.test.ts`).
4. Verifies the production build (`npm run build`).

You will see a green checkmark (`✓`) on your GitHub repository commits!

---

## 3. How to Deploy (Free Cloud Hosting Options)

Because this is a full-stack application with an Express REST API and a persistent SQLite database, you can deploy it directly from GitHub using any of the following platforms.

---

### Option A: Deploy to Render (Recommended - Free & Easiest)

[Render.com](https://render.com/) offers free Web Service hosting directly connected to your GitHub repo.

1. Go to [render.com](https://render.com/) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository (`research-abstract-intelligence`).
4. Configure the service:
   - **Name:** `research-intelligence-platform`
   - **Region:** Any (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `GEMINI_API_KEY` = *(Optional: your Gemini API key)*
6. Click **Deploy Web Service**.
7. In ~2 minutes, your project will be live at `https://your-app-name.onrender.com`!

---

### Option B: Deploy to Railway

[Railway.app](https://railway.app/) provides seamless GitHub deployment with zero configuration.

1. Go to [railway.app](https://railway.app/) and login with GitHub.
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the `Dockerfile` or `package.json` and deploy it.
5. In your project settings, click **Generate Domain** to get a public URL (e.g. `https://your-project.up.railway.app`).

---

### Option C: Deploy with Docker Container

A multi-stage `Dockerfile` is included in the project root. You can build and run it on any server (VPS, AWS, DigitalOcean, Google Cloud Run):

```bash
# Build Docker image
docker build -t research-intelligence-app .

# Run container on port 3000
docker run -p 3000:3000 research-intelligence-app
```

Then open `http://localhost:3000`.

---

## 4. How to Run Locally in VS Code

**Requirements:** Node.js 20+ and npm. The backend persists datasets and account records in the SQLite database under `data/`; keep that folder writable. The benchmark corpus is synthetic demo data, not a live academic database. Real papers are added when you import your own CSV/PDF or use supported external discovery integrations.

1. Copy `.env.example` to `.env`. Set a long random `JWT_SECRET` for production; do not commit `.env`. Add `GEMINI_API_KEY` only if you want Gemini-powered summaries.
2. Open the project folder in VS Code and run:

```bash
npm install
npm run dev
```

3. Open `http://localhost:3000`. The API health check is `http://localhost:3000/api/health`.

> Security note: the raw SQL inspector endpoint is restricted to authenticated administrators. Authentication requests are rate-limited, and production session signing requires `JWT_SECRET`. For public deployment, use HTTPS and a persistent disk for the SQLite file.


1. Open VS Code: **File > Open Folder...** and select this directory.
2. Open terminal: ``Ctrl + ` `` (or `Cmd + ` ` on Mac).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open browser at: `http://localhost:3000`.
6. Or press **`F5`** in VS Code to run in debug mode.

---

## 5. Verification & Testing

To run all 24 automated unit and integration tests (CSV/JSON, NLP, TF-IDF, Naive Bayes, Logistic Regression, Linear SVM, K-Means, Trend Formulas):

```bash
npx tsx tests/pipeline.test.ts
```

Output:
```text
========================================
Test Execution Finished: 24 Passed, 0 Failed
========================================
```
