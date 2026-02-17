'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Pencil, Save, X } from 'lucide-react'
import type { Student } from '../page'

/** フィールド表示行 — 閲覧モードと編集モードを切り替える */
export function FieldRow({
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

/** 編集可能タブのヘッダー（編集・保存・キャンセルボタン） */
export function EditableTabHeader({
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: {
  editing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="flex justify-end">
      {!editing ? (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          編集
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" />
            キャンセル
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** 編集可能タブの共通ロジック */
export function useEditableTab(student: Student, onUpdate: () => void) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveFields(fields: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')
      setEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return { editing, setEditing, saving, error, setError, saveFields }
}
