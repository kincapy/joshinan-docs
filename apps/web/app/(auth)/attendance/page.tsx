'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
/** ダッシュボードのレスポンス型 */
type DashboardData = {
  month: string
  overallRate: number
  studentCount: number
  alertCount: number
  monthlyRates: {
    id: string
    studentId: string
    month: string
    requiredHours: number
    attendedHours: number
    lateCount: number
    lateAsAbsence: number
    rate: number
    alertLevel: string
    student: {
      id: string
      studentNumber: string
      nameKanji: string | null
      nameEn: string
    }
  }[]
  classRates: {
    classId: string
    className: string
    studentCount: number
    averageRate: number
  }[]
}

export default function AttendanceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [alertOnly, setAlertOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [month, alertOnly])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ month })
      if (alertOnly) params.set('alertOnly', 'true')
      const res = await fetch(`/api/attendance/monthly?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** アラートレベルに応じたバッジ色 */
  function alertBadge(level: string) {
    if (level === 'REPORT_REQUIRED') {
      return <Badge className="bg-red-500 text-white">入管報告必要</Badge>
    }
    if (level === 'GUIDANCE_REQUIRED') {
      return <Badge className="bg-yellow-500 text-white">指導必要</Badge>
    }
    return <Badge variant="secondary">正常</Badge>
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">出席管理</h1>
        <Link href="/attendance/input">
          <Button>出欠入力</Button>
        </Link>
      </div>

      {/* 月選択 */}
      <div className="flex items-center gap-4">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-48"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={alertOnly}
            onChange={(e) => setAlertOnly(e.target.checked)}
          />
          アラート対象のみ
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : data ? (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  全体出席率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {(data.overallRate * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  対象学生数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data.studentCount}名</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  アラート対象
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {data.alertCount}名
                </p>
              </CardContent>
            </Card>
          </div>

          {/* クラス別出席率 */}
          {data.classRates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>クラス別出席率</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>クラス名</TableHead>
                      <TableHead>在籍数</TableHead>
                      <TableHead>平均出席率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.classRates.map((cls) => (
                      <TableRow key={cls.classId}>
                        <TableCell className="font-medium">
                          {cls.className}
                        </TableCell>
                        <TableCell>{cls.studentCount}名</TableCell>
                        <TableCell>
                          <span
                            className={
                              cls.averageRate < 0.8
                                ? 'font-bold text-red-600'
                                : ''
                            }
                          >
                            {(cls.averageRate * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 学生別出席率一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>学生別出席率</CardTitle>
            </CardHeader>
            <CardContent>
              {data.monthlyRates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {month} のデータがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学籍番号</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>出席時間</TableHead>
                      <TableHead>必要時間</TableHead>
                      <TableHead>遅刻</TableHead>
                      <TableHead>出席率</TableHead>
                      <TableHead>状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlyRates.map((rate) => (
                      <TableRow
                        key={rate.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/attendance/students/${rate.studentId}`)
                        }
                      >
                        <TableCell>{rate.student.studentNumber}</TableCell>
                        <TableCell>
                          {rate.student.nameKanji || rate.student.nameEn}
                        </TableCell>
                        <TableCell>{rate.attendedHours}h</TableCell>
                        <TableCell>{rate.requiredHours}h</TableCell>
                        <TableCell>{rate.lateCount}回</TableCell>
                        <TableCell>
                          <span
                            className={
                              rate.rate < 0.5
                                ? 'font-bold text-red-600'
                                : rate.rate < 0.8
                                  ? 'font-bold text-yellow-600'
                                  : ''
                            }
                          >
                            {(rate.rate * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{alertBadge(rate.alertLevel)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ナビゲーション */}
          <div className="flex gap-4">
            <Link href="/attendance/reports">
              <Button variant="outline">半期報告管理</Button>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
