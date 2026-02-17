'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FileDown } from 'lucide-react'

/** テンプレート詳細の型 */
type Template = {
  id: string
  name: string
  outputFormat: 'EXCEL' | 'DOCX'
  description: string | null
}

/**
 * 文書生成画面
 * テンプレート情報を表示し、備考を入力して生成（レコード作成）する。
 * 実際のファイル出力処理は今回スコープ外（placeholder）。
 */
export default function GenerateDocumentPage() {
  const router = useRouter()
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId

  const [template, setTemplate] = useState<Template | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const fetchTemplate = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/documents/templates/${templateId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setTemplate(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!template) return
    setGenerating(true)
    setError('')

    try {
      /**
       * 文書生成レコードを作成する。
       * filePath は仮の値（実際のファイル出力は 17-documents で実装予定）。
       * createdById はログインユーザーに紐づく Staff ID が必要だが、
       * 現時点では仮の値を使用する（TODO: Staff 紐づけ処理）。
       */
      const res = await fetch('/api/documents/generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          createdById: '00000000-0000-0000-0000-000000000000',
          filePath: `/generated/${template.name}_${Date.now()}.${template.outputFormat === 'EXCEL' ? 'xlsx' : 'docx'}`,
          notes: notes || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '生成に失敗しました')

      router.push('/documents/history')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  if (!template) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          テンプレートが見つかりません
        </div>
        <Button variant="ghost" onClick={() => router.push('/documents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">文書生成</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleGenerate}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* テンプレート情報 */}
            <div className="space-y-1">
              <Label>出力形式</Label>
              <Input
                value={template.outputFormat === 'EXCEL' ? 'Excel (.xlsx)' : 'Word (.docx)'}
                disabled
              />
            </div>

            {/* 備考 */}
            <div className="space-y-1">
              <Label>備考</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="生成に関するメモを入力（任意）"
                rows={3}
              />
            </div>

            {/* TODO: テンプレートごとの動的フォームフィールド（17-documents で実装予定） */}
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              実際のファイル出力機能は今後実装予定です。現在はレコードの作成のみ行います。
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={generating}>
            <FileDown className="h-4 w-4" />
            {generating ? '生成中...' : '文書を生成'}
          </Button>
        </div>
      </form>
    </div>
  )
}
