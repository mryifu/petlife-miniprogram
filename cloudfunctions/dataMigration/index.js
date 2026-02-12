// 云函数：数据迁移 - 为现有宠物创建成员记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    let migratedCount = 0
    let skippedCount = 0

    // 1. 查询用户的所有宠物
    const petsRes = await db.collection('pets')
      .where({ _openid: openid })
      .get()

    const now = new Date()

    // 2. 为每个宠物检查并创建成员记录
    for (const pet of petsRes.data) {
      // 检查是否已有成员记录
      const existingMemberRes = await db.collection('pet_members')
        .where({
          _openid: openid,
          petId: pet._id,
          status: 'active'
        })
        .get()

      if (existingMemberRes.data.length === 0) {
        // 创建成员记录
        await db.collection('pet_members').add({
          data: {
            _openid: openid,
            petId: pet._id,
            petName: pet.name,
            petAvatar: pet.avatar || '',
            isCreator: true,
            status: 'active',
            joinTime: pet.createTime || now,
            createTime: now
          }
        })

        // 更新宠物的成员数量和共养状态
        await db.collection('pets').doc(pet._id).update({
          data: {
            memberCount: 1,
            isShared: false,
            updateTime: now
          }
        })

        migratedCount++
      } else {
        skippedCount++
      }
    }

    return {
      success: true,
      migratedCount,
      skippedCount,
      totalPets: petsRes.data.length
    }
  } catch (err) {
    console.error('dataMigration error:', err)
    return { success: false, errMsg: err.message }
  }
}
