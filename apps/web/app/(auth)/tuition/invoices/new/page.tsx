'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Receipt } from 'lucide-react'

type StudentOption = {
  id: string
  studentNumber: string
  nameKanji: string | null
  nameEn: string
}

export default function NewInvoicePage() {
  const router = useRouter()

  // フォーム状態
  const [targetMonth, setTargetMonth] = useState(() => {
    // デフォルト: 来月
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
  })
  const [targetType, setTargetType] = useState<'all' | 'individual'>('all')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  )
  const [loadingStudents, setLoadingStudents] = useState(false)

  // 送信状態
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  /** 個別選択時に在学生リストを取得する */
  useEffect(() => {
    if (targetType === 'individual') {
      fetchStudents()
    }
  }, [targetType])

  async function fetchStudents() {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/students?status=ENROLLED')
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setStudents(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '学生リストの取得に失敗しました')
    } finally {
      setLoadingStudents(false)
    }
  }

  /** 学生の選択・解除を切り替える */
  function toggleStudent(studentId: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  /** 全選択・全解除 */
  function toggleAll() {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)))
    }
  }

  /** 請求を生成する */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const body: Record<string, unknown> = {
        billingMonth: targetMonth,
        studentIds: targetType === 'all' ? 'all' : Array.from(selectedStudentIds),
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '請求生成に失敗しました')

      // 成功: 件数を表示してからダッシュボードに遷移
      const count = json.data?.created ?? 0
      setSuccessMessage(`${count}件の請求を生成しました。ダッシュボードに戻ります...`)
      setTimeout(() => router.push('/tuition'), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '請求生成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/tuition">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">請求作成</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>請求条件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 対象年月 */}
            <div className="space-y-1">
              <Label>
                対象年月 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                required
                className="w-48"
              />
            </div>

            {/* 対象選択 */}
            <div className="space-y-1">
              <Label>
                対象 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={targetType}
                onChange={(e) =>
                  setTargetType(e.target.value as 'all' | 'individual')
                }
              >
                <option value="all">全在学生</option>
                <option value="individual">個別選択</option>
              </Select>
            </div>

            {/* 個別選択時: 学生チェックボックスリスト */}
            {targetType === 'individual' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    学生を選択（{selectedStudentIds.size}名選択中）
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {selectedStudentIds.size === students.length
                      ? '全解除'
                      : '全選択'}
                  </Button>
                </div>
                {loadingStudents ? (
                  <p className="text-sm text-muted-foreground">
                    学生リストを読み込み中...
                  </p>
                ) : (
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                    {students.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedStudentIds.has(s.id)}
                          onChange={() => toggleStudent(s.id)}
                        />
                        <span className="text-sm">
                          {s.studentNumber} - {s.nameKanji || s.nameEn}
                        </span>
                      </label>
                    ))}
                    {students.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        在学生がいません
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={
              submitting ||
              (targetType === 'individual' && selectedStudentIds.size === 0)
            }
          >
            <Receipt className="h-4 w-4" />
            {submitting ? '生成中...' : '請求を生成'}
          </Button>
        </div>
      </form>
    </div>
  )
}
