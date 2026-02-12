// 云函数：创建邀请码
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 生成6位随机邀请码（大写字母+数字，排除易混淆字符）
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除 0/O/I/1
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { petId } = event

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

    // 2. 获取宠物信息
    const petRes = await db.collection('pets').doc(petId).get()
    if (!petRes.data) {
      return { success: false, errMsg: '宠物不存在' }
    }

    const pet = petRes.data

    // 3. 生成唯一邀请码
    let code = generateCode()
    let attempts = 0
    while (attempts < 10) {
      const existingRes = await db.collection('invitations')
        .where({ code, status: 'active' })
        .get()
      if (existingRes.data.length === 0) break
      code = generateCode()
      attempts++
    }

    // 4. 创建邀请记录
    const now = new Date()
    const expireTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时后过期

    await db.collection('invitations').add({
      data: {
        _openid: openid,
        petId,
        petName: pet.name,
        code,
        expireTime,
        status: 'active',
        createTime: now
      }
    })

    return { success: true, code, expireTime }
  } catch (err) {
    console.error('invitationCreate error:', err)
    return { success: false, errMsg: err.message }
  }
}
