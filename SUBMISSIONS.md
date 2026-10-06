# NOVA 访客自助投稿

入口：`submit.html`。首页顶部加号、侧栏和视频源区域均可进入。

访客不需要账号，可以填写标题、公开昵称、分类、HTTPS 视频直链、封面链接和简介。支持直接上传 MP4、WebM、MOV 视频文件（单个最多 50 MiB），也保留文件直链投稿。YouTube / 哔哩哔哩分享页链接暂不支持。文件上传有进度显示和取消按钮；上传失败可重新提交，上传成功后即使投稿请求失败，也会保留上传链接供重试。未上传的本地文件在刷新页面后需要重新选择。

## 审核投稿

1. 登录 [Supabase Table Editor](https://supabase.com/dashboard/project/uaxnhmaczwjldvjhcysk/editor)。
2. 打开 `public.nova_video_submissions`，筛选 `status = pending`。
3. 检查作品和链接，将 `status` 改为 `approved`，保存。
4. 刷新 NOVA 首页，作品会自动显示，不用编辑 `videos.json`。

不通过的投稿改为 `rejected`；已上线的作品也可改成 `rejected` 下架。管理员可在 Table Editor 修正标题、分类或链接。公开页面不加载待审核或拒绝的投稿。

## 访问权限

- 匿名及登录访客仅可插入作品字段；不能修改审核状态、修改或删除投稿。
- 公开读取仅允许 `approved` 的作品，不收集联系方式。
- 同一视频直链唯一，网络失败重试沿用投稿 UUID，避免重复提交。
- 表单草稿保存在当前浏览器；提交成功后清除。
- 页面仅使用可公开的 Supabase publishable key，未使用 service role key。

数据库变更记录在 `database/nova-video-submissions.sql` 和 `database/nova-video-uploads.sql`，已通过 Supabase migration 应用。数据库 RLS 检查在事务中验证，测试投稿已回滚；前端验证使用模拟请求，验证了手机布局、输入检查、草稿恢复、失败重试和首页合并。

## 视频文件存储

- 文件保存在 Supabase Storage 的 `nova-submission-videos` 公共 bucket，自动生成 UUID 文件名，原始文件名不会写入公开路径。
- Bucket 限制为 50 MiB，允许 `video/mp4`、`video/webm`、`video/quicktime`。访客只允许插入符合命名规则的新文件，不能覆盖或删除已有文件，也不能列举 bucket 内容。
- 文件上传后获得公开播放链接；审核控制首页展示，不控制链接可访问性。
- 每次重试沿用同一文件路径。若上一上传已成功但响应丢失，客户端会检查已存在对象的大小后继续。
- 已上传文件会占用项目存储。管理员可在 [Storage](https://supabase.com/dashboard/project/uaxnhmaczwjldvjhcysk/storage/buckets/nova-submission-videos) 删除拒绝的作品文件或未提交的闲置文件；请使用 Storage 界面删除，不要直接删除 `storage.objects` 数据库记录。
- 为了兼容更多浏览器，建议 H.264 编码的 MP4；本流程不做转码。

验证：真实 Storage 上传、读取和禁止覆盖均通过；测试文件通过 Storage API 清除。前端检查覆盖格式与大小校验、进度、取消、失败重试、上传后草稿恢复、避免重复上传，以及直链投稿。
