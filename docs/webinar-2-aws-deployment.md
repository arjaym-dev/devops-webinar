# Webinar 2 — AWS Deployment with EC2, Networking, and HTTPS

**Duration:** 60 minutes  
**Level:** Intermediate  
**Prerequisite:** Complete [Webinar 1 — Docker + CI/CD](./webinar-1-docker-cicd.md) first  
**Demo project:** `api/` and `web/` from this repository

---

## Agenda

| Time        | Section                                                     |
| ----------- | ----------------------------------------------------------- |
| 0:00 – 0:05 | Recap and introduction                                      |
| 0:05 – 0:20 | AWS Setup — EC2, Security Group, Elastic IP                 |
| 0:20 – 0:35 | Server Setup — Docker on EC2, pull and run containers       |
| 0:35 – 0:45 | Networking — VPC, Security Groups explained                 |
| 0:45 – 0:58 | HTTPS — Nginx reverse proxy + Let's Encrypt TLS certificate |
| 0:58 – 1:00 | Q&A and wrap-up                                             |

---

## Section 1 — Recap and Introduction (5 min)

In Part 1 we:

- Built Docker images from `Dockerfile`s
- Pushed images to Docker Hub
- Automated the build and push with GitHub Actions CI/CD

Today we take those images and **deploy them to a real server on AWS**, then secure it with HTTPS.

### What we will build today

```
Internet
   │
   │ HTTPS (443) / HTTP (80)
   ▼
┌──────────────────────────────┐
│         AWS EC2 Instance     │
│  ┌────────────────────────┐  │
│  │     Nginx (proxy)      │  │
│  └──────────┬─────────────┘  │
│             │                │
│    ┌────────┴────────┐       │
│    ▼                 ▼       │
│  api:3000        web:5173    │
│  (Docker)        (Docker)    │
└──────────────────────────────┘
         │
   Elastic IP (static)
```

---

## Section 2 — AWS Setup (15 min)

### 2.1 — Launch an EC2 Instance

