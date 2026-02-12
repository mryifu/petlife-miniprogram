// 云函数：查询宠物的所有成员
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId } = event

  try {
    // 1. 检查用户是否为宠物成员
    const myMemberRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        petId,
        status: 'active'
      })
      .get()

    if (myMemberRes.data.length === 0) {
      return { success: false, errMsg: '无权限查看此宠物的成员' }
    }

    // 2. 查询所有成员
    const membersRes = await db.collection('pet_members')
      .where({
        petId,
        status: 'active'
      })
      .orderBy('joinTime', 'asc')
      .get()

    return { success: true, data: membersRes.data }
  } catch (err) {
    console.error('memberQuery error:', err)
    return { success: false, errMsg: err.message }
  }
}
