---
title: エンティティ定義
---

# 教職員管理 エンティティ定義

## Staff / 教職員

教職員の基本情報・雇用形態・資格を管理する中核エンティティ。他カテゴリから作成者（createdById）の FK 先として参照される。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 氏名 | name | String | - | - | - | |
| メールアドレス | email | String | - | o | o | メール形式 |
| 電話番号 | phone | String | - | o | - | |
| 役職 | role | Enum(StaffRole) | - | - | - | |
| 雇用形態 | employmentType | Enum(EmploymentType) | - | - | - | |
| 入社日 | hireDate | Date | - | - | - | |
| 退職日 | resignationDate | Date | - | o | - | |
| 給与形態 | payType | Enum(PayType) | - | o | - | 非常勤の場合に設定 |
| 週間コマ数上限 | maxWeeklyLessons | Int | - | o | - | 常勤: 25（望ましくは16）、非常勤: null |
| 有効フラグ | isActive | Boolean | true | - | - | 退職時に false |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- Staff → TeacherQualification: 保有資格 (1:N)
- Staff → ClassEnrollment: 担当クラス (through TimetableSlot)
- Staff → GeneratedDocument: 作成した文書 (1:N, createdById として)
- Staff → InterviewRecord: 担当した面談 (1:N, staffId として)
- Staff → Student: 出迎え担当 (1:N, pickupStaffId として)

### ビジネスルール

- 常勤講師の週間コマ数は法定上限25単位時間以内（告示基準第14号）
- 教員の過半数は常勤でなければならない（告示基準第11号）
- 学生20名につき教員1名以上が必要（告示基準第10号）
- 学生40名につき専任（常勤）教員1名以上が必要（告示基準第11号）

---

## TeacherQualification / 教員資格

教員が保有する資格情報。1人の教員が複数の資格を持つことがある。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 教職員ID | staffId | UUID | - | - | - | FK → Staff |
| 資格種別 | qualificationType | Enum(QualificationType) | - | - | - | |
| 取得日 | acquiredDate | Date | - | o | - | |
| 有効期限 | expirationDate | Date | - | o | - | 登録日本語教師の場合に該当 |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- TeacherQualification → Staff: 所属教職員 (N:1)

### ビジネスルール

- 教員として授業を担当するには、いずれかの資格 + 大卒以上が必要
- 登録日本語教師は国家資格で有効期限がある（移行期間中）

---

## Enum 定義

### StaffRole / 役職

| 値 | 表示名 | 備考 |
|----|--------|------|
| PRINCIPAL | 校長 | 教育に関する識見を有する者。1名必須 |
| HEAD_TEACHER | 教務主任 | 常勤で3年以上の経験。1名必須 |
| FULL_TIME_TEACHER | 常勤講師 | 最低3名以上 |
| PART_TIME_TEACHER | 非常勤講師 | 必要数 |
| LIFE_COUNSELOR | 生活指導員 | 1名以上 |
| ADMINISTRATIVE_STAFF | 事務担当 | 必要数 |
| MANAGEMENT | 経営者 | |

### EmploymentType / 雇用形態

| 値 | 表示名 |
|----|--------|
| FULL_TIME | 常勤 |
| PART_TIME | 非常勤 |
| CONTRACT | パート |

### PayType / 給与形態

| 値 | 表示名 | 備考 |
|----|--------|------|
| MONTHLY_SALARY | 月給 | 常勤講師向け。例: 月給24万+社保 = 約28万/月 |
| HOURLY_WAGE | 時給+授業手当 | 例: 時給1,200円 + 授業手当800円 |
| PER_LESSON | コマ給 | 例: 1コマ2,000円 |

### QualificationType / 資格種別

| 値 | 表示名 | 備考 |
|----|--------|------|
| MAJOR | 主専攻 | 日本語教育を主専攻として大学・大学院卒 |
| MINOR | 副専攻 | 日本語教育を副専攻として大学・大学院卒 |
| TRAINING_420H | 420時間養成講座 | 通常3〜6ヶ月で修了 |
| CERTIFICATION_EXAM | 検定合格 | 日本語教育能力検定試験 |
| REGISTERED_TEACHER | 登録日本語教師 | 国家資格（移行中） |
