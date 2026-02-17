'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Pencil } from 'lucide-react'

const FIELD_LABELS: Record<string, string> = {
  NURSING_CARE: '介護',
  ACCOMMODATION: '宿泊',
  FOOD_SERVICE: '外食業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  AUTO_TRANSPORT: '自動車運送業',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PROSPECTING: { label: '営業中', variant: 'outline' },
  PREPARING: { label: '書類準備中', variant: 'secondary' },
  APPLIED: { label: '申請中', variant: 'secondary' },
  REVIEWING: { label: '審査中', variant: 'secondary' },
  APPROVED: { label: '許可済み', variant: 'default' },
  EMPLOYED: { label: '入社済み', variant: 'default' },
  SUPPORTING: { label: '支援中', variant: 'default' },
  CLOSED: { label: '終了', variant: 'destructive' },
}

/** 書類ステータスの色分け */
const DOC_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-700',
  DRAFTING: 'bg-yellow-100 text-yellow-800',
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  COLLECTED: 'bg-blue-100 text-blue-800',
  AUTO_FILLED: 'bg-blue-100 text-blue-800',
  PENDING_REVIEW: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NOT_REQUIRED: 'bg-gray-50 text-gray-400',
  RETURNED: 'bg-red-100 text-red-800',
}

const DOC_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: '未着手',
  DRAFTING: '作成中',
  REQUESTED: '収集依頼中',
  COLLECTED: '収集済み',
  AUTO_FILLED: '自動入力済み',
  PENDING_REVIEW: '確認待ち',
  COMPLETED: '完了',
  NOT_REQUIRED: '不要',
  RETURNED: '差戻し',
}

const DOC_STATUS_OPTIONS = Object.entries(DOC_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  ISSUED: '発行済み',
  PAID: '入金済み',
  OVERDUE: '未入金',
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  REFERRAL: '紹介料',
  SUPPORT: '登録支援費',
}

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '実施中',
  COMPLETED: '完了',
  CANCELLED: '取消',
}

type CaseDocument = {
  id: string
  documentCode: string
  documentName: string
  status: string
  required: boolean
  autoFilled: boolean
  skipReason: string | null
  notes: string | null
}

type SswInvoice = {
  id: string
  invoiceNumber: string
  invoiceType: string
  amount: number
  tax: number
  issueDate: string
  dueDate: string
  status: string
}

type SupportPlanData = {
  id: string
  startDate: string
  endDate: string | null
  status: string
  notes: string | null
}

type CaseDetail = {
  id: string
  field: string
  status: string
  applicationDate: string | null
  approvalDate: string | null
  entryDate: string | null
  referralFee: number
  monthlySupportFee: number
  notes: string | null
  documentProgress: number
  company: { id: string; name: string; representative: string; phone: string; address: string }
  student: {
    id: string
    nameEn: string
    nameKanji: string | null
    nameKana: string | null
    studentNumber: string
    nationality: string
  }
  documents: CaseDocument[]
  supportPlan: SupportPlanData | null
  sswInvoices: SswInvoice[]
}

/** 書類グループ分け */
function groupDocuments(docs: CaseDocument[]) {
  // グループ1: 申請人から収集する書類
  const applicantCodes = [
    'DOC-001', 'DOC-003', 'DOC-004', 'DOC-005', 'DOC-009',
    'COL-001', 'COL-002', 'COL-003', 'COL-004', 'COL-005',
    'COL-006', 'COL-007', 'COL-008', 'COL-009', 'COL-010',
    'COL-011', 'COL-019',
  ]
  // グループ2: 企業から収集する書類
  const companyCodes = [
    'DOC-002', 'DOC-006', 'DOC-007', 'DOC-008', 'DOC-013',
    'COL-012', 'COL-013', 'COL-014', 'COL-015', 'COL-016',
    'COL-017', 'COL-018',
  ]
  // グループ3: 分野別
  const fieldCodes = [
    'DOC-010', 'DOC-011', 'DOC-012',
    'COL-020', 'COL-021', 'COL-022', 'COL-023',
  ]

  return {
    applicant: docs.filter((d) => applicantCodes.includes(d.documentCode)),
    company: docs.filter((d) => companyCodes.includes(d.documentCode)),
    field: docs.filter((d) => fieldCodes.includes(d.documentCode)),
  }
}

