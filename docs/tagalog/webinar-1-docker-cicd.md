# Webinar 1 — Docker + CI/CD gamit ang GitHub Actions

**Tagal:** 40–60 minuto  
**Antas:** Beginner–Intermediate  
**Demo project:** `web/` (React + Vite)

---

## Agenda

| Oras        | Seksyon                                                          |
| ----------- | ---------------------------------------------------------------- |
| 0:00 – 0:05 | Panimula — Ano ang DevOps?                                       |
| 0:05 – 0:30 | Docker — Mga pangunahing konsepto at hands-on na mga command     |
| 0:30 – 0:55 | CI/CD — I-automate ang builds at deployments gamit GitHub Actions |
| 0:55 – 1:00 | Q&A at pagtatapos                                                |

---

## Seksyon 1 — Panimula (5 min)

### Ano ang DevOps?

Ang DevOps ay nagsasanib ng agwat sa pagitan ng **development** (pagsusulat ng code) at **operations** (pagpapatakbo ng code sa production). Ang layunin ay mas mabilis, mas maaasahan, at mas kaunting manu-manong trabaho sa pag-deploy ng software.

**Tatlong haligi na sasaklawin natin sa seryeng ito:**

1. **Containerization** — i-package ang iyong app para tumakbo nang pareho sa lahat ng lugar (Docker)
2. **Automation** — automatic na mag-test at mag-deploy sa bawat code push (CI/CD)
3. **Cloud Infrastructure** — patakbuhin ang iyong mga containers sa tunay na servers (AWS — sasaklawin sa Part 2)

### Ang Proyekto ng Session na Ito

Gagamitin natin ang isang tunay na app na nasa repository na:

- `web/` — Isang React + Vite frontend na may hot-reload development

May kasamang `Dockerfile` na ready na.

---

## Seksyon 2 — Docker (25 min)

### Ano ang Docker?

Ang Docker ay nagbibigay-daan sa iyo na i-package ang iyong application at lahat ng dependencies nito sa isang **container** — isang magaan, portable na unit na tumatakbo nang pareho sa kahit anong machine.

Mahahalagang termino:

- **Image** — ang blueprint (binuo mula sa `Dockerfile`)
- **Container** — tumatakbong instance ng isang image
- **Registry** — remote na imbakan para sa mga images (Docker Hub, GHCR, ECR)

---

### 2.1 — Bumuo ng Docker Image

Ang `Dockerfile` ay naglalarawan kung paano buuin ang image. Buuin natin ang `web` image.

```bash
# Pumunta sa web directory
cd web

# Buuin ang image at i-tag ito
docker build -t web:latest .
```

> **Ano ang nangyayari?** Binabasa ng Docker ang `Dockerfile`, ini-install ang dependencies, binubuo ang Vite app, at gumagawa ng production image.

---

### 2.2 — Magpatakbo ng Container

```bash
# Patakbuhin ang container sa detached mode (-d), i-expose ang port 5173
docker run -d -p 5173:5173 --name web web:latest
```

Subukan kung tumatakbo:

```bash
# Buksan sa browser
open http://localhost:5173
# O gamitin ang curl para tingnan kung sumasagot ang server
curl http://localhost:5173
# Inaasahan: HTML content ng iyong React app
```

---

### 2.3 — Tingnan ang mga Tumatakbong Containers at Images

```bash
# Ilista ang tumatakbong containers
docker ps

# Ilista ang lahat ng containers (kasama ang mga natigil)
docker ps -a

# Ilista ang lahat ng local images
docker images
```

---

### 2.4 — Tingnan ang Container Logs

```bash
# I-print ang lahat ng logs mula sa container
docker logs web

# Mag-stream ng logs nang real-time (follow mode)
docker logs -f web
```

> **Tip:** Gamitin ang `Ctrl+C` para ihinto ang pag-follow ng logs nang hindi iniihinto ang container.

---

### 2.5 — Ihinto at Tanggalin ang Container

```bash
# Ihinto ang tumatakbong container
docker stop web

# Tanggalin ang natigil na container
docker rm web

# One-liner: ihinto at tanggalin
docker rm -f web
```

Tanggalin ang image:

```bash
docker rmi web:latest
```

---

### 2.6 — Docker Compose

Ang pag-manage ng mga indibidwal na `docker run` commands ay nakakapagod. Ang **Docker Compose** ay nagbibigay-daan sa iyo na tukuyin ang iyong mga services sa isang `docker-compose.yml` file.

