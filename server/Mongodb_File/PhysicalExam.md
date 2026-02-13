# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## PhysicalExam

**集合名称**: `physicalexams`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| student | ObjectId → User | ✓ |  |  |  |  |
| examDate | Date | ✓ |  |  |  |  |
| height | Number | ✓ |  |  |  |  |
| weight | Number | ✓ |  |  |  |  |
| bmi | Number |  |  |  |  |  |
| vision.left | String |  |  |  |  |  |
| vision.right | String |  |  |  |  |  |
| bloodPressure.systolic | Number |  |  |  |  |  |
| bloodPressure.diastolic | Number |  |  |  |  |  |
| heartRate | Number |  |  |  |  |  |
| hemoglobin | Number |  |  |  |  |  |
| healthStatus | String |  | good |  |  |  |
| nutritionScore | Number |  | 0 |  |  |  |
| notes | String |  |  |  |  |  |
| examiner | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| student | User | Reference |

---

