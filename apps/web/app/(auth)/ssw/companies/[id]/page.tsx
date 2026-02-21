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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, Pencil, Upload } from 'lucide-react'

const FIELD_LABELS: Record<string, string> = {
  NURSING_CARE: '介護',
  ACCOMMODATION: '宿泊',
  FOOD_SERVICE: '外食業',
  FOOD_MANUFACTURING: '飲食料品製造業',
  AUTO_TRANSPORT: '自動車運送業',
}

const STATUS_LABELS: Record<string, string> = {
  PROSPECTING: '営業中',
  PREPARING: '書類準備中',
  APPLIED: '申請中',
  REVIEWING: '審査中',
  APPROVED: '許可済み',
  EMPLOYED: '入社済み',
  SUPPORTING: '支援中',
  CLOSED: '終了',
}

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

type CompanyDetail = {
  id: string
  name: string
  representative: string
  postalCode: string | null
  address: string
  phone: string
  field: string
  businessLicense: string | null
  corporateNumber: string | null
  establishedDate: string | null
  notes: string | null
  businessDescription: string | null
  capitalAmount: string | null
  fullTimeEmployees: number | null
  contactPerson: string | null
  contactEmail: string | null
  faxNumber: string | null
  surveyRespondedAt: string | null
  sswCases: {
    id: string
    field: string
    status: string
    student: { id: string; nameEn: string; nameKanji: string | null; studentNumber: string }
  }[]
  sswInvoices: {
    id: string
    invoiceNumber: string
    invoiceType: string
    amount: number
    tax: number
    issueDate: string
    dueDate: string
    status: string
  }[]
  officers: {
    id: string
    name: string
    nameKana: string
    position: string
    sortOrder: number
  }[]
  financials: {
    id: string
    fiscalYear: number
    revenue: string | null
    ordinaryIncome: string | null
  }[]
}

