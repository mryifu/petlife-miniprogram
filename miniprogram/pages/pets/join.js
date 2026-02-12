// pages/pets/join.js
Page({
  data: {
    code: '',
    joining: false
  },

  onCodeInput(e) {
    this.setData({
      code: e.detail.value.toUpperCase()
    })
  },

  // 加入共养
  joinPet() {
    const code = this.data.code.trim()

    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }

    if (code.length !== 6) {
      wx.showToast({ title: '邀请码为6位', icon: 'none' })
      return
    }

    this.setData({ joining: true })

    wx.cloud.callFunction({
      name: 'invitationAccept',
      data: { code }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '加入成功', icon: 'success' })

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/pets/index'
          })
        }, 1500)
      } else {
        wx.showToast({ title: res.result.errMsg, icon: 'none' })
        this.setData({ joining: false })
      }
    }).catch(err => {
      console.error('加入失败', err)
      wx.showToast({ title: '加入失败', icon: 'none' })
      this.setData({ joining: false })
    })
  }
})
