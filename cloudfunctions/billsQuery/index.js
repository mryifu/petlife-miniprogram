// 云函数：查询宠物的所有账单（跨用户）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId, startDate, endDate } = event

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
      return { success: false, errMsg: '无权限查看此宠物的账单' }
    }

    // 2. 查询账单
    const where = { petId }
    if (startDate && endDate) {
      where.date = db.command.gte(startDate).and(db.command.lte(endDate))
    }

    const billsRes = await db.collection('bills')
      .where(where)
      .orderBy('date', 'desc')
      .limit(100)
      .get()

    return { success: true, data: billsRes.data }
  } catch (err) {
    console.error('billsQuery error:', err)
    return { success: false, errMsg: err.message }
  }
}
