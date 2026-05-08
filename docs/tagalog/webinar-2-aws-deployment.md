# Webinar 2 — AWS Deployment gamit ang EC2, Networking, at HTTPS

**Tagal:** 60 minuto  
**Antas:** Intermediate  
**Prerequisite:** Tapusin muna ang [Webinar 1 — Docker + CI/CD](./webinar-1-docker-cicd.md)  
**Demo project:** `web/` mula sa repository na ito

---

## Agenda

| Oras        | Seksyon                                                           |
| ----------- | ----------------------------------------------------------------- |
| 0:00 – 0:05 | Recap at panimula                                                 |
| 0:05 – 0:20 | AWS Setup — EC2, Security Group, Elastic IP                       |
| 0:20 – 0:35 | Server Setup — Docker sa EC2, pull at patakbuhin ang containers   |
| 0:35 – 0:45 | Networking — Paliwanag ng VPC at Security Groups                  |
| 0:45 – 0:58 | HTTPS — Nginx reverse proxy + Let's Encrypt TLS certificate       |
| 0:58 – 1:00 | Q&A at pagtatapos                                                 |

---

## Seksyon 1 — Recap at Panimula (5 min)

Sa Part 1 kami ay:

- Bumuo ng Docker images mula sa mga `Dockerfile`
- Nag-push ng images sa Docker Hub
- Na-automate ang build at push gamit ang GitHub Actions CI/CD

Ngayon ay kukunin natin ang mga images na iyon at **i-deploy sa tunay na server sa AWS**, pagkatapos ay i-secure ito gamit ang HTTPS.

### Ano ang bubuin natin ngayong araw

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
│             ▼                │
│        web:5173              │
│        (Docker)              │
└─────────────│────────────────┘
         │
   Elastic IP (static)
```

---

## Seksyon 2 — AWS Setup (15 min)

### 2.1 — Mag-launch ng EC2 Instance

1. Mag-log in sa [AWS Console](https://console.aws.amazon.com)
2. Pumunta sa **EC2** → **Launch Instance**
3. I-configure:

| Setting       | Value                                               |
| ------------- | --------------------------------------------------- |
| Name          | `devops-server`                                     |
| AMI           | Ubuntu 24.04 LTS (Free Tier eligible)               |
| Instance type | `t2.micro` (Free Tier)                              |
| Key pair      | Gumawa ng bagong key pair, i-download ang `.pem` file |
| Storage       | 8 GB (default ay okay na)                           |

4. I-click ang **Launch Instance**

> **Ingatan ang iyong `.pem` file.** Ito lang ang paraan para mag-SSH sa iyong server. Huwag kailanman i-commit ito sa Git.

---

### 2.2 — I-configure ang Security Group

Ang **Security Group** ay isang firewall na kumokontrol kung anong traffic ang makakaabot sa iyong EC2 instance.

Pumunta sa **EC2** → **Security Groups** → piliin ang nakakabit sa iyong instance → **Edit inbound rules**:

| Type       | Protocol | Port | Source    | Bakit                                                   |
| ---------- | -------- | ---- | --------- | ------------------------------------------------------- |
| SSH        | TCP      | 22   | Your IP   | Remote access sa server                                 |
| HTTP       | TCP      | 80   | 0.0.0.0/0 | Web traffic (Nginx ay mag-redirect sa 443)              |
| HTTPS      | TCP      | 443  | 0.0.0.0/0 | Secure na web traffic                                   |
| Custom TCP | TCP      | 5173 | 0.0.0.0/0 | Web app (pansamantala, tanggalin pagkatapos ng Nginx setup) |

> **Best practice:** Limitahan ang port 22 sa iyong sariling IP address. Huwag kailanman iwang bukas ang SSH sa `0.0.0.0/0` sa production.

---

### 2.3 — Mag-allocate at Mag-associate ng Elastic IP (Static IP)

Bilang default, nag-assign ang AWS ng bagong public IP sa bawat pag-restart mo ng instance. Ang **Elastic IP** ay nagbibigay sa iyo ng permanenteng static IP.

1. Pumunta sa **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. I-click ang **Allocate**
3. Piliin ang bagong IP → **Actions** → **Associate Elastic IP address**
4. Piliin ang iyong EC2 instance → **Associate**

Ang iyong server ay mayroon nang permanenteng IP address. Isulat ito — gagamitin mo ito sa lahat ng lugar.

---

## Seksyon 3 — Server Setup (15 min)

### 3.1 — Mag-SSH sa EC2 Instance

```bash
# I-set ang tamang permissions sa iyong key file (kailangan sa macOS/Linux)
chmod 400 your-key.pem

