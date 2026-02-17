'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Check, Circle, AlertCircle, FileCheck } from 'lucide-react'

/** 書類チェック結果の型 */
type CheckResult = {
  id: string
  checkType: string
  result: string
  findings: string | null
  createdAt: string
}

/** 申請書類の型 */
type ApplicationDoc = {
  id: string
  documentType: string
  collectionStatus: string
  filePath: string | null
  hasJapaneseTranslation: boolean
  notes: string | null
  checkResults: CheckResult[]
}

/** 申請ケース詳細の型 */
type CaseDetail = {
  id: string
  recruitmentCycleId: string
  candidateName: string
  nationality: string
  applicationNumber: string | null
  status: string
  isListedCountry: boolean
  grantedDate: string | null
  denialReason: string | null
  notes: string | null
  agent: { id: string; name: string } | null
  student: { id: string; studentNumber: string; nameEn: string; nameKanji: string | null } | null
  recruitmentCycle: { id: string; enrollmentMonth: string; fiscalYear: number }
  documents: ApplicationDoc[]
}

/** 申請ステータスの日本語ラベル */
const statusLabel: Record<string, string> = {
  PREPARING: '書類準備中',
  SUBMITTED: '申請済',
  GRANTED: '交付',
  DENIED: '不交付',
  WITHDRAWN: '取下',
}

/** 書類種別の日本語ラベル */
const documentTypeLabel: Record<string, string> = {
  APPLICATION_FORM: '在留資格認定証明書交付申請書',
  CHECKLIST: '提出書類一覧表・各種確認書',
  PASSPORT_COPY: '旅券写し',
  JAPANESE_ABILITY: '日本語能力資料',
  FINANCIAL_SUPPORT: '経費支弁書',
  RELATIONSHIP_PROOF: '経費支弁者との関係立証資料',
  BANK_BALANCE: '預金残高証明書',
  FUND_FORMATION: '資金形成経緯資料',
  SCHOLARSHIP: '奨学金証明',
  MINOR_SUPPORT: '未成年者の経費支弁に関する補足',
  REASON_STATEMENT: '理由書',
  OTHER: 'その他',
}

/** 収集状態の日本語ラベル */
const collectionLabel: Record<string, string> = {
  NOT_RECEIVED: '未受領',
  RECEIVED: '受領済',
  VERIFIED: '確認済',
  DEFICIENT: '不備あり',
}

/** チェック種別の日本語ラベル */
const checkTypeLabel: Record<string, string> = {
  COMPLETENESS: '網羅性',
  TRANSLATION: '訳文有無',
  ORDER: '並び順',
}

/** ステータスに応じたバッジスタイル */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'GRANTED') return 'default'
  if (status === 'DENIED') return 'destructive'
  if (status === 'SUBMITTED') return 'secondary'
  return 'outline'
}

/** 収集状態に応じたバッジスタイル */
function collectionVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'VERIFIED') return 'default'
  if (status === 'RECEIVED') return 'secondary'
  if (status === 'DEFICIENT') return 'destructive'
  return 'outline'
}

/** 入学時期の日本語ラベル */
const enrollmentMonthLabel: Record<string, string> = {
  APRIL: '4月',
  OCTOBER: '10月',
}

