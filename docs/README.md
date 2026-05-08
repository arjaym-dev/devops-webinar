# DevOps Webinar Series

A hands-on webinar series that walks you through real-world DevOps practices — from containerizing apps with Docker to deploying them on AWS with HTTPS.

All demos use the `api/` (Node.js + TypeScript) and `web/` (React + Vite) apps in this repository.

---

## Series Overview

| #   | Title                                           | Duration  | Topics                                 |
| --- | ----------------------------------------------- | --------- | -------------------------------------- |
| 1   | [Docker + CI/CD](./webinar-1-docker-cicd.md)    | 40–60 min | Docker, Docker Compose, GitHub Actions |
| 2   | [AWS Deployment](./webinar-2-aws-deployment.md) | 60 min    | EC2, Networking, HTTPS/TLS, CD to EC2  |

---

## Tagalog/Filipino Translations

Para sa mga Filipino participants, available ang mga webinar materials sa Tagalog:

- **[Webinar 1 — Docker + CI/CD](./tagalog/webinar-1-docker-cicd.md)** (Tagalog)
- **[Webinar 2 — AWS Deployment](./tagalog/webinar-2-aws-deployment.md)** (Tagalog)

All technical commands and code remain in English to maintain consistency with industry standards.

---

## Prerequisites

Before attending, make sure you have the following installed and set up:

### Part 1

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)
- [Git](https://git-scm.com/)
- A free [GitHub](https://github.com) account
- A free [Docker Hub](https://hub.docker.com) account

### Part 2 (builds on Part 1)

- An [AWS account](https://aws.amazon.com/free/) (free tier is sufficient)
- A domain name (optional, but recommended for HTTPS demo)
- SSH client (`ssh` is pre-installed on macOS/Linux; use PuTTY or Windows Terminal on Windows)

---

## Repository Structure

```
devops/
├── api/                  # Node.js + TypeScript REST API
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
├── web/                  # React + Vite frontend
│   ├── src/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
└── docs/                 # Webinar plans and guides (this folder)
    ├── README.md
    ├── webinar-1-docker-cicd.md
    └── webinar-2-aws-deployment.md
```

---

## How to Use These Docs

Each webinar doc is structured as a **presenter guide** with:

- A timed agenda
- Short explanations before each demo
- Copy-paste terminal commands
- Tips for handling common questions

Attendees can follow along using this repository as a reference.

---

## Quick Start (Follow Along Locally)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/devops.git
cd devops

# Start both services with Docker Compose (from api/ or web/ respectively)
cd api && docker compose up --build -d
```

> **Note:** A root-level `docker-compose.yml` covering both services will be added in a future update.
