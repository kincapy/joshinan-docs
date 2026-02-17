'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { Agent } from '../page'

/** 金額フォーマット */
function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(amount))
}

/** 日付フォーマット */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

/** 支払いタブ */
export function PaymentsTab({
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
    agentInvoiceId: '',
    paymentDate: '',
    amount: '',
    notes: '',
  })

  // 支払い対象の請求書（未払い・一部支払いのもの）
  const unpaidInvoices = agent.agentInvoices.filter(
    (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIAL',
  )

  // 全請求書の支払い一覧をフラットに取得
  const allPayments = agent.agentInvoices
    .flatMap((inv) =>
      inv.payments.map((p) => ({
        ...p,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: inv.amount,
      })),
    )
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/agents/${agent.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentInvoiceId: form.agentInvoiceId,
          paymentDate: form.paymentDate,
          amount: Number(form.amount),
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')
      setShowForm(false)
      setForm({ agentInvoiceId: '', paymentDate: '', amount: '', notes: '' })
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
          <CardTitle>支払い一覧</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            disabled={unpaidInvoices.length === 0}
          >
            <Plus className="h-4 w-4" />
            支払い登録
          </Button>
        </CardHeader>
        <CardContent>
          {/* 新規登録フォーム */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-md border p-4 space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>対象請求書 <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.agentInvoiceId}
                    onChange={(e) => setForm((p) => ({ ...p, agentInvoiceId: e.target.value }))}
                    required
                  >
                    <option value="">選択してください</option>
                    {unpaidInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {formatCurrency(inv.amount)}（{formatDate(inv.invoiceDate)}）
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>支払日 <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
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
              <p className="text-xs text-muted-foreground">
                支払番号は自動採番されます。全額支払い完了時に請求書ステータスが自動更新されます。
              </p>
            </form>
          )}

          {/* 支払いテーブル */}
          {allPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">支払い記録はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>支払番号</TableHead>
                  <TableHead>対象請求書</TableHead>
                  <TableHead>支払日</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">{payment.paymentNumber}</TableCell>
                    <TableCell className="font-mono">{payment.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {unpaidInvoices.length === 0 && agent.agentInvoices.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              未払いの請求書はありません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
