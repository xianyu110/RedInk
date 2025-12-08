"""
Vercel Serverless Function: 调试信息
路由: /api/debug
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 收集环境信息
            info = {
                'success': True,
                'python_version': sys.version,
                'python_path': sys.path[:5],
                'cwd': os.getcwd(),
                'env_vars': {
                    'has_google_api_key': bool(os.environ.get('GOOGLE_API_KEY')),
                    'has_gemini_api_key': bool(os.environ.get('GEMINI_API_KEY')),
                    'path': os.environ.get('PATH', '')[:200]
                },
                'files_in_root': [],
                'files_in_backend': []
            }
            
            # 列出根目录文件
            try:
                root_dir = os.path.join(os.path.dirname(__file__), '..')
                info['files_in_root'] = os.listdir(root_dir)[:20]
            except Exception as e:
                info['files_in_root'] = [f'Error: {str(e)}']
            
            # 列出 backend 目录
            try:
                backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
                if os.path.exists(backend_dir):
                    info['files_in_backend'] = os.listdir(backend_dir)[:20]
                else:
                    info['files_in_backend'] = ['backend directory not found']
            except Exception as e:
                info['files_in_backend'] = [f'Error: {str(e)}']
            
            # 测试导入
            info['imports'] = {}
            
            # 测试基础导入
            try:
                import yaml
                info['imports']['yaml'] = 'OK'
            except ImportError as e:
                info['imports']['yaml'] = f'Failed: {str(e)}'
            
            try:
                import requests
                info['imports']['requests'] = 'OK'
            except ImportError as e:
                info['imports']['requests'] = f'Failed: {str(e)}'
            
            try:
                from google import genai
                info['imports']['google.genai'] = 'OK'
            except ImportError as e:
                info['imports']['google.genai'] = f'Failed: {str(e)}'
            
            # 测试 backend 导入
            try:
                sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
                from backend.services.outline import get_outline_service
                info['imports']['backend.services.outline'] = 'OK'
            except ImportError as e:
                info['imports']['backend.services.outline'] = f'Failed: {str(e)}'
            except Exception as e:
                info['imports']['backend.services.outline'] = f'Error: {str(e)}'
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(info, ensure_ascii=False, indent=2).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_info = {
                'success': False,
                'error': str(e),
                'type': type(e).__name__
            }
            
            self.wfile.write(json.dumps(error_info, indent=2).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
