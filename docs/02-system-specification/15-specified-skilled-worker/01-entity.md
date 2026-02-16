---
title: エンティティ定義
---

# 特定技能・職業紹介 エンティティ定義

## JobPosting / 求人情報

企業からの求人情報。特定技能の分野ごとに分類し、マッチングの起点となる。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 企業名 | companyName | String | - | - | - | |
| 職種分野 | jobCategory | Enum(SpecifiedSkilledWorkerField) | - | - | - | 特定技能12分野 |
| 職種詳細 | jobTitle | String | - | - | - | |
| 勤務地 | workLocation | String | - | - | - | |
| 給与（月額） | monthlySalary | Int | - | o | - | 円。正の数 |
| 雇用形態 | employmentType | String | - | - | - | |
| 求人ステータス | status | Enum(JobPostingStatus) | OPEN | - | - | |
| 募集人数 | openings | Int | 1 | - | - | 正の整数 |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- JobPosting → JobMatch: この求人へのマッチング (1:N)

---

## JobMatch / マッチング

学生と求人のマッチング情報。候補から内定までの進捗を追跡する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 求人ID | jobPostingId | UUID | - | - | - | FK → JobPosting |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| マッチングステータス | status | Enum(JobMatchStatus) | CANDIDATE | - | - | |
| 推薦日 | recommendedDate | Date | - | o | - | ステータスが RECOMMENDED 以降で設定 |
| 面接日 | interviewDate | Date | - | o | - | ステータスが INTERVIEWING 以降で設定 |
| 内定日 | offerDate | Date | - | o | - | ステータスが OFFERED で設定 |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- JobMatch → JobPosting: 対象求人 (N:1)
- JobMatch → Student: 対象学生 (N:1) ※ Student は 02-student-management で定義

### ビジネスルール

- 同一学生 × 同一求人の組み合わせは一意（重複マッチング不可）
- ステータス遷移: CANDIDATE → RECOMMENDED → INTERVIEWING → OFFERED / DECLINED / REJECTED

---

## SupportPlan / 支援計画

特定技能外国人への支援計画。登録支援機関としての業務を管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 支援開始日 | startDate | Date | - | - | - | |
| 支援終了日 | endDate | Date | - | o | - | 継続中の場合は null |
| 登録支援機関名 | supportOrganization | String | - | - | - | |
| 月額支援料 | monthlySupportFee | Int | - | o | - | 円。正の数 |
| 支援内容 | supportDetails | String | - | o | - | |
| ステータス | status | Enum(SupportPlanStatus) | ACTIVE | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- SupportPlan → Student: 支援対象の学生 (N:1) ※ Student は 02-student-management で定義

### ビジネスルール

- 同一学生に対して ACTIVE な支援計画は1つのみ
- 終了時に endDate を設定し、ステータスを COMPLETED に変更

---

## Enum 定義

### SpecifiedSkilledWorkerField / 特定技能分野

| 値 | 表示名 |
|----|--------|
| NURSING_CARE | 介護 |
| BUILDING_CLEANING | ビルクリーニング |
| MANUFACTURING | 素形材・産業機械・電気電子情報関連製造業 |
| CONSTRUCTION | 建設 |
| SHIPBUILDING | 造船・舶用工業 |
| AUTO_MAINTENANCE | 自動車整備 |
| AVIATION | 航空 |
| ACCOMMODATION | 宿泊 |
| AGRICULTURE | 農業 |
| FISHERY | 漁業 |
| FOOD_MANUFACTURING | 飲食料品製造業 |
| FOOD_SERVICE | 外食業 |

### JobPostingStatus / 求人ステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| OPEN | 募集中 | |
| CLOSED | 募集終了 | |
| FILLED | 充足 | 募集人数に達した |

### JobMatchStatus / マッチングステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| CANDIDATE | 候補 | マッチング候補として登録 |
| RECOMMENDED | 推薦中 | 企業に推薦済み |
| INTERVIEWING | 面接中 | 面接段階 |
| OFFERED | 内定 | 内定取得 |
| DECLINED | 辞退 | 学生側の辞退 |
| REJECTED | 不合格 | 企業側の不採用 |

### SupportPlanStatus / 支援計画ステータス

| 値 | 表示名 |
|----|--------|
| ACTIVE | 実施中 |
| COMPLETED | 完了 |
| CANCELLED | 取消 |
