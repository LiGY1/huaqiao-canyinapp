# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## AIReport

**集合名称**: `aireports`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| student | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| reportType | String | ✓ |  | ✓ | ✓ |  |
| dateRange.start | Date | ✓ |  |  |  |  |
| dateRange.end | Date | ✓ |  |  |  |  |
| content.summary | String |  |  |  |  |  |
| content.highlights | Array<String> |  | [Function] |  |  |  |
| content.suggestions | Array<String> |  | [Function] |  |  |  |
| content.nextPlan | String |  |  |  |  |  |
| content.fullText | String |  |  |  |  |  |
| dataSummary.avgCalories | Number |  |  |  |  |  |
| dataSummary.avgProtein | Number |  |  |  |  |  |
| dataSummary.avgFat | Number |  |  |  |  |  |
| dataSummary.avgCarbs | Number |  |  |  |  |  |
| dataSummary.avgFiber | Number |  |  |  |  |  |
| dataSummary.totalDays | Number |  |  |  |  |  |
| dataSummary.targetCalories | Number |  |  |  |  |  |
| dataSummary.nutritionScore.carbs | Number |  |  |  |  |  |
| dataSummary.nutritionScore.protein | Number |  |  |  |  |  |
| dataSummary.nutritionScore.fat | Number |  |  |  |  |  |
| dataSummary.nutritionScore.fiber | Number |  |  |  |  |  |
| dataSummary.nutritionScore.vitamin | Number |  |  |  |  |  |
| conversationId | String |  |  |  |  |  |
| status | String |  | generating |  |  |  |
| errorMessage | String |  |  |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| student_1 | {student:1} | background |
| reportType_1 | {reportType:1} | background |
| createdAt_1 | {createdAt:1} | background |
| student_1_reportType_1_createdAt_-1 | {student:1,reportType:1,createdAt:-1} | background |
| student_1_dateRange.start_1_dateRange.end_1 | {student:1,dateRange.start:1,dateRange.end:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| student | User | Reference |

---

