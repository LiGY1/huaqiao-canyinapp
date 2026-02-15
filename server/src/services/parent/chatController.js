const chalk = require('chalk');
const axios = require('axios');
const AIChatHistory = require('../../models/AIChatHistory');
const { success, error } = require('../../utils/responseFormatter');
const DIFY_CONFIG = require('../../config/dify');

exports.saveChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      conversationId,
      sender,
      userMessage,
      aiMessage,
      timestamp,
      metadata,
      summary,
      tags,
      files
    } = req.body;

    if (!sender || (sender !== 'user' && sender !== 'ai')) {
      return error(res, '无效的发送者类型', 400);
    }

    const chatHistory = new AIChatHistory({
      user: userId,
      source: 'parent',
      conversationId: conversationId || '',
      sender,
      userMessage: userMessage || '',
      aiMessage: aiMessage || '',
      files: files || [],
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      metadata: metadata || {},
      summary: summary || '',
      tags: tags || [],
      isFavorite: false
    });

    await chatHistory.save();

    console.log(chalk.green(`[家长] 聊天记录保存成功: ${chatHistory._id} (文件数: ${(files || []).length})`));

    const savedChat = await AIChatHistory.findById(chatHistory._id);
    console.log(' 验证保存后的数据:', {
      hasFiles: !!savedChat.files,
      filesLength: savedChat.files?.length || 0,
      files: savedChat.files
    });

    success(res, {
      chatId: chatHistory._id,
      message: '聊天记录保存成功'
    });

  } catch (err) {
    console.error('保存聊天记录错误:', err);
    error(res, '保存聊天记录失败', 500);
  }
};

exports.saveChatHistoryBatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return error(res, '消息数组不能为空', 400);
    }

    const chatHistories = messages.map(msg => ({
      user: userId,
      source: 'parent',
      conversationId: msg.conversationId || '',
      sender: msg.sender,
      userMessage: msg.userMessage || '',
      aiMessage: msg.aiMessage || '',
      files: msg.files || [],
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      metadata: msg.metadata || {},
      summary: msg.summary || '',
      tags: msg.tags || [],
      isFavorite: false
    }));

    const result = await AIChatHistory.insertMany(chatHistories);

    success(res, {
      count: result.length,
      message: `成功保存${result.length}条聊天记录`
    });

  } catch (err) {
    console.error('批量保存聊天记录错误:', err);
    error(res, '批量保存聊天记录失败', 500);
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      conversationId,
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      isFavorite
    } = req.query;

    const query = {
      user: userId,
      source: 'parent'
    };

    if (conversationId) {
      query.conversationId = conversationId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    const chatHistory = await AIChatHistory.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    const total = await AIChatHistory.countDocuments(query);

    console.log(' 获取家长端聊天记录:', {
      total,
      返回数量: chatHistory.length,
      示例数据: chatHistory.length > 0 ? {
        id: chatHistory[0]._id,
        hasFiles: !!chatHistory[0].files,
        filesCount: chatHistory[0].files?.length || 0,
        files: chatHistory[0].files
      } : null
    });

    success(res, {
      chatHistory,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit)
    });

  } catch (err) {
    console.error('获取聊天记录错误:', err);
    error(res, '获取聊天记录失败', 500);
  }
};

