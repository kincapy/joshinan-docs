'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { studentStatus, preEnrollmentStatus, cohort } from '@joshinan/domain'
import type { Student } from '../page'
import { labelMaps } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 学籍情報タブ — 学籍番号、ステータス、コホート、入学日、卒業予定日 */
export function EnrollmentTab({ student, onUpdate }: { student: Student; onUpdate: () => void }) {
  const { editing, setEditing, saving, error, setError, saveFields } = useEditableTab(student, onUpdate)
  const [form, setForm] = useState<Record<string, string | null>>({})

  function startEditing() {
    setForm({
      status: student.status,
      preEnrollmentStatus: student.preEnrollmentStatus,
      cohort: student.cohort,
      enrollmentDate: student.enrollmentDate?.split('T')[0] ?? '',
      expectedGraduationDate: student.expectedGraduationDate?.split('T')[0] ?? '',
    })
    setEditing(true)
    setError('')
  }

  function handleSave() {
    saveFields({
      status: form.status,
      preEnrollmentStatus: form.preEnrollmentStatus || null,
      cohort: form.cohort,
      enrollmentDate: form.enrollmentDate || null,
      expectedGraduationDate: form.expectedGraduationDate || null,
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
        <CardHeader><CardTitle>学籍情報</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* 学籍番号は読み取り専用 */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">学籍番号</label>
            <p className="text-sm font-medium font-mono">{student.studentNumber}</p>
          </div>
          <FieldRow
            label="ステータス"
            value={labelMaps.studentStatus[student.status as keyof typeof labelMaps.studentStatus] ?? student.status}
            editing={editing}
            input={
              <Select value={(form.status as string) ?? ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {studentStatus.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          {/* 入学前詳細ステータスは PRE_ENROLLMENT の場合のみ表示 */}
          {(student.status === 'PRE_ENROLLMENT' || form.status === 'PRE_ENROLLMENT') && (
            <FieldRow
              label="入学前詳細ステータス"
              value={labelMaps.preEnrollmentStatus[student.preEnrollmentStatus as keyof typeof labelMaps.preEnrollmentStatus] ?? student.preEnrollmentStatus ?? '未設定'}
              editing={editing}
              input={
                <Select value={(form.preEnrollmentStatus as string) ?? ''} onChange={(e) => setForm({ ...form, preEnrollmentStatus: e.target.value })}>
                  <option value="">未設定</option>
                  {preEnrollmentStatus.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              }
            />
          )}
          <FieldRow
            label="コホート"
            value={labelMaps.cohort[student.cohort as keyof typeof labelMaps.cohort] ?? student.cohort}
            editing={editing}
            input={
              <Select value={(form.cohort as string) ?? ''} onChange={(e) => setForm({ ...form, cohort: e.target.value })}>
                {cohort.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow label="入学日" value={fmtDate(student.enrollmentDate)} editing={editing}
            input={<Input type="date" value={(form.enrollmentDate as string) ?? ''} onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })} />}
          />
          <FieldRow label="卒業予定日" value={fmtDate(student.expectedGraduationDate)} editing={editing}
            input={<Input type="date" value={(form.expectedGraduationDate as string) ?? ''} onChange={(e) => setForm({ ...form, expectedGraduationDate: e.target.value })} />}
          />
          {/* エージェント（読み取り専用） */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">エージェント</label>
            <p className="text-sm font-medium">{student.agent?.name ?? '未設定'}</p>
          </div>
          {/* 退学情報（退学時のみ表示） */}
          {student.status === 'WITHDRAWN' && (
            <>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">退学日</label>
                <p className="text-sm font-medium">{fmtDate(student.withdrawalDate)}</p>
              </div>
              <FieldRow label="退学理由" value={student.withdrawalReason ?? '未設定'} editing={editing}
                input={<Input value={form.withdrawalReason ?? student.withdrawalReason ?? ''} onChange={(e) => setForm({ ...form, withdrawalReason: e.target.value })} />}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
