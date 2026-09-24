# 今天做什么菜（wx-food）

基于微信云开发的美食菜谱小程序。工程模板参考 `WantSayYou/reception`，UI 对齐 `design-mockups`。

## 首期范围

- **静默登录**（无独立登录页）：启动时调用 `login` 云函数，按 openid 自动建用户
- Tab：首页 / 烹饪技巧 / 分类 / 我的
- 菜谱详情：喜欢、收藏、做过、浏览历史
- 不含：关系、推送、公众号绑定（二期）

## 快速开始

1. 在 `src/config/env.js`、`src/manifest.json`、`project.config.json` 填入你的 **云环境 ID** 与 **小程序 appid**
2. 安装依赖：`pnpm install`
3. 准备种子数据：`pnpm prepare:seed`
4. 同步云函数公共模块：`pnpm sync:cloud`
5. 编译：`pnpm dev:mp-weixin`
6. 用微信开发者工具打开项目根目录 `wx-food`（不要只开 dist），开通云开发，**逐个**上传云函数：
   - `login` / `updateProfile` / `recipe` / `tip` / `userRecipe` / `seedImport` / `admin`
   - 右键云函数目录 → **「上传并部署：云端安装依赖」**（不要选「不安装依赖」）
   - 若已误传过：同样再执行一次「云端安装依赖」即可覆盖
   - 上传前确认已执行 `pnpm sync:cloud`（各函数目录下要有 `common.js`）
7. 在云开发控制台创建数据库集合与索引（见下方「云库建表」）
8. 首次进入首页，点击「导入种子」；或在「我的」里执行导入  
   （空库任意用户可导入；有数据后仅 `role=1` 管理员可更新）

### 云函数报错：`Cannot find module 'wx-server-sdk'`

说明代码已部署，但云端 **node_modules 未安装**。处理：

1. 开发者工具左侧「云函数」→ 找到报错的函数（一般是 `login`）
2. 右键 → **上传并部署：云端安装依赖**
3. 对上述 6 个函数都做一遍
4. 云开发控制台 → 云函数 → 点开该函数 → 看「依赖安装」是否成功  
5. 重新编译/预览小程序后再试

不要用「上传并部署：所有文件」却勾选跳过依赖；也不要只拷贝 `index.js` 上去。

### 云函数报错：`FUNCTIONS_TIME_LIMIT_EXCEEDED` / 3 seconds

`seedImport` 已配置 `timeout: 60`，且前端按 **每批 10 条** 循环导入。若仍超时：

1. 确认已重新上传 `seedImport`（含 `config.json`）并选「云端安装依赖」
2. 云开发控制台 → 云函数 → `seedImport` → 配置，确认超时为 **60 秒**
3. 不要一次传 `action: 'all'` 或过大的 `limit`

## 云库建表

微信云数据库**不用预先建字段**，写文档时字段会自动出现。你需要做的是：**建空集合 + 建索引**。

### 1. 打开入口

微信开发者工具 → 顶部 **云开发** → 选中你的环境 → **数据库**。

### 2. 创建这 8 个集合

点「添加集合」，名称必须完全一致（区分大小写）：

| 集合名 | 用途 |
|--------|------|
| `users` | 用户（静默登录自动写入） |
| `categories` | 菜谱分类 |
| `recipes` | 菜谱正文 |
| `tips` | 烹饪技巧 |
| `likes` | 喜欢 |
| `favorites` | 收藏 |
| `cooked` | 做过的菜 |
| `history` | 浏览历史 |

权限建议（首期够用）：

- 全部集合：**仅管理端可读写**（客户端只通过云函数访问，最安全）
- 也可先用默认「所有用户可读，仅创建者可写」，但业务数据仍应只走云函数

### 3. 为每个集合添加索引

进入对应集合 → **索引管理** → **添加索引**。  
索引名可自定义；**字段名与排序必须如下**（`1` 升序，`-1` 降序；勾选「唯一」处已注明）。

**users**

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `openid_unique` | `openid` → 升序(1) | 是 |

**categories**

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `slug_unique` | `slug` → 升序(1) | 是 |

