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

/** スキル選択肢の型 */
type SkillOption = {
  id: string
  name: string
  purpose: string
}

/** 新規プロジェクト作成画面 */
export default function NewProjectPage() {
  const router = useRouter()

  // スキル一覧（選択肢として表示）
  const [skills, setSkills] = useState<SkillOption[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  // フォームの状態
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [contextDataStr, setContextDataStr] = useState('{}')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  /** フォーム送信 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    // contextData の JSON パースを試みる
    let contextData: Record<string, unknown>
    try {
      contextData = JSON.parse(contextDataStr)
    } catch {
      setError('contextData が正しい JSON 形式ではありません')
      setSaving(false)
      return
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
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              )}
              {/* 選択中のスキルの目的を表示 */}
              {selectedSkillId && (
                <p className="text-xs text-muted-foreground">
                  {skills.find((s) => s.id === selectedSkillId)?.purpose}
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
                placeholder="例: 2026年4月期 在留資格更新"
                required
              />
            </div>

            {/* contextData（JSON テキストエリア） */}
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
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? '作成中...' : '作成'}
          </Button>
        </div>
      </form>
    </div>
  )
}
