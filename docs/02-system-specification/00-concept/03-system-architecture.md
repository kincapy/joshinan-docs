---
title: システム構成
---

# システム構成

## 概要

常南国際学院の業務管理システム。日本語学校の事務業務を「人間は入力だけ、あとはシステムが完結」する世界観で構築している。

- **ドキュメントサイト** — VitePress による業務ナレッジ・システム仕様・タスク管理
- **業務アプリ** — Next.js による業務管理 Web アプリケーション
- **チャットボット** — Claude API を用いた対話型業務支援（DB 照会・データ変更）
- **プロジェクト機能** — スキル（業務テンプレート）ベースのワークフロー管理

## リポジトリ構成（モノレポ）

```
joshinan-docs/
├── docs/                        # VitePress ドキュメント
│   ├── 01-domain-knowledge/     #   業務ナレッジ（14カテゴリ）
│   ├── 02-system-specification/ #   システム仕様
│   ├── 03-tasks/                #   タスク管理
│   └── .vitepress/config.ts     #   サイドバー・ナビゲーション設定
├── apps/web/                    # Next.js 業務アプリ
│   ├── app/                     #   App Router（API Routes + Pages）
│   ├── lib/                     #   ビジネスロジック
│   ├── components/              #   UI コンポーネント
│   └── middleware.ts            #   Supabase Auth ミドルウェア
├── packages/database/           # Prisma スキーマ・DB 層
│   └── prisma/schema/           #   分割 Prisma スキーマ（16ファイル）
├── packages/domain/             # ドメイン層
│   └── src/value-object/        #   Value Object（Enum 定義、56ファイル）
└── scripts/                     # ユーティリティ（Playwright クローラー等）
```

パッケージマネージャは **pnpm**（ワークスペース構成）。

## 技術スタック

### ドキュメントサイト（joshinan-docs.vercel.app）

| 項目 | 技術 |
|---|---|
| フレームワーク | VitePress 1.6 |
| ホスティング | Vercel |
| 役割 | 業務ナレッジの閲覧サイト + チャットボットのナレッジソース |

### 業務アプリ（joshinan-app.vercel.app）

| 項目 | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui（Radix UI） |
| ORM | Prisma（PostgreSQL） |
| 認証 | Supabase Auth（@supabase/ssr） |
| AI | Anthropic Claude API（@anthropic-ai/sdk） |
| バリデーション | Zod |
| テスト | Vitest |
| ホスティング | Vercel |
| DB | Supabase（PostgreSQL） |

### デプロイ構成

Vercel 上に 2 つのプロジェクトが存在する。

| Vercel プロジェクト | 用途 | Root Directory |
|---|---|---|
| joshinan-docs | VitePress ドキュメント | （ルート） |
| joshinan-app | Next.js 業務アプリ | `apps/web` |

## 認証・認可

### 認証フロー

1. ユーザーは `/login` でメールアドレス + パスワードでログイン（Supabase Auth）
2. `middleware.ts` が全リクエストをインターセプトし、未認証ユーザーを `/login` にリダイレクト
3. `/api/health` のみ認証不要

### 権限体系（UserRole）

| ロール | 権限 |
|---|---|
| GENERAL | ナレッジ回答・データ照会のみ |
| ADMIN | データ変更・ナレッジ更新申請が可能 |
| APPROVER | 承認/却下の権限を持つ |

Staff テーブルの `userRole` フィールドで管理。チャットボット・プロジェクト機能で共通。

## データベース設計

### スキーマ分割構成

Prisma スキーマは業務カテゴリごとに分割されている（`packages/database/prisma/schema/`）。

| ファイル | 業務カテゴリ | 主要モデル |
|---|---|---|
| `school.prisma` | 学校基本情報 | School, EnrollmentPeriod |
| `student.prisma` | 学生管理 | Student, StudentEmployment, InterviewRecord, StudentCertification |
| `curriculum.prisma` | カリキュラム・時間割 | Subject, Period, TimetableSlot |
| `class.prisma` | クラス編成 | Class, ClassEnrollment |
| `attendance.prisma` | 出席管理 | AttendanceRecord, MonthlyAttendanceRate, SemiannualAttendanceReport |
| `tuition.prisma` | 学費管理 | BillingItem, Invoice, Payment, MonthlyBalance |
| `agent.prisma` | エージェント管理 | Agent, AgentAlias, AgentInvoice, AgentPayment |
| `facility.prisma` | 施設・備品管理 | Dormitory, DormitoryAssignment, DormitoryUtility, WifiDevice |
| `staff.prisma` | 教職員管理 | Staff, TeacherQualification |
| `immigration.prisma` | 入管報告・届出 | ImmigrationTask, ImmigrationDocument, ScheduledReport |
| `document.prisma` | 社内文書 | DocumentTemplate, GeneratedDocument |
| `recruitment.prisma` | 募集業務 | RecruitmentCycle, ApplicationCase, ApplicationDocument, DocumentCheckResult |
| `skilled-worker.prisma` | 特定技能・職業紹介 | Company, SswCase, CaseDocument, SupportPlan, SswInvoice |
| `chatbot.prisma` | チャットボット | ChatSession, ChatMessage, AuditLog, ApprovalRequest |
| `project.prisma` | プロジェクト機能 | Skill, SkillTaskTemplate, SkillConditionRule, Project, ProjectTask, ProjectMember |