/** 申請ケース詳細画面 */
export default function RecruitmentCaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  /* ステータス変更ダイアログ */
  const [statusDialog, setStatusDialog] = useState<string | null>(null)
  const [grantedDate, setGrantedDate] = useState('')
  const [denialReason, setDenialReason] = useState('')

  /* 未完了のみ表示フィルタ */
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/recruitment/cases/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** ステータスを変更 */
  async function handleStatusChange(newStatus: string) {
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'GRANTED') body.grantedDate = grantedDate
      if (newStatus === 'DENIED') body.denialReason = denialReason

      const res = await fetch(`/api/recruitment/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')

      setStatusDialog(null)
      setGrantedDate('')
      setDenialReason('')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 書類の収集状態を更新 */
  async function updateDocumentStatus(docId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/recruitment/cases/${id}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionStatus: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || '更新に失敗しました')
      }
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (!data) return <div className="text-muted-foreground">申請ケースが見つかりません</div>

  /* 遷移可能なステータス */
  const nextStatuses: Record<string, string[]> = {
    PREPARING: ['SUBMITTED', 'WITHDRAWN'],
    SUBMITTED: ['GRANTED', 'DENIED', 'WITHDRAWN'],
  }
  const available = nextStatuses[data.status] || []

  /* 書類のフィルタリング */
  const filteredDocs = showIncompleteOnly
    ? data.documents.filter((d) => d.collectionStatus !== 'VERIFIED')
    : data.documents

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/recruitment/cycles/${data.recruitmentCycleId}/cases`)}>
          <ArrowLeft className="h-4 w-4" />
          ケース一覧
        </Button>
        <h1 className="text-2xl font-bold">{data.candidateName}</h1>
        <Badge variant={statusVariant(data.status)}>
          {statusLabel[data.status] || data.status}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="documents">
            書類チェックリスト（{data.documents.length}）
          </TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>申請情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">候補者氏名</span>
                  <p className="font-semibold">{data.candidateName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">国籍</span>
                  <p>{data.nationality}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">募集期</span>
                  <p>
                    {data.recruitmentCycle.fiscalYear}年{' '}
                    {enrollmentMonthLabel[data.recruitmentCycle.enrollmentMonth]}入学
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">エージェント</span>
                  <p>{data.agent?.name || 'なし'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">申請番号</span>
                  <p>{data.applicationNumber || '未付与'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">別表掲載国</span>
                  <p>
                    <Badge variant={data.isListedCountry ? 'secondary' : 'outline'}>
                      {data.isListedCountry ? '掲載国' : '非掲載国'}
                    </Badge>
                  </p>
                </div>
                {data.grantedDate && (
                  <div>
                    <span className="text-sm text-muted-foreground">交付日</span>
                    <p>{new Date(data.grantedDate).toLocaleDateString('ja-JP')}</p>
                  </div>
                )}
                {data.denialReason && (
                  <div>
                    <span className="text-sm text-muted-foreground">不交付理由</span>
                    <p className="whitespace-pre-wrap">{data.denialReason}</p>
                  </div>
                )}
                {data.student && (
                  <div>
                    <span className="text-sm text-muted-foreground">学生リンク</span>
                    <p>{data.student.studentNumber} {data.student.nameKanji || data.student.nameEn}</p>
                  </div>
                )}
                {data.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">備考</span>
                    <p className="whitespace-pre-wrap">{data.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ステータス変更 */}
            <Card>
              <CardHeader>
                <CardTitle>アクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {available.length > 0 ? (
                  available.map((s) => (
                    <Button
                      key={s}
                      className="w-full"
                      variant={s === 'WITHDRAWN' ? 'outline' : s === 'GRANTED' ? 'default' : 'secondary'}
                      onClick={() => setStatusDialog(s)}
                      disabled={saving}
                    >
                      {statusLabel[s]} に変更
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    この申請は終了状態です（{statusLabel[data.status]}）
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 書類チェックリストタブ */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>書類チェックリスト</CardTitle>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="incompleteOnly"
                  checked={showIncompleteOnly}
                  onChange={(e) => setShowIncompleteOnly(e.target.checked)}
                />
                <Label htmlFor="incompleteOnly" className="text-sm">未完了のみ表示</Label>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDocs.length === 0 ? (
                <p className="text-muted-foreground">
                  {showIncompleteOnly ? '未完了の書類はありません' : '書類はありません'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>書類種別</TableHead>
                      <TableHead>収集状態</TableHead>
                      <TableHead>日本語訳</TableHead>
                      <TableHead>チェック結果</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc) => {
                      /* 最新のチェック結果 */
                      const latestCheck = doc.checkResults[0]
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            {documentTypeLabel[doc.documentType] || doc.documentType}
                          </TableCell>
                          <TableCell>
                            <Badge variant={collectionVariant(doc.collectionStatus)}>
                              {collectionLabel[doc.collectionStatus] || doc.collectionStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.hasJapaneseTranslation ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {latestCheck ? (
                              <Badge variant={latestCheck.result === 'OK' ? 'default' : 'destructive'}>
                                {latestCheck.result}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {doc.collectionStatus === 'NOT_RECEIVED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateDocumentStatus(doc.id, 'RECEIVED')}
                                >
                                  受領
                                </Button>
                              )}
                              {doc.collectionStatus === 'RECEIVED' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDocumentStatus(doc.id, 'VERIFIED')}
                                  >
                                    <FileCheck className="mr-1 h-3 w-3" />
                                    確認済
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDocumentStatus(doc.id, 'DEFICIENT')}
                                  >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    不備
                                  </Button>
                                </>
                              )}
                              {doc.collectionStatus === 'DEFICIENT' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateDocumentStatus(doc.id, 'RECEIVED')}
                                >
                                  再受領
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ステータス変更ダイアログ */}
      <Dialog open={statusDialog !== null} onOpenChange={(open) => { if (!open) setStatusDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ステータスを「{statusDialog ? statusLabel[statusDialog] : ''}」に変更
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {statusDialog === 'GRANTED' && (
              <div className="space-y-1">
                <Label>交付日</Label>
                <Input
                  type="date"
                  value={grantedDate}
                  onChange={(e) => setGrantedDate(e.target.value)}
                />
              </div>
            )}
            {statusDialog === 'DENIED' && (
              <div className="space-y-1">
                <Label>不交付理由</Label>
                <Input
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="不交付の理由を入力"
                />
              </div>
            )}
            {statusDialog === 'WITHDRAWN' && (
              <p className="text-sm text-muted-foreground">
                この申請を取り下げます。この操作は元に戻せません。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>キャンセル</Button>
            <Button
              onClick={() => statusDialog && handleStatusChange(statusDialog)}
              disabled={saving}
              variant={statusDialog === 'WITHDRAWN' ? 'destructive' : 'default'}
            >
              {saving ? '処理中...' : '変更する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
