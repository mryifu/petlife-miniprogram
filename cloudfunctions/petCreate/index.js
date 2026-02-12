// 云函数：创建宠物并自动添加成员记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name, species, gender, birthday, avatar, weight } = event

  try {
    const now = new Date()

    // 1. 创建宠物记录
    const petRes = await db.collection('pets').add({
      data: {
        _openid: openid,
        name,
        species,
        gender,
        birthday,
        avatar,
        weight,
        memberCount: 1,
        isShared: false,
        createTime: now,
        updateTime: now
      }
    })

    const petId = petRes._id

    // 2. 创建成员记录
    await db.collection('pet_members').add({
      data: {
        _openid: openid,
        petId,
        petName: name,
        petAvatar: avatar,
        isCreator: true,
        status: 'active',
        joinTime: now,
        createTime: now
      }
    })

    return { success: true, petId }
  } catch (err) {
    console.error('petCreate error:', err)
    return { success: false, errMsg: err.message }
  }
}
