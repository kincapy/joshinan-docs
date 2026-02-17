import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '常南国際学院 Docs',
  description: '常南国際学院の業務ナレッジとシステム設計ドキュメント',
  lang: 'ja',
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '業務ナレッジ', link: '/01-domain-knowledge/' },
      { text: 'システム仕様', link: '/02-system-specification/' },
      { text: 'タスク管理', link: '/03-tasks/' },
    ],
    sidebar: {
      '/01-domain-knowledge/': [
        {
          text: '業務ナレッジ',
          items: [
            { text: '概要', link: '/01-domain-knowledge/' },
            {
              text: '00 日本語教育機関',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/00-japanese-language-education/' },
                { text: 'データ', link: '/01-domain-knowledge/00-japanese-language-education/02-data' },
                { text: '課題', link: '/01-domain-knowledge/00-japanese-language-education/03-issues' },
              ],
            },
            {
              text: '01 学校基本情報',
              collapsed: false,
              items: [
                { text: '概要・ビジネスモデル', link: '/01-domain-knowledge/01-school-info/' },
                { text: 'データ', link: '/01-domain-knowledge/01-school-info/02-data' },
              ],
            },
            {
              text: '02 学生管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/02-student-management/' },
                { text: '業務フロー', link: '/01-domain-knowledge/02-student-management/01-work-flow' },
                { text: 'データ', link: '/01-domain-knowledge/02-student-management/02-data' },
                { text: '課題', link: '/01-domain-knowledge/02-student-management/03-issues' },
                { text: '留学生の実態', link: '/01-domain-knowledge/02-student-management/04-student-reality' },
              ],
            },
            {
              text: '03 カリキュラム・時間割',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/03-curriculum/' },
                { text: 'データ', link: '/01-domain-knowledge/03-curriculum/02-data' },
              ],
            },
            {
              text: '04 クラス編成',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/04-class-assignment/' },
                { text: 'データ', link: '/01-domain-knowledge/04-class-assignment/02-data' },
              ],
            },
            {
              text: '05 出席管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/05-attendance/' },
                { text: 'データ', link: '/01-domain-knowledge/05-attendance/02-data' },
              ],
            },
            {
              text: '06 学費管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/06-tuition/' },
                { text: '業務フロー', link: '/01-domain-knowledge/06-tuition/01-work-flow' },
                { text: 'データ', link: '/01-domain-knowledge/06-tuition/02-data' },
              ],
            },
            {
              text: '07 エージェント管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/07-agent-management/' },
                { text: 'データ', link: '/01-domain-knowledge/07-agent-management/02-data' },
              ],
            },
            {
              text: '08 施設・備品管理',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/08-facility-management/' },
                { text: 'データ', link: '/01-domain-knowledge/08-facility-management/02-data' },
              ],
            },
            {
              text: '09 教職員管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/09-staff-management/' },
                { text: 'データ', link: '/01-domain-knowledge/09-staff-management/02-data' },
              ],
            },
            {
              text: '10 外部システム連携',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/10-external-integration/' },
                { text: 'RINGUAL — 概要', link: '/01-domain-knowledge/10-external-integration/01-ringual' },
                { text: 'RINGUAL — データ構造', link: '/01-domain-knowledge/10-external-integration/02-ringual-data' },
                { text: 'RINGUAL — 出欠・成績・時間割', link: '/01-domain-knowledge/10-external-integration/03-ringual-operations' },
              ],
            },
            {
              text: '11 入管報告・届出',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/11-immigration-report/' },
                { text: '業務フロー', link: '/01-domain-knowledge/11-immigration-report/01-work-flow' },
                { text: 'データ', link: '/01-domain-knowledge/11-immigration-report/02-data' },
                { text: '帳票 — 定期報告', link: '/01-domain-knowledge/11-immigration-report/03-forms-periodic' },
                { text: '帳票 — ビザ申請', link: '/01-domain-knowledge/11-immigration-report/04-forms-visa' },
                { text: '帳票 — 届出', link: '/01-domain-knowledge/11-immigration-report/05-forms-notification' },
                { text: '帳票 — 証明書', link: '/01-domain-knowledge/11-immigration-report/06-forms-certificate' },
              ],
            },
            {
              text: '12 社内文書',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/12-internal-documents/' },
                { text: 'データ', link: '/01-domain-knowledge/12-internal-documents/02-data' },
              ],
            },
            {
              text: '13 法令・基準の変遷',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/13-regulatory-history/' },
              ],
            },
            {
              text: '14 募集業務',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/14-recruitment/' },
                { text: '申請書作成の注意事項', link: '/01-domain-knowledge/14-recruitment/01-application-form' },
                { text: 'データ', link: '/01-domain-knowledge/14-recruitment/02-data' },
                { text: '提出書類一覧と注意事項', link: '/01-domain-knowledge/14-recruitment/02-required-documents' },
                { text: '各提出書類の詳細注意事項', link: '/01-domain-knowledge/14-recruitment/03-document-details' },
              ],
            },
            {
              text: '15 特定技能・職業紹介',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/15-specified-skilled-worker/' },
                { text: '業務フロー', link: '/01-domain-knowledge/15-specified-skilled-worker/01-work-flow' },
                { text: 'データ', link: '/01-domain-knowledge/15-specified-skilled-worker/02-data' },
                { text: '課題', link: '/01-domain-knowledge/15-specified-skilled-worker/03-issues' },
              ],
            },
          ],
        },
      ],
      '/02-system-specification/': [
        {
          text: 'システム仕様',
          items: [
            { text: '概要', link: '/02-system-specification/' },
            {
              text: '00 コンセプト',
              collapsed: false,
              items: [
                { text: 'システムコンセプト', link: '/02-system-specification/00-concept/' },
                { text: 'プロジェクト機能', link: '/02-system-specification/00-concept/02-project-feature' },
              ],
            },
            {
              text: '00 共通',
              collapsed: false,
              items: [
                { text: '設計原則', link: '/02-system-specification/00-common/' },
              ],
            },
            {
              text: '00 ダッシュボード',
              collapsed: true,
              items: [
                { text: '概要', link: '/02-system-specification/00-dashboard/' },
              ],
            },
            {
              text: '01 学校基本情報',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/01-school-info/' },
                { text: 'エンティティ定義', link: '/02-system-specification/01-school-info/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/01-school-info/02-uiux' },
              ],
            },
            {
              text: '02 学生管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/02-student-management/' },
                { text: 'エンティティ定義', link: '/02-system-specification/02-student-management/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/02-student-management/02-uiux' },
              ],
            },
            {
              text: '03 カリキュラム・時間割',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/03-curriculum/' },
                { text: 'エンティティ定義', link: '/02-system-specification/03-curriculum/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/03-curriculum/02-uiux' },
              ],
            },
            {
              text: '04 クラス編成',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/04-class-assignment/' },
                { text: 'エンティティ定義', link: '/02-system-specification/04-class-assignment/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/04-class-assignment/02-uiux' },
              ],
            },
            {
              text: '05 出席管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/05-attendance/' },
                { text: 'エンティティ定義', link: '/02-system-specification/05-attendance/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/05-attendance/02-uiux' },
              ],
            },
            {
              text: '06 学費管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/06-tuition/' },
                { text: 'エンティティ定義', link: '/02-system-specification/06-tuition/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/06-tuition/02-uiux' },
              ],
            },
            {
              text: '07 エージェント管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/07-agent-management/' },
                { text: 'エンティティ定義', link: '/02-system-specification/07-agent-management/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/07-agent-management/02-uiux' },
              ],
            },
            {
              text: '08 施設・備品管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/08-facility-management/' },
                { text: 'エンティティ定義', link: '/02-system-specification/08-facility-management/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/08-facility-management/02-uiux' },
              ],
            },
            {
              text: '09 教職員管理',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/09-staff-management/' },
                { text: 'エンティティ定義', link: '/02-system-specification/09-staff-management/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/09-staff-management/02-uiux' },
              ],
            },
            {
              text: '11 入管報告・届出',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/11-immigration-report/' },
                { text: 'エンティティ定義', link: '/02-system-specification/11-immigration-report/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/11-immigration-report/02-uiux' },
              ],
            },
            {
              text: '12 社内文書',
              collapsed: true,
              items: [
                { text: '概要', link: '/02-system-specification/12-internal-documents/' },
                { text: 'エンティティ定義', link: '/02-system-specification/12-internal-documents/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/12-internal-documents/02-uiux' },
              ],
            },
            {
              text: '14 募集業務',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/14-recruitment/' },
                { text: 'エンティティ定義', link: '/02-system-specification/14-recruitment/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/14-recruitment/02-uiux' },
              ],
            },
            {
              text: '15 特定技能・職業紹介',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/15-specified-skilled-worker/' },
                { text: 'エンティティ定義', link: '/02-system-specification/15-specified-skilled-worker/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/15-specified-skilled-worker/02-uiux' },
              ],
            },
            {
              text: '16 チャットボット',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/16-chatbot/' },
                { text: 'エンティティ定義', link: '/02-system-specification/16-chatbot/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/16-chatbot/02-uiux' },
              ],
            },
            {
              text: '17 帳票出力',
              collapsed: false,
              items: [
                { text: '概要', link: '/02-system-specification/17-documents/' },
                { text: 'エンティティ定義', link: '/02-system-specification/17-documents/01-entity' },
                { text: 'UIUX定義', link: '/02-system-specification/17-documents/02-uiux' },
              ],
            },
          ],
        },
      ],
      '/03-tasks/': [
        {
          text: 'タスク管理',
          items: [
            { text: '全タスク一覧', link: '/03-tasks/' },
            { text: '社内報告', link: '/03-tasks/reporting/' },
            { text: 'データメンテナンス', link: '/03-tasks/data-maintenance/' },
            { text: '入管報告・届出', link: '/03-tasks/immigration/' },
            { text: 'ビザ・特定技能', link: '/03-tasks/visa/' },
            {
              text: '2026/02/17',
              collapsed: false,
              items: [
                { text: '仕様ドキュメントレビュー・整備', link: '/03-tasks/2026/02/17/1000-仕様ドキュメントレビュー整備' },
                { text: 'プロジェクト初期構築', link: '/03-tasks/2026/02/17/1100-プロジェクト初期構築' },
              ],
            },
          ],
        },
      ],
    },
    socialLinks: [],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
      label: '目次',
    },
    lastUpdated: {
      text: '最終更新',
    },
    docFooter: {
      prev: '前のページ',
      next: '次のページ',
    },
  },
  markdown: {
    config: (md) => {
      // Mermaid support can be added later
    },
  },
})