# Kumonekta sa iyong server
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

### 3.2 — I-install ang Docker sa EC2

```bash
# I-update ang package list
sudo apt update

# I-install ang Docker
sudo apt install -y docker.io

# Simulan at i-enable ang Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Idagdag ang iyong user sa docker group (para hindi na kailangan ng sudo)
sudo usermod -aG docker ubuntu

# I-apply ang group change nang hindi nag-log out
newgrp docker

# I-verify na gumagana ang Docker
docker --version
```

I-install ang Docker Compose plugin:

```bash
sudo apt install -y docker-compose-plugin

# I-verify
docker compose version
```

---

### 3.3 — I-pull at Patakbuhin ang Docker Images mula sa Docker Hub

```bash
# I-pull ang images na in-push natin sa Part 1
docker pull YOUR_DOCKERHUB_USERNAME/web:latest

# Patakbuhin ang web container
docker run -d \
  -p 5173:5173 \
  --name web \
  --restart unless-stopped \
  YOUR_DOCKERHUB_USERNAME/web:latest

# Subukan kung gumagana
curl http://localhost:5173
```

---

## Seksyon 4 — Networking Deep Dive (10 min)

### VPC (Virtual Private Cloud)

Inilalagay ng AWS ang iyong EC2 instance sa loob ng **VPC** — isang pribado, nakahiwalay na network. Isipin ito bilang iyong sariling seksyon ng AWS data center.

```
AWS Cloud
└── VPC (iyong pribadong network, e.g. 10.0.0.0/16)
    └── Subnet (isang slice ng VPC, e.g. 10.0.1.0/24)
        └── EC2 Instance (iyong server)
            └── Security Group (ang firewall)
```

### Bakit Mahalaga ang Elastic IP

| Scenario                    | Walang Elastic IP    | May Elastic IP      |
| --------------------------- | -------------------- | ------------------- |
| Pagkatapos ng server restart | Bagong random IP     | Parehas na IP lagi  |
| DNS record tumuturo sa server | Masira sa restart   | Laging valid        |
| CI/CD deploys gamit SSH     | Masira ang config    | Valid pa rin ang config |

### Inbound vs Outbound Rules

- **Inbound rules** — kumokontrol kung anong traffic ang makakaabot sa iyong server (ang in-configure natin sa itaas)
- **Outbound rules** — bilang default, lahat ng outbound traffic ay pinapayagan (ang iyong server ay maaaring maabot ang internet)

---

## Seksyon 5 — HTTPS gamit ang Nginx at Let's Encrypt (13 min)

### Bakit HTTPS?

- Nagpapakita ang mga browsers ng "Not Secure" na babala para sa HTTP
- Kinakailangan para sa mga modernong web features (cookies, service workers, atbp.)
- Pinoprotektahan ang data habang nasa transit sa pagitan ng user at server

### 5.1 — I-install ang Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Subukan: buksan ang `http://YOUR_ELASTIC_IP` sa browser — dapat makita mo ang Nginx welcome page.

---

### 5.2 — I-configure ang Nginx bilang Reverse Proxy

Gumawa ng bagong Nginx config para sa iyong web app:

```bash
sudo nano /etc/nginx/sites-available/web
```

I-paste ang sumusunod (palitan ang `YOUR_DOMAIN` ng iyong tunay na domain, o gamitin ang iyong Elastic IP):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

I-enable ang config:

```bash
sudo ln -s /etc/nginx/sites-available/web /etc/nginx/sites-enabled/

# I-test ang config para sa syntax errors
sudo nginx -t

# I-reload ang Nginx
sudo systemctl reload nginx
```

---

### 5.3 — Mag-issue ng Libreng TLS Certificate gamit ang Certbot

> **Kinakailangan:** Kailangan mo ng tunay na domain name na tumuturo sa iyong Elastic IP para gumana ang Certbot. Kung IP lang ang mayroon ka, laktawan ang tip sa ibaba.

