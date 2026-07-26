# ProHeadshot - 部署指南

## 你需要准备的东西

### 1. PostgreSQL 数据库（免费）
- 注册 [Neon](https://neon.tech) → 创建项目 → 拿到 `DATABASE_URL`

### 2. Google OAuth（用户登录）
- 去 [console.cloud.google.com](https://console.cloud.google.com) 创建 OAuth 应用
- 拿到 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

### 3. MuAPI Key（AI 生成）
- 注册 [MuAPI](https://muapi.ai) → 购买 API Key
- 拿到 `HEADSHOT_API_KEY`

### 4. PayPal API（收款）
- 去 [developer.paypal.com](https://developer.paypal.com) → 创建 App
- 拿到 `NEXT_PUBLIC_PAYPAL_CLIENT_ID` 和 `PAYPAL_CLIENT_SECRET`
- 填上你的 PayPal 邮箱 `PAYPAL_EMAIL`

### 5. 域名（可选）
- 买个 `.com` 域名（推荐 Namecheap 或 GoDaddy）

---

## 部署步骤

### 方式一：一键部署到 Vercel（推荐）

1. 把代码推到你的 GitHub 仓库
2. 去 [vercel.com](https://vercel.com) → Import 这个仓库
3. 在 Vercel 的环境变量设置中填入以下内容：

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://你的域名.vercel.app
NEXTAUTH_SECRET=随便生成一个长字符串
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
HEADSHOT_API_KEY=...
WEBHOOK_URL=https://你的域名.vercel.app
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_EMAIL=your@email.com
PAYPAL_API_URL=https://api-m.paypal.com  # 正式环境用这个，测试用 sandbox
```

4. 部署完成 ✓

### 方式二：本地运行测试

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的配置

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

---

## 上线后要做的

1. **PayPal Webhook 配置**（重要）
   - 去 developer.paypal.com → 你的 App → Webhooks
   - 添加 Webhook URL: `https://你的域名/api/paypal/webhook`
   - 订阅事件: `PAYMENT.CAPTURE.COMPLETED`
   - 拿到 Webhook ID（后续用于验证签名）

2. **Google OAuth 回调 URL**
   - 在 Google Cloud Console 添加：
   - `https://你的域名/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`

3. **验证 Paypal 环境变量**
   - 测试阶段：`PAYPAL_API_URL=https://api-m.sandbox.paypal.com`
   - 正式上线后改为：`PAYPAL_API_URL=https://api-m.paypal.com`

---

## 收费方案

| 套餐 | 价格 | 信用点 |
|------|------|--------|
| Basic | $4.99 | 100 |
| Standard (推荐) | $9.99 | 250 |
| Professional | $19.99 | 600 |
| Business | $49.99 | 2000 |

每次 AI 生成消耗 60 个信用点。
