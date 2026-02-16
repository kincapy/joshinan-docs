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
              ],
            },
            {
              text: '04 クラス編成',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/04-class-assignment/' },
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
              ],
            },
            {
              text: '10 外部システム連携',
              collapsed: true,
              items: [
                { text: '概要', link: '/01-domain-knowledge/10-external-integration/' },
              ],
            },
            {
              text: '11 入管報告・届出',
              collapsed: false,
              items: [
                { text: '概要', link: '/01-domain-knowledge/11-immigration-report/' },
                { text: '業務フロー', link: '/01-domain-knowledge/11-immigration-report/01-work-flow' },
                { text: 'データ', link: '/01-domain-knowledge/11-immigration-report/02-data' },
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
              text: '02 学生管理',
              collapsed: true,
              items: [
                { text: '概要', link: '/02-system-specification/02-student-management/' },
              ],
            },
            {
              text: '06 学費管理',
              collapsed: true,
              items: [
                { text: '概要', link: '/02-system-specification/06-tuition/' },
              ],
            },
            {
              text: '07 エージェント管理',
              collapsed: true,
              items: [
                { text: '概要', link: '/02-system-specification/07-agent-management/' },
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
