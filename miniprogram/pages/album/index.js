// pages/album/index.js
const app = getApp()

Page({
  data: {
    pets: [],
    currentPet: null,
    albums: [],
    groupedAlbums: [],
    showAddSheet: false,
    newAlbum: {
      images: [],
      description: '',
      date: '',
      time: ''
    }
  },

  onLoad() {
    this.loadPets()
  },

  onShow() {
    if (this.data.currentPet) {
      this.loadAlbums()
    }
  },

  async loadPets() {
    if (!app.globalData.openid) {
      setTimeout(() => this.loadPets(), 1000)
      return
    }

    const db = wx.cloud.database()
    try {
      const res = await db.collection('pets').get()
      const pets = res.data

      if (pets.length > 0) {
        const currentPet = app.globalData.currentPet || pets[0]
        this.setData({ pets, currentPet })
        this.loadAlbums()
      } else {
        this.setData({ pets: [] })
      }
    } catch (err) {
      console.error('加载宠物失败', err)
    }
  },

  async loadAlbums() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('albums')
        .where({ petId: this.data.currentPet._id })
        .orderBy('date', 'desc')
        .orderBy('createTime', 'desc')
        .get()

      const albums = res.data
      this.groupAlbumsByDate(albums)
    } catch (err) {
      console.error('加载相册失败', err)
      this.setData({ albums: [], groupedAlbums: [] })
    }
  },

  groupAlbumsByDate(albums) {
    const grouped = []
    let currentDate = null
    let currentGroup = null

    albums.forEach(album => {
      if (album.date !== currentDate) {
        if (currentGroup) {
          grouped.push(currentGroup)
        }
        currentDate = album.date
        currentGroup = {
          date: album.date,
          dateLabel: this.formatDateLabel(album.date),
          items: []
        }
      }
      currentGroup.items.push(album)
    })

    if (currentGroup) {
      grouped.push(currentGroup)
    }

    this.setData({ albums, groupedAlbums: grouped })
  },

  formatDateLabel(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === this.formatDate(today)) {
      return '今天'
    } else if (dateStr === this.formatDate(yesterday)) {
      return '昨天'
    } else {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const weekday = weekdays[date.getDay()]
      return `${year}年${month}月${day}日 ${weekday}`
    }
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  },

  onPetChange(e) {
    const index = e.detail.value
    const currentPet = this.data.pets[index]
    app.globalData.currentPet = currentPet
    this.setData({ currentPet })
    this.loadAlbums()
  },

  showAddAlbum() {
    const now = new Date()
    this.setData({
      showAddSheet: true,
      newAlbum: {
        images: [],
        description: '',
        date: this.formatDate(now),
        time: this.formatTime(now)
      }
    })
  },

  closeAddSheet() {
    this.setData({ showAddSheet: false })
  },

  stopPropagation() {},

  chooseImages() {
    wx.chooseMedia({
      count: 9 - this.data.newAlbum.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const newImages = res.tempFiles.map(f => f.tempFilePath)
        this.setData({
          'newAlbum.images': [...this.data.newAlbum.images, ...newImages]
        })
      }
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.newAlbum.images]
    images.splice(index, 1)
    this.setData({ 'newAlbum.images': images })
  },

  onDescriptionInput(e) {
    this.setData({ 'newAlbum.description': e.detail.value })
  },

  onDateChange(e) {
    this.setData({ 'newAlbum.date': e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ 'newAlbum.time': e.detail.value })
  },

  async uploadImages(filePaths) {
    const uploadPromises = filePaths.map(async (filePath, index) => {
      if (filePath.startsWith('cloud://')) return filePath

      const cloudPath = `albums/${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}.jpg`
      const res = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      return res.fileID
    })

    return Promise.all(uploadPromises)
  },

  async saveAlbum() {
    const { images, description, date, time } = this.data.newAlbum

    if (images.length === 0) {
      wx.showToast({ title: '请选择照片', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const cloudImages = await this.uploadImages(images)
      const db = wx.cloud.database()

      for (let i = 0; i < cloudImages.length; i++) {
        await db.collection('albums').add({
          data: {
            petId: this.data.currentPet._id,
            image: cloudImages[i],
            description: description,
            date: date,
            time: time,
            createTime: new Date()
          }
        })
      }

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showAddSheet: false })
      this.loadAlbums()
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  viewPhoto(e) {
    const albumId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/album/detail?id=${albumId}`
    })
  }
})
