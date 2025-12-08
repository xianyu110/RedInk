# 使用 Supabase 部署红墨 AI 图文生成器

## 架构对比

### 当前架构（Vercel + Render）
- Vercel: 前端 + Serverless Functions
- Render: PostgreSQL + Redis
- 需要自己管理后端代码

### Supabase 架构
- Vercel: 前端静态托管
- Supabase: 数据库 + 认证 + 存储 + Edge Functions
- 更少的后端代码需要维护

## 改造步骤

### 1. 创建 Supabase 项目
1. 访问 https://supabase.com
2. 创建新项目
3. 选择区域和数据库配置

### 2. 数据库设置
```sql
-- 在 Supabase SQL Editor 中执行

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建历史记录表
CREATE TABLE generation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    description TEXT,
    outline JSONB,
    images JSONB,
    reference_image_url TEXT,
    status TEXT DEFAULT 'draft'
);

-- 创建配置表
CREATE TABLE user_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    config_type TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, config_type, provider_name)
);

-- 创建 API Keys 表（用于存储用户的 API Keys）
CREATE TABLE user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    service TEXT NOT NULL, -- 'openai', 'gemini', etc.
    api_key_encrypted TEXT NOT NULL, -- 加密存储
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service)
);

-- 设置行级安全策略
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own history" ON generation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON generation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON generation_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON generation_history
    FOR DELETE USING (auth.uid() = user_id);
```

### 3. Edge Functions 部署

#### 创建 `.supabase/functions/generate-outline/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理 CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { topic, images } = await req.json()

    // 这里调用 AI 生成大纲
    const outline = await generateOutlineWithAI(topic, images)

    return new Response(
      JSON.stringify({ success: true, outline }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function generateOutlineWithAI(topic: string, images?: any[]) {
  // 实现 AI 生成逻辑
  // 可以调用 OpenAI 或 Gemini API
}
```

### 4. 前端集成

#### 安装 Supabase 客户端
```bash
npm install @supabase/supabase-js
```

#### 创建 `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 修改 API 调用

```typescript
// 替换原来的 axios 调用为 Supabase 调用
import { supabase } from '@/lib/supabase'

// 生成大纲
export async function generateOutline(topic: string) {
  const { data, error } = await supabase.functions.invoke('generate-outline', {
    body: { topic }
  })

  if (error) throw error
  return data
}

// 保存历史记录
export async function saveToHistory(record: any) {
  const { data, error } = await supabase
    .from('generation_history')
    .insert(record)
    .select()

  if (error) throw error
  return data[0]
}

// 获取历史记录
export async function getHistory() {
  const { data, error } = await supabase
    .from('generation_history')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### 5. 文件存储配置

```typescript
// 上传文件到 Supabase Storage
export async function uploadImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(path, file)

  if (error) throw error

  // 获取公共 URL
  const { data: { publicUrl } } = supabase.storage
    .from('generated-images')
    .getPublicUrl(path)

  return publicUrl
}
```

### 6. 环境变量配置

在 Vercel 项目中添加：
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 优缺点对比

### Supabase 优势：
1. **一站式解决方案**：不需要管理多个服务商
2. **实时功能**：自动实现数据同步
3. **简化开发**：大量后端工作已经完成
4. **更好的免费额度**：
   - 500MB 数据库
   - 1GB 存储
   - 50MB 带宽/天
   - 100万次 Edge Function 调用/月

### Supabase 限制：
1. **厂商锁定**：迁移到其他平台较困难
2. **自定义限制**：某些复杂功能可能受限
3. **冷启动**：Edge Functions 有冷启动时间

## 迁移建议

如果你的项目：
- 需要快速上线 ✅
- 预算有限 ✅
- 需要实时功能 ✅
- 团队规模较小 ✅

→ 选择 Supabase

如果你的项目：
- 需要高度自定义 ✅
- 计划长期发展 ✅
- 团队有 DevOps 能力 ✅
- 需要特殊配置 ✅

→ 选择 Vercel + Render

## 总结

Supabase 可以大大简化项目的部署和维护工作，特别适合快速开发和迭代。如果你想要更快的开发速度和更低的运维成本，Supabase 是个不错的选择。