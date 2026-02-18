'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

// =============================================
// 型定義
// =============================================

/** スキル選択肢の型 */
type SkillOption = {
  id: string
  name: string
  purpose: string
}

// =============================================
// 特定技能申請スキル用の選択肢定義
// =============================================

/** 特定技能の分野（当社の紹介実績がある5分野） */
const SSW_FIELD_OPTIONS = [
  { value: 'NURSING_CARE', label: '介護' },
  { value: 'ACCOMMODATION', label: '宿泊' },
  { value: 'FOOD_SERVICE', label: '外食業' },
  { value: 'FOOD_MANUFACTURING', label: '飲食料品製造業' },
  { value: 'AUTO_TRANSPORT', label: '自動車運送業' },
] as const

/** 国籍の選択肢（条件分岐で使う主要国籍） */
const NATIONALITY_OPTIONS = [
  { value: 'VNM', label: 'ベトナム' },
  { value: 'KHM', label: 'カンボジア' },
  { value: 'THA', label: 'タイ' },
  { value: 'NPL', label: 'ネパール' },
  { value: 'IDN', label: 'インドネシア' },
  { value: 'PHL', label: 'フィリピン' },
  { value: 'MMR', label: 'ミャンマー' },
  { value: 'LKA', label: 'スリランカ' },
  { value: 'CHN', label: '中国' },
  { value: 'OTHER', label: 'その他' },
] as const

/** 医療保険種別 */
const INSURANCE_TYPE_OPTIONS = [
  { value: 'SOCIAL_INSURANCE', label: '社会保険（健康保険）' },
  { value: 'NATIONAL_HEALTH', label: '国民健康保険' },
] as const

/** 年金種別 */
const PENSION_TYPE_OPTIONS = [
  { value: 'EMPLOYEE_PENSION', label: '厚生年金' },
  { value: 'NATIONAL_PENSION', label: '国民年金' },
] as const

/** スキル名が「特定技能申請」かどうかを判定する */
function isSswApplicationSkill(skillName: string): boolean {
  return skillName === '特定技能申請'
}

// =============================================
// コンポーネント
// =============================================

