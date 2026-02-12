// pages/pets/index.js
const app = getApp()

Page({
    data: {
        pets: [],
        loading: true
    },

    onShow() {
        this.fetchPets()
    },

    // 从云数据库获取宠物列表
    fetchPets() {
        this.setData({ loading: true })
        const currentPetId = app.globalData.currentPet?._id

        wx.cloud.callFunction({
            name: 'petQuery'
        }).then(res => {
            if (res.result.success) {
                // 计算年龄字符串和标记当前宠物
                const pets = res.result.data.map(pet => {
                    pet.ageStr = this.calculateAge(pet.birthday)
                    pet.isSelected = pet._id === currentPetId
                    return pet
                })

                this.setData({
                    pets,
                    loading: false
                })

                // 设置默认宠物
                if (!app.globalData.currentPet && pets.length > 0) {
                    app.globalData.currentPet = pets[0]
                }
            } else {
                throw new Error(res.result.errMsg)
            }
        }).catch(err => {
            console.error('获取宠物列表失败', err)
            this.setData({ loading: false })
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            })
        })
    },

    // 计算年龄
    calculateAge(birthday) {
        if (!birthday) return ''
        const birth = new Date(birthday)
        const now = new Date()
        const months = (now.getFullYear() - birth.getFullYear()) * 12 +
            (now.getMonth() - birth.getMonth())

        if (months >= 12) {
            const years = Math.floor(months / 12)
            const remainMonths = months % 12
            return remainMonths > 0 ? `${years}岁${remainMonths}个月` : `${years}岁`
        }
        return `${months}个月`
    },

    // 选择宠物
    selectPet(e) {
        const id = e.currentTarget.dataset.id
        const pet = this.data.pets.find(p => p._id === id)

        if (pet) {
            app.globalData.currentPet = pet
            wx.showToast({
                title: `已切换到 ${pet.name}`,
                icon: 'success'
            })

            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/index/index'
                })
            }, 1000)
        }
    },

    // 编辑宠物
    editPet(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/pets/form?id=${id}`
        })
    },

    // 查看体重记录
    viewWeightChart(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/weight/index?petId=${id}`
        })
    },

    // 查看消费记录
    viewBills(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/bills/index?petId=${id}`
        })
    },

    stopPropagation() {
        // 阻止事件冒泡
    },

    // 删除宠物
    deletePet(e) {
        const id = e.currentTarget.dataset.id
        const pet = this.data.pets.find(p => p._id === id)

        wx.showModal({
            title: '确认删除',
            content: `确定要删除 ${pet.name} 吗？这将删除所有相关数据（日志、账单、体重记录）`,
            success: res => {
                if (res.confirm) {
                    wx.cloud.callFunction({
                        name: 'petDelete',
                        data: { petId: id }
                    }).then(res => {
                        if (res.result.success) {
                            wx.showToast({ title: '已删除', icon: 'success' })

                            // 如果删除的是当前宠物，清空选择
                            if (app.globalData.currentPet && app.globalData.currentPet._id === id) {
                                app.globalData.currentPet = null
                            }

                            this.fetchPets()
                        } else {
                            wx.showToast({ title: res.result.errMsg, icon: 'none' })
                        }
                    }).catch(err => {
                        console.error('删除失败', err)
                        wx.showToast({ title: '删除失败', icon: 'none' })
                    })
                }
            }
        })
    },

    // 查看共养成员
    viewMembers(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/pets/members?petId=${id}`
        })
    },

    // 邀请共养
    inviteMember(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/pets/invite?petId=${id}`
        })
    }
})
