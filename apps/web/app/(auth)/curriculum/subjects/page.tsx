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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { subjectCategory, jlptLevel } from '@joshinan/domain'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/** API レスポンスの科目型 */
type SubjectRow = {
  id: string
  name: string
  category: string
  targetLevel: string | null
  isActive: boolean
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** 編集モーダルの型 */
type EditForm = {
  name: string
  category: string
  targetLevel: string
  description: string
  isActive: boolean
}

/** 科目一覧画面 */
export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ・検索の状態
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // 編集モーダルの状態
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      if (levelFilter) params.set('targetLevel', levelFilter)
      if (activeFilter) params.set('isActive', activeFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))

      const res = await fetch(`/api/subjects?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setSubjects(json.data)
      setPagination(json.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, levelFilter, activeFilter, search, page])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  /** フィルタ変更時はページを1に戻す */
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  /** 行クリックで編集モーダルを開く */
  async function handleRowClick(id: string) {
    try {
      const res = await fetch(`/api/subjects/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      const s = json.data
      setEditId(id)
      setEditForm({
        name: s.name,
        category: s.category,
        targetLevel: s.targetLevel ?? '',
        description: s.description ?? '',
        isActive: s.isActive,
      })
      setEditError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '詳細の取得に失敗しました')
    }
  }

  /** 編集保存 */
  async function handleEditSave() {
    if (!editId || !editForm) return
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/subjects/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          targetLevel: editForm.targetLevel || null,
          description: editForm.description || null,
          isActive: editForm.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setEditId(null)
      setEditForm(null)
      fetchSubjects()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">科目一覧</h1>
        <Button onClick={() => router.push('/curriculum/subjects/new')}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">カテゴリ</label>
          <Select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {subjectCategory.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">対象レベル</label>
          <Select
            value={levelFilter}
            onChange={(e) => handleFilterChange(setLevelFilter, e.target.value)}
          >
            <option value="">すべて</option>
            {jlptLevel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">状態</label>
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
            placeholder="科目名で検索"
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
      ) : subjects.length === 0 ? (
        <div className="text-muted-foreground">該当する科目がありません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>科目名</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>対象レベル</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(s.id)}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    {subjectCategory.labelMap[s.category as keyof typeof subjectCategory.labelMap] ?? s.category}
                  </TableCell>
                  <TableCell>
                    {s.targetLevel
                      ? jlptLevel.labelMap[s.targetLevel as keyof typeof jlptLevel.labelMap]
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'default' : 'secondary'}>
                      {s.isActive ? '有効' : '無効'}
                    </Badge>
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

      {/* 編集モーダル */}
      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) { setEditId(null); setEditForm(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>科目編集</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              {editError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{editError}</div>
              )}
              <div className="space-y-1">
                <Label>科目名 <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>カテゴリ <span className="text-destructive">*</span></Label>
                <Select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {subjectCategory.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>対象レベル</Label>
                <Select
                  value={editForm.targetLevel}
                  onChange={(e) => setEditForm({ ...editForm, targetLevel: e.target.value })}
                >
                  <option value="">指定なし</option>
                  {jlptLevel.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>説明</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">有効</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditId(null); setEditForm(null) }}>
                  キャンセル
                </Button>
                <Button onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
