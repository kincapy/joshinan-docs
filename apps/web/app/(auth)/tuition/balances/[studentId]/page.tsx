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
import { ArrowLeft, CreditCard } from 'lucide-react'

/** 入金方法のラベルマップ */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: '現金',
  BANK_TRANSFER: '銀行振込',
}

/** 請求ステータスのラベル・バッジ設定 */
const INVOICE_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'secondary' | 'default' }
> = {
  ISSUED: { label: '未決済', variant: 'secondary' },
  SETTLED: { label: '完了', variant: 'default' },
}

type StudentInfo = {
  id: string
  studentNumber: string
  nameKanji: string | null
  nameEn: string
  nationality: string
  cohort: string
  status: string
}

/** API レスポンスの MonthlyBalance */
type MonthlyBalanceRow = {
  id: string
  month: string
  previousBalance: number
  monthlyCharge: number
  monthlyPayment: number
  balance: number
}

/** API レスポンスの Invoice（billingItem 含む） */
type InvoiceRow = {
  id: string
  billingMonth: string
  amount: number
  status: string
  billingItem: { name: string }
}

/** API レスポンスの Payment */
type PaymentRow = {
  id: string
  paymentDate: string
  amount: number
  method: string
  notes: string | null
}

type StudentBalanceData = {
  student: StudentInfo
  balanceHistory: MonthlyBalanceRow[]
  invoices: InvoiceRow[]
  payments: PaymentRow[]
}

export default function StudentBalanceDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = use(params)
  const [data, setData] = useState<StudentBalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [studentId])

  /** 学生別残高詳細データを取得する */
  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tuition/balances/${studentId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** 残高の色分け */
  function balanceStyle(balance: number) {
    if (balance > 0) return 'font-bold text-red-600'
    if (balance < 0) return 'font-bold text-blue-600'
    return 'text-green-600'
  }

  /** 請求ステータスのバッジ */
  function invoiceStatusBadge(status: string) {
    const config = INVOICE_STATUS_CONFIG[status]
    if (!config) return <Badge variant="outline">{status}</Badge>
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* ヘッダー: 学生基本情報 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tuition/balances">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {data.student.nameKanji || data.student.nameEn}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.student.studentNumber}
              {data.student.nationality && ` / ${data.student.nationality}`}
            </p>
          </div>
        </div>
        <Link href={`/tuition/payments/new?studentId=${studentId}`}>
          <Button>
            <CreditCard className="h-4 w-4" />
            入金登録
          </Button>
        </Link>
      </div>

      {/* 現在の残高（最新月の balance を表示） */}
      {data.balanceHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              現在の残高
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl ${balanceStyle(Number(data.balanceHistory[data.balanceHistory.length - 1].balance))}`}>
              {Number(data.balanceHistory[data.balanceHistory.length - 1].balance).toLocaleString()}円
            </p>
          </CardContent>
        </Card>
      )}

      {/* 月次残高推移テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>月次残高推移</CardTitle>
        </CardHeader>
        <CardContent>
          {data.balanceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              残高推移データがありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>月</TableHead>
                  <TableHead className="text-right">前月末残高</TableHead>
                  <TableHead className="text-right">当月請求額</TableHead>
                  <TableHead className="text-right">当月入金額</TableHead>
                  <TableHead className="text-right">当月末残高</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.balanceHistory.map((mb) => (
                  <TableRow key={mb.month}>
                    <TableCell className="font-medium">{mb.month}</TableCell>
                    <TableCell className="text-right">
                      {Number(mb.previousBalance).toLocaleString()}円
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(mb.monthlyCharge).toLocaleString()}円
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(mb.monthlyPayment).toLocaleString()}円
                    </TableCell>
                    <TableCell
                      className={`text-right ${balanceStyle(Number(mb.balance))}`}
                    >
                      {Number(mb.balance).toLocaleString()}円
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 請求履歴テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>請求履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              請求履歴がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>対象月</TableHead>
                  <TableHead>品目名</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.billingMonth}
                    </TableCell>
                    <TableCell>{inv.billingItem.name}</TableCell>
                    <TableCell className="text-right">
                      {Number(inv.amount).toLocaleString()}円
                    </TableCell>
                    <TableCell>{invoiceStatusBadge(inv.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 入金履歴テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>入金履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              入金履歴がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入金日</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell className="font-medium">
                      {String(pay.paymentDate).split('T')[0]}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(pay.amount).toLocaleString()}円
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[pay.method] || pay.method}
                    </TableCell>
                    <TableCell>{pay.notes || '-'}</TableCell>
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
