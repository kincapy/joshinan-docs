'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { agentType } from '@joshinan/domain'
import { BasicInfoTab } from './tabs/basic-info'
import { StudentsTab } from './tabs/students'
import { InvoicesTab } from './tabs/invoices'
import { PaymentsTab } from './tabs/payments'

/** エージェントデータの型（API レスポンス） */
export type Agent = {
  id: string
  name: string
  country: string
  type: string
  feePerStudent: string | null
  contactInfo: string | null
  notes: string | null
  isActive: boolean
  aliases: Array<{ id: string; aliasName: string }>
  students: Array<{
    id: string
    studentNumber: string
    nameKanji: string | null
    nameEn: string
    nationality: string
    status: string
  }>
  agentInvoices: Array<{
    id: string
    invoiceNumber: string
    invoiceDate: string
    amount: string
    status: string
    notes: string | null
    payments: Array<{
      id: string
      paymentNumber: string
      paymentDate: string
      amount: string
      notes: string | null
    }>
  }>
}

/** エージェント詳細画面 */
export default function AgentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${params.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setAgent(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchAgent()
  }, [fetchAgent])

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (error) return <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
  if (!agent) return <div className="text-muted-foreground">エージェントが見つかりません</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/agents')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <Badge>
              {agentType.labelMap[agent.type as keyof typeof agentType.labelMap] ?? agent.type}
            </Badge>
            {!agent.isActive && (
              <Badge variant="destructive">無効</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {agent.country}
          </p>
        </div>
      </div>

      {/* 4タブ構成 */}
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="students">
            学生一覧 ({agent.students.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            請求書 ({agent.agentInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="payments">支払い</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoTab agent={agent} onUpdate={fetchAgent} />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab agent={agent} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab agent={agent} onUpdate={fetchAgent} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab agent={agent} onUpdate={fetchAgent} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
