'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { staffRole } from '@joshinan/domain'
import { BasicInfoTab } from './tabs/basic-info'
import { QualificationsTab } from './tabs/qualifications'

/** 資格情報の型 */
export type Qualification = {
  id: string
  qualificationType: string
  acquiredDate: string | null
  expirationDate: string | null
  notes: string | null
}

/** 教職員データの型（API レスポンス） */
export type StaffDetail = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  employmentType: string
  hireDate: string
  resignationDate: string | null
  payType: string | null
  maxWeeklyLessons: number | null
  isActive: boolean
  qualifications: Qualification[]
}

/** 教職員詳細画面 */
export default function StaffDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [staff, setStaff] = useState<StaffDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /** 教職員データを取得 */
  const fetchStaff = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/${params.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')
      setStaff(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  if (loading) return <div className="p-6 text-muted-foreground">読み込み中...</div>
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      </div>
    )
  }
  if (!staff) return null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/staff')}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{staff.name}</h1>
          <Badge variant={staff.isActive ? 'default' : 'secondary'}>
            {staff.isActive ? '在職' : '退職'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {staffRole.labelMap[staff.role as keyof typeof staffRole.labelMap] ?? staff.role}
          </span>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="qualifications">
            資格一覧（{staff.qualifications.length}）
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoTab staff={staff} onUpdate={fetchStaff} />
        </TabsContent>
        <TabsContent value="qualifications">
          <QualificationsTab staffId={staff.id} qualifications={staff.qualifications} onUpdate={fetchStaff} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
