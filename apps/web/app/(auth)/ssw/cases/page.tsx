'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

/** 分野の日本語ラベル */
const FIELD_LABELS: Record<string, string> = {
  NURSING_CARE: '介護',
  ACCOMMODATION: '宿泊',
  FOOD_SERVICE: '外食業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  AUTO_TRANSPORT: '自動車運送業',
}

/** ステータスの日本語ラベル・色 */
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PROSPECTING: { label: '営業中', variant: 'outline' },
  PREPARING: { label: '書類準備中', variant: 'secondary' },
  APPLIED: { label: '申請中', variant: 'secondary' },
  REVIEWING: { label: '審査中', variant: 'secondary' },
  APPROVED: { label: '許可済み', variant: 'default' },
  EMPLOYED: { label: '入社済み', variant: 'default' },
  SUPPORTING: { label: '支援中', variant: 'default' },
  CLOSED: { label: '終了', variant: 'destructive' },
}

type SswCase = {
  id: string
  field: string
  status: string
  applicationDate: string | null
  approvalDate: string | null
  entryDate: string | null
  documentProgress: number
  company: { id: string; name: string }
  student: { id: string; nameEn: string; nameKanji: string | null; studentNumber: string }
  updatedAt: string
}

export default function SswCasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<SswCase[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [fieldFilter, setFieldFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (fieldFilter) params.set('field', fieldFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/ssw/cases?${params.toString()}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setCases(json.data || [])
      if (json.pagination) setTotalPages(json.pagination.totalPages)
    } catch (err) {
      console.error(err)
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, fieldFilter, search, page])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件一覧</h1>
        <Button onClick={() => router.push('/ssw/cases/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新規案件
        </Button>
      </div>

      {/* フィルタ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">ステータス</Label>
              <Select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              >
                <option value="">すべて</option>
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">分野</Label>
              <Select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={fieldFilter}
                onChange={(e) => handleFilterChange(setFieldFilter, e.target.value)}
              >
                <option value="">すべて</option>
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
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
          </div>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>案件</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">読み込み中...</p>
          ) : cases.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">案件がありません</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead>企業</TableHead>
                    <TableHead>分野</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>書類進捗</TableHead>
                    <TableHead>申請日</TableHead>
                    <TableHead>許可日</TableHead>
                    <TableHead>入社日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/ssw/cases/${c.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {c.student.nameKanji || c.student.nameEn}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.student.studentNumber}
                        </div>
                      </TableCell>
                      <TableCell>{c.company.name}</TableCell>
                      <TableCell>{FIELD_LABELS[c.field] || c.field}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[c.status]?.variant || 'outline'}>
                          {STATUS_CONFIG[c.status]?.label || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${c.documentProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {c.documentProgress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.applicationDate?.slice(0, 10) || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.approvalDate?.slice(0, 10) || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.entryDate?.slice(0, 10) || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
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
