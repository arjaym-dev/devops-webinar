# Docker Command Flags Reference

**Level:** Beginner–Intermediate  
**Goal:** Comprehensive reference of commonly used Docker command flags and options

---

## Table of Contents

1. [docker build](#docker-build)
2. [docker run](#docker-run)
3. [docker ps](#docker-ps)
4. [docker logs](#docker-logs)
5. [docker exec](#docker-exec)
6. [docker images](#docker-images)
7. [docker pull / push](#docker-pull--push)
8. [docker rm / rmi](#docker-rm--rmi)
9. [docker compose](#docker-compose)
10. [docker network](#docker-network)
11. [docker volume](#docker-volume)

---

## docker build

Build a Docker image from a Dockerfile.

**Basic syntax:** `docker build [OPTIONS] PATH`

| Flag          | Long Form | Description                                                 | Example                                     |
| ------------- | --------- | ----------------------------------------------------------- | ------------------------------------------- |
| `-t`          | `--tag`   | Name and optionally tag the image in `name:tag` format      | `docker build -t web:latest .`              |
| `-f`          | `--file`  | Specify the Dockerfile path (default is `./Dockerfile`)     | `docker build -f Dockerfile.prod -t web .`  |
| `--no-cache`  | -         | Build without using cache from previous builds              | `docker build --no-cache -t web .`          |
| `--build-arg` | -         | Set build-time variables                                    | `docker build --build-arg VERSION=1.0 .`    |
| `--target`    | -         | Build a specific stage in a multi-stage Dockerfile          | `docker build --target production -t web .` |
| `--platform`  | -         | Set platform for the build (e.g., linux/amd64, linux/arm64) | `docker build --platform linux/amd64 .`     |
| `-q`          | `--quiet` | Suppress build output and only print image ID               | `docker build -q -t web .`                  |
| `--pull`      | -         | Always attempt to pull a newer version of the base image    | `docker build --pull -t web .`              |
| `--rm`        | -         | Remove intermediate containers after build (default: true)  | `docker build --rm -t web .`                |
| `--compress`  | -         | Compress the build context using gzip                       | `docker build --compress -t web .`          |

**Common usage:**

```bash
# Basic build with tag
docker build -t myapp:v1.0 .

# Build with custom Dockerfile
docker build -f docker/Dockerfile.dev -t myapp:dev .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t myapp .

# Build specific stage
docker build --target builder -t myapp:builder .
```

---

## docker run

Create and start a container from an image.

**Basic syntax:** `docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`

### Port and Network Flags

| Flag        | Long Form       | Description                                               | Example                                             |
| ----------- | --------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `-p`        | `--publish`     | Publish container port to host in `host:container` format | `docker run -p 8080:80 nginx`                       |
| `-P`        | `--publish-all` | Publish all exposed ports to random host ports            | `docker run -P nginx`                               |
| `--network` | -               | Connect container to a network                            | `docker run --network my-network nginx`             |
| `--ip`      | -               | Assign a specific IP address to the container             | `docker run --network my-net --ip 172.18.0.5 nginx` |
| `--expose`  | -               | Expose a port without publishing it                       | `docker run --expose 8080 nginx`                    |

### Container Management Flags

| Flag        | Long Form             | Description                                             | Example                                     |
| ----------- | --------------------- | ------------------------------------------------------- | ------------------------------------------- |
| `-d`        | `--detach`            | Run container in background (detached mode)             | `docker run -d nginx`                       |
| `-it`       | `--interactive --tty` | Run container interactively with a terminal             | `docker run -it ubuntu bash`                |
| `--name`    | -                     | Assign a name to the container                          | `docker run --name my-web nginx`            |
| `--rm`      | -                     | Automatically remove container when it exits            | `docker run --rm nginx`                     |
| `--restart` | -                     | Restart policy (no, on-failure, always, unless-stopped) | `docker run --restart unless-stopped nginx` |

### Environment and Variables Flags

| Flag         | Long Form   | Description                            | Example                                  |
| ------------ | ----------- | -------------------------------------- | ---------------------------------------- |
| `-e`         | `--env`     | Set environment variable               | `docker run -e NODE_ENV=production node` |
| `--env-file` | -           | Read environment variables from a file | `docker run --env-file .env node`        |
| `-w`         | `--workdir` | Set working directory inside container | `docker run -w /app node`                |
| `-u`         | `--user`    | Set user (UID:GID format)              | `docker run -u 1000:1000 node`           |

### Volume and Mount Flags

| Flag             | Long Form  | Description                                    | Example                                                      |
| ---------------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `-v`             | `--volume` | Bind mount a volume in `host:container` format | `docker run -v /data:/app/data nginx`                        |
| `--mount`        | -          | More explicit mount syntax                     | `docker run --mount type=bind,src=/data,dst=/app/data nginx` |
| `--volumes-from` | -          | Mount volumes from another container           | `docker run --volumes-from data-container nginx`             |

### Resource Limits Flags

| Flag            | Long Form  | Description                        | Example                                           |
| --------------- | ---------- | ---------------------------------- | ------------------------------------------------- |
| `-m`            | `--memory` | Memory limit (b, k, m, g suffixes) | `docker run -m 512m nginx`                        |
| `--memory-swap` | -          | Total memory limit (memory + swap) | `docker run --memory 512m --memory-swap 1g nginx` |
| `--cpus`        | -          | Number of CPUs                     | `docker run --cpus 1.5 nginx`                     |
| `--cpu-shares`  | -          | CPU shares (relative weight)       | `docker run --cpu-shares 512 nginx`               |

### Health and Lifecycle Flags

| Flag                | Long Form | Description                         | Example                                                     |
| ------------------- | --------- | ----------------------------------- | ----------------------------------------------------------- |
| `--health-cmd`      | -         | Command to run to check health      | `docker run --health-cmd "curl -f http://localhost/" nginx` |
| `--health-interval` | -         | Time between health checks          | `docker run --health-interval 30s nginx`                    |
| `--stop-timeout`    | -         | Timeout to stop container (seconds) | `docker run --stop-timeout 10 nginx`                        |

**Common usage:**

```bash
# Run in background with port mapping
docker run -d -p 8080:80 --name web nginx

# Run interactively
docker run -it --rm ubuntu bash

# Run with environment variables and volume
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd):/app \
  --name api \
  node:22-alpine

# Run with restart policy and resource limits
docker run -d \
  --restart unless-stopped \
  --memory 512m \
  --cpus 1 \
  nginx
```

---

## docker ps

List containers.

**Basic syntax:** `docker ps [OPTIONS]`

| Flag         | Long Form  | Description                                             | Example                                        |
| ------------ | ---------- | ------------------------------------------------------- | ---------------------------------------------- |
| `-a`         | `--all`    | Show all containers (default shows just running)        | `docker ps -a`                                 |
| `-q`         | `--quiet`  | Only display container IDs                              | `docker ps -q`                                 |
| `-s`         | `--size`   | Display total file sizes                                | `docker ps -s`                                 |
| `-f`         | `--filter` | Filter output based on conditions                       | `docker ps -f "status=exited"`                 |
| `--format`   | -          | Pretty-print containers using a Go template             | `docker ps --format "{{.Names}}: {{.Status}}"` |
| `-n`         | `--last`   | Show n last created containers (includes all states)    | `docker ps -n 5`                               |
| `-l`         | `--latest` | Show the latest created container (includes all states) | `docker ps -l`                                 |
| `--no-trunc` | -          | Don't truncate output                                   | `docker ps --no-trunc`                         |

**Common usage:**

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List only container IDs
docker ps -q

# List with custom format
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Filter by status
docker ps -f "status=running"
docker ps -f "status=exited"
```

---

## docker logs

Fetch logs from a container.

**Basic syntax:** `docker logs [OPTIONS] CONTAINER`

| Flag        | Long Form      | Description                                 | Example                              |
| ----------- | -------------- | ------------------------------------------- | ------------------------------------ |
| `-f`        | `--follow`     | Follow log output (stream in real-time)     | `docker logs -f web`                 |
| `-t`        | `--timestamps` | Show timestamps                             | `docker logs -t web`                 |
| `--tail`    | -              | Show only last N lines                      | `docker logs --tail 100 web`         |
| `--since`   | -              | Show logs since timestamp or relative time  | `docker logs --since 5m web`         |
| `--until`   | -              | Show logs before timestamp or relative time | `docker logs --until 2024-01-01 web` |
| `--details` | -              | Show extra details provided to logs         | `docker logs --details web`          |

**Common usage:**

```bash
# View all logs
docker logs web

# Stream logs in real-time
docker logs -f web

# Show last 50 lines with timestamps
docker logs -t --tail 50 web

# Show logs from last 10 minutes
docker logs --since 10m web

# Follow logs from specific time
docker logs -f --since 2024-01-01T10:00:00 web
```

---

## docker exec

Execute a command in a running container.

**Basic syntax:** `docker exec [OPTIONS] CONTAINER COMMAND [ARG...]`

| Flag           | Long Form       | Description                              | Example                                     |
| -------------- | --------------- | ---------------------------------------- | ------------------------------------------- |
| `-i`           | `--interactive` | Keep STDIN open even if not attached     | `docker exec -i web cat file.txt`           |
| `-t`           | `--tty`         | Allocate a pseudo-TTY (terminal)         | `docker exec -t web ls`                     |
| `-it`          | -               | Interactive terminal (combine -i and -t) | `docker exec -it web bash`                  |
| `-d`           | `--detach`      | Run command in background                | `docker exec -d web touch /tmp/execWorks`   |
| `-w`           | `--workdir`     | Working directory inside container       | `docker exec -w /app web npm test`          |
| `-u`           | `--user`        | Username or UID                          | `docker exec -u node web npm install`       |
| `-e`           | `--env`         | Set environment variables                | `docker exec -e DEBUG=1 web node script.js` |
| `--privileged` | -               | Give extended privileges to the command  | `docker exec --privileged web mount`        |

**Common usage:**

```bash
# Open interactive shell
docker exec -it web bash
docker exec -it web sh  # For Alpine-based images

# Run a single command
docker exec web ls -la /app

# Run command as specific user
docker exec -u node web npm install

# Run command with environment variable
docker exec -e DEBUG=1 web node debug.js
```

---

## docker images

List images.

**Basic syntax:** `docker images [OPTIONS] [REPOSITORY[:TAG]]`

| Flag         | Long Form  | Description                                         | Example                                             |
| ------------ | ---------- | --------------------------------------------------- | --------------------------------------------------- |
| `-a`         | `--all`    | Show all images (default hides intermediate images) | `docker images -a`                                  |
| `-q`         | `--quiet`  | Only show image IDs                                 | `docker images -q`                                  |
| `--no-trunc` | -          | Don't truncate output                               | `docker images --no-trunc`                          |
| `-f`         | `--filter` | Filter output based on conditions                   | `docker images -f "dangling=true"`                  |
| `--format`   | -          | Pretty-print images using a Go template             | `docker images --format "{{.Repository}}:{{.Tag}}"` |
| `--digests`  | -          | Show digests                                        | `docker images --digests`                           |

**Common usage:**

```bash
# List all images
docker images

# List only image IDs
docker images -q

# List dangling images (untagged)
docker images -f "dangling=true"

# List with custom format
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# List specific repository
docker images nginx
```

---

## docker pull / push

Pull or push an image from/to a registry.

**Basic syntax:**

- `docker pull [OPTIONS] NAME[:TAG]`
- `docker push [OPTIONS] NAME[:TAG]`

| Flag                      | Long Form    | Description                                      | Example                                           |
| ------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------- |
| `-a`                      | `--all-tags` | Download all tagged images in the repository     | `docker pull -a ubuntu`                           |
| `--platform`              | -            | Set platform if server is multi-platform capable | `docker pull --platform linux/arm64 nginx`        |
| `-q`                      | `--quiet`    | Suppress verbose output                          | `docker pull -q nginx`                            |
| `--disable-content-trust` | -            | Skip image verification (default: true)          | `docker pull --disable-content-trust=false nginx` |

**Common usage:**

```bash
# Pull latest version
docker pull nginx

# Pull specific version
docker pull nginx:1.24-alpine

# Pull all tags
docker pull -a nginx

# Push to Docker Hub
docker push username/myapp:latest

# Push to private registry
docker push registry.example.com/myapp:v1.0
```

---

## docker rm / rmi

Remove containers or images.

**Basic syntax:**

- `docker rm [OPTIONS] CONTAINER [CONTAINER...]`
- `docker rmi [OPTIONS] IMAGE [IMAGE...]`

### docker rm (remove containers)

| Flag | Long Form   | Description                                        | Example               |
| ---- | ----------- | -------------------------------------------------- | --------------------- |
| `-f` | `--force`   | Force removal (even if running)                    | `docker rm -f web`    |
| `-v` | `--volumes` | Remove anonymous volumes associated with container | `docker rm -v web`    |
| `-l` | `--link`    | Remove the specified link                          | `docker rm -l web_db` |

### docker rmi (remove images)

| Flag         | Long Form | Description                   | Example                       |
| ------------ | --------- | ----------------------------- | ----------------------------- |
| `-f`         | `--force` | Force removal of the image    | `docker rmi -f nginx`         |
| `--no-prune` | -         | Don't delete untagged parents | `docker rmi --no-prune nginx` |

**Common usage:**

```bash
# Remove stopped container
docker rm web

# Force remove running container
docker rm -f web

# Remove multiple containers
docker rm web api db

# Remove all stopped containers
docker rm $(docker ps -aq -f status=exited)

# Remove image
docker rmi nginx:latest

# Force remove image
docker rmi -f myapp:v1.0

# Remove all dangling images
docker rmi $(docker images -f "dangling=true" -q)
```

---

## docker compose

Define and run multi-container applications.

**Basic syntax:** `docker compose [OPTIONS] [COMMAND]`

### Common Commands and Flags

#### docker compose up

| Flag               | Description                                        | Example                              |
| ------------------ | -------------------------------------------------- | ------------------------------------ |
| `-d`, `--detach`   | Run containers in background                       | `docker compose up -d`               |
| `--build`          | Build images before starting containers            | `docker compose up --build`          |
| `--force-recreate` | Recreate containers even if config hasn't changed  | `docker compose up --force-recreate` |
| `--no-deps`        | Don't start linked services                        | `docker compose up --no-deps web`    |
| `--scale`          | Scale SERVICE to NUM instances                     | `docker compose up --scale web=3`    |
| `--remove-orphans` | Remove containers for services not in compose file | `docker compose up --remove-orphans` |
| `-t`, `--timeout`  | Shutdown timeout in seconds (default: 10)          | `docker compose up -t 30`            |

#### docker compose down

| Flag               | Description                                        | Example                                |
| ------------------ | -------------------------------------------------- | -------------------------------------- |
| `-v`, `--volumes`  | Remove named volumes and anonymous volumes         | `docker compose down -v`               |
| `--rmi`            | Remove images (all or local)                       | `docker compose down --rmi all`        |
| `--remove-orphans` | Remove containers for services not in compose file | `docker compose down --remove-orphans` |
| `-t`, `--timeout`  | Shutdown timeout in seconds                        | `docker compose down -t 30`            |

#### docker compose logs

| Flag                 | Description                      | Example                          |
| -------------------- | -------------------------------- | -------------------------------- |
| `-f`, `--follow`     | Follow log output                | `docker compose logs -f`         |
| `-t`, `--timestamps` | Show timestamps                  | `docker compose logs -t`         |
| `--tail`             | Number of lines to show from end | `docker compose logs --tail 100` |

#### docker compose ps

| Flag            | Description                                 | Example                |
| --------------- | ------------------------------------------- | ---------------------- |
| `-a`, `--all`   | Show all containers (default shows running) | `docker compose ps -a` |
| `-q`, `--quiet` | Only display IDs                            | `docker compose ps -q` |

#### docker compose exec

| Flag             | Description                      | Example                                       |
| ---------------- | -------------------------------- | --------------------------------------------- |
| `-d`, `--detach` | Detached mode                    | `docker compose exec -d web touch /tmp/test`  |
| `-T`             | Disable pseudo-TTY allocation    | `docker compose exec -T web npm test`         |
| `-u`, `--user`   | Run as specified username or UID | `docker compose exec -u node web npm install` |

**Common usage:**

```bash
# Start all services
docker compose up -d

# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Execute command in service
docker compose exec web bash

# Scale a service
docker compose up -d --scale web=3

# List services
docker compose ps
```

---

## docker network

Manage networks.

**Basic syntax:** `docker network [COMMAND]`

### Common Commands

| Command      | Description                       | Example                                    |
| ------------ | --------------------------------- | ------------------------------------------ |
| `create`     | Create a network                  | `docker network create my-network`         |
| `ls`         | List networks                     | `docker network ls`                        |
| `rm`         | Remove network                    | `docker network rm my-network`             |
| `inspect`    | Display detailed information      | `docker network inspect my-network`        |
| `connect`    | Connect container to network      | `docker network connect my-network web`    |
| `disconnect` | Disconnect container from network | `docker network disconnect my-network web` |

### docker network create flags

| Flag             | Description                                             | Example                                                 |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `--driver`, `-d` | Driver to manage the network (bridge, overlay, macvlan) | `docker network create -d bridge my-net`                |
| `--subnet`       | Subnet in CIDR format                                   | `docker network create --subnet 172.18.0.0/16 my-net`   |
| `--gateway`      | Gateway for the master subnet                           | `docker network create --gateway 172.18.0.1 my-net`     |
| `--ip-range`     | Allocate IPs from a sub-range                           | `docker network create --ip-range 172.18.5.0/24 my-net` |

**Common usage:**

```bash
# Create network
docker network create my-network

# List networks
docker network ls

# Inspect network
docker network inspect my-network

# Connect container to network
docker network connect my-network web

# Create network with custom subnet
docker network create --subnet 172.20.0.0/16 my-custom-network
```

---

## docker volume

Manage volumes.

**Basic syntax:** `docker volume [COMMAND]`

### Common Commands

| Command   | Description                  | Example                        |
| --------- | ---------------------------- | ------------------------------ |
| `create`  | Create a volume              | `docker volume create my-vol`  |
| `ls`      | List volumes                 | `docker volume ls`             |
| `rm`      | Remove volume                | `docker volume rm my-vol`      |
| `inspect` | Display detailed information | `docker volume inspect my-vol` |
| `prune`   | Remove all unused volumes    | `docker volume prune`          |

### docker volume create flags

| Flag             | Description                         | Example                                        |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| `--driver`, `-d` | Volume driver name (default: local) | `docker volume create -d local my-vol`         |
| `--label`        | Set metadata on a volume            | `docker volume create --label env=prod my-vol` |
| `--name`         | Specify volume name                 | `docker volume create --name my-data`          |

**Common usage:**

```bash
# Create volume
docker volume create my-data

# List volumes
docker volume ls

# Inspect volume
docker volume inspect my-data

# Remove volume
docker volume rm my-data

# Remove unused volumes
docker volume prune

# Use volume in container
docker run -v my-data:/app/data nginx
```

---

## Cleanup Commands

Quick reference for cleaning up Docker resources:

```bash
# Remove all stopped containers
docker rm $(docker ps -aq -f status=exited)

# Remove all dangling images
docker rmi $(docker images -f "dangling=true" -q)

# Remove all unused networks
docker network prune

# Remove all unused volumes
docker volume prune

# Remove everything unused (containers, networks, images, volumes)
docker system prune -a --volumes

# Show disk usage
docker system df
```

---

## Additional Resources

- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)
- [Docker Run Reference](https://docs.docker.com/engine/reference/run/)
- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
