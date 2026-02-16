---
title: エンティティ定義
---

# 学生管理 エンティティ定義

## Student / 学生

学生管理の中核エンティティ。入学から卒業までのライフサイクルを通じて管理される。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学籍番号 | studentNumber | String | - | - | o | 7桁。`入学年(2桁) + コホート(2桁) + 連番(3桁)` |
| 氏名（漢字） | nameKanji | String | - | o | - | 漢字圏以外は null |
| 氏名（カナ） | nameKana | String | - | o | - | |
| 氏名（英語） | nameEn | String | - | - | - | パスポート記載名 |
| 生年月日 | dateOfBirth | Date | - | - | - | |
| 性別 | gender | Enum(Gender) | - | - | - | |
| 国籍 | nationality | String | - | - | - | |
| ステータス | status | Enum(StudentStatus) | PRE_ENROLLMENT | - | - | 下記 Enum 参照 |
| 入学前詳細ステータス | preEnrollmentStatus | Enum(PreEnrollmentStatus) | - | o | - | ステータスが PRE_ENROLLMENT の場合のみ |
| 入学年月日 | enrollmentDate | Date | - | o | - | |
| 卒業予定日 | expectedGraduationDate | Date | - | o | - | コホートから自動算出 |
| コホート | cohort | Enum(Cohort) | - | - | - | 4月/7月/10月/1月 |
| クラス | classId | UUID | - | o | - | FK → Class |
| 電話番号 | phone | String | - | o | - | |
| メールアドレス | email | String | - | o | - | |
| 日本の住所 | addressJapan | String | - | o | - | |
| 母国の住所 | addressHome | String | - | o | - | |
| 緊急連絡先（氏名） | emergencyContactName | String | - | o | - | 母国の家族 |
| 緊急連絡先（電話番号） | emergencyContactPhone | String | - | o | - | |
| パスポート番号 | passportNumber | String | - | o | - | |
| 在留カード番号 | residenceCardNumber | String | - | o | - | |
| 在留資格 | residenceStatus | String | - | o | - | 「留学」が基本 |
| 在留期限 | residenceExpiry | Date | - | o | - | ビザ更新アラートのトリガー |
| 入国日 | entryDate | Date | - | o | - | |
| 入国空港 | entryAirport | String | - | o | - | |
| 便名 | flightNumber | String | - | o | - | |
| 出迎え担当 | pickupStaffId | UUID | - | o | - | FK → Staff |
| 資格外活動許可 | workPermitStatus | Boolean | false | - | - | |
| 資格外活動許可日 | workPermitDate | Date | - | o | - | |
| 資格外活動許可期限 | workPermitExpiry | Date | - | o | - | |
| 国民健康保険番号 | healthInsuranceNumber | String | - | o | - | |
| 健康保険加入日 | healthInsuranceDate | Date | - | o | - | |
| エージェント | agentId | UUID | - | o | - | FK → Agent。上書き禁止 |
| 進路区分 | careerPath | Enum(CareerPath) | - | o | - | 在学中から段階的に入力 |
| 進路先名 | careerDestination | String | - | o | - | |
| 進路合否 | careerResult | Enum(CareerResult) | - | o | - | |
| 退学日 | withdrawalDate | Date | - | o | - | 上書き禁止。入管報告との整合性 |
| 退学理由 | withdrawalReason | String | - | o | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- Student → Agent: どのエージェント経由の学生か (N:1)
- Student → Class: 所属クラス (N:1)
- Student → Staff: 出迎え担当 (N:1)
- Student → StudentEmployment: 勤務先情報 (1:N、最大3件)
- Student → InterviewRecord: 面談記録 (1:N)

### 保護ルール

| プロパティ | ルール | 理由 |
|-----------|--------|------|
| withdrawalDate | 上書き禁止 | 入管報告との整合性を保つため |
| agentId | 上書き禁止 | エージェントマスターとの整合性を保つため |

---

## StudentEmployment / 学生勤務先

学生のアルバイト先情報。週28時間制限の管理に使用する。1学生あたり最大3件。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 勤務先名 | employerName | String | - | - | - | |
| 電話番号 | phone | String | - | o | - | |
| 勤務時間（週） | weeklyHours | Float | - | o | - | |
| 時給 | hourlyWage | Int | - | o | - | 円 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- StudentEmployment → Student: 所属学生 (N:1)

### ビジネスルール

- 1学生あたり最大3件の勤務先を登録可能
- 全勤務先の weeklyHours 合計が 28時間/週 を超えないことをバリデーション（長期休暇中は別ルール）

---

## InterviewRecord / 面談記録

学生との面談内容を記録する。進路相談・出席指導・生活指導など。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 面談日 | interviewDate | Date | - | - | - | |
| 面談種別 | interviewType | Enum(InterviewType) | - | - | - | |
| 担当者 | staffId | UUID | - | - | - | FK → Staff |
| 内容 | content | String | - | - | - | |
| アクション項目 | actionItems | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- InterviewRecord → Student: 対象学生 (N:1)
- InterviewRecord → Staff: 担当者 (N:1)

---

## Enum 定義

### Gender / 性別

| 値 | 表示名 |
|----|--------|
| MALE | 男性 |
| FEMALE | 女性 |

### StudentStatus / 学生ステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| UNREGISTERED | 未登録 | 初期状態 |
| PRE_ENROLLMENT | 入学前 | COE申請中など。詳細は PreEnrollmentStatus |
| ENROLLED | 在学 | 通常の在籍状態 |
| ON_LEAVE | 休学 | |
| WITHDRAWN | 退学 | |
| EXPELLED | 除籍 | |
| GRADUATED | 卒業 | |
| COMPLETED | 修了 | |

### PreEnrollmentStatus / 入学前詳細ステータス

| 値 | 表示名 |
|----|--------|
| APPLYING | 申請中 |
| AWAITING_ENTRY | 入国待ち |
| NOT_GRANTED | 不交付 |

### Cohort / 入学コホート

| 値 | 表示名 | 在籍期間 |
|----|--------|---------|
| APRIL | 4月生 | 2年間 |
| JULY | 7月生 | 1年9ヶ月 |
| OCTOBER | 10月生 | 1年6ヶ月 |
| JANUARY | 1月生 | 1年3ヶ月 |

### CareerPath / 進路区分

| 値 | 表示名 |
|----|--------|
| FURTHER_EDUCATION | 進学 |
| EMPLOYMENT | 就職 |
| RETURN_HOME | 帰国 |

### CareerResult / 進路合否

| 値 | 表示名 |
|----|--------|
| PENDING | 未定 |
| ACCEPTED | 合格 |
| REJECTED | 不合格 |

### InterviewType / 面談種別

| 値 | 表示名 |
|----|--------|
| CAREER | 進路相談 |
| ATTENDANCE | 出席指導 |
| LIFE_GUIDANCE | 生活指導 |
| OTHER | その他 |
