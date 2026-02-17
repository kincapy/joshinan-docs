'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { staffRole, employmentType } from '@joshinan/domain'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/** API レスポンスの教職員型 */
type StaffRow = {
  id: string
  name: string
  email: string | null
  role: string
  employmentType: string
  isActive: boolean
  maxWeeklyLessons: number | null
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 在職/退職に応じたバッジのバリアント */
function activeVariant(isActive: boolean) {
  return isActive ? 'default' as const : 'secondary' as const
}

/** 教職員一覧画面 */
export default function StaffListPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ・検索の状態
  const [roleFilter, setRoleFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (roleFilter) params.set('role', roleFilter)
      if (employmentTypeFilter) params.set('employmentType', employmentTypeFilter)
      if (isActiveFilter) params.set('isActive', isActiveFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/staff?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setStaff(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [roleFilter, employmentTypeFilter, isActiveFilter, search, page])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">教職員一覧</h1>
        <Button onClick={() => router.push('/staff/new')}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">役職</label>
          <Select
            value={roleFilter}
            onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {staffRole.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">雇用形態</label>
          <Select
            value={employmentTypeFilter}
            onChange={(e) => handleFilterChange(setEmploymentTypeFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {employmentType.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">在職状況</label>
          <Select
            value={isActiveFilter}
            onChange={(e) => handleFilterChange(setIsActiveFilter, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="true">在職</option>
            <option value="false">退職</option>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="氏名・メールで検索"
            className="pl-8 w-64"
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
          />
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : staff.length === 0 ? (
        <div className="text-muted-foreground">該当する教職員がいません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>役職</TableHead>
                <TableHead>雇用形態</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>週間コマ数上限</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/staff/${s.id}`)}
                >
                  <TableCell>
                    <div>{s.name}</div>
                    {s.email && (
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {staffRole.labelMap[s.role as keyof typeof staffRole.labelMap] ?? s.role}
                  </TableCell>
                  <TableCell>
                    {employmentType.labelMap[s.employmentType as keyof typeof employmentType.labelMap] ?? s.employmentType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={activeVariant(s.isActive)}>
                      {s.isActive ? '在職' : '退職'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.maxWeeklyLessons !== null ? `${s.maxWeeklyLessons}コマ` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                全{pagination.total}件中 {(pagination.page - 1) * pagination.per + 1}〜
                {Math.min(pagination.page * pagination.per, pagination.total)}件
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  次へ
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
