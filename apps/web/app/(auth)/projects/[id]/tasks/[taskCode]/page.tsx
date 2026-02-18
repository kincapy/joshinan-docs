'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { projectTaskStatus } from '@joshinan/domain'
import { ArrowLeft, Upload } from 'lucide-react'

// =============================================
// 型定義
// =============================================

type StatusLog = {
  id: string
  fromStatus: string
  toStatus: string
  changedById: string
  changedAt: string
}

type TaskDetail = {
  id: string
  taskCode: string
  taskName: string
  status: string
  required: boolean
  notes: string | null
  filePath: string | null
  assigneeId: string | null
  completedAt: string | null
  template: {
    category: string
    actionType: string
    description: string | null
  }
  statusLogs: StatusLog[]
}

// =============================================
// ヘルパー関数
// =============================================

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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

/** タスクコードの接頭辞からタスク種別を判定 */
function getTaskType(taskCode: string): 'data_entry' | 'file_upload' | 'review' | 'document' {
  if (taskCode.startsWith('DAT-')) return 'data_entry'
  if (taskCode.startsWith('COL-')) return 'file_upload'
  if (taskCode.startsWith('REV-')) return 'review'
  return 'document' // DOC系
}

// =============================================
// メインコンポーネント
// =============================================

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const taskCode = params.taskCode as string

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // 編集用の状態
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // =============================================
  // データ取得
  // =============================================

  /** taskCode から実際の taskId を取得するため、プロジェクト詳細から探す */
  const fetchTask = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // まずプロジェクト詳細からタスク一覧を取得して taskCode → taskId を解決
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectJson = await projectRes.json()
      if (!projectRes.ok) throw new Error(projectJson.error?.message || '取得に失敗しました')

      const matchedTask = projectJson.data.tasks.find(
        (t: { taskCode: string }) => t.taskCode === taskCode,
      )
      if (!matchedTask) throw new Error(`タスク ${taskCode} が見つかりません`)

      // taskId でタスク詳細（ステータス履歴付き）を取得
      const taskRes = await fetch(`/api/projects/${projectId}/tasks/${matchedTask.id}`)
      const taskJson = await taskRes.json()
      if (!taskRes.ok) throw new Error(taskJson.error?.message || 'タスク取得に失敗しました')

      setTask(taskJson.data)
      setEditStatus(taskJson.data.status)
      setEditNotes(taskJson.data.notes ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [projectId, taskCode])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  // =============================================
  // 保存
  // =============================================

  async function handleSave() {
    if (!task) return
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {}
      if (editStatus !== task.status) body.status = editStatus
      if (editNotes !== (task.notes ?? '')) body.notes = editNotes || null

      // 変更がなければスキップ
      if (Object.keys(body).length === 0) {
        setSaving(false)
        return
      }

      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '保存に失敗しました')

      // 最新データで再取得
      fetchTask()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // =============================================
  // レンダリング
  // =============================================

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (error && !task) return (
    <div className="space-y-4">
      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="h-4 w-4" />
        タスク一覧に戻る
      </Button>
    </div>
  )
  if (!task) return null

  const taskType = getTaskType(task.taskCode)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)}>
          <ArrowLeft className="h-4 w-4" />
          タスク一覧に戻る
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">{task.taskCode}</span>
        <h1 className="text-2xl font-bold">{task.taskName}</h1>
      </div>

      {task.template.description && (
        <p className="text-sm text-muted-foreground">{task.template.description}</p>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* ステータス選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="w-40"
          >
            {projectTaskStatus.options
              .filter((opt) => opt.value !== 'NOT_REQUIRED')
              .map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </Select>
        </CardContent>
      </Card>

      {/* タスク種別に応じたコンテンツ */}
      {taskType === 'file_upload' && (
        <FileUploadSection task={task} />
      )}

      {taskType === 'data_entry' && (
        <DataEntrySection task={task} />
      )}

      {taskType === 'document' && (
        <DocumentSection task={task} />
      )}

      {taskType === 'review' && (
        <ReviewSection projectId={projectId} />
      )}

      {/* メモ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">メモ</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="メモを入力..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* ステータス変更履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス変更履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {task.statusLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ変更がありません</p>
          ) : (
            <div className="space-y-2">
              {task.statusLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{formatDateTime(log.changedAt)}</span>
                  <Badge variant={taskStatusVariant(log.fromStatus)} className="text-xs">
                    {projectTaskStatus.labelMap[log.fromStatus as keyof typeof projectTaskStatus.labelMap]}
                  </Badge>
                  <span className="text-muted-foreground">&rarr;</span>
                  <Badge variant={taskStatusVariant(log.toStatus)} className="text-xs">
                    {projectTaskStatus.labelMap[log.toStatus as keyof typeof projectTaskStatus.labelMap]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}

// =============================================
// タスク種別ごとのセクション
// =============================================

/** ファイルアップロードセクション（COL系） */
function FileUploadSection({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ファイル</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.filePath ? (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">{task.filePath}</p>
            <p className="text-xs text-muted-foreground mt-1">アップロード済み</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">まだファイルがアップロードされていません</p>
        )}
        <Button variant="outline" size="sm" disabled>
          <Upload className="h-4 w-4" />
          ファイルをアップロード
        </Button>
        <p className="text-xs text-muted-foreground">
          ファイルアップロード機能は準備中です。一括アップロードをご利用ください。
        </p>
      </CardContent>
    </Card>
  )
}

/** データ入力セクション（DAT系） */
function DataEntrySection({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">企業情報入力</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          受入れ企業の基本情報を入力してください。
          保存するとDOC系タスクの申請書に自動反映されます。
        </p>
        <p className="text-xs text-muted-foreground">
          企業情報フォームは準備中です。
        </p>
      </CardContent>
    </Card>
  )
}

/** 書類作成セクション（DOC系） */
function DocumentSection({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">書類</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.filePath ? (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">{task.filePath}</p>
            <p className="text-xs text-muted-foreground mt-1">生成済み</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            企業情報の入力完了後に自動生成されます。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** 最終確認セクション（REV系） */
function ReviewSection({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<{
    internal: { completed: number; total: number }
    applicant: { completed: number; total: number }
    company: { completed: number; total: number }
    incomplete: { taskCode: string; taskName: string; status: string }[]
  } | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const json = await res.json()
        if (!res.ok) return

        const tasks = json.data.tasks as Array<{
          taskCode: string
          taskName: string
          status: string
        }>

        // タスクをグループ分けして進捗を集計
        const count = (codes: string[]) => {
          const filtered = codes
            .map((c) => tasks.find((t) => t.taskCode === c))
            .filter((t): t is NonNullable<typeof t> => !!t && t.status !== 'NOT_REQUIRED')
          return {
            completed: filtered.filter((t) => t.status === 'COMPLETED').length,
            total: filtered.length,
          }
        }

        // 未完了タスクのリスト
        const incomplete = tasks.filter(
          (t) => t.status !== 'COMPLETED' && t.status !== 'NOT_REQUIRED' && !t.taskCode.startsWith('REV-'),
        )

        // 簡易的にコード範囲でグループ分け
        const internalCodes = tasks
          .filter((t) => t.taskCode.startsWith('DAT-') || t.taskCode.startsWith('DOC-'))
          .map((t) => t.taskCode)
        const applicantCodes = tasks
          .filter((t) => {
            if (!t.taskCode.startsWith('COL-')) return false
            const n = parseInt(t.taskCode.replace('COL-', ''), 10)
            return (n >= 1 && n <= 11) || (n >= 19 && n <= 20)
          })
          .map((t) => t.taskCode)
        const companyCodes = tasks
          .filter((t) => {
            if (!t.taskCode.startsWith('COL-')) return false
            const n = parseInt(t.taskCode.replace('COL-', ''), 10)
            return (n >= 12 && n <= 18) || (n >= 21 && n <= 23)
          })
          .map((t) => t.taskCode)

        setSummary({
          internal: count(internalCodes),
          applicant: count(applicantCodes),
          company: count(companyCodes),
          incomplete,
        })
      } catch {
        // サマリー取得失敗は無視
      }
    }
    fetchSummary()
  }, [projectId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">提出準備チェック</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary ? (
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        ) : (
          <>
            <div className="space-y-2">
              <ProgressLine
                label="当社作成（DOC）"
                completed={summary.internal.completed}
                total={summary.internal.total}
              />
              <ProgressLine
                label="申請人（COL）"
                completed={summary.applicant.completed}
                total={summary.applicant.total}
              />
              <ProgressLine
                label="企業（COL）"
                completed={summary.company.completed}
                total={summary.company.total}
              />
            </div>

            {summary.incomplete.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">未完了タスク:</p>
                {summary.incomplete.map((t) => (
                  <p key={t.taskCode} className="text-sm text-muted-foreground">
                    ・{t.taskCode} {t.taskName} — {
                      projectTaskStatus.labelMap[t.status as keyof typeof projectTaskStatus.labelMap]
                    }
                  </p>
                ))}
              </div>
            )}

            {summary.incomplete.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">
                  全タスク完了。申請書類セットを生成できます。
                </p>
                <Button disabled>
                  申請書類セットを生成
                </Button>
                <p className="text-xs text-muted-foreground">
                  書類生成機能は準備中です。
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** 進捗表示行 */
function ProgressLine({
  label,
  completed,
  total,
}: {
  label: string
  completed: number
  total: number
}) {
  const isComplete = completed === total && total > 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32">{label}</span>
      <span className="font-medium">
        {completed}/{total} 完了
      </span>
      <span>{isComplete ? '✓' : '⚠'}</span>
    </div>
  )
}
