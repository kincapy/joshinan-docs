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
import { projectStatus, projectTaskStatus, projectRole } from '@joshinan/domain'
import { ArrowLeft, ChevronRight, UserPlus, Upload } from 'lucide-react'

// =============================================
// 型定義
// =============================================

type TaskTemplate = {
  category: string
  actionType: string
  description: string | null
}

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

type ProjectMember = {
  id: string
  userId: string
  role: string
  createdAt: string
}

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
// タブ定義
// =============================================

/** タスクコードの接頭辞でタブに振り分ける */
type TabKey = 'internal' | 'applicant' | 'company' | 'final'

type TabDefinition = {
  key: TabKey
  label: string
  /** タスクコードがこのタブに属するか判定する関数 */
  match: (taskCode: string) => boolean
}

/** 仕様: 当社作成=DAT+DOC, 申請人=COL-001~011+019~020, 企業=COL-012~018+021~023, 最終提出=REV */
const TAB_DEFINITIONS: TabDefinition[] = [
  {
    key: 'internal',
    label: '当社作成',
    match: (code) => code.startsWith('DAT-') || code.startsWith('DOC-'),
  },
  {
    key: 'applicant',
    label: '申請人',
    match: (code) => {
      if (!code.startsWith('COL-')) return false
      const num = parseInt(code.replace('COL-', ''), 10)
      // COL-001~011, COL-019~020
      return (num >= 1 && num <= 11) || (num >= 19 && num <= 20)
    },
  },
  {
    key: 'company',
    label: '企業',
    match: (code) => {
      if (!code.startsWith('COL-')) return false
      const num = parseInt(code.replace('COL-', ''), 10)
      // COL-012~018, COL-021~023
      return (num >= 12 && num <= 18) || (num >= 21 && num <= 23)
    },
  },
  {
    key: 'final',
    label: '最終提出',
    match: (code) => code.startsWith('REV-'),
  },
]

/** タスクをタブごとに分類する */
function groupTasksByTab(tasks: ProjectTask[]) {
  const groups: Record<TabKey, ProjectTask[]> = {
    internal: [],
    applicant: [],
    company: [],
    final: [],
  }
  for (const task of tasks) {
    const tab = TAB_DEFINITIONS.find((t) => t.match(task.taskCode))
    if (tab) {
      groups[tab.key].push(task)
    }
  }
  return groups
}

/** タブの完了数/必須数を計算する（「不要」は含めない） */
function countTabProgress(tasks: ProjectTask[]) {
  const required = tasks.filter((t) => t.status !== 'NOT_REQUIRED')
  const completed = required.filter((t) => t.status === 'COMPLETED')
  return { completed: completed.length, total: required.length }
}

// =============================================
// ヘルパー関数
// =============================================

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'ACTIVE': return 'default'
    case 'COMPLETED': return 'secondary'
    case 'SUSPENDED': return 'outline'
    case 'CANCELLED': return 'destructive'
    default: return 'outline'
  }
}

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

function roleVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'OWNER': return 'default'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'outline'
    default: return 'outline'
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

// =============================================
// タスクテーブルコンポーネント
// =============================================

/** タスク一覧テーブル（各タブの中身） */
function TaskTable({
  tasks,
  projectId,
  onStatusChange,
}: {
  tasks: ProjectTask[]
  projectId: string
  onStatusChange: (taskId: string, newStatus: string) => void
}) {
  const router = useRouter()

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">タスクがありません</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">コード</TableHead>
          <TableHead>タスク名</TableHead>
          <TableHead className="w-32">ステータス</TableHead>
          <TableHead className="w-24">完了日</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const isNotRequired = task.status === 'NOT_REQUIRED'
          return (
            <TableRow
              key={task.id}
              className={`${isNotRequired ? 'opacity-40' : 'cursor-pointer hover:bg-muted/50'}`}
              onClick={() => {
                if (!isNotRequired) {
                  router.push(`/projects/${projectId}/tasks/${task.taskCode}`)
                }
              }}
            >
              <TableCell className="font-mono text-xs">
                {task.taskCode}
              </TableCell>
              <TableCell className="font-medium">
                {task.taskName}
              </TableCell>
              <TableCell>
                {isNotRequired ? (
                  <Badge variant="outline">不要</Badge>
                ) : (
                  <Badge variant={taskStatusVariant(task.status)}>
                    {projectTaskStatus.labelMap[task.status as keyof typeof projectTaskStatus.labelMap]}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(task.completedAt)}
              </TableCell>
              <TableCell>
                {!isNotRequired && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// =============================================
// メインコンポーネント
// =============================================

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // メンバー追加ダイアログ
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

  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')
      fetchProject()
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  // =============================================
  // メンバー操作
  // =============================================

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddMemberSaving(true)
    setAddMemberError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newMemberUserId, role: newMemberRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '追加に失敗しました')
      setAddMemberOpen(false)
      setNewMemberUserId('')
      setNewMemberRole('VIEWER')
      fetchProject()
    } catch (err) {
      setAddMemberError(err instanceof Error ? err.message : '追加に失敗しました')
    } finally {
      setAddMemberSaving(false)
    }
  }

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

  // タスクをタブごとに分類
  const taskGroups = groupTasksByTab(project.tasks)

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

      {/* 進捗率バー + 一括アップロードボタン */}
      <Card>
        <CardContent className="pt-6 space-y-4">
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/bulk-upload`)}
            >
              <Upload className="h-4 w-4" />
              書類をまとめてアップロード
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4タブ構成のタスクボード */}
      <Tabs defaultValue="internal">
        <TabsList>
          {TAB_DEFINITIONS.map((tab) => {
            const progress = countTabProgress(taskGroups[tab.key])
            // 最終提出タブは件数を表示しない
            const showCount = tab.key !== 'final'
            return (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
                {showCount && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {progress.completed}/{progress.total}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {TAB_DEFINITIONS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Card>
              <CardContent className="pt-6">
                <TaskTable
                  tasks={taskGroups[tab.key]}
                  projectId={projectId}
                  onStatusChange={handleTaskStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* メンバー管理セクション */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>メンバー</CardTitle>
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
