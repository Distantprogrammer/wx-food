# 项目创建与部署

本文介绍如何准备「今天做什么菜」的小程序开发环境、部署微信云函数与云数据库，并配置菜谱图片。公众号文章管理网页是可选的独立服务，说明见 [`official-publisher-web/README.md`](./official-publisher-web/README.md)。

## 环境准备

- Node.js 与 pnpm
- 微信开发者工具
- 已开通云开发的微信小程序，以及一个云开发环境

## 本地创建与运行

1. 克隆仓库，在项目根目录安装依赖：

   ```bash
   pnpm install
   ```

2. 在 `src/config/env.js`、`src/manifest.json` 和 `project.config.json` 中填入自己的云环境 ID、小程序 AppID 和云存储图片前缀。公开仓库不要提交个人密钥或私有环境配置。
3. 准备菜谱种子数据，并同步云函数公共模块：

   ```bash
   pnpm prepare:seed
   pnpm sync:cloud
   ```

4. 编译并在微信开发者工具中预览：

   ```bash
   pnpm dev:mp-weixin
   ```

5. 微信开发者工具打开项目根目录 `wx-food`，不要只打开编译生成的 `dist` 目录。开通云开发，并在开发者工具中选择正确的云环境。

## 部署云函数

上传以下云函数目录：

- `login`
- `updateProfile`
- `recipe`
- `tip`
- `userRecipe`
- `seedImport`
- `admin`
- `feedback`
- `notice`

上传前执行过 `pnpm sync:cloud`，确认这些目录内已生成 `common.js`。在微信开发者工具中逐个右键云函数目录，选择 **上传并部署：云端安装依赖**。不要跳过依赖安装。

若出现 `Cannot find module 'wx-server-sdk'`，请重新上传相应函数并选择「云端安装依赖」。

`seedImport` 已设置 60 秒超时，种子数据按批导入。若出现 `FUNCTIONS_TIME_LIMIT_EXCEEDED`，重新上传包含 `config.json` 的 `seedImport`，并在云开发控制台确认超时为 60 秒；不要一次请求导入过大的数据批次。

## 创建云数据库集合与索引

微信云数据库会在写入时自动生成字段，但集合和索引需要按项目结构准备。当前集合、字段和索引定义以 [`database/schema.json`](./database/schema.json) 为准。至少需要创建这些集合：

`users`、`categories`、`recipes`、`tips`、`likes`、`favorites`、`cooked`、`history`、`feedbacks`、`settings`。

所有集合都由云函数访问。请按实际业务需求设置权限，并在微信云开发控制台按 `database/schema.json` 中的定义创建索引。

数据库准备完成后，在小程序首页或「我的」页面执行种子导入。空数据库可进行首次导入；已有数据时，更新种子需要管理员权限（用户 `role` 为数字 `1`）。

## 配置菜谱图片

菜谱图片保存在项目根目录 `images/`，不适合直接打包进小程序。建议上传到微信云开发的云存储：

1. 在云开发控制台的「存储」中创建 `recipe-images` 文件夹。
2. 将 `images/` 中需要使用的图片上传到该文件夹，并保持文件名不变。
3. 复制一张图片的 fileID，按实际环境和存储桶名称配置 `src/config/env.js` 中的 `CLOUD_IMAGE_PREFIX`。
4. 允许小程序读取图片。可以设为「所有用户可读，仅创建者可写」，或使用等效的自定义读写规则。
5. 重新编译预览小程序。

如果图片加载出现 `STORAGE_EXCEED_AUTHORITY`，检查云存储读取权限；出现本地 `500` 时，确认图片已上传且 `CLOUD_IMAGE_PREFIX` 指向正确的存储路径。

只需本地预览少量图片时，可将它们放入 `src/static/recipe-images/`。不要将全部图片复制进小程序静态资源。

## 开源配置

部署前请把示例配置替换成自己的云环境 ID、AppID 和存储桶路径。不要提交 AppSecret、管理员密码、`.env` 或其他凭据；公开仓库前也要检查 Git 历史中是否曾提交过这些内容。
