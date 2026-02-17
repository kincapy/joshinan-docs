---
title: エンティティ定義
---

# 社内文書 エンティティ定義

## DocumentTemplate / 文書テンプレート

社内文書のテンプレートマスター。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| スラグ | slug | String | - | - | o | テンプレートを識別するスラグ（例: `shukkin-irai`）|
| 文書名 | name | String | - | - | o | |
| 出力形式 | outputFormat | Enum(OutputFormat) | - | - | - | |
| 説明 | description | String | - | o | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- DocumentTemplate → GeneratedDocument: このテンプレートから生成された文書 (1:N)

---

## GeneratedDocument / 生成済み文書

テンプレートから生成された文書の履歴。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| テンプレートID | templateId | UUID | - | - | - | FK → DocumentTemplate |
| 作成者 | createdById | UUID | - | - | - | FK → Staff |
| ファイル名 | fileName | String | - | - | - | ダウンロード時に使用するファイル名 |
| ファイルパス | filePath | String | - | - | - | 生成されたファイルの保存先 |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |

### リレーション

- GeneratedDocument → DocumentTemplate: 元テンプレート (N:1)
- GeneratedDocument → Staff: 作成者 (N:1)

### 設計方針

- **生成済み文書は不変（immutable）**: 一度生成した文書は編集しない。修正が必要な場合は再生成する。そのため `updatedAt` / `updatedById` は持たない。

---

## Enum 定義

### OutputFormat / 出力形式

| 値 | 表示名 |
|----|--------|
| EXCEL | Excel |
| DOCX | Word |
