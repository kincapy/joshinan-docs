'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react'

// =============================================
// 型定義
// =============================================

type SkillOption = {
  id: string
  name: string
  purpose: string
}

type StudentOption = {
  id: string
  nameKanji: string | null
  nameEn: string
  nationality: string
  cohort: string
}

// =============================================
// 定数
// =============================================

/** 特定技能の分野（仕様再設計後: 学生選択→職種選択の2ステップ） */
const SSW_FIELD_OPTIONS = [
  { value: 'NURSING_CARE', label: '介護' },
  { value: 'ACCOMMODATION', label: '宿泊' },
  { value: 'FOOD_SERVICE', label: '外食業' },
  { value: 'FOOD_MANUFACTURING', label: '飲食料品製造業' },
  { value: 'AUTO_TRANSPORT', label: '自動車運送業' },
] as const

/** ウィザードのステップ */
const STEPS = [
  { label: 'スキル選択', description: '使用するスキルを選びます' },
  { label: '学生選択', description: '対象の学生を選びます' },
  { label: '職種選択', description: '分野（職種）を選びます' },
] as const

// =============================================
// コンポーネント
// =============================================

/** 新規プロジェクト作成画面（ウィザード形式） */
export default function NewProjectPage() {
  const router = useRouter()

  // ウィザードのステップ管理
  const [step, setStep] = useState(0)

  // STEP 1: スキル選択
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [selectedSkillId, setSelectedSkillId] = useState('')

  // STEP 2: 学生選択
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  // STEP 3: 職種選択
  const [sswField, setSswField] = useState('')

  // 送信状態
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 選択中のスキル・学生
  const selectedSkill = skills.find((s) => s.id === selectedSkillId)
  const selectedStudent = students.find((s) => s.id === selectedStudentId)
  /** スキルが「特定技能申請」かどうか */
  const isSsw = selectedSkill?.name === '特定技能申請'

  // =============================================
  // データ取得
  // =============================================

  /** 有効なスキル一覧を取得 */
  const fetchSkills = useCallback(async () => {
    setSkillsLoading(true)
    try {
      const res = await fetch('/api/projects/skills?isActive=true')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'スキル取得に失敗しました')
      setSkills(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スキル取得に失敗しました')
    } finally {
      setSkillsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  /** 学生を検索する */
  async function searchStudents() {
    if (!studentSearch.trim()) return
    setStudentsLoading(true)
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&per=20`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '学生検索に失敗しました')
      setStudents(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '学生検索に失敗しました')
    } finally {
      setStudentsLoading(false)
    }
  }

  // =============================================
  // ナビゲーション
  // =============================================

  /** 次のステップへ進めるか判定 */
  function canGoNext(): boolean {
    switch (step) {
      case 0: return !!selectedSkillId
      case 1: return !!selectedStudentId
      case 2: return !!sswField
      default: return false
    }
  }

  /** 次のステップへ */
  function handleNext() {
    if (!canGoNext()) return
    setError('')
    // 特定技能申請以外のスキルは学生選択後すぐに作成する
    if (step === 1 && !isSsw) {
      handleSubmit()
      return
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  /** 前のステップへ */
  function handleBack() {
    setError('')
    setStep((prev) => Math.max(prev - 1, 0))
  }

  // =============================================
  // 送信
  // =============================================

  /** プロジェクト作成 */
  async function handleSubmit() {
    setSaving(true)
    setError('')

    // contextData を組み立てる（国籍は学生DBから自動取得するのでAPI側で処理）
    const contextData: Record<string, unknown> = {
      studentId: selectedStudentId,
      sswField: isSsw ? sswField : undefined,
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkillId,
          // name は省略 → API側で「{学生名}の{スキル名}」を自動生成
          contextData,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '作成に失敗しました')

      router.push(`/projects/${json.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました')
      setSaving(false)
    }
  }

  // =============================================
  // レンダリング
  // =============================================

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">新規プロジェクト作成</h1>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          // 特定技能以外のスキルではSTEP3（職種選択）を表示しない
          if (i === 2 && !isSsw) return null
          const isActive = i === step
          const isCompleted = i < step
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                isActive ? 'bg-primary text-primary-foreground' :
                isCompleted ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                <span>{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* STEP 1: スキル選択 */}
      {step === 0 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>STEP 1: スキルを選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsLoading ? (
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            ) : (
              <div className="space-y-2">
                {skills.map((skill) => (
                  <label
                    key={skill.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedSkillId === skill.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="skill"
                      value={skill.id}
                      checked={selectedSkillId === skill.id}
                      onChange={() => setSelectedSkillId(skill.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-muted-foreground">{skill.purpose}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: 学生選択 */}
      {step === 1 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>STEP 2: 対象学生を選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 検索フォーム */}
            <div className="flex gap-2">
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchStudents() } }}
                placeholder="名前で検索..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchStudents}
                disabled={studentsLoading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* 検索結果 */}
            {studentsLoading ? (
              <p className="text-sm text-muted-foreground">検索中...</p>
            ) : students.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selectedStudentId === student.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="student"
                      value={student.id}
                      checked={selectedStudentId === student.id}
                      onChange={() => setSelectedStudentId(student.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">
                        {student.nameKanji || student.nameEn}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.nationality} / {student.cohort}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : studentSearch ? (
              <p className="text-sm text-muted-foreground">該当する学生が見つかりません</p>
            ) : null}

            {/* 選択した学生の情報 */}
            {selectedStudent && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p>選択中: <strong>{selectedStudent.nameKanji || selectedStudent.nameEn}</strong></p>
                <p className="text-muted-foreground">
                  国籍: {selectedStudent.nationality} → 二国間取決書類の要否を自動判定します
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: 職種選択（特定技能申請スキルの場合のみ） */}
      {step === 2 && isSsw && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>STEP 3: 職種（分野）を選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {SSW_FIELD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    sswField === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="sswField"
                    value={opt.value}
                    checked={sswField === opt.value}
                    onChange={() => setSswField(opt.value)}
                  />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              職種によって追加で必要な書類が自動判定されます
            </p>
          </CardContent>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between max-w-lg">
        <Button
          type="button"
          variant="outline"
          onClick={step === 0 ? () => router.push('/projects') : handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? 'キャンセル' : '戻る'}
        </Button>

        {/* 最終ステップでは「プロジェクト開始」ボタン */}
        {(step === 2 && isSsw) || (step === 1 && !isSsw) ? (
          <Button
            onClick={handleSubmit}
            disabled={saving || !canGoNext()}
          >
            {saving ? '作成中...' : 'プロジェクト開始'}
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            次へ
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
