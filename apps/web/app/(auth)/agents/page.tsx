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
import { agentType } from '@joshinan/domain'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/** API レスポンスのエージェント型 */
type AgentRow = {
  id: string
  name: string
  country: string
  type: string
  feePerStudent: number | null
  isActive: boolean
  studentCount: number
  outstandingBalance: number
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 種別に応じたバッジのバリアント */
function typeVariant(type: string) {
  switch (type) {
    case 'SCHOOL_OPERATOR': return 'default' as const
    case 'BROKER': return 'secondary' as const
    case 'INDIVIDUAL': return 'outline' as const
    default: return 'secondary' as const
  }
}

/** 金額のフォーマット（円） */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

/** エージェント一覧画面 */
export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ・検索の状態
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (activeFilter) params.set('isActive', activeFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/agents?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setAgents(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, activeFilter, search, page])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">エージェント一覧</h1>
        <Button onClick={() => router.push('/agents/new')}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">種別</label>
          <Select
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {agentType.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={activeFilter}
            onChange={(e) => handleFilterChange(setActiveFilter, e.target.value)}
          >
            <option value="">すべて</option>
            <option value="true">有効</option>
            <option value="false">無効</option>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="エージェント名・別名で検索"
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
      ) : agents.length === 0 ? (
        <div className="text-muted-foreground">該当するエージェントがいません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>エージェント名</TableHead>
                <TableHead>国</TableHead>
                <TableHead>種別</TableHead>
                <TableHead className="text-right">手数料/人</TableHead>
                <TableHead className="text-right">学生数</TableHead>
                <TableHead className="text-right">債務残高</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/agents/${agent.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {agent.name}
                      {!agent.isActive && (
                        <Badge variant="outline" className="text-xs">無効</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{agent.country}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant(agent.type)}>
                      {agentType.labelMap[agent.type as keyof typeof agentType.labelMap] ?? agent.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {agent.feePerStudent !== null ? formatCurrency(agent.feePerStudent) : '-'}
                  </TableCell>
                  <TableCell className="text-right">{agent.studentCount}</TableCell>
                  <TableCell className="text-right">
                    {agent.outstandingBalance > 0 ? (
                      <span className="text-destructive font-medium">
                        {formatCurrency(agent.outstandingBalance)}
                      </span>
                    ) : (
                      formatCurrency(agent.outstandingBalance)
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
