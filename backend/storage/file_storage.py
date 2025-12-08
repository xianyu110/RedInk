"""基于文件系统的存储实现"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path


class FileStorage:
    """基于文件系统的存储实现"""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "data"
            )
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

        # 用户存储目录
        self.users_dir = self.base_dir / "users"
        self.users_dir.mkdir(exist_ok=True)

        # 历史记录存储目录
        self.history_dir = self.base_dir / "history"
        self.history_dir.mkdir(exist_ok=True)

        # 索引文件
        self.users_index = self.users_dir / "index.json"
        self.history_index = self.history_dir / "index.json"

        self._init_indexes()

    def _init_indexes(self):
        """初始化索引文件"""
        if not self.users_index.exists():
            with open(self.users_index, "w", encoding="utf-8") as f:
                json.dump({"users": {}}, f, ensure_ascii=False, indent=2)

        if not self.history_index.exists():
            with open(self.history_index, "w", encoding="utf-8") as f:
                json.dump({"records": []}, f, ensure_ascii=False, indent=2)

    # ==================== 用户相关操作 ====================

    def create_user(self, user_data: Dict) -> None:
        """创建用户"""
        users = self._load_users_index()
        users["users"][user_data["id"]] = user_data
        self._save_users_index(users)

    def get_user(self, user_id: str) -> Optional[Dict]:
        """获取用户"""
        users = self._load_users_index()
        return users["users"].get(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """通过邮箱获取用户"""
        users = self._load_users_index()
        for user in users["users"].values():
            if user.get("email", "").lower() == email.lower():
                return user
        return None

    def update_user(self, user_data: Dict) -> None:
        """更新用户"""
        users = self._load_users_index()
        if user_data["id"] in users["users"]:
            users["users"][user_data["id"]] = user_data
            self._save_users_index(users)

    def _load_users_index(self) -> Dict:
        """加载用户索引"""
        try:
            with open(self.users_index, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"users": {}}

    def _save_users_index(self, data: Dict) -> None:
        """保存用户索引"""
        with open(self.users_index, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # ==================== 历史记录相关操作 ====================

    def create_history_record(self, user_id: str, record_data: Dict) -> None:
        """创建历史记录"""
        # 添加用户ID
        record_data["user_id"] = user_id

        # 保存记录文件
        record_path = self.history_dir / f"{record_data['id']}.json"
        with open(record_path, "w", encoding="utf-8") as f:
            json.dump(record_data, f, ensure_ascii=False, indent=2)

        # 更新索引
        records = self._load_history_index()
        records["records"].insert(0, {
            "id": record_data["id"],
            "user_id": user_id,
            "title": record_data.get("title", ""),
            "created_at": record_data.get("created_at"),
            "updated_at": record_data.get("updated_at"),
            "status": record_data.get("status", "draft"),
            "thumbnail": record_data.get("thumbnail"),
            "page_count": len(record_data.get("outline", {}).get("pages", [])),
            "task_id": record_data.get("images", {}).get("task_id")
        })
        self._save_history_index(records)

    def get_history_record(self, record_id: str) -> Optional[Dict]:
        """获取历史记录"""
        record_path = self.history_dir / f"{record_id}.json"
        if not record_path.exists():
            return None

        try:
            with open(record_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def get_user_history_records(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None
    ) -> Dict:
        """获取用户的历史记录列表"""
        records = self._load_history_index()

        # 过滤用户记录
        user_records = [
            r for r in records["records"]
            if r.get("user_id") == user_id
        ]

        # 过滤状态
        if status:
            user_records = [r for r in user_records if r.get("status") == status]

        # 排序（最新在前）
        user_records.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        # 分页
        total = len(user_records)
        start = (page - 1) * page_size
        end = start + page_size
        page_records = user_records[start:end]

        return {
            "success": True,
            "records": page_records,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    def update_history_record(self, record_id: str, updates: Dict) -> None:
        """更新历史记录"""
        record_path = self.history_dir / f"{record_id}.json"
        if not record_path.exists():
            return

        # 加载并更新记录
        with open(record_path, "r", encoding="utf-8") as f:
            record = json.load(f)

        record.update(updates)
        record["updated_at"] = datetime.utcnow().isoformat()

        # 保存记录
        with open(record_path, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)

        # 更新索引
        records = self._load_history_index()
        for i, r in enumerate(records["records"]):
            if r["id"] == record_id:
                records["records"][i].update({
                    "title": record.get("title", r["title"]),
                    "updated_at": record["updated_at"],
                    "status": record.get("status", r["status"]),
                    "thumbnail": record.get("thumbnail", r["thumbnail"]),
                    "page_count": len(record.get("outline", {}).get("pages", []))
                })
                break
        self._save_history_index(records)

    def delete_history_record(self, record_id: str, user_id: str) -> bool:
        """删除历史记录"""
        record = self.get_history_record(record_id)
        if not record or record.get("user_id") != user_id:
            return False

        # 删除记录文件
        record_path = self.history_dir / f"{record_id}.json"
        if record_path.exists():
            record_path.unlink()

        # 从索引中删除
        records = self._load_history_index()
        records["records"] = [
            r for r in records["records"]
            if r["id"] != record_id
        ]
        self._save_history_index(records)

        return True

    def _load_history_index(self) -> Dict:
        """加载历史记录索引"""
        try:
            with open(self.history_index, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"records": []}

    def _save_history_index(self, data: Dict) -> None:
        """保存历史记录索引"""
        with open(self.history_index, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


# 全局存储实例
_storage = None


def get_storage() -> FileStorage:
    """获取存储实例"""
    global _storage
    if _storage is None:
        _storage = FileStorage()
    return _storage