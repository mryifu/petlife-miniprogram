# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**爪爪手账 (PetLife)** - A WeChat Mini Program for pet lifecycle management built with native WeChat Mini Program framework and WeChat CloudBase.

- **Tech Stack**: WeChat Mini Program (native) + WeChat Cloud Development (CloudBase)
- **Cloud Environment ID**: Configure your own cloud environment ID in `miniprogram/app.js`
- **AppID**: Configure your own AppID in `project.config.json`
- **Base Library Version**: 2.19.4

## Development Commands

### Running the Project
- Open the project root (`E:\cc`) in **WeChat DevTools** (微信开发者工具)
- The IDE handles compilation and preview automatically
- Use the simulator or scan QR code for real device testing

### Cloud Functions Deployment
Right-click on each cloud function folder in WeChat DevTools:
- `cloudfunctions/login/` → "上传并部署：云端安装依赖"
- `cloudfunctions/aiChat/` → "上传并部署：云端安装依赖"
- `cloudfunctions/initKnowledge/` → "上传并部署：云端安装依赖"

### Database Initialization
- Run the `initKnowledge` cloud function in WeChat DevTools to populate sample knowledge articles
- Database collections are auto-created on first write

## Architecture

### Directory Structure
```
miniprogram/          # Frontend code
├── app.js            # Entry point, cloud init
├── app.json          # Global config (routes, tabBar)
├── app.wxss          # Global styles (cream theme)
├── pages/            # Page components
└── images/           # Static assets

cloudfunctions/       # Backend cloud functions
├── login/            # Get user openid
├── aiChat/           # GLM-4 AI chat integration
└── initKnowledge/    # Database seeding
```

### Key Pages
- `pages/index/` - Daily check-in (feeding, walking, etc.) with FAB + bottom sheet
- `pages/pets/` - Pet CRUD (list + form)
- `pages/knowledge/` - Knowledge base (5 categories: feeding, health, training, grooming, supplies)
- `pages/ai/` - AI Q&A powered by GLM-4.7-Flash
- `pages/charts/` - Expense pie chart & weight trend line chart
- `pages/profile/` - User stats and settings

### Cloud Development Architecture
- **Database**: NoSQL document database (see `miniprogram/DATABASE.md`)
  - Collections: `pets`, `logs`, `bills`, `weights`, `knowledge`, `posts` (deprecated)
  - Security: ADMINWRITE rules (users can only access their own data via `_openid`)
- **Cloud Functions**: Node.js functions with `wx-server-sdk`
- **Cloud Storage**: Used for pet avatars and images

### Data Flow
1. App launch → `app.js` initializes cloud with `wx.cloud.init()`
2. Auto-login via `login` cloud function to get `openid`
3. All database queries auto-filter by `_openid` (CloudBase security)
4. Pet selection stored in `app.globalData.currentPet`

### AI Integration
- If you plan to add AI features, you'll need to integrate your own AI API
- Consider using GLM-4, OpenAI, or other AI services
- Store API keys securely in cloud functions, never in frontend code

## Important Notes

### Cloud Environment Mismatch
- **Important**: Configure your own cloud environment ID in `miniprogram/app.js`
- Replace `'your-cloud-env-id'` with your actual CloudBase environment ID

### Database Access Pattern
Always use CloudBase SDK, not direct queries:
```javascript
const db = wx.cloud.database()
db.collection('pets').where({
  _openid: '{openid}'  // Auto-replaced by CloudBase
}).get()
```

### Theme System
Cream + caramel color scheme defined in `app.wxss`:
- Primary: `#C59D5F` (caramel)
- Background: `#FFFBF0` (cream white)
- Text: `#5C4033` (dark brown)
- Border radius: `32rpx` (large rounded corners)

### WeChat Mini Program Specifics
- Use `rpx` units (responsive pixels, 750rpx = screen width)
- Page lifecycle: `onLoad` → `onShow` → `onReady`
- Cloud functions have 20s timeout by default
- Image uploads use `wx.cloud.uploadFile()`

## Database Schema Reference

See `miniprogram/DATABASE.md` for full schema. Key collections:

- **pets**: Pet profiles (name, species, gender, birthday, avatar, weight)
- **logs**: Daily activities (8 types: food/water/poop/bath/vaccine/walk/medicine/play)
- **bills**: Expense tracking (amount, type, date)
- **weights**: Weight history for trend charts
- **knowledge**: Articles with 5 categories

All collections include `_openid` for user isolation and `createTime` timestamp.
