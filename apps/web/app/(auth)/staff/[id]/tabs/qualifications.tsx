'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { qualificationType } from '@joshinan/domain'
import { Plus, Trash2 } from 'lucide-react'
import type { Qualification } from '../page'

/** 日付文字列を表示用にフォーマット */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

/** 有効期限が切れているかチェック */
function isExpired(expirationDate: string | null): boolean {
  if (!expirationDate) return false
  return new Date(expirationDate) < new Date()
}

/** 資格一覧タブ */
export function QualificationsTab({
  staffId,
  qualifications,
  onUpdate,
}: {
  staffId: string
  qualifications: Qualification[]
  onUpdate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // 追加フォームの状態
  const [form, setForm] = useState({
    qualificationType: '',
    acquiredDate: '',
    expirationDate: '',
    notes: '',
  })

  /** 資格を追加 */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/${staffId}/qualifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualificationType: form.qualificationType,
          acquiredDate: form.acquiredDate || null,
          expirationDate: form.expirationDate || null,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      // フォームリセット・再取得
      setForm({ qualificationType: '', acquiredDate: '', expirationDate: '', notes: '' })
      setShowForm(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 資格を削除 */
  async function handleDelete(qualificationId: string) {
    if (!confirm('この資格を削除しますか？')) return

    setDeleting(qualificationId)
    setError('')
    try {
      const res = await fetch(
        `/api/staff/${staffId}/qualifications?qualificationId=${qualificationId}`,
        { method: 'DELETE' },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '削除に失敗しました')
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">保有資格</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
            資格を追加
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* 追加フォーム */}
        {showForm && (
          <form onSubmit={handleAdd} className="rounded-md border p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>
                  資格種別 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.qualificationType}
                  onChange={(e) => setForm({ ...form, qualificationType: e.target.value })}
                  required
                >
                  <option value="">選択してください</option>
                  {qualificationType.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>取得日</Label>
                <Input
                  type="date"
                  value={form.acquiredDate}
                  onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>有効期限</Label>
                <Input
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>備考</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="備考があれば入力"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? '登録中...' : '追加'}
              </Button>
            </div>
          </form>
        )}

        {/* 資格テーブル */}
        {qualifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">資格が登録されていません</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>資格種別</TableHead>
                <TableHead>取得日</TableHead>
                <TableHead>有効期限</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifications.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    {qualificationType.labelMap[q.qualificationType as keyof typeof qualificationType.labelMap] ?? q.qualificationType}
                  </TableCell>
                  <TableCell>{formatDate(q.acquiredDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(q.expirationDate)}
                      {isExpired(q.expirationDate) && (
                        <Badge variant="destructive">期限切れ</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.notes ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      disabled={deleting === q.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
