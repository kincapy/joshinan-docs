---
title: エンティティ定義
---

# クラス編成 エンティティ定義

## Class / クラス

午前・午後の時間帯で運営されるクラスを管理するエンティティ。JLPTレベル・CEFRレベルによる分類と、サブクラス（補習・特別授業用）の識別を含む。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| クラス名 | name | String | - | - | - | |
| 印刷用名称 | printName | String | - | o | - | 証明書等に印刷される名称 |
| JLPTレベル | jlptLevel | Enum(JlptLevel) | - | o | - | |
| CEFRレベル | cefrLevel | Enum(CefrLevel) | - | o | - | |
| 時間帯区分 | timeSlot | Enum(TimeSlot) | - | - | - | 午前 / 午後 |
| サブクラスフラグ | isSubClass | Boolean | false | - | - | true の場合、一時的なクラス |
| 最大人数 | maxStudents | Int | 20 | - | - | 告示基準に基づく上限 |
| 年度 | fiscalYear | Int | - | - | - | 西暦4桁 |
| 開始日 | startDate | Date | - | - | - | クラスの開講日 |
| 終了日 | endDate | Date | - | - | - | クラスの終了日 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### リレーション

- Class → ClassEnrollment: クラスに所属する学生 (1:N)
- Class → TimetableSlot: クラスの時間割 (1:N)

### ビジネスルール

- 1クラスの最大人数は告示基準の20名
- startDate < endDate であること
- サブクラス（isSubClass = true）は補習・特別授業用。通常クラスとは別にフィルタ可能

---

## ClassEnrollment / クラス在籍

学生のクラスへの所属を管理するエンティティ。通常クラスとサブクラスの2種類の在籍タイプがあり、学生は両方を同時に持てる。

| プロパティ | 英語名 | 型 | デフォルト | nullable | unique | 制約・バリデーション |
|-----------|--------|-----|-----------|----------|--------|---------------------|
| ID | id | UUID | auto | - | o | PK |
| 学生ID | studentId | UUID | - | - | - | FK → Student |
| クラスID | classId | UUID | - | - | - | FK → Class |
| 在籍タイプ | enrollmentType | Enum(EnrollmentType) | REGULAR | - | - | 通常 / サブクラス |
| 在籍開始日 | startDate | Date | - | - | - | |
| 在籍終了日 | endDate | Date | - | o | - | null = 在籍中 |
| 作成日時 | createdAt | DateTime | auto | - | - | |
| 更新日時 | updatedAt | DateTime | auto | - | - | |

### unique 制約

- `[studentId, classId, enrollmentType]` — 同一学生が同一クラスに同じ在籍タイプで重複在籍しない

### リレーション

- ClassEnrollment → Student: 所属学生 (N:1)
- ClassEnrollment → Class: 所属クラス (N:1)

### ビジネスルール

- 通常（REGULAR）の在籍は1学生あたり同時に1つ（同時期に複数クラスの通常在籍は不可）
- サブクラス（SUB_CLASS）は通常在籍と並行して持てる
- endDate が null の場合は「在籍中」を意味する

---

## Enum 定義

### JlptLevel / JLPTレベル

| 値 | 表示名 | 備考 |
|----|--------|------|
| N1 | N1 | 最上級 |
| N2 | N2 | 上級 |
| N3 | N3 | 中級 |
| N4 | N4 | 初中級 |
| N5 | N5 | 初級 |

### CefrLevel / CEFRレベル

| 値 | 表示名 | JLPT対応（目安） |
|----|--------|----------------|
| A1 | A1 | N5 |
| A2 | A2 | N4 |
| B1 | B1 | N3 |
| B2 | B2 | N2 |
| C1 | C1 | N1 |
| C2 | C2 | 母語話者レベル |

### TimeSlot / 時間帯区分

| 値 | 表示名 |
|----|--------|
| MORNING | 午前 |
| AFTERNOON | 午後 |

### EnrollmentType / 在籍タイプ

| 値 | 表示名 | 備考 |
|----|--------|------|
| REGULAR | 通常 | 正規のクラス所属 |
| SUB_CLASS | サブクラス | 補習・特別授業への一時的な所属 |
