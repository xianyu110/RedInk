"""历史记录相关 API 路由"""

import os
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.storage import get_storage
from backend.routes.auth import get_current_user

bp = Blueprint('history', __name__)


@bp.route('/history', methods=['POST'])
def create_history():
    """创建历史记录"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        data = request.get_json()
        topic = data.get('topic')
        outline = data.get('outline')
        task_id = data.get('task_id')

        if not topic or not outline:
            return jsonify({
                'success': False,
                'error': '主题和大纲不能为空'
            }), 400

        storage = get_storage()
        record_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        record_data = {
            'id': record_id,
            'title': topic,
            'created_at': now,
            'updated_at': now,
            'outline': outline,
            'images': {
                'task_id': task_id,
                'generated': []
            },
            'status': 'draft',
            'thumbnail': None
        }

        storage.create_history_record(user.id, record_data)

        return jsonify({
            'success': True,
            'record_id': record_id
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history', methods=['GET'])
def list_history():
    """获取历史记录列表"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        status = request.args.get('status')

        storage = get_storage()
        result = storage.get_user_history_records(
            user_id=user.id,
            page=page,
            page_size=page_size,
            status=status
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/<record_id>', methods=['GET'])
def get_history(record_id):
    """获取历史记录详情"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        storage = get_storage()
        record = storage.get_history_record(record_id)

        if not record or record.get('user_id') != user.id:
            return jsonify({
                'success': False,
                'error': '记录不存在'
            }), 404

        return jsonify({
            'success': True,
            'record': record
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/<record_id>', methods=['PUT'])
def update_history(record_id):
    """更新历史记录"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        data = request.get_json()
        storage = get_storage()

        # 检查记录是否属于当前用户
        record = storage.get_history_record(record_id)
        if not record or record.get('user_id') != user.id:
            return jsonify({
                'success': False,
                'error': '记录不存在'
            }), 404

        # 更新记录
        updates = {}
        if 'outline' in data:
            updates['outline'] = data['outline']
        if 'images' in data:
            updates['images'] = data['images']
        if 'status' in data:
            updates['status'] = data['status']
        if 'thumbnail' in data:
            updates['thumbnail'] = data['thumbnail']

        storage.update_history_record(record_id, updates)

        return jsonify({
            'success': True
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/<record_id>', methods=['DELETE'])
def delete_history(record_id):
    """删除历史记录"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        storage = get_storage()
        success = storage.delete_history_record(record_id, user.id)

        if not success:
            return jsonify({
                'success': False,
                'error': '记录不存在'
            }), 404

        return jsonify({
            'success': True
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/search', methods=['GET'])
def search_history():
    """搜索历史记录"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        keyword = request.args.get('keyword', '').strip()
        if not keyword:
            return jsonify({
                'success': False,
                'error': '搜索关键词不能为空'
            }), 400

        storage = get_storage()
        # 这里需要实现搜索逻辑
        # 暂时返回空结果
        return jsonify({
            'success': True,
            'records': []
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/history/stats', methods=['GET'])
def get_history_stats():
    """获取历史记录统计"""
    user = get_current_user()
    if not user:
        return jsonify({
            'success': False,
            'error': '请先登录'
        }), 401

    try:
        storage = get_storage()
        # 这里需要实现统计逻辑
        # 暂时返回空统计
        return jsonify({
            'success': True,
            'total': 0,
            'by_status': {}
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500