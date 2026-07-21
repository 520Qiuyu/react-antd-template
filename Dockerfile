# 前端 Dockerfile（仅构建静态资源，由本机 nginx 托管）
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.8.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---------- 导出阶段：将 dist 复制到挂载目录 ----------
FROM alpine:3.20

WORKDIR /dist

COPY --from=builder /app/dist ./

# /output 由 compose 挂载为 ./deploy/frontend
CMD ["sh", "-c", "find /output -mindepth 1 -delete; cp -a /dist/. /output/ && echo 'Frontend assets copied to deploy/frontend'"]
