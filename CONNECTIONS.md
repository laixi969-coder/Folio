# 简序 · 连接与发布设计及实现状态

## 当前已实现

- 用户确认的「杂志 · 长文」为新建、导入、一键排版默认：图文齐边，30px留白、副标题15px、章节数字、导语与引语独立设计。
- 文字/图片模型独立保存API基础地址、密钥、默认模型ID。
- 「检查接口」通过服务端 GET /models 检查网络与鉴权；「试运行文字生成」实际调用所选模型生成固定 JSON，独立记录结果，不发送文章。
- 「同步最新模型」实时读取当前账号可见列表，分页、去重，记录同步时间；失败保留上次列表并显示失败原因。
- 模型手填、搜索与列表选择，服务商不支持/models时可手填。
- 公众号自用AppID/AppSecret配置、凭据验证与断开。验证调用官方stable_token接口，force_refresh=false，不主动挤掉其他服务的有效凭据。
- 密钥仅在本机服务端connections.json保存，文件权限600、响应去密钥、错误文本脱敏。未做磁盘内容加密。
- 不配置服务仍可排版、预览、复制与备份。不会自动把文章发给外部服务。

入口：主页「连接与发布」；也可直接访问 /?settings=text、/?settings=image、/?settings=wechat。导出窗口可进入公众号设置。

## 工作流与实现边界

### 内容输入与原文保护

AI文字、Word、图片进入结构化文档。保留原始文本与原始资源，自动排版可撤销。长文分析只接受结构字段、原文锚点与视觉建议，不接收任意HTML脚本。未经用户选择不改写正文、不自动加图。

### 模型增强

文字模型：结构识别、标题/导语/章节识别、配图位置、视觉任务。将原文锚点与建议一一对应，用户确认后应用；超时、费用、停止、失败重试及结果版本需要独立状态。

图片模型：提示词与画面用途先可看，用户点击生成后才发请求。区分照片、插画、信息图，保留原图、生成来源和裁切焦点。图片模型ID手填不等于该服务商的图片API已适配。

**已接入小编工作台的候选生成与图片生成。** 文字采用 Chat Completions，返回结构化候选并核对原文引用；图片采用 Images，要求有效 base64 结果。仅用户主动点击才发送可查看的片段或提示词。支持超时、取消等待、失败重试和来源记录。尚未适配 Responses 或各服务商私有协议；模型列表验证仍不证明生成能力。

### 公众号关联

个人本机版优先通过自有AppID/AppSecret。服务商扫码授权需要第三方平台资质、回调与公网部署，是另一条接入方案。不可把「关联」做成扫码图片的假演示。

验证结果区分：未配置、已保存未验证、鉴权通过、鉴权失败。鉴权通过不等于有素材或草稿写权限。遇IP白名单、权限或令牌问题显示具体处理方法；断开后清除本机密钥和缓存令牌，不影响微信账号本身。

### 发布前检查

确认发布标题、作者、摘要、封面与正文；检查图像是否存在、是否超限，提示横滑兼容导出降级；所有建议和编辑控件必须排除。

摘要属于文章独立字段，不能擅自把正文首段作为摘要。封面裁切、分享方图与正文首图分别保存，避免同图误用。

### 媒体及草稿同步

依次上传正文图片、替换微信资源URL、上传封面获取thumb_media_id、生成内联样式正文、调用draft/add或update。

记录accountId、remoteDraftId、articleRevision、同步时间与结果。已编辑过的文章显示「本地有新版本」，不能把旧草稿说成已同步。首次同步和更新已有草稿分开，不重复制造多篇同名稿。

远端草稿不存在时提供重新创建；中途失败不显示成功；重试可能重新上传素材，重复点击受互斥锁保护。同步只进入草稿箱，发布是单独动作。

现已提供封面素材、正文图片上传与草稿创建和更新。关联信息记录在服务端 `wechat-drafts.json`，按公众号与文章区分；重复同步更新已有草稿。创建结果因网络中断不确定时暂停重复创建，请先到公众号草稿箱核对。当前使用模拟微信接口测试，真实公众号仍需完成白名单和权限配置后验证。部署环境必须使用持久化数据目录保存连接配置与草稿关联，并将实际服务器出口公网 IP 加入公众号接口白名单；出口不固定时需要配置固定出口。

### 微信预览与发布

微信真机预览为最终校验，工具预览不冒充微信渲染。正式发布由用户在微信完成；若以后接发布API，需单独的操作入口和确认，区分提交成功、发布中、发布成功及失败。

### 数据与恢复

文章和媒体留本机；可编辑备份包含文章和图片，不包括模型及微信密钥。连接配置不导出到HTML、图片、项目JSON或日志。局域网连接受本机访问码保护；公网部署还需要HTTPS与独立身份认证。

## 已执行检查

- 模型分页、鉴权头、同步时间、错误脱敏、失败保留旧模型、换服务商避免旧密钥转发。
- 微信token请求参数、令牌不回传、白名单失败解释、断开清密钥。
- 原有导入、排版、导出、版本冲突与界面流程回归。
- 使用模拟服务响应进行自动化测试，生成与草稿写入使用模拟接口；2026-11-07 已用现有公众号配置测试凭据，返回 IP 白名单失败，没有上传内容或发布文章。

参考：
- https://developers.openai.com/api/reference/resources/models/methods/list
- https://developers.openai.com/api/reference/overview
- https://developers.weixin.qq.com/doc/subscription/api/base/api_getstableaccesstoken.html
- https://cloud.tencent.com/document/product/1301/126229


