# 爪爪手账 - 数据库设计文档

## 环境信息
- **环境 ID**: `zzsz-6g4xsnej8a75c464`
- **数据库类型**: NoSQL 文档数据库

---

## 数据集合

### 1. pets (宠物信息)
```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  name: "小橘",           // 宠物名称
  species: "橘猫",        // 品种
  gender: "male",         // 性别 male/female
  birthday: "2023-06-15", // 生日
  avatar: "cloud://...",  // 头像云存储路径
  weight: 4.5,            // 当前体重(kg)
  isDefault: true,        // 是否默认宠物
  createTime: Date,       // 创建时间
  updateTime: Date        // 更新时间
}
```

### 2. logs (日常记录)
```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  petId: "宠物ID",
  type: "food",           // 类型: food/water/poop/bath/vaccine/walk/medicine/play
  typeLabel: "进食",      // 类型标签
  time: "09:30",          // 记录时间
  date: "2026-02-02",     // 记录日期
  note: "吃了一罐妙鲜包",  // 备注
  images: [],             // 图片列表
  createTime: Date
}
```

### 3. posts (社区帖子)
```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  author: {
    nickname: "猫奴小王",
    avatar: "cloud://..."
  },
  content: "帖子内容...",
  images: [],             // 图片列表
  tags: ["疫苗", "橘猫"],
  pet: {
    name: "小橘",
    species: "橘猫"
  },
  location: "北京市朝阳区",
  likeCount: 0,
  commentCount: 0,
  likedBy: [],            // 点赞用户openid列表
  comments: [],           // 评论列表
  createTime: Date,
  updateTime: Date
}
```

### 4. hospitals (医院)
```javascript
{
  _id: "自动生成",
  name: "爱宠宠物医院",
  address: "北京市朝阳区...",
  phone: "010-12345678",
  location: {             // 地理位置 (用于附近搜索)
    type: "Point",
    coordinates: [116.4, 39.9]
  },
  rating: 4.5,
  tags: ["24小时", "急诊"],
  images: [],
  createTime: Date
}
```

### 5. stores (宠物店)
```javascript
{
  _id: "自动生成",
  name: "萌宠生活馆",
  address: "上海市浦东新区...",
  phone: "021-87654321",
  location: {
    type: "Point",
    coordinates: [121.5, 31.2]
  },
  category: "综合",       // 综合/美容/食品/用品
  rating: 4.8,
  tags: ["美容", "寄养"],
  images: [],
  createTime: Date
}
```

### 6. bills (账单)
```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  petId: "宠物ID",
  amount: 89.5,           // 金额
  type: "食品",           // 类型: 食品/医疗/玩具/洗护/其他
  note: "猫粮",           // 备注
  date: "2026-02-02",
  createTime: Date
}
```

### 7. weights (体重记录)
```javascript
{
  _id: "自动生成",
  _openid: "用户openid",
  petId: "宠物ID",
  weight: 4.5,            // 体重(kg)
  date: "2026-02-02",
  createTime: Date
}
```

---

## 安全规则

| 集合 | 规则 | 说明 |
|------|------|------|
| pets | ADMINWRITE | 用户只能读写自己的数据 |
| logs | ADMINWRITE | 用户只能读写自己的数据 |
| posts | ADMINWRITE | 用户只能修改自己的帖子 |
| hospitals | READONLY | 所有人可读，管理员可写 |
| stores | READONLY | 所有人可读，管理员可写 |
| bills | ADMINWRITE | 用户只能读写自己的数据 |
| weights | ADMINWRITE | 用户只能读写自己的数据 |

---

## 使用示例

```javascript
const app = getApp()
const db = app.globalData.db

// 获取当前用户的宠物列表
db.collection('pets').where({
  _openid: '{openid}'  // 自动替换为当前用户openid
}).get().then(res => {
  console.log(res.data)
})

// 添加新宠物
db.collection('pets').add({
  data: {
    name: '小橘',
    species: '橘猫',
    gender: 'male',
    birthday: '2023-06-15',
    createTime: db.serverDate()
  }
})
```
