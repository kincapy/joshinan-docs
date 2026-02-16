/**
 * RINGUAL クロールスクリプト
 * Playwright で RINGUAL にログインし、各ページのフォーム構造・テーブル・選択肢を抽出する
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env を手動パース（dotenv を追加しない）
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env')
  const content = readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    env[key.trim()] = rest.join('=').trim()
  }
  return env
}

const env = loadEnv()
const BASE_URL = env.RINGUAL_BASE_URL
const LOGIN_ID = env.RINGUAL_ID
const LOGIN_PASS = env.RINGUAL_PASS

// クロール対象ページ（前回AppleScriptで読めなかった分 + 再取得）
const PAGES_TO_CRAWL = [
  { name: 'mainmenu', path: 'mainmenu.php', desc: 'メインメニュー' },
  { name: 'student_list', path: 'mainmenu.php?tab=2', desc: '学生一覧' },
  { name: 'student_list_edit', path: 'student_list_edit.php', desc: '一覧編集（Excel出力）' },
  { name: 'attendance_grade_list', path: 'attendance_grade_list.php', desc: '出席成績一覧' },
  { name: 'student_follow_list', path: 'student_follow_list.php', desc: '指導記録一覧' },
  { name: 'certificate_issuance', path: 'certificate_issuance.php', desc: '証明書発行' },
  { name: 'student_attendance', path: 'student_attendance.php', desc: '出欠入力' },
  { name: 'student_grade', path: 'student_grade.php', desc: '成績入力' },
  { name: 'timetable', path: 'timetable.php', desc: '時間割' },
  { name: 'class_regist', path: 'class_regist.php', desc: 'クラス登録' },
  { name: 'student_shinro', path: 'student_shinro.php', desc: '進路アンケート' },
  { name: 'destination', path: 'destination.php', desc: '進学先マスタ' },
  { name: 'op_school_payment', path: 'op_school_payment.php', desc: '学納金管理' },
  { name: 'setting', path: 'setting.php', desc: 'システム設定' },
]

/**
 * ページ内のフォーム要素（input/select/textarea）を抽出
 */
