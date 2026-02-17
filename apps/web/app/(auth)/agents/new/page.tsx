'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { agentType } from '@joshinan/domain'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'

/** エージェント登録フォームの型 */
type AgentForm = {
  name: string
  country: string
  type: string
  feePerStudent: string
  contactInfo: string
  notes: string
  aliases: string[]
}

const initialForm: AgentForm = {
  name: '',
  country: '',
  type: '',
  feePerStudent: '',
  contactInfo: '',
  notes: '',
  aliases: [],
}

/** エージェント登録画面 */
export default function NewAgentPage() {
  const router = useRouter()
  const [form, setForm] = useState<AgentForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(field: keyof AgentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** 別名を追加 */
  function addAlias() {
    setForm((prev) => ({ ...prev, aliases: [...prev.aliases, ''] }))
  }

  /** 別名を更新 */
  function updateAlias(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      aliases: prev.aliases.map((a, i) => (i === index ? value : a)),
    }))
  }

  /** 別名を削除 */
  function removeAlias(index: number) {
    setForm((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          type: form.type,
          feePerStudent: form.feePerStudent ? Number(form.feePerStudent) : null,
          contactInfo: form.contactInfo || null,
          notes: form.notes || null,
          aliases: form.aliases.filter((a) => a.trim() !== ''),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // 登録後はエージェント詳細画面にリダイレクト
      router.push(`/agents/${json.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/agents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">エージェント登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>
                  エージェント名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="正規化後の名称"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  国 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="例: ベトナム"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>
                  種別 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {agentType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>紹介手数料（1名あたり・円）</Label>
                <Input
                  type="number"
                  value={form.feePerStudent}
                  onChange={(e) => updateField('feePerStudent', e.target.value)}
                  placeholder="例: 50000"
                  min="0"
                />
              </div>
              <div className="space-y-1">
                <Label>連絡先</Label>
                <Input
                  value={form.contactInfo}
                  onChange={(e) => updateField('contactInfo', e.target.value)}
                  placeholder="電話番号、メール等"
                />
              </div>
            </CardContent>
          </Card>

          {/* 別名・備考 */}
          <Card>
            <CardHeader>
              <CardTitle>別名・備考</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>別名（法人名・通称）</Label>
                {form.aliases.map((alias, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={alias}
                      onChange={(e) => updateAlias(index, e.target.value)}
                      placeholder="請求書等に記載される法人名"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAlias(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAlias}>
                  <Plus className="h-4 w-4" />
                  別名を追加
                </Button>
              </div>
              <div className="space-y-1">
                <Label>備考</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="メモ"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                別名は、請求書の法人名とエージェントを照合する際に使用されます。
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 送信ボタン */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? '登録中...' : '登録'}
          </Button>
        </div>
      </form>
    </div>
  )
}
