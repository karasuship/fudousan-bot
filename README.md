# 賃貸費用チェッカー

賃貸契約の費用（更新料・再契約料・仲介手数料・鍵交換代・清掃代・保証会社費用など）について、
入力内容から確認事項・返還可能額の目安・確認メール文案を提示するサービス。

## 起動（ローカル）

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数の設定
cp .env.local.example .env.local
# .env.local を編集して STRIPE_SECRET_KEY と NEXT_PUBLIC_BASE_URL を設定

# 3. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `STRIPE_SECRET_KEY` | ✓ | Stripe シークレットキー（`sk_test_...` または `sk_live_...`） |
| `NEXT_PUBLIC_BASE_URL` | ✓ | サイトのベースURL（例: `http://localhost:3000`） |

Stripeキーは [Stripeダッシュボード](https://dashboard.stripe.com/apikeys) の「開発者 > APIキー」から取得できます。

## ローカルでの課金確認手順

1. `.env.local` に `STRIPE_SECRET_KEY=sk_test_...` を設定
2. `npm run dev` で起動
3. 診断ページ（`/diagnosis`）でフォームを送信
4. 結果画面の「メール全文を取得する（980円）」をクリック
5. Stripe テスト決済ページが開く
6. テストカード `4242 4242 4242 4242`、有効期限 `12/34`、CVC `123` を使用
7. 決済完了後 `/success?session_id=...` にリダイレクトされる
8. メール全文が表示されることを確認

## success / cancel の確認方法

- **success**: Stripe テスト決済を完了すると自動で `/success?session_id=xxx` に遷移
- **cancel**: Stripe 決済ページで「戻る」を押すと `/cancel` に遷移

## 主要ファイル

| ファイル | 役割 |
|---|---|
| `lib/types.ts` | 型定義 |
| `lib/diagnose.ts` | ルールベース診断ロジック + 返還目安計算 |
| `lib/draftEmail.ts` | トーン別メール文案生成 |
| `lib/schema.ts` | zodバリデーションスキーマ |
| `app/api/diagnose/route.ts` | POST /api/diagnose |
| `app/api/create-checkout-session/route.ts` | Stripe Checkout セッション作成 |
| `app/api/verify-checkout-session/route.ts` | Stripe 支払い状態確認（補助用） |
| `app/success/page.tsx` | 決済完了ページ（サーバーで支払い検証） |
| `app/cancel/page.tsx` | 決済キャンセルページ |
| `components/DiagnosisForm.tsx` | 入力フォーム（結果をlocalStorageに保存） |
| `components/DiagnosisResult.tsx` | 結果表示コンポーネント |
| `components/EmailLockSection.tsx` | メールプレビュー＋Stripe課金導線 |
| `components/SuccessClient.tsx` | 決済後メール全文表示（クライアント） |

## APIレスポンス形式（POST /api/diagnose）

```json
{
  "overallRisk": "safe" | "review" | "caution",
  "score": 0-100,
  "summary": "string",
  "issues": ["string"],
  "nextChecks": ["string"],
  "draftEmail": "string",
  "disclaimer": "string",
  "estimatedRefundMin": 0,
  "estimatedRefundMax": 50000,
  "estimatedBreakdown": [
    { "feeType": "key_exchange", "label": "鍵交換代", "min": 3000, "max": 13000 }
  ]
}
```

## あえて未実装の点（将来対応推奨）

- **Stripe Webhook**: 本番環境では Webhook による非同期支払い確認を推奨
  - 現状: success ページでサーバーサイドに session_id を直接問い合わせる方式（MVP向け）
  - 将来: `app/api/webhook/route.ts` を追加し、`checkout.session.completed` イベントを処理
- **DB保存**: 現状は診断結果を localStorage に保存しているため、ブラウザ消去で消える
  - 将来: Supabase 等に `diagnosis_results` テーブルを作り、session_id と紐づけて保存
  - 拡張ポイント: `lib/diagnose.ts` の `diagnose()` 関数の戻り値をそのまま INSERT 可能
- **認証**: ログイン機能がないため、購入履歴の管理ができない
- **AI連携**: `lib/diagnose.ts` のロジック部分を Claude API 等に置き換え可能な設計
- **管理画面・売上確認**: Stripe ダッシュボードで確認可能

## ビルド

```bash
npm run build
npm run start
```

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Zod v4
- Stripe v21
