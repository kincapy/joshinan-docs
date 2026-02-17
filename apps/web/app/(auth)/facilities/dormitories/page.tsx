'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'

/** API レスポンスの物件型 */
type DormitoryRow = {
  id: string
  name: string
  address: string
  rent: number
  isActive: boolean
  currentResidentCount: number
}

/** 金額のフォーマット（円） */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

/** 物件一覧画面 */
export default function DormitoriesPage() {
  const router = useRouter()
  const [dormitories, setDormitories] = useState<DormitoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const fetchDormitories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (activeFilter === 'all') params.set('includeInactive', 'true')

      const res = await fetch(`/api/facilities/dormitories?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setDormitories(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchDormitories()
  }, [fetchDormitories])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">物件一覧</h1>
        <div className="flex gap-2">
          <Link href="/facilities/utilities/input">
            <Button variant="outline">水光熱費入力</Button>
          </Link>
          <Link href="/facilities/wifi">
            <Button variant="outline">WiFiデバイス</Button>
          </Link>
          <Link href="/facilities/dormitories/new">
            <Button>
              <Plus className="h-4 w-4" />
              物件登録
            </Button>
          </Link>
        </div>
      </div>

      {/* フィルタ */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">有効のみ</option>
            <option value="all">すべて</option>
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
      ) : dormitories.length === 0 ? (
        <div className="text-muted-foreground">物件がありません</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物件名</TableHead>
              <TableHead>住所</TableHead>
              <TableHead className="text-right">家賃</TableHead>
              <TableHead className="text-right">入居者数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dormitories.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => router.push(`/facilities/dormitories/${d.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {d.name}
                    {!d.isActive && (
                      <Badge variant="outline" className="text-xs">無効</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{d.address}</TableCell>
                <TableCell className="text-right">{formatCurrency(d.rent)}</TableCell>
                <TableCell className="text-right">
                  {d.currentResidentCount > 0 ? (
                    <Badge variant="default">{d.currentResidentCount}名</Badge>
                  ) : (
                    <span className="text-muted-foreground">0名</span>
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
