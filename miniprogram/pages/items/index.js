// pages/items/index.js
const app = getApp()

Page({
  data: {
    pets: [],
    currentPet: null,
    categories: [
      { id: 'food', name: '食品', emoji: '🍖', color: '#FF9500' },
      { id: 'medical', name: '医疗', emoji: '💊', color: '#34C759' },
      { id: 'toy', name: '玩具', emoji: '🎾', color: '#5AC8FA' },
      { id: 'grooming', name: '美容', emoji: '✂️', color: '#AF52DE' },
      { id: 'other', name: '其他', emoji: '📦', color: '#FF2D55' }
    ],
    activeCategory: 'food',
    items: [],
    filteredItems: []
  },

  onLoad() {
    this.loadPets()
  },

  onShow() {
    if (this.data.currentPet) {
      this.loadItems()
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
        this.loadItems()
      } else {
        this.setData({ pets: [] })
      }
    } catch (err) {
      console.error('加载宠物失败', err)
    }
  },

  async loadItems() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('items')
        .where({ petId: this.data.currentPet._id })
        .orderBy('createTime', 'desc')
        .get()

      const items = res.data.map(item => ({
        ...item,
        statusBadge: this.getStatusBadge(item)
      }))

      this.setData({ items })
      this.filterItems()
    } catch (err) {
      console.error('加载物品失败', err)
      this.setData({ items: [], filteredItems: [] })
    }
  },

  filterItems() {
    const filtered = this.data.items.filter(item =>
      item.category === this.data.activeCategory
    )
    const activeCategoryName = this.data.categories.find(c => c.id === this.data.activeCategory).name
    this.setData({ filteredItems: filtered, activeCategoryName })
  },

  onPetChange(e) {
    const index = e.detail.value
    const currentPet = this.data.pets[index]
    app.globalData.currentPet = currentPet
    this.setData({ currentPet })
    this.loadItems()
  },

  onCategoryChange(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ activeCategory: categoryId })
    this.filterItems()
  },

  addItem() {
    wx.navigateTo({
      url: '/pages/items/form'
    })
  },

  editItem(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/items/form?id=${id}`
    })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除物品',
      content: '确定要删除这个物品吗?',
      success: async (res) => {
        if (res.confirm) {
          await this.performDelete(id)
        }
      }
    })
  },

  async performDelete(id) {
    wx.showLoading({ title: '删除中...' })
    const db = wx.cloud.database()
    try {
      await db.collection('items').doc(id).remove()
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      this.loadItems()
    } catch (err) {
      wx.hideLoading()
      console.error('删除失败', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  calculateDaysUntil(dateStr) {
    if (!dateStr) return null
    const targetDate = new Date(dateStr)
    const now = new Date()
    const diffTime = targetDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  },

  getStatusBadge(item) {
    if (item.status === 'used') return { text: '已用完', color: '#999' }
    if (item.status === 'expired') return { text: '已过期', color: '#FF3B30' }

    if (item.expiryDate) {
      const days = this.calculateDaysUntil(item.expiryDate)
      if (days < 0) return { text: '已过期', color: '#FF3B30' }
      if (days <= 30) return { text: `${days}天后过期`, color: '#FF9500' }
    }

    if (item.isMedical && item.nextDueDate) {
      const days = this.calculateDaysUntil(item.nextDueDate)
      if (days < 0) return { text: '已逾期', color: '#FF3B30' }
      if (days <= item.reminderDays) return { text: `${days}天后到期`, color: '#FF9500' }
    }

    return { text: '正常', color: '#34C759' }
  }
})

