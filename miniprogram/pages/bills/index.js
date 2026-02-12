// pages/bills/index.js
const app = getApp()

Page({
  data: {
    petId: '',
    pet: null,
    bills: [],
    filteredBills: [],

    // 筛选条件
    timeFilter: 'month', // today, week, month, year, all
    categoryFilter: 'all',

    // 统计数据
    totalAmount: 0,
    categoryStats: [],

    // 分类定义
    categories: [
      { id: 'food', name: '食品', emoji: '🍖', color: '#FF9500', items: ['主粮', '零食', '营养品', '罐头'] },
      { id: 'medical', name: '医疗', emoji: '💊', color: '#34C759', items: ['疫苗', '驱虫', '看病', '体检', '药品'] },
      { id: 'supplies', name: '用品', emoji: '🎾', color: '#5AC8FA', items: ['玩具', '窝垫', '碗盆', '牵引绳', '猫砂'] },
      { id: 'grooming', name: '美容', emoji: '✂️', color: '#AF52DE', items: ['洗澡', '美容', '剪毛', '指甲'] },
      { id: 'service', name: '服务', emoji: '🏠', color: '#FFB84D', items: ['寄养', '训练', '保险'] },
      { id: 'custom', name: '自定义', emoji: '➕', color: '#FF2D55', items: [] }
    ],

    // 弹窗
    showAddSheet: false,
    categoryIndex: 0,
    newBill: {
      amount: '',
      category: 'food',
      subCategory: '',
      date: '',
      note: ''
    }
  },

  onLoad(options) {
    if (options.petId) {
      this.setData({ petId: options.petId })
      this.loadPetInfo()
      this.loadBills()
    }
  },

  async loadPetInfo() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('pets').doc(this.data.petId).get()
      this.setData({ pet: res.data })
    } catch (err) {
      console.error('加载宠物信息失败', err)
    }
  },

  async loadBills() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'billsQuery',
        data: { petId: this.data.petId }
      })

      if (res.result.success) {
        // 预处理bills数据，附加category信息和格式化金额
        const bills = res.result.data.map(bill => {
          const category = this.data.categories.find(c => c.id === bill.category)
          return {
            ...bill,
            categoryInfo: category || this.data.categories[0],
            amountStr: bill.amount.toFixed(2)
          }
        })

        this.setData({ bills })
        this.filterBills()
      } else {
        throw new Error(res.result.errMsg)
      }
    } catch (err) {
      console.error('加载记账记录失败', err)
    }
  },

  filterBills() {
    let filtered = [...this.data.bills]

    // 时间筛选
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (this.data.timeFilter) {
      case 'today':
        filtered = filtered.filter(bill => new Date(bill.date) >= today)
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        filtered = filtered.filter(bill => new Date(bill.date) >= weekAgo)
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        filtered = filtered.filter(bill => new Date(bill.date) >= monthStart)
        break
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        filtered = filtered.filter(bill => new Date(bill.date) >= yearStart)
        break
    }

    // 分类筛选
    if (this.data.categoryFilter !== 'all') {
      filtered = filtered.filter(bill => bill.category === this.data.categoryFilter)
    }

    this.setData({ filteredBills: filtered })
    this.calculateStats(filtered)
  },

  calculateStats(bills) {
    const total = bills.reduce((sum, bill) => sum + bill.amount, 0)

    const categoryMap = {}
    bills.forEach(bill => {
      if (!categoryMap[bill.category]) {
        categoryMap[bill.category] = 0
      }
      categoryMap[bill.category] += bill.amount
    })

    const categoryStats = Object.keys(categoryMap).map(key => {
      const category = this.data.categories.find(c => c.id === key)
      return {
        ...category,
        amount: categoryMap[key],
        amountStr: categoryMap[key].toFixed(2),
        percent: ((categoryMap[key] / total) * 100).toFixed(1)
      }
    }).sort((a, b) => b.amount - a.amount)

    this.setData({ totalAmount: total.toFixed(2), categoryStats })
  },

  onTimeFilterChange(e) {
    this.setData({ timeFilter: e.currentTarget.dataset.filter })
    this.filterBills()
  },

  onCategoryFilterChange(e) {
    this.setData({ categoryFilter: e.currentTarget.dataset.id })
    this.filterBills()
  },

  showAddBillSheet() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    this.setData({
      showAddSheet: true,
      categoryIndex: 0,
      newBill: {
        amount: '',
        category: 'food',
        subCategory: '',
        date: dateStr,
        note: ''
      }
    })
  },

  closeAddSheet() {
    this.setData({ showAddSheet: false })
  },

  onAmountInput(e) {
    this.setData({ 'newBill.amount': e.detail.value })
  },

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      'newBill.category': this.data.categories[index].id
    })
  },

  onSubCategoryChange(e) {
    this.setData({ 'newBill.subCategory': e.detail.value })
  },

  onDateChange(e) {
    this.setData({ 'newBill.date': e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ 'newBill.note': e.detail.value })
  },

  async saveBill() {
    const { amount, category, subCategory, date, note } = this.data.newBill

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const db = wx.cloud.database()
      await db.collection('bills').add({
        data: {
          petId: this.data.petId,
          amount: parseFloat(amount),
          category: category,
          subCategory: subCategory,
          date: date,
          note: note,
          createTime: new Date()
        }
      })

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showAddSheet: false })
      this.loadBills()
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  deleteBill(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条消费记录吗？',
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
      await db.collection('bills').doc(id).remove()
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      this.loadBills()
    } catch (err) {
      wx.hideLoading()
      console.error('删除失败', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  stopPropagation() {}
})
