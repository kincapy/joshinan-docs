'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { projectTaskStatus } from '@joshinan/domain'
import { ArrowLeft, Upload, FileText, X, Check } from 'lucide-react'

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

/** 企業情報フォームの型（Company テーブルに対応） */
type CompanyFormData = {
  name: string
  representative: string
  postalCode: string
  address: string
  phone: string
  field: string
  businessLicense: string
  corporateNumber: string
  establishedDate: string
  notes: string
}

const EMPTY_COMPANY: CompanyFormData = {
  name: '',
  representative: '',
  postalCode: '',
  address: '',
  phone: '',
  field: '',
  businessLicense: '',
  corporateNumber: '',
  establishedDate: '',
  notes: '',
}

// =============================================
// ヘルパー関数
// =============================================

function taskStatusVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
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

function getTaskType(
  taskCode: string,
): 'data_entry' | 'file_upload' | 'review' | 'document' {
  if (taskCode.startsWith('DAT-')) return 'data_entry'
  if (taskCode.startsWith('COL-')) return 'file_upload'
  if (taskCode.startsWith('REV-')) return 'review'
  return 'document'
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
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 編集用の状態
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // =============================================
  // データ取得
  // =============================================

  const fetchTask = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`)
      const projectJson = await projectRes.json()
      if (!projectRes.ok) {
        throw new Error(projectJson.error?.message || '取得に失敗しました')
      }

      const matchedTask = projectJson.data.tasks.find(
        (t: { taskCode: string }) => t.taskCode === taskCode,
      )
      if (!matchedTask) throw new Error(`タスク ${taskCode} が見つかりません`)

      const taskRes = await fetch(
        `/api/projects/${projectId}/tasks/${matchedTask.id}`,
      )
      const taskJson = await taskRes.json()
      if (!taskRes.ok) {
        throw new Error(taskJson.error?.message || 'タスク取得に失敗しました')
      }

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
  // タスク保存（ステータス・メモ）
  // =============================================

  async function handleSave() {
    if (!task) return
    setSaving(true)
    setError('')
    setSaveSuccess(false)
    try {
      const body: Record<string, unknown> = {}
      if (editStatus !== task.status) body.status = editStatus
      if (editNotes !== (task.notes ?? '')) body.notes = editNotes || null

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

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
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
  if (error && !task) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          タスク一覧に戻る
        </Button>
      </div>
    )
  }
  if (!task) return null

  const taskType = getTaskType(task.taskCode)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          タスク一覧に戻る
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground">
          {task.taskCode}
        </span>
        <h1 className="text-2xl font-bold">{task.taskName}</h1>
      </div>

      {task.template.description && (
        <p className="text-sm text-muted-foreground">
          {task.template.description}
        </p>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </Select>
        </CardContent>
      </Card>

      {/* タスク種別に応じたコンテンツ */}
      {taskType === 'file_upload' && (
        <FileUploadSection
          task={task}
          projectId={projectId}
          onUploaded={fetchTask}
        />
      )}

      {taskType === 'data_entry' && (
        <DataEntrySection projectId={projectId} />
      )}

      {taskType === 'document' && <DocumentSection task={task} />}

      {taskType === 'review' && <ReviewSection projectId={projectId} />}

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
            <p className="text-sm text-muted-foreground">
              まだ変更がありません
            </p>
          ) : (
            <div className="space-y-2">
              {task.statusLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {formatDateTime(log.changedAt)}
                  </span>
                  <Badge
                    variant={taskStatusVariant(log.fromStatus)}
                    className="text-xs"
                  >
                    {projectTaskStatus.labelMap[
                      log.fromStatus as keyof typeof projectTaskStatus.labelMap
                    ]}
                  </Badge>
                  <span className="text-muted-foreground">&rarr;</span>
                  <Badge
                    variant={taskStatusVariant(log.toStatus)}
                    className="text-xs"
                  >
                    {projectTaskStatus.labelMap[
                      log.toStatus as keyof typeof projectTaskStatus.labelMap
                    ]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-2">
        {saveSuccess && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" /> 保存しました
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}

// =============================================
// ファイルアップロードセクション（COL系）
// =============================================

function FileUploadSection({
  task,
  projectId,
  onUploaded,
}: {
  task: TaskDetail
  projectId: string
  onUploaded: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  /** ファイルを選択してタスクに紐づける */
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    try {
      // ファイルパスとして「{タスクコード}/{ファイル名}」を保存する
      // 実際のファイルストレージ（Box等）への保存は将来実装
      const filePath = `${task.taskCode}/${file.name}`

      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || 'アップロードに失敗しました')
      }

      onUploaded()
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'アップロードに失敗しました',
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** ファイルを削除する */
  async function handleRemoveFile() {
    setUploadError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '削除に失敗しました')
      onUploaded()
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : '削除に失敗しました',
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ファイル</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {uploadError}
          </div>
        )}

        {task.filePath ? (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{task.filePath}</p>
                <p className="text-xs text-muted-foreground">
                  アップロード済み
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            まだファイルがアップロードされていません
          </p>
        )}

        <div>
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'アップロード中...' : 'ファイルをアップロード'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================
// データ入力セクション（DAT系：企業情報フォーム）
// =============================================

/** 分野の選択肢 */
const SSW_FIELD_OPTIONS = [
  { value: 'NURSING_CARE', label: '介護' },
  { value: 'ACCOMMODATION', label: '宿泊' },
  { value: 'FOOD_SERVICE', label: '外食業' },
  { value: 'FOOD_MANUFACTURING', label: '飲食料品製造業' },
  { value: 'AUTO_TRANSPORT', label: '自動車運送業' },
]

function DataEntrySection({ projectId }: { projectId: string }) {
  const [form, setForm] = useState<CompanyFormData>(EMPTY_COMPANY)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyError, setCompanyError] = useState('')
  const [companySaved, setCompanySaved] = useState(false)

  // プロジェクトの contextData から companyId を取得し、企業情報を読み込む
  useEffect(() => {
    async function loadCompany() {
      setLoadingCompany(true)
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const json = await res.json()
        if (!res.ok) return

        const ctx = json.data.contextData as Record<string, unknown> | null
        const existingCompanyId = ctx?.companyId as string | undefined

        if (existingCompanyId) {
          // 既存の企業情報を読み込む
          setCompanyId(existingCompanyId)
          const compRes = await fetch(
            `/api/ssw/companies/${existingCompanyId}`,
          )
          const compJson = await compRes.json()
          if (compRes.ok) {
            const c = compJson.data
            setForm({
              name: c.name ?? '',
              representative: c.representative ?? '',
              postalCode: c.postalCode ?? '',
              address: c.address ?? '',
              phone: c.phone ?? '',
              field: c.field ?? '',
              businessLicense: c.businessLicense ?? '',
              corporateNumber: c.corporateNumber ?? '',
              establishedDate: c.establishedDate
                ? c.establishedDate.split('T')[0]
                : '',
              notes: c.notes ?? '',
            })
          }
        }

        // contextData に sswField があればフォームに初期値セット
        if (!existingCompanyId && ctx?.sswField) {
          setForm((prev) => ({ ...prev, field: ctx.sswField as string }))
        }
      } catch {
        // 読み込みエラーは無視（フォームは空のまま）
      } finally {
        setLoadingCompany(false)
      }
    }
    loadCompany()
  }, [projectId])

  function updateField(key: keyof CompanyFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /** 企業情報を保存する */
  async function handleSaveCompany() {
    setSavingCompany(true)
    setCompanyError('')
    setCompanySaved(false)

    // 必須フィールドのバリデーション
    if (!form.name || !form.representative || !form.address || !form.phone) {
      setCompanyError('企業名・代表者名・所在地・電話番号は必須です')
      setSavingCompany(false)
      return
    }
    if (!form.field) {
      setCompanyError('分野を選択してください')
      setSavingCompany(false)
      return
    }

    try {
      const payload = {
        name: form.name,
        representative: form.representative,
        postalCode: form.postalCode || undefined,
        address: form.address,
        phone: form.phone,
        field: form.field,
        businessLicense: form.businessLicense || undefined,
        corporateNumber: form.corporateNumber || undefined,
        establishedDate: form.establishedDate || undefined,
        notes: form.notes || undefined,
      }

      let savedCompanyId = companyId

      if (companyId) {
        // 既存の企業を更新
        const res = await fetch(`/api/ssw/companies/${companyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error?.message || '企業情報の更新に失敗しました')
        }
      } else {
        // 新規企業を作成
        const res = await fetch('/api/ssw/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error?.message || '企業情報の保存に失敗しました')
        }
        savedCompanyId = json.data.id
        setCompanyId(savedCompanyId)
      }

      // プロジェクトの contextData に companyId を保存する
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextData: { companyId: savedCompanyId },
        }),
      })

      setCompanySaved(true)
      setTimeout(() => setCompanySaved(false), 3000)
    } catch (err) {
      setCompanyError(
        err instanceof Error ? err.message : '保存に失敗しました',
      )
    } finally {
      setSavingCompany(false)
    }
  }

  if (loadingCompany) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            企業情報を読み込み中...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">企業情報入力</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          受入れ企業の基本情報を入力してください。
          保存すると DOC 系タスクの申請書に自動反映されます。
        </p>

        {companyError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {companyError}
          </div>
        )}

        {/* フォーム本体 */}
        <div className="grid gap-4">
          <div className="space-y-1">
            <Label>
              企業名 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="株式会社サンプル"
            />
          </div>

          <div className="space-y-1">
            <Label>
              代表者名 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.representative}
              onChange={(e) => updateField('representative', e.target.value)}
              placeholder="山田太郎"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>郵便番号</Label>
              <Input
                value={form.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="123-4567"
              />
            </div>
            <div className="space-y-1">
              <Label>
                電話番号 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="03-1234-5678"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>
              所在地 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="東京都千代田区..."
            />
          </div>

          <div className="space-y-1">
            <Label>
              分野 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.field}
              onChange={(e) => updateField('field', e.target.value)}
            >
              <option value="">選択してください</option>
              {SSW_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>法人番号</Label>
              <Input
                value={form.corporateNumber}
                onChange={(e) =>
                  updateField('corporateNumber', e.target.value)
                }
                placeholder="1234567890123"
                maxLength={13}
              />
            </div>
            <div className="space-y-1">
              <Label>設立年月日</Label>
              <Input
                type="date"
                value={form.establishedDate}
                onChange={(e) =>
                  updateField('establishedDate', e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>営業許可</Label>
            <Input
              value={form.businessLicense}
              onChange={(e) =>
                updateField('businessLicense', e.target.value)
              }
              placeholder="旅館業許可 第123号"
            />
          </div>

          <div className="space-y-1">
            <Label>備考</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="備考があれば入力..."
              rows={2}
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex items-center justify-end gap-2">
          {companySaved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="h-4 w-4" /> 企業情報を保存しました
            </span>
          )}
          <Button onClick={handleSaveCompany} disabled={savingCompany}>
            {savingCompany ? '保存中...' : '企業情報を保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================
// 書類作成セクション（DOC系）
// =============================================

function DocumentSection({ task }: { task: TaskDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">書類</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.filePath ? (
          <div className="flex items-center gap-2 rounded-md border p-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{task.filePath}</p>
              <p className="text-xs text-muted-foreground">生成済み</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            企業情報（DAT-001）の入力完了後に自動生成されます。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================
// 最終確認セクション（REV系）
// =============================================

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

        const countByGroup = (
          filterFn: (code: string) => boolean,
        ) => {
          const filtered = tasks.filter(
            (t) => filterFn(t.taskCode) && t.status !== 'NOT_REQUIRED',
          )
          return {
            completed: filtered.filter((t) => t.status === 'COMPLETED')
              .length,
            total: filtered.length,
          }
        }

        const incomplete = tasks.filter(
          (t) =>
            t.status !== 'COMPLETED' &&
            t.status !== 'NOT_REQUIRED' &&
            !t.taskCode.startsWith('REV-'),
        )

        setSummary({
          internal: countByGroup(
            (c) => c.startsWith('DAT-') || c.startsWith('DOC-'),
          ),
          applicant: countByGroup((c) => {
            if (!c.startsWith('COL-')) return false
            const n = parseInt(c.replace('COL-', ''), 10)
            return (n >= 1 && n <= 11) || (n >= 19 && n <= 20)
          }),
          company: countByGroup((c) => {
            if (!c.startsWith('COL-')) return false
            const n = parseInt(c.replace('COL-', ''), 10)
            return (n >= 12 && n <= 18) || (n >= 21 && n <= 23)
          }),
          incomplete,
        })
      } catch {
        // サマリー取得失敗は無視
      }
    }
    fetchSummary()
  }, [projectId])

  const allComplete =
    summary !== null && summary.incomplete.length === 0

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
                  <p
                    key={t.taskCode}
                    className="text-sm text-muted-foreground"
                  >
                    ・{t.taskCode} {t.taskName} —{' '}
                    {
                      projectTaskStatus.labelMap[
                        t.status as keyof typeof projectTaskStatus.labelMap
                      ]
                    }
                  </p>
                ))}
              </div>
            )}

            {allComplete && (
              <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">
                  全タスク完了。申請書類セットを生成できます。
                </p>
                <Button disabled>申請書類セットを生成</Button>
                <p className="text-xs text-muted-foreground">
                  PDF 生成機能は将来実装予定です。
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================
// 共通コンポーネント
// =============================================

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
