import request, { BASE_URL } from "@/utils/request.js";

let isRequesting = false;
let requestTask = null;

/**
 * 发送 Dify 消息 (流式响应) - 学校端
 * @param {Object} messageData - { query, inputs, conversation_id, user }
 * @param {Object} callbacks - { onData, onComplete, onError }
 */
export const sendMessage = async (messageData, callbacks) => {
    const { onData, onComplete, onError } = callbacks;

    if (isRequesting) {
        return;
    }

    isRequesting = true;

    const token = uni.getStorageSync("token");
    const url = `${BASE_URL}/school/ai-chat/stream`;

    const postData = {
        inputs: messageData.inputs || {},
        query: messageData.query,
        response_mode: "streaming",
        conversation_id: messageData.conversation_id || "",
        user: messageData.user || "school-user",
    };

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
            // App 端非流式处理
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
                        } catch (e) { }
                    }
                });

                if (fullAnswer) {
                    onData({
                        answer: fullAnswer,
                        conversation_id: conversationId,
                        files: files,
                    });
                }

                onData({ event: "message_end", conversation_id: conversationId });
            } catch (err) {
                onError(err);
            }
        },
        fail: (err) => {
            onError(err);
            resetState();
        },
        complete: () => {
            onComplete();
            resetState();
        },
    });

    try {
        if (requestTask.onChunkReceived && typeof requestTask.onChunkReceived === "function") {
            requestTask.onChunkReceived((res) => {
                try {
                    const arrayBuffer = res.data;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    let chunkText = "";
                    for (let i = 0; i < uint8Array.length; i++) {
                        chunkText += String.fromCharCode(uint8Array[i]);
                    }

                    try {
                        chunkText = decodeURIComponent(escape(chunkText));
                    } catch (e) { }

                    const lines = chunkText.split("\n");
                    lines.forEach((line) => {
                        if (line.startsWith("data: ")) {
                            const jsonStr = line.substring(6).trim();
                            try {
                                const jsonData = JSON.parse(jsonStr);
                                if (jsonData.event === "error") {
                                    onError(new Error(jsonData.message));
                                    return;
                                }
                                if (jsonData.answer || (jsonData.files && jsonData.files.length > 0)) {
                                    onData(jsonData);
                                }
                                if (jsonData.event === "message_end") {
                                    onData(jsonData);
                                    onComplete();
                                    resetState();
                                }
                            } catch (e) { }
                        }
                    });
                } catch (err) {
                    console.error("[Dify API] 流式数据处理异常:", err);
                }
            });
        }
    } catch (err) { }
};

export const abortMessage = () => {
    if (requestTask) {
        requestTask.abort();
        resetState();
    }
};

const resetState = () => {
    isRequesting = false;
    requestTask = null;
};

export function saveChatHistory(data) {
    return request({
        url: "/school/ai-chat/save",
        method: "POST",
        data,
    });
}

export function getChatHistory(data) {
    return request({
        url: "/school/ai-chat/history",
        method: "GET",
        data,
    });
}

export function clearAllChatHistory() {
    return request({
        url: "/school/ai-chat/clear-all",
        method: "DELETE",
    });
}
