# MDViewer

Electronベースのデスクトップアプリケーション - Markdownファイルを閲覧可能なビューア

## 機能

- .md形式のMarkdownファイルを表示
- デスクトップアプリとして動作
- ファイル選択ダイアログからMarkdownファイルを開く
- シンプルで読みやすいデザイン
- GitHub風のMarkdownスタイリング

## 必要な環境

- Node.js (v18以上推奨)
- npm

## インストール

```bash
npm install
```

## ビルド

```bash
npm run build
```

## 起動方法

開発モード：

```bash
npm run dev
```

または、ビルド後に起動：

```bash
npm run build
npm start
```

## 使い方

1. アプリを起動します
2. 画面上部の「ファイルを開く」ボタンをクリック
3. .mdファイルを選択
4. Markdownの内容が表示されます

## パッケージング

実行可能ファイルを作成する場合：

```bash
npm run package
```

パッケージ化されたアプリケーションは `release` フォルダに生成されます。

## 対応拡張子

- .md

## 技術スタック

- Electron - デスクトップアプリケーションフレームワーク
- TypeScript
- Node.js
- marked - Markdownパーサー

## プロジェクト構成

```
MDViewer/
├── src/
│   ├── main.ts       # Electronメインプロセス
│   ├── preload.ts    # プリロードスクリプト
│   └── renderer.ts   # レンダラープロセス
├── public/
│   ├── index.html    # メインHTML
│   └── styles.css    # スタイルシート
├── dist/             # ビルド出力先
├── package.json
└── tsconfig.json
```
