# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## Inventory

**集合名称**: `inventories`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| name | String | ✓ |  |  |  |  |
| category | String |  | other |  |  |  |
| quantity | Number | ✓ | 0 |  |  |  |
| unit | String | ✓ | 斤 |  |  |  |
| warningLevel | Number |  | 100 |  |  |  |
| unitPrice | Number |  | 0 |  |  |  |
| supplier | String |  |  |  |  |  |
| lastStockIn | Date |  |  |  |  |  |
| expiryDate | Date |  |  |  |  |  |
| storageLocation | String |  |  |  |  |  |
| stockHistory | Object |  | [Function] |  |  |  |
| stockHistory.type | String |  |  |  |  |  |
| stockHistory.quantity | Number |  |  |  |  |  |
| stockHistory.date | Date |  |  |  |  |  |
| stockHistory.operator | String |  |  |  |  |  |
| stockHistory.remark | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

---

