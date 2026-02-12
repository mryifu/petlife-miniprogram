// pages/pets/form.js
const app = getApp()

Page({
    data: {
        id: null,
        avatarUrl: '',
        name: '',
        speciesList: ['猫', '狗', '兔子', '仓鼠', '鸟', '其他'],
        species: '',
        gender: 'male',
        birth: '',
        zodiac: '',
        current_weight: '',
        color: '',
        personalityList: ['活泼', '温顺', '高冷', '粘人', '独立', '胆小', '勇敢', '调皮'],
        personality: '',
        is_neutered: false,
        saving: false
    },

    onLoad(options) {
        if (options.id) {
            this.setData({ id: options.id })
            wx.setNavigationBarTitle({ title: '编辑宠物' })
            this.fetchPetDetail(options.id)
        }
    },

    // 获取宠物详情
    fetchPetDetail(id) {
        const db = wx.cloud.database()
        db.collection('pets').doc(id).get()
            .then(res => {
                const pet = res.data
                const zodiac = pet.birthday ? this.calculateZodiac(pet.birthday) : ''
                this.setData({
                    avatarUrl: pet.avatar || '',
                    name: pet.name,
                    species: pet.species,
                    gender: pet.gender,
                    birth: pet.birthday || '',
                    zodiac: zodiac,
                    current_weight: pet.weight ? pet.weight.toString() : '',
                    color: pet.color || '',
                    personality: pet.personality || '',
                    is_neutered: pet.is_neutered || false
                })
            })
            .catch(err => {
                console.error('获取宠物详情失败', err)
                wx.showToast({ title: '加载失败', icon: 'none' })
            })
    },

    // 选择头像
    chooseAvatar() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: res => {
                const tempFilePath = res.tempFiles[0].tempFilePath
                this.setData({ avatarUrl: tempFilePath })
            }
        })
    },

    onSpeciesChange(e) {
        this.setData({
            species: this.data.speciesList[e.detail.value]
        })
    },

    onDateChange(e) {
        const birth = e.detail.value
        const zodiac = this.calculateZodiac(birth)
        this.setData({ birth, zodiac })
    },

    // 计算星座
    calculateZodiac(dateStr) {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const month = date.getMonth() + 1
        const day = date.getDate()

        const zodiacList = [
            { name: '水瓶座♒', start: [1, 20], end: [2, 18] },
            { name: '双鱼座♓', start: [2, 19], end: [3, 20] },
            { name: '白羊座♈', start: [3, 21], end: [4, 19] },
            { name: '金牛座♉', start: [4, 20], end: [5, 20] },
            { name: '双子座♊', start: [5, 21], end: [6, 21] },
            { name: '巨蟹座♋', start: [6, 22], end: [7, 22] },
            { name: '狮子座♌', start: [7, 23], end: [8, 22] },
            { name: '处女座♍', start: [8, 23], end: [9, 22] },
            { name: '天秤座♎', start: [9, 23], end: [10, 23] },
            { name: '天蝎座♏', start: [10, 24], end: [11, 22] },
            { name: '射手座♐', start: [11, 23], end: [12, 21] },
            { name: '摩羯座♑', start: [12, 22], end: [1, 19] }
        ]

        for (let zodiac of zodiacList) {
            const [startMonth, startDay] = zodiac.start
            const [endMonth, endDay] = zodiac.end

            if (startMonth === endMonth) {
                if (month === startMonth && day >= startDay && day <= endDay) {
                    return zodiac.name
                }
            } else {
                if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
                    return zodiac.name
                }
            }
        }
        return ''
    },

    onPersonalityChange(e) {
        this.setData({
            personality: this.data.personalityList[e.detail.value]
        })
    },

    radioTap(e) {
        const value = e.currentTarget.dataset.value
        this.setData({ gender: value })
    },

    // 处理性别变更（兼容 radio-group change 事件）
    onGenderChange(e) {
        this.setData({ gender: e.detail.value })
    },

    onNeuteredChange(e) {
        this.setData({ is_neutered: e.detail.value })
    },

    // 上传图片到云存储
    async uploadImage(filePath) {
        if (!filePath || filePath.startsWith('cloud://')) {
            return filePath // 已经是云文件或空，直接返回
        }

        const cloudPath = `pets/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`

        try {
            const res = await wx.cloud.uploadFile({
                cloudPath,
                filePath
            })
            return res.fileID
        } catch (err) {
            console.error('上传图片失败', err)
            throw err
        }
    },

    // 保存宠物
    async savePet(e) {
        const formData = e.detail.value

        // 验证
        if (!formData.name || !formData.name.trim()) {
            wx.showToast({ title: '请输入宠物名称', icon: 'none' })
            return
        }
        if (!this.data.species) {
            wx.showToast({ title: '请选择品种', icon: 'none' })
            return
        }

        this.setData({ saving: true })
        wx.showLoading({ title: '保存中' })

        try {
            // 上传头像到云存储
            let avatarCloudPath = ''
            if (this.data.avatarUrl) {
                avatarCloudPath = await this.uploadImage(this.data.avatarUrl)
            }

            const petData = {
                name: formData.name.trim(),
                species: this.data.species,
                gender: this.data.gender,
                birthday: this.data.birth,
                zodiac: this.data.zodiac,
                weight: parseFloat(formData.weight) || 0,
                color: formData.color || '',
                personality: this.data.personality,
                is_neutered: this.data.is_neutered,
                avatar: avatarCloudPath
            }

            if (this.data.id) {
                // 更新 - 使用云函数
                const res = await wx.cloud.callFunction({
                    name: 'petUpdate',
                    data: {
                        petId: this.data.id,
                        ...petData
                    }
                })

                if (!res.result.success) {
                    throw new Error(res.result.errMsg)
                }
            } else {
                // 新增 - 使用云函数
                const res = await wx.cloud.callFunction({
                    name: 'petCreate',
                    data: petData
                })

                if (!res.result.success) {
                    throw new Error(res.result.errMsg)
                }
            }

            wx.hideLoading()
            wx.showToast({ title: '保存成功', icon: 'success' })

            // 刷新 globalData
            app.globalData.currentPet = null

            setTimeout(() => wx.navigateBack(), 1500)

        } catch (err) {
            console.error('保存宠物失败', err)
            wx.hideLoading()
            wx.showToast({ title: err.message || '保存失败', icon: 'none' })
        } finally {
            this.setData({ saving: false })
        }
    }
})
