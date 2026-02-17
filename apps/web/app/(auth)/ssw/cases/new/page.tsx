'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

const FIELD_OPTIONS = [
  { value: 'NURSING_CARE', label: '介護' },
  { value: 'ACCOMMODATION', label: '宿泊' },
  { value: 'FOOD_SERVICE', label: '外食業' },
  { value: 'FOOD_MANUFACTURING', label: '飲食料品製造業' },
  { value: 'AUTO_TRANSPORT', label: '自動車運送業' },
]

type Company = { id: string; name: string }
type Student = { id: string; nameEn: string; nameKanji: string | null; studentNumber: string }

type CaseForm = {
  companyId: string
  studentId: string
  field: string
  referralFee: number
  monthlySupportFee: number
  notes: string
}

const emptyForm: CaseForm = {
  companyId: '',
  studentId: '',
  field: '',
  referralFee: 150000,
  monthlySupportFee: 10000,
  notes: '',
}

export default function NewCasePage() {
  const router = useRouter()
  const [form, setForm] = useState<CaseForm>(emptyForm)
  const [companies, setCompanies] = useState<Company[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 企業・学生の選択肢を取得
  const fetchOptions = useCallback(async () => {
    try {
      const [compRes, stuRes] = await Promise.all([
        fetch('/api/ssw/companies?limit=200'),
        fetch('/api/students?per=200'),
      ])
      if (!compRes.ok || !stuRes.ok) throw new Error('選択肢の取得に失敗しました')
      const compJson = await compRes.json()
      const stuJson = await stuRes.json()
      setCompanies(compJson.data || [])
      setStudents(stuJson.data || [])
    } catch (err) {
      console.error(err)
      setCompanies([])
      setStudents([])
    }
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  function updateField<K extends keyof CaseForm>(field: K, value: CaseForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyId || !form.studentId || !form.field) {
      setError('企業・学生・分野は必須です')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/ssw/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message || '登録に失敗しました')
        return
      }

      router.push(`/ssw/cases/${json.data.id}`)
    } catch (err) {
      console.error(err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ssw/cases')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">案件登録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>案件情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* 企業 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  企業 <span className="text-destructive">*</span>
                </Label>
                <Select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.companyId}
                  onChange={(e) => updateField('companyId', e.target.value)}
                >
                  <option value="">選択してください</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>

              {/* 学生 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  学生 <span className="text-destructive">*</span>
                </Label>
                <Select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.studentId}
                  onChange={(e) => updateField('studentId', e.target.value)}
                >
                  <option value="">選択してください</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentNumber} - {s.nameKanji || s.nameEn}
                    </option>
                  ))}
                </Select>
              </div>

              {/* 分野 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  分野 <span className="text-destructive">*</span>
                </Label>
                <Select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.field}
                  onChange={(e) => updateField('field', e.target.value)}
                >
                  <option value="">選択してください</option>
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>

              {/* 紹介料 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">紹介料（円）</Label>
                <Input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.referralFee}
                  onChange={(e) => updateField('referralFee', Number(e.target.value))}
                />
              </div>

              {/* 月額支援費 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">月額支援費（円）</Label>
                <Input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.monthlySupportFee}
                  onChange={(e) => updateField('monthlySupportFee', Number(e.target.value))}
                />
              </div>
            </div>

            {/* 備考 */}
            <div>
              <Label className="mb-1 block text-sm font-medium">備考</Label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
