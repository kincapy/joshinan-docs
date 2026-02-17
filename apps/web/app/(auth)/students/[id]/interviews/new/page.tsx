'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { interviewType } from '@joshinan/domain'
import { ArrowLeft, Save } from 'lucide-react'

/** フォームの型 */
type InterviewForm = {
  interviewDate: string
  interviewType: string
  content: string
  actionItems: string
}

/** 面談記録作成画面 */
export default function NewInterviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // デフォルト: 本日の日付
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<InterviewForm>({
    interviewDate: today,
    interviewType: '',
    content: '',
    actionItems: '',
  })

  function updateField(field: keyof InterviewForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/students/${params.id}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewDate: form.interviewDate,
          interviewType: form.interviewType,
          content: form.content,
          actionItems: form.actionItems || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後は面談記録一覧にリダイレクト
      router.push(`/students/${params.id}/interviews`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/students/${params.id}/interviews`)}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">面談記録作成</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>面談内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>
                  面談日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.interviewDate}
                  onChange={(e) => updateField('interviewDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  面談種別 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.interviewType}
                  onChange={(e) => updateField('interviewType', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {interviewType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>
                内容 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={form.content}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder="面談の内容を記録してください"
                rows={6}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>アクション項目</Label>
              <Textarea
                value={form.actionItems}
                onChange={(e) => updateField('actionItems', e.target.value)}
                placeholder="面談後の対応事項があれば記録してください"
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              担当者はログインユーザーが自動設定されます。
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? '登録中...' : '登録'}
          </Button>
        </div>
      </form>
    </div>
  )
}
