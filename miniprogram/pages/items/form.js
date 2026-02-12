// pages/items/form.js
const app = getApp()

Page({
  data: {
    itemId: null,
    isEdit: false,
    categories: [
      { id: 'food', name: '食品' },
      { id: 'medical', name: '医疗' },
      { id: 'toy', name: '玩具' },
      { id: 'grooming', name: '美容' },
      { id: 'other', name: '其他' }
    ],
    categoryIndex: 0,
    form: {
      image: '',
      name: '',
      category: 'food',
      brand: '',
      type: '',
      purchaseDate: '',
      expiryDate: '',
      quantity: '',
      price: '',
      notes: '',
      isMedical: false,
      nextDueDate: '',
      reminderEnabled: true,
      reminderDays: 7,
      status: 'active'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ itemId: options.id, isEdit: true })
      this.loadItem(options.id)
    } else {
      const today = this.formatDate(new Date())
      this.setData({ 'form.purchaseDate': today })
    }
  },

  async loadItem(id) {
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()
    try {
      const res = await db.collection('items').doc(id).get()
      const categoryIndex = this.data.categories.findIndex(c => c.id === res.data.category)
      this.setData({ form: res.data, categoryIndex })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      console.error('加载失败', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({ 'form.image': res.tempFiles[0].tempFilePath })
      }
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    const index = e.detail.value
    const category = this.data.categories[index].id
    const isMedical = category === 'medical'
    this.setData({
      categoryIndex: index,
      'form.category': category,
      'form.isMedical': isMedical
    })
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onReminderToggle(e) {
    this.setData({ 'form.reminderEnabled': e.detail.value })
  },

  async uploadImage(filePath) {
    if (!filePath || filePath.startsWith('cloud://')) {
      return filePath
    }

    const cloudPath = `items/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    })
    return res.fileID
  },

  async saveItem() {
    const form = this.data.form

    if (!form.name) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const cloudImage = await this.uploadImage(form.image)
      const db = wx.cloud.database()

      const data = {
        ...form,
        image: cloudImage,
        petId: app.globalData.currentPet._id,
        updateTime: new Date()
      }

      if (this.data.isEdit) {
        await db.collection('items').doc(this.data.itemId).update({ data })
      } else {
        data.createTime = new Date()
        await db.collection('items').add({ data })
      }

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
