# 前端 Dockerfile
# 阶段1: 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm（与 packageManager 保持一致）
RUN npm install -g pnpm@9.8.0

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目源代码（.dockerignore 会排除 node_modules）
COPY . .

# 构建项目
RUN pnpm run build

# 阶段2: 运行阶段
FROM nginx:alpine

# 配置 Alpine 镜像源（使用阿里云镜像，加快下载速度）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装 envsubst 工具（用于替换环境变量）
RUN apk add --no-cache gettext

# 复制自定义 Nginx 配置模板
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 从构建阶段复制构建产物到 Nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建启动脚本
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$$BACKEND_URL'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# 设置环境变量默认值（通过 docker-compose 覆盖）
ENV BACKEND_URL=http://backend:3000

# 暴露端口
EXPOSE 80

# 使用自定义启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]
