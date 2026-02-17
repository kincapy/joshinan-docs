'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, Plus } from 'lucide-react'

/** API レスポンスのタスク型 */
type TaskRow = {
  id: string
  taskType: string
  trigger: string
  deadline: string
  status: string
  legalBasis: string | null
  student: { id: string; studentNumber: string; nameEn: string; nameKanji: string | null } | null
  _count: { documents: number }
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** タスク種別の日本語ラベル */
const taskTypeLabel: Record<string, string> = {
  WITHDRAWAL_REPORT: '退学者報告',
  LOW_ATTENDANCE_REPORT: '出席率5割未満報告',
  ENROLLMENT_NOTIFICATION: '受入れ開始届出',
  DEPARTURE_NOTIFICATION: '受入れ終了届出',
  MISSING_PERSON_REPORT: '所在不明者報告',
  CHANGE_NOTIFICATION: '変更届出',
  COE_APPLICATION: 'COE交付申請',
  VISA_RENEWAL: '在留期間更新',
}

/** ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  DONE: '完了',
  OVERDUE: '期限超過',
}

/** トリガーの日本語ラベル */
const triggerLabel: Record<string, string> = {
  EVENT: 'イベント',
  SCHEDULE: 'スケジュール',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'OVERDUE') return 'destructive'
  if (status === 'DONE') return 'secondary'
  if (status === 'IN_PROGRESS') return 'default'
  return 'outline'
}

/** タスク一覧画面 */
export default function ImmigrationTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* フィルタ */
  const [statusFilter, setStatusFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [triggerFilter, setTriggerFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      if (statusFilter) params.set('status', statusFilter)
      if (taskTypeFilter) params.set('taskType', taskTypeFilter)
      if (triggerFilter) params.set('trigger', triggerFilter)

      const res = await fetch(`/api/immigration/tasks?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setTasks(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, taskTypeFilter, triggerFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  /* フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/immigration')}>
            <ArrowLeft className="h-4 w-4" />
            ダッシュボード
          </Button>
          <h1 className="text-2xl font-bold">入管タスク一覧</h1>
        </div>
        <Link href="/immigration/tasks/new">
          <Button>
            <Plus className="h-4 w-4" />
            タスク登録
          </Button>
        </Link>
      </div>

      {/* フィルタ */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="TODO">未着手</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="DONE">完了</option>
            <option value="OVERDUE">期限超過</option>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">種別</label>
          <Select
            value={taskTypeFilter}
            onChange={(e) => handleFilterChange(setTaskTypeFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {Object.entries(taskTypeLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">トリガー</label>
          <Select
            value={triggerFilter}
            onChange={(e) => handleFilterChange(setTriggerFilter, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="EVENT">イベント</option>
            <option value="SCHEDULE">スケジュール</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-muted-foreground">タスクがありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>種別</TableHead>
                <TableHead>トリガー</TableHead>
                <TableHead>対象学生</TableHead>
                <TableHead>期限</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">書類数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/immigration/tasks/${t.id}`)}
                >
                  <TableCell>{taskTypeLabel[t.taskType] || t.taskType}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{triggerLabel[t.trigger] || t.trigger}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.student
                      ? `${t.student.studentNumber} ${t.student.nameKanji || t.student.nameEn}`
                      : '-'}
                  </TableCell>
                  <TableCell>{t.deadline}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(t.status)}>
                      {statusLabel[t.status] || t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{t._count.documents}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.totalPages} ページ（全 {pagination.total} 件）
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
