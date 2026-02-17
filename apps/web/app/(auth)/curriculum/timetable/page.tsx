'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { dayOfWeek, term } from '@joshinan/domain'

/** 型定義 */
type Period = {
  id: string
  periodNumber: number
  startTime: string
  endTime: string
  timeSlot: string
}

type ClassItem = {
  id: string
  name: string
  timeSlot: string
  fiscalYear: number
}

type Subject = {
  id: string
  name: string
  category: string
}

type Teacher = {
  id: string
  name: string
}

type TimetableSlot = {
  id: string
  classId: string
  dayOfWeek: string
  periodId: string
  subjectId: string
  teacherId: string | null
  fiscalYear: number
  term: string
  subject: Subject
  teacher: Teacher | null
  period: Period
}

/** セル編集フォーム */
type CellForm = {
  dayOfWeek: string
  periodId: string
  subjectId: string
  teacherId: string
}

/** 平日の曜日（月〜土） */
const weekdays = dayOfWeek.values.filter((d) => d !== 'SUN')

/** 時間割編集画面 */
export default function TimetablePage() {
  // 選択状態
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [termValue, setTermValue] = useState<string>('FIRST_HALF')
  const [classId, setClassId] = useState('')

  // データ
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // セル編集モーダル
  const [editCell, setEditCell] = useState<CellForm | null>(null)
  const [editSlotId, setEditSlotId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cellError, setCellError] = useState('')
  const [teacherWarning, setTeacherWarning] = useState('')

  /** 初期データの取得（クラス・時限・科目・教員） */
  useEffect(() => {
    async function fetchMasterData() {
      try {
        const [classRes, periodRes, subjectRes, teacherRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/periods'),
          fetch('/api/subjects?isActive=true&per=200'),
          fetch('/api/staffs?isActive=true'),
        ])

        const classJson = await classRes.json()
        const periodJson = await periodRes.json()
        const subjectJson = await subjectRes.json()
        const teacherJson = await teacherRes.json()

        // クラス一覧（API がない場合は空配列）
        if (classRes.ok) setClasses(classJson.data ?? [])
        if (periodRes.ok) setPeriods(periodJson.data ?? [])
        // 科目一覧はページネーション付きの場合がある
        if (subjectRes.ok) setSubjects(subjectJson.data ?? [])
        if (teacherRes.ok) setTeachers(teacherJson.data ?? [])
      } catch {
        // マスタデータ取得失敗は静かに処理（画面は表示可能）
      }
    }
    fetchMasterData()
  }, [])

  /** 時間割データの取得 */
  const fetchSlots = useCallback(async () => {
    if (!classId) {
      setSlots([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        classId,
        fiscalYear: String(fiscalYear),
        term: termValue,
      })
      const res = await fetch(`/api/timetable-slots?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)
      setSlots(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [classId, fiscalYear, termValue])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  /** 選択中のクラスの時間帯に合った時限のみ表示 */
  const selectedClass = classes.find((c) => c.id === classId)
  const filteredPeriods = selectedClass
    ? periods.filter((p) => p.timeSlot === selectedClass.timeSlot)
    : periods

  /** 特定セルのスロットを取得 */
  function getSlot(day: string, periodId: string): TimetableSlot | undefined {
    return slots.find((s) => s.dayOfWeek === day && s.periodId === periodId)
  }

  /** セルクリック */
  function handleCellClick(day: string, periodId: string) {
    const existing = getSlot(day, periodId)
    setEditSlotId(existing?.id ?? null)
    setEditCell({
      dayOfWeek: day,
      periodId,
      subjectId: existing?.subjectId ?? '',
      teacherId: existing?.teacherId ?? '',
    })
    setCellError('')
    setTeacherWarning('')
  }

  /** セル保存 */
  async function handleCellSave() {
    if (!editCell || !classId) return
    setSaving(true)
    setCellError('')
    setTeacherWarning('')

    try {
      const res = await fetch('/api/timetable-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          dayOfWeek: editCell.dayOfWeek,
          periodId: editCell.periodId,
          subjectId: editCell.subjectId,
          teacherId: editCell.teacherId || null,
          fiscalYear,
          term: termValue,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      // 教員重複の警告があれば表示
      if (json.data?.teacherConflict) {
        setTeacherWarning(json.data.teacherConflict)
      } else {
        setEditCell(null)
        setEditSlotId(null)
      }

      fetchSlots()
    } catch (err) {
      setCellError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** セル削除 */
  async function handleCellDelete() {
    if (!editSlotId) return
    setSaving(true)
    setCellError('')

    try {
      const res = await fetch('/api/timetable-slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editSlotId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message)

      setEditCell(null)
      setEditSlotId(null)
      fetchSlots()
    } catch (err) {
      setCellError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 週間コマ数・授業時間の算出 */
  const weeklySlotCount = slots.length
  const totalMinutes = slots.reduce((sum, slot) => {
    const [sh, sm] = slot.period.startTime.split(':').map(Number)
    const [eh, em] = slot.period.endTime.split(':').map(Number)
    return sum + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)
  const weeklyHours = Math.round(totalMinutes / 60 * 10) / 10
  // 年間38週で概算
  const annualHours = Math.round(weeklyHours * 38)

  /** 年度セレクタの選択肢（現在年 ± 1） */
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">時間割編集</h1>

      {/* コントロール */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">年度</label>
          <Select
            value={String(fiscalYear)}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}年度</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">学期</label>
          <Select
            value={termValue}
            onChange={(e) => setTermValue(e.target.value)}
          >
            {term.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">クラス</label>
          <Select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">選択してください</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 時間割グリッド */}
      {classId ? (
        <>
          {loading ? (
            <div className="text-muted-foreground">読み込み中...</div>
          ) : filteredPeriods.length === 0 ? (
            <div className="text-muted-foreground">
              時限が設定されていません。「設定 → 時限設定」から時限を登録してください。
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-muted text-xs w-20">時限</th>
                        {weekdays.map((day) => (
                          <th key={day} className="border p-2 bg-muted text-xs min-w-[120px]">
                            {dayOfWeek.labelMap[day as keyof typeof dayOfWeek.labelMap]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeriods.map((period) => (
                        <tr key={period.id}>
                          <td className="border p-2 bg-muted/50 text-center text-xs">
                            <div className="font-medium">{period.periodNumber}限</div>
                            <div className="text-muted-foreground">
                              {period.startTime}〜{period.endTime}
                            </div>
                          </td>
                          {weekdays.map((day) => {
                            const slot = getSlot(day, period.id)
                            return (
                              <td
                                key={day}
                                className="border p-1 cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleCellClick(day, period.id)}
                              >
                                {slot ? (
                                  <div className="text-xs p-1">
                                    <div className="font-medium">{slot.subject.name}</div>
                                    {slot.teacher && (
                                      <div className="text-muted-foreground mt-0.5">
                                        {slot.teacher.name}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-10 flex items-center justify-center text-muted-foreground/30 text-xs">
                                    +
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 集計情報 */}
          {slots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">集計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">週間コマ数: </span>
                    <span className="font-medium">{weeklySlotCount}コマ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">週間授業時間: </span>
                    <span className="font-medium">{weeklyHours}時間</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">年間授業時間（38週概算）: </span>
                    <span className={`font-medium ${annualHours >= 760 ? 'text-green-600' : 'text-red-600'}`}>
                      {annualHours}時間
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      （法定基準: 760時間以上）
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-muted-foreground">クラスを選択してください</div>
      )}

      {/* セル編集モーダル */}
      <Dialog open={!!editCell} onOpenChange={(open) => { if (!open) { setEditCell(null); setEditSlotId(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSlotId ? '授業枠の編集' : '授業枠の追加'}
            </DialogTitle>
          </DialogHeader>
          {editCell && (
            <div className="space-y-4">
              {cellError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{cellError}</div>
              )}
              {teacherWarning && (
                <div className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800">{teacherWarning}</div>
              )}
              <div className="space-y-1">
                <Label>科目 <span className="text-destructive">*</span></Label>
                <Select
                  value={editCell.subjectId}
                  onChange={(e) => setEditCell({ ...editCell, subjectId: e.target.value })}
                  required
                >
                  <option value="">選択してください</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>担当教員</Label>
                <Select
                  value={editCell.teacherId}
                  onChange={(e) => setEditCell({ ...editCell, teacherId: e.target.value })}
                >
                  <option value="">未定</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-between">
                <div>
                  {editSlotId && (
                    <Button variant="destructive" onClick={handleCellDelete} disabled={saving}>
                      削除
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setEditCell(null); setEditSlotId(null) }}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCellSave} disabled={saving || !editCell.subjectId}>
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
