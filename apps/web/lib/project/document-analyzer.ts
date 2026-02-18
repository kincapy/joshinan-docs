/**
 * 書類解析モジュール
 *
 * アップロードされたファイルを Claude API で解析し、
 * 該当するタスクコードと信頼度を返す。
 * コスト管理のため、1回のAPI呼び出しで全ファイルをまとめて解析する。
 */

/** アップロードされたファイルの情報 */
type UploadedFile = {
  fileName: string
  content: string
  mimeType: string
}

/** 振り分け先タスクの候補 */
type TaskCandidate = {
  id: string
  taskCode: string
  taskName: string
  hasFile: boolean
}

/** 解析結果の信頼度 */
type Confidence = 'high' | 'medium' | 'low'

/** 1ファイルの解析結果 */
export type AnalysisResult = {
  fileName: string
  /** 振り分け先タスクのID（判定不能の場合は null） */
  taskId: string | null
  /** 振り分け先タスクコード（判定不能の場合は null） */
  taskCode: string | null
  /** 振り分け先タスク名 */
  taskName: string | null
  /** 信頼度 */
  confidence: Confidence
  /** 読み取ったデータ（フォーム自動入力用、DAT/DOC系の場合） */
  extractedData?: Record<string, string>
}

/**
 * アップロードされたファイル群を解析し、振り分け先を提案する
 *
 * Claude API を1回呼び出して全ファイルをまとめて解析する。
 * 環境変数 ANTHROPIC_API_KEY が未設定の場合はモック結果を返す。
 */
export async function analyzeDocuments(
  files: UploadedFile[],
  tasks: TaskCandidate[],
): Promise<AnalysisResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // API キーが未設定の場合はファイル名ベースの簡易マッチングを行う
  if (!apiKey) {
    return files.map((file) => matchByFileName(file.fileName, tasks))
  }

  // Claude API で解析する
  return analyzeWithClaude(files, tasks, apiKey)
}

/**
 * Claude API を使って書類を解析する
 *
 * 全ファイルの情報とタスク一覧をコンテキストに渡し、
 * 各ファイルの振り分け先と信頼度を返してもらう。
 */
async function analyzeWithClaude(
  files: UploadedFile[],
  tasks: TaskCandidate[],
  apiKey: string,
): Promise<AnalysisResult[]> {
  const taskList = tasks
    .map((t) => `- ${t.taskCode}: ${t.taskName}${t.hasFile ? '（ファイル登録済み）' : ''}`)
    .join('\n')

  const fileList = files
    .map((f, i) => `ファイル${i + 1}: ${f.fileName} (${f.mimeType})`)
    .join('\n')

  const systemPrompt = `あなたは特定技能申請の書類管理システムのアシスタントです。
アップロードされたファイルの内容を解析し、以下のタスク一覧から最も適切な振り分け先を判定してください。

タスク一覧:
${taskList}

以下のJSON形式で回答してください。配列のみを返してください。
[
  {
    "fileName": "ファイル名",
    "taskCode": "タスクコード or null",
    "confidence": "high | medium | low",
    "extractedData": { "フィールド名": "値" } // 企業情報等を読み取れた場合
  }
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `以下のファイルを解析して、振り分け先を判定してください。\n\n${fileList}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status)
      // API エラー時はファイル名ベースのフォールバック
      return files.map((file) => matchByFileName(file.fileName, tasks))
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // JSONを抽出してパースする
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return files.map((file) => matchByFileName(file.fileName, tasks))
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      fileName: string
      taskCode: string | null
      confidence: Confidence
      extractedData?: Record<string, string>
    }>

    // パース結果をタスクIDと紐づける
    return parsed.map((result) => {
      const task = tasks.find((t) => t.taskCode === result.taskCode)
      return {
        fileName: result.fileName,
        taskId: task?.id ?? null,
        taskCode: result.taskCode,
        taskName: task?.taskName ?? null,
        confidence: result.confidence,
        extractedData: result.extractedData,
      }
    })
  } catch (error) {
    console.error('Claude API call failed:', error)
    // エラー時はファイル名ベースのフォールバック
    return files.map((file) => matchByFileName(file.fileName, tasks))
  }
}

/**
 * ファイル名ベースの簡易マッチング（フォールバック用）
 *
 * Claude API が使えない場合の代替手段。
 * ファイル名にタスク名のキーワードが含まれているかで判定する。
 */
function matchByFileName(
  fileName: string,
  tasks: TaskCandidate[],
): AnalysisResult {
  const lowerName = fileName.toLowerCase()

  // ファイル名からキーワードを抽出してタスクとマッチングする
  const keywordMap: Record<string, string> = {
    'パスポート': 'COL-002',
    '健康診断': 'COL-001',
    '技能試験': 'COL-003',
    '日本語能力': 'COL-004',
    '日本語試験': 'COL-004',
    '納税証明': 'COL-005',
    '課税証明': 'COL-006',
    '源泉徴収': 'COL-007',
    '医療保険': 'COL-008',
    '健康保険': 'COL-009',
    '年金': 'COL-010',
    '登記': 'COL-012',
    '住民票': 'COL-013',
    '労働保険': 'COL-014',
    '社会保険': 'COL-015',
    '申請書': 'DOC-001',
    '雇用契約': 'DOC-003',
    '雇用条件': 'DOC-004',
    '支援計画': 'DOC-005',
    '概要書': 'DOC-006',
    '介護日本語': 'COL-020',
    '旅館業': 'COL-021',
    '運転免許': 'COL-022',
    '二国間': 'COL-019',
  }

  for (const [keyword, taskCode] of Object.entries(keywordMap)) {
    if (lowerName.includes(keyword)) {
      const task = tasks.find((t) => t.taskCode === taskCode)
      if (task) {
        return {
          fileName,
          taskId: task.id,
          taskCode: task.taskCode,
          taskName: task.taskName,
          confidence: 'medium',
        }
      }
    }
  }

  // マッチしない場合
  return {
    fileName,
    taskId: null,
    taskCode: null,
    taskName: null,
    confidence: 'low',
  }
}