### 中核エンティティ

**Student（学生）** が最も多くのリレーションを持つ中核エンティティ。

```
Student ─┬─ ClassEnrollment（クラス在籍）
         ├─ AttendanceRecord（出欠記録）
         ├─ MonthlyAttendanceRate（月次出席率）
         ├─ Invoice / Payment（学費請求・入金）
         ├─ DormitoryAssignment（入寮履歴）
         ├─ InterviewRecord（面談記録）
         ├─ StudentEmployment（勤務先情報）
         ├─ StudentCertification（資格証）
         ├─ ApplicationCase（募集申請ケース）
         ├─ SswCase（特定技能案件）
         ├─ SupportPlan（支援計画）
         └─ ImmigrationTask（入管タスク）
```

**Staff（教職員）** は全テーブルの `createdById` / `updatedById` の監査フィールドを通じて参照される。

### 共通設計パターン

- **UUID 主キー**: `gen_random_uuid()` で自動生成
- **監査フィールド**: 全テーブルに `createdById`, `updatedById`, `createdAt`, `updatedAt`
- **論理削除**: `isActive` フラグ（物理削除ではなく無効化）
- **年月表現**: `month` フィールドは `YYYY-MM` 文字列形式

## API 設計

### API ルート一覧

Next.js App Router の Route Handlers（`apps/web/app/api/`）で実装。

| パス | 対象 |
|---|---|
| `/api/students` | 学生 CRUD |
| `/api/students/[id]/interviews` | 面談記録 |
| `/api/classes` | クラス CRUD |
| `/api/classes/[id]/enrollments` | クラス在籍 |
| `/api/subjects` | 科目 CRUD |
| `/api/periods` | 時限マスタ |
| `/api/timetable-slots` | 時間割枠 |
| `/api/attendance/records` | 出欠記録 |
| `/api/attendance/monthly` | 月次出席率 |
| `/api/attendance/reports` | 半期出席率報告 |
| `/api/billing-items` | 品目マスタ |
| `/api/invoices` | 学費請求 |
| `/api/payments` | 入金 |
| `/api/agents` | エージェント CRUD |
| `/api/agents/[id]/invoices` | エージェント請求 |
| `/api/agents/[id]/payments` | エージェント支払 |
| `/api/agents/[id]/aliases` | エージェント別名 |
| `/api/facilities/dormitories` | 寮 CRUD |
| `/api/facilities/dormitories/[id]/assignments` | 入寮管理 |
| `/api/facilities/utilities` | 水光熱費 |
| `/api/facilities/wifi` | WiFi デバイス |
| `/api/staff` | 教職員 CRUD |
| `/api/staff/[id]/qualifications` | 教員資格 |
| `/api/schools` | 学校情報 CRUD |
| `/api/schools/[id]/enrollment-periods` | 入学時期 |
| `/api/immigration/tasks` | 入管タスク |
| `/api/documents/templates` | 文書テンプレート |
| `/api/documents/generated` | 生成済み文書 |
| `/api/templates/[docCode]` | テンプレート取得 |
| `/api/recruitment/cycles` | 募集期 |
| `/api/recruitment/cases` | 申請ケース |
| `/api/ssw/companies` | 受入れ企業 CRUD |
| `/api/ssw/cases` | 特定技能案件 |
| `/api/ssw/invoices` | 特定技能請求 |
| `/api/ssw/support-plans` | 支援計画 |
| `/api/chat/sessions` | チャットセッション |
| `/api/chat/sessions/[id]/messages` | チャットメッセージ |
| `/api/chat/approvals` | 決裁申請 |
| `/api/projects` | プロジェクト CRUD |
| `/api/projects/skills` | スキル定義 |
| `/api/projects/[id]/tasks` | プロジェクトタスク |
| `/api/projects/[id]/members` | プロジェクトメンバー |
| `/api/projects/[id]/generate-documents` | 書類生成 |
| `/api/projects/[id]/bulk-upload` | 一括アップロード |
| `/api/auth/signout` | ログアウト |
| `/api/health` | ヘルスチェック |

