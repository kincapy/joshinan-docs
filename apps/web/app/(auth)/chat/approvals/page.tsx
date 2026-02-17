'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { approvalType, approvalStatus } from '@joshinan/domain'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

// =============================================
// 型定義
// =============================================

/** 決裁一覧の1件（API レスポンス） */
type ApprovalItem = {
  id: string
  type: string
  status: string
  content: string
  reason: string | null
  createdAt: string
  resolvedAt: string | null
  message: {
    id: string
    content: string
    session: {
      id: string
      title: string | null
    }
  } | null
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

// =============================================
// ユーティリティ
// =============================================

/** 日付を「YYYY/MM/DD HH:mm」形式にフォーマット */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${min}`
}

/** ステータスに応じたバッジのバリアント */
function statusVariant(status: string) {
  switch (status) {
    case 'PENDING': return 'secondary' as const
    case 'APPROVED': return 'default' as const
    case 'REJECTED': return 'destructive' as const
    default: return 'outline' as const
  }
}

// =============================================
// メインコンポーネント
// =============================================

/** 決裁一覧画面 */
export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)

  // 却下理由入力ダイアログの状態
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // -----------------------------------------
  // 決裁一覧の取得
  // -----------------------------------------
  const fetchApprovals = useCallback(async (status: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status })
      const res = await fetch(`/api/chat/approvals?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '決裁一覧の取得に失敗しました')

      setApprovals(json.data)
      setPagination(json.pagination)
    } catch (err) {
      console.error('決裁一覧の取得に失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals(activeTab)
  }, [activeTab, fetchApprovals])

  // -----------------------------------------
  // 承認処理
  // -----------------------------------------
  async function handleApprove(approvalId: string) {
    if (!confirm('この申請を承認しますか？')) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/chat/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '承認に失敗しました')

      // 一覧を再取得して反映
      await fetchApprovals(activeTab)
    } catch (err) {
      console.error('承認処理に失敗:', err)
      alert('承認処理に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  // -----------------------------------------
  // 却下処理（ダイアログ経由）
  // -----------------------------------------
  function openRejectDialog(approvalId: string) {
    setRejectTargetId(approvalId)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  async function handleReject() {
    if (!rejectTargetId) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/chat/approvals/${rejectTargetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          reason: rejectReason.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '却下に失敗しました')

      setRejectDialogOpen(false)
      setRejectTargetId(null)
      setRejectReason('')
      // 一覧を再取得して反映
      await fetchApprovals(activeTab)
    } catch (err) {
      console.error('却下処理に失敗:', err)
      alert('却下処理に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  // -----------------------------------------
  // レンダリング
  // -----------------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">決裁一覧</h1>

      {/* タブ切り替え */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {approvalStatus.options.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 各タブの内容（共通レンダリング） */}
        {approvalStatus.options.map((opt) => (
          <TabsContent key={opt.value} value={opt.value}>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                読み込み中...
              </div>
            ) : approvals.length === 0 ? (
              <div className="text-muted-foreground py-8">
                {opt.label}の申請はありません
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((item) => (
                  <ApprovalCard
                    key={item.id}
                    approval={item}
                    onApprove={handleApprove}
                    onReject={openRejectDialog}
                    processing={processing}
                  />
                ))}

                {/* ページネーション情報 */}
                {pagination && pagination.total > 0 && (
                  <p className="text-sm text-muted-foreground">
                    全{pagination.total}件
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 却下理由入力ダイアログ */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>却下理由</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              却下理由を入力してください（任意）
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="却下理由を入力..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              却下する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================
// サブコンポーネント
// =============================================

/** 決裁カード */
function ApprovalCard({
  approval,
  onApprove,
  onReject,
  processing,
}: {
  approval: ApprovalItem
  onApprove: (id: string) => void
  onReject: (id: string) => void
  processing: boolean
}) {
  const isPending = approval.status === 'PENDING'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {/* 決裁種別をラベルで表示 */}
              {approvalType.labelMap[approval.type as keyof typeof approvalType.labelMap] ?? approval.type}
            </CardTitle>
            <Badge variant={statusVariant(approval.status)}>
              {approvalStatus.labelMap[approval.status as keyof typeof approvalStatus.labelMap] ?? approval.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(approval.createdAt)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 申請内容 */}
        <div className="text-sm">
          <p className="whitespace-pre-wrap">{approval.content}</p>
        </div>

        {/* 関連チャットセッション情報 */}
        {approval.message?.session && (
          <div className="text-xs text-muted-foreground">
            チャット: {approval.message.session.title ?? '無題のチャット'}
          </div>
        )}

        {/* 却下理由（却下済みの場合のみ表示） */}
        {approval.status === 'REJECTED' && approval.reason && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm">
            <span className="font-medium text-destructive">却下理由:</span>{' '}
            {approval.reason}
          </div>
        )}

        {/* 決裁日時（処理済みの場合） */}
        {approval.resolvedAt && (
          <div className="text-xs text-muted-foreground">
            処理日時: {formatDate(approval.resolvedAt)}
          </div>
        )}

        {/* 承認待ちの場合のみアクションボタンを表示 */}
        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onApprove(approval.id)}
              disabled={processing}
            >
              <CheckCircle2 className="h-4 w-4" />
              承認
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(approval.id)}
              disabled={processing}
            >
              <XCircle className="h-4 w-4" />
              却下
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
