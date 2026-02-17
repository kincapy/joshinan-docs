'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus } from 'lucide-react'

/** 募集期の型 */
type CycleRow = {
  id: string
  enrollmentMonth: string
  fiscalYear: number
  applicationDeadline: string
  targetCount: number
  applicationCount: number
  grantedCount: number
  grantRate: number
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 入学時期の日本語ラベル */
const enrollmentMonthLabel: Record<string, string> = {
  APRIL: '4月',
  OCTOBER: '10月',
}

/** 募集期一覧画面 */
export default function RecruitmentCyclesPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState<CycleRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  /* 新規登録ダイアログ */
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    enrollmentMonth: 'APRIL',
    fiscalYear: new Date().getFullYear(),
    applicationDeadline: '',
    visaResultDate: '',
    entryStartDate: '',
    targetCount: 0,
  })

  const fetchCycles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/recruitment/cycles?page=${page}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setCycles(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

  /** 募集期を新規登録 */
  async function handleCreate() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          visaResultDate: formData.visaResultDate || null,
          entryStartDate: formData.entryStartDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      setShowDialog(false)
      fetchCycles()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/recruitment')}>
            <ArrowLeft className="h-4 w-4" />
            ダッシュボード
          </Button>
          <h1 className="text-2xl font-bold">募集期一覧</h1>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" />
          募集期登録
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : cycles.length === 0 ? (
        <div className="text-muted-foreground">募集期がありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>年度</TableHead>
                <TableHead>入学時期</TableHead>
                <TableHead>申請締切</TableHead>
                <TableHead className="text-right">目標</TableHead>
                <TableHead className="text-right">申請数</TableHead>
                <TableHead className="text-right">交付数</TableHead>
                <TableHead className="text-right">交付率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/recruitment/cycles/${c.id}/cases`)}
                >
                  <TableCell className="font-semibold">{c.fiscalYear}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {enrollmentMonthLabel[c.enrollmentMonth] || c.enrollmentMonth}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(c.applicationDeadline).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-right">{c.targetCount}</TableCell>
                  <TableCell className="text-right">{c.applicationCount}</TableCell>
                  <TableCell className="text-right">{c.grantedCount}</TableCell>
                  <TableCell className="text-right">
                    {(c.grantRate * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.totalPages} ページ（全 {pagination.total} 件）
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}

      {/* 新規登録ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>募集期を登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>入学時期</Label>
                <Select
                  value={formData.enrollmentMonth}
                  onChange={(e) => setFormData({ ...formData, enrollmentMonth: e.target.value })}
                >
                  <option value="APRIL">4月</option>
                  <option value="OCTOBER">10月</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>年度（西暦）</Label>
                <Input
                  type="number"
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>書類申請締切日</Label>
              <Input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>ビザ結果予定日（任意）</Label>
              <Input
                type="date"
                value={formData.visaResultDate}
                onChange={(e) => setFormData({ ...formData, visaResultDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>入国開始日（任意）</Label>
              <Input
                type="date"
                value={formData.entryStartDate}
                onChange={(e) => setFormData({ ...formData, entryStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>募集目標人数</Label>
              <Input
                type="number"
                value={formData.targetCount}
                onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? '登録中...' : '登録'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
