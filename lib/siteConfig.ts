/**
 * サービス運営情報の一元管理
 * ここを書き換えるだけで全法務ページ・フッター等に反映されます
 */
export const SITE = {
  /** サービス名 */
  serviceName: "賃貸費用チェッカー",

  /** 販売事業者名（個人または法人名） */
  operatorName: "【事業者名を入力】",

  /** 運営責任者名 */
  representative: "【代表者名を入力】",

  /** 問い合わせ用メールアドレス */
  email: "info@example.com",

  /**
   * 電話番号（任意）
   * 記載する場合: "03-XXXX-XXXX"
   * 記載しない場合: "" のまま（特商法ページでは非表示になります）
   */
  phone: "",

  /**
   * 所在地（任意）
   * 公開する場合: "東京都○○区○○1-2-3"
   * 非公開の場合: "" のまま（「請求があれば開示」表示になります）
   */
  address: "",

  /** 有料価格（税込・円） */
  price: 980,

  /** 価格表示文字列 */
  priceLabel: "980円（税込）",

  /** 制定年（法務ページのフッターに表示） */
  year: 2025,

  /** Stripe Payment Link */
  stripeLink: "https://buy.stripe.com/test_dRm3co7HebRIewr9Hm7kc00",
} as const;
