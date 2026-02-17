'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const INVOICE_TYPE_LABELS: Record<string, string> = {
  REFERRAL: '紹介料',
  SUPPORT: '登録支援費',
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  ISSUED: '発行済み',
  PAID: '入金済み',
  OVERDUE: '未入金',
}

const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '下書き' },
  { value: 'ISSUED', label: '発行済み' },
  { value: 'PAID', label: '入金済み' },
  { value: 'OVERDUE', label: '未入金' },
]

type InvoiceRow = {
  id: string
  invoiceNumber: string
  invoiceType: string
  amount: number
  tax: number
  totalWithTax: number
  issueDate: string
  dueDate: string
  status: string
  company: { id: string; name: string }
  sswCase: {
    id: string
    student: { id: string; nameEn: string; nameKanji: string | null; studentNumber: string }
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [issueMonth, setIssueMonth] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('invoiceType', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      if (issueMonth) params.set('issueMonth', issueMonth)
      params.set('page', String(page))

      const res = await fetch(`/api/ssw/invoices?${params.toString()}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setInvoices(json.data || [])
      if (json.pagination) setTotalPages(json.pagination.totalPages)
    } catch (err) {
      console.error(err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, search, issueMonth, page])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  /** ステータスをインライン変更 */
  async function handleStatusChange(invoiceId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/ssw/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('ステータスの更新に失敗しました')
      fetchInvoices()
    } catch (err) {
      console.error(err)
      alert('ステータスの更新に失敗しました')
    }
  }

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">請求一覧</h1>

      {/* フィルタ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">請求種別</Label>
              <Select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={typeFilter}
                onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
              >
                <option value="">すべて</option>
                <option value="REFERRAL">紹介料</option>
                <option value="SUPPORT">登録支援費</option>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">ステータス</Label>
              <Select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              >
                <option value="">すべて</option>
                {INVOICE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">企業名</Label>
              <Input
                type="text"
                className="ml-2 rounded border px-2 py-1 text-sm"
                placeholder="検索..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">発行月</Label>
              <Input
                type="month"
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={issueMonth}
                onChange={(e) => handleFilterChange(setIssueMonth, e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>請求</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">読み込み中...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">請求がありません</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>請求番号</TableHead>
                    <TableHead>企業</TableHead>
                    <TableHead>学生</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>金額（税込）</TableHead>
                    <TableHead>発行日</TableHead>
                    <TableHead>支払期日</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.company.name}</TableCell>
                      <TableCell>
                        {inv.sswCase.student.nameKanji || inv.sswCase.student.nameEn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {INVOICE_TYPE_LABELS[inv.invoiceType] || inv.invoiceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {inv.totalWithTax.toLocaleString()}円
                      </TableCell>
                      <TableCell>{inv.issueDate?.slice(0, 10)}</TableCell>
                      <TableCell>{inv.dueDate?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <select
                          className="rounded border px-2 py-1 text-xs"
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        >
                          {INVOICE_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
