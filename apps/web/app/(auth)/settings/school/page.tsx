'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { corporateType, accreditationClass } from '@joshinan/domain'
import { Pencil, Save, X } from 'lucide-react'

/** 学校データの型 */
type School = {
  id: string
  name: string
  schoolCode: string
  address: string
  phone: string | null
  corporateName: string
  corporateType: string
  accreditationClass: string
  notificationNumber: string | null
  capacity: number
  establishedDate: string
  isActive: boolean
}

/** 学校設定画面 — 学校マスタの閲覧・インライン編集 */
export default function SchoolSettingsPage() {
  const [school, setSchool] = useState<School | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<School>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSchool()
  }, [])

  async function fetchSchool() {
    try {
      const res = await fetch('/api/schools')
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        setSchool(json.data[0])
      }
    } catch {
      setError('学校情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function startEditing() {
    if (!school) return
    setForm({ ...school })
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setForm({})
    setError('')
  }

  async function handleSave() {
    if (!school) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          schoolCode: form.schoolCode,
          address: form.address,
          phone: form.phone || null,
          corporateName: form.corporateName,
          corporateType: form.corporateType,
          accreditationClass: form.accreditationClass,
          notificationNumber: form.notificationNumber || null,
          capacity: Number(form.capacity),
          establishedDate: form.establishedDate,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')

      setSchool(json.data)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">読み込み中...</div>
  }

  if (!school) {
    return (
      <div className="text-muted-foreground">
        学校情報が登録されていません。管理者にお問い合わせください。
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">学校設定</h1>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
            編集
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
              <X className="h-4 w-4" />
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow label="学校名" value={school.name} editing={editing}
              input={<Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
            />
            <FieldRow label="学校番号" value={school.schoolCode} editing={editing}
              input={<Input value={form.schoolCode ?? ''} onChange={(e) => setForm({ ...form, schoolCode: e.target.value })} />}
            />
            <FieldRow label="所在地" value={school.address} editing={editing}
              input={<Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />}
            />
            <FieldRow label="電話番号" value={school.phone ?? '未設定'} editing={editing}
              input={<Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>法人・認定情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldRow label="運営法人名" value={school.corporateName} editing={editing}
              input={<Input value={form.corporateName ?? ''} onChange={(e) => setForm({ ...form, corporateName: e.target.value })} />}
            />
            <FieldRow
              label="法人種別"
              value={corporateType.labelMap[school.corporateType as keyof typeof corporateType.labelMap] ?? school.corporateType}
              editing={editing}
              input={
                <Select value={form.corporateType ?? ''} onChange={(e) => setForm({ ...form, corporateType: e.target.value })}>
                  {corporateType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              }
            />
            <FieldRow
              label="適正校分類"
              value={accreditationClass.labelMap[school.accreditationClass as keyof typeof accreditationClass.labelMap] ?? school.accreditationClass}
              editing={editing}
              input={
                <Select value={form.accreditationClass ?? ''} onChange={(e) => setForm({ ...form, accreditationClass: e.target.value })}>
                  {accreditationClass.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              }
            />
            <FieldRow label="告示番号" value={school.notificationNumber ?? '未設定'} editing={editing}
              input={<Input value={form.notificationNumber ?? ''} onChange={(e) => setForm({ ...form, notificationNumber: e.target.value })} />}
            />
            <FieldRow label="定員数" value={`${school.capacity}名`} editing={editing}
              input={<Input type="number" value={form.capacity ?? ''} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />}
            />
            <FieldRow
              label="設立年月日"
              value={new Date(school.establishedDate).toLocaleDateString('ja-JP')}
              editing={editing}
              input={<Input type="date" value={form.establishedDate?.split('T')[0] ?? ''} onChange={(e) => setForm({ ...form, establishedDate: e.target.value })} />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** フィールド表示行 — 閲覧モードと編集モードを切り替える */
function FieldRow({
  label,
  value,
  editing,
  input,
}: {
  label: string
  value: string
  editing: boolean
  input: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      {editing ? input : <p className="text-sm font-medium">{value}</p>}
    </div>
  )
}