/** 新規プロジェクト作成画面 */
export default function NewProjectPage() {
  const router = useRouter()

  // スキル一覧（選択肢として表示）
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  // 共通フォームの状態
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [projectName, setProjectName] = useState('')

  // 汎用 contextData（特定技能申請以外のスキル用）
  const [contextDataStr, setContextDataStr] = useState('{}')

  // 特定技能申請スキル用の個別フォーム状態
  const [sswField, setSswField] = useState('')
  const [nationality, setNationality] = useState('')
  const [hasCompletedTitp2, setHasCompletedTitp2] = useState(false)
  const [insuranceType, setInsuranceType] = useState('')
  const [pensionType, setPensionType] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 選択中のスキルの情報
  const selectedSkill = skills.find((s) => s.id === selectedSkillId)
  const isSsw = selectedSkill ? isSswApplicationSkill(selectedSkill.name) : false

  /** 有効なスキル一覧を取得 */
  const fetchSkills = useCallback(async () => {
    setSkillsLoading(true)
    try {
      const res = await fetch('/api/projects/skills?isActive=true')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'スキル取得に失敗しました')
      setSkills(json.data)
    } catch (err) {
      console.error('スキル一覧の取得に失敗:', err)
      setError(err instanceof Error ? err.message : 'スキル取得に失敗しました')
    } finally {
      setSkillsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  /** スキル選択が変わったらフォーム状態をリセット */
  function handleSkillChange(skillId: string) {
    setSelectedSkillId(skillId)
    // 特定技能用フォームの初期化
    setSswField('')
    setNationality('')
    setHasCompletedTitp2(false)
    setInsuranceType('')
    setPensionType('')
    // 汎用 contextData の初期化
    setContextDataStr('{}')
  }

  /** 特定技能申請用の contextData を構築する */
  function buildSswContextData(): Record<string, unknown> {
    return {
      sswField,
      nationality,
      hasCompletedTitp2,
      insuranceType,
      pensionType,
    }
  }

  /** フォーム送信 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    // contextData を組み立てる
    let contextData: Record<string, unknown>
    if (isSsw) {
      // 特定技能申請: フォームの値から自動構築
      if (!sswField) {
        setError('分野を選択してください')
        setSaving(false)
        return
      }
      if (!nationality) {
        setError('国籍を選択してください')
        setSaving(false)
        return
      }
      contextData = buildSswContextData()
    } else {
      // その他のスキル: JSON テキストからパース
      try {
        contextData = JSON.parse(contextDataStr)
      } catch {
        setError('contextData が正しい JSON 形式ではありません')
        setSaving(false)
        return
      }
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkillId,
          name: projectName,
          contextData,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '作成に失敗しました')

      // 作成後にプロジェクト詳細画面に遷移
      router.push(`/projects/${json.data.id}`)
    } catch (err) {
      console.error('プロジェクト作成に失敗:', err)
      setError(err instanceof Error ? err.message : '作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">新規プロジェクト作成</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>プロジェクト情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* スキル選択 */}
            <div className="space-y-1">
              <Label>
                スキル <span className="text-destructive">*</span>
              </Label>
              {skillsLoading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : (
                <Select
                  value={selectedSkillId}
                  onChange={(e) => handleSkillChange(e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              )}
              {selectedSkill && (
                <p className="text-xs text-muted-foreground">
                  {selectedSkill.purpose}
                </p>
              )}
            </div>

            {/* プロジェクト名 */}
            <div className="space-y-1">
              <Label>
                プロジェクト名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: 田中太郎の特定技能申請"
                required
              />
            </div>

            {/* ================================================ */}
            {/* 特定技能申請スキル用の専用フォーム */}
            {/* ================================================ */}
            {isSsw && (
              <>
                {/* 分野（職種）選択 */}
                <div className="space-y-1">
                  <Label>
                    分野（職種） <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={sswField}
                    onChange={(e) => setSswField(e.target.value)}
                    required
                  >
                    <option value="">選択してください</option>
                    {SSW_FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    分野によって追加で必要な書類が自動判定されます
                  </p>
                </div>

                {/* 国籍選択 */}
                <div className="space-y-1">
                  <Label>
                    申請人の国籍 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    required
                  >
                    <option value="">選択してください</option>
                    {NATIONALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    ベトナム・カンボジア・タイの場合、二国間取決に係る書類が必要になります
                  </p>
                </div>

                {/* 技能実習2号修了 */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasCompletedTitp2}
                      onChange={(e) => setHasCompletedTitp2(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    技能実習2号を修了している
                  </Label>
                  <p className="text-xs text-muted-foreground pl-6">
                    修了者は技能試験・日本語試験が免除されます
                  </p>
                </div>

                {/* 医療保険種別 */}
                <div className="space-y-1">
                  <Label>医療保険</Label>
                  <Select
                    value={insuranceType}
                    onChange={(e) => setInsuranceType(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {INSURANCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    国民健康保険の場合、追加の証明書類が必要です
                  </p>
                </div>

                {/* 年金種別 */}
                <div className="space-y-1">
                  <Label>年金</Label>
                  <Select
                    value={pensionType}
                    onChange={(e) => setPensionType(e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {PENSION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    国民年金の場合、追加の証明書類が必要です
                  </p>
                </div>
              </>
            )}

            {/* ================================================ */}
            {/* その他のスキル用の汎用 contextData 入力 */}
            {/* ================================================ */}
            {!isSsw && selectedSkillId && (
              <div className="space-y-1">
                <Label>コンテキストデータ（JSON）</Label>
                <Textarea
                  value={contextDataStr}
                  onChange={(e) => setContextDataStr(e.target.value)}
                  placeholder='{"studentId": "...", "visaType": "..."}'
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  スキルの条件分岐で使用するデータを JSON 形式で入力してください
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving || !selectedSkillId}>
            <Save className="h-4 w-4" />
            {saving ? '作成中...' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  )
}
