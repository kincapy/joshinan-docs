'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { projectStatus, projectTaskStatus, taskCategory, projectRole } from '@joshinan/domain'
import { ArrowLeft, UserPlus } from 'lucide-react'

// =============================================
// 型定義
// =============================================

/** タスクテンプレートの付帯情報 */
type TaskTemplate = {
  category: string
  actionType: string
  description: string | null
}

/** プロジェクトタスク行の型 */
type ProjectTask = {
  id: string
  taskCode: string
  taskName: string
  status: string
  required: boolean
  completedAt: string | null
  assigneeId: string | null
  template: TaskTemplate
}

/** メンバー行の型 */
type ProjectMember = {
  id: string
  userId: string
  role: string
  createdAt: string
}

/** プロジェクト詳細の型 */
type ProjectDetail = {
  id: string
  name: string
  status: string
  progress: number
  skill: { id: string; name: string }
  tasks: ProjectTask[]
  members: ProjectMember[]
  createdAt: string
  completedAt: string | null
}

// =============================================
// ヘルパー関数
// =============================================

/** プロジェクトステータスに応じた Badge variant */
function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'ACTIVE': return 'default'
    case 'COMPLETED': return 'secondary'
    case 'SUSPENDED': return 'outline'
    case 'CANCELLED': return 'destructive'
    default: return 'outline'
  }
}

/** タスクステータスに応じた Badge variant */
function taskStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'NOT_STARTED': return 'outline'
    case 'IN_PROGRESS': return 'default'
    case 'COMPLETED': return 'secondary'
    case 'NOT_REQUIRED': return 'outline'
    case 'RETURNED': return 'destructive'
    default: return 'outline'
  }
}

/** タスクカテゴリに応じた Badge variant */
function categoryVariant(cat: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (cat) {
    case 'DOCUMENT_CREATION': return 'default'
    case 'DOCUMENT_COLLECTION': return 'secondary'
    case 'DATA_ENTRY': return 'outline'
    case 'REVIEW': return 'destructive'
    case 'OUTPUT': return 'secondary'
    default: return 'outline'
  }
}

/** 権限に応じた Badge variant */
function roleVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'OWNER': return 'default'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'outline'
    default: return 'outline'
  }
}

/** 日付フォーマット */
function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

// =============================================
// メインコンポーネント
// =============================================

/** プロジェクト詳細画面 */
export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // メンバー追加ダイアログの状態
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [newMemberUserId, setNewMemberUserId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('VIEWER')
  const [addMemberSaving, setAddMemberSaving] = useState(false)
  const [addMemberError, setAddMemberError] = useState('')

  // =============================================
  // データ取得
  // =============================================

  const fetchProject = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setProject(json.data)
    } catch (err) {
      console.error('プロジェクト詳細の取得に失敗:', err)
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // =============================================
  // タスクステータス変更
  // =============================================

  /** タスクのステータスをインラインセレクトで変更する */
  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')

      // 画面をリロードして進捗率も更新する
      fetchProject()
    } catch (err) {
      console.error('タスクステータスの更新に失敗:', err)
      alert(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  // =============================================
  // メンバー操作
  // =============================================

  /** メンバー追加 */
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddMemberSaving(true)
    setAddMemberError('')

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newMemberUserId,
          role: newMemberRole,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '追加に失敗しました')

      // ダイアログを閉じてリロード
      setAddMemberOpen(false)
      setNewMemberUserId('')
      setNewMemberRole('VIEWER')
      fetchProject()
    } catch (err) {
      console.error('メンバー追加に失敗:', err)
      setAddMemberError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setAddMemberSaving(false)
    }
  }

  /** メンバーの権限変更 */
  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')

      fetchProject()
    } catch (err) {
      console.error('権限変更に失敗:', err)
      alert(err instanceof Error ? err.message : '権限変更に失敗しました')
    }
  }

  // =============================================
  // レンダリング
  // =============================================

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (error) return (
    <div className="space-y-4">
      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      <Button variant="ghost" onClick={() => router.push('/projects')}>
        <ArrowLeft className="h-4 w-4" />
        一覧に戻る
      </Button>
    </div>
  )
  if (!project) return null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant="outline">{project.skill.name}</Badge>
        <Badge variant={statusVariant(project.status)}>
          {projectStatus.labelMap[project.status as keyof typeof projectStatus.labelMap]}
        </Badge>
      </div>

      {/* 進捗率バー */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">進捗率</span>
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold">{project.progress}%</span>
          </div>
        </CardContent>
      </Card>

      {/* タブ: タスクボード / メンバー */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">タスクボード</TabsTrigger>
          <TabsTrigger value="members">メンバー</TabsTrigger>
        </TabsList>

        {/* タスクボードタブ */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>タスク一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {project.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">タスクがありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コード</TableHead>
                      <TableHead>タスク名</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>担当者</TableHead>
                      <TableHead>完了日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.tasks.map((task) => {
                      /* NOT_REQUIRED のタスクはグレーアウト */
                      const isNotRequired = task.status === 'NOT_REQUIRED'
                      return (
                        <TableRow
                          key={task.id}
                          className={isNotRequired ? 'opacity-40' : ''}
                        >
                          <TableCell className="font-mono text-xs">
                            {task.taskCode}
                          </TableCell>
                          <TableCell className="font-medium">
                            {task.taskName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={categoryVariant(task.template.category)}>
                              {taskCategory.labelMap[task.template.category as keyof typeof taskCategory.labelMap]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {/* NOT_REQUIRED はセレクトではなく Badge のみ */}
                            {isNotRequired ? (
                              <Badge variant="outline">
                                {projectTaskStatus.labelMap[task.status as keyof typeof projectTaskStatus.labelMap]}
                              </Badge>
                            ) : (
                              <Select
                                value={task.status}
                                onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                className="w-28"
                              >
                                {projectTaskStatus.options
                                  .filter((opt) => opt.value !== 'NOT_REQUIRED')
                                  .map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {task.assigneeId ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(task.completedAt)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* メンバータブ */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>メンバー一覧</CardTitle>
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4" />
                メンバー追加
              </Button>
            </CardHeader>
            <CardContent>
              {project.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">メンバーがいません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ユーザーID</TableHead>
                      <TableHead>権限</TableHead>
                      <TableHead>参加日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.members.map((member) => {
                      const isOwner = member.role === 'OWNER'
                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono text-xs">
                            {member.userId}
                          </TableCell>
                          <TableCell>
                            {/* OWNER は権限変更不可 */}
                            {isOwner ? (
                              <Badge variant={roleVariant(member.role)}>
                                {projectRole.labelMap[member.role as keyof typeof projectRole.labelMap]}
                              </Badge>
                            ) : (
                              <Select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="w-28"
                              >
                                {projectRole.options
                                  .filter((opt) => opt.value !== 'OWNER')
                                  .map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(member.createdAt)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* メンバー追加ダイアログ */}
      <Dialog open={addMemberOpen} onOpenChange={(open) => {
        if (!open) {
          setAddMemberOpen(false)
          setAddMemberError('')
          setNewMemberUserId('')
          setNewMemberRole('VIEWER')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバー追加</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            {addMemberError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {addMemberError}
              </div>
            )}
            <div className="space-y-1">
              <Label>
                ユーザーID <span className="text-destructive">*</span>
              </Label>
              <Input
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                placeholder="UUID を入力"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>権限</Label>
              <Select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                {projectRole.options
                  .filter((opt) => opt.value !== 'OWNER')
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddMemberOpen(false)
                  setAddMemberError('')
                }}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={addMemberSaving}>
                {addMemberSaving ? '追加中...' : '追加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
