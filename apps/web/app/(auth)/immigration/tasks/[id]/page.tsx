'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, Check, Circle, FileCheck } from 'lucide-react'

/** 入管書類の型 */
type ImmigrationDocument = {
  id: string
  documentName: string
  collectionStatus: string
  notes: string | null
}

/** タスク詳細の型 */
type TaskDetail = {
  id: string
  taskType: string
  trigger: string
  deadline: string
  status: string
  legalBasis: string | null
  submissionMethod: string | null
  completedAt: string | null
  notes: string | null
  student: { id: string; studentNumber: string; nameEn: string; nameKanji: string | null } | null
  documents: ImmigrationDocument[]
}

/** タスク種別の日本語ラベル */
const taskTypeLabel: Record<string, string> = {
  WITHDRAWAL_REPORT: '退学者報告',
  LOW_ATTENDANCE_REPORT: '出席率5割未満報告',
  ENROLLMENT_NOTIFICATION: '受入れ開始届出',
  DEPARTURE_NOTIFICATION: '受入れ終了届出',
  MISSING_PERSON_REPORT: '所在不明者報告',
  CHANGE_NOTIFICATION: '変更届出',
  COE_APPLICATION: 'COE交付申請',
  VISA_RENEWAL: '在留期間更新',
}

/** ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  DONE: '完了',
  OVERDUE: '期限超過',
}

/** 書類収集状態の日本語ラベル */
const collectionLabel: Record<string, string> = {
  NOT_COLLECTED: '未回収',
  COLLECTED: '回収済み',
  AUTO_GENERATED: '自動生成',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'OVERDUE') return 'destructive'
  if (status === 'DONE') return 'secondary'
  if (status === 'IN_PROGRESS') return 'default'
  return 'outline'
}

/** タスク詳細画面 */
export default function ImmigrationTaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/immigration/tasks/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** 書類収集状態を切り替え（NOT_COLLECTED ↔ COLLECTED） */
  async function toggleDocumentStatus(doc: ImmigrationDocument) {
    const newStatus = doc.collectionStatus === 'COLLECTED' ? 'NOT_COLLECTED' : 'COLLECTED'
    try {
      const res = await fetch(`/api/immigration/tasks/${id}/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionStatus: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || '更新に失敗しました')
      }
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  /** タスクのステータスを変更 */
  async function updateStatus(newStatus: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/immigration/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || '更新に失敗しました')
      }
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (!data) return <div className="text-muted-foreground">タスクが見つかりません</div>

  /* 全書類が回収済みまたは自動生成かチェック */
  const allCollected = data.documents.length > 0 &&
    data.documents.every((d) => d.collectionStatus !== 'NOT_COLLECTED')

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/immigration/tasks')}>
          <ArrowLeft className="h-4 w-4" />
          タスク一覧
        </Button>
        <h1 className="text-2xl font-bold">{taskTypeLabel[data.taskType] || data.taskType}</h1>
        <Badge variant={statusVariant(data.status)}>
          {statusLabel[data.status] || data.status}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* タスク情報 */}
        <Card>
          <CardHeader>
            <CardTitle>タスク情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">対象学生</span>
              <p>
                {data.student
                  ? `${data.student.studentNumber} ${data.student.nameKanji || data.student.nameEn}`
                  : 'なし（学校全体）'}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">期限</span>
              <p className="font-semibold">{data.deadline}</p>
            </div>
            {data.legalBasis && (
              <div>
                <span className="text-sm text-muted-foreground">根拠法令</span>
                <p>{data.legalBasis}</p>
              </div>
            )}
            {data.submissionMethod && (
              <div>
                <span className="text-sm text-muted-foreground">届出方法</span>
                <p>{data.submissionMethod}</p>
              </div>
            )}
            {data.completedAt && (
              <div>
                <span className="text-sm text-muted-foreground">完了日</span>
                <p>{data.completedAt}</p>
              </div>
            )}
            {data.notes && (
              <div>
                <span className="text-sm text-muted-foreground">備考</span>
                <p className="whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* アクション */}
        <Card>
          <CardHeader>
            <CardTitle>アクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.status !== 'DONE' && (
              <>
                {data.status === 'TODO' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatus('IN_PROGRESS')}
                    disabled={saving}
                  >
                    着手する（進行中に変更）
                  </Button>
                )}
                <Button
                  className="w-full"
                  onClick={() => updateStatus('DONE')}
                  disabled={saving}
                >
                  <Check className="mr-1 h-4 w-4" />
                  タスク完了
                </Button>
              </>
            )}
            {allCollected && data.status !== 'DONE' && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                <FileCheck className="mr-1 inline h-4 w-4" />
                全書類の回収が完了しています。提出可能です。
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 書類チェックリスト */}
      <Card>
        <CardHeader>
          <CardTitle>書類チェックリスト</CardTitle>
        </CardHeader>
        <CardContent>
          {data.documents.length === 0 ? (
            <p className="text-muted-foreground">書類はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>書類名</TableHead>
                  <TableHead>収集状態</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {doc.collectionStatus === 'AUTO_GENERATED' ? (
                        /* 自動生成は変更不可 */
                        <FileCheck className="h-5 w-5 text-blue-500" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleDocumentStatus(doc)}
                          className="hover:opacity-70"
                        >
                          {doc.collectionStatus === 'COLLECTED' ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>{doc.documentName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.collectionStatus === 'COLLECTED'
                            ? 'default'
                            : doc.collectionStatus === 'AUTO_GENERATED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {collectionLabel[doc.collectionStatus] || doc.collectionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
