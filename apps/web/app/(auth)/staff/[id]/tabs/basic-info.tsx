'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { staffRole, employmentType, payType } from '@joshinan/domain'
import type { StaffDetail } from '../page'
import { FieldRow, EditableTabHeader, useEditableTab } from './edit-helpers'

/** 日付文字列を表示用にフォーマット（YYYY-MM-DD → YYYY年MM月DD日） */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 日付文字列を input[type=date] 用に変換（ISO → YYYY-MM-DD） */
function toInputDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

/** 基本情報タブ */
export function BasicInfoTab({
  staff,
  onUpdate,
}: {
  staff: StaffDetail
  onUpdate: () => void
}) {
  const { editing, setEditing, saving, error, saveFields } = useEditableTab(staff, onUpdate)

  // 編集用フォーム状態
  const [form, setForm] = useState({
    name: staff.name,
    email: staff.email ?? '',
    phone: staff.phone ?? '',
    role: staff.role,
    employmentType: staff.employmentType,
    hireDate: toInputDate(staff.hireDate),
    resignationDate: toInputDate(staff.resignationDate),
    payType: staff.payType ?? '',
    maxWeeklyLessons: staff.maxWeeklyLessons?.toString() ?? '',
  })

  function handleEdit() {
    // 編集開始時にフォームをリセット
    setForm({
      name: staff.name,
      email: staff.email ?? '',
      phone: staff.phone ?? '',
      role: staff.role,
      employmentType: staff.employmentType,
      hireDate: toInputDate(staff.hireDate),
      resignationDate: toInputDate(staff.resignationDate),
      payType: staff.payType ?? '',
      maxWeeklyLessons: staff.maxWeeklyLessons?.toString() ?? '',
    })
    setEditing(true)
  }

  function handleSave() {
    saveFields({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      role: form.role,
      employmentType: form.employmentType,
      hireDate: form.hireDate,
      resignationDate: form.resignationDate || null,
      payType: form.payType || null,
      maxWeeklyLessons: form.maxWeeklyLessons
        ? parseInt(form.maxWeeklyLessons, 10)
        : null,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <EditableTabHeader
          editing={editing}
          saving={saving}
          onEdit={handleEdit}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FieldRow
            label="氏名"
            value={staff.name}
            editing={editing}
            input={
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            }
          />
          <FieldRow
            label="メールアドレス"
            value={staff.email ?? '—'}
            editing={editing}
            input={
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            }
          />
          <FieldRow
            label="電話番号"
            value={staff.phone ?? '—'}
            editing={editing}
            input={
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            }
          />
          <FieldRow
            label="役職"
            value={staffRole.labelMap[staff.role as keyof typeof staffRole.labelMap] ?? staff.role}
            editing={editing}
            input={
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {staffRole.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow
            label="雇用形態"
            value={employmentType.labelMap[staff.employmentType as keyof typeof employmentType.labelMap] ?? staff.employmentType}
            editing={editing}
            input={
              <Select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              >
                {employmentType.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow
            label="入社日"
            value={formatDate(staff.hireDate)}
            editing={editing}
            input={
              <Input
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
              />
            }
          />
          <FieldRow
            label="退職日"
            value={formatDate(staff.resignationDate)}
            editing={editing}
            input={
              <Input
                type="date"
                value={form.resignationDate}
                onChange={(e) => setForm({ ...form, resignationDate: e.target.value })}
              />
            }
          />
          <FieldRow
            label="給与形態"
            value={staff.payType
              ? (payType.labelMap[staff.payType as keyof typeof payType.labelMap] ?? staff.payType)
              : '—'
            }
            editing={editing}
            input={
              <Select
                value={form.payType}
                onChange={(e) => setForm({ ...form, payType: e.target.value })}
              >
                <option value="">未設定</option>
                {payType.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            }
          />
          <FieldRow
            label="週間コマ数上限"
            value={staff.maxWeeklyLessons !== null ? `${staff.maxWeeklyLessons}コマ` : '—'}
            editing={editing}
            input={
              <Input
                type="number"
                min="0"
                max="25"
                value={form.maxWeeklyLessons}
                onChange={(e) => setForm({ ...form, maxWeeklyLessons: e.target.value })}
              />
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
