'use strict';

exports.main = async (event, context) => {
  try {
    const { cid, deviceType = 'unknown' } = event;
    
    if (!cid || typeof cid !== 'string' || cid.trim() === '') {
      return {
        errCode: -2,
        errMsg: 'CID不能为空且必须为字符串'
      };
    }

    const validCid = cid.trim();
    
    const db = uniCloud.database();
    const cidCollection = db.collection('user_cid'); 
    
    const queryRes = await cidCollection.where({
      cid: validCid
    }).get();

    const now = Date.now(); 
    
    if (queryRes.data.length > 0) {
      const recordId = queryRes.data[0]._id;
      await cidCollection.doc(recordId).update({
        updateTime: now,
        isValid: true, // 标记为有效
        deviceType: deviceType // 更新设备类型（可选）
      });
      
      return {
        errCode: 0,
        errMsg: 'CID已存在，已更新绑定信息',
        data: {
          cid: validCid,
          updateTime: now
        }
      };
    } else {
      const addRes = await cidCollection.add({
        cid: validCid,
        deviceType: deviceType, // 设备类型：android/ios/unknown
        createTime: now,
        updateTime: now,
        isValid: true // 标记为有效CID
      });
      
      return {
        errCode: 0,
        errMsg: 'CID绑定成功',
        data: {
          _id: addRes.id,
          cid: validCid,
          createTime: now
        }
      };
    }

  } catch (error) {
    // 全局异常捕获
    console.error('绑定CID失败：', error);
    return {
      errCode: -99,
      errMsg: `绑定CID异常：${error.message}`
    };
  }
};