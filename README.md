# 🐾 爪爪手账 (PetLife)

<div align="center">

**一款专为铲屎官打造的宠物全生命周期管理微信小程序**

*A WeChat Mini Program for comprehensive pet lifecycle management*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WeChat Mini Program](https://img.shields.io/badge/WeChat-Mini%20Program-07C160?logo=wechat)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![CloudBase](https://img.shields.io/badge/CloudBase-Powered-blue)](https://cloud.tencent.com/product/tcb)

[简体中文](#简体中文) | [English](#english)

</div>

---

## 简体中文

### ✨ 功能特性

- **📅 日常打卡** - 记录宠物的进食、喝水、排泄、洗澡、疫苗、遛弯、驱虫、玩耍等 8 种日常活动
- **🐕 宠物管理** - 支持多宠物管理，记录宠物的基本信息、头像、生日等
- **📚 知识百科** - 涵盖喂养、健康、训练、美容、用品 5 大分类的宠物知识库
- **💰 账单统计** - 记录宠物花费，支持饼图可视化分析
- **📈 体重追踪** - 记录宠物体重变化，折线图展示趋势
- **👤 个人中心** - 统计养宠数据，包括宠物数量、打卡次数、总花费、养宠天数等

### 🛠️ 技术栈

- **前端**: 微信小程序原生开发框架
- **后端**: 微信云开发 (CloudBase)
- **数据库**: 云开发 NoSQL 数据库
- **存储**: 云存储（用于宠物头像等图片）
- **云函数**: Node.js + wx-server-sdk

### 📦 项目结构

```
miniprogram/                 # 小程序前端代码
├── app.js                   # 小程序入口
├── app.json                 # 全局配置
├── app.wxss                 # 全局样式
├── DATABASE.md              # 数据库设计文档
├── images/                  # 静态资源
└── pages/                   # 页面目录
    ├── index/               # 首页（日常打卡）
    ├── pets/                # 宠物管理
    ├── knowledge/           # 知识百科
    ├── charts/              # 数据图表
    └── profile/             # 个人中心

cloudfunctions/              # 云函数目录
├── login/                   # 用户登录
├── initKnowledge/           # 初始化知识库
├── petQuery/                # 宠物查询
├── logsQuery/               # 日志查询
├── billsQuery/              # 账单查询
├── weightsQuery/            # 体重查询
└── statsQuery/              # 统计查询
```

### 🚀 快速开始

#### 前置要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信小程序账号（[注册地址](https://mp.weixin.qq.com/wxopen/waregister?action=step1)）
- 开通微信云开发服务

#### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/mryifu/petlife-miniprogram.git
   cd petlife-miniprogram
   ```

2. **配置小程序 AppID**

   在 `project.config.json` 中修改 `appid` 字段为你的小程序 AppID：
   ```json
   {
     "appid": "your-appid-here"
   }
   ```

3. **配置云开发环境**

   在 `miniprogram/app.js` 中修改云环境 ID：
   ```javascript
   wx.cloud.init({
     env: 'your-cloud-env-id', // 替换为你的云环境 ID
     traceUser: true,
   })
   ```

4. **打开项目**

   使用微信开发者工具打开项目根目录

5. **部署云函数**

   在微信开发者工具中，右键点击 `cloudfunctions` 目录下的每个云函数文件夹，选择"上传并部署：云端安装依赖"

6. **初始化数据库**

   在微信开发者工具的云开发控制台中，运行 `initKnowledge` 云函数来初始化示例知识库数据

7. **编译运行**

   点击工具栏的"编译"按钮，即可在模拟器中预览

### 🎨 UI 设计

采用「奶油白 + 焦糖色」暖色系设计风格：

- **主色调**: `#C59D5F` (焦糖色)
- **辅助色**: `#E6D5B8` (燕麦色)
- **背景色**: `#FFFBF0` (奶油白)
- **文字色**: `#5C4033` (深咖色)
- **圆角**: `32rpx` (大圆角设计)

### 📊 数据库设计

详见 `miniprogram/DATABASE.md`，主要集合包括：

| 集合 | 说明 | 权限 |
|------|------|------|
| `pets` | 宠物信息 | 仅创建者可读写 |
| `logs` | 日常打卡记录 | 仅创建者可读写 |
| `bills` | 账单记录 | 仅创建者可读写 |
| `weights` | 体重记录 | 仅创建者可读写 |
| `knowledge` | 知识文章 | 仅创建者可读写 |

所有集合均使用 CloudBase 的 `ADMINWRITE` 权限规则，通过 `_openid` 字段自动实现用户数据隔离。

### 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 📝 开发计划

- [ ] 添加订阅消息提醒功能
- [ ] 数据导出功能
- [ ] 知识板块支持图片上传
- [ ] 多语言支持
- [ ] 社区功能

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

### 📮 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/mryifu/petlife-miniprogram/issues)

---

## English

### ✨ Features

- **📅 Daily Check-in** - Track 8 types of daily activities: feeding, drinking, pooping, bathing, vaccination, walking, deworming, and playing
- **🐕 Pet Management** - Support multiple pets with profile information, avatars, birthdays, etc.
- **📚 Knowledge Base** - Pet care articles in 5 categories: feeding, health, training, grooming, and supplies
- **💰 Expense Tracking** - Record pet expenses with pie chart visualization
- **📈 Weight Tracking** - Monitor pet weight changes with trend line charts
- **👤 User Profile** - Statistics including pet count, check-in count, total expenses, and days of pet ownership

### 🛠️ Tech Stack

- **Frontend**: WeChat Mini Program Native Framework
- **Backend**: WeChat CloudBase
- **Database**: CloudBase NoSQL Database
- **Storage**: Cloud Storage (for pet avatars and images)
- **Cloud Functions**: Node.js + wx-server-sdk

### 🚀 Quick Start

#### Prerequisites

- [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- WeChat Mini Program Account ([Register](https://mp.weixin.qq.com/wxopen/waregister?action=step1))
- WeChat CloudBase Service Enabled

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mryifu/petlife-miniprogram.git
   cd petlife-miniprogram
   ```

2. **Configure Mini Program AppID**

   Modify the `appid` field in `project.config.json`:
   ```json
   {
     "appid": "your-appid-here"
   }
   ```

3. **Configure CloudBase Environment**

   Modify the cloud environment ID in `miniprogram/app.js`:
   ```javascript
   wx.cloud.init({
     env: 'your-cloud-env-id', // Replace with your cloud environment ID
     traceUser: true,
   })
   ```

4. **Open Project**

   Open the project root directory in WeChat DevTools

5. **Deploy Cloud Functions**

   In WeChat DevTools, right-click each cloud function folder under `cloudfunctions` and select "Upload and Deploy: Install Dependencies"

6. **Initialize Database**

   Run the `initKnowledge` cloud function in the CloudBase console to populate sample knowledge articles

7. **Compile and Run**

   Click the "Compile" button in the toolbar to preview in the simulator

### 🎨 UI Design

Warm color scheme with "Cream White + Caramel":

- **Primary**: `#C59D5F` (Caramel)
- **Secondary**: `#E6D5B8` (Oat)
- **Background**: `#FFFBF0` (Cream White)
- **Text**: `#5C4033` (Dark Brown)
- **Border Radius**: `32rpx` (Large rounded corners)

### 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 Roadmap

- [ ] Subscription message reminders
- [ ] Data export functionality
- [ ] Image upload support for knowledge articles
- [ ] Multi-language support
- [ ] Community features

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

### 📮 Contact

For questions or suggestions:

- Submit an [Issue](https://github.com/your-username/petlife-miniprogram/issues)

---

<div align="center">

Made with ❤️ by Pet Lovers

</div>

