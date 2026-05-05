# Dockerfile Guide — Building Container Images

**Level:** Beginner–Intermediate  
**Reference Project:** `web/` (React + Vite frontend)  
**Goal:** Learn how to write a Dockerfile to containerize your application

---

## Table of Contents

1. [What is a Dockerfile?](#what-is-a-dockerfile)
2. [Dockerfile Anatomy](#dockerfile-anatomy)
3. [Step-by-Step Breakdown](#step-by-step-breakdown)
4. [Best Practices](#best-practices)
5. [Common Commands Reference](#common-commands-reference)
6. [Multi-Stage Builds](#multi-stage-builds)
7. [Testing Your Dockerfile](#testing-your-dockerfile)

---

## What is a Dockerfile?

A **Dockerfile** is a text file that contains instructions for building a Docker image. It defines:

- **Base image** — what operating system and runtime to start with
- **Dependencies** — what packages and libraries to install
- **Application code** — what files to copy into the image
- **Build steps** — how to compile or prepare your app
- **Runtime configuration** — what command to run when the container starts

Think of it as a recipe that Docker follows to create a reproducible environment for your app.

---

## Dockerfile Anatomy

Here's the Dockerfile from the `web/` project:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
```

Let's break it down line by line.

---

## Step-by-Step Breakdown

### 1. `FROM node:22-alpine`

**Purpose:** Specifies the base image to start from.

- `node:22-alpine` is an official Node.js image based on Alpine Linux (a minimal Linux distribution)
- `22` is the Node.js version
- `alpine` makes the image smaller (typically 50–100 MB vs 900+ MB for full Ubuntu-based images)

**Why use a base image?** You don't want to install Node.js, npm, and the OS from scratch — the base image provides all of that pre-configured.

**Alternatives:**

- `node:22` — larger image with more system tools (useful for debugging)
- `node:22-slim` — middle ground between full and alpine
- `node:20-alpine` — use a different Node.js version

---

### 2. `WORKDIR /app`

**Purpose:** Sets the working directory inside the container.

All subsequent commands (`COPY`, `RUN`, etc.) will execute in this directory. If `/app` doesn't exist, Docker creates it.

**Why `/app`?** It's a convention. You can use any path, but `/app` is widely recognized and keeps things organized.

---

### 3. `COPY package*.json ./`

**Purpose:** Copies `package.json` and `package-lock.json` from your project into the container.

- `package*.json` is a glob pattern that matches both files
- `./` means "copy to the current working directory" (which is `/app`)

**Why copy package files first?** Docker caches each layer. If your dependencies don't change, Docker reuses the cached layer, speeding up subsequent builds. If you copied all files first, any code change would invalidate the cache and reinstall all dependencies.

---

### 4. `RUN npm ci`

**Purpose:** Installs Node.js dependencies inside the container.

- `npm ci` is like `npm install`, but:
  - Faster (uses `package-lock.json` exactly as-is)
  - More reliable (deletes `node_modules` first to ensure clean install)
  - Designed for CI/CD environments

**Why not `npm install`?** In production, you want reproducible builds. `npm ci` guarantees the exact dependency versions from your lockfile.

---

### 5. `COPY . .`

**Purpose:** Copies all remaining files from your project into the container.

- First `.` — your project directory (the build context)
- Second `.` — the container's working directory (`/app`)

This includes your source code, configuration files, and everything else needed to build and run the app.

**What gets copied?**

- Everything except files listed in `.dockerignore`
- Best practice: create a `.dockerignore` file to exclude `node_modules/`, `.git/`, `dist/`, etc.

---

### 6. `RUN npm run build`

**Purpose:** Compiles the application (e.g., Vite builds the React app into static files).

This step varies by project:

- React/Vue/Angular: `npm run build`
- TypeScript: `npm run build` or `tsc`
- Static sites: may not need a build step

The output is typically written to a `dist/` or `build/` directory.

---

### 7. `CMD ["npm", "run", "start"]`

**Purpose:** Defines the default command to run when the container starts.

- `CMD` is written in JSON array format: `["executable", "arg1", "arg2"]`
- This runs `npm run start`, which typically starts a web server

**CMD vs RUN:**

- `RUN` executes during the **build** (e.g., installing dependencies)
- `CMD` executes when the container **starts**

**Note:** There can only be one `CMD` in a Dockerfile. If you specify multiple, only the last one takes effect.

---

## Best Practices

### 1. Use `.dockerignore`

Create a `.dockerignore` file in the same directory as your Dockerfile:

```
node_modules
dist
build
.git
.env
*.log
.DS_Store
```

**Why?** Prevents copying unnecessary files into the image, making builds faster and images smaller.

---

### 2. Order Instructions by Change Frequency

Place instructions that change rarely (like installing dependencies) before those that change often (like copying source code). This maximizes Docker's layer caching.

**Good:**

```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .
```

**Bad:**

```dockerfile
COPY . .
RUN npm ci  # This re-runs every time ANY file changes
```

---

### 3. Use Specific Image Tags

**Good:** `FROM node:22-alpine`  
**Bad:** `FROM node:latest`

Using `latest` can lead to unexpected breaking changes when the base image is updated.

---

### 4. Minimize Layers

Each `RUN`, `COPY`, and `ADD` instruction creates a new layer. Combine commands where possible:

**Good:**

```dockerfile
RUN apt update && apt install -y curl git && rm -rf /var/lib/apt/lists/*
```

**Bad:**

```dockerfile
RUN apt update
RUN apt install -y curl
RUN apt install -y git
```

---

### 5. Run as Non-Root User (Security)

By default, containers run as root. For production, create a non-root user:

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

---

### 6. Use Multi-Stage Builds for Smaller Images

See the [Multi-Stage Builds](#multi-stage-builds) section below.

---

## Common Commands Reference

| Instruction  | Purpose                                   | Example                            |
| ------------ | ----------------------------------------- | ---------------------------------- |
| `FROM`       | Set the base image                        | `FROM node:22-alpine`              |
| `WORKDIR`    | Set working directory                     | `WORKDIR /app`                     |
| `COPY`       | Copy files from host to container         | `COPY . .`                         |
| `ADD`        | Like `COPY`, but can extract `.tar` files | `ADD archive.tar.gz /app`          |
| `RUN`        | Execute a command during build            | `RUN npm ci`                       |
| `CMD`        | Default command when container starts     | `CMD ["npm", "start"]`             |
| `ENTRYPOINT` | Like `CMD`, but harder to override        | `ENTRYPOINT ["node", "server.js"]` |
| `EXPOSE`     | Document which port the app listens on    | `EXPOSE 3000`                      |
| `ENV`        | Set environment variables                 | `ENV NODE_ENV=production`          |
| `ARG`        | Define build-time variables               | `ARG VERSION=1.0.0`                |
| `VOLUME`     | Create a mount point for persistent data  | `VOLUME /data`                     |

---

## Multi-Stage Builds

Multi-stage builds let you use multiple `FROM` statements in one Dockerfile. This is useful for:

- **Separating build and runtime environments** (e.g., build tools aren't needed in production)
- **Reducing image size** (final image only contains what's necessary to run the app)

### Example: Build Stage + Production Stage

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start"]
```

**How it works:**

1. **Builder stage** — installs all dependencies (including dev dependencies), builds the app
2. **Production stage** — starts fresh from a clean base image, installs only production dependencies, copies the built output from the builder stage

**Result:** The final image is much smaller because it doesn't include TypeScript, build tools, or dev dependencies.

---

## Testing Your Dockerfile

### 1. Build the Image

```bash
# Navigate to the directory containing the Dockerfile
cd web

# Build the image and tag it
docker build -t web:latest .
```

**What happens?**

- Docker reads the Dockerfile
- Executes each instruction in order
- Creates a new layer for each instruction
- Tags the final image as `web:latest`

---

### 2. Run the Container

```bash
# Run the container in detached mode, map port 5173 to host port 5173
docker run -d -p 5173:5173 --name web web:latest
```

**Breakdown:**

- `-d` — detached mode (runs in background)
- `-p 5173:5173` — maps host port 5173 to container port 5173
- `--name web` — gives the container a friendly name
- `web:latest` — the image to run

---

### 3. View Logs

```bash
# Print all logs
docker logs web

# Stream logs in real-time
docker logs -f web
```

---

### 4. Test the Application

Open your browser and navigate to:

```
http://localhost:5173
```

You should see your React app running!

---

### 5. Stop and Remove the Container

```bash
# Stop the container
docker stop web

# Remove the container
docker rm web

# One-liner: stop and remove
docker rm -f web
```

---

## Troubleshooting

### Build Fails with "COPY failed"

**Problem:** File or directory not found during `COPY`.

**Solution:** Make sure you're running `docker build` from the correct directory (where the Dockerfile is located). The build context is the directory you specify (usually `.`).

---

### Container Exits Immediately

**Problem:** `docker ps` shows no running container.

**Solution:**

```bash
# Check exit status and logs
docker ps -a
docker logs web
```

Common causes:

- The `CMD` command fails or exits immediately
- The app crashes on startup (check logs for errors)

---

### Changes Not Reflected in Image

**Problem:** You changed code but the image still has the old code.

**Solution:** Rebuild the image:

```bash
docker build -t web:latest .
```

Or use `--no-cache` to force a fresh build:

```bash
docker build --no-cache -t web:latest .
```

---

## Next Steps

Now that you understand how Dockerfiles work:

1. **Optimize your Dockerfile** — add a `.dockerignore`, use multi-stage builds, run as non-root
2. **Use Docker Compose** — manage multi-service setups easily (see [Webinar 1 — Docker + CI/CD](./webinar-1-docker-cicd.md))
3. **Push to a Registry** — share your images via Docker Hub or GitHub Container Registry
4. **Automate with CI/CD** — build and push images automatically with GitHub Actions

---

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/reference/dockerfile/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
