// pages/index/index.js
const app = getApp()

Page({
    data: {
        currentPet: null,
        actionTypes: [
            { type: 'food', label: '进食', emoji: '🍖', color: '#FF9500' },
            { type: 'water', label: '喝水', emoji: '💧', color: '#5AC8FA' },
            { type: 'poop', label: '排泄', emoji: '💩', color: '#8E8E93' },
            { type: 'bath', label: '洗澡', emoji: '🛁', color: '#007AFF' },
            { type: 'vaccine', label: '疫苗', emoji: '💉', color: '#34C759' },
            { type: 'walk', label: '遛弯', emoji: '🐾', color: '#AF52DE' },
            { type: 'medicine', label: '驱虫', emoji: '💊', color: '#FF2D55' },
            { type: 'play', label: '玩耍', emoji: '🎾', color: '#FFCC00' }
        ],
        logs: [],
        historyLogs: [],

        // 弹窗相关状态
        showActionSheet: false,
        logStep: 1, // 1: 选择类型, 2: 填写表单
        saving: false,

        currentLog: {
            type: '',
            typeLabel: '',
            time: '',
            note: '',
            images: []
        }
    },

    onShow() {
        this.updateCurrentPet()
    },

    // 更新当前宠物
    updateCurrentPet() {
        const pet = app.globalData.currentPet
        if (pet) {
            this.setData({ currentPet: pet })
            this.fetchLogs()
            this.fetchHistoryLogs()
        } else {
            this.fetchDefaultPet()
        }
    },

    // 获取默认宠物
    fetchDefaultPet() {
        wx.cloud.callFunction({
            name: 'petQuery'
        }).then(res => {
            if (res.result.success && res.result.data.length > 0) {
                const pet = res.result.data[0]
                app.globalData.currentPet = pet
                this.setData({ currentPet: pet })
                this.fetchLogs()
                this.fetchHistoryLogs()
            } else {
                this.setData({
                    currentPet: {
                        name: '请添加宠物',
                        avatar: '',
                        species: '点击管理',
                        ageStr: ''
                    }
                })
            }
        }).catch(err => {
            console.error('获取默认宠物失败', err)
            this.setData({
                currentPet: {
                    name: '请添加宠物',
                    avatar: '',
                    species: '点击管理',
                    ageStr: ''
                }
            })
        })
    },

    // 获取今日日志
    fetchLogs() {
        const pet = app.globalData.currentPet
        if (!pet || !pet._id) {
            this.setData({ logs: [] })
            return
        }

        const today = this.formatDate(new Date())

        wx.cloud.callFunction({
            name: 'logsQuery',
            data: {
                petId: pet._id,
                date: today
            }
        }).then(res => {
            if (res.result.success) {
                const logs = res.result.data.map(log => {
                    const actionInfo = this.data.actionTypes.find(a => a.type === log.type)
                    return {
                        ...log,
                        color: actionInfo ? actionInfo.color : '#999',
                        timeStr: log.time
                    }
                })
                this.setData({ logs })
            } else {
                console.error('获取日志失败', res.result.errMsg)
                this.setData({ logs: [] })
            }
        }).catch(err => {
            console.error('获取日志失败', err)
            this.setData({ logs: [] })
        })
    },

    formatDate(date) {
        const y = date.getFullYear()
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const d = date.getDate().toString().padStart(2, '0')
        return `${y}-${m}-${d}`
    },

    // 获取历史日志（最近7天）
    fetchHistoryLogs() {
        const pet = app.globalData.currentPet
        if (!pet || !pet._id) {
            this.setData({ historyLogs: [] })
            return
        }

        const today = new Date()
        const historyDates = []

        // 生成最近7天的日期（不包括今天）
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            historyDates.push(this.formatDate(date))
        }

        // 查询最近7天的日志
        wx.cloud.callFunction({
            name: 'logsQuery',
            data: { petId: pet._id }
        }).then(res => {
            if (res.result.success) {
                const allLogs = res.result.data

                // 按日期分组
                const groupedLogs = {}
                allLogs.forEach(log => {
                    if (historyDates.includes(log.date)) {
                        if (!groupedLogs[log.date]) {
                            groupedLogs[log.date] = []
                        }
                        const actionInfo = this.data.actionTypes.find(a => a.type === log.type)
                        groupedLogs[log.date].push({
                            ...log,
                            typeLabel: actionInfo ? actionInfo.label : log.type,
                            emoji: actionInfo ? actionInfo.emoji : '📝',
                            color: actionInfo ? actionInfo.color : '#999',
                            timeStr: log.time
                        })
                    }
                })

                // 转换为数组并格式化日期显示
                const historyLogs = historyDates
                    .filter(date => groupedLogs[date] && groupedLogs[date].length > 0)
                    .map(date => {
                        const d = new Date(date)
                        const month = d.getMonth() + 1
                        const day = d.getDate()
                        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                        const weekday = weekdays[d.getDay()]

                        return {
                            date,
                            dateStr: `${month}月${day}日 ${weekday}`,
                            logs: groupedLogs[date]
                        }
                    })

                this.setData({ historyLogs })
            }
        }).catch(err => {
            console.error('获取历史日志失败', err)
        })
    },

    switchPet() {
        wx.switchTab({ url: '/pages/pets/index' })
    },

    // --- 弹窗逻辑开始 ---

    // 打开打卡弹窗
    openLogSheet() {
        if (!app.globalData.currentPet || !app.globalData.currentPet._id) {
            wx.showToast({ title: '请先添加宠物', icon: 'none' })
            return
        }

        this.setData({
            showActionSheet: true,
            logStep: 1, // 重置为第一步
            currentLog: {
                type: '',
                typeLabel: '',
                time: '',
                note: '',
                images: []
            }
        })
        wx.vibrateShort({ type: 'light' })
    },

    closeLogSheet() {
        this.setData({ showActionSheet: false })
        // 延迟清空，防止动画突变
        setTimeout(() => {
            this.setData({ logStep: 1 })
        }, 300)
    },

    backToStep1() {
        this.setData({ logStep: 1 })
    },

    // 选择记录类型 (进入第二步)
    selectLogType(e) {
        const type = e.currentTarget.dataset.type
        const actionInfo = this.data.actionTypes.find(a => a.type === type)

        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        this.setData({
            logStep: 2,
            'currentLog.type': type,
            'currentLog.typeLabel': actionInfo.label,
            'currentLog.time': timeStr
        })
    },

    // --- 表单逻辑 ---

    stopPropagation() { },

    onTimeChange(e) {
        this.setData({ 'currentLog.time': e.detail.value })
    },

    onNoteInput(e) {
        this.setData({ 'currentLog.note': e.detail.value })
    },

    chooseImage() {
        wx.chooseMedia({
            count: 3 - this.data.currentLog.images.length,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: res => {
                const newImages = res.tempFiles.map(f => f.tempFilePath)
                this.setData({
                    'currentLog.images': [...this.data.currentLog.images, ...newImages]
                })
            }
        })
    },

    deleteImage(e) {
        const index = e.currentTarget.dataset.index
        const images = [...this.data.currentLog.images]
        images.splice(index, 1)
        this.setData({ 'currentLog.images': images })
    },

    async uploadImages(filePaths) {
        const uploadPromises = filePaths.map(async (filePath, index) => {
            if (filePath.startsWith('cloud://')) return filePath

            const cloudPath = `logs/${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}.jpg`
            const res = await wx.cloud.uploadFile({
                cloudPath,
                filePath
            })
            return res.fileID
        })

        return Promise.all(uploadPromises)
    },

    async saveLog() {
        const log = this.data.currentLog
        const pet = app.globalData.currentPet

        if (!pet || !pet._id) return

        this.setData({ saving: true })
        wx.showLoading({ title: '保存中' })

        try {
            let imageUrls = []
            if (log.images.length > 0) {
                imageUrls = await this.uploadImages(log.images)
            }

            const db = wx.cloud.database()
            const today = this.formatDate(new Date())

            await db.collection('logs').add({
                data: {
                    petId: pet._id,
                    type: log.type,
                    typeLabel: log.typeLabel,
                    time: log.time,
                    date: today,
                    note: log.note,
                    images: imageUrls,
                    createTime: new Date()
                }
            })

            wx.hideLoading()
            wx.showToast({ title: '打卡成功!', icon: 'success' })

            this.setData({ showActionSheet: false })
            this.fetchLogs()

        } catch (err) {
            console.error('保存日志失败', err)
            wx.hideLoading()
            wx.showToast({ title: '保存失败', icon: 'none' })
        } finally {
            this.setData({ saving: false })
        }
    }
})