## 画面構成

### ページルーティング

認証済みページは `app/(auth)/` 配下に配置。

| パス | 画面 |
|---|---|
| `/dashboard` | ダッシュボード |
| `/students` | 学生一覧 |
| `/students/new` | 学生新規登録 |
| `/students/[id]` | 学生詳細（タブ: 基本情報, 在留情報, 入学情報, 就職情報, 進路, 勤務先, 面談） |
| `/classes` | クラス一覧 |
| `/classes/[id]` | クラス詳細 |
| `/classes/[id]/assign` | クラス配属 |
| `/curriculum/subjects` | 科目一覧 |
| `/curriculum/timetable` | 時間割 |
| `/attendance/students/[id]` | 学生別出席状況 |
| `/attendance/reports` | 出席率報告 |
| `/tuition` | 学費管理トップ |
| `/tuition/invoices/new` | 請求新規作成 |
| `/tuition/payments/new` | 入金登録 |
| `/tuition/balances` | 残高一覧 |
| `/tuition/reports` | 学費レポート |
| `/agents` | エージェント一覧 |
| `/agents/[id]` | エージェント詳細（タブ: 基本情報, 学生, 請求, 入金） |
| `/facilities/dormitories` | 寮一覧 |
| `/facilities/dormitories/[id]` | 寮詳細 |
| `/facilities/utilities/input` | 水光熱費入力 |
| `/facilities/wifi` | WiFi デバイス |
| `/staff` | 教職員一覧 |
| `/staff/[id]` | 教職員詳細（タブ: 基本情報, 資格） |
| `/settings/school` | 学校設定 |
| `/settings/periods` | 時限設定 |
| `/settings/enrollment-periods` | 入学時期設定 |
| `/immigration` | 入管業務トップ |
| `/immigration/tasks` | 入管タスク一覧 |
| `/immigration/visa-renewals` | ビザ更新 |
| `/immigration/reports` | 定期報告 |
| `/documents` | 文書管理トップ |
| `/documents/new` | テンプレート新規作成 |
| `/documents/[templateId]/generate` | 文書生成 |
| `/documents/history` | 生成履歴 |
| `/recruitment` | 募集業務トップ |
| `/recruitment/cycles` | 募集期一覧 |
| `/recruitment/cases/[id]` | 申請ケース詳細 |
| `/ssw/companies` | 受入れ企業一覧 |
| `/ssw/companies/[id]` | 企業詳細 |
| `/ssw/cases` | 特定技能案件一覧 |
| `/ssw/cases/[id]` | 案件詳細 |
| `/ssw/invoices` | 特定技能請求一覧 |
| `/ssw/support-plans` | 支援計画一覧 |
| `/chat` | チャットボット |
| `/chat/approvals` | 決裁一覧 |
| `/projects` | プロジェクト一覧 |
| `/projects/new` | プロジェクト新規作成 |
| `/projects/skills` | スキル一覧 |
| `/projects/[id]` | プロジェクト詳細 |
| `/projects/[id]/bulk-upload` | 一括アップロード |

## チャットボット機能

### アーキテクチャ

```
ユーザー → ChatUI → /api/chat/sessions/[id]/messages
                          ↓
                    Claude API（Tool Use）
                          ↓
                    ┌─────────────────┐
                    │ Tools（関数群）   │
                    │ ├ student-query  │  ← 学生データ照会
                    │ ├ attendance-query│  ← 出席データ照会
                    │ └ tuition-query  │  ← 学費データ照会
                    └─────────────────┘
                          ↓
                    Prisma → Supabase DB
```

- `lib/chat/claude-client.ts` — Claude API クライアント
- `lib/chat/system-prompt.ts` — システムプロンプト（業務コンテキスト付与）
- `lib/chat/tools/` — Tool Use の関数定義（学生・出席・学費の照会）

### 決裁フロー

データ変更操作は権限に応じて決裁フローを経由する。

1. ADMIN ユーザーがチャットでデータ変更を指示
2. システムが `ApprovalRequest` を作成（PENDING）
3. APPROVER が `/chat/approvals` で承認/却下
4. 承認後にデータ変更を実行、`AuditLog` に記録

## プロジェクト機能

### 設計思想

