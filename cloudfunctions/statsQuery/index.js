// 云函数：查询用户的统计数据（包括共养宠物）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 1. 查询用户可访问的所有宠物ID
    const membersRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        status: 'active'
      })
      .get()

    if (membersRes.data.length === 0) {
      return {
        success: true,
        data: {
          totalLogs: 0,
          totalSpent: 0
        }
      }
    }

    const petIds = membersRes.data.map(m => m.petId)

    // 2. 查询所有相关宠物的日志总数
    const logsRes = await db.collection('logs')
      .where({
        petId: db.command.in(petIds)
      })
      .count()

    // 3. 查询所有相关宠物的账单总额
    const billsRes = await db.collection('bills')
      .where({
        petId: db.command.in(petIds)
      })
      .get()

    const totalSpent = billsRes.data.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return {
      success: true,
      data: {
        totalLogs: logsRes.total,
        totalSpent: totalSpent
      }
    }
  } catch (err) {
    console.error('statsQuery error:', err)
    return { success: false, errMsg: err.message }
  }
}
