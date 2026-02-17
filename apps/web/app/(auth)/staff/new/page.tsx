'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { staffRole, employmentType, payType } from '@joshinan/domain'
import { ArrowLeft, Save } from 'lucide-react'

/** 教職員登録フォームの型 */
type StaffForm = {
  name: string
  email: string
  phone: string
  role: string
  employmentType: string
  hireDate: string
  payType: string
  maxWeeklyLessons: string
}

const initialForm: StaffForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  employmentType: '',
  hireDate: '',
  payType: '',
  maxWeeklyLessons: '',
}

/** 教職員登録画面 */
export default function NewStaffPage() {
  const router = useRouter()
  const [form, setForm] = useState<StaffForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(field: keyof StaffForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          role: form.role,
          employmentType: form.employmentType,
          hireDate: form.hireDate,
          payType: form.payType || null,
          maxWeeklyLessons: form.maxWeeklyLessons
            ? parseInt(form.maxWeeklyLessons, 10)
            : null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後は詳細画面にリダイレクト
      router.push(`/staff/${json.data.id}`)
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/staff')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">教職員登録</h1>
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
                  氏名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@joshinan.ac.jp"
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
            </CardContent>
          </Card>

          {/* 雇用情報 */}
          <Card>
            <CardHeader>
              <CardTitle>雇用情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  役職 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {staffRole.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  雇用形態 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.employmentType}
                  onChange={(e) => updateField('employmentType', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {employmentType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  入社日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => updateField('hireDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>給与形態</Label>
                <Select
                  value={form.payType}
                  onChange={(e) => updateField('payType', e.target.value)}
                >
                  <option value="">未設定</option>
                  {payType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>週間コマ数上限</Label>
                <Input
                  type="number"
                  min="0"
                  max="25"
                  value={form.maxWeeklyLessons}
                  onChange={(e) => updateField('maxWeeklyLessons', e.target.value)}
                  placeholder="常勤: 25"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                資格情報は登録後に詳細画面から追加できます。
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
