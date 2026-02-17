---
title: エンティティ定義
---

# 募集業務 エンティティ定義

## RecruitmentCycle / 募集期

入学時期ごとの募集サイクル。年2回（4月・10月）の募集を管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 入学時期 | enrollmentMonth | Enum(EnrollmentMonth) | - | - | - | |
| 年度 | fiscalYear | Int | - | - | - | 西暦4桁 |
| 書類申請締切日 | applicationDeadline | Date | - | - | - | |
| ビザ結果予定日 | visaResultDate | Date | - | o | - | |
| 入国開始日 | entryStartDate | Date | - | o | - | |
| 募集目標人数 | targetCount | Int | - | - | - | 正の整数 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### unique制約

- `[enrollmentMonth, fiscalYear]` — 同一入学時期・年度の募集期は1つのみ

### リレーション

- RecruitmentCycle → ApplicationCase: この募集期の申請ケース (1:N)

### 算出プロパティ

| プロパティ | 算出方法 |
|-----------|---------|
| applicationCount | この募集期の ApplicationCase 数（取下を除く） |
| grantedCount | ステータスが GRANTED の ApplicationCase 数 |
| grantRate | grantedCount / applicationCount（交付率） |

---

## ApplicationCase / 申請ケース

個々の入学候補者に対する在留資格認定証明書（COE）の申請単位。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 募集期ID | recruitmentCycleId | UUID | - | - | - | FK → RecruitmentCycle |
| 候補者氏名 | candidateName | String | - | - | - | パスポート記載名 |
| 国籍 | nationality | String | - | - | - | |
| エージェントID | agentId | UUID | - | o | - | FK → Agent（07-agent-management で定義） |
| 申請番号 | applicationNumber | String | - | o | o | 6桁。入管が付与 |
| 申請ステータス | status | Enum(ApplicationStatus) | PREPARING | - | - | |
| 別表掲載国フラグ | isListedCountry | Boolean | - | - | - | 必要書類の判定に使用 |
| 交付日 | grantedDate | Date | - | o | - | ステータスが GRANTED の場合のみ |
| 不交付理由 | denialReason | String | - | o | - | ステータスが DENIED の場合のみ |
| 学生ID | studentId | UUID | - | o | - | FK → Student（02-student-management で定義）。交付後に学生として登録されたらリンク |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- ApplicationCase → RecruitmentCycle: 所属募集期 (N:1)
- ApplicationCase → Agent: 担当エージェント (N:1)
- ApplicationCase → Student: 交付後にリンクされる学生 (N:1)
- ApplicationCase → ApplicationDocument: この申請の書類 (1:N)

> ※ 02-student-management 側の Student リレーションにも逆参照（Student → ApplicationCase 1:1）を記載すること

### ビジネスルール

- grantedDate は status が GRANTED に変更された時のみ設定可能
- denialReason は status が DENIED の場合のみ設定可能
- studentId は status が GRANTED の場合のみ設定可能（交付後に学生登録してリンク）
- applicationNumber は入管申請後に付与されるため、PREPARING 段階では null

---

## ApplicationDocument / 申請書類

申請ケースに紐づく個別の提出書類。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 申請ケースID | applicationCaseId | UUID | - | - | - | FK → ApplicationCase |
| 書類種別 | documentType | Enum(DocumentType) | - | - | - | |
| 収集状態 | collectionStatus | Enum(CollectionStatus) | NOT_RECEIVED | - | - | |
| ファイルパス | filePath | String | - | o | - | アップロードされたファイルの保存先 |
| 日本語訳有無 | hasJapaneseTranslation | Boolean | false | - | - | 外国語書類には訳文が必要 |
| 備考 | notes | String | - | o | - | 不備内容など |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- ApplicationDocument → ApplicationCase: 所属申請ケース (N:1)
- ApplicationDocument → DocumentCheckResult: この書類のチェック結果 (1:N)

### ビジネスルール

- collectionStatus が VERIFIED に変更されるには、filePath が設定済みであること
- 外国語書類で hasJapaneseTranslation が false の場合、VERIFIED にはできない

---

## DocumentCheckResult / 書類チェック結果

申請書類に対するチェック結果。人手またはAIによるチェックを記録する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 申請書類ID | applicationDocumentId | UUID | - | - | - | FK → ApplicationDocument |
| チェック種別 | checkType | Enum(CheckType) | - | - | - | |
| 結果 | result | Enum(CheckResult) | - | - | - | |
| 指摘事項 | findings | String | - | o | - | NG の場合の具体的な指摘内容 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- DocumentCheckResult → ApplicationDocument: 対象書類 (N:1)

---

## Enum 定義

### EnrollmentMonth / 入学時期

| 値 | 表示名 |
|----|--------|
| APRIL | 4月 |
| OCTOBER | 10月 |

### ApplicationStatus / 申請ステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| PREPARING | 書類準備中 | 初期状態。エージェントから書類を収集中 |
| SUBMITTED | 申請済 | 入管に書類を提出済み |
| GRANTED | 交付 | ビザが交付された |
| DENIED | 不交付 | ビザが交付されなかった |
| WITHDRAWN | 取下 | 申請を取り下げた |

### DocumentType / 書類種別

| 値 | 表示名 | 備考 |
|----|--------|------|
| APPLICATION_FORM | 在留資格認定証明書交付申請書 | 全申請者必須 |
| CHECKLIST | 提出書類一覧表・各種確認書 | 全申請者必須。提出書類一覧表と各種確認書を1つのPDFにまとめてアップロードする運用 |
| PASSPORT_COPY | 旅券写し | 全申請者必須 |
| JAPANESE_ABILITY | 日本語能力資料 | 別表掲載国以外で必要 |
| FINANCIAL_SUPPORT | 経費支弁書 | 別表掲載国以外で必要 |
| RELATIONSHIP_PROOF | 経費支弁者との関係立証資料 | 別表掲載国以外で必要 |
| BANK_BALANCE | 預金残高証明書 | 別表掲載国以外で必要 |
| FUND_FORMATION | 資金形成経緯資料 | 別表掲載国以外で必要 |
| SCHOLARSHIP | 奨学金証明 | 該当者のみ |
| MINOR_SUPPORT | 未成年者の経費支弁に関する補足 | 該当者のみ |
| REASON_STATEMENT | 理由書 | 該当者のみ |
| OTHER | その他 | |

### CollectionStatus / 収集状態

| 値 | 表示名 | 備考 |
|----|--------|------|
| NOT_RECEIVED | 未受領 | まだ書類を受け取っていない |
| RECEIVED | 受領済 | 書類を受け取ったが未確認 |
| VERIFIED | 確認済 | 内容を確認して問題なし |
| DEFICIENT | 不備あり | 確認の結果、不備が見つかった |

### CheckType / チェック種別

| 値 | 表示名 | 備考 |
|----|--------|------|
| COMPLETENESS | 網羅性 | 必要な書類が全て揃っているか |
| TRANSLATION | 訳文有無 | 外国語書類に日本語訳が添付されているか |
| ORDER | 並び順 | 入管提出時の書類の並び順が正しいか |

### CheckResult / チェック結果

| 値 | 表示名 |
|----|--------|
| OK | OK |
| NG | NG |
