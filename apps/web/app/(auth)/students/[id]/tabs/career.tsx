'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { careerPath, careerResult } from '@joshinan/domain'
import type { Student } from '../page'
import { labelMaps } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 進路タブ — 進路区分、進路先名、合否 */
export function CareerTab({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
  const { editing, setEditing, saving, error, setError, saveFields } = useEditableTab(student, onUpdate)
  const [form, setForm] = useState<Record<string, string | null>>({})

  function startEditing() {
    setForm({
      careerPath: student.careerPath,
      careerDestination: student.careerDestination,
      careerResult: student.careerResult,
      notes: student.notes,
    })
    setEditing(true)
    setError('')
  }

  function handleSave() {
    saveFields({
      careerPath: form.careerPath || null,
      careerDestination: form.careerDestination || null,
      careerResult: form.careerResult || null,
      notes: form.notes || null,
    })
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

      <Card>
        <CardHeader><CardTitle>進路情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FieldRow
            label="進路区分"
            value={labelMaps.careerPath[student.careerPath as keyof typeof labelMaps.careerPath] ?? '未設定'}
            editing={editing}
            input={
              <Select value={(form.careerPath as string) ?? ''} onChange={(e) => setForm({ ...form, careerPath: e.target.value })}>
                <option value="">未設定</option>
                {careerPath.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow label="進路先名" value={student.careerDestination ?? '未設定'} editing={editing}
            input={<Input value={form.careerDestination ?? ''} onChange={(e) => setForm({ ...form, careerDestination: e.target.value })} />}
          />
          <FieldRow
            label="合否"
            value={labelMaps.careerResult[student.careerResult as keyof typeof labelMaps.careerResult] ?? '未設定'}
            editing={editing}
            input={
              <Select value={(form.careerResult as string) ?? ''} onChange={(e) => setForm({ ...form, careerResult: e.target.value })}>
                <option value="">未設定</option>
                {careerResult.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow label="備考" value={student.notes ?? '未設定'} editing={editing}
            input={<Input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
          />
        </CardContent>
      </Card>
    </div>
  )
}