exports.getConversationList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await AIChatHistory.aggregate([
      {
        $match: {
          user: userId,
          source: 'parent',
          conversationId: { $ne: '' }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          firstTimestamp: { $min: '$timestamp' },
          lastTimestamp: { $max: '$timestamp' }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      },
      {
        $skip: parseInt(offset)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const totalConversations = await AIChatHistory.distinct('conversationId', {
      user: userId,
      source: 'parent',
      conversationId: { $ne: '' }
    });

    success(res, {
      conversations,
      total: totalConversations.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: totalConversations.length > parseInt(offset) + parseInt(limit)
    });

  } catch (err) {
    console.error('获取对话列表错误:', err);
    error(res, '获取对话列表失败', 500);
  }
};

exports.deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOneAndDelete({
      _id: chatId,
      user: userId,
      source: 'parent'
    });

    if (!chatHistory) {
      return error(res, '聊天记录不存在', 404);
    }

    success(res, {
      message: '聊天记录删除成功'
    });

  } catch (err) {
    console.error('删除聊天记录错误:', err);
    error(res, '删除聊天记录失败', 500);
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: 'parent',
      conversationId: conversationId
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功删除${result.deletedCount}条聊天记录`
    });

  } catch (err) {
    console.error('删除对话错误:', err);
    error(res, '删除对话失败', 500);
  }
};

exports.toggleChatFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;

    const chatHistory = await AIChatHistory.findOne({
      _id: chatId,
      user: userId,
      source: 'parent'
    });

    if (!chatHistory) {
      return error(res, '聊天记录不存在', 404);
    }

    chatHistory.isFavorite = !chatHistory.isFavorite;
    await chatHistory.save();

    success(res, {
      chatId: chatHistory._id,
      isFavorite: chatHistory.isFavorite,
      message: chatHistory.isFavorite ? '已收藏' : '已取消收藏'
    });

  } catch (err) {
    console.error('切换收藏状态错误:', err);
    error(res, '切换收藏状态失败', 500);
  }
};

exports.clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await AIChatHistory.deleteMany({
      user: userId,
      source: 'parent'
    });

    success(res, {
      deletedCount: result.deletedCount,
      message: `成功清空${result.deletedCount}条聊天记录`
    });

  } catch (err) {
    console.error('清空聊天记录错误:', err);
    error(res, '清空聊天记录失败', 500);
  }
};

// Dify 流式聊天代理（家长端）
exports.streamChat = async (req, res) => {
  try {
    let { inputs, query, conversation_id, user: clientUser } = req.body;
    const userId = req.user._id;

    console.log(chalk.cyan('[家长AI助手] 开始流式对话'));
    console.log('用户ID:', userId);
    console.log('对话ID:', conversation_id);
    console.log('问题:', query);
    console.log('输入参数:', inputs);

    // 设置 SSE 响应头 - 禁用所有缓冲
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // Nginx 不缓冲
    res.setHeader('Transfer-Encoding', 'chunked');  // 分块传输
    
    // 立即发送响应头
    res.flushHeaders();

    let response;
    
    // 如果 conversation_id 为空，直接发送请求，不进行重试
    if (!conversation_id || conversation_id.trim() === '') {
      console.log(chalk.cyan('[家长AI助手] 开始新对话'));
      response = await axios.post(
        DIFY_CONFIG.apiUrl,
        {
          inputs: inputs || {},
          query: query,
          response_mode: 'streaming',
          conversation_id: '',
          user: clientUser || `parent-${userId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          timeout: 120000,
          responseType: 'stream'
        }
      );
    } else {
      // 有 conversation_id，先尝试使用它
      try {
        response = await axios.post(
          DIFY_CONFIG.apiUrl,
          {
            inputs: inputs || {},
            query: query,
            response_mode: 'streaming',
            conversation_id: conversation_id,
            user: clientUser || `parent-${userId}`
          },
          {
            headers: {
              'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream'
            },
            timeout: 120000,
            responseType: 'stream'
          }
        );
      } catch (firstError) {
        // 如果是 404，说明对话不存在，重试不带 conversation_id
        if (firstError.response?.status === 404) {
          console.log(chalk.yellow('[家长AI助手] 对话不存在(404)，开始新对话'));
          
          // 第二次尝试：不带 conversation_id，开始新对话
          response = await axios.post(
            DIFY_CONFIG.apiUrl,
            {
              inputs: inputs || {},
              query: query,
              response_mode: 'streaming',
              conversation_id: '',
              user: clientUser || `parent-${userId}`
            },
            {
              headers: {
                'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
              },
              timeout: 120000,
              responseType: 'stream'
            }
          );
        } else {
          // 其他错误，抛出
          throw firstError;
        }
      }
    }

    console.log(chalk.green('[家长AI助手] Dify API 连接成功'));

    // 将 Dify 的流式响应转发给客户端
    let chunkCount = 0;
    let totalBytes = 0;
    
    response.data.on('data', (chunk) => {
      chunkCount++;
      totalBytes += chunk.length;
      const chunkStr = chunk.toString('utf-8');
      console.log(chalk.cyan(`[家长AI助手] 收到数据块 #${chunkCount} (${chunk.length} bytes) - 立即转发`));
      
      // 如果包含error事件，显示完整内容
      if (chunkStr.includes('"event": "error"') || chunkStr.includes('"event":"error"')) {
        console.log(chalk.red('⚠️ 检测到错误事件，完整内容：'));
        console.log(chalk.red(chunkStr));
      } else {
        console.log(chalk.gray(chunkStr.substring(0, 200)));
      }
      
      // 立即写入并刷新缓冲区
      res.write(chunk);
      
      // 尝试立即刷新（如果可用）
      if (typeof res.flush === 'function') {
        res.flush();
      }
    });

    response.data.on('end', () => {
      console.log(chalk.green(`[家长AI助手] 流式响应结束 - 共收到 ${chunkCount} 个数据块，总计 ${totalBytes} bytes`));
      res.end();
    });

    response.data.on('error', (err) => {
      console.error(chalk.red('[家长AI助手] 流式响应错误:'), err);
      res.write(`data: ${JSON.stringify({ event: 'error', message: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error(chalk.red('[家长AI助手] 流式对话失败:'), err.message);
    if (err.response) {
      console.error('HTTP状态:', err.response.status);
      console.error('错误详情:', err.response.data);
    }

    // 如果还没有发送响应头，发送错误响应
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '流式对话失败',
        error: err.message
      });
    } else {
      // 如果已经发送了响应头，通过 SSE 发送错误事件
      res.write(`data: ${JSON.stringify({ event: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
};

