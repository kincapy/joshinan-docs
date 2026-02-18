import type { SupportOrgData } from './types'

/**
 * 登録支援機関の固定情報（常南交通株式会社）
 *
 * 全申請書類で共通の当社情報。
 * 出典: docs/01-domain-knowledge/15-specified-skilled-worker/02-data.md
 */
export const SUPPORT_ORG: SupportOrgData = {
  name: '常南交通株式会社',
  registrationNumber: '19登-001334',
  corporateNumber: '8050001018046',
  address: '茨城県つくば市榎戸433-2',
  postalCode: '305-0853',
  phone: '029-438-1271',
  representative: '笹目博',
  supportManager: '笹目瑛司',
  bankAccount: '足利銀行 つくば支店 普通 5033625',
}

/**
 * テンプレートファイルのベースディレクトリ
 *
 * apps/web/templates/ssw-application/ に格納された公式様式テンプレート。
 * ビルド時に outputFileTracingIncludes で Vercel にバンドルされる。
 */
export const TEMPLATE_BASE_DIR = 'templates/ssw-application'

/**
 * 特定技能分野の日本語ラベル
 *
 * SswField enum → 申請書類に記載する分野名の変換。
 */
export const SSW_FIELD_LABELS: Record<string, string> = {
  NURSING_CARE: '介護',
  ACCOMMODATION: '宿泊',
  FOOD_SERVICE: '外食業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  AUTO_TRANSPORT: '自動車運送業',
}

/**
 * 性別の日本語ラベル
 *
 * Gender enum → 申請書類に記載する性別の変換。
 */
export const GENDER_LABELS: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
}

/**
 * 国籍コードから日本語名への変換
 *
 * 学生マスタの nationality フィールドは英語名で保存されているため、
 * 申請書類に記載する際に日本語名に変換する。
 * よく使う国籍のみ定義し、未定義の場合はそのまま使用する。
 */
export const NATIONALITY_LABELS: Record<string, string> = {
  // 東南アジア（当校メインの出身国）
  Vietnam: 'ベトナム',
  Cambodia: 'カンボジア',
  Myanmar: 'ミャンマー',
  Indonesia: 'インドネシア',
  Philippines: 'フィリピン',
  Thailand: 'タイ',
  Nepal: 'ネパール',
  // 東アジア
  China: '中国',
  'South Korea': '韓国',
  Taiwan: '台湾',
  Mongolia: 'モンゴル',
  // 南アジア
  India: 'インド',
  Bangladesh: 'バングラデシュ',
  'Sri Lanka': 'スリランカ',
  Pakistan: 'パキスタン',
  // 中央アジア
  Uzbekistan: 'ウズベキスタン',
}

/**
 * 国籍名を日本語に変換する
 *
 * NATIONALITY_LABELS に定義があればそれを返し、なければ元の文字列をそのまま返す。
 */
export function toJapaneseNationality(nationality: string): string {
  return NATIONALITY_LABELS[nationality] ?? nationality
}

/**
 * 日付を和暦で表示する（申請書類用）
 *
 * 入管の申請書類は和暦（令和）で記載する。
 * 例: 2025-04-15 → "令和 7年 4月 15日"
 */
export function toWareki(date: Date | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  // 令和: 2019年5月1日〜
  if (year >= 2019) {
    const reiwaYear = year - 2018
    return `令和 ${reiwaYear}年 ${month}月 ${day}日`
  }

  // 平成: 1989年1月8日〜2019年4月30日
  if (year >= 1989) {
    const heiseiYear = year - 1988
    return `平成 ${heiseiYear}年 ${month}月 ${day}日`
  }

  // それより前は想定外だが、西暦で返す
  return `${year}年 ${month}月 ${day}日`
}

/**
 * 日付から年・月・日を個別に取得する
 *
 * Excel のマージセルで年・月・日が別々のセルに分かれている場合に使う。
 */
export function getDateParts(date: Date | null | undefined): {
  year: number | null
  month: number | null
  day: number | null
  /** 和暦の年（令和） */
  warekiYear: number | null
  /** 元号名 */
  eraName: string | null
} {
  if (!date) {
    return { year: null, month: null, day: null, warekiYear: null, eraName: null }
  }

  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()

  // 令和
  if (year >= 2019) {
    return {
      year,
      month,
      day,
      warekiYear: year - 2018,
      eraName: '令和',
    }
  }

  // 平成
  if (year >= 1989) {
    return {
      year,
      month,
      day,
      warekiYear: year - 1988,
      eraName: '平成',
    }
  }

  return {
    year,
    month,
    day,
    warekiYear: null,
    eraName: null,
  }
}
