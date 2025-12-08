"""
Vercel Serverless Function: 测试请求头
路由: /api/test-headers
"""
from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 读取所有请求头
            headers_dict = {}
            for header, value in self.headers.items():
                headers_dict[header] = value
            
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                body_data = json.loads(body.decode('utf-8'))
            except:
                body_data = body.decode('utf-8')
            
            response = {
                'success': True,
                'headers': headers_dict,
                'body': body_data,
                'api_key_received': bool(self.headers.get('X-API-Key')),
                'base_url_received': bool(self.headers.get('X-Base-URL')),
                'model_received': bool(self.headers.get('X-Model'))
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
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Base-URL, X-Model, X-High-Concurrency')
        self.end_headers()
