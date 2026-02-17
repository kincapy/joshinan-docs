'use client'

import { useState } from 'react'
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
import { ArrowLeft, Download, Search } from 'lucide-react'

type ReportRow = {
  itemName: string
  count: number
  amount: number
}

/** API レスポンス: { month, salesByItem, totalSales } */
type ReportData = {
  month: string
  salesByItem: ReportRow[]
  totalSales: number
}

export default function TuitionReportsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /** 経理表データを取得する */
  async function fetchReport() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ month })
      const res = await fetch(`/api/tuition/reports?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** CSV をクライアントサイドで生成してダウンロードする */
  function handleDownloadCsv() {
    if (!data) return

    // BOM付き UTF-8 で出力（Excel で文字化けを防ぐ）
    const bom = '\uFEFF'
    const header = '品目名,件数,金額'
    const rows = data.salesByItem.map(
      (r) => `"${r.itemName}",${r.count},${r.amount}`,
    )
    // 合計行を追加
    rows.push(`"合計",${data.salesByItem.reduce((sum, r) => sum + r.count, 0)},${data.totalSales}`)
    const csv = bom + [header, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `経理表_${data.month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/tuition">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">経理表出力</h1>
      </div>

      {/* 月選択 + 表示ボタン */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">対象月</label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={fetchReport} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? '読み込み中...' : '表示'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 経理表テーブル */}
      {data && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{data.month} 経理表</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                <Download className="h-4 w-4" />
                CSVダウンロード
              </Button>
            </CardHeader>
            <CardContent>
              {data.salesByItem.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  該当するデータがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>品目名</TableHead>
                      <TableHead className="text-right">件数</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.salesByItem.map((row) => (
                      <TableRow key={row.itemName}>
                        <TableCell className="font-medium">
                          {row.itemName}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.count}件
                        </TableCell>
                        <TableCell className="text-right">
                          {row.amount.toLocaleString()}円
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* 合計行 */}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell>合計</TableCell>
                      <TableCell className="text-right">
                        {data.salesByItem.reduce((sum, r) => sum + r.count, 0)}件
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totalSales.toLocaleString()}円
                      </TableCell>
                    </TableRow>
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
