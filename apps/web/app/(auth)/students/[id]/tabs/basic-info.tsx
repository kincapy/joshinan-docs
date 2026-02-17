'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { gender } from '@joshinan/domain'
import type { Student } from '../page'
import { labelMaps } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 基本情報タブ — 氏名、生年月日、性別、国籍、連絡先、住所 */
export function BasicInfoTab({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
  const { editing, setEditing, saving, error, setError, saveFields } = useEditableTab(student, onUpdate)
  const [form, setForm] = useState<Record<string, string | null>>({})

  function startEditing() {
    setForm({
      nameEn: student.nameEn,
      nameKanji: student.nameKanji,
      nameKana: student.nameKana,
      dateOfBirth: student.dateOfBirth?.split('T')[0] ?? '',
      gender: student.gender,
      nationality: student.nationality,
      phone: student.phone,
      email: student.email,
      addressJapan: student.addressJapan,
      addressHome: student.addressHome,
      emergencyContactName: student.emergencyContactName,
      emergencyContactPhone: student.emergencyContactPhone,
    })
    setEditing(true)
    setError('')
  }

  function handleSave() {
    saveFields({
      nameEn: form.nameEn,
      nameKanji: form.nameKanji || null,
      nameKana: form.nameKana || null,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      nationality: form.nationality,
      phone: form.phone || null,
      email: form.email || null,
      addressJapan: form.addressJapan || null,
      addressHome: form.addressHome || null,
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
    })
  }

  /** 日付を日本語表記にフォーマット */
  function fmtDate(v: string | null) {
    if (!v) return '未設定'
    return new Date(v).toLocaleDateString('ja-JP')
  }

  return (
    <div className="space-y-4">
      <EditableTabHeader
        editing={editing} saving={saving}
        onEdit={startEditing}
        onCancel={() => { setEditing(false); setError('') }}
        onSave={handleSave}
      />
      {error && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>氏名・属性</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldRow label="氏名（英語）" value={student.nameEn} editing={editing}
              input={<Input value={form.nameEn ?? ''} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />}
            />
            <FieldRow label="氏名（漢字）" value={student.nameKanji ?? '未設定'} editing={editing}
              input={<Input value={form.nameKanji ?? ''} onChange={(e) => setForm({ ...form, nameKanji: e.target.value })} />}
            />
            <FieldRow label="氏名（カナ）" value={student.nameKana ?? '未設定'} editing={editing}
              input={<Input value={form.nameKana ?? ''} onChange={(e) => setForm({ ...form, nameKana: e.target.value })} />}
            />
            <FieldRow label="生年月日" value={fmtDate(student.dateOfBirth)} editing={editing}
              input={<Input type="date" value={(form.dateOfBirth as string) ?? ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />}
            />
            <FieldRow
              label="性別"
              value={labelMaps.gender[student.gender as keyof typeof labelMaps.gender] ?? student.gender}
              editing={editing}
              input={
                <Select value={(form.gender as string) ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  {gender.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              }
            />
            <FieldRow label="国籍" value={student.nationality} editing={editing}
              input={<Input value={form.nationality ?? ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>連絡先</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldRow label="電話番号" value={student.phone ?? '未設定'} editing={editing}
              input={<Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
            />
            <FieldRow label="メールアドレス" value={student.email ?? '未設定'} editing={editing}
              input={<Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
            />
            <FieldRow label="日本の住所" value={student.addressJapan ?? '未設定'} editing={editing}
              input={<Input value={form.addressJapan ?? ''} onChange={(e) => setForm({ ...form, addressJapan: e.target.value })} />}
            />
            <FieldRow label="母国の住所" value={student.addressHome ?? '未設定'} editing={editing}
              input={<Input value={form.addressHome ?? ''} onChange={(e) => setForm({ ...form, addressHome: e.target.value })} />}
            />
            <FieldRow label="緊急連絡先（氏名）" value={student.emergencyContactName ?? '未設定'} editing={editing}
              input={<Input value={form.emergencyContactName ?? ''} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />}
            />
            <FieldRow label="緊急連絡先（電話）" value={student.emergencyContactPhone ?? '未設定'} editing={editing}
              input={<Input value={form.emergencyContactPhone ?? ''} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
