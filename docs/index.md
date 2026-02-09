---
layout: home
hero:
  name: 常南国際学院
  text: ドキュメントサイト
  tagline: 業務ナレッジとシステム設計を一元管理
  actions:
    - theme: brand
      text: 業務ナレッジ
      link: /01-domain-knowledge/
    - theme: alt
      text: システム仕様
      link: /02-system-specification/
    - theme: alt
      text: タスク管理
      link: /03-tasks/

features:
  - title: 業務ナレッジ
    details: 日本語教育機関の業界知識、学生管理、学費管理、出席管理、入管報告など14カテゴリの業務知識を体系化
    link: /01-domain-knowledge/
  - title: システム仕様
    details: 設計原則、エンティティ定義、UI/UX仕様など、システム化に必要な技術仕様を整備
    link: /02-system-specification/
  - title: タスク管理
    details: 31のタスクの進捗管理。社内報告、入管報告、ビザ関連などカテゴリ別に整理
    link: /03-tasks/
---

## サイトについて

このサイトは、常南国際学院の業務知識とシステム設計を**2層構成**で管理するドキュメントサイトです。

| 層 | 内容 | ファイル数 |
|---|---|---|
| **01-domain-knowledge** | 業務ナレッジ（業界知識・業務フロー・データ・課題） | 14カテゴリ |
| **02-system-specification** | システム仕様（設計原則・エンティティ・UI/UX） | 5カテゴリ |
| **03-tasks** | タスク管理（31タスク） | 5カテゴリ |

### 実装ロードマップ

```
Phase 0（完了）: 業務の洗い出し（31タスク）、手順書・マニュアル作成
Phase 1（現在）: Excel + Claudeスキルで自動化
Phase 2（現在）: VitePressドキュメントサイト構築 ← 今ここ
Phase 3        : Claude Codeでスキルをシステム化（CLI）
Phase 4        : ローカルホストでWebアプリ検証
Phase 5        : DB移行（Excel → Supabase等）、API化
Phase 6        : Vercelデプロイ（モバイル対応、外部アクセス）
Phase 7        : 他業務・他組織への展開
```
