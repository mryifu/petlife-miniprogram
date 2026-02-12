// 云函数：查询用户可访问的所有宠物
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 1. 查询用户的 pet_members 记录
    const membersRes = await db.collection('pet_members')
      .where({
        _openid: openid,
        status: 'active'
      })
      .get()

    if (membersRes.data.length === 0) {
      return { success: true, data: [] }
    }

    // 2. 提取 petId 列表
    const petIds = membersRes.data.map(m => m.petId)

    // 3. 查询宠物信息
    const petsRes = await db.collection('pets')
      .where({
        _id: db.command.in(petIds)
      })
      .get()

    // 4. 为每个宠物计算成员数量
    const petsWithMemberCount = await Promise.all(petsRes.data.map(async (pet) => {
      const memberCountRes = await db.collection('pet_members')
        .where({
          petId: pet._id,
          status: 'active'
        })
        .count()

      const member = membersRes.data.find(m => m.petId === pet._id)

      return {
        ...pet,
        isCreator: member ? member.isCreator : false,
        memberCount: memberCountRes.total
      }
    }))

    return { success: true, data: petsWithMemberCount }
  } catch (err) {
    console.error('petQuery error:', err)
    return { success: false, errMsg: err.message }
  }
}
