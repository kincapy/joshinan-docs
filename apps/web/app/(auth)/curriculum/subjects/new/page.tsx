'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { subjectCategory, jlptLevel } from '@joshinan/domain'
import { ArrowLeft, Save } from 'lucide-react'

/** 科目登録フォームの型 */
type SubjectForm = {
  name: string
  category: string
  targetLevel: string
  description: string
}

const initialForm: SubjectForm = {
  name: '',
  category: '',
  targetLevel: '',
  description: '',
}

/** 科目登録画面 */
export default function NewSubjectPage() {
  const router = useRouter()
  const [form, setForm] = useState<SubjectForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(field: keyof SubjectForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          targetLevel: form.targetLevel || null,
          description: form.description || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後は科目一覧に戻る
      router.push('/curriculum/subjects')
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/curriculum/subjects')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">科目登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>科目情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>
                科目名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="例: 初級文法A"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>
                カテゴリ <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {subjectCategory.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>対象レベル</Label>
              <Select
                value={form.targetLevel}
                onChange={(e) => updateField('targetLevel', e.target.value)}
              >
                <option value="">指定なし</option>
                {jlptLevel.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>説明</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="科目の説明（任意）"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
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
