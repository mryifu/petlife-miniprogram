// pages/charts/index.js
const app = getApp()

Page({
    data: {
        activeTab: 'weight',
        today: '',
        newWeight: '',
        currentWeight: 0,
        maxWeight: 0,
        minWeight: 0,
        weightHistory: [],

        // 账单数据
        currentMonth: 1,
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        totalExpense: 0,
        expenseTypes: ['食品', '医疗', '玩具', '洗护', '其他'],
        expenseCategories: [],
        newExpense: {
            amount: '',
            type: '',
            note: ''
        },
        recentExpenses: []
    },

    onLoad() {
        const now = new Date()
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
        this.setData({
            today,
            currentMonth: now.getMonth() + 1
        })
    },

    onShow() {
        this.loadWeightData()
        this.loadExpenseData()
    },

    onReady() {
        setTimeout(() => {
            this.drawWeightChart()
            this.drawExpenseChart()
        }, 300)
    },

    // 加载体重数据
    loadWeightData() {
        const pet = app.globalData.currentPet
        if (!pet || !pet._id) return

        wx.cloud.callFunction({
            name: 'weightsQuery',
            data: { petId: pet._id }
        }).then(res => {
            if (res.result.success) {
                const weightHistory = res.result.data.slice(0, 30).map(w => ({
                    date: w.date,
                    weight: w.weight
                }))

                if (weightHistory.length > 0) {
                    const weights = weightHistory.map(w => w.weight)
                    this.setData({
                        weightHistory,
                        currentWeight: weights[0],
                        maxWeight: Math.max(...weights),
                        minWeight: Math.min(...weights)
                    })
                }

                setTimeout(() => this.drawWeightChart(), 100)
            }
        }).catch(err => console.error('加载体重数据失败', err))
    },

    // 加载账单数据
    loadExpenseData() {
        const pet = app.globalData.currentPet
        if (!pet || !pet._id) return

        // 获取当月起止日期
        const now = new Date()
        const year = now.getFullYear()
        const month = this.data.currentMonth
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        const endDate = month === 12
            ? `${year + 1}-01-01`
            : `${year}-${(month + 1).toString().padStart(2, '0')}-01`

        wx.cloud.callFunction({
            name: 'billsQuery',
            data: {
                petId: pet._id,
                startDate,
                endDate
            }
        }).then(res => {
            if (res.result.success) {
                const bills = res.result.data

                // 统计各分类
                const categoryMap = {}
                const colors = {
                    '食品': '#FF9500',
                    '医疗': '#34C759',
                    '玩具': '#5AC8FA',
                    '洗护': '#AF52DE',
                    '其他': '#8E8E93'
                }

                let total = 0
                bills.forEach(bill => {
                    const type = bill.type || '其他'
                    categoryMap[type] = (categoryMap[type] || 0) + bill.amount
                    total += bill.amount
                })

                const expenseCategories = Object.keys(categoryMap).map(type => ({
                    name: type,
                    amount: categoryMap[type],
                    percent: total > 0 ? Math.round((categoryMap[type] / total) * 100) : 0,
                    color: colors[type] || '#8E8E93'
                }))

                // 最近账单
                const recentExpenses = bills.slice(0, 10).map(bill => ({
                    _id: bill._id,
                    type: bill.type,
                    amount: bill.amount,
                    note: bill.note,
                    date: bill.date.slice(5),
                    color: colors[bill.type] || '#8E8E93'
                }))

                this.setData({
                    totalExpense: total,
                    expenseCategories,
                    recentExpenses
                })

                setTimeout(() => this.drawExpenseChart(), 100)
            }
        }).catch(err => console.error('加载账单数据失败', err))
    },

    switchTab(e) {
        const tab = e.currentTarget.dataset.tab
        this.setData({ activeTab: tab })

        if (tab === 'weight') {
            setTimeout(() => this.drawWeightChart(), 100)
        } else {
            setTimeout(() => this.drawExpenseChart(), 100)
        }
    },

    onWeightInput(e) {
        this.setData({ newWeight: e.detail.value })
    },

    // 添加体重记录
    addWeight() {
        const weight = parseFloat(this.data.newWeight)
        if (!weight || weight <= 0) {
            wx.showToast({ title: '请输入有效体重', icon: 'none' })
            return
        }

        const pet = app.globalData.currentPet
        if (!pet || !pet._id) {
            wx.showToast({ title: '请先选择宠物', icon: 'none' })
            return
        }

        wx.showLoading({ title: '保存中' })
        const db = wx.cloud.database()

        db.collection('weights').add({
            data: {
                petId: pet._id,
                weight,
                date: this.data.today,
                createTime: new Date()
            }
        })
            .then(() => {
                // 同时更新宠物当前体重
                return db.collection('pets').doc(pet._id).update({
                    data: { weight }
                })
            })
            .then(() => {
                wx.hideLoading()
                wx.showToast({ title: '记录成功', icon: 'success' })
                this.setData({ newWeight: '' })
                this.loadWeightData()
            })
            .catch(err => {
                wx.hideLoading()
                console.error('保存体重失败', err)
                wx.showToast({ title: '保存失败', icon: 'none' })
            })
    },

    drawWeightChart() {
        const ctx = wx.createCanvasContext('weightChart', this)
        const data = this.data.weightHistory.slice().reverse()

        if (data.length === 0) {
            ctx.setFillStyle('#999999')
            ctx.setFontSize(14)
            ctx.fillText('暂无数据', 280, 150)
            ctx.draw()
            return
        }

        const width = 650
        const height = 300
        const padding = 40
        const chartWidth = width - padding * 2
        const chartHeight = height - padding * 2

        ctx.setFillStyle('#ffffff')
        ctx.fillRect(0, 0, width, height)

        const weights = data.map(d => d.weight)
        const minW = Math.min(...weights) - 0.5
        const maxW = Math.max(...weights) + 0.5
        const xStep = chartWidth / (data.length - 1 || 1)
        const yScale = chartHeight / (maxW - minW)

        // 网格线
        ctx.setStrokeStyle('#f0f0f0')
        ctx.setLineWidth(1)
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i
            ctx.beginPath()
            ctx.moveTo(padding, y)
            ctx.lineTo(width - padding, y)
            ctx.stroke()
        }

        // 折线
        ctx.setStrokeStyle('#A67C52')
        ctx.setLineWidth(3)
        ctx.beginPath()

        data.forEach((item, i) => {
            const x = padding + i * xStep
            const y = padding + (maxW - item.weight) * yScale
            if (i === 0) {
                ctx.moveTo(x, y)
            } else {
                ctx.lineTo(x, y)
            }
        })
        ctx.stroke()

        // 数据点
        ctx.setFillStyle('#A67C52')
        data.forEach((item, i) => {
            const x = padding + i * xStep
            const y = padding + (maxW - item.weight) * yScale
            ctx.beginPath()
            ctx.arc(x, y, 6, 0, Math.PI * 2)
            ctx.fill()
        })

        // 日期标签
        ctx.setFillStyle('#999999')
        ctx.setFontSize(10)
        data.forEach((item, i) => {
            if (i % 2 === 0 || data.length <= 5) {
                const x = padding + i * xStep
                ctx.fillText(item.date.slice(5), x - 15, height - 10)
            }
        })

        ctx.draw()
    },

    drawExpenseChart() {
        const ctx = wx.createCanvasContext('expenseChart', this)
        const categories = this.data.expenseCategories

        const width = 300
        const height = 300
        const centerX = width / 2
        const centerY = height / 2
        const radius = 100

        ctx.setFillStyle('#ffffff')
        ctx.fillRect(0, 0, width, height)

        if (categories.length === 0) {
            ctx.setFillStyle('#999999')
            ctx.setFontSize(14)
            ctx.setTextAlign('center')
            ctx.fillText('暂无数据', centerX, centerY)
            ctx.draw()
            return
        }

        let startAngle = -Math.PI / 2

        categories.forEach(cat => {
            const sliceAngle = (cat.percent / 100) * Math.PI * 2

            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
            ctx.closePath()
            ctx.setFillStyle(cat.color)
            ctx.fill()

            startAngle += sliceAngle
        })

        // 中心圆
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2)
        ctx.setFillStyle('#ffffff')
        ctx.fill()

        // 总金额
        ctx.setFillStyle('#333333')
        ctx.setFontSize(14)
        ctx.setTextAlign('center')
        ctx.fillText('¥' + this.data.totalExpense, centerX, centerY + 5)

        ctx.draw()
    },

    onMonthChange(e) {
        const month = parseInt(e.detail.value) + 1
        this.setData({ currentMonth: month })
        this.loadExpenseData()
    },

    onExpenseAmountInput(e) {
        this.setData({ 'newExpense.amount': e.detail.value })
    },

    onExpenseTypeChange(e) {
        this.setData({ 'newExpense.type': this.data.expenseTypes[e.detail.value] })
    },

    onExpenseNoteInput(e) {
        this.setData({ 'newExpense.note': e.detail.value })
    },

    // 添加账单
    addExpense() {
        const { amount, type } = this.data.newExpense

        if (!amount || !type) {
            wx.showToast({ title: '请填写金额和分类', icon: 'none' })
            return
        }

        const pet = app.globalData.currentPet
        if (!pet || !pet._id) {
            wx.showToast({ title: '请先选择宠物', icon: 'none' })
            return
        }

        wx.showLoading({ title: '保存中' })
        const db = wx.cloud.database()

        db.collection('bills').add({
            data: {
                petId: pet._id,
                amount: parseFloat(amount),
                type,
                note: this.data.newExpense.note,
                date: this.data.today,
                createTime: new Date()
            }
        })
            .then(() => {
                wx.hideLoading()
                wx.showToast({ title: '记录成功', icon: 'success' })
                this.setData({ newExpense: { amount: '', type: '', note: '' } })
                this.loadExpenseData()
            })
            .catch(err => {
                wx.hideLoading()
                console.error('保存账单失败', err)
                wx.showToast({ title: '保存失败', icon: 'none' })
            })
    }
})
