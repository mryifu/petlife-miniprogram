// pages/pets/members.js
const app = getApp()

Page({
  data: {
    petId: '',
    petName: '',
    members: [],
    myOpenid: '',
    isCreator: false,
    loading: true
  },

  onLoad(options) {
    if (options.petId) {
      this.setData({ petId: options.petId })
      this.fetchMembers()
    }
  },

  // 获取成员列表
  fetchMembers() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'memberQuery',
      data: { petId: this.data.petId }
    }).then(res => {
      if (res.result.success) {
        const members = res.result.data
        const myMember = members.find(m => m._openid === app.globalData.openid)

        this.setData({
          members,
          petName: members[0]?.petName || '',
          myOpenid: app.globalData.openid,
          isCreator: myMember?.isCreator || false,
          loading: false
        })
      } else {
        throw new Error(res.result.errMsg)
      }
    }).catch(err => {
      console.error('获取成员列表失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  // 移除成员
  removeMember(e) {
    const targetOpenid = e.currentTarget.dataset.openid

    wx.showModal({
      title: '确认移除',
      content: '确定要移除该成员吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'memberRemove',
            data: {
              petId: this.data.petId,
              targetOpenid
            }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '已移除', icon: 'success' })
              this.fetchMembers()
            } else {
              wx.showToast({ title: res.result.errMsg, icon: 'none' })
            }
          }).catch(err => {
            console.error('移除失败', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 退出共养
  leavePet() {
    wx.showModal({
      title: '确认退出',
      content: '退出后将无法查看该宠物的信息',
      success: res => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'memberRemove',
            data: { petId: this.data.petId }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '已退出', icon: 'success' })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({ title: res.result.errMsg, icon: 'none' })
            }
          }).catch(err => {
            console.error('退出失败', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 邀请成员
  inviteMember() {
    wx.navigateTo({
      url: `/pages/pets/invite?petId=${this.data.petId}`
    })
  }
})
