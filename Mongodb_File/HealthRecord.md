# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## HealthRecord

**集合名称**: `healthrecords`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| date | Date | ✓ |  |  |  |  |
| weight | Number |  |  |  |  |  |
| height | Number |  |  |  |  |  |
| bmi | Number |  |  |  |  |  |
| bloodPressure.systolic | Number |  |  |  |  |  |
| bloodPressure.diastolic | Number |  |  |  |  |  |
| bloodSugar.fasting | Number |  |  |  |  |  |
| bloodSugar.postprandial | Number |  |  |  |  |  |
| temperature | Number |  |  |  |  |  |
| heartRate | Number |  |  |  |  |  |
| sleepHours | Number |  |  |  |  |  |
| exerciseMinutes | Number |  |  |  |  |  |
| waterIntake | Number |  |  |  |  |  |
| healthStatus | String |  | good |  |  |  |
| symptoms | Array<String> |  | [Function] |  |  |  |
| notes | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1_date_-1 | {user:1,date:-1} | background |
| user | {user:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |

---

