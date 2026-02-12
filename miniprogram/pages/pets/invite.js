// pages/pets/invite.js
Page({
  data: {
    petId: '',
    code: '',
    expireTime: '',
    loading: false
  },

  onLoad(options) {
    if (options.petId) {
      this.setData({ petId: options.petId })
    }
  },

  // 生成邀请码
  generateCode() {
    if (!this.data.petId) {
      wx.showToast({ title: '缺少宠物ID', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'invitationCreate',
      data: { petId: this.data.petId }
    }).then(res => {
      if (res.result.success) {
        const expireDate = new Date(res.result.expireTime)
        const expireTimeStr = `${expireDate.getMonth() + 1}月${expireDate.getDate()}日 ${expireDate.getHours()}:${String(expireDate.getMinutes()).padStart(2, '0')}`

        this.setData({
          code: res.result.code,
          expireTime: expireTimeStr,
          loading: false
        })

        wx.showToast({ title: '生成成功', icon: 'success' })
      } else {
        throw new Error(res.result.errMsg)
      }
    }).catch(err => {
      console.error('生成邀请码失败', err)
      wx.showToast({ title: err.message || '生成失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 重新生成
  regenerateCode() {
    wx.showModal({
      title: '确认重新生成',
      content: '旧的邀请码将失效',
      success: res => {
        if (res.confirm) {
          this.setData({ code: '', expireTime: '' })
          this.generateCode()
        }
      }
    })
  },

  // 复制邀请码
  copyCode() {
    wx.setClipboardData({
      data: this.data.code,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
})
