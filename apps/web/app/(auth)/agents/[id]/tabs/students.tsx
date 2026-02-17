'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { studentStatus } from '@joshinan/domain'
import type { Agent } from '../page'

/** ステータスに応じたバッジのバリアント */
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

/** 学生一覧タブ */
export function StudentsTab({ agent }: { agent: Agent }) {
  const router = useRouter()

  if (agent.students.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          このエージェント経由の学生はいません
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>学生一覧（{agent.students.length}名）</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>学籍番号</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>国籍</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agent.students.map((student) => (
              <TableRow
                key={student.id}
                className="cursor-pointer"
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <TableCell className="font-mono">{student.studentNumber}</TableCell>
                <TableCell>
                  <div>{student.nameKanji ?? student.nameEn}</div>
                  {student.nameKanji && (
                    <div className="text-xs text-muted-foreground">{student.nameEn}</div>
                  )}
                </TableCell>
                <TableCell>{student.nationality}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(student.status)}>
                    {studentStatus.labelMap[student.status as keyof typeof studentStatus.labelMap] ?? student.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
