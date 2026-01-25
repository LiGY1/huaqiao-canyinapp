# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## PurchaseOrder

**集合名称**: `purchaseorders`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| orderNumber | String | ✓ |  | ✓ | ✓ |  |
| items | Object |  | [Function] |  |  |  |
| items.ingredient | ObjectId → Inventory |  |  |  |  |  |
| items.ingredientName | String |  |  |  |  |  |
| items.quantity | Number | ✓ |  |  |  |  |
| items.unit | String |  |  |  |  |  |
| items.unitPrice | Number |  |  |  |  |  |
| items.totalPrice | Number |  |  |  |  |  |
| supplier | String | ✓ |  |  |  |  |
| totalAmount | Number | ✓ |  |  |  |  |
| status | String |  | pending |  |  |  |
| requestedBy | ObjectId → User |  |  |  |  |  |
| approvedBy | ObjectId → User |  |  |  |  |  |
| expectedDate | Date |  |  |  |  |  |
| receiveDate | Date |  |  |  |  |  |
| actualAmount | Number |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| approvalRemark | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| orderNumber_1 | {orderNumber:1} | unique, background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| items.ingredient | Inventory | Nested Reference |
| requestedBy | User | Reference |
| approvedBy | User | Reference |

---

