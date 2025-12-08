"""
Vercel Serverless Function: 图片生成
路由: /api/generate
"""
import sys
import os
import json
import base64
import logging

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.services.image import get_image_service
from http.server import BaseHTTPRequestHandler

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function Handler"""
    
    def do_POST(self):
        """处理 POST 请求（SSE 流式返回）"""
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            pages = data.get('pages')
            task_id = data.get('task_id')
            full_outline = data.get('full_outline', '')
            user_topic = data.get('user_topic', '')

            # 解析 base64 格式的用户参考图片
            user_images = []
            images_base64 = data.get('user_images', [])
            if images_base64:
                for img_b64 in images_base64:
                    if ',' in img_b64:
                        img_b64 = img_b64.split(',')[1]
                    user_images.append(base64.b64decode(img_b64))

            # 验证参数
            if not pages:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': '参数错误：pages 不能为空'
                }, ensure_ascii=False).encode('utf-8'))
                return

            # 从请求头获取用户配置的 API Key
            api_key = self.headers.get('X-API-Key')
            base_url = self.headers.get('X-Base-URL')
            model = self.headers.get('X-Model')
            high_concurrency = self.headers.get('X-High-Concurrency', 'false').lower() == 'true'
            
            # 如果用户提供了配置，临时设置环境变量
            if api_key:
                os.environ['IMAGE_API_KEY'] = api_key
                if base_url:
                    os.environ['IMAGE_BASE_URL'] = base_url
                if model:
                    os.environ['IMAGE_MODEL'] = model
                os.environ['IMAGE_PROVIDER'] = 'gemini'  # 默认使用 Gemini

            logger.info(f"开始图片生成任务: {task_id}, 共 {len(pages)} 页")
            image_service = get_image_service()

            # 发送 SSE 响应头
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('X-Accel-Buffering', 'no')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            # 流式发送事件
            for event in image_service.generate_images(
                pages, task_id, full_outline,
                user_images=user_images if user_images else None,
                user_topic=user_topic
            ):
                event_type = event["event"]
                event_data = event["data"]

                # 格式化为 SSE 格式
                sse_data = f"event: {event_type}\ndata: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                self.wfile.write(sse_data.encode('utf-8'))
                self.wfile.flush()

        except Exception as e:
            logger.error(f"图片生成异常: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': f'图片生成异常: {str(e)}'
            }, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Base-URL, X-Model, X-High-Concurrency')
        self.end_headers()
