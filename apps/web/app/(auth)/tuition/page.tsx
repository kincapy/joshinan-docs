'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  AlertTriangle,
  ArrowDownLeft,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  List,
} from 'lucide-react'

/** 入金方法のラベルマップ */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: '現金',
  BANK_TRANSFER: '銀行振込',
}

/** ダッシュボードのレスポンス型（API の戻り値に合わせる） */
type DashboardData = {
  month: string
  receivableSummary: { studentCount: number; totalAmount: number }
  overpaidSummary: { studentCount: number; totalAmount: number }
  monthlySales: {
    itemName: string
    count: number
    amount: number
  }[]
  recentPayments: {
    id: string
    paymentDate: string
    amount: number
    method: string
    student: {
      id: string
      studentNumber: string
      nameKanji: string | null
      nameEn: string
    }
  }[]
}

export default function TuitionDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [month])

  /** ダッシュボードデータを取得する */
  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ month })
      const res = await fetch(`/api/tuition/dashboard?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <h1 className="text-2xl font-bold">学費管理</h1>

      {/* 月選択 */}
      <div className="flex items-center gap-4">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-48"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : data ? (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 未収金 */}
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  未収金
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {data.receivableSummary.totalAmount.toLocaleString()}円
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.receivableSummary.studentCount}名
                </p>
              </CardContent>
            </Card>

            {/* 過払い */}
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <ArrowDownLeft className="h-4 w-4" />
                  過払い
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.abs(data.overpaidSummary.totalAmount).toLocaleString()}円
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.overpaidSummary.studentCount}名
                </p>
              </CardContent>
            </Card>

            {/* 当月売上 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  当月売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {data.monthlySales.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}円
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 品目別売上テーブル */}
          {data.monthlySales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>品目別売上</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>品目名</TableHead>
                      <TableHead>件数</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlySales.map((item) => (
                      <TableRow key={item.itemName}>
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.count}件</TableCell>
                        <TableCell className="text-right">
                          {item.amount.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 直近5件の入金テーブル */}
          <Card>
            <CardHeader>
              <CardTitle>直近の入金</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  入金記録がありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生名</TableHead>
                      <TableHead>入金日</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>方法</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.student.nameKanji || p.student.nameEn}
                        </TableCell>
                        <TableCell>{String(p.paymentDate).split('T')[0]}</TableCell>
                        <TableCell className="text-right">
                          {Number(p.amount).toLocaleString()}円
                        </TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[p.method] || p.method}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-4">
            <Link href="/tuition/balances">
              <Button variant="outline">
                <List className="h-4 w-4" />
                残高一覧
              </Button>
            </Link>
            <Link href="/tuition/invoices/new">
              <Button variant="outline">
                <Receipt className="h-4 w-4" />
                請求作成
              </Button>
            </Link>
            <Link href="/tuition/payments/new">
              <Button variant="outline">
                <CreditCard className="h-4 w-4" />
                入金登録
              </Button>
            </Link>
            <Link href="/tuition/reports">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4" />
                経理表出力
              </Button>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