Buksan ang `web/docker-compose.yml` at suriin ito:

- `build` — tumuturo sa `Dockerfile`
- `ports` — nag-map ng host port sa container port
- `environment` — nag-set ng environment variables
- `healthcheck` — Automatic na sinusubaybayan ng Docker ang kalusugan ng container

```bash
# Buuin at simulan ang lahat ng services na nakatukoy sa docker-compose.yml
docker compose up --build -d

# Tingnan ang service status
docker compose ps

# Tingnan ang logs para sa lahat ng services
docker compose logs -f

# Ihinto at tanggalin ang lahat ng services
docker compose down
```

---

### 2.7 — I-push ang Image sa Docker Hub

Ang Docker Hub ay isang public registry kung saan maaari kang mag-imbak at magbahagi ng images.

```bash
# Mag-log in sa Docker Hub
docker login

# I-tag ang iyong local image gamit ang iyong Docker Hub username
docker tag web:latest YOUR_DOCKERHUB_USERNAME/web:latest

# I-push ang image sa Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/web:latest
```

Maaari nang i-pull ng kahit sino ang iyong image gamit ang:

```bash
docker pull YOUR_DOCKERHUB_USERNAME/web:latest
```

---

## Seksyon 3 — CI/CD gamit ang GitHub Actions (25 min)

### Ano ang CI/CD?

- **CI (Continuous Integration)** — automatic na buuin at i-test ang iyong code sa bawat push ng commit
- **CD (Continuous Deployment)** — automatic na buuin ang Docker image at i-push ito sa registry (at optional na i-deploy ito) pagkatapos pumasa ang CI

Gumagamit ang GitHub Actions ng **workflow files** na nakaimbak sa `.github/workflows/` para tukuyin ang mga pipeline na ito.

---

### 3.1 — CI Pipeline

**Layunin:** Sa bawat push sa `main` (o PR), i-install ang dependencies, buuin ang Vite app, at kumpirmahin na matagumpay ang build.

Gumawa ng `.github/workflows/web-ci.yml`:

```yaml
name: Web CI

on:
  push:
    branches: [main]
    paths:
      - "web/**"
  pull_request:
    branches: [main]
    paths:
      - "web/**"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        working-directory: web
        run: npm ci

      - name: Build Vite app
        working-directory: web
        run: npm run build
```

> **Ano ang `paths:`?** Sinasabi nito sa GitHub Actions na patakbuhin lang ang workflow na ito kapag may nagbago sa loob ng `web/` — kaya ang pagbabago sa ibang directories ay hindi mag-trigger ng build.

---

### 3.2 — CD Pipeline

**Layunin:** Pagkatapos pumasa ang CI sa `main`, buuin ang Docker image at i-push ito sa Docker Hub.

Gumawa ng `.github/workflows/web-cd.yml`:

```yaml
name: Web CD

on:
  push:
    branches: [main]
    paths:
      - "web/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [] # Idagdag ang 'build' job name dito kung pinagsama mo ang CI+CD sa isang file

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
          context: ./web
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/web:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/web:${{ github.sha }}
```

#### Pag-set up ng GitHub Secrets

Pumunta sa iyong GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name          | Value                                             |
| -------------------- | ------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Ang iyong Docker Hub username                     |
| `DOCKERHUB_TOKEN`    | Isang Docker Hub access token (hindi ang password) |

> **Bakit token sa halip na password?** Ang mga tokens ay maaaring ma-scope (read/write lang) at ma-revoke nang isa-isa nang hindi binabago ang iyong password.

---

## Seksyon 4 — Q&A at Pagtatapos (5 min)

### Ano ang nasaklaw natin

- Bumuo ng Docker images mula sa `Dockerfile`
- Nagpatakbo, sinuri, at nag-cleanup ng containers
- Gumamit ng Docker Compose para pamahalaan ang multi-service setups
- Nag-push ng images sa Docker Hub
- Na-automate ang builds at image pushes gamit ang GitHub Actions CI/CD

### Ano ang susunod — Part 2

Sa susunod na session ay:

- Mag-launch ng EC2 instance sa AWS
- I-configure ang networking at static IP
- I-deploy ang ating Docker containers sa server
- Mag-set up ng HTTPS gamit ang libreng TLS certificate

---

## Mga Reference Commands

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
