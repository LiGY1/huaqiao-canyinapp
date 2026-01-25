# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## AIChatHistory

**集合名称**: `aichathistories`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| source | String | ✓ | student | ✓ | ✓ |  |
| conversationId | String |  |  | ✓ | ✓ |  |
| sender | String | ✓ |  |  |  |  |
| userMessage | String |  |  |  |  |  |
| aiMessage | String |  |  |  |  |  |
| files | Object |  | [Function] |  |  |  |
| files.filename | String |  |  |  |  |  |
| files.url | String |  |  |  |  |  |
| files.type | String |  | image |  |  |  |
| files.size | Number |  |  |  |  |  |
| files.mimeType | String |  |  |  |  |  |
| timestamp | Date |  | [Function] | ✓ | ✓ |  |
| metadata.wrappedQuery | String |  |  |  |  |  |
| metadata.tokens.prompt | Number |  |  |  |  |  |
| metadata.tokens.completion | Number |  |  |  |  |  |
| metadata.tokens.total | Number |  |  |  |  |  |
| metadata.responseTime | Number |  |  |  |  |  |
| metadata.extras | Mixed |  |  |  |  |  |
| summary | String |  |  |  |  |  |
| tags | Array<String> |  | [Function] |  |  |  |
| isFavorite | Boolean |  | false |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1 | {user:1} | background |
| source_1 | {source:1} | background |
| conversationId_1 | {conversationId:1} | background |
| timestamp_1 | {timestamp:1} | background |
| createdAt_1 | {createdAt:1} | background |
| user_1_source_1_createdAt_-1 | {user:1,source:1,createdAt:-1} | background |
| user_1_source_1_conversationId_1 | {user:1,source:1,conversationId:1} | background |
| user_1_isFavorite_1_createdAt_-1 | {user:1,isFavorite:1,createdAt:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |

---

