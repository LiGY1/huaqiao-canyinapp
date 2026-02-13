# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## AuthToken

**集合名称**: `auth`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| token | String | ✓ |  | ✓ | ✓ |  |
| isActive | Boolean |  | true |  |  |  |
| createdAt | Date |  | [Function] |  |  |  |
| lastUsedAt | Date |  | [Function] |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| token_1 | {token:1} | unique, background |
| isActive_1 | {isActive:1} | background |

---