1. Log in to the [AWS Console](https://console.aws.amazon.com)
2. Go to **EC2** → **Launch Instance**
3. Configure:

| Setting       | Value                                           |
| ------------- | ----------------------------------------------- |
| Name          | `devops-server`                                 |
| AMI           | Ubuntu 24.04 LTS (Free Tier eligible)           |
| Instance type | `t2.micro` (Free Tier)                          |
| Key pair      | Create a new key pair, download the `.pem` file |
| Storage       | 8 GB (default is fine)                          |

4. Click **Launch Instance**

> **Keep your `.pem` file safe.** It is the only way to SSH into your server. Never commit it to Git.

---

### 2.2 — Configure the Security Group

A **Security Group** is a firewall that controls what traffic reaches your EC2 instance.

Go to **EC2** → **Security Groups** → select the one attached to your instance → **Edit inbound rules**:

| Type       | Protocol | Port | Source    | Why                                           |
| ---------- | -------- | ---- | --------- | --------------------------------------------- |
| SSH        | TCP      | 22   | Your IP   | Remote access to the server                   |
| HTTP       | TCP      | 80   | 0.0.0.0/0 | Web traffic (Nginx will redirect to 443)      |
| HTTPS      | TCP      | 443  | 0.0.0.0/0 | Secure web traffic                            |
| Custom TCP | TCP      | 3000 | 0.0.0.0/0 | API (temporary, remove after Nginx is set up) |

> **Best practice:** Restrict port 22 to your own IP address. Never leave SSH open to `0.0.0.0/0` in production.

---

### 2.3 — Allocate and Associate an Elastic IP (Static IP)

By default, AWS assigns a new public IP every time you restart your instance. An **Elastic IP** gives you a permanent static IP.

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Click **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Choose your EC2 instance → **Associate**

Your server now has a permanent IP address. Note it down — you will use it everywhere.

---

## Section 3 — Server Setup (15 min)

### 3.1 — SSH into the EC2 Instance

```bash
# Set correct permissions on your key file (required on macOS/Linux)
chmod 400 your-key.pem

# Connect to your server
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

### 3.2 — Install Docker on EC2

```bash
# Update package list
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Apply group change without logging out
newgrp docker

# Verify Docker is working
docker --version
```

Install Docker Compose plugin:

```bash
sudo apt install -y docker-compose-plugin

# Verify
docker compose version
```

---

### 3.3 — Pull and Run Docker Images from Docker Hub

```bash
# Pull the images we pushed in Part 1
docker pull YOUR_DOCKERHUB_USERNAME/api:latest

# Run the API container
docker run -d \
  -p 3000:3000 \
  --name api \
  --restart unless-stopped \
  YOUR_DOCKERHUB_USERNAME/api:latest

# Test it works
curl http://localhost:3000/health
```

---

## Section 4 — Networking Deep Dive (10 min)

### VPC (Virtual Private Cloud)

AWS places your EC2 instance inside a **VPC** — a private, isolated network. Think of it as your own section of the AWS data center.

```
AWS Cloud
└── VPC (your private network, e.g. 10.0.0.0/16)
    └── Subnet (a slice of the VPC, e.g. 10.0.1.0/24)
        └── EC2 Instance (your server)
            └── Security Group (the firewall)
```

### Why Elastic IP Matters

| Scenario                    | Without Elastic IP | With Elastic IP    |
| --------------------------- | ------------------ | ------------------ |
| After server restart        | New random IP      | Same IP always     |
| DNS record points to server | Breaks on restart  | Always valid       |
| CI/CD deploys via SSH       | Config breaks      | Config stays valid |

### Inbound vs Outbound Rules

- **Inbound rules** — control what traffic can reach your server (what we configured above)
- **Outbound rules** — by default, all outbound traffic is allowed (your server can reach the internet)

---

## Section 5 — HTTPS with Nginx and Let's Encrypt (13 min)

### Why HTTPS?

- Browsers show "Not Secure" warnings for HTTP
- Required for modern web features (cookies, service workers, etc.)
- Protects data in transit between user and server

### 5.1 — Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Test: open `http://YOUR_ELASTIC_IP` in a browser — you should see the Nginx welcome page.

---

### 5.2 — Configure Nginx as a Reverse Proxy

Create a new Nginx config for your API:

```bash
sudo nano /etc/nginx/sites-available/api
```

Paste the following (replace `YOUR_DOMAIN` with your actual domain, or use your Elastic IP):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the config:

```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/

# Test the config for syntax errors
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### 5.3 — Issue a Free TLS Certificate with Certbot

> **Requirement:** You need a real domain name pointing to your Elastic IP for Certbot to work. If you only have an IP, skip to the tip below.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Issue a certificate (Certbot automatically updates your Nginx config)
sudo certbot --nginx -d YOUR_DOMAIN

# Follow the prompts:
# - Enter your email address
# - Agree to the Terms of Service
# - Choose whether to redirect HTTP → HTTPS (choose Yes / option 2)
```

Certbot will:

1. Verify you own the domain
2. Issue a certificate
3. Update your Nginx config to listen on port 443
4. Set up automatic HTTP → HTTPS redirection

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

> **No domain?** You can still test HTTPS locally using a self-signed certificate:
>
> ```bash
> sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
>   -keyout /etc/ssl/private/nginx-selfsigned.key \
>   -out /etc/ssl/certs/nginx-selfsigned.crt
> ```
>
> Note that browsers will show a security warning for self-signed certificates.

---

## Section 6 — Update CD to Deploy to EC2 (5 min)

Update your GitHub Actions CD workflow to SSH into the EC2 instance and pull the latest image after pushing to Docker Hub.

Add these steps to `.github/workflows/api-cd.yml` after the build-and-push step:

```yaml
- name: Deploy to EC2
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ubuntu
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      docker pull ${{ secrets.DOCKERHUB_USERNAME }}/api:latest
      docker stop api || true
      docker rm api || true
      docker run -d \
        -p 3000:3000 \
        --name api \
        --restart unless-stopped \
        ${{ secrets.DOCKERHUB_USERNAME }}/api:latest
```

Add these additional GitHub Secrets:

| Secret Name   | Value                                            |
| ------------- | ------------------------------------------------ |
| `EC2_HOST`    | Your Elastic IP address                          |
| `EC2_SSH_KEY` | Contents of your `.pem` key file (the full text) |

> **Security note:** Never log or print secrets in workflow steps. GitHub automatically masks them, but avoid echoing `${{ secrets.* }}` into log messages.

---

## Section 7 — Q&A and Wrap-up (2 min)

### What we covered

- Launched an EC2 instance and configured it securely
- Assigned a permanent static IP with Elastic IP
- Set up Security Group firewall rules
- Installed Docker and ran containers on a real server
- Configured Nginx as a reverse proxy
- Issued a free TLS certificate for HTTPS
- Extended GitHub Actions CD to auto-deploy on every push to `main`

### What's next (Future Series)

| Topic                        | What you'll learn                          |
| ---------------------------- | ------------------------------------------ |
| Amazon RDS                   | Managed PostgreSQL database on AWS         |
| Amazon S3                    | Object storage for files and static assets |
| Amazon ECR                   | AWS-native Docker image registry           |
| ECS / Fargate                | Run containers without managing servers    |
| Route 53                     | AWS DNS management                         |
| Load Balancer + Auto Scaling | Handle traffic spikes automatically        |
| Terraform                    | Define all infrastructure as code          |

---

## Reference Commands

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Docker on EC2
docker pull USERNAME/api:latest
docker run -d -p 3000:3000 --name api --restart unless-stopped USERNAME/api:latest
docker ps
docker logs -f api

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Certbot
sudo certbot --nginx -d YOUR_DOMAIN
sudo certbot renew --dry-run
```
