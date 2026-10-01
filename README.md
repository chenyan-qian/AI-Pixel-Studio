# AI Pixel Studio

一个面向像素艺术创作的全栈 Web 项目。前端以 **PixelVerse** 为产品名称，提供从图片上传、像素化、逐格编辑到作品发布和多人协作的完整流程。

## 功能概览

- **图片转像素画**：上传图片，选择 1、2、4、8、16、32 或 64 px 的像素格大小，生成可编辑的颜色网格。
- **像素编辑器**：画笔、橡皮擦、吸色、调色板、缩放、撤销/重做和历史记录；作品可导出为 PNG 或 JPG。
- **作品管理与社区**：保存草稿、提交审核、发布或下架作品，并在社区浏览公开作品。
- **实时协作**：通过 WebSocket 同步像素修改、显示在线成员，并保存或恢复协作版本。
- **账户与后台**：邮箱验证码注册、JWT 登录；管理员可查看统计、审核作品、管理用户和文件，以及查看操作日志。

> 像素化目前由后端使用 Java 图像采样生成网格，不依赖外部 AI 模型或 API。WebP 图片可以上传，但当前像素化分析接口只接受 JPG/JPEG 和 PNG；要走完整创作流程，请使用这两种格式。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js 15、React 19、TypeScript、Tailwind CSS 4、Zustand、Axios |
| 后端 | Java 17、Spring Boot 3.3、MyBatis-Plus、Spring WebSocket、JWT |
| 数据与文件 | MySQL、服务器本地 `uploads` 目录 |

## 项目结构

```text
AI-Pixel-Studio/
├── frontend/                 # 页面、组件、编辑器状态与导出逻辑
│   ├── app/                  # 工作台、编辑器、社区、账户和管理页面
│   ├── components/
│   └── lib/
└── backend/
    ├── sql/user.sql          # 全新安装所需的数据库表结构
    ├── sql/*_migration.sql   # 旧版本数据库迁移脚本
    └── src/                  # Spring Boot API、业务逻辑和测试
```

## 本地运行

### 环境要求

- Node.js 20+ 与 npm
- JDK 17 与 Maven
- MySQL 8+
- 可用于发送验证码的 SMTP 邮箱服务（注册新账户时需要）

### 1. 初始化数据库

进入 MySQL 客户端，在仓库根目录执行：

```sql
SOURCE backend/sql/user.sql;
```

该脚本会创建 `ai_pixel_studio` 数据库及当前版本所需的表。`backend/sql/` 中的迁移脚本用于已有旧版数据库，全新安装无需执行。

### 2. 配置并启动后端

后端配置见 [`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml)。启动前设置以下环境变量：

| 变量 | 用途 |
| --- | --- |
| `DB_USERNAME`、`DB_PASSWORD` | MySQL 账户和密码 |
| `MAIL_HOST`、`MAIL_PORT` | SMTP 服务器地址和端口 |
| `MAIL_USERNAME`、`MAIL_PASSWORD` | SMTP 登录信息 |
| `MAIL_FROM` | 发件地址；未设置时使用 `MAIL_USERNAME` |
| `JWT_SECRET` | JWT 签名密钥，建议使用至少 32 字符的随机值 |

数据库默认连接 `localhost:3306/ai_pixel_studio`，后端默认监听 `http://localhost:8080`。例如在 PowerShell 中：

```powershell
$env:DB_USERNAME = "your_mysql_user"
$env:DB_PASSWORD = "your_mysql_password"
$env:MAIL_HOST = "smtp.example.com"
$env:MAIL_PORT = "587"
$env:MAIL_USERNAME = "you@example.com"
$env:MAIL_PASSWORD = "your_smtp_password"
$env:MAIL_FROM = "you@example.com"
$env:JWT_SECRET = "replace-with-a-random-secret-at-least-32-characters"

cd backend
mvn spring-boot:run
```

请按所用邮件服务商的要求填写 SMTP 地址、端口和授权码。上述值仅是配置示例，不要把真实凭据提交到 Git。

### 3. 启动前端

另开一个终端，在仓库根目录运行：

```bash
cd frontend
npm ci
npm run dev
```

打开 `http://localhost:3000`。前端默认请求 `http://localhost:8080`；如果后端地址不同，可在 `frontend/.env.local` 中设置：

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

前后端跨域允许的本地来源在 `backend/src/main/java/com/aipixelstudio/config/WebMvcConfig.java` 中配置，默认支持 `localhost:3000` 和 `127.0.0.1:3000`。

## 使用流程

1. 配置 SMTP 后注册账户，并使用邮箱验证码完成验证。
2. 登录后进入工作台，上传 JPG/PNG 图片并选择像素格大小。
3. 在编辑器中调整像素，保存作品或导出图片。
4. 提交作品审核；管理员通过后，作品会出现在社区。开启协作权限的作品可由其他用户共同编辑。

管理员账号需要在数据库中将相应用户的 `role` 设为 `ADMIN`；普通注册用户默认是 `USER`。

## 开发命令

```bash
# 在 frontend/ 目录
npm run build
npm test

# 在 backend/ 目录
mvn test
```
