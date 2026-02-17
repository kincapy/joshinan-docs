---
title: エンティティ定義
---

# エージェント管理 エンティティ定義

## Agent / エージェント

海外送出機関・仲介業者のマスター情報。正規化後の名称で管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| エージェント名（正規化後） | name | String | - | - | o | 正規化ルール適用後の名称 |
| 国 | country | String | - | - | - | |
| 種別 | type | Enum(AgentType) | - | - | - | |
| 紹介手数料（1名あたり） | feePerStudent | Decimal | - | o | - | 円。エージェントにより異なる |
| 連絡先 | contactInfo | String | - | o | - | |
| 備考 | notes | String | - | o | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- Agent → Student: このエージェント経由の学生 (1:N)
- Agent → AgentAlias: このエージェントの別名 (1:N)
- Agent → AgentInvoice: このエージェントへの請求書 (1:N)

---

## AgentAlias / エージェント別名

正規化前のエージェント名（法人名・通称など）を保持する。照合時に使用。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| エージェントID | agentId | UUID | - | - | - | FK → Agent |
| 別名 | aliasName | String | - | - | o | 請求書・契約書に記載される法人名等 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- AgentAlias → Agent: 所属エージェント (N:1)

### ビジネスルール

- 請求書の法人名と照合する際、AgentAlias テーブルを検索して正規化後の Agent に紐付ける

---

## AgentInvoice / エージェント請求書

エージェントからの請求書を管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 請求書番号 | invoiceNumber | String | - | - | o | `INV-XXX` 形式 |
| エージェントID | agentId | UUID | - | - | - | FK → Agent |
| 請求日 | invoiceDate | Date | - | - | - | |
| 金額 | amount | Decimal | - | - | - | |
| ステータス | status | Enum(AgentInvoiceStatus) | UNPAID | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- AgentInvoice → Agent: 請求元エージェント (N:1)
- AgentInvoice → AgentPayment: この請求書への支払い (1:N)

---

## AgentPayment / エージェント支払い

エージェントへの支払い記録。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 支払番号 | paymentNumber | String | - | - | o | `PAY-XXX` 形式 |
| エージェント請求書ID | agentInvoiceId | UUID | - | - | - | FK → AgentInvoice |
| 支払日 | paymentDate | Date | - | - | - | |
| 金額 | amount | Decimal | - | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- AgentPayment → AgentInvoice: 対象請求書 (N:1)

---

## Enum 定義

### AgentType / エージェント種別

| 値 | 表示名 | 備考 |
|----|--------|------|
| SCHOOL_OPERATOR | 自社学校運営 | 学生の顔が見える状態で対応 |
| BROKER | 紹介のみ | 自社学校なし |
| INDIVIDUAL | 個人エージェント | 日本在住の外国人等 |

### AgentInvoiceStatus / エージェント請求書ステータス

| 値 | 表示名 |
|----|--------|
| UNPAID | 未払い |
| PARTIAL | 一部支払い済み |
| PAID | 支払い完了 |