async function extractForms(page) {
  return await page.evaluate(() => {
    const forms = []

    // select要素
    document.querySelectorAll('select').forEach(el => {
      const options = Array.from(el.options).map(o => ({
        value: o.value,
        text: o.textContent.trim(),
        selected: o.selected,
      }))
      forms.push({
        type: 'select',
        name: el.name || el.id || '',
        id: el.id || '',
        label: findLabel(el),
        options,
      })
    })

    // input要素
    document.querySelectorAll('input').forEach(el => {
      if (el.type === 'hidden') return
      forms.push({
        type: `input:${el.type || 'text'}`,
        name: el.name || el.id || '',
        id: el.id || '',
        label: findLabel(el),
        placeholder: el.placeholder || '',
        value: el.value || '',
      })
    })

    // textarea要素
    document.querySelectorAll('textarea').forEach(el => {
      forms.push({
        type: 'textarea',
        name: el.name || el.id || '',
        id: el.id || '',
        label: findLabel(el),
        placeholder: el.placeholder || '',
      })
    })

    // ラベルを探すヘルパー
    function findLabel(el) {
      // 1. for属性で紐づくlabel
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`)
        if (label) return label.textContent.trim()
      }
      // 2. 親のlabel
      const parentLabel = el.closest('label')
      if (parentLabel) return parentLabel.textContent.trim().replace(el.value, '').trim()
      // 3. 直前のtd/thのテキスト
      const cell = el.closest('td')
      if (cell && cell.previousElementSibling) {
        return cell.previousElementSibling.textContent.trim()
      }
      // 4. 直前の兄弟テキスト
      const prev = el.previousElementSibling
      if (prev) return prev.textContent.trim().substring(0, 50)
      return ''
    }

    return forms
  })
}

/**
 * ページ内のテーブル構造を抽出
 */
async function extractTables(page) {
  return await page.evaluate(() => {
    const tables = []
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th'))
        .map(th => th.textContent.trim())

      // ヘッダーがない場合、最初の行をヘッダーとして扱う
      const rows = []
      const trs = table.querySelectorAll('tbody tr, tr')
      const startIdx = headers.length > 0 ? 0 : 1

      // 最大10行だけ取得（データ量抑制）
      for (let i = startIdx; i < Math.min(trs.length, startIdx + 10); i++) {
        const cells = Array.from(trs[i].querySelectorAll('td'))
          .map(td => td.textContent.trim().substring(0, 100))
        if (cells.length > 0) rows.push(cells)
      }

      if (headers.length > 0 || rows.length > 0) {
        tables.push({
          headers: headers.length > 0 ? headers : (rows.length > 0 ? rows.shift() : []),
          rowCount: table.querySelectorAll('tbody tr, tr').length,
          sampleRows: rows.slice(0, 5),
          className: table.className || '',
        })
      }
    })
    return tables
  })
}

/**
 * ページの見出し・テキスト構造を抽出
 */
async function extractHeadings(page) {
  return await page.evaluate(() => {
    const headings = []
    document.querySelectorAll('h1, h2, h3, h4, .title, .page-title, .menu-title').forEach(el => {
      headings.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().substring(0, 200),
        className: el.className || '',
      })
    })
    return headings
  })
}

/**
 * ページのinnerTextを取得（構造が読み取れない場合のフォールバック）
 */
async function extractPageText(page) {
  return await page.evaluate(() => {
    return document.body.innerText.substring(0, 10000)
  })
}

async function main() {
  console.log('🚀 RINGUAL クロール開始')
  console.log(`   Base URL: ${BASE_URL}`)

  const browser = await chromium.launch({ headless: false }) // 画面表示して確認できるように
  const context = await browser.newContext({
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  })
  const page = await context.newPage()

  // タイムアウト設定
  page.setDefaultTimeout(15000)

  const result = {
    crawled_at: new Date().toISOString(),
    base_url: BASE_URL,
    pages: {},
  }

  try {
    // ---- ログイン ----
    console.log('📝 ログイン中...')
    // mainmenu.php にアクセスすると未ログイン時は index.php にリダイレクトされる
    await page.goto(`${BASE_URL}/mainmenu.php`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // ログインフォーム: input#UserID, input#UserPassword
    await page.fill('#UserID', LOGIN_ID)
    await page.fill('#UserPassword', LOGIN_PASS)

    // ログインボタン: button#btnLogin (onclick="fun_login();")
    await page.click('#btnLogin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // ログイン成功確認（mainmenu.php にいるはず）
    const afterLoginUrl = page.url()
    console.log('✅ ログイン完了')
    console.log(`   現在のURL: ${afterLoginUrl}`)

    if (afterLoginUrl.includes('index.php')) {
      throw new Error('ログイン失敗: まだログインページにいます')
    }

    // ---- 各ページをクロール ----
    for (const target of PAGES_TO_CRAWL) {
      console.log(`\n📄 ${target.desc} (${target.path}) をクロール中...`)

      try {
        await page.goto(`${BASE_URL}/${target.path}`)
        await page.waitForLoadState('networkidle')
        // 追加で少し待つ（動的コンテンツ対応）
        await page.waitForTimeout(1000)

        const pageTitle = await page.title()
        const currentUrl = page.url()

        const [forms, tables, headings, pageText] = await Promise.all([
          extractForms(page),
          extractTables(page),
          extractHeadings(page),
          extractPageText(page),
        ])

        result.pages[target.name] = {
          name: target.name,
          desc: target.desc,
          url: currentUrl,
          title: pageTitle,
          forms,
          tables,
          headings,
          pageText,
        }

        console.log(`   ✅ forms: ${forms.length}, tables: ${tables.length}, headings: ${headings.length}`)
      } catch (err) {
        console.error(`   ❌ エラー: ${err.message}`)
        result.pages[target.name] = {
          name: target.name,
          desc: target.desc,
          error: err.message,
        }
      }
    }

    // ---- 学生カルテ（1人分をサンプルとして取得） ----
    console.log('\n📋 学生カルテをクロール中...')
    try {
      // 学生一覧ページに移動
      await page.goto(`${BASE_URL}/mainmenu.php?tab=2`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // fun_JumpKarte(sid) をJavaScript経由で呼び出す（POST遷移）
      // まずは学生一覧で最初の学生名リンクをクリック
      const studentLinks = await page.locator('[onclick*="fun_JumpKarte"], a[href*="student_karte"]').all()
      if (studentLinks.length > 0) {
        console.log(`   学生リンク ${studentLinks.length}件発見、最初の学生カルテを開きます`)
        await studentLinks[0].click()
      } else {
        // フォールバック: 直接JavaScript呼び出し
        console.log('   学生リンクが見つからないため、JS経由でカルテを開きます')
        await page.evaluate(() => {
          if (typeof fun_JumpKarte === 'function') fun_JumpKarte(229)
        })
      }
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      console.log(`   カルテURL: ${page.url()}`)

      // タブ要素を幅広いセレクターで探す
      const karteTabs = await page.evaluate(() => {
        const tabs = []
        // よくあるタブUIのパターンを網羅
        const selectors = '.tab, [role="tab"], a[href*="tab"], .karte-tab, li[class*="tab"], .nav-link, .ui-tabs-anchor, [data-toggle="tab"], [data-bs-toggle="tab"], .tabmenu a, .tabmenu li, #tabArea a, #tabArea li'
        document.querySelectorAll(selectors).forEach(el => {
          tabs.push({
            text: el.textContent.trim(),
            id: el.id || '',
            className: el.className || '',
            href: el.getAttribute('href') || '',
            onclick: el.getAttribute('onclick') || '',
          })
        })
        // タブが見つからなかった場合、onclick属性を持つリンクも試す
        if (tabs.length === 0) {
          document.querySelectorAll('a[onclick], li[onclick], div[onclick]').forEach(el => {
            const text = el.textContent.trim()
            if (text.length < 30) {
              tabs.push({
                text,
                onclick: el.getAttribute('onclick') || '',
                tag: el.tagName,
              })
            }
          })
        }
        return tabs
      })

      const karteData = {
        tabs: karteTabs,
        tabContents: {},
      }

      // 現在表示中のタブ内容を取得
      const [karteForms, karteTables, karteText] = await Promise.all([
        extractForms(page),
        extractTables(page),
        extractPageText(page),
      ])
      karteData.tabContents['default'] = { forms: karteForms, tables: karteTables, pageText: karteText }

      // カルテのタブをクリックして各タブの内容を取得
      // 全セレクター対応
      const tabSelectors = '.tab, [role="tab"], .karte-tab, .nav-link, .ui-tabs-anchor, [data-toggle="tab"], .tabmenu a, .tabmenu li, #tabArea a'
      const tabLinks = await page.locator(tabSelectors).all()
      for (const tabLink of tabLinks) {
        try {
          const tabText = await tabLink.textContent()
          const trimmed = tabText.trim()
          if (!trimmed || trimmed.length > 30) continue

          console.log(`   タブ「${trimmed}」を読み込み中...`)
          await tabLink.click()
          await page.waitForTimeout(2000)

          const [tabForms, tabTables, tabPageText] = await Promise.all([
            extractForms(page),
            extractTables(page),
            extractPageText(page),
          ])

          karteData.tabContents[trimmed] = {
            forms: tabForms,
            tables: tabTables,
            pageText: tabPageText,
          }
        } catch (err) {
          console.log(`   ⚠️ タブでエラー: ${err.message}`)
        }
      }

      result.pages['student_karte'] = {
        name: 'student_karte',
        desc: '学生カルテ',
        url: page.url(),
        ...karteData,
      }

      console.log(`   ✅ カルテタブ: ${karteTabs.length}個, 内容取得: ${Object.keys(karteData.tabContents).length}タブ`)
    } catch (err) {
      console.error(`   ❌ カルテエラー: ${err.message}`)
      result.pages['student_karte'] = { error: err.message }
    }

  } catch (err) {
    console.error(`\n💥 致命的エラー: ${err.message}`)
    result.error = err.message
  } finally {
    // 結果を保存
    const outputDir = resolve(__dirname, 'output')
    mkdirSync(outputDir, { recursive: true })
    const outputPath = resolve(outputDir, 'ringual-pages.json')
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
    console.log(`\n💾 結果を保存: ${outputPath}`)

    await browser.close()
    console.log('🏁 クロール完了')
  }
}

main().catch(console.error)
