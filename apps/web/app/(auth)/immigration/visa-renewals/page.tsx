'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, Shield } from 'lucide-react'

/** ビザ更新対象の型 */
type VisaStudent = {
  id: string
  studentNumber: string
  nameEn: string
  nameKanji: string | null
  nationality: string | null
  residenceExpiry: string | null
  daysUntilExpiry: number | null
  existingTaskId: string | null
}

/** ビザ更新管理画面 */
export default function VisaRenewalsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<VisaStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState<string | null>(null)

  /* 残り月数フィルタ */
  const [monthsFilter, setMonthsFilter] = useState('3')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/immigration/visa-renewals?months=${monthsFilter}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setStudents(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [monthsFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** ビザ更新タスクを作成 */
  async function createVisaTask(student: VisaStudent) {
    if (!student.residenceExpiry) return
    setCreating(student.id)
    setError('')
    try {
      /* 期限を在留期限の1ヶ月前に設定 */
      const expiry = new Date(student.residenceExpiry)
      expiry.setMonth(expiry.getMonth() - 1)
      const deadline = expiry.toISOString().split('T')[0]

      const res = await fetch('/api/immigration/visa-renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, deadline }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'タスク作成に失敗しました')
      if (json.data?.error) throw new Error(json.data.error)

      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスク作成に失敗しました')
    } finally {
      setCreating(null)
    }
  }

  /** 残り日数に応じたバッジスタイル */
  function daysVariant(days: number | null): 'default' | 'destructive' | 'outline' {
    if (days === null) return 'outline'
    if (days <= 30) return 'destructive'
    if (days <= 60) return 'default'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/immigration')}>
          <ArrowLeft className="h-4 w-4" />
          ダッシュボード
        </Button>
        <h1 className="text-2xl font-bold">ビザ更新管理</h1>
      </div>

      {/* フィルタ */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">残り期間</label>
          <Select
            value={monthsFilter}
            onChange={(e) => setMonthsFilter(e.target.value)}
          >
            <option value="1">1ヶ月以内</option>
            <option value="2">2ヶ月以内</option>
            <option value="3">3ヶ月以内</option>
            <option value="6">6ヶ月以内</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">対象学生数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{students.length}名</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">タスク未作成</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {students.filter((s) => !s.existingTaskId).length}名
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">30日以内</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {students.filter((s) => s.daysUntilExpiry !== null && s.daysUntilExpiry <= 30).length}名
            </p>
          </CardContent>
        </Card>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : students.length === 0 ? (
        <div className="text-muted-foreground">ビザ更新が近い学生はいません</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>学籍番号</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>国籍</TableHead>
              <TableHead>在留期限</TableHead>
              <TableHead className="text-right">残り日数</TableHead>
              <TableHead>アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.studentNumber}</TableCell>
                <TableCell>{s.nameKanji || s.nameEn}</TableCell>
                <TableCell>{s.nationality || '-'}</TableCell>
                <TableCell>{s.residenceExpiry || '-'}</TableCell>
                <TableCell className="text-right">
                  {s.daysUntilExpiry !== null ? (
                    <Badge variant={daysVariant(s.daysUntilExpiry)}>
                      {s.daysUntilExpiry <= 0 ? '期限切れ' : `${s.daysUntilExpiry}日`}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {s.existingTaskId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/immigration/tasks/${s.existingTaskId}`)}
                    >
                      タスク表示
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => createVisaTask(s)}
                      disabled={creating === s.id}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {creating === s.id ? '作成中...' : 'タスク作成'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
