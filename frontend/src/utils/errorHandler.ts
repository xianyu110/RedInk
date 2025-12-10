// Supabase 错误处理工具
export function handleSupabaseError(error: any): string {
  if (!error) return '未知错误'

  // Auth 错误
  if (error.status === 422) {
    if (error.message?.includes('Password')) {
      return '密码至少需要6个字符'
    }
    if (error.message?.includes('Email')) {
      return '请输入有效的邮箱地址'
    }
    return '请求参数错误，请检查输入'
  }

  if (error.status === 400) {
    if (error.message?.includes('Invalid login')) {
      return '邮箱或密码错误'
    }
    if (error.message?.includes('User already registered')) {
      return '该邮箱已注册'
    }
    return '请求失败，请重试'
  }

  if (error.status === 429) {
    return '请求过于频繁，请稍后再试'
  }

  // 数据库错误
  if (error.code === 'PGRST116') {
    return '数据未找到'
  }

  if (error.code === '23505') {
    return '数据已存在'
  }

  // 网络错误
  if (error.message?.includes('NetworkError')) {
    return '网络连接失败，请检查网络'
  }

  // 默认错误
  return error.message || '操作失败，请重试'
}