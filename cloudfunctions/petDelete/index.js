// 云函数：删除宠物（仅创建者）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId } = event

  try {
    // 1. 检查用户是否为创建者
    const memberRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        petId,
        isCreator: true,
        status: 'active'
      })
      .get()

    if (memberRes.data.length === 0) {
      return { success: false, errMsg: '只有创建者可以删除宠物' }
    }

    // 2. 删除宠物记录
    await db.collection('pets').doc(petId).remove()

    // 3. 删除所有成员记录
    await db.collection('pet_members')
      .where({ petId })
      .remove()

    // 4. 删除所有邀请记录
    await db.collection('invitations')
      .where({ petId })
      .remove()

    // 5. 删除关联数据（日志、账单、体重）
    await db.collection('logs').where({ petId }).remove()
    await db.collection('bills').where({ petId }).remove()
    await db.collection('weights').where({ petId }).remove()

    return { success: true }
  } catch (err) {
    console.error('petDelete error:', err)
    return { success: false, errMsg: err.message }
  }
}
