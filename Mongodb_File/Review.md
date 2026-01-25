# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## Review

**集合名称**: `reviews`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| order | ObjectId → Order | ✓ |  |  |  |  |
| dish | ObjectId → Dish |  |  |  |  |  |
| rating | Number | ✓ |  |  |  |  |
| taste | Number |  |  |  |  |  |
| freshness | Number |  |  |  |  |  |
| portionSize | Number |  |  |  |  |  |
| comment | String |  |  |  |  |  |
| images | Array<String> |  | [Function] |  |  |  |
| isAnonymous | Boolean |  | false |  |  |  |
| reply.content | String |  |  |  |  |  |
| reply.repliedBy | ObjectId → User |  |  |  |  |  |
| reply.repliedAt | Date |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1 | {user:1} | background |
| order_1 | {order:1} | background |
| dish_1 | {dish:1} | background |
| rating_1 | {rating:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| order | Order | Reference |
| dish | Dish | Reference |
| reply.repliedBy | User | Reference |

---

