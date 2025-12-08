# Supabase 集成规划 (v2.0)

## 概述

为了解决纯前端架构的存储限制问题，计划集成 Supabase 实现：
- 用户认证系统
- 云端图片存储
- 历史记录云端同步
- 多设备数据同步

## 当前问题

### localStorage 限制
- **容量限制**：5-10MB
- **无法存储图片**：图片 base64 太大
- **无法跨设备**：数据只在本地浏览器
- **无法分享**：无法分享作品给他人

### 临时图片 URL
- DALL-E 图片 URL 24小时后过期
- 用户必须及时下载图片
- 无法查看历史生成的图片

## Supabase 解决方案

### 1. 用户认证 (Supabase Auth)

#### 功能
- 邮箱 + 密码注册/登录
- 第三方登录（Google、GitHub）
- 邮箱验证
- 密码重置
- 会话管理

#### 实现
```typescript
// frontend/src/services/authService.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// 注册
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  return { data, error }
}

// 登录
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// 登出
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 获取当前用户
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### 2. 图片存储 (Supabase Storage)

#### 存储桶结构
```
redink-images/
├── {user_id}/
│   ├── {task_id}/
│   │   ├── page_1.png
│   │   ├── page_2.png
│   │   └── ...
```

#### 功能
- 上传生成的图片到云端
- 生成永久访问 URL
- 支持缩略图
- 自动压缩优化

#### 实现
```typescript
// frontend/src/services/storageService.ts
import { supabase } from './supabaseClient'

// 上传图片
export async function uploadImage(
  userId: string,
  taskId: string,
  pageIndex: number,
  imageBlob: Blob
): Promise<{ url?: string; error?: string }> {
  const fileName = `${userId}/${taskId}/page_${pageIndex + 1}.png`
  
  const { data, error } = await supabase.storage
    .from('redink-images')
    .upload(fileName, imageBlob, {
      contentType: 'image/png',
      upsert: true
    })
  
  if (error) {
    return { error: error.message }
  }
  
  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('redink-images')
    .getPublicUrl(fileName)
  
  return { url: publicUrl }
}

// 下载图片
export async function downloadImage(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from('redink-images')
    .download(path)
  
  if (error) {
    console.error('下载失败:', error)
    return null
  }
  
  return data
}

// 删除图片
export async function deleteImages(userId: string, taskId: string) {
  const { error } = await supabase.storage
    .from('redink-images')
    .remove([`${userId}/${taskId}`])
  
  return { error }
}
```

### 3. 历史记录同步 (Supabase Database)

#### 数据库表结构

```sql
-- 用户表（由 Supabase Auth 自动管理）
-- auth.users

-- 历史记录表
CREATE TABLE history_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL, -- draft, completed, partial
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 大纲数据
  outline_raw TEXT,
  outline_pages JSONB,
  
  -- 图片信息
  task_id TEXT,
  image_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  
  -- 索引
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_status (status)
);

-- 启用行级安全策略 (RLS)
ALTER TABLE history_records ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的记录
CREATE POLICY "Users can view own records"
  ON history_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON history_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON history_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON history_records FOR DELETE
  USING (auth.uid() = user_id);

-- 用户配额表
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_generations INTEGER DEFAULT 0,
  monthly_generations INTEGER DEFAULT 0,
  storage_used_mb DECIMAL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 配额限制
  max_monthly_generations INTEGER DEFAULT 100,
  max_storage_mb INTEGER DEFAULT 1000
);

-- 启用 RLS
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota"
  ON user_quotas FOR SELECT
  USING (auth.uid() = user_id);
```

#### 实现
```typescript
// frontend/src/services/historyService.ts
import { supabase } from './supabaseClient'

export interface HistoryRecord {
  id: string
  user_id: string
  title: string
  status: 'draft' | 'completed' | 'partial'
  created_at: string
  updated_at: string
  outline_raw: string
  outline_pages: Page[]
  task_id: string
  image_count: number
  thumbnail_url?: string
}

// 创建历史记录
export async function createHistory(
  title: string,
  outline: { raw: string; pages: Page[] }
): Promise<{ success: boolean; record_id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('history_records')
    .insert({
      title,
      outline_raw: outline.raw,
      outline_pages: outline.pages,
      status: 'draft'
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, record_id: data.id }
}

// 获取历史记录列表
export async function getHistoryList(
  page: number = 1,
  pageSize: number = 20,
  status?: string
) {
  let query = supabase
    .from('history_records')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  
  const { data, error, count } = await query
  
  if (error) {
    return {
      success: false,
      records: [],
      total: 0,
      page,
      page_size: pageSize,
      total_pages: 0
    }
  }
  
  return {
    success: true,
    records: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count || 0) / pageSize)
  }
}

