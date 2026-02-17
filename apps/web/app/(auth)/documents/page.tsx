'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, FileText, History, Plus } from 'lucide-react'

/** テンプレートの型 */
type TemplateRow = {
  id: string
  name: string
  outputFormat: 'EXCEL' | 'DOCX'
  description: string | null
  isActive: boolean
  _count: { generatedDocuments: number }
}

/** 出力形式の日本語ラベル */
const outputFormatLabel: Record<string, string> = {
  EXCEL: 'Excel',
  DOCX: 'Word',
}

/** 出力形式に応じたアイコンを返す */
function FormatIcon({ format }: { format: string }) {
  if (format === 'EXCEL') return <FileSpreadsheet className="h-8 w-8 text-green-600" />
  return <FileText className="h-8 w-8 text-blue-600" />
}

/** テンプレート一覧画面（カード形式） */
export default function DocumentsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/documents/templates')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setTemplates(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">社内文書</h1>
        <div className="flex gap-2">
          <Link href="/documents/history">
            <Button variant="outline">
              <History className="mr-1 h-4 w-4" />
              生成履歴
            </Button>
          </Link>
          <Button onClick={() => router.push('/documents/new')}>
            <Plus className="h-4 w-4" />
            テンプレート登録
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* テンプレートカード一覧 */}
      {templates.length === 0 ? (
        <div className="text-muted-foreground">テンプレートがまだ登録されていません</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/documents/${t.id}/generate`)}
            >
              <CardHeader className="flex flex-row items-start gap-4">
                <FormatIcon format={t.outputFormat} />
                <div className="space-y-1">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription>
                    {t.description || '説明なし'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="outline">
                  {outputFormatLabel[t.outputFormat] || t.outputFormat}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  生成 {t._count.generatedDocuments} 件
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
