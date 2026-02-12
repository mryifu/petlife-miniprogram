// pages/profile/index.js
const app = getApp()

Page({
    data: {
        userInfo: {
            nickName: '铲屎官',
            avatarUrl: ''
        },
        stats: {
            petCount: 0,
            totalDays: 0,
            totalLogs: 0,
            totalSpent: 0
        },

        reminders: [],
        showAddReminder: false,
        reminderTypes: ['喂食提醒', '驱虫提醒', '疫苗提醒', '洗澡提醒', '遛弯提醒', '自定义'],
        repeatOptions: ['仅一次', '每天', '每周', '每月'],
        newReminder: {
            type: '',
            time: '',
            repeat: ''
        },

        notificationEnabled: true
    },

    onLoad() {
        // 加载用户昵称
        const nickName = wx.getStorageSync('userNickName')
        if (nickName) {
            this.setData({
                'userInfo.nickName': nickName
            })
        }
        this.fetchRealData()
    },

    onShow() {
        this.fetchRealData()
    },

    // 获取真实数据
    async fetchRealData() {
        if (!app.globalData.openid) {
            // 稍后重试
            setTimeout(() => this.fetchRealData(), 1000)
            return
        }

        try {
            // 1. 获取宠物数量（包括共养的）
            const petsRes = await wx.cloud.callFunction({
                name: 'petQuery'
            })
            const petCount = petsRes.result.success ? petsRes.result.data.length : 0

            // 2. 获取统计数据（打卡总数和总花费，包括共养宠物）
            const statsRes = await wx.cloud.callFunction({
                name: 'statsQuery'
            })

            let totalLogs = 0
            let totalSpent = 0

            if (statsRes.result.success) {
                totalLogs = statsRes.result.data.totalLogs
                totalSpent = statsRes.result.data.totalSpent
            }

            // 3. 计算养宠天数（从第一只宠物的生日或添加日期开始）
            let totalDays = 0
            if (petCount > 0 && petsRes.result.success) {
                const pets = petsRes.result.data
                if (pets.length > 0) {
                    // 找到最早的宠物
                    const sortedPets = pets.sort((a, b) =>
                        new Date(a.createTime) - new Date(b.createTime)
                    )
                    const startDate = new Date(sortedPets[0].createTime)
                    const now = new Date()
                    const diffTime = Math.abs(now - startDate)
                    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                }
            }

            this.setData({
                stats: {
                    petCount,
                    totalLogs,
                    totalSpent: totalSpent.toFixed(0),
                    totalDays
                }
            })

            // 获取提醒事项（使用本地存储模拟，因为数据库里还没建reminders表）
            // 如果需要数据库支持，需要新建 reminders 集合
            this.loadReminders()

        } catch (err) {
            console.error('获取统计数据失败', err)
        }
    },

    loadReminders() {
        const reminders = wx.getStorageSync('reminders') || []
        this.setData({ reminders })
    },

    // 编辑用户信息
    editUserInfo() {
        wx.showModal({
            title: '修改昵称',
            editable: true,
            placeholderText: '请输入昵称',
            content: this.data.userInfo.nickName || '',
            success: (res) => {
                if (res.confirm && res.content) {
                    const nickName = res.content.trim()
                    if (nickName) {
                        wx.setStorageSync('userNickName', nickName)
                        this.setData({
                            'userInfo.nickName': nickName
                        })
                        wx.showToast({ title: '修改成功', icon: 'success' })
                    }
                }
            }
        })
    },

    addReminder() {
        this.setData({
            showAddReminder: true,
            newReminder: { type: '', time: '', repeat: '' }
        });
    },

    closeReminderModal() {
        this.setData({ showAddReminder: false });
    },

    stopPropagation() { },

    onReminderTypeChange(e) {
        this.setData({
            'newReminder.type': this.data.reminderTypes[e.detail.value]
        });
    },

    onReminderTimeChange(e) {
        this.setData({
            'newReminder.time': e.detail.value
        });
    },

    onRepeatChange(e) {
        this.setData({
            'newReminder.repeat': this.data.repeatOptions[e.detail.value]
        });
    },

    saveReminder() {
        const { type, time, repeat } = this.data.newReminder;

        if (!type || !time || !repeat) {
            wx.showToast({ title: '请填写完整', icon: 'none' });
            return;
        }

        const newReminder = {
            _id: Date.now().toString(),
            title: type,
            time: time,
            repeatLabel: repeat,
            enabled: true
        };

        const reminders = [...this.data.reminders, newReminder]
        this.setData({
            reminders,
            showAddReminder: false
        });

        // 保存到本地存储
        wx.setStorageSync('reminders', reminders)

        wx.showToast({ title: '提醒已设置', icon: 'success' });
        this.requestNotificationPermission();
    },

    toggleReminder(e) {
        const id = e.currentTarget.dataset.id;
        const reminders = this.data.reminders.map(r => {
            if (r._id === id) {
                return { ...r, enabled: !r.enabled };
            }
            return r;
        });
        this.setData({ reminders });
        wx.setStorageSync('reminders', reminders)
    },

    requestNotificationPermission() {
        // 模拟订阅消息
        // 真实环境需要调用 wx.requestSubscribeMessage
    },

    toggleNotification(e) {
        this.setData({ notificationEnabled: e.detail.value });
    },

    goToPage(e) {
        const page = e.currentTarget.dataset.page;
        wx.navigateTo({
            url: `/pages/${page}/index`
        });
    },

    exportData() {
        wx.showModal({
            title: '导出数据',
            content: '将导出所有宠物记录数据,是否继续?',
            success(res) {
                if (res.confirm) {
                    wx.showLoading({ title: '导出中...' });
                    setTimeout(() => {
                        wx.hideLoading();
                        wx.showToast({ title: '导出成功', icon: 'success' });
                    }, 1500);
                }
            }
        });
    },

    showAbout() {
        wx.showModal({
            title: '关于爪爪手账',
            content: '版本 1.0.0\n\n一款专为铲屎官打造的宠物全生命周期管理工具。\n\n帮助您记录宠物日常,追踪健康数据,管理养宠开支。',
            showCancel: false
        });
    },

    // 获取头像昵称
    getUserProfile() {
        wx.getUserProfile({
            desc: '用于完善会员资料',
            success: (res) => {
                this.setData({
                    userInfo: res.userInfo
                })
            }
        })
    }
});
