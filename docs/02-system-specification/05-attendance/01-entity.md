---
title: エンティティ定義
---

# 出席管理 エンティティ定義

## AttendanceRecord / 出欠記録

クラス × 学生 × 日付 × 時限 の出欠データ。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 日付 | date | Date | - | - | - | |
| 時限 | period | Int | - | - | - | 1〜6 |
| 出欠ステータス | status | Enum(AttendanceStatus) | ABSENT | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- AttendanceRecord → Student: 対象学生 (N:1)

### 複合ユニーク制約

- (studentId, date, period) のペアで一意

---

## MonthlyAttendanceRate / 月次出席率

学生ごとの月次出席率。入管報告・指導判定に使用する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 対象年月 | month | String | - | - | - | `YYYY-MM` 形式 |
| 出席すべき時間数 | requiredHours | Int | - | - | - | |
| 出席した時間数 | attendedHours | Int | - | - | - | |
| 遅刻回数 | lateCount | Int | 0 | - | - | |
| 遅刻換算欠席数 | lateAsAbsence | Int | 0 | - | - | 遅刻4回 = 欠席1回 |
| 出席率 | rate | Float | - | - | - | 0.0〜1.0 |
| アラートレベル | alertLevel | Enum(AttendanceAlertLevel) | NORMAL | - | - | 自動算出 |
| 作成日時 | createdAt | DateTime | auto | - | - | |

### リレーション

- MonthlyAttendanceRate → Student: 対象学生 (N:1)

### 複合ユニーク制約

- (studentId, month) のペアで一意

### ビジネスルール

- `rate = attendedHours / requiredHours`（遅刻換算後）
- 遅刻4回 = 欠席1回（設定変更可能）
- alertLevel は rate に基づき自動判定

---

## SemiannualAttendanceReport / 半期出席率報告

入管への半期報告用の集計データ。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 対象期間区分 | term | Enum(AttendanceTerm) | - | - | - | 前期/後期 |
| 対象年度 | fiscalYear | Int | - | - | - | |
| 全体出席率 | overallRate | Float | - | - | - | |
| 報告期限 | deadline | Date | - | - | - | |
| 報告状態 | reportStatus | Enum(ReportStatus) | PENDING | - | - | |
| 報告日 | reportedAt | Date | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |

---

## Enum 定義

### AttendanceStatus / 出欠ステータス

| 値 | 表示名 | 出席率への影響 |
|----|--------|--------------|
| PRESENT | 出席 | 出席としてカウント |
| ABSENT | 欠席 | 欠席としてカウント |
| LATE | 遅刻 | 4回 = 欠席1回 |
| EARLY_LEAVE | 早退 | — |
| EXCUSED | 公欠 | 出席扱い |
| SUSPENDED | 出停 | 出席停止 |

### AttendanceAlertLevel / 出席率アラートレベル

| 値 | 表示名 | 条件 | 対応 |
|----|--------|------|------|
| NORMAL | 正常 | 80%以上 | 対応不要 |
| GUIDANCE_REQUIRED | 指導必要 | 50%以上80%未満 | 改善指導・指導記録の保存 |
| REPORT_REQUIRED | 入管報告必要 | 50%未満 | 改善指導 + 翌月末までに入管報告 |

### AttendanceTerm / 出席率報告期間

| 値 | 表示名 | 対象期間 | 報告期限 |
|----|--------|---------|---------|
| FIRST_HALF | 前期 | 4月1日〜9月30日 | 12月末 |
| SECOND_HALF | 後期 | 10月1日〜翌年3月31日 | 6月末 |

### ReportStatus / 報告状態

| 値 | 表示名 |
|----|--------|
| PENDING | 未提出 |
| SUBMITTED | 提出済み |