export default function CaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const caseId = params.id as string

  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    applicationDate: '',
    approvalDate: '',
    entryDate: '',
    referralFee: 0,
    monthlySupportFee: 0,
    notes: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchCase = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ssw/cases/${caseId}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setCaseData(json.data)
    } catch (err) {
      console.error(err)
      setCaseData(null)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCase()
  }, [fetchCase])

  function openEdit() {
    if (!caseData) return
    setEditForm({
      status: caseData.status,
      applicationDate: caseData.applicationDate?.slice(0, 10) || '',
      approvalDate: caseData.approvalDate?.slice(0, 10) || '',
      entryDate: caseData.entryDate?.slice(0, 10) || '',
      referralFee: caseData.referralFee,
      monthlySupportFee: caseData.monthlySupportFee,
      notes: caseData.notes || '',
    })
    setEditError('')
    setEditing(true)
  }

  async function handleEditSave() {
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/ssw/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          applicationDate: editForm.applicationDate || null,
          approvalDate: editForm.approvalDate || null,
          entryDate: editForm.entryDate || null,
          notes: editForm.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setEditError(json.error?.message || '更新に失敗しました')
        return
      }
      setEditing(false)
      fetchCase()
    } catch (err) {
      console.error(err)
      setEditError('更新に失敗しました')
    } finally {
      setEditSaving(false)
    }
  }

  /** 書類ステータスをインラインで更新 */
  async function handleDocStatusChange(docId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/ssw/cases/${caseId}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('書類ステータスの更新に失敗しました')
      fetchCase()
    } catch (err) {
      console.error(err)
      alert('書類ステータスの更新に失敗しました')
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中...</p>
  }

  if (!caseData) {
    return <p className="py-8 text-center text-muted-foreground">案件が見つかりません</p>
  }

  const grouped = groupDocuments(caseData.documents)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/ssw/cases')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧
          </Button>
          <h1 className="text-2xl font-bold">
            案件: {caseData.student.nameKanji || caseData.student.nameEn}
          </h1>
          <Badge variant={STATUS_CONFIG[caseData.status]?.variant || 'outline'}>
            {STATUS_CONFIG[caseData.status]?.label || caseData.status}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={openEdit}>
          <Pencil className="mr-1 h-4 w-4" />
          編集
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="documents">書類ステータス</TabsTrigger>
          <TabsTrigger value="invoices">請求</TabsTrigger>
          <TabsTrigger value="support">支援計画</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">学生名</dt>
                  <dd className="font-medium">{caseData.student.nameKanji || caseData.student.nameEn}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">学籍番号</dt>
                  <dd className="font-medium">{caseData.student.studentNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">国籍</dt>
                  <dd className="font-medium">{caseData.student.nationality}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">企業名</dt>
                  <dd className="font-medium">{caseData.company.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">分野</dt>
                  <dd className="font-medium">{FIELD_LABELS[caseData.field] || caseData.field}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">書類進捗</dt>
                  <dd className="font-medium">{caseData.documentProgress}%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">申請日</dt>
                  <dd className="font-medium">{caseData.applicationDate?.slice(0, 10) || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">許可日</dt>
                  <dd className="font-medium">{caseData.approvalDate?.slice(0, 10) || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">入社日</dt>
                  <dd className="font-medium">{caseData.entryDate?.slice(0, 10) || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">紹介料</dt>
                  <dd className="font-medium">{caseData.referralFee.toLocaleString()}円</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">月額支援費</dt>
                  <dd className="font-medium">{caseData.monthlySupportFee.toLocaleString()}円</dd>
                </div>
              </dl>
              {caseData.notes && (
                <div className="mt-4">
                  <dt className="text-sm text-muted-foreground">備考</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{caseData.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 書類ステータスタブ */}
        <TabsContent value="documents">
          <div className="space-y-4">
            {/* 進捗バー */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">必須書類の完了率:</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${caseData.documentProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{caseData.documentProgress}%</span>
                </div>
              </CardContent>
            </Card>

            {/* グループ1: 申請人 */}
            <DocumentGroup
              title="申請人から収集する書類"
              documents={grouped.applicant}
              onStatusChange={handleDocStatusChange}
            />
            {/* グループ2: 企業 */}
            <DocumentGroup
              title="企業から収集する書類"
              documents={grouped.company}
              onStatusChange={handleDocStatusChange}
            />
            {/* グループ3: 分野別 */}
            <DocumentGroup
              title="分野別書類"
              documents={grouped.field}
              onStatusChange={handleDocStatusChange}
            />
          </div>
        </TabsContent>

        {/* 請求タブ */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>請求一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.sswInvoices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">請求がありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>請求番号</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>金額（税抜）</TableHead>
                      <TableHead>消費税</TableHead>
                      <TableHead>税込</TableHead>
                      <TableHead>発行日</TableHead>
                      <TableHead>支払期日</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseData.sswInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{INVOICE_TYPE_LABELS[inv.invoiceType] || inv.invoiceType}</TableCell>
                        <TableCell>{inv.amount.toLocaleString()}円</TableCell>
                        <TableCell>{inv.tax.toLocaleString()}円</TableCell>
                        <TableCell className="font-medium">
                          {(inv.amount + inv.tax).toLocaleString()}円
                        </TableCell>
                        <TableCell>{inv.issueDate?.slice(0, 10)}</TableCell>
                        <TableCell>{inv.dueDate?.slice(0, 10)}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'PAID' ? 'default' : inv.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                            {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 支援計画タブ */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>支援計画</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.supportPlan ? (
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">ステータス</dt>
                    <dd className="font-medium">
                      {SUPPORT_STATUS_LABELS[caseData.supportPlan.status] || caseData.supportPlan.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">開始日</dt>
                    <dd className="font-medium">{caseData.supportPlan.startDate?.slice(0, 10)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">終了日</dt>
                    <dd className="font-medium">{caseData.supportPlan.endDate?.slice(0, 10) || '継続中'}</dd>
                  </div>
                  {caseData.supportPlan.notes && (
                    <div className="col-span-full">
                      <dt className="text-muted-foreground">備考</dt>
                      <dd className="mt-1 whitespace-pre-wrap">{caseData.supportPlan.notes}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  支援計画はまだ作成されていません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 編集ダイアログ */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>案件編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editError && (
              <div className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <div>
              <Label className="mb-1 block text-sm font-medium">ステータス</Label>
              <Select
                className="w-full rounded border px-3 py-2 text-sm"
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="mb-1 block text-sm font-medium">申請日</Label>
                <Input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.applicationDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, applicationDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">許可日</Label>
                <Input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.approvalDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, approvalDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">入社日</Label>
                <Input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.entryDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, entryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">紹介料（円）</Label>
                <Input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.referralFee}
                  onChange={(e) => setEditForm((p) => ({ ...p, referralFee: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">月額支援費（円）</Label>
                <Input
                  type="number"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.monthlySupportFee}
                  onChange={(e) => setEditForm((p) => ({ ...p, monthlySupportFee: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium">備考</Label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 書類グループのテーブルコンポーネント */
function DocumentGroup({
  title,
  documents,
  onStatusChange,
}: {
  title: string
  documents: CaseDocument[]
  onStatusChange: (docId: string, status: string) => void
}) {
  if (documents.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">コード</TableHead>
              <TableHead>書類名</TableHead>
              <TableHead className="w-24">必須</TableHead>
              <TableHead className="w-40">ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className={!doc.required ? 'opacity-50' : ''}>
                <TableCell className="font-mono text-xs">{doc.documentCode}</TableCell>
                <TableCell className="text-sm">{doc.documentName}</TableCell>
                <TableCell>
                  {doc.required ? (
                    <Badge variant="default" className="text-xs">必須</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">不要</span>
                  )}
                </TableCell>
                <TableCell>
                  <select
                    className={`rounded px-2 py-1 text-xs font-medium ${DOC_STATUS_COLORS[doc.status] || ''}`}
                    value={doc.status}
                    onChange={(e) => onStatusChange(doc.id, e.target.value)}
                  >
                    {DOC_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
