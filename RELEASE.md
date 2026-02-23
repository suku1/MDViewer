# リリース手順

このドキュメントでは、MDViewerの新しいバージョンをリリースする手順を説明します。

## 自動リリース（推奨）

GitHub Actionsを使用して、自動的にビルドとリリースを行います。

### 手順

1. **バージョン番号の更新**
   
   `package.json`のバージョン番号を更新します：
   ```bash
   npm version patch  # パッチバージョンアップ (0.1.0 → 0.1.1)
   npm version minor  # マイナーバージョンアップ (0.1.0 → 0.2.0)
   npm version major  # メジャーバージョンアップ (0.1.0 → 1.0.0)
   ```

2. **変更をコミットしてプッシュ**
   ```bash
   git add .
   git commit -m "Bump version to x.x.x"
   git push
   ```

3. **タグを作成してプッシュ**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

4. **自動ビルドの確認**
   
   GitHub Actionsが自動的に実行され、以下の処理が行われます：
   - ソースコードのビルド
   - インストーラーの作成
   - GitHub Releasesへのアップロード

   進捗は [Actions タブ](https://github.com/YOUR_USERNAME/YOUR_REPO/actions) で確認できます。

5. **リリースノートの編集**
   
   GitHub Releasesページで、自動作成されたリリースにリリースノートを追加します。

## 手動リリース

必要に応じて、ローカルでビルドして手動でアップロードすることもできます。

### 手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **ビルド**
   ```bash
   npm run build
   ```

3. **パッケージ作成**
   ```bash
   npm run package
   ```

4. **成果物の確認**
   
   `release/` フォルダに以下のファイルが生成されます：
   - `MDViewer-x.x.x-Setup.exe` - インストーラー
   - その他のアーティファクト

5. **GitHub Releasesから手動アップロード**
   
   1. GitHubのリポジトリページに移動
   2. "Releases" タブをクリック
   3. "Draft a new release" をクリック
   4. タグバージョンを入力（例：v0.1.0）
   5. リリースタイトルと説明を入力
   6. `release/` フォルダから成果物をドラッグ&ドロップ
   7. "Publish release" をクリック

## 成果物の種類

- **MDViewer-x.x.x-Setup.exe** - Windows用インストーラー（NSIS）
- その他、electron-builderが生成するファイル

## トラブルシューティング

### GitHub Actionsが失敗する場合

- `GITHUB_TOKEN` パーミッションを確認してください
- リポジトリの Settings → Actions → General → Workflow permissions で "Read and write permissions" を有効にしてください

### ローカルビルドが失敗する場合

- Node.jsのバージョンを確認してください（推奨: v20以上）
- `npm install`で依存関係を再インストールしてください
- `node_modules` と `dist` フォルダを削除して再ビルドしてください

## 注意事項

- リリースタグは必ず `v` で始めてください（例：v0.1.0）
- タグをプッシュする前に、コードが正しくビルドできることを確認してください
- リリース後は、必ずリリースノートを追加してユーザーに変更内容を伝えてください
