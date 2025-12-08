#!/bin/bash

# 红墨 AI 图文生成器 - Docker 快速部署脚本

set -e

echo "🚀 红墨 AI 图文生成器 - Docker 部署"
echo "=================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：未检测到 Docker，请先安装 Docker"
    echo "   访问：https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误：未检测到 Docker Compose，请先安装"
    echo "   访问：https://docs.docker.com/compose/install/"
    exit 1
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p history output
chmod 755 history output

# 停止并删除旧容器（如果存在）
if docker ps -a | grep -q redink; then
    echo "🛑 停止旧容器..."
    docker stop redink 2>/dev/null || true
    docker rm redink 2>/dev/null || true
fi

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull histonemax/redink:latest

# 启动容器
echo "🚀 启动容器..."
docker run -d \
  --name redink \
  -p 12398:12398 \
  -v $(pwd)/history:/app/history \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  histonemax/redink:latest

# 等待容器启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查容器状态
if docker ps | grep -q redink; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "📝 访问地址："
    echo "   http://localhost:12398"
    echo ""
    echo "🔧 常用命令："
    echo "   查看日志：docker logs -f redink"
    echo "   停止服务：docker stop redink"
    echo "   启动服务：docker start redink"
    echo "   重启服务：docker restart redink"
    echo ""
    echo "💡 提示："
    echo "   1. 访问 http://localhost:12398 打开应用"
    echo "   2. 进入"系统设置"配置 API Key"
    echo "   3. 启用"使用本地配置""
    echo ""
else
    echo ""
    echo "❌ 部署失败，请查看日志："
    echo "   docker logs redink"
    exit 1
fi
