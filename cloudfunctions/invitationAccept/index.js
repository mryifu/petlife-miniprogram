// 云函数：接受邀请加入共养
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { code } = event

  try {
    // 1. 查询邀请记录
    const invitationRes = await db.collection('invitations')
      .where({
        code,
        status: 'active'
      })
      .get()

    if (invitationRes.data.length === 0) {
      return { success: false, errMsg: '邀请码不存在或已失效' }
    }

    const invitation = invitationRes.data[0]

    // 2. 检查是否过期
    if (new Date() > new Date(invitation.expireTime)) {
      await db.collection('invitations').doc(invitation._id).update({
        data: { status: 'expired' }
      })
      return { success: false, errMsg: '邀请码已过期' }
    }

    // 3. 检查是否已是成员
    const existingMemberRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        petId: invitation.petId,
        status: 'active'
      })
      .get()

    if (existingMemberRes.data.length > 0) {
      return { success: false, errMsg: '您已经是该宠物的共养人' }
    }

    // 4. 创建成员记录
    const now = new Date()
    await db.collection('pet_members').add({
      data: {
        _openid: openid,
        petId: invitation.petId,
        petName: invitation.petName,
        petAvatar: '',
        isCreator: false,
        status: 'active',
        joinTime: now,
        createTime: now
      }
    })

    // 5. 更新邀请状态
    await db.collection('invitations').doc(invitation._id).update({
      data: {
        status: 'used',
        usedBy: openid,
        usedTime: now
      }
    })

    // 6. 更新宠物的成员数量和共养状态
    const pet = await db.collection('pets').doc(invitation.petId).get()
    await db.collection('pets').doc(invitation.petId).update({
      data: {
        memberCount: _.inc(1),
        isShared: true,
        updateTime: now
      }
    })

    return { success: true, petId: invitation.petId, petName: invitation.petName }
  } catch (err) {
    console.error('invitationAccept error:', err)
    return { success: false, errMsg: err.message }
  }
}
