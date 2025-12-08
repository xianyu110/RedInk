"""
Vercel Serverless Function: 大纲生成
路由: /api/outline
"""
import sys
import os
import json
import base64
import traceback
from http.server import BaseHTTPRequestHandler

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class handler(BaseHTTPRequestHandler):
    """Vercel Serverless Function Handler"""
    
    def do_POST(self):
        """处理 POST 请求"""
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            topic = data.get('topic')
            images_base64 = data.get('images', [])

            # 验证参数
            if not topic:
                self._send_error(400, '参数错误：topic 不能为空')
                return

            # 解析 base64 图片
            images = []
            if images_base64:
                for img_b64 in images_base64:
                    if ',' in img_b64:
                        img_b64 = img_b64.split(',')[1]
                    images.append(base64.b64decode(img_b64))

            # 从请求头获取用户配置的 API Key
            api_key = self.headers.get('X-API-Key')
            base_url = self.headers.get('X-Base-URL')
            model = self.headers.get('X-Model')
            
            # 如果用户提供了配置，临时设置环境变量
            if api_key:
                os.environ['TEXT_API_KEY'] = api_key
                if base_url:
                    os.environ['TEXT_BASE_URL'] = base_url
                if model:
                    os.environ['TEXT_MODEL'] = model
                os.environ['TEXT_PROVIDER'] = 'openai'  # 默认使用 OpenAI 兼容接口

            # 动态导入服务（避免启动时导入失败）
            try:
                from backend.services.outline import get_outline_service
                outline_service = get_outline_service()
                result = outline_service.generate_outline(topic, images if images else None)
                
                # 返回结果
                status_code = 200 if result['success'] else 500
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                
            except ImportError as e:
                self._send_error(500, f'导入模块失败: {str(e)}\n请检查 requirements.txt 是否包含所有依赖')
            except Exception as e:
                self._send_error(500, f'大纲生成失败: {str(e)}')

        except json.JSONDecodeError as e:
            self._send_error(400, f'JSON 解析失败: {str(e)}')
        except Exception as e:
            error_detail = traceback.format_exc()
            self._send_error(500, f'请求处理异常: {str(e)}\n{error_detail}')
    
    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Base-URL, X-Model')
        self.end_headers()
    
    def _send_error(self, status_code, error_message):
        """发送错误响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'error': error_message
        }, ensure_ascii=False).encode('utf-8'))
