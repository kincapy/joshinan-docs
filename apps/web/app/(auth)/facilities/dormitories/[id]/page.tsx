'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

/** AssignmentStatus の日本語ラベル */
const statusLabel: Record<string, string> = {
  ACTIVE: '入居中',
  ENDED: '退寮済み',
}

/** API レスポンスの型 */
type Student = {
  id: string
  nameEn: string
  nameKanji: string | null
  studentNumber: string
}

type Assignment = {
  id: string
  studentId: string
  dormitoryId: string
  status: string
  moveInDate: string
  moveOutDate: string | null
  student: Student
}

type Utility = {
  id: string
  dormitoryId: string
  month: string
  electricity: number
  gas: number
  water: number
}

type DormitoryDetail = {
  id: string
  name: string
  address: string
  rent: number
  gasProvider: string | null
  gasContractNumber: string | null
  waterProvider: string | null
  waterContractNumber: string | null
  electricityProvider: string | null
  electricityContractNumber: string | null
  isActive: boolean
  notes: string | null
  assignments: Assignment[]
  utilities: Utility[]
}

/** 全学生リスト取得用の型 */
type StudentOption = {
  id: string
  studentNumber: string
  nameEn: string
  nameKanji: string | null
}

/** 金額のフォーマット（円） */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

/** 物件詳細画面 */
export default function DormitoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<DormitoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 入寮登録用の状態
  const [showMoveIn, setShowMoveIn] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [moveInStudentId, setMoveInStudentId] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [moveInSaving, setMoveInSaving] = useState(false)

  // 退寮処理用の状態
  const [moveOutTarget, setMoveOutTarget] = useState<string | null>(null)
  const [moveOutDate, setMoveOutDate] = useState('')
  const [moveOutSaving, setMoveOutSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/facilities/dormitories/${id}`)
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

  /** 入寮登録フォームを開いたときに学生リストを取得 */
  async function openMoveInForm() {
    setShowMoveIn(true)
    try {
      const res = await fetch('/api/students?status=ENROLLED&per=500')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '学生一覧の取得に失敗しました')
      setStudents(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '学生一覧の取得に失敗しました')
    }
  }

  /** 入寮登録 */
  async function handleMoveIn() {
    if (!moveInStudentId || !moveInDate) return
    setMoveInSaving(true)
    try {
      const res = await fetch(`/api/facilities/dormitories/${id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: moveInStudentId, moveInDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '入寮登録に失敗しました')
      if (json.data?.error) throw new Error(json.data.error)

      setShowMoveIn(false)
      setMoveInStudentId('')
      setMoveInDate('')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '入寮登録に失敗しました')
    } finally {
      setMoveInSaving(false)
    }
  }

  /** 退寮処理 */
  async function handleMoveOut(assignmentId: string) {
    if (!moveOutDate) return
    setMoveOutSaving(true)
    try {
      const res = await fetch(`/api/facilities/dormitories/${id}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveOutDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '退寮処理に失敗しました')

      setMoveOutTarget(null)
      setMoveOutDate('')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '退寮処理に失敗しました')
    } finally {
      setMoveOutSaving(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (!data) return <div className="text-muted-foreground">物件が見つかりません</div>

  // 入居中と退寮済みに分離
  const activeAssignments = data.assignments.filter((a) => a.status === 'ACTIVE')
  const endedAssignments = data.assignments.filter((a) => a.status === 'ENDED')

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/facilities/dormitories')}>
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        {!data.isActive && <Badge variant="outline">無効</Badge>}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本情報</TabsTrigger>
          <TabsTrigger value="residents">入居者一覧 ({activeAssignments.length})</TabsTrigger>
          <TabsTrigger value="history">入退寮履歴</TabsTrigger>
          <TabsTrigger value="utilities">水光熱費</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>物件情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">住所</span>
                  <p>{data.address}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">家賃</span>
                  <p className="text-lg font-semibold">{formatCurrency(data.rent)}</p>
                </div>
                {data.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">備考</span>
                    <p className="whitespace-pre-wrap">{data.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ライフライン契約</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">電気</span>
                  <p>{data.electricityProvider || '-'} {data.electricityContractNumber ? `(${data.electricityContractNumber})` : ''}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ガス</span>
                  <p>{data.gasProvider || '-'} {data.gasContractNumber ? `(${data.gasContractNumber})` : ''}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">水道</span>
                  <p>{data.waterProvider || '-'} {data.waterContractNumber ? `(${data.waterContractNumber})` : ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 入居者一覧タブ */}
        <TabsContent value="residents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>現在の入居者</CardTitle>
              <Button size="sm" onClick={openMoveInForm}>入寮登録</Button>
            </CardHeader>
            <CardContent>
              {/* 入寮登録フォーム */}
              {showMoveIn && (
                <div className="mb-4 rounded-md border p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>学生</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={moveInStudentId}
                        onChange={(e) => setMoveInStudentId(e.target.value)}
                      >
                        <option value="">選択してください</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.studentNumber} - {s.nameKanji || s.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>入寮日</Label>
                      <Input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={handleMoveIn} disabled={moveInSaving}>
                        {moveInSaving ? '登録中...' : '登録'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowMoveIn(false)}>
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeAssignments.length === 0 ? (
                <p className="text-muted-foreground">入居者はいません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学籍番号</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>入寮日</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAssignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.student.studentNumber}</TableCell>
                        <TableCell>{a.student.nameKanji || a.student.nameEn}</TableCell>
                        <TableCell>{a.moveInDate}</TableCell>
                        <TableCell>
                          {moveOutTarget === a.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                className="w-40"
                                value={moveOutDate}
                                onChange={(e) => setMoveOutDate(e.target.value)}
                              />
                              <Button size="sm" variant="destructive" onClick={() => handleMoveOut(a.id)} disabled={moveOutSaving}>
                                {moveOutSaving ? '処理中...' : '確定'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setMoveOutTarget(null)}>
                                取消
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setMoveOutTarget(a.id); setMoveOutDate('') }}
                            >
                              退寮
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 入退寮履歴タブ */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>入退寮履歴</CardTitle>
            </CardHeader>
            <CardContent>
              {data.assignments.length === 0 ? (
                <p className="text-muted-foreground">履歴がありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学籍番号</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>入寮日</TableHead>
                      <TableHead>退寮日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.student.studentNumber}</TableCell>
                        <TableCell>{a.student.nameKanji || a.student.nameEn}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {statusLabel[a.status] || a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.moveInDate}</TableCell>
                        <TableCell>{a.moveOutDate || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 水光熱費タブ */}
        <TabsContent value="utilities">
          <Card>
            <CardHeader>
              <CardTitle>月次水光熱費</CardTitle>
            </CardHeader>
            <CardContent>
              {data.utilities.length === 0 ? (
                <p className="text-muted-foreground">水光熱費データがありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>対象月</TableHead>
                      <TableHead className="text-right">電気代</TableHead>
                      <TableHead className="text-right">ガス代</TableHead>
                      <TableHead className="text-right">水道代</TableHead>
                      <TableHead className="text-right">合計</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.utilities.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(u.electricity)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(u.gas)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(u.water)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(u.electricity + u.gas + u.water)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