**recipes**

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `recipeId_unique` | `recipeId` → 升序(1) | 是 |
| `categorySlug` | `categorySlug` → 升序(1) | 否 |
| `likes` | `likes` → 降序(-1) | 否 |

**tips**

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `tipId_unique` | `tipId` → 升序(1) | 是 |

**likes / favorites / cooked**（三个集合各建一条相同组合索引）

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `user_recipe` | `userId` → 升序(1)，`recipeId` → 升序(1) | 是 |

**history**

| 索引名建议 | 字段 | 唯一 |
|------------|------|------|
| `user_recipe` | `userId` → 升序(1)，`recipeId` → 升序(1) | 是 |
| `user_update` | `userId` → 升序(1)，`updateTime` → 降序(-1) | 否 |

> 组合索引：在控制台添加索引时一次加多个字段即可（先 `userId`，再 `recipeId` / `updateTime`）。

### 4. 建完后做什么

1. 确认 6 个云函数已上传部署  
2. 真机/模拟器打开小程序，首页点「导入种子」（会写入 `categories` / `recipes` / `tips`）  
3. 云库里能看到菜谱数据后，再测喜欢/收藏等（会写 `likes` 等集合）

可选：把某个 `users` 文档的 `role` 改成数字 `1`，该用户即管理员，之后可重复跑种子更新。

字段说明全文见 [`database/schema.json`](./database/schema.json)。

## 菜谱图片怎么加载

### 为什么会 500？

库里封面是 `/download/recipe-images/xxx.jpeg`，小程序会当成**包内相对路径**去请求  
`http://127.0.0.1:xxxx/__pageframe__/download/recipe-images/...`，于是 500。

另外：

1. 项目里**没有** `download/recipe-images` 目录；图片实际在根目录 `images/`（约 343 张 / **99MB**）
2. **不能**把整包图片放进小程序（主包/分包体积远不够）
3. 正确做法：上传到**云存储**，再配置前缀

### 推荐：云存储（全量图）

1. 微信开发者工具 → **云开发** → **存储**
2. 新建文件夹 `recipe-images`
3. 把本地 `wx-food/images/` 下的 jpg/png/webp **全部上传**到该文件夹（文件名保持不变）
4. 点开任意已上传文件 → 复制 **fileID**，例如：  
   `cloud://cloud1-d6gjzfkan9e2a2b19.xxx/recipe-images/969508ad08374d0d9df620b9aed189c5.jpeg`
5. 在 `src/config/env.js` 填写前缀（去掉文件名）：

```js
export const CLOUD_IMAGE_PREFIX = 'cloud://cloud1-d6gjzfkan9e2a2b19.xxx/recipe-images/'
```

6. **存储权限（必改）**：云开发 → **存储** → 右上角 **权限设置**  
   改为 **「所有用户可读，仅创建者可写」**（或自定义规则里对 `recipe-images` 放行 `read: true`）  
   若仍是「仅创建者可读写」，客户端 `getTempFileURL` 会返回 `STORAGE_EXCEED_AUTHORITY`，`tempFileURL` 为空，图片不显示。
7. 重新编译预览。前端会把 DB 里的路径转成 `cloud://`，再换临时 `https` 给 `<image>`。

### 报错：`STORAGE_EXCEED_AUTHORITY`

说明 **fileID 路径是对的**，但云存储安全规则禁止当前用户读文件。按上面第 6 步改权限后立刻生效，无需重新上传图片。

### 仅本地试几张图（可选）

```text
把少量文件复制到：
src/static/recipe-images/xxx.jpeg
```

不配 `CLOUD_IMAGE_PREFIX` 时会走 `/static/recipe-images/文件名`。  
**不要**把 99MB 全量拷进 `static`。

## 目录

- `src/` 小程序前端
- `cloudfunctions/` 云函数
- `data/` HowToCook 原始菜谱/技巧数据
- `images/` 菜谱原图（上传云存储用，勿直接当小程序静态资源）
- `design-mockups/` HTML 设计稿
- `database/schema.json` 云库结构说明

## 说明

封面缺失或 `no-image` 时前端用 emoji 渐变块兜底。食材无独立用量字段，详情展示名称列表。
