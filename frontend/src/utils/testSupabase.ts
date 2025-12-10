// 测试 Supabase 数据库连接和表是否存在
import { supabase } from '@/lib/supabase.js'

export async function testSupabaseConnection() {
  console.log('开始测试 Supabase 连接...')

  // 测试认证状态
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('用户认证状态:', { user, authError })

  if (!user) {
    console.error('用户未登录')
    return { success: false, error: '用户未登录' }
  }

  // 测试 users 表是否存在
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('users 表不存在')
        return { success: false, error: 'users 表不存在' }
      }
      console.error('查询 users 表失败:', error)
      return { success: false, error: `查询 users 表失败: ${error.message}` }
    }

    console.log('users 表存在，用户数据:', data)
  } catch (e) {
    console.error('测试 users 表时发生错误:', e)
    return { success: false, error: `测试 users 表时发生错误: ${e}` }
  }

  // 测试 projects 表是否存在
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('projects 表不存在')
        return { success: false, error: 'projects 表不存在' }
      }
      console.error('查询 projects 表失败:', error)
      return { success: false, error: `查询 projects 表失败: ${error.message}` }
    }

    console.log('projects 表存在，项目数量:', data?.length || 0)
  } catch (e) {
    console.error('测试 projects 表时发生错误:', e)
    return { success: false, error: `测试 projects 表时发生错误: ${e}` }
  }

  // 测试 images 表是否存在
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('images 表不存在')
        return { success: false, error: 'images 表不存在' }
      }
      console.error('查询 images 表失败:', error)
      return { success: false, error: `查询 images 表失败: ${error.message}` }
    }

    console.log('images 表存在，图片数量:', data?.length || 0)
  } catch (e) {
    console.error('测试 images 表时发生错误:', e)
    return { success: false, error: `测试 images 表时发生错误: ${e}` }
  }

  // 测试存储桶是否存在
  try {
    const { data, error } = await supabase.storage
      .getBucket('project-images')

    if (error) {
      console.error('获取 project-images 存储桶失败:', error)
      return { success: false, error: `存储桶 project-images 不存在: ${error.message}` }
    }

    console.log('project-images 存储桶存在:', data)
  } catch (e) {
    console.error('测试存储桶时发生错误:', e)
    return { success: false, error: `测试存储桶时发生错误: ${e}` }
  }

  console.log('✅ 所有测试通过！')
  return { success: true, message: 'Supabase 连接和表结构正常' }
}