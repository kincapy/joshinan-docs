'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Student } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 在留情報タブ — パスポート、在留カード、在留資格、資格外活動許可 */
export function ResidenceTab({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
  const { editing, setEditing, saving, error, setError, saveFields } = useEditableTab(student, onUpdate)
  const [form, setForm] = useState<Record<string, string | boolean | null>>({})

  function startEditing() {
    setForm({
      passportNumber: student.passportNumber,
      residenceCardNumber: student.residenceCardNumber,
      residenceStatus: student.residenceStatus,
      residenceExpiry: student.residenceExpiry?.split('T')[0] ?? '',
      workPermitStatus: student.workPermitStatus,
      workPermitDate: student.workPermitDate?.split('T')[0] ?? '',
      workPermitExpiry: student.workPermitExpiry?.split('T')[0] ?? '',
      healthInsuranceNumber: student.healthInsuranceNumber,
      healthInsuranceDate: student.healthInsuranceDate?.split('T')[0] ?? '',
    })
    setEditing(true)
    setError('')
  }

  function handleSave() {
    saveFields({
      passportNumber: (form.passportNumber as string) || null,
      residenceCardNumber: (form.residenceCardNumber as string) || null,
      residenceStatus: (form.residenceStatus as string) || null,
      residenceExpiry: (form.residenceExpiry as string) || null,
      workPermitStatus: form.workPermitStatus as boolean,
      workPermitDate: (form.workPermitDate as string) || null,
      workPermitExpiry: (form.workPermitExpiry as string) || null,
      healthInsuranceNumber: (form.healthInsuranceNumber as string) || null,
      healthInsuranceDate: (form.healthInsuranceDate as string) || null,
    })
  }

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
          <CardHeader><CardTitle>在留情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldRow label="パスポート番号" value={student.passportNumber ?? '未設定'} editing={editing}
              input={<Input value={(form.passportNumber as string) ?? ''} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} />}
            />
            <FieldRow label="在留カード番号" value={student.residenceCardNumber ?? '未設定'} editing={editing}
              input={<Input value={(form.residenceCardNumber as string) ?? ''} onChange={(e) => setForm({ ...form, residenceCardNumber: e.target.value })} />}
            />
            <FieldRow label="在留資格" value={student.residenceStatus ?? '未設定'} editing={editing}
              input={<Input value={(form.residenceStatus as string) ?? ''} onChange={(e) => setForm({ ...form, residenceStatus: e.target.value })} />}
            />
            <FieldRow label="在留期限" value={fmtDate(student.residenceExpiry)} editing={editing}
              input={<Input type="date" value={(form.residenceExpiry as string) ?? ''} onChange={(e) => setForm({ ...form, residenceExpiry: e.target.value })} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>資格外活動許可・保険</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldRow
              label="資格外活動許可"
              value={student.workPermitStatus ? '許可済み' : '未許可'}
              editing={editing}
              input={
                <Select
                  value={String(form.workPermitStatus ?? false)}
                  onChange={(e) => setForm({ ...form, workPermitStatus: e.target.value === 'true' })}
                >
                  <option value="false">未許可</option>
                  <option value="true">許可済み</option>
                </Select>
              }
            />
            <FieldRow label="許可日" value={fmtDate(student.workPermitDate)} editing={editing}
              input={<Input type="date" value={(form.workPermitDate as string) ?? ''} onChange={(e) => setForm({ ...form, workPermitDate: e.target.value })} />}
            />
            <FieldRow label="許可期限" value={fmtDate(student.workPermitExpiry)} editing={editing}
              input={<Input type="date" value={(form.workPermitExpiry as string) ?? ''} onChange={(e) => setForm({ ...form, workPermitExpiry: e.target.value })} />}
            />
            <FieldRow label="健康保険番号" value={student.healthInsuranceNumber ?? '未設定'} editing={editing}
              input={<Input value={(form.healthInsuranceNumber as string) ?? ''} onChange={(e) => setForm({ ...form, healthInsuranceNumber: e.target.value })} />}
            />
            <FieldRow label="健康保険加入日" value={fmtDate(student.healthInsuranceDate)} editing={editing}
              input={<Input type="date" value={(form.healthInsuranceDate as string) ?? ''} onChange={(e) => setForm({ ...form, healthInsuranceDate: e.target.value })} />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
