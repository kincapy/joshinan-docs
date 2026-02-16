---
title: エンティティ定義
---

# 施設・備品管理 エンティティ定義

## Dormitory / 寮（物件）

学生寮の物件マスター情報。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 物件名 | name | String | - | - | o | 正規化後の名称 |
| 住所 | address | String | - | - | - | |
| 家賃 | rent | Decimal | - | - | - | 月額（円） |
| ガス契約先 | gasProvider | String | - | o | - | |
| ガス契約番号 | gasContractNumber | String | - | o | - | |
| 水道契約先 | waterProvider | String | - | o | - | |
| 水道契約番号 | waterContractNumber | String | - | o | - | |
| 電気契約先 | electricityProvider | String | - | o | - | |
| 電気契約番号 | electricityContractNumber | String | - | o | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- Dormitory → DormitoryAssignment: この寮に入居した学生の履歴 (1:N)
- Dormitory → DormitoryUtility: この寮の月次水光熱費 (1:N)

---

## DormitoryAssignment / 入寮履歴

学生と寮の紐付け。入退寮の履歴管理。ステータスにより入居中の学生を即座に集計可能（寮費請求の対象判定に使用）。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| 寮ID | dormitoryId | UUID | - | - | - | FK → Dormitory |
| ステータス | status | Enum(AssignmentStatus) | ACTIVE | - | - | |
| 入寮日 | moveInDate | Date | - | - | - | |
| 退寮日 | moveOutDate | Date | - | o | - | null = 未退寮 |
| 作成日時 | createdAt | DateTime | auto | - | - | |

### リレーション

- DormitoryAssignment → Student: 入居学生 (N:1)
- DormitoryAssignment → Dormitory: 入居先 (N:1)

### ビジネスルール

- 入寮: status = ACTIVE, moveOutDate = null で作成
- 退寮: status を ENDED に変更し、moveOutDate を設定
- 寮の移動（A→B）: 旧レコードを ENDED + moveOutDate 設定、新レコードを ACTIVE で作成
- 寮費請求の対象判定: `status = ACTIVE` の学生が寮費請求対象

---

## DormitoryUtility / 寮水光熱費

物件ごとの月次水光熱費レコード。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 寮ID | dormitoryId | UUID | - | - | - | FK → Dormitory |
| 対象年月 | month | String | - | - | - | `YYYY-MM` 形式 |
| 電気代 | electricity | Decimal | 0 | - | - | 円 |
| ガス代 | gas | Decimal | 0 | - | - | 円 |
| 水道代 | water | Decimal | 0 | - | - | 円 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- DormitoryUtility → Dormitory: 対象物件 (N:1)

### 複合ユニーク制約

- (dormitoryId, month) のペアで一意

---

## Enum 定義

### AssignmentStatus / 入寮ステータス

| 値 | 表示名 | 備考 |
|----|--------|------|
| ACTIVE | 入居中 | 寮費請求対象 |
| ENDED | 退寮済み | 履歴として保持 |

---

## WifiDevice / WiFiデバイス

WiFiデバイスの配置・契約管理。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| IMEI | imei | String | - | - | o | デバイスの一意識別子 |
| 配置場所 | location | String | - | - | - | |
| 契約番号 | contractNumber | String | - | o | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 備考 | notes | String | - | o | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