模型适配参考官方文档：
- https://developers.openai.com/api/reference/resources/chat
- https://developers.openai.com/api/reference/resources/images

新增 `/api/editorial/library`、`/asset-usage`、`/reviews` 与 `/api/connections/generate/candidates`、`/generate/image`。它们继承现有本机/局域网访问控制。素材库采用修订号和原子写入；模型密钥不下发浏览器，取消生成会释放服务端任务锁。公众号同步记录现在保存内容指纹，通读备注和复盘编辑不会把相同正文误标为待同步。


## 2026-11-07 模型接入与书刊排版

文字设置增加官方按量付费预设：DeepSeek (`https://api.deepseek.com`, `deepseek-flash`)、百炼北京 (`https://dashscope.aliyuncs.com/compatible-mode/v1`, `qwen3.8-flash`)、智谱 (`https://open.bigmodel.cn/api/paas/v4`, `glm-5.3`)。GLM 5.3 Flash 的名称未得到官方文档确认，不作为已验证模型预填。仍可手填网关地址和模型，账号实际权限以调用为准；不要混用不同地域或套餐的密钥。

`POST /api/connections/text/probe` 不依赖 `/models`，只发送固定测试句，校验 JSON 与 `ok:true`，可能产生少量费用。HTTP 200、列表可达和真实生成通过是不同状态；换模型、地址或密钥会使生成验证失效。DeepSeek 官方 Flash 请求关闭思考、GLM 5.3 使用低强度思考；自定义网关不自动套用专属参数。缺少远程密钥和文字模型误用于图片生成在本地拦截；失败保留表单供修正，服务端错误隐藏密钥。

书刊系列包含燕麦书页、素白书刊、青瓷手记。共享内联渲染覆盖章题、导语、引语与正文留白；编辑、预览、复制、兼容 HTML 使用相同规则。旧样式保留；可通过「存为我的默认」应用到以后新稿。中文顿号编号支持识别为章节，原编号在编辑时保留、在设计章题中不重复展示。

实际本机已保存 DeepSeek 的地址和模型，尚未提供 API Key，不能宣称真实模型调用成功；图片模型也未配置。本次按用户要求跳过公众号白名单，不调用微信写入。可使用本地复制/HTML 导出路径，微信粘贴与真机渲染仍须在微信确认。

官方参考（2026-11-07 核实）：
- https://api-docs.deepseek.com/quick_start/pricing/
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://help.aliyun.com/en/model-studio/qwen3-8-flash
- https://help.aliyun.com/en/model-studio/compatibility-with-openai-responses-api （新工作空间域名与旧域名兼容说明）
- https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3

## 持久后台任务（无自动发布）

工作台使用 `POST /api/connections/jobs`，任务类型仅允许 `candidates`、`image`、`assets`。`GET /jobs?articleId=...` 查询进度，`GET /jobs/:id` 获取持久结果，`POST /jobs/:id/retry` 明确重试失败/中断任务，`DELETE /jobs/:id` 清理已结束记录。所有接口继承原访问控制。保留原 `/generate/:kind` 接口供兼容直接请求。

- 文字/图片任务按当前服务地址、模型和密钥的不可逆指纹及输入去重，密钥不存入任务文件或响应。任务执行前复核配置，防止排队期间更换服务商后发送到不同地址。
- 结果只写任务文件，生成图保存到本机媒体目录，任务不改写文章、不调用公众号写入。浏览器收取时检查文章内容指纹，已收取任务不重复添加。
- 页面关闭与服务器生命周期分开。服务重启时，执行中或排队任务标为中断，避免自动重放未知是否计费的请求；完成结果继续可见。失败不自动重试。
- `assets` 仅处理受限本机 `/media/` 路径，不需要 API Key，不读取任意路径或外部 URL。媒体上传按 SHA-256 存储去重，尺寸分析、轻量派生文件保持原文件不变。
- 任务默认最多保留 300 条，列表满后在任务中心清理已结束记录；本机图片整理单次最多 200 张。任务和媒体应与其他数据一起备份。

Sharp API 依据官方文档核对：[元数据](https://sharp.pixelplumbing.com/api-input/)、[缩放](https://sharp.pixelplumbing.com/api-resize/)、[输出](https://sharp.pixelplumbing.com/api-output/)。

## 实测更新：GLM Flash 与百炼生图（2026-11-07）

用户保存的 `glm-5.3-flash` 已在智谱正式地址完成真实试运行及三组入口生成，前文“Flash 尚未确认”为此前核实记录，现已更新预设。百炼返回的模型目录包含 `qwen-image-2.0`，本机已完成真实生图和使用验收。Qwen-Image 不走 Images 兼容路径，自动调用同域 `/api/v1/services/aigc/multimodal-generation/generation`；依据 [官方 API](https://help.aliyun.com/zh/model-studio/qwen-image-api)。

实际结果来自 `dashscope-0484.oss-accelerate.aliyuncs.com`，已补齐此官方结果桶命名和标准 `dashscope-result-*` 的下载支持。只接受 HTTPS、受限 DashScope OSS 域名、无凭据/自定义端口、禁重定向，不转发 Key，并检查 12 MB 上限和图片签名。下载结果缓存保证同一已生成结果可重试下载而不重新计费生成。任务成功会回写对应模型配置的真实生成验证状态；恢复完成记录时仅认可相同地址、模型和 Key 的指纹。