```bash
# I-install ang Certbot
sudo apt install -y certbot python3-certbot-nginx

# Mag-issue ng certificate (Automatic na ina-update ng Certbot ang iyong Nginx config)
sudo certbot --nginx -d YOUR_DOMAIN

# Sundin ang mga prompt:
# - Ilagay ang iyong email address
# - Sumang-ayon sa Terms of Service
# - Piliin kung mag-redirect ng HTTP → HTTPS (piliin ang Yes / option 2)
```

Ang Certbot ay:

1. I-verify na pagmamay-ari mo ang domain
2. Mag-issue ng certificate
3. I-update ang iyong Nginx config para makinig sa port 443
4. Mag-set up ng automatic na HTTP → HTTPS redirection

I-test ang auto-renewal:

```bash
sudo certbot renew --dry-run
```

> **Walang domain?** Maaari mo pa ring subukan ang HTTPS locally gamit ang self-signed certificate:
>
> ```bash
> sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
>   -keyout /etc/ssl/private/nginx-selfsigned.key \
>   -out /etc/ssl/certs/nginx-selfsigned.crt
> ```
>
> Tandaan na magpapakita ng security warning ang mga browsers para sa self-signed certificates.

---

## Seksyon 6 — I-update ang CD para Mag-deploy sa EC2 (5 min)

I-update ang iyong GitHub Actions CD workflow para mag-SSH sa EC2 instance at i-pull ang pinakabagong image pagkatapos mag-push sa Docker Hub.

Idagdag ang mga steps na ito sa `.github/workflows/web-cd.yml` pagkatapos ng build-and-push step:

```yaml
- name: Deploy to EC2
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ubuntu
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      docker pull ${{ secrets.DOCKERHUB_USERNAME }}/web:latest
      docker stop web || true
      docker rm web || true
      docker run -d \
        -p 5173:5173 \
        --name web \
        --restart unless-stopped \
        ${{ secrets.DOCKERHUB_USERNAME }}/web:latest
```

Idagdag ang mga karagdagang GitHub Secrets na ito:

| Secret Name   | Value                                                  |
| ------------- | ------------------------------------------------------ |
| `EC2_HOST`    | Ang iyong Elastic IP address                           |
| `EC2_SSH_KEY` | Mga nilalaman ng iyong `.pem` key file (ang buong text) |

> **Security note:** Huwag kailanman mag-log o mag-print ng secrets sa workflow steps. Automatic na nima-mask ng GitHub ang mga ito, pero iwasan ang pag-echo ng `${{ secrets.* }}` sa log messages.

---

## Seksyon 7 — Q&A at Pagtatapos (2 min)

### Ano ang nasaklaw natin

- Nag-launch ng EC2 instance at in-configure ito nang secure
- Nag-assign ng permanenteng static IP gamit ang Elastic IP
- Nag-set up ng Security Group firewall rules
- Nag-install ng Docker at nagpatakbo ng containers sa tunay na server
- In-configure ang Nginx bilang reverse proxy
- Nag-issue ng libreng TLS certificate para sa HTTPS
- Pinalawig ang GitHub Actions CD para mag-auto-deploy sa bawat push sa `main`

### Ano ang susunod (Hinaharap na Serye)

| Paksa                        | Ano ang matututunan mo                               |
| ---------------------------- | ---------------------------------------------------- |
| Amazon RDS                   | Managed PostgreSQL database sa AWS                   |
| Amazon S3                    | Object storage para sa files at static assets        |
| Amazon ECR                   | AWS-native na Docker image registry                  |
| ECS / Fargate                | Magpatakbo ng containers nang hindi namamahala ng servers |
| Route 53                     | AWS DNS management                                   |
| Load Balancer + Auto Scaling | Pangasiwaan ang traffic spikes nang awtomatiko       |
| Terraform                    | Tukuyin ang lahat ng infrastructure bilang code      |

---

## Mga Reference Commands

```bash
# SSH sa EC2
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Docker sa EC2
docker pull USERNAME/web:latest
docker run -d -p 5173:5173 --name web --restart unless-stopped USERNAME/web:latest
docker ps
docker logs -f web

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Certbot
sudo certbot --nginx -d YOUR_DOMAIN
sudo certbot renew --dry-run
```
