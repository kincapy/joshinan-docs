'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const FIELD_OPTIONS = [
  { value: 'NURSING_CARE', label: '介護' },
  { value: 'ACCOMMODATION', label: '宿泊' },
  { value: 'FOOD_SERVICE', label: '外食業' },
  { value: 'FOOD_MANUFACTURING', label: '飲食料品製造業' },
  { value: 'AUTO_TRANSPORT', label: '自動車運送業' },
]

type CompanyForm = {
  name: string
  representative: string
  postalCode: string
  address: string
  phone: string
  field: string
  businessLicense: string
  corporateNumber: string
  establishedDate: string
  notes: string
}

const emptyForm: CompanyForm = {
  name: '',
  representative: '',
  postalCode: '',
  address: '',
  phone: '',
  field: '',
  businessLicense: '',
  corporateNumber: '',
  establishedDate: '',
  notes: '',
}

export default function NewCompanyPage() {
  const router = useRouter()
  const [form, setForm] = useState<CompanyForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField<K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.representative || !form.address || !form.phone || !form.field) {
      setError('企業名・代表者名・所在地・電話番号・分野は必須です')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/ssw/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        corporateNumber: form.corporateNumber || null,
        establishedDate: form.establishedDate || null,
        postalCode: form.postalCode || undefined,
        businessLicense: form.businessLicense || undefined,
        notes: form.notes || undefined,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message || '登録に失敗しました')
      setSaving(false)
      return
    }

    router.push(`/ssw/companies/${json.data.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ssw/companies')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">企業登録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>企業情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  企業名 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  代表者名 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.representative}
                  onChange={(e) => updateField('representative', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">郵便番号</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  所在地 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  電話番号 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  分野 <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.field}
                  onChange={(e) => updateField('field', e.target.value)}
                >
                  <option value="">選択してください</option>
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">営業許可</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.businessLicense}
                  onChange={(e) => updateField('businessLicense', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">法人番号（13桁）</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  maxLength={13}
                  value={form.corporateNumber}
                  onChange={(e) => updateField('corporateNumber', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">設立年月日</label>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.establishedDate}
                  onChange={(e) => updateField('establishedDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">備考</label>
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
