---
title: エンティティ定義
---

# カリキュラム・時間割 エンティティ定義

::: info コース（在籍期間区分）について
入管届出上の「コース」は Student.cohort（4月生=2年、7月生=1年9ヶ月、10月生=1.5年、1月生=1年3ヶ月）で管理する。独立した Course エンティティは設けない。入管の定期報告で必要な「コース別出席率」は、Student.cohort で集計する。年間授業時間は法定基準760時間以上（実運用は800時間が一般的）。
:::

## Subject / 科目

授業で扱う個別の教科。時間割のセルに割り当てる単位。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 科目名 | name | String | - | - | - | |
| カテゴリ | category | Enum(SubjectCategory) | - | - | - | |
| 対象レベル | targetLevel | Enum(JlptLevel) | - | o | - | |
| 説明 | description | String | - | o | - | |
| 有効フラグ | isActive | Boolean | true | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- Subject → TimetableSlot: この科目が割り当てられた時間割枠 (1:N)

---

## Period / 時限マスタ

1日の授業時間帯の区切り。午前クラス・午後クラスで時間帯が異なる。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 時限番号 | periodNumber | Int | - | - | o | |
| 開始時刻 | startTime | String | - | - | - | "HH:mm" 形式 |
| 終了時刻 | endTime | String | - | - | - | "HH:mm" 形式 |
| 時間帯区分 | timeSlot | Enum(TimeSlot) | - | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- Period → TimetableSlot: この時限に割り当てられた時間割枠 (1:N)

### ビジネスルール

- 開始時刻 < 終了時刻であること
- 同一時間帯区分内で時限番号は連番であること

---

## TimetableSlot / 時間割枠

クラス × 曜日 × 時限で一意に決まる授業枠。科目と担当教員を割り当てる。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| クラスID | classId | UUID | - | - | - | FK → Class |
| 曜日 | dayOfWeek | Enum(DayOfWeek) | - | - | - | |
| 時限ID | periodId | UUID | - | - | - | FK → Period |
| 科目ID | subjectId | UUID | - | - | - | FK → Subject |
| 担当教員ID | teacherId | UUID | - | o | - | FK → Staff |
| 年度 | fiscalYear | Int | - | - | - | |
| 学期 | term | Enum(Term) | - | - | - | |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### 複合ユニーク制約

`[classId, dayOfWeek, periodId, fiscalYear, term]`

同一クラス・同一曜日・同一時限・同一年度学期の組み合わせは1つだけ存在できる。

### リレーション

- TimetableSlot → Class: 所属クラス (N:1)
- TimetableSlot → Period: 該当時限 (N:1)
- TimetableSlot → Subject: 割当科目 (N:1)
- TimetableSlot → Staff: 担当教員 (N:1)

---

## Enum 定義

### JlptLevel / JLPTレベル

| 値 | 表示名 |
|----|--------|
| N1 | N1 |
| N2 | N2 |
| N3 | N3 |
| N4 | N4 |
| N5 | N5 |

### SubjectCategory / 科目カテゴリ

| 値 | 表示名 |
|----|--------|
| GRAMMAR | 文法 |
| READING | 読解 |
| LISTENING | 聴解 |
| CONVERSATION | 会話 |
| KANJI | 漢字 |
| COMPOSITION | 作文 |
| OTHER | その他 |

### TimeSlot / 時間帯区分

| 値 | 表示名 |
|----|--------|
| MORNING | 午前 |
| AFTERNOON | 午後 |

### DayOfWeek / 曜日

| 値 | 表示名 | 曜日番号（RINGUAL） |
|----|--------|-------------------|
| SUN | 日 | 0 |
| MON | 月 | 1 |
| TUE | 火 | 2 |
| WED | 水 | 3 |
| THU | 木 | 4 |
| FRI | 金 | 5 |
| SAT | 土 | 6 |

### Term / 学期

| 値 | 表示名 |
|----|--------|
| FIRST_HALF | 前期 |
| SECOND_HALF | 後期 |
