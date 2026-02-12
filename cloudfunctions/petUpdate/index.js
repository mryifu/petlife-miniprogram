// 云函数：更新宠物信息（需要权限检查）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId, name, species, gender, birthday, avatar, weight } = event

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
      return { success: false, errMsg: '无权限操作此宠物' }
    }

    // 2. 更新宠物信息
    const updateData = {
      updateTime: new Date()
    }
    if (name !== undefined) updateData.name = name
    if (species !== undefined) updateData.species = species
    if (gender !== undefined) updateData.gender = gender
    if (birthday !== undefined) updateData.birthday = birthday
    if (avatar !== undefined) updateData.avatar = avatar
    if (weight !== undefined) updateData.weight = weight

    await db.collection('pets').doc(petId).update({
      data: updateData
    })

    // 3. 如果名称或头像变化，更新所有成员记录
    if (name !== undefined || avatar !== undefined) {
      const memberUpdateData = {}
      if (name !== undefined) memberUpdateData.petName = name
      if (avatar !== undefined) memberUpdateData.petAvatar = avatar

      await db.collection('pet_members')
        .where({ petId })
        .update({
          data: memberUpdateData
        })
    }

    return { success: true }
  } catch (err) {
    console.error('petUpdate error:', err)
    return { success: false, errMsg: err.message }
  }
}
