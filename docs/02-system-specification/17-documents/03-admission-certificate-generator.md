# 入学許可証 自動生成ツール 要件定義書

## 1. 概要

在留資格認定証明書の交付結果に基づき、合格した学生の入学許可証（Excel）を一括生成するツール。

**入力**: 学生データ（Excel or CSV）  
**出力**: 入学許可証Excel（1ファイル、1名1シート、印鑑画像付き、A4印刷対応）

---

## 2. テンプレート仕様

### 2.1 テンプレートファイル

`入学許可証_.xlsx` をテンプレートとして使用する。  
このファイルは openpyxl の `copy_worksheet()` でシート複製する母体となる。

### 2.2 レイアウト構成

| 行 | セル | 内容 | 備考 |
|---|---|---|---|
| 3 | V3:Z3（マージ） | 発行日 | `YYYY年M月D日` 形式。元テンプレは `=TODAY()` だがPython側で文字列注入 |
| 6 | A6:AB6（マージ） | タイトル「入学許可証」 | **固定値（変更不要）** |
| 10 | H10 | 氏名（英字） | `{{氏名_英字}}` → 学生データから注入 |
| 13 | H13 | 性別 | **行ごと非表示**（`ws.row_dimensions[13].hidden = True`） |
| 16 | H16:M16（マージ） | 生年月日 | `{{生年月日}}` → `YYYY年M月D日` 形式で注入 |
| 19 | H19:M19（マージ） | 国籍 | `{{国籍}}` → 学生データから注入 |
| 23 | A23:AB23（マージ） | 入学許可文 | `　上記の者を本校『進学2年コース』生として、入学を許可します。` |
| 33-34 | O33:AA34（マージ） | 学校名 | **固定値**「常南国際学院」 |
| 36 | R36:Y36（マージ） | 校長名 | **固定値**「笹目 貴司」 |
| 36 | Z36 | 「㊞」 | **固定値** |
| 38 | R38:AA38（マージ） | 住所 | **固定値**「茨城県つくば市榎戸４３３−２」 |
| 39 | T39:AA39（マージ） | TEL | **固定値**「029-837-1275」 |

### 2.3 印刷範囲

```
$A$1:$AB$40
```

### 2.4 印刷設定

```python
ws.sheet_properties.pageSetUpPr.fitToPage = True
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 1
```

**注意**: `scale=80%` ではなく `fitToPage 1×1` を使うこと。LibreOffice等でのPDF変換時に確実にA4 1ページに収まる。

---

## 3. 印鑑画像

### 3.1 画像ファイル

- ファイル名: `seal.png`
- サイズ: 160×160px, RGBA, PNG
- ファイルサイズ: 約62KB
- **保管場所**: テンプレートExcelと同じディレクトリ、またはプロジェクト内の `assets/` フォルダ

### 3.2 配置方法

**TwoCellAnchor** で配置すること（OneCellAnchorだと印刷範囲からはみ出す）。

```python
from openpyxl.drawing.image import Image
from openpyxl.drawing.spreadsheet_drawing import TwoCellAnchor, AnchorMarker

img = Image("seal.png")
_from = AnchorMarker(col=23, colOff=139700, row=32, rowOff=152400)
_to   = AnchorMarker(col=27, colOff=190500, row=37, rowOff=25400)
anchor = TwoCellAnchor(_from=_from, to=_to)
img.anchor = anchor
ws.add_image(img)
```

| パラメータ | 値 | 意味 |
|---|---|---|
| FROM col | 23 (=X列, 0始まり) | 画像左端 |
| FROM row | 32 (=33行目, 0始まり) | 画像上端 |
| FROM colOff | 139700 EMU | X列内のオフセット |
| FROM rowOff | 152400 EMU | 33行目内のオフセット |
| TO col | 27 (=AB列) | 画像右端 |
| TO row | 37 (=38行目) | 画像下端 |
| TO colOff | 190500 EMU | AB列内のオフセット |
| TO rowOff | 25400 EMU | 38行目内のオフセット |

### 3.3 画像の取り扱い

印鑑画像（`seal.png`）はプロジェクトリポジトリに含めてよい。元テンプレExcelから抽出したもの。base64埋め込みも可能だが、ファイルとして保持する方が管理しやすい。

Claude Code実装時は以下のいずれか:
1. **リポジトリに `assets/seal.png` として配置**（推奨）
2. コード内にbase64リテラルで埋め込み、実行時にデコードして一時ファイル化

---

## 4. 入力データ仕様

### 4.1 必須カラム

