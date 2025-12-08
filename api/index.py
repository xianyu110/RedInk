from flask import Flask, jsonify
from flask_cors import CORS
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.routes import register_routes

# 创建 Flask 应用
app = Flask(__name__)
app.config['DEBUG'] = False
app.config['OUTPUT_DIR'] = '/tmp/output'  # Vercel 只允许写入 /tmp 目录

# 配置 CORS - 允许所有来源（生产环境建议限制）
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 确保输出目录存在
os.makedirs(app.config['OUTPUT_DIR'], exist_ok=True)

# 注册所有路由
register_routes(app)

@app.route('/')
@app.route('/api')
def index():
    return jsonify({
        'status': 'success',
        'message': '红墨 AI 图文生成器 API',
        'version': '1.5.0',
        'platform': 'Vercel'
    })

# 本地开发时使用
if __name__ == '__main__':
    app.run(debug=True, port=5000)