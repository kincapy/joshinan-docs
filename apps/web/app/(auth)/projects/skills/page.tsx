'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** スキル行の型 */
type SkillRow = {
  id: string
  name: string
  description: string | null
  purpose: string
  goal: string
  isActive: boolean
  createdAt: string
}

/** スキル詳細の型（タスクテンプレート含む） */
type SkillDetail = {
  id: string
  name: string
  description: string | null
  purpose: string
  goal: string
  isActive: boolean
  workflowDefinition: Record<string, unknown>
  taskTemplates: TaskTemplate[]
  conditionRules: ConditionRule[]
}

type TaskTemplate = {
  id: string
  taskCode: string
  taskName: string
  category: string
  actionType: string
  description: string | null
  sortOrder: number
  defaultRequired: boolean
}

type ConditionRule = {
  id: string
  taskCode: string
  conditionField: string
  operator: string
  conditionValue: string
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

/** スキル管理画面（管理者向け） */
export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  // 詳細ダイアログの状態
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // =============================================
  // スキル一覧取得
  // =============================================

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))

      const res = await fetch(`/api/projects/skills?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setSkills(json.data)
      setPagination(json.pagination)
    } catch (err) {
      console.error('スキル一覧の取得に失敗:', err)
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  // =============================================
  // スキル詳細取得
  // =============================================

  async function handleRowClick(skillId: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedSkill(null)

    try {
      const res = await fetch(`/api/projects/skills/${skillId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '詳細取得に失敗しました')

      setSelectedSkill(json.data)
    } catch (err) {
      console.error('スキル詳細の取得に失敗:', err)
      alert(err instanceof Error ? err.message : '詳細取得に失敗しました')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">スキル管理</h1>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : skills.length === 0 ? (
        <div className="text-muted-foreground">スキルが登録されていません</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>目的</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow
                  key={skill.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(skill.id)}
                >
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {skill.purpose}
                  </TableCell>
                  <TableCell>
                    <Badge variant={skill.isActive ? 'default' : 'outline'}>
                      {skill.isActive ? '有効' : '無効'}
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

      {/* スキル詳細ダイアログ */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        if (!open) {
          setDetailOpen(false)
          setSelectedSkill(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSkill ? selectedSkill.name : 'スキル詳細'}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : selectedSkill ? (
            <div className="space-y-4">
              {/* 基本情報 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">基本情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">名前</dt>
                      <dd className="font-medium">{selectedSkill.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">状態</dt>
                      <dd>
                        <Badge variant={selectedSkill.isActive ? 'default' : 'outline'}>
                          {selectedSkill.isActive ? '有効' : '無効'}
                        </Badge>
                      </dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-muted-foreground">目的</dt>
                      <dd className="font-medium">{selectedSkill.purpose}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-muted-foreground">完了条件</dt>
                      <dd className="font-medium">{selectedSkill.goal}</dd>
                    </div>
                    {selectedSkill.description && (
                      <div className="md:col-span-2">
                        <dt className="text-muted-foreground">説明</dt>
                        <dd className="font-medium">{selectedSkill.description}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* タスクテンプレート一覧 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    タスクテンプレート（{selectedSkill.taskTemplates.length}件）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSkill.taskTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      テンプレートが登録されていません
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>コード</TableHead>
                          <TableHead>タスク名</TableHead>
                          <TableHead>カテゴリ</TableHead>
                          <TableHead>デフォルト</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSkill.taskTemplates.map((tmpl) => (
                          <TableRow key={tmpl.id}>
                            <TableCell className="font-mono text-xs">
                              {tmpl.taskCode}
                            </TableCell>
                            <TableCell className="font-medium">
                              {tmpl.taskName}
                            </TableCell>
                            <TableCell className="text-sm">
                              {tmpl.category}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tmpl.defaultRequired ? 'default' : 'outline'}>
                                {tmpl.defaultRequired ? '必須' : '任意'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
