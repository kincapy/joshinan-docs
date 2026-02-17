'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

/** 生成済み文書の型 */
type GeneratedRow = {
  id: string
  filePath: string
  notes: string | null
  createdAt: string
  template: { id: string; name: string; outputFormat: string }
  createdBy: { id: string; name: string }
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 出力形式の日本語ラベル */
const outputFormatLabel: Record<string, string> = {
  EXCEL: 'Excel',
  DOCX: 'Word',
}

/** 生成履歴一覧画面 */
export default function DocumentHistoryPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<GeneratedRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))

      const res = await fetch(`/api/documents/generated?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setDocuments(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  /** 日付を表示用にフォーマット */
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">生成履歴</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {documents.length === 0 ? (
        <div className="text-muted-foreground">生成履歴がまだありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テンプレート名</TableHead>
                <TableHead>形式</TableHead>
                <TableHead>作成者</TableHead>
                <TableHead>作成日時</TableHead>
                <TableHead>備考</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {outputFormatLabel[doc.template.outputFormat] || doc.template.outputFormat}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.createdBy.name}</TableCell>
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {doc.notes || '-'}
                  </TableCell>
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
                <ChevronLeft className="h-4 w-4" />
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.totalPages}
              </span>
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
          )}
        </>
      )}
    </div>
  )
}
