---
title: エンティティ定義
---

# 学校基本情報 エンティティ定義

## School / 学校

学校の基本情報を管理するマスタエンティティ。基本的に1レコードのみだが、将来の多校展開を見据えた設計。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学校名 | name | String | - | - | o | |
| 学校番号 | schoolCode | String | - | - | o | 3桁。入管から配布された番号 |
| 所在地 | address | String | - | - | - | |
| 電話番号 | phone | String | - | o | - | |
| 運営法人名 | corporateName | String | - | - | - | |
| 法人種別 | corporateType | Enum(CorporateType) | - | - | - | |
| 適正校分類 | accreditationClass | Enum(AccreditationClass) | - | - | - | 毎年の判定で更新される |
| 告示番号 | notificationNumber | String | - | o | - | 認定日本語教育機関への移行後は認定番号 |
| 定員数 | capacity | Int | - | - | - | 入管に届け出た収容定員 |
| 設立年月日 | establishedDate | Date | - | - | - | |
| 有効フラグ | isActive | Boolean | true | - | - | 論理削除用 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- School → EnrollmentPeriod: 入学時期マスタ (1:N)

### ビジネスルール

- 学校番号（schoolCode）は入管から配布された3桁の番号で、ビザ申請書類に記載される。変更されることは基本的にない
- 適正校分類（accreditationClass）は毎年の問題在籍率に基づき判定される。変更時は履歴を残すことを推奨
- 定員数（capacity）の変更は入管への届出が必要。クラスI（在籍管理優良校）のみ定員増が可能

---

## EnrollmentPeriod / 入学時期

年度ごとの入学時期と募集定員を管理するエンティティ。入学月×年度の組み合わせで管理する。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学校ID | schoolId | UUID | - | - | - | FK → School |
| 入学月 | enrollmentMonth | Enum(EnrollmentMonth) | - | - | - | |
| 在籍期間（月数） | durationMonths | Int | - | - | - | 正の整数。入学月により決定 |
| 年度 | fiscalYear | Int | - | - | - | 西暦 |
| 募集定員 | recruitmentCapacity | Int | - | - | - | 正の整数 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |
| 作成者ID | createdById | UUID | - | o | - | FK → Staff |
| 更新者ID | updatedById | UUID | - | o | - | FK → Staff |

### リレーション

- EnrollmentPeriod → School: 所属学校 (N:1)

### 複合ユニーク制約

- (schoolId, enrollmentMonth, fiscalYear) のペアで一意

### ビジネスルール

- 入学月と在籍期間の対応: 4月=24ヶ月、10月=18ヶ月、1月=15ヶ月、7月=21ヶ月
- 募集定員は「空き定員 × 想定交付率」を考慮して設定する
- 入管制度上、申請可能数は欠員数の1.2倍までの制限がある

---

## Enum 定義

### CorporateType / 法人種別

| 値 | 表示名 |
|----|--------|
| SCHOOL_CORPORATION | 学校法人 |
| STOCK_COMPANY | 株式会社 |
| OTHER | その他 |

### AccreditationClass / 適正校分類

| 値 | 表示名 | 備考 |
|----|--------|------|
| CLASS_I | クラスI（在籍管理優良校） | 3年連続で問題在籍率1%以下。書類大幅簡素化、定員増可能 |
| CLASS_II | クラスII（適正校） | 問題在籍率5%以下。書類簡素化 |
| NON_ACCREDITED | 非適正校 | 問題在籍率5%超、または新規校。審査厳格化 |

### EnrollmentMonth / 入学月

| 値 | 表示名 | 在籍期間 |
|----|--------|---------|
| APRIL | 4月 | 24ヶ月 |
| OCTOBER | 10月 | 18ヶ月 |
| JANUARY | 1月 | 15ヶ月 |
| JULY | 7月 | 21ヶ月 |

---

::: info 費用項目マスタについて
業務ナレッジ（02-data.md）で言及されている費用項目マスタ（FeeItem）は、06-tuition（学費管理）カテゴリの BillingItem エンティティとして定義している。
:::
