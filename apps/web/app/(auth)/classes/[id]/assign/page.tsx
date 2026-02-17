'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { enrollmentType } from '@joshinan/domain'
import { ArrowLeft, Save, Search } from 'lucide-react'

/** 学生の型 */
type StudentRow = {
  id: string
  studentNumber: string
  nameEn: string
  nameKanji: string | null
  nationality: string
  status: string
}

/** クラス情報の型 */
type ClassInfo = {
  id: string
  name: string
  maxStudents: number
  classEnrollments: { student: { id: string } }[]
}

/** 学生割当画面 */
export default function AssignStudentsPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フォーム状態
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [enType, setEnType] = useState('REGULAR')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  /** クラス情報と学生一覧を取得 */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // クラス情報と在学中の学生を並行取得
      const [classRes, studentsRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch(`/api/students?status=ENROLLED&per=200`),
      ])

      const classJson = await classRes.json()
      const studentsJson = await studentsRes.json()

      if (!classRes.ok) throw new Error(classJson.error?.message)
      if (!studentsRes.ok) throw new Error(studentsJson.error?.message)

      setClassInfo(classJson.data)
      setStudents(studentsJson.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** 選択の切り替え */
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  /** 全選択・全解除 */
  function toggleAll(students: StudentRow[]) {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)))
    }
  }

  /** 割当実行 */
  async function handleAssign() {
    if (selectedIds.size === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/classes/${classId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedIds),
          enrollmentType: enType,
          startDate,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '割当に失敗しました')

      // 成功したらクラス詳細に戻る
      router.push(`/classes/${classId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '割当に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>

  // 既にこのクラスに在籍中の学生IDを除外
  const enrolledIds = new Set(
    classInfo?.classEnrollments.map((e) => e.student.id) ?? [],
  )

  // 検索フィルタと在籍済み除外
  const filteredStudents = students.filter((s) => {
    if (enrolledIds.has(s.id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.nameEn.toLowerCase().includes(q) ||
      (s.nameKanji?.toLowerCase().includes(q) ?? false) ||
      s.studentNumber.includes(q)
    )
  })

  const remaining = classInfo
    ? classInfo.maxStudents - classInfo.classEnrollments.length
    : 0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/classes/${classId}`)}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">学生割当</h1>
        {classInfo && (
          <span className="text-sm text-muted-foreground">
            {classInfo.name}（残り{remaining}名割当可能）
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 割当設定 */}
      <Card>
        <CardHeader>
          <CardTitle>割当設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>在籍タイプ <span className="text-destructive">*</span></Label>
              <Select
                value={enType}
                onChange={(e) => setEnType(e.target.value)}
              >
                {enrollmentType.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>在籍開始日 <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生選択 */}
      <Card>
        <CardHeader>
          <CardTitle>学生選択（{selectedIds.size}名選択中）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="氏名・学籍番号で検索"
              className="pl-8 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">割当可能な学生がいません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={() => toggleAll(filteredStudents)}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>学籍番号</TableHead>
                  <TableHead>氏名（英語）</TableHead>
                  <TableHead>氏名（漢字）</TableHead>
                  <TableHead>国籍</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => toggleSelect(s.id)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>{s.studentNumber}</TableCell>
                    <TableCell className="font-medium">{s.nameEn}</TableCell>
                    <TableCell>{s.nameKanji || '—'}</TableCell>
                    <TableCell>{s.nationality}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={handleAssign}
          disabled={saving || selectedIds.size === 0}
        >
          <Save className="h-4 w-4" />
          {saving ? '割当中...' : `${selectedIds.size}名を割り当てる`}
        </Button>
      </div>
    </div>
  )
}
