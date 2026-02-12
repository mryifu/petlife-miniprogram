// pages/weight/index.js
const app = getApp()

Page({
  data: {
    petId: '',
    pet: null,
    weights: [],
    currentWeight: 0,
    targetWeight: 0,
    weightChange: 0,
    weightChangePercent: 0,
    targetDiff: 0,
    targetDiffStr: '',
    targetDiffClass: '',
    targetDiffSign: '',
    showAddSheet: false,
    showTargetSheet: false,
    newWeight: {
      weight: '',
      date: '',
      note: ''
    },
    chartData: {
      categories: [],
      series: []
    }
  },

  onLoad(options) {
    if (options.petId) {
      this.setData({ petId: options.petId })
      this.loadPetInfo()
      this.loadWeights()
    }
  },

  async loadPetInfo() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('pets').doc(this.data.petId).get()
      this.setData({
        pet: res.data,
        currentWeight: res.data.weight || 0,
        targetWeight: res.data.targetWeight || 0
      })
    } catch (err) {
      console.error('加载宠物信息失败', err)
    }
  },

  async loadWeights() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'weightsQuery',
        data: { petId: this.data.petId }
      })

      if (res.result.success) {
        const weights = res.result.data
        this.setData({ weights })
        this.calculateStats(weights)
        this.prepareChartData(weights)
      } else {
        throw new Error(res.result.errMsg)
      }
    } catch (err) {
      console.error('加载体重记录失败', err)
    }
  },

  calculateStats(weights) {
    if (weights.length < 2) return

    const current = weights[0].weight
    const previous = weights[1].weight
    const change = current - previous
    const changePercent = ((change / previous) * 100).toFixed(1)

    this.setData({
      currentWeight: current,
      weightChange: change.toFixed(2),
      weightChangePercent: changePercent
    })
  },

  prepareChartData(weights) {
    const categories = []
    const series = []

    weights.reverse().forEach(item => {
      categories.push(this.formatDate(item.date))
      series.push(item.weight)
    })

    this.setData({
      chartData: { categories, series }
    })
  },

  formatDate(dateStr) {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  showAddWeightSheet() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    this.setData({
      showAddSheet: true,
      newWeight: {
        weight: this.data.currentWeight.toString(),
        date: dateStr,
        note: ''
      }
    })
  },

  closeAddSheet() {
    this.setData({ showAddSheet: false })
  },

  onWeightInput(e) {
    this.setData({ 'newWeight.weight': e.detail.value })
  },

  onDateChange(e) {
    this.setData({ 'newWeight.date': e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ 'newWeight.note': e.detail.value })
  },

  async saveWeight() {
    const { weight, date, note } = this.data.newWeight

    if (!weight || parseFloat(weight) <= 0) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const db = wx.cloud.database()
      await db.collection('weights').add({
        data: {
          petId: this.data.petId,
          weight: parseFloat(weight),
          date: date,
          note: note,
          createTime: new Date()
        }
      })

      // 更新宠物表的当前体重
      await db.collection('pets').doc(this.data.petId).update({
        data: { weight: parseFloat(weight) }
      })

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showAddSheet: false })
      this.loadPetInfo()
      this.loadWeights()
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  showTargetWeightSheet() {
    const targetWeight = this.data.pet.targetWeight || this.data.currentWeight
    const diff = targetWeight - this.data.currentWeight

    this.setData({
      showTargetSheet: true,
      targetWeight: targetWeight,
      targetDiff: diff,
      targetDiffStr: Math.abs(diff).toFixed(2),
      targetDiffClass: diff > 0 ? 'up' : 'down',
      targetDiffSign: diff > 0 ? '+' : ''
    })
  },

  closeTargetSheet() {
    this.setData({ showTargetSheet: false })
  },

  onTargetInput(e) {
    const targetWeight = parseFloat(e.detail.value) || 0
    const diff = targetWeight - this.data.currentWeight

    this.setData({
      targetWeight: targetWeight,
      targetDiff: diff,
      targetDiffStr: Math.abs(diff).toFixed(2),
      targetDiffClass: diff > 0 ? 'up' : 'down',
      targetDiffSign: diff > 0 ? '+' : ''
    })
  },

  async saveTarget() {
    const targetWeight = this.data.targetWeight

    if (targetWeight <= 0) {
      wx.showToast({ title: '请输入有效目标', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const db = wx.cloud.database()
      await db.collection('pets').doc(this.data.petId).update({
        data: { targetWeight: targetWeight }
      })

      wx.hideLoading()
      wx.showToast({ title: '目标已设置', icon: 'success' })
      this.setData({ showTargetSheet: false })
      this.loadPetInfo()
    } catch (err) {
      wx.hideLoading()
      console.error('保存失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  deleteWeight(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条体重记录吗？',
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
      await db.collection('weights').doc(id).remove()
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      this.loadWeights()
    } catch (err) {
      wx.hideLoading()
      console.error('删除失败', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  stopPropagation() {}
})
