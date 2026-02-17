---
title: エンティティ定義
---

# 学費管理 エンティティ定義

## BillingItem / 品目マスタ

請求に使用する品目の定義。学費・寮費・入学金など。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 品目名 | name | String | - | - | o | |
| 単価（税込） | unitPrice | Decimal | - | o | - | 「その他」品目は任意金額のため nullable |
| 表示順 | displayOrder | Int | 0 | - | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- BillingItem → Invoice: この品目で作成された請求 (1:N)

---

## Invoice / 請求

学生ごと・月ごとの請求レコード。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 品目ID | billingItemId | UUID | - | - | - | FK → BillingItem |
| 対象年月 | billingMonth | String | - | - | - | `YYYY-MM` 形式 |
| 金額 | amount | Decimal | - | - | - | |
| ステータス | status | Enum(InvoiceStatus) | ISSUED | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- Invoice → Student: 請求対象の学生 (N:1)
- Invoice → BillingItem: 請求品目 (N:1)
- Invoice → Payment: この請求への入金 (1:N)

### 複合ユニーク制約

- (studentId, billingItemId, billingMonth) — 同一学生・同一品目・同一年月で重複請求を防止

### ビジネスルール

- 売上として計上されるのは status が SETTLED の請求のみ
- 3月・8月は学費の請求を生成しない（寮費のみ）。この月別ルールはアプリケーションロジックで制御する（入学時期ごとの請求パターンは `02-data.md` の「月別請求テーブル」を参照）

---

## Payment / 入金

請求に対する入金レコード。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 入金日 | paymentDate | Date | - | - | - | |
| 金額 | amount | Decimal | - | - | - | |
| 入金方法 | method | Enum(PaymentMethod) | - | - | - | |
| 消込対象請求ID | invoiceId | UUID | - | o | - | FK → Invoice。消込済みの場合に設定 |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- Payment → Student: 入金した学生 (N:1)
- Payment → Invoice: 消込対象の請求 (N:1)

### 設計メモ: 入金消込

現在の設計では Payment.invoiceId は単一FKであり、1入金=1請求の消込を表現する。入金額が複数の請求を消込する場合は、アプリケーション側で古い請求から順に消込処理を行い、完全にカバーした請求のステータスを SETTLED に更新する。Payment レコード自体は最後に消込された Invoice に紐づく。将来的に中間テーブル（PaymentAllocation）での多対多管理が必要になった場合は拡張する。

---

## MonthlyBalance / 月次残高

学生ごとの月末時点の残高スナップショット。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 対象年月 | month | String | - | - | - | `YYYY-MM` 形式 |
| 前月末残高 | previousBalance | Decimal | 0 | - | - | |
| 当月請求額 | monthlyCharge | Decimal | 0 | - | - | |
| 当月入金額 | monthlyPayment | Decimal | 0 | - | - | |
| 当月末残高 | balance | Decimal | 0 | - | - | 自動算出 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- MonthlyBalance → Student: 対象学生 (N:1)

### ビジネスルール

- `balance = previousBalance + monthlyCharge - monthlyPayment`
- マイナス残高（過払い）も許容する
- 初期値（入学時）は入学金・教材費などの初回請求額の合計

### 複合ユニーク制約

- (studentId, month) のペアで一意

---

## Enum 定義

### InvoiceStatus / 請求ステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| ISSUED | 請求書発行 | 請求レコード作成時の初期状態 |
| SETTLED | 完了 | 入金消込が完了した状態。売上計上対象 |

### PaymentMethod / 入金方法

| 値 | 表示名 |
|----|--------|
| CASH | 現金 |
| BANK_TRANSFER | 銀行振込 |
