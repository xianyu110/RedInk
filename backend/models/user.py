"""用户模型"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from werkzeug.security import generate_password_hash, check_password_hash


class User:
    """用户模型"""

    def __init__(
        self,
        email: str,
        name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        **kwargs
    ):
        self.id = str(uuid.uuid4())
        self.email = email.lower().strip()
        self.name = name or email.split('@')[0]
        self.avatar_url = avatar_url
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.last_login_at = None
        self.is_active = True

        # 可选字段
        self.preferences = kwargs.get('preferences', {})

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'is_active': self.is_active,
            'preferences': self.preferences
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """从字典创建用户"""
        user = cls(
            email=data['email'],
            name=data.get('name'),
            avatar_url=data.get('avatar_url'),
            preferences=data.get('preferences', {})
        )
        user.id = data['id']
        user.created_at = datetime.fromisoformat(data['created_at'])
        user.updated_at = datetime.fromisoformat(data['updated_at'])
        if data.get('last_login_at'):
            user.last_login_at = datetime.fromisoformat(data['last_login_at'])
        user.is_active = data.get('is_active', True)
        return user

    def update_last_login(self):
        """更新最后登录时间"""
        self.last_login_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


class UserSession:
    """用户会话模型"""

    def __init__(self, user_id: str):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.created_at = datetime.utcnow()
        self.expires_at = datetime.utcnow()
        self.is_active = True

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active
        }