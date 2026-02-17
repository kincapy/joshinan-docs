'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const FIELD_LABELS: Record<string, string> = {
  NURSING_CARE: '介護',
  ACCOMMODATION: '宿泊',
  FOOD_SERVICE: '外食業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  AUTO_TRANSPORT: '自動車運送業',
}

type CompanyRow = {
  id: string
  name: string
  representative: string
  phone: string
  field: string
  caseCount: number
  activeCaseCount: number
}

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fieldFilter, setFieldFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (fieldFilter) params.set('field', fieldFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))

    const res = await fetch(`/api/ssw/companies?${params.toString()}`)
    const json = await res.json()
    setCompanies(json.data || [])
    if (json.pagination) setTotalPages(json.pagination.totalPages)
    setLoading(false)
  }, [fieldFilter, search, page])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">企業一覧</h1>
        <Button onClick={() => router.push('/ssw/companies/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新規企業
        </Button>
      </div>

      {/* フィルタ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm text-muted-foreground">分野</label>
              <select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={fieldFilter}
                onChange={(e) => handleFilterChange(setFieldFilter, e.target.value)}
              >
                <option value="">すべて</option>
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">企業名</label>
              <input
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
          <CardTitle>企業</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">読み込み中...</p>
          ) : companies.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">企業がありません</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>企業名</TableHead>
                    <TableHead>代表者</TableHead>
                    <TableHead>分野</TableHead>
                    <TableHead>電話番号</TableHead>
                    <TableHead>案件数</TableHead>
                    <TableHead>有効案件</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/ssw/companies/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.representative}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{FIELD_LABELS[c.field] || c.field}</Badge>
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.caseCount}</TableCell>
                      <TableCell>{c.activeCaseCount}</TableCell>
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