業務パターンを「スキル」としてテンプレート化し、インスタンスとして「プロジェクト」を生成。

```
Skill（テンプレート）
├── SkillTaskTemplate（タスク雛形 N件）
├── SkillConditionRule（条件分岐ルール）
│
└── Project（インスタンス）
    ├── ProjectTask（タスク。テンプレートから生成）
    ├── ProjectMember（参加者 + 権限）
    └── ProjectTaskStatusLog（ステータス変更履歴）
```

### 条件分岐

タスクの必要/不要を動的に判定する仕組み。

例: 特定技能申請スキルで、`nationality = "ベトナム"` の場合に特定の書類が不要になる。

- `SkillConditionRule` でルールを定義
- `lib/project/condition-evaluator.ts` でプロジェクトの `contextData` に対して評価

## ドメイン層（packages/domain）

ドメイン固有の値を Value Object（Enum）として定義。Prisma の Enum と対応。

主な Value Object:

| カテゴリ | Value Object |
|---|---|
| 学生 | StudentStatus, PreEnrollmentStatus, Gender, Cohort, CareerPath |
| 出席 | AttendanceStatus, AttendanceAlertLevel, AttendanceTerm |
| 学費 | InvoiceStatus, PaymentMethod |
| 教職員 | StaffRole, EmploymentType, PayType, QualificationType |
| クラス | CefrLevel, EnrollmentType |
| カリキュラム | JlptLevel, SubjectCategory, TimeSlot, DayOfWeek, Term |
| エージェント | AgentType, AgentInvoiceStatus |
| 施設 | AssignmentStatus |
| 入管 | ImmigrationTaskType, TaskTrigger, TaskStatus, ImmigrationCollectionStatus |
| 文書 | OutputFormat |
| 募集 | ApplicationStatus, RecruitmentDocumentType, RecruitmentCollectionStatus |
| 特定技能 | SswField, CaseStatus, DocumentStatus, SupportPlanStatus |
| チャット | UserRole, MessageRole, AuditAction, ApprovalType, ApprovalStatus |
| プロジェクト | ProjectStatus, ProjectTaskStatus, ProjectRole, TaskCategory, TaskActionType |

## ビジネスロジック層（apps/web/lib）

| モジュール | 役割 |
|---|---|
| `lib/prisma.ts` | Prisma Client シングルトン |
| `lib/utils.ts` | ユーティリティ関数 |
| `lib/supabase/client.ts` | Supabase クライアント（ブラウザ側） |
| `lib/supabase/server.ts` | Supabase クライアント（サーバー側） |
| `lib/chat/` | チャットボット関連（Claude API、ツール定義、システムプロンプト） |
| `lib/project/` | プロジェクト機能（条件評価、文書解析、進捗計算） |
| `lib/document-generator/` | 文書生成（Excel テンプレート → データ差し込み） |
| `lib/excel/` | Excel パーサー（企業アンケート Excel の取り込み） |

## 業務カテゴリ（ドメインナレッジ）

`docs/01-domain-knowledge/` に 14 カテゴリの業務知識を整備。

| # | カテゴリ | 概要 |
|---|---|---|
| 01 | 学校基本情報 | 学校の法人情報、適正校分類、入学時期 |
| 02 | 学生管理 | 学生のライフサイクル（入学前〜卒業・退学） |
| 03 | カリキュラム・時間割 | 科目、時限、時間割の管理 |
| 04 | クラス編成 | クラスの作成と学生の配属 |
| 05 | 出席管理 | 日次出欠、月次出席率、入管報告 |
| 06 | 学費管理 | 請求・入金・消込・残高管理 |
| 07 | エージェント管理 | 海外送出機関の管理と手数料 |
| 08 | 施設・備品管理 | 学生寮、水光熱費、WiFi デバイス |
| 09 | 教職員管理 | スタッフの雇用形態、資格、給与 |
| 10 | 成績管理 | 試験結果、JLPT レベル |
| 11 | 入管報告・届出 | 入管への各種届出・報告のタスク管理 |
| 12 | 社内文書 | テンプレートからの文書自動生成 |
| 13 | 進路・就職 | 卒業後の進路管理 |
| 14 | 募集業務 | 新入生の募集〜COE 申請〜入国 |
| 15 | 特定技能・職業紹介 | 特定技能の在留資格変更、企業マッチング、支援 |
| 16 | チャットボット | AI チャットによる業務支援 |
| 17 | 要報告事態 | トラブル発生時の対応フロー |
| 18 | プロジェクト機能 | スキルベースのワークフロー管理 |
