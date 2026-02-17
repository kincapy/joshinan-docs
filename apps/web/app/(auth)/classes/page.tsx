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
import { timeSlot, jlptLevel, cefrLevel } from '@joshinan/domain'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/** クラス一覧行の型 */
type ClassRow = {
  id: string
  name: string
  jlptLevel: string | null
  cefrLevel: string | null
  timeSlot: string
  isSubClass: boolean
  maxStudents: number
  startDate: string
  endDate: string
  _count: { classEnrollments: number }
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** クラス一覧画面 */
export default function ClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ・検索の状態
  const [filterType, setFilterType] = useState('active')
  const [classType, setClassType] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('filter', filterType)
      if (classType) params.set('classType', classType)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/classes?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setClasses(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filterType, classType, search, page])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  /** 日付をフォーマット */
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">クラス一覧</h1>
        <Button onClick={() => router.push('/classes/new')}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">表示条件</label>
          <Select
            value={filterType}
            onChange={(e) => handleFilterChange(setFilterType, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="active">開講中</option>
            <option value="upcoming">開講予定</option>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">クラスタイプ</label>
          <Select
            value={classType}
            onChange={(e) => handleFilterChange(setClassType, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="regular">サブクラスなし</option>
            <option value="subclass">サブクラスのみ</option>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="クラス名で検索"
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
      ) : classes.length === 0 ? (
        <div className="text-muted-foreground">該当するクラスがありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>クラス名</TableHead>
                <TableHead>JLPT</TableHead>
                <TableHead>CEFR</TableHead>
                <TableHead>時間帯</TableHead>
                <TableHead>在籍人数</TableHead>
                <TableHead>期間</TableHead>
                <TableHead>タイプ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/classes/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    {c.jlptLevel
                      ? jlptLevel.labelMap[c.jlptLevel as keyof typeof jlptLevel.labelMap]
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {c.cefrLevel
                      ? cefrLevel.labelMap[c.cefrLevel as keyof typeof cefrLevel.labelMap]
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {timeSlot.labelMap[c.timeSlot as keyof typeof timeSlot.labelMap]}
                  </TableCell>
                  <TableCell>
                    {c._count.classEnrollments} / {c.maxStudents}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(c.startDate)} 〜 {formatDate(c.endDate)}
                  </TableCell>
                  <TableCell>
                    {c.isSubClass && (
                      <Badge variant="secondary">サブクラス</Badge>
                    )}
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
