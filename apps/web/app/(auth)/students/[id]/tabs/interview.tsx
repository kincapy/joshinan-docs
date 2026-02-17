'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { Student } from '../page'
import { labelMaps } from '../page'

/** 面談記録タブ — 直近5件の面談記録 + 全件表示リンク */
export function InterviewTab({ student }: { student: Student }) {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          直近5件の面談記録
        </h3>
        <Button variant="outline" size="sm" onClick={() => router.push(`/students/${params.id}/interviews`)}>
          全件表示
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {student.interviewRecords.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">面談記録がありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {student.interviewRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>{new Date(record.interviewDate).toLocaleDateString('ja-JP')}</span>
                  <Badge variant="secondary">
                    {labelMaps.interviewType[record.interviewType as keyof typeof labelMaps.interviewType] ?? record.interviewType}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{record.content}</p>
                {record.actionItems && (
                  <div className="mt-2 rounded-md bg-muted p-2">
                    <p className="text-xs text-muted-foreground mb-1">アクション項目:</p>
                    <p className="text-sm whitespace-pre-wrap">{record.actionItems}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
