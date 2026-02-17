'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { enrollmentMonth } from '@joshinan/domain'
import type { EnrollmentMonth } from '@joshinan/domain'
import { Plus, Trash2 } from 'lucide-react'

/** 入学時期データの型 */
type EnrollmentPeriod = {
  id: string
  schoolId: string
  enrollmentMonth: string
  durationMonths: number
  fiscalYear: number
  recruitmentCapacity: number
}

/** 入学時期設定画面 — テーブル形式で一覧表示・ダイアログで登録/編集 */
export default function EnrollmentPeriodsPage() {
  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([])
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('')

  // ダイアログ状態
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<EnrollmentPeriod | null>(null)

  const fetchPeriods = useCallback(async (sid: string) => {
    try {
      const query = fiscalYearFilter ? `?fiscalYear=${fiscalYearFilter}` : ''
      const res = await fetch(`/api/schools/${sid}/enrollment-periods${query}`)
      const json = await res.json()
      setPeriods(json.data ?? [])
    } catch {
      setError('入学時期の取得に失敗しました')
    }
  }, [fiscalYearFilter])

  useEffect(() => {
    async function init() {
      try {
        // まず学校IDを取得
        const res = await fetch('/api/schools')
        const json = await res.json()
        if (json.data && json.data.length > 0) {
          const sid = json.data[0].id
          setSchoolId(sid)
          await fetchPeriods(sid)
        }
      } catch {
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [fetchPeriods])

  useEffect(() => {
    if (schoolId) fetchPeriods(schoolId)
  }, [schoolId, fiscalYearFilter, fetchPeriods])

  function openNewDialog() {
    setEditingPeriod(null)
    setDialogOpen(true)
  }

  function openEditDialog(period: EnrollmentPeriod) {
    setEditingPeriod(period)
    setDialogOpen(true)
  }

  async function handleDelete(periodId: string) {
    if (!schoolId || !confirm('この入学時期を削除しますか？')) return

    try {
      const res = await fetch(`/api/schools/${schoolId}/enrollment-periods/${periodId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || '削除に失敗しました')
      }
      await fetchPeriods(schoolId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setEditingPeriod(null)
    if (schoolId) fetchPeriods(schoolId)
  }

  if (loading) {
    return <div className="text-muted-foreground">読み込み中...</div>
  }

  if (!schoolId) {
    return (
      <div className="text-muted-foreground">
        学校情報が登録されていません。先に学校設定を行ってください。
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">入学時期設定</h1>
        <Button size="sm" onClick={openNewDialog}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 年度フィルタ */}
      <div className="flex items-center gap-2">
        <Label>年度</Label>
        <Input
          type="number"
          placeholder="例: 2026"
          className="w-32"
          value={fiscalYearFilter}
          onChange={(e) => setFiscalYearFilter(e.target.value)}
        />
        {fiscalYearFilter && (
          <Button variant="ghost" size="sm" onClick={() => setFiscalYearFilter('')}>
            クリア
          </Button>
        )}
      </div>

      {/* 入学時期テーブル */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>年度</TableHead>
            <TableHead>入学月</TableHead>
            <TableHead>在籍期間</TableHead>
            <TableHead>募集定員</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                データがありません
              </TableCell>
            </TableRow>
          ) : (
            periods.map((period) => (
              <TableRow
                key={period.id}
                className="cursor-pointer"
                onClick={() => openEditDialog(period)}
              >
                <TableCell>{period.fiscalYear}</TableCell>
                <TableCell>
                  {enrollmentMonth.labelMap[period.enrollmentMonth as EnrollmentMonth] ?? period.enrollmentMonth}
                </TableCell>
                <TableCell>{period.durationMonths}ヶ月</TableCell>
                <TableCell>{period.recruitmentCapacity}名</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(period.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 登録/編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriod ? '入学時期を編集' : '入学時期を登録'}</DialogTitle>
          </DialogHeader>
          <EnrollmentPeriodForm
            schoolId={schoolId}
            period={editingPeriod}
            onClose={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 入学時期の登録/編集フォーム */
function EnrollmentPeriodForm({
  schoolId,
  period,
  onClose,
}: {
  schoolId: string
  period: EnrollmentPeriod | null
  onClose: () => void
}) {
  const [month, setMonth] = useState<string>(period?.enrollmentMonth ?? '')
  const [fiscalYear, setFiscalYear] = useState<string>(period?.fiscalYear?.toString() ?? '')
  const [capacity, setCapacity] = useState<string>(period?.recruitmentCapacity?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 入学月に連動して在籍期間を表示（編集不可）
  const durationMonths = month
    ? enrollmentMonth.getDurationMonths(month as EnrollmentMonth)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = period
        ? `/api/schools/${schoolId}/enrollment-periods/${period.id}`
        : `/api/schools/${schoolId}/enrollment-periods`

      const res = await fetch(url, {
        method: period ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentMonth: month,
          fiscalYear: Number(fiscalYear),
          recruitmentCapacity: Number(capacity),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '保存に失敗しました')

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>年度</Label>
        <Input
          type="number"
          placeholder="例: 2026"
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label>入学月</Label>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} required>
          <option value="">選択してください</option>
          {enrollmentMonth.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label>在籍期間（月数）</Label>
        {/* 在籍期間は入学月から自動設定。手動変更は不可 */}
        <Input
          type="number"
          value={durationMonths ?? ''}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">入学月に連動して自動設定されます</p>
      </div>

      <div className="space-y-1">
        <Label>募集定員</Label>
        <Input
          type="number"
          placeholder="例: 40"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          キャンセル
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  )
}
