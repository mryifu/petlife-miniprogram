// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    // 尝试初始化云开发
    try {
      wx.cloud.init({
        env: 'your-cloud-env-id', // 请在 project.private.config.json 中配置你的云环境 ID
        traceUser: true,
      })
      this.globalData.cloudReady = true
    } catch (err) {
      console.error('云开发初始化失败', err)
      this.globalData.cloudReady = false
    }

    // 获取用户登录状态
    this.checkLogin()
  },

  // 检查登录状态
  checkLogin() {
    if (!this.globalData.cloudReady) {
      console.log('云开发未就绪，跳过登录')
      return
    }

    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('登录成功', res.result)
        if (res.result) {
          this.globalData.openid = res.result.openid
          // 登录成功后检查数据迁移
          this.checkDataMigration()
        }
      },
      fail: err => {
        console.log('登录失败，使用本地模式', err)
        // 云开发未配置时使用模拟openid
        this.globalData.openid = 'local_user_' + Date.now()
      }
    })
  },

  // 检查并执行数据迁移
  checkDataMigration() {
    const migrationKey = 'pet_members_migration_completed'
    const migrationCompleted = wx.getStorageSync(migrationKey)

    if (migrationCompleted) {
      console.log('数据迁移已完成')
      return
    }

    console.log('开始数据迁移...')
    wx.cloud.callFunction({
      name: 'dataMigration',
      success: res => {
        if (res.result.success) {
          console.log('数据迁移成功', res.result)
          wx.setStorageSync(migrationKey, true)
        } else {
          console.error('数据迁移失败', res.result.errMsg)
        }
      },
      fail: err => {
        console.error('数据迁移调用失败', err)
      }
    })
  },

  globalData: {
    userInfo: null,
    openid: null,
    currentPet: null,
    cloudReady: false
  }
})
