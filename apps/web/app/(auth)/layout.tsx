import Link from 'next/link'
import { LayoutDashboard, GraduationCap, Users, BookOpen, School, ClipboardCheck, Wallet, Building2, FileText, UserPlus, FileOutput, Briefcase, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** メニュー項目 */
const menuItems = [
  { title: 'ダッシュボード', url: '/dashboard', icon: LayoutDashboard },
  { title: '学生管理', url: '/students', icon: GraduationCap },
  { title: 'エージェント管理', url: '/agents', icon: Users },
  { title: 'クラス管理', url: '/classes', icon: School },
  { title: '出席管理', url: '/attendance', icon: ClipboardCheck },
  { title: '学費管理', url: '/tuition', icon: Wallet },
  { title: '施設管理', url: '/facilities/dormitories', icon: Building2 },
  { title: 'カリキュラム', url: '/curriculum/subjects', icon: BookOpen },
  { title: '入管報告', url: '/immigration', icon: FileText },
  { title: '募集管理', url: '/recruitment', icon: UserPlus },
  { title: '特定技能', url: '/ssw/cases', icon: Briefcase },
  { title: '社内文書', url: '/documents', icon: FileOutput },
  { title: '設定', url: '/settings/school', icon: Settings },
]

/**
 * 認証済みページ共通レイアウト
 * サイドバー + ヘッダー
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center border-b px-4">
          <span className="font-semibold">常南国際学院</span>
        </div>
        <nav className="space-y-1 p-3">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b px-6">
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4" />
              ログアウト
            </Button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
