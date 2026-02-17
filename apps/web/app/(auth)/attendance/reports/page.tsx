'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
/** 出席率報告期間の定義（フロント用） */
const attendanceTermOptions = [
  { value: 'FIRST_HALF', label: '前期' },
  { value: 'SECOND_HALF', label: '後期' },
] as const

const attendanceTermLabelMap: Record<string, string> = {
  FIRST_HALF: '前期',
  SECOND_HALF: '後期',
}

type Report = {
  id: string
  term: string
  fiscalYear: number
  overallRate: number
  deadline: string
  reportStatus: string
  reportedAt: string | null
  createdAt: string
}

export default function AttendanceReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 報告生成フォーム
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateTerm, setGenerateTerm] = useState<string>('FIRST_HALF')
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/attendance/reports')
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setReports(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '報告の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** 報告データ生成 */
  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/attendance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: generateTerm,
          fiscalYear: generateYear,
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setShowGenerateDialog(false)
      fetchReports()
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  /** 報告状態を更新 */
  async function updateStatus(reportId: string, status: string) {
    try {
      const res = await fetch(`/api/attendance/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportStatus: status }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      fetchReports()
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  /** 期間のラベル */
  function termLabel(term: string) {
    return (
      attendanceTermLabelMap[term] || term
    )
  }

  /** 報告状態のバッジ */
  function statusBadge(status: string) {
    if (status === 'SUBMITTED') {
      return <Badge className="bg-green-500 text-white">提出済み</Badge>
    }
    return <Badge variant="outline">未提出</Badge>
  }

  /** 期限が過ぎているか判定 */
  function isOverdue(deadline: string, status: string) {
    return status === 'PENDING' && new Date(deadline) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">半期報告管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerateDialog(true)}>
            報告書生成
          </Button>
          <Link href="/attendance">
            <Button variant="outline">戻る</Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 報告一覧 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            報告データがありません。「報告書生成」ボタンから作成してください。
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>年度</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead>全体出席率</TableHead>
                  <TableHead>報告期限</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>報告日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.fiscalYear}年度
                    </TableCell>
                    <TableCell>{termLabel(report.term)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          report.overallRate < 0.8
                            ? 'font-bold text-red-600'
                            : ''
                        }
                      >
                        {(report.overallRate * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isOverdue(report.deadline, report.reportStatus)
                            ? 'font-bold text-red-600'
                            : ''
                        }
                      >
                        {report.deadline.split('T')[0]}
                      </span>
                      {isOverdue(report.deadline, report.reportStatus) && (
                        <Badge className="ml-2 bg-red-500 text-white">
                          期限超過
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(report.reportStatus)}</TableCell>
                    <TableCell>
                      {report.reportedAt
                        ? report.reportedAt.split('T')[0]
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {report.reportStatus === 'PENDING' ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(report.id, 'SUBMITTED')
                          }
                        >
                          提出済みにする
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatus(report.id, 'PENDING')
                          }
                        >
                          未提出に戻す
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 報告書生成ダイアログ */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>報告書を生成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                対象期間 <span className="text-red-500">*</span>
              </label>
              <Select
                value={generateTerm}
                onChange={(e) => setGenerateTerm(e.target.value)}
              >
                {attendanceTermOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                対象年度 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={generateYear}
                onChange={(e) => setGenerateYear(Number(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              対象期間の全学生の出席率を集計し、報告データを生成します。
              既に同じ期間の報告がある場合は出席率のみ更新されます。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(false)}
              >
                キャンセル
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? '生成中...' : '生成'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
