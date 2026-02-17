'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Plus } from 'lucide-react'

/** 申請ケースの型 */
type CaseRow = {
  id: string
  candidateName: string
  nationality: string
  applicationNumber: string | null
  status: string
  isListedCountry: boolean
  agent: { id: string; name: string } | null
  documentCompletionRate: number
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** エージェント選択肢の型 */
type AgentOption = { id: string; name: string }

/** 申請ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  PREPARING: '書類準備中',
  SUBMITTED: '申請済',
  GRANTED: '交付',
  DENIED: '不交付',
  WITHDRAWN: '取下',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'GRANTED') return 'default'
  if (status === 'DENIED') return 'destructive'
  if (status === 'SUBMITTED') return 'secondary'
  return 'outline'
}

/** 申請ケース一覧画面 */
export default function RecruitmentCasesPage() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string

  const [cases, setCases] = useState<CaseRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* フィルタ */
  const [statusFilter, setStatusFilter] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('')
  const [isListedFilter, setIsListedFilter] = useState('')
  const [page, setPage] = useState(1)

  /* 新規登録ダイアログ */
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [formData, setFormData] = useState({
    candidateName: '',
    nationality: '',
    agentId: '',
    isListedCountry: false,
    notes: '',
  })

  const fetchCases = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('cycleId', cycleId)
      searchParams.set('page', String(page))
      if (statusFilter) searchParams.set('status', statusFilter)
      if (nationalityFilter) searchParams.set('nationality', nationalityFilter)
      if (isListedFilter) searchParams.set('isListedCountry', isListedFilter)

      const res = await fetch(`/api/recruitment/cases?${searchParams.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setCases(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [cycleId, page, statusFilter, nationalityFilter, isListedFilter])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  /** エージェント一覧を取得（ダイアログ用） */
  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents?page=1&per=200')
      const json = await res.json()
      if (res.ok) setAgents(json.data)
    } catch {
      /* エージェント取得失敗は無視 */
    }
  }

  /** 新規ケース登録 */
  async function handleCreate() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/recruitment/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruitmentCycleId: cycleId,
          candidateName: formData.candidateName,
          nationality: formData.nationality,
          agentId: formData.agentId || null,
          isListedCountry: formData.isListedCountry,
          notes: formData.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      setShowDialog(false)
      setFormData({ candidateName: '', nationality: '', agentId: '', isListedCountry: false, notes: '' })
      fetchCases()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/recruitment/cycles')}>
            <ArrowLeft className="h-4 w-4" />
            募集期一覧
          </Button>
          <h1 className="text-2xl font-bold">申請ケース一覧</h1>
        </div>
        <Button onClick={() => { setShowDialog(true); fetchAgents() }}>
          <Plus className="h-4 w-4" />
          ケース登録
        </Button>
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
            {Object.entries(statusLabel).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">別表掲載国</label>
          <Select
            value={isListedFilter}
            onChange={(e) => handleFilterChange(setIsListedFilter, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="true">掲載国</option>
            <option value="false">非掲載国</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : cases.length === 0 ? (
        <div className="text-muted-foreground">申請ケースがありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>候補者氏名</TableHead>
                <TableHead>国籍</TableHead>
                <TableHead>エージェント</TableHead>
                <TableHead>申請番号</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>別表</TableHead>
                <TableHead className="text-right">書類充足率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/recruitment/cases/${c.id}`)}
                >
                  <TableCell className="font-semibold">{c.candidateName}</TableCell>
                  <TableCell>{c.nationality}</TableCell>
                  <TableCell>{c.agent?.name || '-'}</TableCell>
                  <TableCell>{c.applicationNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>
                      {statusLabel[c.status] || c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isListedCountry ? 'secondary' : 'outline'}>
                      {c.isListedCountry ? '掲載国' : '非掲載国'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {(c.documentCompletionRate * 100).toFixed(0)}%
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

      {/* 新規登録ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請ケースを登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>候補者氏名（パスポート記載名）</Label>
              <Input
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                placeholder="NGUYEN VAN A"
              />
            </div>
            <div className="space-y-1">
              <Label>国籍</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="ベトナム"
              />
            </div>
            <div className="space-y-1">
              <Label>エージェント（任意）</Label>
              <Select
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              >
                <option value="">なし</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isListedCountry"
                checked={formData.isListedCountry}
                onChange={(e) => setFormData({ ...formData, isListedCountry: e.target.checked })}
              />
              <Label htmlFor="isListedCountry">別表掲載国</Label>
            </div>
            <div className="space-y-1">
              <Label>備考（任意）</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? '登録中...' : '登録'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
