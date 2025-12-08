# Docker 部署指南

## 快速开始

### 方式 1：使用 Docker Compose（推荐）

1. **创建 docker-compose.yml**

```yaml
services:
  redink:
    image: histonemax/redink:latest
    container_name: redink
    ports:
      - "12398:12398"
    volumes:
      - ./history:/app/history
      - ./output:/app/output
    restart: unless-stopped
```

2. **启动服务**

```bash
docker-compose up -d
```

3. **访问应用**

打开浏览器访问：`http://localhost:12398`

4. **配置 API Key**

- 进入"系统设置"页面
- 启用"使用本地配置"
- 添加你的 API Key
- 配置会保存在浏览器本地

### 方式 2：使用 Docker 命令

```bash
docker run -d \
  --name redink \
  -p 12398:12398 \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  histonemax/redink:latest
```

## 自己构建镜像

如果你想自己构建镜像：

```bash
# 克隆仓库
git clone https://github.com/xianyu110/RedInk.git
cd RedInk

# 构建镜像
docker build -t redink:local .

# 运行
docker run -d \
  --name redink \
  -p 12398:12398 \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/output:/app/output \
  redink:local
```

## 使用 Nginx 反向代理（可选）

如果你想通过域名访问，可以配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:12398;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 支持
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

## 常用命令

```bash
# 查看日志
docker logs -f redink

# 停止服务
docker stop redink

# 启动服务
docker start redink

# 重启服务
docker restart redink

# 删除容器
docker rm -f redink

# 更新到最新版本
docker pull histonemax/redink:latest
docker stop redink
docker rm redink
docker-compose up -d
```

## 数据持久化

容器会将以下数据保存到挂载的目录：

- `./history` - 历史记录和生成的图片
- `./output` - 临时输出文件

确保这些目录有正确的权限：

```bash
mkdir -p history output
chmod 755 history output
```

## 环境变量配置（可选）

如果你想在服务器端配置 API Key（不推荐，建议在前端配置）：

```yaml
services:
  redink:
    image: histonemax/redink:latest
    container_name: redink
    ports:
      - "12398:12398"
    environment:
      - TEXT_PROVIDER=openai
      - TEXT_API_KEY=your-api-key
      - TEXT_BASE_URL=https://api.openai.com/v1
      - TEXT_MODEL=gpt-4o
      - IMAGE_PROVIDER=gemini
      - IMAGE_API_KEY=your-api-key
      - IMAGE_BASE_URL=https://api.gemini.com/v1
      - IMAGE_MODEL=gemini-3-pro-image-preview
    volumes:
      - ./history:/app/history
      - ./output:/app/output
    restart: unless-stopped
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker logs redink

# 检查端口是否被占用
lsof -i :12398
```

### 无法访问

1. 检查防火墙是否开放 12398 端口
2. 检查容器是否正在运行：`docker ps`
3. 检查日志：`docker logs redink`

### 图片生成失败

1. 确保在前端配置了正确的 API Key
2. 检查 API Key 是否有效
3. 查看容器日志获取详细错误信息

## 性能优化

### 使用 Redis 缓存（可选）

```yaml
services:
  redink:
    image: histonemax/redink:latest
    container_name: redink
    ports:
      - "12398:12398"
    environment:
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./history:/app/history
      - ./output:/app/output
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redink-redis
    restart: unless-stopped
```

## 安全建议

1. **不要在环境变量中存储 API Key**，使用前端本地配置
2. **使用 HTTPS**：配置 Nginx + Let's Encrypt
3. **限制访问**：使用防火墙或 Nginx 访问控制
4. **定期备份**：备份 `history` 目录

## 更新应用

```bash
# 拉取最新镜像
docker pull histonemax/redink:latest

# 停止并删除旧容器
docker stop redink
docker rm redink

# 启动新容器
docker-compose up -d

# 或使用 docker run
docker run -d \
  --name redink \
  -p 12398:12398 \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  histonemax/redink:latest
```

## 支持

如果遇到问题，请查看：
- GitHub Issues: https://github.com/xianyu110/RedInk/issues
- 项目文档: https://github.com/xianyu110/RedInk
