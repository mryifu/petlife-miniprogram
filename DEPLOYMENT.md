# 多人共养宠物功能 - 部署指南

## 已完成的工作

### 1. 云函数创建（12个）

所有云函数已创建在 `cloudfunctions/` 目录下：

- ✅ `petQuery` - 查询用户可访问的所有宠物
- ✅ `petCreate` - 创建宠物并自动添加成员记录
- ✅ `petUpdate` - 更新宠物信息（权限检查）
- ✅ `petDelete` - 删除宠物（仅创建者）
- ✅ `invitationCreate` - 创建邀请码
- ✅ `invitationAccept` - 接受邀请加入共养
- ✅ `memberQuery` - 查询宠物的所有成员
- ✅ `memberRemove` - 移除成员或退出共养
- ✅ `logsQuery` - 查询宠物的所有日志（跨用户）
- ✅ `billsQuery` - 查询宠物的所有账单（跨用户）
- ✅ `weightsQuery` - 查询宠物的所有体重记录（跨用户）
- ✅ `dataMigration` - 数据迁移（为现有宠物创建成员记录）

### 2. 前端页面创建（3个）

- ✅ `pages/pets/members` - 共养成员管理页面
- ✅ `pages/pets/invite` - 邀请共养页面
- ✅ `pages/pets/join` - 加入共养页面

### 3. 前端修改

- ✅ `pages/pets/index.js` - 使用 petQuery 和 petDelete 云函数
- ✅ `pages/pets/index.wxml` - 添加成员按钮
- ✅ `pages/pets/form.js` - 使用 petCreate 和 petUpdate 云函数
- ✅ `pages/index/index.js` - 使用 logsQuery 云函数
- ✅ `pages/bills/index.js` - 使用 billsQuery 云函数
- ✅ `pages/weight/index.js` - 使用 weightsQuery 云函数
- ✅ `pages/charts/index.js` - 使用 weightsQuery 和 billsQuery 云函数
- ✅ `app.js` - 添加数据迁移检测
- ✅ `app.json` - 注册新页面路由

## 部署步骤

### 第一步：部署云函数

在微信开发者工具中，右键点击每个云函数文件夹，选择"上传并部署：云端安装依赖"：

1. `cloudfunctions/petQuery/`
2. `cloudfunctions/petCreate/`
3. `cloudfunctions/petUpdate/`
4. `cloudfunctions/petDelete/`
5. `cloudfunctions/invitationCreate/`
6. `cloudfunctions/invitationAccept/`
7. `cloudfunctions/memberQuery/`
8. `cloudfunctions/memberRemove/`
9. `cloudfunctions/logsQuery/`
10. `cloudfunctions/billsQuery/`
11. `cloudfunctions/weightsQuery/`
12. `cloudfunctions/dataMigration/`

### 第二步：创建数据库集合

在微信开发者工具的云开发控制台中，创建以下集合：

1. **pet_members** 集合
   - 权限设置：**仅管理端可读写**（ADMINWRITE）
   - 索引：`petId` + `status`
   - 说明：只能通过云函数访问，前端无法直接操作

2. **invitations** 集合
   - 权限设置：**仅管理端可读写**（ADMINWRITE）
   - 索引：`code` + `status`
   - 说明：只能通过云函数访问，前端无法直接操作

### 第三步：测试数据迁移

1. 在微信开发者工具中打开小程序
2. 查看控制台日志，确认数据迁移是否自动执行
3. 检查 `pet_members` 集合是否已创建成员记录

### 第四步：功能测试

#### 单用户测试
1. 创建新宠物 → 检查是否自动创建成员记录
2. 查看宠物列表 → 确认可以正常显示
3. 编辑宠物信息 → 确认可以正常保存
4. 添加日志/账单/体重 → 确认可以正常显示

#### 多用户共养测试
1. 用户A：点击"成员"按钮 → 生成邀请码
2. 用户A：复制邀请码
3. 用户B：在"加入共养"页面输入邀请码
4. 用户B：确认可以看到共养宠物
5. 用户B：添加日志 → 用户A可以看到
6. 用户A：查看成员列表 → 确认显示2个成员
7. 用户B：尝试删除宠物 → 提示无权限
8. 用户A：删除宠物 → 成功删除

## 数据库结构

### pet_members 集合
```javascript
{
  _id: "自动生成",
  _openid: "成员的openid",
  petId: "宠物ID",
  petName: "小橘",
  petAvatar: "cloud://...",
  isCreator: true,
  status: "active",
  joinTime: Date,
  createTime: Date
}
```

### invitations 集合
```javascript
{
  _id: "自动生成",
  _openid: "邀请人openid",
  petId: "宠物ID",
  petName: "小橘",
  code: "ABC123",
  expireTime: Date,
  status: "active",
  usedBy: "使用者openid",
  usedTime: Date,
  createTime: Date
}
```

### pets 集合（新增字段）
```javascript
{
  // 现有字段保持不变
  _openid: "创建者openid",
  name: "小橘",
  // ...

  // 新增字段
  memberCount: 1,
  isShared: false,
  createTime: Date,
  updateTime: Date
}
```

## 权限控制

| 操作 | 创建者 | 共养人 |
|------|--------|--------|
| 查看宠物信息 | ✅ | ✅ |
| 编辑宠物信息 | ✅ | ✅ |
| 删除宠物 | ✅ | ❌ |
| 添加日志/账单/体重 | ✅ | ✅ |
| 查看所有日志/账单/体重 | ✅ | ✅ |
| 邀请新成员 | ✅ | ✅ |
| 移除其他成员 | ✅ | ❌ |
| 退出共养 | ❌ | ✅ |

## 注意事项

1. **数据迁移**：首次启动时会自动为现有宠物创建成员记录
2. **邀请码**：6位大写字母+数字，24小时有效期
3. **权限检查**：所有云函数都会检查用户是否为宠物成员
4. **级联删除**：删除宠物时会自动删除成员记录、邀请记录和关联数据
5. **向后兼容**：现有单用户功能完全兼容，不影响现有用户使用

## 故障排查

### 问题1：数据迁移未执行
- 检查 `app.js` 中的 `checkDataMigration()` 是否被调用
- 检查本地存储中的 `pet_members_migration_completed` 标记
- 手动调用 `dataMigration` 云函数

### 问题2：无法查看共养宠物
- 检查 `pet_members` 集合是否有对应记录
- 检查 `petQuery` 云函数是否部署成功
- 检查用户的 openid 是否正确

### 问题3：邀请码无效
- 检查邀请码是否过期（24小时）
- 检查邀请码状态是否为 `active`
- 检查 `invitations` 集合是否有对应记录

### 问题4：权限错误
- 检查云函数中的权限检查逻辑
- 检查 `pet_members` 中的 `isCreator` 字段
- 检查用户是否为宠物成员

## 后续优化建议

1. **性能优化**
   - 为 `pet_members` 和 `invitations` 集合添加数据库索引
   - 云函数查询添加缓存机制

2. **用户体验**
   - 添加成员昵称显示
   - 添加操作日志（谁添加了什么记录）
   - 添加成员通知功能

3. **功能扩展**
   - 微信分享卡片邀请
   - 二维码邀请
   - 权限分级（主人 vs 照顾者）
