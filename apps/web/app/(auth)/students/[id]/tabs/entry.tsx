'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Student } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 入国情報タブ — 入国日、入国空港、便名、出迎え担当 */
export function EntryTab({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
  const { editing, setEditing, saving, error, setError, saveFields } = useEditableTab(student, onUpdate)
  const [form, setForm] = useState<Record<string, string | null>>({})

  function startEditing() {
    setForm({
      entryDate: student.entryDate?.split('T')[0] ?? '',
      entryAirport: student.entryAirport,
      flightNumber: student.flightNumber,
    })
    setEditing(true)
    setError('')
  }

  function handleSave() {
    saveFields({
      entryDate: form.entryDate || null,
      entryAirport: form.entryAirport || null,
      flightNumber: form.flightNumber || null,
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

      <Card>
        <CardHeader><CardTitle>入国情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FieldRow label="入国日" value={fmtDate(student.entryDate)} editing={editing}
            input={<Input type="date" value={(form.entryDate as string) ?? ''} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />}
          />
          <FieldRow label="入国空港" value={student.entryAirport ?? '未設定'} editing={editing}
            input={<Input value={form.entryAirport ?? ''} onChange={(e) => setForm({ ...form, entryAirport: e.target.value })} />}
          />
          <FieldRow label="便名" value={student.flightNumber ?? '未設定'} editing={editing}
            input={<Input value={form.flightNumber ?? ''} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} />}
          />
          {/* 出迎え担当は読み取り専用（スタッフ選択 UI は将来対応） */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">出迎え担当</label>
            <p className="text-sm font-medium">{student.pickupStaffId ?? '未設定'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
