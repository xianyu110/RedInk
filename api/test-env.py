"""
Vercel Serverless Function: 测试环境变量设置
路由: /api/test-env
"""
from http.server import BaseHTTPRequestHandler
import json
import os


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 从请求头获取 API Key
            api_key = self.headers.get('X-API-Key')
            base_url = self.headers.get('X-Base-URL')
            model = self.headers.get('X-Model')
            
            # 尝试设置环境变量
            if api_key:
                os.environ['TEST_API_KEY'] = api_key
            if base_url:
                os.environ['TEST_BASE_URL'] = base_url
            if model:
                os.environ['TEST_MODEL'] = model
            
            # 读取环境变量
            response = {
                'success': True,
                'received_from_headers': {
                    'api_key': api_key,
                    'base_url': base_url,
                    'model': model
                },
                'set_in_env': {
                    'TEST_API_KEY': os.environ.get('TEST_API_KEY'),
                    'TEST_BASE_URL': os.environ.get('TEST_BASE_URL'),
                    'TEST_MODEL': os.environ.get('TEST_MODEL')
                },
                'env_set_success': (
                    os.environ.get('TEST_API_KEY') == api_key and
                    os.environ.get('TEST_BASE_URL') == base_url and
                    os.environ.get('TEST_MODEL') == model
                )
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False, indent=2).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': str(e),
                'type': type(e).__name__
            }
            
            self.wfile.write(json.dumps(error_response, indent=2).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Base-URL, X-Model')
        self.end_headers()
