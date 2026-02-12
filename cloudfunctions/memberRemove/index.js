// 云函数：移除成员或退出共养
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId, targetOpenid } = event

  try {
    // 1. 查询当前用户的成员记录
    const myMemberRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        petId,
        status: 'active'
      })
      .get()

    if (myMemberRes.data.length === 0) {
      return { success: false, errMsg: '您不是该宠物的成员' }
    }

    const myMember = myMemberRes.data[0]

    // 2. 如果是移除其他成员，检查权限
    if (targetOpenid && targetOpenid !== openid) {
      if (!myMember.isCreator) {
        return { success: false, errMsg: '只有创建者可以移除其他成员' }
      }

      // 移除目标成员
      await db.collection('pet_members')
        .where({
          _openid: targetOpenid,
          petId,
          status: 'active'
        })
        .update({
          data: { status: 'removed' }
        })
    } else {
      // 3. 退出共养
      if (myMember.isCreator) {
        return { success: false, errMsg: '创建者不能退出共养，只能删除宠物' }
      }

      await db.collection('pet_members').doc(myMember._id).update({
        data: { status: 'removed' }
      })
    }

    // 4. 更新宠物的成员数量
    await db.collection('pets').doc(petId).update({
      data: {
        memberCount: _.inc(-1),
        updateTime: new Date()
      }
    })

    return { success: true }
  } catch (err) {
    console.error('memberRemove error:', err)
    return { success: false, errMsg: err.message }
  }
}
