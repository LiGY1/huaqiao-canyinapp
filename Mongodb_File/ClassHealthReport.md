# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## ClassHealthReport

**集合名称**: `classhealthreports`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| generatedBy | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| filters.grade | String |  |  |  |  |  |
| filters.class | String |  |  |  |  |  |
| filters.keyword | String |  |  |  |  |  |
| filters.healthStatus | String |  |  |  |  |  |
| scope | String | ✓ |  |  |  |  |
| summary.total | Number | ✓ |  |  |  |  |
| summary.healthy | Number |  |  |  |  |  |
| summary.attention | Number |  |  |  |  |  |
| summary.abnormal | Number |  |  |  |  |  |
| summary.healthyRate | Number |  |  |  |  |  |
| summary.avgHeight | Number |  |  |  |  |  |
| summary.avgWeight | Number |  |  |  |  |  |
| summary.avgBMI | Number |  |  |  |  |  |
| summary.avgNutritionScore | Number |  |  |  |  |  |
| content.overview | String |  |  |  |  |  |
| content.highlights | Array<String> |  | [Function] |  |  |  |
| content.suggestions | Array<String> |  | [Function] |  |  |  |
| content.nextPlan | String |  |  |  |  |  |
| students | Object |  | [Function] |  |  |  |
| students.studentId | String |  |  |  |  |  |
| students.studentName | String |  |  |  |  |  |
| students.healthStatus | String |  |  |  |  |  |
| students.bmi | Number |  |  |  |  |  |
| conversationId | String |  |  |  |  |  |
| status | String |  | generating |  |  |  |
| errorMessage | String |  |  |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| generatedBy_1 | {generatedBy:1} | background |
| createdAt_1 | {createdAt:1} | background |
| generatedBy_1_createdAt_-1 | {generatedBy:1,createdAt:-1} | background |
| scope_1_createdAt_-1 | {scope:1,createdAt:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| generatedBy | User | Reference |

---

