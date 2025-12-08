"""用户认证路由"""

import json
import uuid
import jwt
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from backend.models.user import User
from backend.storage import get_storage

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT 密钥（实际使用时应从环境变量获取）
JWT_SECRET_KEY = 'your-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = timedelta(days=7)  # 7天过期


def generate_token(user_id: str) -> str:
    """生成 JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + JWT_EXPIRATION_DELTA,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """解码 JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}


def get_current_user():
    """获取当前用户"""
    token = None
    auth_header = request.headers.get('Authorization')

    if auth_header:
        try:
            token = auth_header.split(' ')[1]  # Bearer <token>
        except IndexError:
            pass

    if not token:
        return None

    # 解码 token
    payload = decode_token(token)
    if 'error' in payload:
        return None

    # 从存储中获取用户
    storage = get_storage()
    user_data = storage.get_user(payload['user_id'])
    if not user_data:
        return None

    return User.from_dict(user_data)


@bp.route('/login', methods=['POST'])
def login():
    """用户登录（邮箱登录，不需要密码）"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({
                'success': False,
                'error': '请输入邮箱地址'
            }), 400

        # 简单的邮箱格式验证
        if '@' not in email:
            return jsonify({
                'success': False,
                'error': '请输入有效的邮箱地址'
            }), 400

        # 获取或创建用户
        storage = get_storage()
        user_data = storage.get_user_by_email(email)

        if user_data:
            # 用户已存在
            user = User.from_dict(user_data)
            user.update_last_login()
            storage.update_user(user.to_dict())
        else:
            # 创建新用户
            user = User(email=email)
            storage.create_user(user.to_dict())

        # 生成 token
        token = generate_token(user.id)

        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': token
            }
        })

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'error': '登���失败，请稍后重试'
        }), 500


@bp.route('/me', methods=['GET'])
def get_user_info():
    """获取当前用户信息"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '未登录'
        }), 401

    return jsonify({
        'success': True,
        'data': user.to_dict()
    })


@bp.route('/update-profile', methods=['POST'])
def update_profile():
    """更新用户资料"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '未登录'
        }), 401

    try:
        data = request.get_json()

        # 更新允许的字段
        if 'name' in data:
            user.name = data['name'].strip()
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']
        if 'preferences' in data:
            user.preferences = data['preferences']

        user.updated_at = datetime.utcnow()

        # 保存到存储
        storage = get_storage()
        storage.update_user(user.to_dict())

        return jsonify({
            'success': True,
            'data': user.to_dict()
        })

    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({
            'success': False,
            'error': '更新失败，请稍后重试'
        }), 500


@bp.route('/logout', methods=['POST'])
def logout():
    """用户登出（客户端删除 token 即可）"""
    return jsonify({
        'success': True,
        'message': '已登出'
    })