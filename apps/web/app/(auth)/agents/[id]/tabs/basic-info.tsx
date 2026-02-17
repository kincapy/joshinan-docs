'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { agentType } from '@joshinan/domain'
import { Pencil, Save, X, Plus, Trash2 } from 'lucide-react'
import type { Agent } from '../page'

/** 表示用の金額フォーマット */
function formatCurrency(amount: string | number | null): string {
  if (amount === null) return '-'
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(amount))
}

/** 基本情報タブ */
export function BasicInfoTab({
  agent,
  onUpdate,
}: {
  agent: Agent
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: agent.name,
    country: agent.country,
    type: agent.type,
    feePerStudent: agent.feePerStudent ? String(Number(agent.feePerStudent)) : '',
    contactInfo: agent.contactInfo ?? '',
    notes: agent.notes ?? '',
    isActive: agent.isActive,
  })

  // 別名管理
  const [newAlias, setNewAlias] = useState('')
  const [aliasError, setAliasError] = useState('')

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          type: form.type,
          feePerStudent: form.feePerStudent ? Number(form.feePerStudent) : null,
          contactInfo: form.contactInfo || null,
          notes: form.notes || null,
          isActive: form.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')
      setEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 別名を追加 */
  async function handleAddAlias() {
    if (!newAlias.trim()) return
    setAliasError('')
    try {
      const res = await fetch(`/api/agents/${agent.id}/aliases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aliasName: newAlias.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '追加に失敗しました')
      setNewAlias('')
      onUpdate()
    } catch (err) {
      setAliasError(err instanceof Error ? err.message : '追加に失敗しました')
    }
  }

  /** 別名を削除 */
  async function handleDeleteAlias(aliasId: string) {
    try {
      const res = await fetch(`/api/agents/${agent.id}/aliases?aliasId=${aliasId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '削除に失敗しました')
      onUpdate()
    } catch (err) {
      setAliasError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 基本情報カード */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>基本情報</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              編集
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
                キャンセル
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
          )}

          {editing ? (
            <>
              <div className="space-y-1">
                <Label>エージェント名</Label>
                <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>国</Label>
                <Input value={form.country} onChange={(e) => updateField('country', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>種別</Label>
                <Select value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                  {agentType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>紹介手数料（円/人）</Label>
                <Input
                  type="number"
                  value={form.feePerStudent}
                  onChange={(e) => updateField('feePerStudent', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>連絡先</Label>
                <Input value={form.contactInfo} onChange={(e) => updateField('contactInfo', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>備考</Label>
                <Input value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  id="isActive"
                />
                <Label htmlFor="isActive">有効</Label>
              </div>
            </>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">エージェント名</dt>
                <dd>{agent.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">国</dt>
                <dd>{agent.country}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">種別</dt>
                <dd>{agentType.labelMap[agent.type as keyof typeof agentType.labelMap] ?? agent.type}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">紹介手数料（円/人）</dt>
                <dd>{formatCurrency(agent.feePerStudent)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">連絡先</dt>
                <dd>{agent.contactInfo || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">備考</dt>
                <dd>{agent.notes || '-'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* 別名カード */}
      <Card>
        <CardHeader>
          <CardTitle>別名（法人名・通称）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aliasError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{aliasError}</div>
          )}

          {agent.aliases.length === 0 ? (
            <p className="text-sm text-muted-foreground">別名は登録されていません</p>
          ) : (
            <ul className="space-y-2">
              {agent.aliases.map((alias) => (
                <li key={alias.id} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">{alias.aliasName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlias(alias.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              placeholder="新しい別名"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAlias()
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={handleAddAlias}>
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            請求書の法人名とエージェントを照合する際に使用されます。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
