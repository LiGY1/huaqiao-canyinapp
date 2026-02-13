# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## Favorite

**集合名称**: `favorites`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| dish | ObjectId → Dish | ✓ |  |  |  |  |
| createdAt | Date |  | [Function] |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1_dish_1 | {user:1,dish:1} | unique, background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| dish | Dish | Reference |

---

