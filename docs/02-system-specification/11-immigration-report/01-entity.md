---
title: エンティティ定義
---

# 入管報告・届出 エンティティ定義

## ImmigrationTask / 入管タスク

入管への報告・届出タスク。イベントベース（退学時等）とスケジュールベース（定期報告）の両方を管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| タスク種別 | taskType | Enum(ImmigrationTaskType) | - | - | - | |
| 発生トリガー | trigger | Enum(TaskTrigger) | - | - | - | イベント/スケジュール |
| 対象学生ID | studentId | UUID | - | o | - | FK → Student。学生単位のタスクの場合 |
| 期限 | deadline | Date | - | - | - | |
| ステータス | status | Enum(TaskStatus) | TODO | - | - | |
| 根拠法令 | legalBasis | String | - | o | - | 告示基準第XX号 等 |
| 届出方法 | submissionMethod | String | - | o | - | 電子届出/窓口/郵送 |
| 完了日 | completedAt | Date | - | o | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### studentId の必須/任意ルール

| タスク種別 | studentId |
|-----------|----------|
| ENROLLMENT_NOTIFICATION（受入れ開始届出） | 必須 |
| DEPARTURE_NOTIFICATION（受入れ終了届出） | 必須 |
| WITHDRAWAL_REPORT（退学報告） | 必須 |
| LOW_ATTENDANCE_REPORT（出席率低下報告） | 必須 |
| MISSING_PERSON_REPORT（所在不明者報告） | 必須 |
| VISA_RENEWAL（ビザ更新） | 必須 |
| CHANGE_NOTIFICATION（変更届出） | 任意 |
| COE_APPLICATION（在留資格認定証明書交付申請） | 任意 |

### リレーション

- ImmigrationTask → Student: 対象学生（任意） (N:1)
- ImmigrationTask → ImmigrationDocument: 関連書類 (1:N)

---

## ImmigrationDocument / 入管書類

入管タスクに紐づく提出書類の収集状態を管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| タスクID | taskId | UUID | - | - | - | FK → ImmigrationTask |
| 書類名 | documentName | String | - | - | - | |
| 収集状態 | collectionStatus | Enum(CollectionStatus) | NOT_COLLECTED | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- ImmigrationDocument → ImmigrationTask: 所属タスク (N:1)

---

## ScheduledReport / 定期報告スケジュール

年間スケジュールに基づく定期報告の管理。システムが自動生成する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 報告種別 | reportType | Enum(ScheduledReportType) | - | - | - | |
| 対象年度 | fiscalYear | Int | - | - | - | |
| 期限 | deadline | Date | - | - | - | |
| ステータス | status | Enum(TaskStatus) | TODO | - | - | |
| 完了日 | completedAt | Date | - | o | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### 複合ユニーク制約

- (reportType, fiscalYear) のペアで一意

---

## Enum 定義

### ImmigrationTaskType / 入管タスク種別

| 値 | 表示名 | トリガー |
|----|--------|---------|
| WITHDRAWAL_REPORT | 退学者報告 | イベント |
| LOW_ATTENDANCE_REPORT | 出席率5割未満報告 | イベント |
| ENROLLMENT_NOTIFICATION | 受入れ開始届出 | イベント |
| DEPARTURE_NOTIFICATION | 受入れ終了届出 | イベント |
| MISSING_PERSON_REPORT | 所在不明者報告 | イベント |
| CHANGE_NOTIFICATION | 変更届出 | イベント |
| COE_APPLICATION | COE交付申請 | イベント |
| VISA_RENEWAL | 在留期間更新 | スケジュール |

### TaskTrigger / タスク発生トリガー

| 値 | 表示名 |
|----|--------|
| EVENT | イベントベース |
| SCHEDULE | スケジュールベース |

### TaskStatus / タスクステータス

| 値 | 表示名 |
|----|--------|
| TODO | 未着手 |
| IN_PROGRESS | 進行中 |
| DONE | 完了 |
| OVERDUE | 期限超過 |

### CollectionStatus / 書類収集状態

| 値 | 表示名 |
|----|--------|
| NOT_COLLECTED | 未回収 |
| COLLECTED | 回収済み |
| AUTO_GENERATED | システム自動生成 |

### ScheduledReportType / 定期報告種別

| 値 | 表示名 | 期限 | 根拠 |
|----|--------|------|------|
| ENROLLMENT_COUNT_MAY | 在籍者数届出（5月） | 5月14日 | 入管法第19条の17 |
| ENROLLMENT_COUNT_NOV | 在籍者数届出（11月） | 11月14日 | 入管法第19条の17 |
| ATTENDANCE_FIRST_HALF | 出席率報告（前期） | 12月末 | 告示基準第35号 |
| ATTENDANCE_SECOND_HALF | 出席率報告（後期） | 6月末 | 告示基準第35号 |
| PERIODIC_INSPECTION | 定期点検報告書 | 6月末 | 告示基準第45号 |
| COURSE_COMPLETION | 課程修了者報告 | 6月末 | 告示基準第44号 |
| OPERATION_STATUS | 運営状況報告（文科省） | 6月末 | 認定法施行規則第28条 |
| BUSINESS_PLAN | 事業計画書 | 4月末 | 告示基準第43号 |
