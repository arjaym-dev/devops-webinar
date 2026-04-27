# Webinar 1 — Docker + CI/CD with GitHub Actions

**Duration:** 40–60 minutes  
**Level:** Beginner–Intermediate  
**Demo project:** `api/` (Node.js + TypeScript) and `web/` (React + Vite)

---

## Agenda

| Time        | Section                                                     |
| ----------- | ----------------------------------------------------------- |
| 0:00 – 0:05 | Introduction — What is DevOps?                              |
| 0:05 – 0:30 | Docker — Core concepts and hands-on commands                |
| 0:30 – 0:55 | CI/CD — Automate builds and deployments with GitHub Actions |
| 0:55 – 1:00 | Q&A and wrap-up                                             |

---

## Section 1 — Introduction (5 min)

### What is DevOps?

DevOps bridges the gap between **development** (writing code) and **operations** (running code in production). The goal is to ship software faster, more reliably, and with less manual work.

**Three pillars we cover in this series:**

1. **Containerization** — package your app so it runs the same everywhere (Docker)
2. **Automation** — test and deploy automatically on every code push (CI/CD)
3. **Cloud Infrastructure** — run your containers on real servers (AWS — covered in Part 2)

### This Session's Project

We will use two real apps already in this repository:

- `api/` — A Node.js + TypeScript REST API with health-check endpoints
- `web/` — A React + Vite frontend

Both have `Dockerfile`s ready to go.

---

## Section 2 — Docker (25 min)

### What is Docker?

Docker lets you package your application and all its dependencies into a **container** — a lightweight, portable unit that runs the same on any machine.

Key terms:

- **Image** — the blueprint (built from a `Dockerfile`)
- **Container** — a running instance of an image
- **Registry** — a remote store for images (Docker Hub, GHCR, ECR)

---

### 2.1 — Build a Docker Image

A `Dockerfile` describes how to build the image. Let's build the `api` image.

```bash
# Navigate to the api directory
cd api

# Build the image and tag it
docker build -t api:latest .
```

> **What's happening?** Docker reads `Dockerfile`, installs dependencies, compiles TypeScript, and produces a production image.

---

### 2.2 — Run a Container

```bash
# Run the container in detached mode (-d), expose port 3000
docker run -d -p 3000:3000 --name api api:latest
```

Test it is running:

```bash
curl http://localhost:3000/health
# Expected: { "status": "ok", "timestamp": "..." }

curl http://localhost:3000/ping
# Expected: { "message": "pong" }
```

---

### 2.3 — View Running Containers and Images

```bash
# List running containers
docker ps

# List all containers (including stopped ones)
docker ps -a

# List all local images
docker images
```

---

### 2.4 — View Container Logs

```bash
# Print all logs from the container
docker logs api

# Stream logs in real-time (follow mode)
docker logs -f api
```

> **Tip:** Use `Ctrl+C` to stop following logs without stopping the container.

---

### 2.5 — Stop and Remove a Container

```bash
# Stop the running container
docker stop api

# Remove the stopped container
docker rm api

# One-liner: stop and remove
docker rm -f api
```

Remove an image:

```bash
docker rmi api:latest
```

---

### 2.6 — Docker Compose

Managing individual `docker run` commands gets tedious. **Docker Compose** lets you define your services in a single `docker-compose.yml` file.

Open `api/docker-compose.yml` and walk through it:

- `build` — points to the `Dockerfile`
- `ports` — maps host port to container port
- `environment` — sets environment variables
- `healthcheck` — Docker monitors the container health automatically

```bash
# Build and start all services defined in docker-compose.yml
docker compose up --build -d

# Check service status
docker compose ps

# View logs for all services
docker compose logs -f

# Stop and remove all services
docker compose down
```

---

### 2.7 — Push an Image to Docker Hub

Docker Hub is a public registry where you can store and share images.

```bash
# Log in to Docker Hub
docker login

# Tag your local image with your Docker Hub username
docker tag api:latest YOUR_DOCKERHUB_USERNAME/api:latest

# Push the image to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/api:latest
```

Anyone can now pull your image with:

```bash
docker pull YOUR_DOCKERHUB_USERNAME/api:latest
```

---

## Section 3 — CI/CD with GitHub Actions (25 min)

### What is CI/CD?

- **CI (Continuous Integration)** — automatically build and test your code every time you push a commit
- **CD (Continuous Deployment)** — automatically build a Docker image and push it to a registry (and optionally deploy it) after CI passes

GitHub Actions uses **workflow files** stored in `.github/workflows/` to define these pipelines.

---

### 3.1 — CI Pipeline

**Goal:** On every push to `main` (or a PR), install dependencies, build TypeScript, and confirm the build succeeds.

Create `.github/workflows/api-ci.yml`:

```yaml
name: API CI

on:
  push:
    branches: [main]
    paths:
      - "api/**"
  pull_request:
    branches: [main]
    paths:
      - "api/**"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: api/package-lock.json

      - name: Install dependencies
        working-directory: api
        run: npm ci

      - name: Build TypeScript
        working-directory: api
        run: npm run build
```

> **What's `paths:`?** It tells GitHub Actions to only run this workflow when files inside `api/` change — so a change to `web/` does not trigger an API build.

---

### 3.2 — CD Pipeline

**Goal:** After CI passes on `main`, build a Docker image and push it to Docker Hub.

Create `.github/workflows/api-cd.yml`:

```yaml
name: API CD

on:
  push:
    branches: [main]
    paths:
      - "api/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [] # Add 'build' job name here if you combine CI+CD into one file

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/api:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/api:${{ github.sha }}
```

#### Setting up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name          | Value                                         |
| -------------------- | --------------------------------------------- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username                      |
| `DOCKERHUB_TOKEN`    | A Docker Hub access token (not your password) |

> **Why a token instead of a password?** Tokens can be scoped (read/write only) and revoked individually without changing your password.

---

## Section 4 — Q&A and Wrap-up (5 min)

### What we covered

- Built Docker images from a `Dockerfile`
- Ran, inspected, and cleaned up containers
- Used Docker Compose to manage multi-service setups
- Pushed images to Docker Hub
- Automated builds and image pushes with GitHub Actions CI/CD

### What's next — Part 2

In the next session we will:

- Launch an EC2 instance on AWS
- Configure networking and a static IP
- Deploy our Docker containers to the server
- Set up HTTPS with a free TLS certificate

---

## Reference Commands

```bash
# Build
docker build -t NAME:TAG .

# Run
docker run -d -p HOST:CONTAINER --name NAME IMAGE

# Inspect
docker ps
docker ps -a
docker images
docker logs NAME
docker logs -f NAME

# Cleanup
docker stop NAME
docker rm NAME
docker rmi IMAGE

# Compose
docker compose up --build -d
docker compose down
docker compose logs -f

# Registry
docker login
docker tag LOCAL_IMAGE USERNAME/IMAGE:TAG
docker push USERNAME/IMAGE:TAG
```