// 更新历史记录
export async function updateHistory(
  recordId: string,
  data: Partial<HistoryRecord>
) {
  const { error } = await supabase
    .from('history_records')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// 删除历史记录
export async function deleteHistory(recordId: string) {
  const { error } = await supabase
    .from('history_records')
    .delete()
    .eq('id', recordId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
```

### 4. 实时同步 (Supabase Realtime)

#### 功能
- 多设备实时同步
- 历史记录更新通知
- 在线状态显示

#### 实现
```typescript
// 订阅历史记录变化
export function subscribeToHistory(callback: (payload: any) => void) {
  const channel = supabase
    .channel('history_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'history_records',
        filter: `user_id=eq.${getCurrentUserId()}`
      },
      callback
    )
    .subscribe()
  
  return channel
}

// 取消订阅
export function unsubscribeFromHistory(channel: any) {
  supabase.removeChannel(channel)
}
```

## 实施计划

### Phase 1: 基础集成 (Week 1-2)
- [ ] 创建 Supabase 项目
- [ ] 配置数据库表结构
- [ ] 实现用户认证功能
- [ ] 创建登录/注册页面
- [ ] 集成到现有应用

### Phase 2: 图片存储 (Week 3-4)
- [ ] 配置 Storage 存储桶
- [ ] 实现图片上传功能
- [ ] 修改图片生成流程（生成后自动上传）
- [ ] 更新历史记录显示（使用云端 URL）
- [ ] 实现图片下载和删除

### Phase 3: 数据同步 (Week 5-6)
- [ ] 实现历史记录云端同步
- [ ] 添加离线支持（本地缓存）
- [ ] 实现冲突解决机制
- [ ] 多设备数据同步测试

### Phase 4: 优化和扩展 (Week 7-8)
- [ ] 添加用户配额管理
- [ ] 实现作品分享功能
- [ ] 创建公开作品广场
- [ ] 性能优化和测试
- [ ] 文档完善

## 环境配置

### 环境变量
```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase 项目设置
1. 创建新项目
2. 配置数据库表
3. 设置 Storage 存储桶
4. 配置 RLS 策略
5. 启用 Realtime

## 成本估算

### Supabase 免费套餐
- **数据库**：500MB
- **存储**：1GB
- **带宽**：2GB/月
- **认证用户**：50,000 MAU

### 预估使用量
- 每个用户平均 10 条历史记录
- 每条记录 8 张图片，每张 500KB
- 每个用户约 40MB 存储

**免费套餐可支持约 25 个活跃用户**

### 付费套餐 (Pro - $25/月)
- **数据库**：8GB
- **存储**：100GB
- **带宽**：50GB/月
- **认证用户**：100,000 MAU

**Pro 套餐可支持约 2500 个活跃用户**

## 迁移策略

### 从 localStorage 迁移
1. 检测用户登录状态
2. 读取 localStorage 中的历史记录
3. 提示用户是否迁移到云端
4. 批量上传到 Supabase
5. 迁移完成后清理本地数据

```typescript
// 迁移工具
export async function migrateFromLocalStorage() {
  const localRecords = JSON.parse(localStorage.getItem('redink-history') || '[]')
  
  if (localRecords.length === 0) {
    return { success: true, migrated: 0 }
  }
  
  let migrated = 0
  for (const record of localRecords) {
    const result = await createHistory(record.title, record.outline)
    if (result.success) {
      migrated++
    }
  }
  
  // 清理本地数据
  localStorage.removeItem('redink-history')
  
  return { success: true, migrated }
}
```

## 安全考虑

### 数据安全
- 使用 RLS 确保用户只能访问自己的数据
- API Key 存储在环境变量
- 图片 URL 使用签名 URL（可选）

### 隐私保护
- 用户可以选择不上传图片
- 支持完全删除账户和数据
- 遵守 GDPR 和数据保护法规

## 用户体验

### 登录流程
1. 首次访问：提示注册/登录
2. 可选择"游客模式"继续使用（localStorage）
3. 登录后自动同步数据

### 离线支持
- 离线时使用 localStorage 缓存
- 在线时自动同步到云端
- 冲突时提示用户选择

## 技术栈

- **前端**：Vue 3 + TypeScript
- **后端**：Supabase (PostgreSQL + Storage + Auth)
- **实时通信**：Supabase Realtime
- **部署**：Vercel (前端) + Supabase (后端)

## 参考资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 总结

通过集成 Supabase，我们可以：
- ✅ 解决 localStorage 存储限制
- ✅ 实现图片云端永久保存
- ✅ 支持多设备数据同步
- ✅ 添加用户认证和权限管理
- ✅ 为未来的社交功能打下基础

预计开发周期：**6-8 周**
