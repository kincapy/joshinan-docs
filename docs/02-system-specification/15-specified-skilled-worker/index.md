---
title: 特定技能・職業紹介 — システム仕様
---

# 特定技能・職業紹介 — システム仕様

案件管理・企業管理・書類ステータス管理・請求管理のシステム仕様。

## このカテゴリのファイル

- [エンティティ定義](./01-entity.md) — Company / SswCase / CaseDocument / SupportPlan / Invoice
- [UIUX定義](./02-uiux.md) — 画面一覧・遷移・フォーム定義

## 業務ナレッジとの対応

| 業務ナレッジ | システム仕様 |
|-------------|-------------|
| [index.md](/01-domain-knowledge/15-specified-skilled-worker/) — 制度概要・ステークホルダー | 全体設計の前提 |
| [01-work-flow.md](/01-domain-knowledge/15-specified-skilled-worker/01-work-flow) — 業務フロー | [02-uiux.md](./02-uiux.md) — 画面遷移・操作フロー |
| [02-data.md](/01-domain-knowledge/15-specified-skilled-worker/02-data) — データ定義 | [01-entity.md](./01-entity.md) — エンティティ・型・制約 |
| [03-issues.md](/01-domain-knowledge/15-specified-skilled-worker/03-issues) — 課題 | 自動入力・書類管理・請求自動化の設計根拠 |

## 設計方針

### 学生データの共通基盤

特定技能の業務で必要な学生情報（氏名・国籍・パスポート・在留情報等）は、学生管理（02-student-management）の Student エンティティを参照する。特定技能モジュールでは学生データを複製せず、FK で連携する。

### 案件を中心としたモデル

旧設計の JobPosting（求人）→ JobMatch（マッチング）の2段構造を廃止し、**SswCase（案件）** を中心としたモデルに変更。理由：

- 実業務では「この学生をこの企業に」という1対1の案件管理が中心
- 求人情報を独立して管理するニーズが現時点でない
- 書類ステータス・請求は案件に紐づく

### 旧エンティティとの対応

| 旧エンティティ | 新エンティティ | 変更理由 |
|---|---|---|
| JobPosting（求人） | Company（企業）に吸収 | 求人単位ではなく企業単位で管理 |
| JobMatch（マッチング） | SswCase（案件） | 案件のライフサイクル全体を管理 |
| SupportPlan（支援計画） | SupportPlan（継続） | 案件との紐づけを追加 |
| — | CaseDocument（書類） | 書類ステータス管理を新設 |
| — | Invoice（請求） | 請求管理を新設 |