| カラム名 | 型 | 例 | 備考 |
|---|---|---|---|
| 氏名_英字 | string | `KONG DEHAO` | アルファベット大文字 |
| 国籍 | string | `中国` | 日本語表記 |
| 生年月日 | date/string | `2005-09-06` or `2005年9月6日` | パース処理が必要 |

### 4.2 任意カラム

| カラム名 | 型 | デフォルト | 備考 |
|---|---|---|---|
| コース名 | string | `進学2年コース` | 行23の文中に挿入 |
| 発行日 | date | 実行日（TODAY） | 全シート共通 |

### 4.3 NULLハンドリング

- 氏名がNULL → セルを空のまま出力（エラーにしない）
- 国籍がNULL → セルを空のまま出力
- 生年月日がNULL → セルを空のまま出力
- **NULLの行もシートとして生成する**（スキップしない）

---

## 5. 処理フロー

```
1. テンプレートExcel読み込み
2. 入力データ（Excel/CSV）読み込み
3. 1人目: テンプレートシートに直接データ注入
4. 2人目以降: copy_worksheet()でシート複製 → データ注入
5. 全シートに対して:
   a. 印鑑画像追加（TwoCellAnchor）
   b. print_area設定
   c. fitToPage設定
   d. row13非表示
6. Excel保存
```

### 5.1 copy_worksheet の注意点

`openpyxl.copy_worksheet()` は以下を**コピーしない**:
- 画像（`_images`）→ 各シートに個別追加が必要
- `print_area` → 各シートに個別設定が必要

コピー**される**もの:
- セル値・書式・マージセル
- 列幅・行高
- fitToPage設定

### 5.2 シート名

`学生の氏名[:31]`（Excelシート名上限31文字）

---

## 6. コード実装例

```python
import openpyxl
from openpyxl.drawing.image import Image
from openpyxl.drawing.spreadsheet_drawing import TwoCellAnchor, AnchorMarker
from datetime import date

def generate_admission_certificates(template_path, seal_path, students, output_path, course_name="進学2年コース"):
    """
    入学許可証Excelを一括生成する。
    
    Args:
        template_path: テンプレートExcelのパス
        seal_path: 印鑑PNG画像のパス
        students: list of dict（必須キー: name, nationality, dob）
        output_path: 出力Excelのパス
        course_name: コース名（デフォルト: 進学2年コース）
    """
    wb = openpyxl.load_workbook(template_path)
    ws_first = wb[wb.sheetnames[0]]
    today_str = date.today().strftime('%Y年%-m月%-d日')

    def apply_student(ws, student):
        ws['V3'] = today_str
        ws['H10'] = student.get('name') or ''
        ws['H16'] = student.get('dob') or ''
        ws['H19'] = student.get('nationality') or ''
        ws['A23'] = f"　上記の者を本校『{course_name}』生として、入学を許可します。"
        ws.row_dimensions[13].hidden = True

    def add_seal(ws):
        ws._images = []  # 既存画像クリア
        img = Image(seal_path)
        _from = AnchorMarker(col=23, colOff=139700, row=32, rowOff=152400)
        _to = AnchorMarker(col=27, colOff=190500, row=37, rowOff=25400)
        anchor = TwoCellAnchor(_from=_from, to=_to)
        img.anchor = anchor
        ws.add_image(img)

    def setup_print(ws):
        ws.print_area = "$A$1:$AB$40"
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 1

    # 1人目
    apply_student(ws_first, students[0])
    ws_first.title = (students[0].get('name') or 'Sheet1')[:31]
    add_seal(ws_first)
    setup_print(ws_first)

    # 2人目以降
    for i in range(1, len(students)):
        ws = wb.copy_worksheet(ws_first)
        ws.title = (students[i].get('name') or f'Sheet{i+1}')[:31]
        apply_student(ws, students[i])
        add_seal(ws)
        setup_print(ws)

    wb.save(output_path)
    return len(students)
```

---

## 7. ファイル構成（Claude Code想定）

```
project-root/
├── assets/
│   ├── 入学許可証_.xlsx      # テンプレートExcel
│   └── seal.png              # 印鑑画像（160x160 PNG）
├── scripts/
│   └── generate_certificates.py  # 生成スクリプト
├── input/
│   └── （入力データをここに配置）
└── output/
    └── （生成ファイルがここに出力）
```

---

## 8. 将来拡張

- **コース名のバリエーション対応**: 「進学1年6月コース」「一般2年コース」等
- **発行日の個別指定**: 学生ごとに異なる発行日
- **PDF一括出力**: LibreOffice経由でExcel→PDF変換
- **入力ソースの多様化**: Ringual API連携、Box上のデータ自動取得
- **スキル化**: `SKILL.md` として定義し、チャットから「入学許可証出して」で発動
