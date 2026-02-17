'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'

/** 出力形式の選択肢 */
const outputFormatOptions = [
  { value: 'EXCEL', label: 'Excel (.xlsx)' },
  { value: 'DOCX', label: 'Word (.docx)' },
]

type Form = {
  name: string
  outputFormat: string
  description: string
}

const initialForm: Form = {
  name: '',
  outputFormat: '',
  description: '',
}

/** テンプレート新規登録画面 */
export default function NewTemplatePage() {
  const router = useRouter()
  const [form, setForm] = useState<Form>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField<K extends keyof Form>(field: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          outputFormat: form.outputFormat,
          description: form.description || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      router.push('/documents')
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">テンプレート登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 文書名 */}
            <div className="space-y-1">
              <Label>
                文書名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="例: 出金依頼書"
                required
              />
            </div>

            {/* 出力形式 */}
            <div className="space-y-1">
              <Label>
                出力形式 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.outputFormat}
                onChange={(e) => updateField('outputFormat', e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {outputFormatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* 説明 */}
            <div className="space-y-1">
              <Label>説明</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="テンプレートの説明（任意）"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving || !form.name || !form.outputFormat}>
            <Save className="h-4 w-4" />
            {saving ? '登録中...' : '登録'}
          </Button>
        </div>
      </form>
    </div>
  )
}
