// pages/album/detail.js
const app = getApp()

Page({
  data: {
    album: null,
    allAlbums: [],
    currentIndex: 0
  },

  onLoad(options) {
    const albumId = options.id
    this.loadAlbum(albumId)
  },

  async loadAlbum(albumId) {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('albums').doc(albumId).get()
      const album = res.data

      const allRes = await db.collection('albums')
        .where({ petId: album.petId })
        .orderBy('date', 'desc')
        .orderBy('createTime', 'desc')
        .get()

      const allAlbums = allRes.data
      const currentIndex = allAlbums.findIndex(a => a._id === albumId)

      this.setData({ album, allAlbums, currentIndex })
    } catch (err) {
      console.error('加载照片失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  previewImage() {
    const urls = this.data.allAlbums.map(a => a.image)
    wx.previewImage({
      urls: urls,
      current: this.data.album.image
    })
  },

  prevPhoto() {
    if (this.data.currentIndex > 0) {
      const newIndex = this.data.currentIndex - 1
      const album = this.data.allAlbums[newIndex]
      this.setData({ album, currentIndex: newIndex })
    }
  },

  nextPhoto() {
    if (this.data.currentIndex < this.data.allAlbums.length - 1) {
      const newIndex = this.data.currentIndex + 1
      const album = this.data.allAlbums[newIndex]
      this.setData({ album, currentIndex: newIndex })
    }
  },

  deletePhoto() {
    wx.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗?',
      success: async (res) => {
        if (res.confirm) {
          await this.performDelete()
        }
      }
    })
  },

  async performDelete() {
    wx.showLoading({ title: '删除中...' })
    const db = wx.cloud.database()
    try {
      await db.collection('albums').doc(this.data.album._id).remove()
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('删除失败', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  }
})
