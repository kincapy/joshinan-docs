import type { SkillTaskTemplate, SkillConditionRule, ConditionOperator } from '@joshinan/database'

/** 条件分岐の評価結果 */
type ConditionResult = {
  taskCode: string
  required: boolean
  skipReason?: string
}

/**
 * 条件分岐ルールを評価して、各タスクの必須/不要を判定する
 *
 * プロジェクト作成時に呼ばれる。
 * テンプレートの defaultRequired をベースに、contextData の値と conditionRules を照合して、
 * 条件に一致するルールがあればそのルールの resultRequired で上書きする。
 */
export function evaluateConditions(
  templates: SkillTaskTemplate[],
  rules: SkillConditionRule[],
  contextData: Record<string, unknown>,
): ConditionResult[] {
  return templates.map((template) => {
    // このタスクコードに対応するルールを抽出
    const matchingRules = rules.filter((r) => r.taskCode === template.taskCode)

    // ルールがなければデフォルトの必須/不要をそのまま使う
    if (matchingRules.length === 0) {
      return {
        taskCode: template.taskCode,
        required: template.defaultRequired,
      }
    }

    // 一致するルールを探す（最初に一致したルールを採用）
    for (const rule of matchingRules) {
      const fieldValue = contextData[rule.conditionField]
      const matched = evaluateOperator(rule.operator, fieldValue, rule.conditionValue)

      if (matched) {
        return {
          taskCode: template.taskCode,
          required: rule.resultRequired,
          // 不要と判定された場合、理由を記録する
          skipReason: rule.resultRequired
            ? undefined
            : buildSkipReason(rule),
        }
      }
    }

    // どのルールにも一致しなければデフォルト値を使う
    return {
      taskCode: template.taskCode,
      required: template.defaultRequired,
    }
  })
}

/**
 * 演算子ごとに条件の一致を判定する
 *
 * - EQUALS: conditionField の値が conditionValue と一致
 * - NOT_EQUALS: 不一致
 * - IN: conditionValue をカンマ区切りでパースし、いずれかに一致
 * - IS_TRUE: conditionField の値が truthy
 * - IS_FALSE: conditionField の値が falsy
 */
function evaluateOperator(
  operator: ConditionOperator,
  fieldValue: unknown,
  conditionValue: string,
): boolean {
  switch (operator) {
    case 'EQUALS':
      return String(fieldValue) === conditionValue

    case 'NOT_EQUALS':
      return String(fieldValue) !== conditionValue

    case 'IN': {
      // conditionValue をカンマ区切りでパースし、前後の空白を除去
      const allowedValues = conditionValue.split(',').map((v) => v.trim())
      return allowedValues.includes(String(fieldValue))
    }

    case 'IS_TRUE':
      return Boolean(fieldValue) === true

    case 'IS_FALSE':
      return Boolean(fieldValue) === false

    default:
      // 未知の演算子は一致しないとみなす
      return false
  }
}

/** 不要と判定された場合のスキップ理由を組み立てる */
function buildSkipReason(rule: SkillConditionRule): string {
  const operatorLabels: Record<string, string> = {
    EQUALS: '一致',
    NOT_EQUALS: '不一致',
    IN: 'いずれかに一致',
    IS_TRUE: 'true',
    IS_FALSE: 'false',
  }
  const label = operatorLabels[rule.operator] ?? rule.operator
  return `条件: ${rule.conditionField} が ${label}（${rule.conditionValue}）のため不要`
}
