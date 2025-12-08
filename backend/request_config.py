"""
请求级别的配置管理
用于从 HTTP 请求头中读取用户提供的 API Key
"""
import threading

# 使用线程本地存储来保存请求级别的配置
_request_local = threading.local()


def set_request_config(api_key: str = None, base_url: str = None, model: str = None, 
                       service: str = 'text', high_concurrency: bool = False):
    """
    设置当前请求的配置
    
    Args:
        api_key: API Key
        base_url: Base URL
        model: 模型名称
        service: 服务类型 ('text' 或 'image')
        high_concurrency: 是否高并发
    """
    if not hasattr(_request_local, 'config'):
        _request_local.config = {}
    
    _request_local.config[service] = {
        'api_key': api_key,
        'base_url': base_url,
        'model': model,
        'high_concurrency': high_concurrency
    }


def get_request_config(service: str = 'text'):
    """
    获取当前请求的配置
    
    Args:
        service: 服务类型 ('text' 或 'image')
        
    Returns:
        dict: 配置字典，如果没有配置则返回 None
    """
    if not hasattr(_request_local, 'config'):
        return None
    
    return _request_local.config.get(service)


def clear_request_config():
    """清除当前请求的配置"""
    if hasattr(_request_local, 'config'):
        _request_local.config = {}


def has_request_config(service: str = 'text'):
    """检查是否有请求级别的配置"""
    config = get_request_config(service)
    return config is not None and config.get('api_key') is not None
