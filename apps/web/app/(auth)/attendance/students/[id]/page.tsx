'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
/** 出欠ステータスのラベルマップ（フロント用） */
const attendanceStatusLabelMap: Record<string, string> = {
  PRESENT: '出席',
  ABSENT: '欠席',
  LATE: '遅刻',
  EARLY_LEAVE: '早退',
  EXCUSED: '公欠',
  SUSPENDED: '出停',
}

type MonthlyRate = {
  id: string
  month: string
  requiredHours: number
  attendedHours: number
  lateCount: number
  lateAsAbsence: number
  rate: number
  alertLevel: string
}

type RecentRecord = {
  id: string
  date: string
  period: number
  status: string
}

type StudentData = {
  student: {
    id: string
    studentNumber: string
    nameKanji: string | null
    nameEn: string
  }
  monthlyRates: MonthlyRate[]
  recentRecords: RecentRecord[]
}

export default function StudentAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/attendance/monthly/${id}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** アラートレベルのバッジ */
  function alertBadge(level: string) {
    if (level === 'REPORT_REQUIRED') {
      return <Badge className="bg-red-500 text-white">入管報告必要</Badge>
    }
    if (level === 'GUIDANCE_REQUIRED') {
      return <Badge className="bg-yellow-500 text-white">指導必要</Badge>
    }
    return <Badge variant="secondary">正常</Badge>
  }

  /** 出席率に応じたスタイル */
  function rateStyle(rate: number) {
    if (rate < 0.5) return 'font-bold text-red-600'
    if (rate < 0.8) return 'font-bold text-yellow-600'
    return ''
  }

  /** 出欠ステータスのラベル */
  function statusLabel(status: string) {
    return attendanceStatusLabelMap[status] || status
  }

  /** 出欠ステータスのバッジ色 */
  function statusBadge(status: string) {
    switch (status) {
      case 'PRESENT':
      case 'EXCUSED':
        return <Badge variant="secondary">{statusLabel(status)}</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-500 text-white">{statusLabel(status)}</Badge>
      case 'LATE':
        return <Badge className="bg-yellow-500 text-white">{statusLabel(status)}</Badge>
      default:
        return <Badge variant="outline">{statusLabel(status)}</Badge>
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (!data) return null

  // 直近の月次出席率からアラートレベルを取得
  const latestRate = data.monthlyRates.length > 0
    ? data.monthlyRates[data.monthlyRates.length - 1]
    : null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {data.student.nameKanji || data.student.nameEn}
          </h1>
          <span className="text-sm text-muted-foreground">
            {data.student.studentNumber}
          </span>
          {latestRate && alertBadge(latestRate.alertLevel)}
        </div>
        <Link href="/attendance">
          <Button variant="outline">戻る</Button>
        </Link>
      </div>

      {/* 基準ラインの説明 */}
      <Card>
        <CardHeader>
          <CardTitle>出席率基準</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <span>
              <span className="font-medium">80%以上</span>: 問題なし
            </span>
            <span className="text-yellow-600">
              <span className="font-medium">50〜80%</span>: 指導必要
            </span>
            <span className="text-red-600">
              <span className="font-medium">50%未満</span>: 入管報告必要
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 月次出席率推移テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>月次出席率推移</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyRates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              出席データがありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>年月</TableHead>
                  <TableHead>出席時間</TableHead>
                  <TableHead>必要時間</TableHead>
                  <TableHead>遅刻</TableHead>
                  <TableHead>遅刻換算</TableHead>
                  <TableHead>出席率</TableHead>
                  <TableHead>状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.monthlyRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.month}</TableCell>
                    <TableCell>{rate.attendedHours}h</TableCell>
                    <TableCell>{rate.requiredHours}h</TableCell>
                    <TableCell>{rate.lateCount}回</TableCell>
                    <TableCell>{rate.lateAsAbsence}回</TableCell>
                    <TableCell>
                      <span className={rateStyle(rate.rate)}>
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

      {/* 直近の出欠記録 */}
      <Card>
        <CardHeader>
          <CardTitle>直近の出欠記録（3ヶ月分）</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              出欠記録がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>時限</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date.split('T')[0]}</TableCell>
                    <TableCell>{record.period}限</TableCell>
                    <TableCell>{statusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
