'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { timeSlot, jlptLevel, cefrLevel } from '@joshinan/domain'
import { ArrowLeft, Save } from 'lucide-react'

/** クラス登録フォームの型 */
type ClassForm = {
  name: string
  printName: string
  jlptLevel: string
  cefrLevel: string
  timeSlot: string
  isSubClass: boolean
  maxStudents: number
  fiscalYear: number
  startDate: string
  endDate: string
}

const currentYear = new Date().getFullYear()

const initialForm: ClassForm = {
  name: '',
  printName: '',
  jlptLevel: '',
  cefrLevel: '',
  timeSlot: '',
  isSubClass: false,
  maxStudents: 20,
  fiscalYear: currentYear,
  startDate: '',
  endDate: '',
}

/** クラス登録画面 */
export default function NewClassPage() {
  const router = useRouter()
  const [form, setForm] = useState<ClassForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField<K extends keyof ClassForm>(field: K, value: ClassForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          printName: form.printName || null,
          jlptLevel: form.jlptLevel || null,
          cefrLevel: form.cefrLevel || null,
          timeSlot: form.timeSlot,
          isSubClass: form.isSubClass,
          maxStudents: form.maxStudents,
          fiscalYear: form.fiscalYear,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後はクラス詳細画面に遷移
      router.push(`/classes/${json.data.id}`)
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/classes')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">クラス登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>クラス情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>
                クラス名 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="例: 初級A"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>印刷用名称</Label>
              <Input
                value={form.printName}
                onChange={(e) => updateField('printName', e.target.value)}
                placeholder="証明書等に印刷される名称"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>JLPTレベル</Label>
                <Select
                  value={form.jlptLevel}
                  onChange={(e) => updateField('jlptLevel', e.target.value)}
                >
                  <option value="">指定なし</option>
                  {jlptLevel.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>CEFRレベル</Label>
                <Select
                  value={form.cefrLevel}
                  onChange={(e) => updateField('cefrLevel', e.target.value)}
                >
                  <option value="">指定なし</option>
                  {cefrLevel.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>
                時間帯区分 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.timeSlot}
                onChange={(e) => updateField('timeSlot', e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {timeSlot.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSubClass"
                checked={form.isSubClass}
                onChange={(e) => updateField('isSubClass', e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isSubClass">サブクラス（補習・特別授業用）</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>
                  最大人数 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxStudents}
                  onChange={(e) => updateField('maxStudents', Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  年度 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.fiscalYear}
                  onChange={(e) => updateField('fiscalYear', Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>
                  開始日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  終了日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  required
                />
              </div>
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
