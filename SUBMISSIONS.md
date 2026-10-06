# NOVA 访客自助投稿

入口：`submit.html`。首页顶部加号、侧栏和视频源区域均可进入。

访客不需要账号，可以填写标题、公开昵称、分类、HTTPS 视频直链、封面链接和简介。当前支持 MP4、WebM、MOV 文件链接，不支持本地视频文件上传或 YouTube / 哔哩哔哩分享页链接。

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

数据库变更记录在 `database/nova-video-submissions.sql`，已通过 Supabase migration 应用。数据库 RLS 检查在事务中验证，测试投稿已回滚；前端验证使用模拟请求，验证了手机布局、输入检查、草稿恢复、失败重试和首页合并。
