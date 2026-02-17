'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react'

/** 定期報告の型 */
type ScheduledReport = {
  id: string
  reportType: string
  fiscalYear: number
  deadline: string
  status: string
  completedAt: string | null
  notes: string | null
}

/** 報告種別の日本語ラベル */
const reportTypeLabel: Record<string, string> = {
  ENROLLMENT_COUNT_MAY: '在籍者数届出（5月）',
  ENROLLMENT_COUNT_NOV: '在籍者数届出（11月）',
  ATTENDANCE_FIRST_HALF: '出席率報告（前期）',
  ATTENDANCE_SECOND_HALF: '出席率報告（後期）',
  PERIODIC_INSPECTION: '定期点検報告書',
  COURSE_COMPLETION: '課程修了者報告',
  OPERATION_STATUS: '運営状況報告（文科省）',
  BUSINESS_PLAN: '事業計画書',
}

/** ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  DONE: '完了',
  OVERDUE: '期限超過',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'OVERDUE') return 'destructive'
  if (status === 'DONE') return 'secondary'
  if (status === 'IN_PROGRESS') return 'default'
  return 'outline'
}

/** 6月集中期間の報告かどうか */
function isJuneDeadline(reportType: string): boolean {
  return ['ATTENDANCE_SECOND_HALF', 'PERIODIC_INSPECTION', 'COURSE_COMPLETION', 'OPERATION_STATUS'].includes(reportType)
}

/** 定期報告一覧画面 */
export default function ImmigrationReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  /* 年度フィルタ（デフォルト: 現在の年度） */
  const currentFiscalYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/immigration/reports?fiscalYear=${fiscalYear}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setReports(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [fiscalYear])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  /** 年度の定期報告を一括生成 */
  async function generateReports() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/immigration/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '生成に失敗しました')
      fetchReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 定期報告のステータスを更新 */
  async function updateReportStatus(report: ScheduledReport, newStatus: string) {
    try {
      const res = await fetch('/api/immigration/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || '更新に失敗しました')
      }
      fetchReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/immigration')}>
            <ArrowLeft className="h-4 w-4" />
            ダッシュボード
          </Button>
          <h1 className="text-2xl font-bold">定期報告一覧</h1>
        </div>
      </div>

      {/* 年度フィルタ + 一括生成 */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">対象年度</label>
          <Input
            type="number"
            className="w-32"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            min={2000}
            max={2100}
          />
        </div>
        <Button onClick={generateReports} disabled={saving} variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          {saving ? '生成中...' : `${fiscalYear}年度の報告を生成`}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 6月集中期間の注意 */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <CalendarDays className="h-4 w-4" />
            <span className="font-semibold">6月集中期間:</span>
            出席率報告（後期）、定期点検報告書、課程修了者報告、運営状況報告の4件が6月末に集中します
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : reports.length === 0 ? (
        <div className="text-muted-foreground">
          {fiscalYear}年度の定期報告がありません。「生成」ボタンで作成してください。
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>報告種別</TableHead>
              <TableHead>期限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>完了日</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow
                key={r.id}
                className={isJuneDeadline(r.reportType) ? 'bg-yellow-50/50' : ''}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {reportTypeLabel[r.reportType] || r.reportType}
                    {isJuneDeadline(r.reportType) && (
                      <Badge variant="outline" className="text-xs text-yellow-700">6月集中</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{r.deadline}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>
                    {statusLabel[r.status] || r.status}
                  </Badge>
                </TableCell>
                <TableCell>{r.completedAt || '-'}</TableCell>
                <TableCell>
                  {r.status !== 'DONE' && (
                    <div className="flex gap-1">
                      {r.status === 'TODO' && (
                        <Button size="sm" variant="outline" onClick={() => updateReportStatus(r, 'IN_PROGRESS')}>
                          着手
                        </Button>
                      )}
                      <Button size="sm" onClick={() => updateReportStatus(r, 'DONE')}>
                        完了
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
