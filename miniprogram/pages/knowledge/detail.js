// pages/knowledge/detail.js
Page({
    data: {
        knowledge: null,
        loading: true
    },

    onLoad(options) {
        if (options.id) {
            this.loadDetail(options.id)
        }
    },

    loadDetail(id) {
        const db = wx.cloud.database()
        db.collection('knowledge').doc(id).get()
            .then(res => {
                this.setData({
                    knowledge: res.data,
                    loading: false
                })
                wx.setNavigationBarTitle({
                    title: res.data.title || '知识详情'
                })
            })
            .catch(err => {
                console.error('加载详情失败', err)
                this.setData({ loading: false })
                wx.showToast({ title: '加载失败', icon: 'none' })
            })
    },

    // 预览图片
    previewImage() {
        if (this.data.knowledge && this.data.knowledge.coverImage) {
            wx.previewImage({
                urls: [this.data.knowledge.coverImage]
            })
        }
    }
})
