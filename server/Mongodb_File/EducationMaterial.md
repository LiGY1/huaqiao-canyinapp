# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## EducationMaterial

**集合名称**: `educationmaterials`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| title | String | ✓ |  |  |  |  |
| type | String | ✓ |  |  |  |  |
| category | String |  | nutrition |  |  |  |
| content | String |  |  |  |  |  |
| fileType | String |  |  |  |  |  |
| fileUrl | String |  |  |  |  |  |
| targetGrades | Array<String> |  | [Function] |  |  |  |
| targetClasses | Array<String> |  | [Function] |  |  |  |
| duration | Number |  |  |  |  |  |
| completionRate | Number |  | 0 |  |  |  |
| scheduledDate | Date |  |  |  |  |  |
| sendDate | Date |  |  |  |  |  |
| readCount | Number |  | 0 |  |  |  |
| author | ObjectId → User |  |  |  |  |  |
| authorName | String |  |  |  |  |  |
| publishDate | Date |  | [Function] |  |  |  |
| isPublished | Boolean |  | false |  |  |  |
| viewCount | Number |  | 0 |  |  |  |
| downloadCount | Number |  | 0 |  |  |  |
| description | String |  |  |  |  |  |
| tags | Array<String> |  | [Function] |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| author | User | Reference |

---

