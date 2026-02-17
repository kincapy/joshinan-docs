'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { agentInvoiceStatus } from '@joshinan/domain'
import { Plus } from 'lucide-react'
import type { Agent } from '../page'

/** ステータスに応じたバッジバリアント */
function invoiceStatusVariant(status: string) {
  switch (status) {
    case 'PAID': return 'default' as const
    case 'PARTIAL': return 'secondary' as const
    case 'UNPAID': return 'destructive' as const
    default: return 'secondary' as const
  }
}

/** 金額フォーマット */
function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(amount))
}

/** 日付フォーマット */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

/** 請求書タブ */
export function InvoicesTab({
  agent,
  onUpdate,
}: {
  agent: Agent
  onUpdate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    invoiceDate: '',
    amount: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/agents/${agent.id}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceDate: form.invoiceDate,
          amount: Number(form.amount),
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')
      setShowForm(false)
      setForm({ invoiceDate: '', amount: '', notes: '' })
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>請求書一覧</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            請求書登録
          </Button>
        </CardHeader>
        <CardContent>
          {/* 新規登録フォーム */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-md border p-4 space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>請求日 <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>金額（円） <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>備考</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  キャンセル
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? '登録中...' : '登録'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">請求書番号は自動採番されます。</p>
            </form>
          )}

          {/* 請求書テーブル */}
          {agent.agentInvoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">請求書はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>請求日</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead className="text-right">支払済</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.agentInvoices.map((invoice) => {
                  const paidAmount = invoice.payments.reduce(
                    (sum, p) => sum + Number(p.amount), 0,
                  )
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(paidAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceStatusVariant(invoice.status)}>
                          {agentInvoiceStatus.labelMap[invoice.status as keyof typeof agentInvoiceStatus.labelMap] ?? invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invoice.notes || '-'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