export default function CompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    representative: '',
    postalCode: '',
    address: '',
    phone: '',
    field: '',
    businessLicense: '',
    corporateNumber: '',
    establishedDate: '',
    notes: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // アンケート関連の state
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  const fetchCompany = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ssw/companies/${companyId}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setCompany(json.data)
    } catch (err) {
      console.error(err)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  function openEdit() {
    if (!company) return
    setEditForm({
      name: company.name,
      representative: company.representative,
      postalCode: company.postalCode || '',
      address: company.address,
      phone: company.phone,
      field: company.field,
      businessLicense: company.businessLicense || '',
      corporateNumber: company.corporateNumber || '',
      establishedDate: company.establishedDate?.slice(0, 10) || '',
      notes: company.notes || '',
    })
    setEditError('')
    setEditing(true)
  }

  async function handleEditSave() {
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/ssw/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          postalCode: editForm.postalCode || null,
          businessLicense: editForm.businessLicense || null,
          corporateNumber: editForm.corporateNumber || null,
          establishedDate: editForm.establishedDate || null,
          notes: editForm.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setEditError(json.error?.message || '更新に失敗しました')
        return
      }
      setEditing(false)
      fetchCompany()
    } catch (err) {
      console.error(err)
      setEditError('更新に失敗しました')
    } finally {
      setEditSaving(false)
    }
  }

  /** アンケートExcelをダウンロード */
  async function handleDownloadSurvey() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/ssw/companies/${companyId}/survey/download`)
      if (!res.ok) throw new Error('ダウンロードに失敗しました')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${company?.name || '企業'}_アンケート.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setUploadError('ダウンロードに失敗しました')
    } finally {
      setDownloading(false)
    }
  }

  /** 記入済みアンケートExcelをアップロード */
  async function handleUploadSurvey() {
    if (!uploadFile) return
    setUploading(true)
    setUploadMessage('')
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const res = await fetch(`/api/ssw/companies/${companyId}/survey/upload`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.error?.message || 'アップロードに失敗しました')
        return
      }
      setUploadMessage('アンケートデータを反映しました')
      setUploadFile(null)
      fetchCompany()
    } catch {
      setUploadError('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">読み込み中...</p>
  }

  if (!company) {
    return <p className="py-8 text-center text-muted-foreground">企業が見つかりません</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/ssw/companies')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            一覧
          </Button>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <Badge variant="outline">{FIELD_LABELS[company.field] || company.field}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={openEdit}>
          <Pencil className="mr-1 h-4 w-4" />
          編集
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="cases">案件一覧</TabsTrigger>
          <TabsTrigger value="invoices">請求履歴</TabsTrigger>
          <TabsTrigger value="survey">アンケート</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">企業名</dt>
                  <dd className="font-medium">{company.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">代表者</dt>
                  <dd className="font-medium">{company.representative}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">電話番号</dt>
                  <dd className="font-medium">{company.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">郵便番号</dt>
                  <dd className="font-medium">{company.postalCode || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">所在地</dt>
                  <dd className="font-medium">{company.address}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">分野</dt>
                  <dd className="font-medium">{FIELD_LABELS[company.field] || company.field}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">営業許可</dt>
                  <dd className="font-medium">{company.businessLicense || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">法人番号</dt>
                  <dd className="font-medium">{company.corporateNumber || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">設立年月日</dt>
                  <dd className="font-medium">{company.establishedDate?.slice(0, 10) || '-'}</dd>
                </div>
              </dl>
              {company.notes && (
                <div className="mt-4">
                  <dt className="text-sm text-muted-foreground">備考</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">{company.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>案件一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {company.sswCases.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">案件がありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生</TableHead>
                      <TableHead>分野</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.sswCases.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/ssw/cases/${c.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {c.student.nameKanji || c.student.nameEn}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.student.studentNumber}
                          </div>
                        </TableCell>
                        <TableCell>{FIELD_LABELS[c.field] || c.field}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{STATUS_LABELS[c.status] || c.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>請求履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {company.sswInvoices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">請求がありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>請求番号</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>金額（税込）</TableHead>
                      <TableHead>発行日</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.sswInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{INVOICE_TYPE_LABELS[inv.invoiceType] || inv.invoiceType}</TableCell>
                        <TableCell>{(inv.amount + inv.tax).toLocaleString()}円</TableCell>
                        <TableCell>{inv.issueDate?.slice(0, 10)}</TableCell>
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
        <TabsContent value="survey">
          <Card>
            <CardHeader>
              <CardTitle>アンケートフォーム</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ダウンロード */}
              <div>
                <Button onClick={handleDownloadSurvey} disabled={downloading}>
                  <Download className="mr-1 h-4 w-4" />
                  {downloading ? 'ダウンロード中...' : 'アンケートフォームをダウンロード'}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Excelファイルをダウンロードして企業に記入を依頼してください
                </p>
              </div>

              {/* アップロード */}
              <div className="rounded border p-4">
                <h4 className="mb-2 text-sm font-medium">記入済みファイルのアップロード</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                      setUploadFile(e.target.files?.[0] || null)
                      setUploadMessage('')
                      setUploadError('')
                    }}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleUploadSurvey}
                    disabled={!uploadFile || uploading}
                    size="sm"
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    {uploading ? 'アップロード中...' : 'アップロード'}
                  </Button>
                </div>
                {uploadMessage && (
                  <p className="mt-2 text-sm text-green-600">{uploadMessage}</p>
                )}
                {uploadError && (
                  <p className="mt-2 text-sm text-destructive">{uploadError}</p>
                )}
              </div>

              {/* 収集済みデータ表示 */}
              {company.surveyRespondedAt && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    最終回答日: {new Date(company.surveyRespondedAt).toLocaleDateString('ja-JP')}
                  </p>

                  {/* 企業追加情報 */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">企業情報</h4>
                    <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">事業内容</dt>
                        <dd className="font-medium">{company.businessDescription || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">資本金</dt>
                        <dd className="font-medium">
                          {company.capitalAmount
                            ? `${Number(company.capitalAmount).toLocaleString()}円`
                            : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">常勤職員数</dt>
                        <dd className="font-medium">
                          {company.fullTimeEmployees != null
                            ? `${company.fullTimeEmployees}名`
                            : '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">担当者</dt>
                        <dd className="font-medium">{company.contactPerson || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">担当者メール</dt>
                        <dd className="font-medium">{company.contactEmail || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">FAX</dt>
                        <dd className="font-medium">{company.faxNumber || '-'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* 役員情報 */}
                  {company.officers.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">役員情報</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>氏名</TableHead>
                            <TableHead>ふりがな</TableHead>
                            <TableHead>役職</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {company.officers.map((o) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-medium">{o.name}</TableCell>
                              <TableCell>{o.nameKana}</TableCell>
                              <TableCell>{o.position}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* 決算情報 */}
                  {company.financials.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">決算情報</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>年度</TableHead>
                            <TableHead className="text-right">売上高</TableHead>
                            <TableHead className="text-right">経常利益</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {company.financials.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium">{f.fiscalYear}年度</TableCell>
                              <TableCell className="text-right">
                                {f.revenue != null
                                  ? `${Number(f.revenue).toLocaleString()}円`
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {f.ordinaryIncome != null
                                  ? `${Number(f.ordinaryIncome).toLocaleString()}円`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 編集ダイアログ */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>企業編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editError && (
              <div className="rounded bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">企業名</Label>
                <Input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">代表者名</Label>
                <Input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.representative}
                  onChange={(e) => setEditForm((p) => ({ ...p, representative: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">電話番号</Label>
                <Input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">所在地</Label>
                <Input
                  type="text"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
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
