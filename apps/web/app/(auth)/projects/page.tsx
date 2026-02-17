'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { projectStatus } from '@joshinan/domain'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

/** プロジェクト一覧行の型 */
type ProjectRow = {
  id: string
  name: string
  status: string
  progress: number
  skill: { id: string; name: string }
  _count: { members: number }
  createdAt: string
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** プロジェクトステータスに応じた Badge variant を返す */
function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'ACTIVE': return 'default'
    case 'COMPLETED': return 'secondary'
    case 'SUSPENDED': return 'outline'
    case 'CANCELLED': return 'destructive'
    default: return 'outline'
  }
}

/** プロジェクト一覧画面 */
export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタの状態
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      params.set('page', String(page))

      const res = await fetch(`/api/projects?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setProjects(json.data)
      setPagination(json.pagination)
    } catch (err) {
      console.error('プロジェクト一覧の取得に失敗:', err)
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, page])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  /** フィルタ変更時はページを1に戻す */
  function handleStatusChange(value: string) {
    setFilterStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">プロジェクト</h1>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* ステータスフィルタ */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">全て</option>
            {projectStatus.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : projects.length === 0 ? (
        <div className="text-muted-foreground">該当するプロジェクトがありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>プロジェクト名</TableHead>
                <TableHead>スキル</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>進捗率</TableHead>
                <TableHead>メンバー数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.skill.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>
                      {projectStatus.labelMap[p.status as keyof typeof projectStatus.labelMap]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* プログレスバー */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{p._count.members}名</TableCell>
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
