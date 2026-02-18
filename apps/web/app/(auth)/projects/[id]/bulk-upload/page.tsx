'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, X, Loader2 } from 'lucide-react'

// =============================================
// 型定義
// =============================================

type UploadedFile = {
  file: File
  /** ブラウザ上でのプレビュー用の一時ID */
  tempId: string
}

type AnalysisResult = {
  fileName: string
  taskId: string | null
  taskCode: string | null
  taskName: string | null
  confidence: 'high' | 'medium' | 'low'
  extractedData?: Record<string, string>
}

type TaskOption = {
  id: string
  taskCode: string
  taskName: string
}

// =============================================
// 定数
// =============================================

const CONFIDENCE_CONFIG = {
  high: { label: '確定', variant: 'secondary' as const, icon: '✓' },
  medium: { label: '確認', variant: 'outline' as const, icon: '⚠' },
  low: { label: '不明', variant: 'destructive' as const, icon: '❌' },
}

// =============================================
// メインコンポーネント
// =============================================

export default function BulkUploadPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ステップ管理: upload → analyzing → results
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // =============================================
  // ファイル選択
  // =============================================

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    const uploaded = newFiles.map((file) => ({
      file,
      tempId: crypto.randomUUID(),
    }))
    setFiles((prev) => [...prev, ...uploaded])
    // input をリセットして同じファイルを再選択可能にする
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const newFiles = Array.from(e.dataTransfer.files)
    const uploaded = newFiles.map((file) => ({
      file,
      tempId: crypto.randomUUID(),
    }))
    setFiles((prev) => [...prev, ...uploaded])
  }

  function removeFile(tempId: string) {
    setFiles((prev) => prev.filter((f) => f.tempId !== tempId))
  }

  // =============================================
  // AI解析
  // =============================================

  async function handleAnalyze() {
    if (files.length === 0) return
    setStep('analyzing')
    setError('')

    try {
      // ファイル情報をAPIに送信（実際のファイル内容はBase64エンコード）
      const fileData = await Promise.all(
        files.map(async (f) => ({
          fileName: f.file.name,
          content: await fileToBase64(f.file),
          mimeType: f.file.type,
        })),
      )

      const res = await fetch(`/api/projects/${projectId}/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '解析に失敗しました')

      setResults(json.data.results)
      setTasks(json.data.tasks)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析に失敗しました')
      setStep('upload')
    }
  }

  // =============================================
  // 振り分け先の変更
  // =============================================

  function handleTaskChange(fileName: string, newTaskId: string) {
    setResults((prev) =>
      prev.map((r) => {
        if (r.fileName !== fileName) return r
        const task = tasks.find((t) => t.id === newTaskId)
        return {
          ...r,
          taskId: task?.id ?? null,
          taskCode: task?.taskCode ?? null,
          taskName: task?.taskName ?? null,
        }
      }),
    )
  }

  // =============================================
  // 確定・格納
  // =============================================

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      const assignments = results
        .filter((r) => r.taskId)
        .map((r) => ({
          fileName: r.fileName,
          taskId: r.taskId!,
        }))

      const res = await fetch(`/api/projects/${projectId}/bulk-upload`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '格納に失敗しました')

      // 成功したらプロジェクト詳細に戻る
      router.push(`/projects/${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '格納に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // =============================================
  // レンダリング
  // =============================================

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)}>
          <ArrowLeft className="h-4 w-4" />
          プロジェクトに戻る
        </Button>
        <h1 className="text-2xl font-bold">書類をまとめてアップロード</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* STEP 1: ファイル選択 */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>ファイルを選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ドラッグ＆ドロップエリア */}
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                ファイルをドラッグ＆ドロップ
              </p>
              <p className="text-xs text-muted-foreground mb-3">または</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                ファイルを選択
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground mt-3">
                複数ファイル対応（PDF・画像）
              </p>
            </div>

            {/* 選択済みファイル一覧 */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">アップロード予定: {files.length}件</p>
                {files.map((f) => (
                  <div
                    key={f.tempId}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{f.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(f.file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(f.tempId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={files.length === 0}
              >
                AIで解析して振り分ける
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: 解析中 */}
      {step === 'analyzing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              アップロードされた書類を解析中...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {files.length}件のファイルを解析しています
            </p>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: 解析結果の確認 */}
      {step === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle>解析結果の確認</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {results.length}件のファイルを解析しました。振り分け先を確認してください。
            </p>

            {results.map((result) => {
              const conf = CONFIDENCE_CONFIG[result.confidence]
              return (
                <div key={result.fileName} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{result.fileName}</span>
                    </div>
                    <Badge variant={conf.variant}>
                      {conf.icon} {conf.label}
                    </Badge>
                  </div>

                  {/* 振り分け先の選択 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">&rarr;</span>
                    <Select
                      value={result.taskId ?? ''}
                      onChange={(e) => handleTaskChange(result.fileName, e.target.value)}
                      className="flex-1"
                    >
                      <option value="">（振り分け先を選択）</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode} {t.taskName}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* 読み取ったデータ（ある場合） */}
                  {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                      <p className="font-medium mb-1">読み取ったデータ:</p>
                      {Object.entries(result.extractedData).map(([key, value]) => (
                        <p key={key} className="text-muted-foreground">
                          ☑ {key}: {value}
                        </p>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">
                        &rarr; DAT-001 のフォームにも自動入力します
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload')
                  setResults([])
                }}
              >
                やり直す
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={saving || results.every((r) => !r.taskId)}
              >
                {saving ? '格納中...' : '確定して格納する'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =============================================
// ユーティリティ
// =============================================

/** ファイルをBase64文字列に変換する */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // data:xxx;base64, のプレフィックスを除去
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** ファイルサイズを読みやすい形式にフォーマット */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
