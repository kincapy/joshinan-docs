'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { timeSlot } from '@joshinan/domain'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'

/** 時限の型 */
type Period = {
  id: string
  periodNumber: number
  startTime: string
  endTime: string
  timeSlot: string
}

/** フォームの型 */
type PeriodForm = {
  periodNumber: string
  startTime: string
  endTime: string
  timeSlot: string
}

const emptyForm: PeriodForm = {
  periodNumber: '',
  startTime: '',
  endTime: '',
  timeSlot: '',
}

/** 時限設定画面 */
export default function PeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 新規追加フォーム
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<PeriodForm>(emptyForm)
  const [addSaving, setAddSaving] = useState(false)

  // 編集フォーム
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PeriodForm>(emptyForm)
  const [editSaving, setEditSaving] = useState(false)

  const fetchPeriods = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/periods')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)
      setPeriods(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeriods()
  }, [fetchPeriods])

  /** 新規追加 */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddSaving(true)
    setError('')

    try {
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodNumber: Number(addForm.periodNumber),
          startTime: addForm.startTime,
          endTime: addForm.endTime,
          timeSlot: addForm.timeSlot,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setShowAddForm(false)
      setAddForm(emptyForm)
      fetchPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setAddSaving(false)
    }
  }

  /** 編集開始 */
  function startEdit(period: Period) {
    setEditId(period.id)
    setEditForm({
      periodNumber: String(period.periodNumber),
      startTime: period.startTime,
      endTime: period.endTime,
      timeSlot: period.timeSlot,
    })
  }

  /** 編集保存 */
  async function handleEditSave() {
    if (!editId) return
    setEditSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/periods/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodNumber: Number(editForm.periodNumber),
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          timeSlot: editForm.timeSlot,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setEditId(null)
      fetchPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setEditSaving(false)
    }
  }

  /** 削除 */
  async function handleDelete(id: string) {
    if (!confirm('この時限を削除しますか？\n時間割で使用されている場合は削除できません。')) return
    setError('')

    try {
      const res = await fetch(`/api/periods/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)
      fetchPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  /** フォーム入力のレンダリング */
  function renderFormRow(
    form: PeriodForm,
    setForm: (f: PeriodForm) => void,
    onSave: (e: React.FormEvent) => void,
    onCancel: () => void,
    saving: boolean,
  ) {
    return (
      <TableRow>
        <TableCell>
          <Input
            type="number"
            value={form.periodNumber}
            onChange={(e) => setForm({ ...form, periodNumber: e.target.value })}
            className="w-20"
            min={1}
            required
          />
        </TableCell>
        <TableCell>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
        </TableCell>
        <TableCell>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
        </TableCell>
        <TableCell>
          <Select
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            required
          >
            <option value="">選択</option>
            {timeSlot.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" onClick={onSave} disabled={saving}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">時限設定</h1>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        1日の授業時間帯を設定します。午前クラス・午後クラスそれぞれに時限を設定してください。
      </p>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">時限番号</TableHead>
                  <TableHead>開始時刻</TableHead>
                  <TableHead>終了時刻</TableHead>
                  <TableHead>時間帯</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) =>
                  editId === period.id ? (
                    renderFormRow(
                      editForm,
                      setEditForm,
                      handleEditSave,
                      () => setEditId(null),
                      editSaving,
                    )
                  ) : (
                    <TableRow key={period.id}>
                      <TableCell className="font-mono">{period.periodNumber}</TableCell>
                      <TableCell>{period.startTime}</TableCell>
                      <TableCell>{period.endTime}</TableCell>
                      <TableCell>
                        {timeSlot.labelMap[period.timeSlot as keyof typeof timeSlot.labelMap] ?? period.timeSlot}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(period)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(period.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
                {/* 新規追加行 */}
                {showAddForm &&
                  renderFormRow(
                    addForm,
                    setAddForm,
                    handleAdd,
                    () => { setShowAddForm(false); setAddForm(emptyForm) },
                    addSaving,
                  )
                }
                {periods.length === 0 && !showAddForm && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      時限が設定されていません。「追加」ボタンから時限を登録してください。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
