// 云函数：查询宠物的所有体重记录（跨用户）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId } = event

  try {
    // 1. 检查用户是否为宠物成员
    const memberRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        petId,
        status: 'active'
      })
      .get()

    if (memberRes.data.length === 0) {
      return { success: false, errMsg: '无权限查看此宠物的体重记录' }
    }

    // 2. 查询体重记录
    const weightsRes = await db.collection('weights')
      .where({ petId })
      .orderBy('date', 'asc')
      .limit(100)
      .get()

    return { success: true, data: weightsRes.data }
  } catch (err) {
    console.error('weightsQuery error:', err)
    return { success: false, errMsg: err.message }
  }
}
