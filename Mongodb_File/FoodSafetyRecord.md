# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## FoodSafetyRecord

**集合名称**: `foodsafetyrecords`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| type | String | ✓ |  |  |  |  |
| ingredient | ObjectId → Inventory |  |  |  |  |  |
| ingredientName | String |  |  |  |  |  |
| supplier | String |  |  |  |  |  |
| quantity | Number |  |  |  |  |  |
| unit | String |  |  |  |  |  |
| qualityStatus | String |  |  |  |  |  |
| temperature | Number |  |  |  |  |  |
| freshness | String |  |  |  |  |  |
| area | String |  |  |  |  |  |
| method | String |  |  |  |  |  |
| concentration | String |  |  |  |  |  |
| duration | Number |  |  |  |  |  |
| inspector | String |  |  |  |  |  |
| date | Date |  | [Function] |  |  |  |
| result | String |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| images | Array<String> |  | [Function] |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| ingredient | Inventory | Reference |

---

