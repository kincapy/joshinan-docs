'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

/** コホート（入学月）のラベルマップ */
const COHORT_LABELS: Record<string, string> = {
  APRIL: '4月生',
  JULY: '7月生',
  OCTOBER: '10月生',
  JANUARY: '1月生',
}
const COHORT_OPTIONS = ['APRIL', 'JULY', 'OCTOBER', 'JANUARY']

/** 残高フィルタの選択肢 */
const BALANCE_FILTER_OPTIONS = [
  { value: '', label: '全件' },
  { value: 'unpaid', label: '未収金のみ' },
  { value: 'overpaid', label: '過払いのみ' },
]

/** 1ページあたりの表示件数 */
const PAGE_SIZE = 50

/** API レスポンスの残高行（MonthlyBalance + student + lastPaymentDate） */
type BalanceRow = {
  id: string
  studentId: string
  month: string
  balance: number
  student: {
    id: string
    studentNumber: string
    nameKanji: string | null
    nameEn: string
    nationality: string
    cohort: string
  }
  lastPaymentDate: string | null
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

export default function TuitionBalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ
  const [balanceFilter, setBalanceFilter] = useState('')
  const [cohortFilter, setCohortFilter] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('')

  // ページネーション
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [balanceFilter, cohortFilter, nationalityFilter, page])

  /** 残高一覧データを取得する */
  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (balanceFilter) params.set('balanceStatus', balanceFilter)
      if (cohortFilter) params.set('cohort', cohortFilter)
      if (nationalityFilter) params.set('nationality', nationalityFilter)
      params.set('page', String(page))

      const res = await fetch(`/api/tuition/balances?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setRows(json.data)
      setPagination(json.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(
    setter: (v: string) => void,
    value: string,
  ) {
    setter(value)
    setPage(1)
  }

  /** 残高の色分け: プラス=赤(未収)、ゼロ=緑(正常)、マイナス=青(過払い) */
  function balanceStyle(balance: number) {
    if (balance > 0) return 'font-bold text-red-600'
    if (balance < 0) return 'font-bold text-blue-600'
    return 'text-green-600'
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
        <h1 className="text-2xl font-bold">学生別残高一覧</h1>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">残高状態</label>
          <Select
            value={balanceFilter}
            onChange={(e) =>
              handleFilterChange(setBalanceFilter, e.target.value)
            }
          >
            {BALANCE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">コホート</label>
          <Select
            value={cohortFilter}
            onChange={(e) =>
              handleFilterChange(setCohortFilter, e.target.value)
            }
          >
            <option value="">全て</option>
            {COHORT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {COHORT_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <>
          {/* 残高テーブル */}
          <Card>
            <CardContent className="pt-6">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  該当するデータがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学籍番号</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>国籍</TableHead>
                      <TableHead>コホート</TableHead>
                      <TableHead className="text-right">残高</TableHead>
                      <TableHead>最終入金日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.studentId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          (window.location.href = `/tuition/balances/${row.studentId}`)
                        }
                      >
                        <TableCell>{row.student.studentNumber}</TableCell>
                        <TableCell className="font-medium">
                          {row.student.nameKanji || row.student.nameEn}
                        </TableCell>
                        <TableCell>{row.student.nationality || '-'}</TableCell>
                        <TableCell>
                          {row.student.cohort
                            ? COHORT_LABELS[row.student.cohort] || row.student.cohort
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right ${balanceStyle(Number(row.balance))}`}
                        >
                          {Number(row.balance).toLocaleString()}円
                        </TableCell>
                        <TableCell>
                          {row.lastPaymentDate
                            ? String(row.lastPaymentDate).split('T')[0]
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                前のページ
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.totalPages} ページ（全{pagination.total}件）
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                次のページ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
