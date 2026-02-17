'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
/** 出欠ステータスの選択肢（フロント用） */
const attendanceStatusOptions = [
  { value: 'PRESENT', label: '出席' },
  { value: 'ABSENT', label: '欠席' },
  { value: 'LATE', label: '遅刻' },
  { value: 'EARLY_LEAVE', label: '早退' },
  { value: 'EXCUSED', label: '公欠' },
  { value: 'SUSPENDED', label: '出停' },
] as const

type ClassItem = {
  id: string
  name: string
}

type Enrollment = {
  studentId: string
  student: {
    id: string
    studentNumber: string
    nameKanji: string | null
    nameEn: string
  }
}

type AttendanceRecord = {
  studentId: string
  period: number
  status: string
}

/** 時限の定義（1〜4を基本とし、必要に応じて拡張可能） */
const PERIODS = [1, 2, 3, 4] as const

export default function AttendanceInputPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [records, setRecords] = useState<Record<string, string>>({})
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // クラス一覧を取得
  useEffect(() => {
    fetchClasses()
  }, [])

  // クラス・日付が変わったら在籍学生と既存レコードを取得
  useEffect(() => {
    if (selectedClassId && date) {
      fetchEnrollmentsAndRecords()
    }
  }, [selectedClassId, date])

  async function fetchClasses() {
    try {
      // 開講中のクラスを取得（ページネーションなし）
      const res = await fetch('/api/classes?filter=active')
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setClasses(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'クラスの取得に失敗しました')
    }
  }

  async function fetchEnrollmentsAndRecords() {
    setLoading(true)
    setError('')
    try {
      // 在籍学生と既存の出欠記録を並列取得
      const [enrollRes, recordRes] = await Promise.all([
        fetch(`/api/classes/${selectedClassId}/enrollments`),
        fetch(
          `/api/attendance/records?classId=${selectedClassId}&date=${date}`,
        ),
      ])
      const enrollJson = await enrollRes.json()
      const recordJson = await recordRes.json()

      if (enrollJson.error) throw new Error(enrollJson.error.message)
      if (recordJson.error) throw new Error(recordJson.error.message)

      const enrollData: Enrollment[] = enrollJson.data
      setEnrollments(enrollData)
      setExistingRecords(recordJson.data)

      // 既存レコードを状態に反映、未入力はデフォルト空
      const initial: Record<string, string> = {}
      for (const enroll of enrollData) {
        for (const period of PERIODS) {
          const key = `${enroll.studentId}-${period}`
          const existing = (recordJson.data as AttendanceRecord[]).find(
            (r) =>
              r.studentId === enroll.studentId && r.period === period,
          )
          initial[key] = existing ? existing.status : ''
        }
      }
      setRecords(initial)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  /** 全員出席ボタン */
  function setAllPresent() {
    const updated: Record<string, string> = {}
    for (const enroll of enrollments) {
      for (const period of PERIODS) {
        updated[`${enroll.studentId}-${period}`] = 'PRESENT'
      }
    }
    setRecords(updated)
  }

  /** 送信 */
  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      // ステータスが入力されているレコードのみ送信
      const recordsToSend = Object.entries(records)
        .filter(([, status]) => status !== '')
        .map(([key, status]) => {
          const [studentId, periodStr] = key.split('-')
          return {
            studentId,
            period: Number(periodStr),
            status,
          }
        })

      if (recordsToSend.length === 0) {
        setError('出欠ステータスを1件以上入力してください')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          date,
          records: recordsToSend,
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      setSuccess(`${json.data.count}件の出欠を登録しました`)
      // 2秒後にダッシュボードへ遷移
      setTimeout(() => router.push('/attendance'), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">出欠入力</h1>

      {/* クラス・日付選択 */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            クラス <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-48"
          >
            <option value="">選択してください</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            日付 <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-48"
          />
        </div>
        <Button variant="outline" onClick={setAllPresent}>
          全員出席
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      {/* 出欠入力グリッド */}
      {selectedClassId && !loading && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              出欠入力 ({enrollments.length}名)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">学籍番号</TableHead>
                  <TableHead className="w-40">氏名</TableHead>
                  {PERIODS.map((p) => (
                    <TableHead key={p} className="w-32 text-center">
                      {p}限
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enroll) => (
                  <TableRow key={enroll.studentId}>
                    <TableCell>{enroll.student.studentNumber}</TableCell>
                    <TableCell>
                      {enroll.student.nameKanji || enroll.student.nameEn}
                    </TableCell>
                    {PERIODS.map((period) => {
                      const key = `${enroll.studentId}-${period}`
                      return (
                        <TableCell key={period} className="text-center">
                          <Select
                            value={records[key] || ''}
                            onChange={(e) =>
                              setRecords((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="w-24 text-xs"
                          >
                            <option value="">-</option>
                            {attendanceStatusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Select>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedClassId && !loading && enrollments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          在籍中の学生がいません
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      )}

      {/* 送信ボタン */}
      {enrollments.length > 0 && (
        <div className="flex gap-4">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '登録中...' : '出欠を登録'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/attendance')}>
            キャンセル
          </Button>
        </div>
      )}
    </div>
  )
}
