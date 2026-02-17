'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '実施中' },
  { value: 'COMPLETED', label: '完了' },
  { value: 'CANCELLED', label: '取消' },
]

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '実施中',
  COMPLETED: '完了',
  CANCELLED: '取消',
}

type SupportPlanRow = {
  id: string
  startDate: string
  endDate: string | null
  status: string
  student: { id: string; nameEn: string; nameKanji: string | null; studentNumber: string }
  sswCase: {
    id: string
    company: { id: string; name: string }
  }
}

export default function SupportPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SupportPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))

      const res = await fetch(`/api/ssw/support-plans?${params.toString()}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setPlans(json.data || [])
      if (json.pagination) setTotalPages(json.pagination.totalPages)
    } catch (err) {
      console.error(err)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  /** ステータスをインライン変更 */
  async function handleStatusChange(planId: string, newStatus: string) {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    // COMPLETED に変更する場合は今日の日付を endDate にセット
    const body: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'COMPLETED' && !plan.endDate) {
      body.endDate = new Date().toISOString().slice(0, 10)
    }

    try {
      const res = await fetch(`/api/ssw/support-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('ステータスの更新に失敗しました')
      fetchPlans()
    } catch (err) {
      console.error(err)
      alert('ステータスの更新に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">支援計画一覧</h1>

      {/* フィルタ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">ステータス</Label>
              <Select
                className="ml-2 rounded border px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">すべて</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>支援計画</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">読み込み中...</p>
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">支援計画がありません</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead>企業</TableHead>
                    <TableHead>開始日</TableHead>
                    <TableHead>終了日</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell
                        className="cursor-pointer font-medium"
                        onClick={() => router.push(`/ssw/cases/${plan.sswCase.id}`)}
                      >
                        <div>{plan.student.nameKanji || plan.student.nameEn}</div>
                        <div className="text-xs text-muted-foreground">
                          {plan.student.studentNumber}
                        </div>
                      </TableCell>
                      <TableCell>{plan.sswCase.company.name}</TableCell>
                      <TableCell>{plan.startDate?.slice(0, 10)}</TableCell>
                      <TableCell>{plan.endDate?.slice(0, 10) || '継続中'}</TableCell>
                      <TableCell>
                        <select
                          className="rounded border px-2 py-1 text-xs"
                          value={plan.status}
                          onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
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
