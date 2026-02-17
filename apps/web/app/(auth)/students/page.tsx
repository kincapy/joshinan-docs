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
import { studentStatus, cohort } from '@joshinan/domain'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/** API レスポンスの学生型 */
type StudentRow = {
  id: string
  studentNumber: string
  nameKanji: string | null
  nameEn: string
  nationality: string
  status: string
  cohort: string
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** ステータスに応じたバッジのバリアント */
function statusVariant(status: string) {
  switch (status) {
    case 'ENROLLED': return 'default' as const
    case 'PRE_ENROLLMENT': return 'secondary' as const
    case 'GRADUATED':
    case 'COMPLETED': return 'outline' as const
    case 'WITHDRAWN':
    case 'EXPELLED': return 'destructive' as const
    default: return 'secondary' as const
  }
}

/** 学生一覧画面 */
export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ・検索の状態
  const [statusFilter, setStatusFilter] = useState('')
  const [cohortFilter, setCohortFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (cohortFilter) params.set('cohort', cohortFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/students?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setStudents(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, cohortFilter, search, page])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">学生一覧</h1>
        <Button onClick={() => router.push('/students/new')}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {studentStatus.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">コホート</label>
          <Select
            value={cohortFilter}
            onChange={(e) => handleFilterChange(setCohortFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {cohort.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="氏名・学籍番号で検索"
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
      ) : students.length === 0 ? (
        <div className="text-muted-foreground">該当する学生がいません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学籍番号</TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>国籍</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>コホート</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/students/${s.id}`)}
                >
                  <TableCell className="font-mono">{s.studentNumber}</TableCell>
                  <TableCell>
                    <div>{s.nameKanji ?? s.nameEn}</div>
                    {s.nameKanji && (
                      <div className="text-xs text-muted-foreground">{s.nameEn}</div>
                    )}
                  </TableCell>
                  <TableCell>{s.nationality}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(s.status)}>
                      {studentStatus.labelMap[s.status as keyof typeof studentStatus.labelMap] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cohort.labelMap[s.cohort as keyof typeof cohort.labelMap] ?? s.cohort}
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
