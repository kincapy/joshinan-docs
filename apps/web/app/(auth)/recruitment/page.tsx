'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { CalendarDays, FolderOpen, Users } from 'lucide-react'

/** 募集期サマリーの型 */
type CycleSummary = {
  id: string
  enrollmentMonth: string
  fiscalYear: number
  applicationDeadline: string
  targetCount: number
  applicationCount: number
  grantedCount: number
  grantRate: number
}

/** ステータス別件数の型 */
type CycleDetail = CycleSummary & {
  statusCounts: Record<string, number>
  nationalityCounts: Record<string, number>
}

/** 入学時期の日本語ラベル */
const enrollmentMonthLabel: Record<string, string> = {
  APRIL: '4月',
  OCTOBER: '10月',
}

/** 申請ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  PREPARING: '書類準備中',
  SUBMITTED: '申請済',
  GRANTED: '交付',
  DENIED: '不交付',
  WITHDRAWN: '取下',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'GRANTED') return 'default'
  if (status === 'DENIED') return 'destructive'
  if (status === 'SUBMITTED') return 'secondary'
  return 'outline'
}

/** 募集管理ダッシュボード */
export default function RecruitmentDashboardPage() {
  const [currentCycle, setCurrentCycle] = useState<CycleDetail | null>(null)
  const [cycles, setCycles] = useState<CycleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      /* 募集期一覧を取得 */
      const res = await fetch('/api/recruitment/cycles?page=1')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      const allCycles = json.data as CycleSummary[]
      setCycles(allCycles)

      /* 直近の募集期（applicationDeadline が未来のもの、または最新）の詳細を取得 */
      const now = new Date()
      const upcoming = allCycles.find((c) => new Date(c.applicationDeadline) >= now)
      const target = upcoming || allCycles[0]

      if (target) {
        const detailRes = await fetch(`/api/recruitment/cycles/${target.id}`)
        const detailJson = await detailRes.json()
        if (detailRes.ok) {
          setCurrentCycle(detailJson.data)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">募集管理</h1>
        <div className="flex gap-2">
          <Link href="/recruitment/cycles">
            <Button variant="outline">
              <CalendarDays className="mr-1 h-4 w-4" />
              募集期一覧
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {!currentCycle ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              募集期が登録されていません。
              <Link href="/recruitment/cycles" className="ml-1 underline">
                募集期を登録
              </Link>
              してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 現在の募集期 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {currentCycle.fiscalYear}年 {enrollmentMonthLabel[currentCycle.enrollmentMonth]}入学
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">申請数</p>
                  <p className="text-2xl font-bold">{currentCycle.applicationCount}</p>
                  <p className="text-xs text-muted-foreground">目標: {currentCycle.targetCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">交付数</p>
                  <p className="text-2xl font-bold">{currentCycle.grantedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">交付率</p>
                  <p className="text-2xl font-bold">
                    {(currentCycle.grantRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申請締切</p>
                  <p className="text-lg font-semibold">
                    {new Date(currentCycle.applicationDeadline).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ステータス別件数 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                ステータス別
              </CardTitle>
              <Link href={`/recruitment/cycles/${currentCycle.id}/cases`}>
                <Button size="sm" variant="outline">ケース一覧を見る</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(currentCycle.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Badge variant={statusVariant(status)}>
                      {statusLabel[status] || status}
                    </Badge>
                    <span className="text-lg font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 国籍別内訳 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                国籍別内訳
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(currentCycle.nationalityCounts).length === 0 ? (
                <p className="text-muted-foreground">申請ケースがありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>国籍</TableHead>
                      <TableHead className="text-right">件数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(currentCycle.nationalityCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([nationality, count]) => (
                        <TableRow key={nationality}>
                          <TableCell>{nationality}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
