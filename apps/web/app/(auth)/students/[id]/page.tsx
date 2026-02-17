'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import {
  studentStatus, cohort, gender, preEnrollmentStatus,
  careerPath, careerResult, interviewType,
} from '@joshinan/domain'
import { BasicInfoTab } from './tabs/basic-info'
import { EnrollmentTab } from './tabs/enrollment'
import { ResidenceTab } from './tabs/residence'
import { EntryTab } from './tabs/entry'
import { EmploymentTab } from './tabs/employment'
import { CareerTab } from './tabs/career'
import { InterviewTab } from './tabs/interview'

/** 学生データの型（API レスポンス） */
export type Student = {
  id: string
  studentNumber: string
  nameKanji: string | null
  nameKana: string | null
  nameEn: string
  dateOfBirth: string
  gender: string
  nationality: string
  status: string
  preEnrollmentStatus: string | null
  enrollmentDate: string | null
  expectedGraduationDate: string | null
  cohort: string
  phone: string | null
  email: string | null
  addressJapan: string | null
  addressHome: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  passportNumber: string | null
  residenceCardNumber: string | null
  residenceStatus: string | null
  residenceExpiry: string | null
  entryDate: string | null
  entryAirport: string | null
  flightNumber: string | null
  pickupStaffId: string | null
  workPermitStatus: boolean
  workPermitDate: string | null
  workPermitExpiry: string | null
  healthInsuranceNumber: string | null
  healthInsuranceDate: string | null
  agentId: string | null
  careerPath: string | null
  careerDestination: string | null
  careerResult: string | null
  withdrawalDate: string | null
  withdrawalReason: string | null
  notes: string | null
  employments: Array<{
    id: string; employerName: string; phone: string | null
    weeklyHours: number | null; hourlyWage: number | null
  }>
  certifications: Array<{
    id: string; examType: string; level: string | null
    examDate: string; result: string; score: number | null
  }>
  interviewRecords: Array<{
    id: string; interviewDate: string; interviewType: string
    content: string; actionItems: string | null
    staff: { id: string }
  }>
  agent: { id: string; name: string } | null
}

/** ステータスに応じたバッジバリアント */
function statusVariant(status: string) {
  switch (status) {
    case 'ENROLLED': return 'default' as const
    case 'PRE_ENROLLMENT': return 'secondary' as const
    case 'GRADUATED':
    case 'COMPLETED': return 'outline' as const
    case 'WITHDRAWN':
    case 'EXPELLED': return 'destructive' as const
    default: return 'secondary' as const
  }
}

/** Enum ラベルマップの共有オブジェクト */
export const labelMaps = {
  studentStatus: studentStatus.labelMap,
  cohort: cohort.labelMap,
  gender: gender.labelMap,
  preEnrollmentStatus: preEnrollmentStatus.labelMap,
  careerPath: careerPath.labelMap,
  careerResult: careerResult.labelMap,
  interviewType: interviewType.labelMap,
}

/** 学生詳細画面 */
export default function StudentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStudent = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${params.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setStudent(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchStudent()
  }, [fetchStudent])

  if (loading) return <div className="text-muted-foreground">読み込み中...</div>
  if (error) return <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
  if (!student) return <div className="text-muted-foreground">学生が見つかりません</div>

  return (
    <div className="space-y-6">
      {/* ヘッダー: 学籍番号・氏名・ステータスバッジ */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/students')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {student.nameKanji ?? student.nameEn}
            </h1>
            <Badge variant={statusVariant(student.status)}>
              {labelMaps.studentStatus[student.status as keyof typeof labelMaps.studentStatus] ?? student.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {student.studentNumber}
            {student.nameKanji && ` / ${student.nameEn}`}
          </p>
        </div>
      </div>

      {/* 7タブ構成 */}
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="enrollment">学籍情報</TabsTrigger>
          <TabsTrigger value="residence">在留情報</TabsTrigger>
          <TabsTrigger value="entry">入国情報</TabsTrigger>
          <TabsTrigger value="employment">勤務先</TabsTrigger>
          <TabsTrigger value="career">進路</TabsTrigger>
          <TabsTrigger value="interview">面談記録</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoTab student={student} onUpdate={fetchStudent} />
        </TabsContent>
        <TabsContent value="enrollment">
          <EnrollmentTab student={student} onUpdate={fetchStudent} />
        </TabsContent>
        <TabsContent value="residence">
          <ResidenceTab student={student} onUpdate={fetchStudent} />
        </TabsContent>
        <TabsContent value="entry">
          <EntryTab student={student} onUpdate={fetchStudent} />
        </TabsContent>
        <TabsContent value="employment">
          <EmploymentTab student={student} />
        </TabsContent>
        <TabsContent value="career">
          <CareerTab student={student} onUpdate={fetchStudent} />
        </TabsContent>
        <TabsContent value="interview">
          <InterviewTab student={student} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
