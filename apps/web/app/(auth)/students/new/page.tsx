'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { gender, cohort } from '@joshinan/domain'
import { ArrowLeft, Save } from 'lucide-react'

/** 学生登録フォームの型 */
type StudentForm = {
  nameEn: string
  nameKanji: string
  nameKana: string
  dateOfBirth: string
  gender: string
  nationality: string
  cohort: string
  agentId: string
  email: string
  phone: string
}

const initialForm: StudentForm = {
  nameEn: '',
  nameKanji: '',
  nameKana: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  cohort: '',
  agentId: '',
  email: '',
  phone: '',
}

/** 学生登録画面 */
export default function NewStudentPage() {
  const router = useRouter()
  const [form, setForm] = useState<StudentForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(field: keyof StudentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: form.nameEn,
          nameKanji: form.nameKanji || null,
          nameKana: form.nameKana || null,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          nationality: form.nationality,
          cohort: form.cohort,
          agentId: form.agentId || null,
          email: form.email || null,
          phone: form.phone || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後は学生詳細画面にリダイレクト
      router.push(`/students/${json.data.id}`)
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/students')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">学生登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  氏名（英語） <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.nameEn}
                  onChange={(e) => updateField('nameEn', e.target.value)}
                  placeholder="パスポート記載名"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>氏名（漢字）</Label>
                <Input
                  value={form.nameKanji}
                  onChange={(e) => updateField('nameKanji', e.target.value)}
                  placeholder="漢字圏の場合"
                />
              </div>
              <div className="space-y-1">
                <Label>氏名（カナ）</Label>
                <Input
                  value={form.nameKana}
                  onChange={(e) => updateField('nameKana', e.target.value)}
                  placeholder="カタカナ"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  生年月日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  性別 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {gender.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  国籍 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  placeholder="例: ベトナム"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* 入学・連絡先情報 */}
          <Card>
            <CardHeader>
              <CardTitle>入学・連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  コホート <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.cohort}
                  onChange={(e) => updateField('cohort', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {cohort.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="090-0000-0000"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                学籍番号は入学年・コホートから自動採番されます。
                初期ステータスは「入学前（申請予定）」に設定されます。
              </p>
            </CardContent>
          </Card>
        </div>

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
