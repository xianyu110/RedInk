import json
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# 添加后端路径到 Python 路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.config import Config
from backend.routes import register_routes

# 创建 Flask 应用
app = Flask(__name__)
CORS(app)

# 配置
Config.initialize()

# 注册路由
register_routes(app)

@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': '红墨 AI 图文生成器 API',
        'version': '1.0.0'
    })

# Vercel 需要的 handler
def handler(environ, start_response):
    return app(environ, start_response)

# 本地开发时使用
if __name__ == '__main__':
    app.run(debug=True, port=5000)