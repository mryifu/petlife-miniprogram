// pages/knowledge/index.js
const app = getApp()

Page({
    data: {
        categories: [
            { id: 'feeding', name: '喂养', emoji: '🍖', color: '#FF9500' },
            { id: 'health', name: '健康', emoji: '💊', color: '#34C759' },
            { id: 'training', name: '训练', emoji: '🎾', color: '#5AC8FA' },
            { id: 'grooming', name: '美容', emoji: '✂️', color: '#AF52DE' },
            { id: 'supplies', name: '用品', emoji: '🏠', color: '#FF2D55' }
        ],
        activeCategory: 'feeding',
        knowledgeList: [],
        loading: false
    },

    onLoad() {
        this.loadKnowledge()
    },

    onShow() {
        this.loadKnowledge()
    },

    onPullDownRefresh() {
        this.loadKnowledge().then(() => {
            wx.stopPullDownRefresh()
        })
    },

    // 切换分类
    switchCategory(e) {
        const category = e.currentTarget.dataset.id
        this.setData({ activeCategory: category })
        this.loadKnowledge()
    },

    // 加载知识列表
    loadKnowledge() {
        this.setData({ loading: true })
        const db = wx.cloud.database()

        return db.collection('knowledge')
            .where({ category: this.data.activeCategory })
            .orderBy('createTime', 'desc')
            .get()
            .then(res => {
                this.setData({
                    knowledgeList: res.data,
                    loading: false
                })
            })
            .catch(err => {
                console.error('加载知识失败', err)
                this.setData({ loading: false })
                // 无数据时显示默认提示
            })
    },

    // 查看详情
    goDetail(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/knowledge/detail?id=${id}`
        })
    }
})
