'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { AlertTriangle, CalendarDays, FileText, Shield } from 'lucide-react'

/** 入管タスクの型 */
type TaskRow = {
  id: string
  taskType: string
  trigger: string
  deadline: string
  status: string
  student: { id: string; studentNumber: string; nameEn: string; nameKanji: string | null } | null
  _count: { documents: number }
}

/** ビザ更新対象の型 */
type VisaStudent = {
  id: string
  studentNumber: string
  nameEn: string
  nameKanji: string | null
  residenceExpiry: string | null
  daysUntilExpiry: number | null
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

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'OVERDUE') return 'destructive'
  if (status === 'DONE') return 'secondary'
  if (status === 'IN_PROGRESS') return 'default'
  return 'outline'
}

/** 入管タスクダッシュボード */
export default function ImmigrationDashboardPage() {
  const router = useRouter()
  const [urgentTasks, setUrgentTasks] = useState<TaskRow[]>([])
  const [visaStudents, setVisaStudents] = useState<VisaStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      /* 期限間近・超過タスクと、ビザ更新対象を並行取得 */
      const [tasksRes, visaRes] = await Promise.all([
        fetch('/api/immigration/tasks?page=1'),
        fetch('/api/immigration/visa-renewals?months=3'),
      ])

      const tasksJson = await tasksRes.json()
      const visaJson = await visaRes.json()
      if (!tasksRes.ok) throw new Error(tasksJson.error?.message || 'タスク取得に失敗')
      if (!visaRes.ok) throw new Error(visaJson.error?.message || 'ビザ情報取得に失敗')

      /* 未完了タスクのうち期限7日以内のものを抽出 */
      const today = new Date()
      const sevenDaysLater = new Date()
      sevenDaysLater.setDate(today.getDate() + 7)

      const urgent = (tasksJson.data as TaskRow[]).filter((t) => {
        if (t.status === 'DONE') return false
        const deadline = new Date(t.deadline)
        return deadline <= sevenDaysLater || t.status === 'OVERDUE'
      })

      setUrgentTasks(urgent)
      setVisaStudents(visaJson.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">入管報告・届出</h1>
        <div className="flex gap-2">
          <Link href="/immigration/tasks">
            <Button variant="outline">
              <FileText className="mr-1 h-4 w-4" />
              タスク一覧
            </Button>
          </Link>
          <Link href="/immigration/reports">
            <Button variant="outline">
              <CalendarDays className="mr-1 h-4 w-4" />
              定期報告
            </Button>
          </Link>
          <Link href="/immigration/visa-renewals">
            <Button variant="outline">
              <Shield className="mr-1 h-4 w-4" />
              ビザ更新管理
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 期限間近アラート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            期限間近のタスク
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgentTasks.length === 0 ? (
            <p className="text-muted-foreground">期限間近のタスクはありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種別</TableHead>
                  <TableHead>対象学生</TableHead>
                  <TableHead>期限</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urgentTasks.map((t) => {
                  const deadline = new Date(t.deadline)
                  const isOverdue = deadline < new Date()
                  return (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/immigration/tasks/${t.id}`)}
                    >
                      <TableCell>{taskTypeLabel[t.taskType] || t.taskType}</TableCell>
                      <TableCell>
                        {t.student
                          ? `${t.student.studentNumber} ${t.student.nameKanji || t.student.nameEn}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? 'font-semibold text-destructive' : ''}>
                          {t.deadline}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.status)}>
                          {statusLabel[t.status] || t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ビザ更新予定 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            ビザ更新予定（3ヶ月以内）
          </CardTitle>
          <Link href="/immigration/visa-renewals">
            <Button size="sm" variant="outline">すべて表示</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {visaStudents.length === 0 ? (
            <p className="text-muted-foreground">ビザ更新が近い学生はいません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学籍番号</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>在留期限</TableHead>
                  <TableHead className="text-right">残り日数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visaStudents.slice(0, 10).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.studentNumber}</TableCell>
                    <TableCell>{s.nameKanji || s.nameEn}</TableCell>
                    <TableCell>{s.residenceExpiry || '-'}</TableCell>
                    <TableCell className="text-right">
                      {s.daysUntilExpiry !== null ? (
                        <Badge variant={s.daysUntilExpiry <= 30 ? 'destructive' : s.daysUntilExpiry <= 60 ? 'default' : 'outline'}>
                          {s.daysUntilExpiry}日
                        </Badge>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
