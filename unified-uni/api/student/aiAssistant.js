import request, { BASE_URL } from "@/utils/request.js";

let isRequesting = false;
let requestTask = null;

/**
 * 发送 Dify 消息 (流式响应)
 * @param {Object} messageData - { query, inputs, conversation_id, user }
 * @param {Object} callbacks - { onData, onComplete, onError }
 */
export const sendMessage = async (messageData, callbacks) => {
  const { onData, onComplete, onError } = callbacks;

  // 1. 防重复检查
  if (isRequesting) {
    return;
  }

  isRequesting = true;

  // 2. 准备请求数据
  const token = uni.getStorageSync("token");
  const url = `${BASE_URL}/student/ai-chat/stream`;

  const postData = {
    inputs: messageData.inputs || {},
    query: messageData.query,
    response_mode: "streaming",
    conversation_id: messageData.conversation_id || "",
    user: messageData.user || "student-user",
  };

  // 3. 发起请求
  requestTask = uni.request({
    url: url,
    method: "POST",
    header: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    data: postData,
    enableChunked: true,
    responseType: "text",
    success: (res) => {
      // App 端会走这里（不支持 onChunkReceived）
      // 解析完整响应并一次性处理
      try {
        const lines = res.data.split("\n");
        let fullAnswer = "";
        let conversationId = "";
        let files = [];

        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6).trim();
            try {
              const jsonData = JSON.parse(jsonStr);

              if (jsonData.answer) {
                fullAnswer += jsonData.answer.replace(/\\n/g, "\n");
              }
              if (jsonData.conversation_id) {
                conversationId = jsonData.conversation_id;
              }
              if (jsonData.files && jsonData.files.length > 0) {
                files = jsonData.files;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        });

        // 一次性发送完整内容
        if (fullAnswer) {
          onData({
            answer: fullAnswer,
            conversation_id: conversationId,
            files: files,
          });
        }

        onData({
          event: "message_end",
          conversation_id: conversationId,
        });
      } catch (err) {
        console.error("[Dify API] App端数据处理异常:", err);
        onError(err);
      }
    },
    fail: (err) => {
      console.error("[Dify API] 请求失败:", err);
      onError(err);
      resetState();
    },
    complete: () => {
      onComplete();
      resetState();
    },
  });

  // 4. 尝试监听流式数据（仅 H5/小程序支持）
  if (requestTask.onChunkReceived && typeof requestTask.onChunkReceived === "function") {
    requestTask.onChunkReceived((res) => {
      try {
        // ArrayBuffer 转 String
        const arrayBuffer = res.data;
        const uint8Array = new Uint8Array(arrayBuffer);
        let chunkText = "";
        for (let i = 0; i < uint8Array.length; i++) {
          chunkText += String.fromCharCode(uint8Array[i]);
        }

        // 处理中文解码
        try {
          chunkText = decodeURIComponent(escape(chunkText));
        } catch (e) {
          // 解码失败，忽略
        }

        // 解析 SSE 格式
        const lines = chunkText.split("\n");
        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6).trim();

            try {
              const jsonData = JSON.parse(jsonStr);

              // 处理错误事件
              if (jsonData.event === "error") {
                onError(new Error(jsonData.message));
                return;
              }

              // 处理正常消息/文件
              if (jsonData.answer || (jsonData.files && jsonData.files.length > 0)) {
                onData(jsonData);
              }

              // 处理 message_end
              if (jsonData.event === "message_end") {
                onData(jsonData);
                onComplete();
                resetState();
              }
            } catch (e) {
              // JSON 解析失败，忽略
            }
          }
        });
      } catch (err) {
        console.error("[Dify API] 流式数据处理异常:", err);
      }
    });
  } else {
    console.log(requestTask.onChunkReceived, "onChunkReceived");
  }
};

/**
 * 手动中断请求
 */
export const abortMessage = () => {
  if (requestTask) {
    requestTask.abort();
    resetState();
  }
};

/**
 * 重置状态 (内部函数)
 */
const resetState = () => {
  isRequesting = false;
  requestTask = null;
};

export function saveChatHistory(chatData) {
  return request({
    url: "/student/ai-chat/save",
    method: "POST",
    data: chatData,
  });
}

export function saveChatHistoryBatch(messages) {
  return request({
    url: "/student/ai-chat/save-batch",
    method: "POST",
    data: { messages },
  });
}

export function getChatHistory(params = {}) {
  return request({
    url: "/student/ai-chat/history",
    method: "GET",
    params,
  });
}

export function getConversationList(params = {}) {
  return request({
    url: "/student/ai-chat/conversations",
    method: "GET",
    params,
  });
}

export function deleteChatHistory(chatId) {
  return request({
    url: `/student/ai-chat/${chatId}`,
    method: "DELETE",
  });
}

export function deleteConversation(conversationId) {
  return request({
    url: `/student/ai-chat/conversation/${conversationId}`,
    method: "DELETE",
  });
}

export function toggleChatFavorite(chatId) {
  return request({
    url: `/student/ai-chat/${chatId}/favorite`,
    method: "PUT",
  });
}

export function clearAllChatHistory() {
  return request({
    url: "/student/ai-chat/clear-all",
    method: "DELETE",
  });
}
