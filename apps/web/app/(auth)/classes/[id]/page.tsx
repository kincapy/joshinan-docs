'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { timeSlot, jlptLevel, cefrLevel, enrollmentType } from '@joshinan/domain'
import { ArrowLeft, UserPlus, Pencil, UserMinus } from 'lucide-react'

/** クラス詳細の型 */
type ClassDetail = {
  id: string
  name: string
  printName: string | null
  jlptLevel: string | null
  cefrLevel: string | null
  timeSlot: string
  isSubClass: boolean
  maxStudents: number
  fiscalYear: number
  startDate: string
  endDate: string
  classEnrollments: Enrollment[]
}

type Enrollment = {
  id: string
  enrollmentType: string
  startDate: string
  endDate: string | null
  student: {
    id: string
    studentNumber: string
    nameEn: string
    nameKanji: string | null
  }
}

/** 編集フォームの型 */
type EditForm = {
  name: string
  printName: string
  jlptLevel: string
  cefrLevel: string
  timeSlot: string
  isSubClass: boolean
  maxStudents: number
  fiscalYear: number
  startDate: string
  endDate: string
}

/** クラス詳細画面 */
export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [classData, setClassData] = useState<ClassDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 編集モーダル
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // 除籍モーダル
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null)
  const [removeDate, setRemoveDate] = useState(new Date().toISOString().split('T')[0])
  const [removeSaving, setRemoveSaving] = useState(false)

  const fetchClass = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/classes/${classId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setClassData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchClass()
  }, [fetchClass])

  /** 編集モーダルを開く */
  function openEdit() {
    if (!classData) return
    setEditForm({
      name: classData.name,
      printName: classData.printName ?? '',
      jlptLevel: classData.jlptLevel ?? '',
      cefrLevel: classData.cefrLevel ?? '',
      timeSlot: classData.timeSlot,
      isSubClass: classData.isSubClass,
      maxStudents: classData.maxStudents,
      fiscalYear: classData.fiscalYear,
      startDate: classData.startDate.split('T')[0],
      endDate: classData.endDate.split('T')[0],
    })
    setEditError('')
    setEditing(true)
  }

  /** 編集保存 */
  async function handleEditSave() {
    if (!editForm) return
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          printName: editForm.printName || null,
          jlptLevel: editForm.jlptLevel || null,
          cefrLevel: editForm.cefrLevel || null,
          timeSlot: editForm.timeSlot,
          isSubClass: editForm.isSubClass,
          maxStudents: editForm.maxStudents,
          fiscalYear: editForm.fiscalYear,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setEditing(false)
      setEditForm(null)
      fetchClass()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setEditSaving(false)
    }
  }

  /** 在籍終了（除籍） */
  async function handleRemove() {
    if (!removeTarget) return
    setRemoveSaving(true)
    try {
      const res = await fetch(
        `/api/classes/${classId}/enrollments/${removeTarget.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endDate: removeDate }),
        },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setRemoveTarget(null)
      fetchClass()
    } catch (err) {
      setError(err instanceof Error ? err.message : '除籍に失敗しました')
    } finally {
      setRemoveSaving(false)
    }
  }

  /** 日付をフォーマット */
  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (error) return (
    <div className="space-y-4">
      <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      <Button variant="ghost" onClick={() => router.push('/classes')}>
        <ArrowLeft className="h-4 w-4" />
        一覧に戻る
      </Button>
    </div>
  )
  if (!classData) return null

  const enrolledCount = classData.classEnrollments.length
  const canAssign = enrolledCount < classData.maxStudents

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/classes')}>
          <ArrowLeft className="h-4 w-4" />
          一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">{classData.name}</h1>
        {classData.isSubClass && <Badge variant="secondary">サブクラス</Badge>}
      </div>

      {/* クラス情報セクション */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>クラス情報</CardTitle>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4" />
            編集
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">クラス名</dt>
              <dd className="font-medium">{classData.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">印刷用名称</dt>
              <dd className="font-medium">{classData.printName || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">JLPTレベル</dt>
              <dd className="font-medium">
                {classData.jlptLevel
                  ? jlptLevel.labelMap[classData.jlptLevel as keyof typeof jlptLevel.labelMap]
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">CEFRレベル</dt>
              <dd className="font-medium">
                {classData.cefrLevel
                  ? cefrLevel.labelMap[classData.cefrLevel as keyof typeof cefrLevel.labelMap]
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">時間帯</dt>
              <dd className="font-medium">
                {timeSlot.labelMap[classData.timeSlot as keyof typeof timeSlot.labelMap]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">年度</dt>
              <dd className="font-medium">{classData.fiscalYear}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">開始日</dt>
              <dd className="font-medium">{formatDate(classData.startDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">終了日</dt>
              <dd className="font-medium">{formatDate(classData.endDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">在籍人数 / 最大人数</dt>
              <dd className="font-medium">{enrolledCount} / {classData.maxStudents}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 在籍学生セクション */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>在籍学生一覧（{enrolledCount}名）</CardTitle>
          {canAssign && (
            <Button
              size="sm"
              onClick={() => router.push(`/classes/${classId}/assign`)}
            >
              <UserPlus className="h-4 w-4" />
              学生割当
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {enrolledCount === 0 ? (
            <p className="text-sm text-muted-foreground">在籍中の学生はいません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学籍番号</TableHead>
                  <TableHead>氏名（英語）</TableHead>
                  <TableHead>氏名（漢字）</TableHead>
                  <TableHead>在籍タイプ</TableHead>
                  <TableHead>在籍開始日</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.classEnrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.student.studentNumber}</TableCell>
                    <TableCell className="font-medium">{e.student.nameEn}</TableCell>
                    <TableCell>{e.student.nameKanji || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.enrollmentType === 'REGULAR' ? 'default' : 'secondary'}>
                        {enrollmentType.labelMap[e.enrollmentType as keyof typeof enrollmentType.labelMap]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(e.startDate)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget(e)}
                        title="除籍"
                      >
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setEditForm(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>クラス編集</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              {editError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{editError}</div>
              )}
              <div className="space-y-1">
                <Label>クラス名 <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>印刷用名称</Label>
                <Input
                  value={editForm.printName}
                  onChange={(e) => setEditForm({ ...editForm, printName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>JLPTレベル</Label>
                  <Select
                    value={editForm.jlptLevel}
                    onChange={(e) => setEditForm({ ...editForm, jlptLevel: e.target.value })}
                  >
                    <option value="">指定なし</option>
                    {jlptLevel.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>CEFRレベル</Label>
                  <Select
                    value={editForm.cefrLevel}
                    onChange={(e) => setEditForm({ ...editForm, cefrLevel: e.target.value })}
                  >
                    <option value="">指定なし</option>
                    {cefrLevel.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>時間帯区分 <span className="text-destructive">*</span></Label>
                <Select
                  value={editForm.timeSlot}
                  onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                >
                  {timeSlot.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsSubClass"
                  checked={editForm.isSubClass}
                  onChange={(e) => setEditForm({ ...editForm, isSubClass: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="editIsSubClass">サブクラス</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>最大人数 <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.maxStudents}
                    onChange={(e) => setEditForm({ ...editForm, maxStudents: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>年度 <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    value={editForm.fiscalYear}
                    onChange={(e) => setEditForm({ ...editForm, fiscalYear: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>開始日 <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>終了日 <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditing(false); setEditForm(null) }}>
                  キャンセル
                </Button>
                <Button onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 除籍モーダル */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>在籍終了（除籍）</DialogTitle>
          </DialogHeader>
          {removeTarget && (
            <div className="space-y-4">
              <p className="text-sm">
                <strong>{removeTarget.student.nameEn}</strong> をこのクラスから除籍します。
              </p>
              <div className="space-y-1">
                <Label>在籍終了日 <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={removeDate}
                  onChange={(e) => setRemoveDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRemoveTarget(null)}>
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={handleRemove} disabled={removeSaving}>
                  {removeSaving ? '処理中...' : '除籍する'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
