'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { interviewType } from '@joshinan/domain'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

/** 面談記録の型 */
type InterviewRecord = {
  id: string
  interviewDate: string
  interviewType: string
  content: string
  actionItems: string | null
  staff: { id: string }
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 面談記録一覧画面 */
export default function InterviewListPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [records, setRecords] = useState<InterviewRecord[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const p = new URLSearchParams()
      if (typeFilter) p.set('type', typeFilter)
      p.set('page', String(page))

      const res = await fetch(`/api/students/${params.id}/interviews?${p.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setRecords(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.id, typeFilter, page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/students/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
            学生詳細に戻る
          </Button>
          <h1 className="text-2xl font-bold">面談記録</h1>
        </div>
        <Button onClick={() => router.push(`/students/${params.id}/interviews/new`)}>
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* フィルタ */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">面談種別</label>
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          >
            <option value="">すべて</option>
            {interviewType.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 面談記録カード一覧 */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : records.length === 0 ? (
        <div className="text-muted-foreground">面談記録がありません</div>
      ) : (
        <>
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{new Date(record.interviewDate).toLocaleDateString('ja-JP')}</span>
                    <Badge variant="secondary">
                      {interviewType.labelMap[record.interviewType as keyof typeof interviewType.labelMap] ?? record.interviewType}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{record.content}</p>
                  {record.actionItems && (
                    <div className="mt-2 rounded-md bg-muted p-2">
                      <p className="text-xs text-muted-foreground mb-1">アクション項目:</p>
                      <p className="text-sm whitespace-pre-wrap">{record.actionItems}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                全{pagination.total}件中 {(pagination.page - 1) * pagination.per + 1}〜
                {Math.min(pagination.page * pagination.per, pagination.total)}件
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  前へ
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
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
