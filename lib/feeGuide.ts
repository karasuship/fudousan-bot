// lib/feeGuide.ts
// 費目別解説・名目ゆれ・診断補助情報のマスターファイル

export type FeeNature = "optional" | "conditional" | "custom";
// optional:    完全任意
// conditional: 条件付き義務（法律上根拠あるが条件次第）
// custom:      慣行（法的根拠なし）

export type FeeOwner = "tenant" | "landlord" | "negotiable";
// tenant:     借主負担が原則
// landlord:   貸主負担が原則
// negotiable: 交渉次第

export type FeeStrategy = "delete" | "free_rent" | "confirm" | "record" | "warn";
// warn: 将来費用の警告表示用

export interface FeeGuide {
  feeId: string;
  label: string;
  aliases: string[];
  nature: FeeNature;
  owner: FeeOwner;
  legalBasis: string;
  agentClaim: string;
  reality: string;
  tooltip: string;
  strategy: FeeStrategy;
  difficulty: 1 | 2 | 3;
  isFutureCost?: boolean;
}

export const FEE_GUIDE_LIST: FeeGuide[] = [
  // ── 初期費用（通常） ────────────────────────────────────────────────────────

  {
    feeId: "agency_fee",
    label: "仲介手数料",
    aliases: ["仲介料", "媒介手数料", "仲介報酬", "媒介報酬", "斡旋手数料", "紹介手数料", "取引手数料"],
    nature: "conditional",
    owner: "negotiable",
    legalBasis: "宅建業法第46条（報酬の上限規制）",
    agentClaim: "1ヶ月分が通常です",
    reality: "借主からは原則0.5ヶ月分。1ヶ月とするには借主の書面承諾が必要。貸主からADを受け取っているケースも多い",
    tooltip: "原則0.5ヶ月。書面承諾なく1ヶ月は要確認",
    strategy: "free_rent",
    difficulty: 2,
  },
  {
    feeId: "admin_fee",
    label: "書類作成費・事務手数料",
    aliases: [
      "契約事務手数料", "契約手続料", "書類作成手数料", "入居手続費", "事務代行料",
      "申込事務手数料", "入居申込手数料", "重要事項説明料", "取次手数料",
      "システム登録料", "契約管理手数料",
    ],
    nature: "optional",
    owner: "tenant",
    legalBasis: "仲介手数料は業務全体への対価（宅建業法第46条）",
    agentClaim: "事務処理の実費です",
    reality: "仲介手数料を受け取りながら別途請求は二重取りの可能性がある",
    tooltip: "仲介料を払うなら別途請求できない費用",
    strategy: "delete",
    difficulty: 3,
  },
  {
    feeId: "key_exchange",
    label: "鍵交換代",
    aliases: [
      "鍵交換費用", "鍵交換料", "シリンダー交換費", "カードキー発行料",
      "スマートロック設定料", "鍵交換負担金",
    ],
    nature: "conditional",
    owner: "landlord",
    legalBasis: "国交省原状回復ガイドライン（貸主負担が原則）",
    agentClaim: "防犯上必須です",
    reality: "本来貸主負担。交換前に支払いを求められたら要確認",
    tooltip: "本来は貸主負担。交換日と領収日も確認",
    strategy: "free_rent",
    difficulty: 2,
  },
  {
    feeId: "cleaning",
    label: "クリーニング費",
    aliases: [
      "清掃代", "ハウスクリーニング代", "室内清掃費", "入居前清掃費",
      "退去時クリーニング費", "定額清掃費", "退去時負担金", "美装費",
    ],
    nature: "conditional",
    owner: "landlord",
    legalBasis: "国交省原状回復ガイドライン（入居前清掃は貸主負担が原則）",
    agentClaim: "次の入居者のために必要です",
    reality: "入居前の清掃は貸主の義務。契約時に借主から取るのは問題",
    tooltip: "入居前清掃は本来貸主の義務",
    strategy: "free_rent",
    difficulty: 2,
  },
  {
    feeId: "disinfection",
    label: "消毒・抗菌処理費",
    aliases: [
      "室内消毒代", "消毒施工費", "除菌施工費", "抗菌施工費", "抗菌コート",
      "消臭抗菌代", "室内消臭抗菌費", "防虫施工", "害虫駆除",
      "バイオ抗菌施工", "室内環境整備費",
    ],
    nature: "optional",
    owner: "tenant",
    legalBasis: "宅建業法第47条（任意なのに必須と言うのは禁止行為）",
    agentClaim: "全室必須です・弊社規定です",
    reality: "完全任意。断っても入居拒否できない。規定があるなら文書で提示を求めることができる",
    tooltip: "断れます。規定なら文書で見せてもらえます",
    strategy: "delete",
    difficulty: 3,
  },
  {
    feeId: "support_24h",
    label: "24時間サポート",
    aliases: [
      "安心サポート", "緊急サポート", "駆けつけサービス", "くらしーど24",
      "ライフサポート24", "住まいレスキュー", "入居者サポート", "生活サポート",
      "暮らしサポート", "会費", "年会費", "サポートクラブ",
    ],
    nature: "optional",
    owner: "tenant",
    legalBasis: "宅建業法第47条",
    agentClaim: "安心のために全員加入",
    reality: "火災保険の付帯サービスと重複することが多い任意サービス",
    tooltip: "火災保険と重複の可能性。任意です",
    strategy: "delete",
    difficulty: 3,
  },
  {
    feeId: "fire_insurance",
    label: "火災保険料",
    aliases: [
      "家財保険料", "借家人賠償保険", "少額短期保険料",
      "住宅保険料", "入居者総合保険", "生活安心保険",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "加入義務は認められるが保険会社の指定は不当",
    agentClaim: "指定の保険会社に入ってください",
    reality: "加入は必要だが保険会社は自分で選べる。相場は2年で2万円前後",
    tooltip: "加入は必要。でも保険会社は自分で選べます",
    strategy: "free_rent",
    difficulty: 2,
  },
  {
    feeId: "key_money",
    label: "礼金",
    aliases: ["謝礼金", "契約謝礼金", "入居一時金", "契約一時金", "権利金", "承諾料"],
    nature: "custom",
    owner: "landlord",
    legalBasis: "法的根拠なし（慣行）。消費者契約法上の問題になり得る",
    agentClaim: "慣習です・オーナーの意向です",
    reality: "法的義務なし。閑散期や空室が続く物件では交渉余地が大きい",
    tooltip: "法的義務なし。閑散期は交渉余地あり",
    strategy: "free_rent",
    difficulty: 1,
  },
  {
    feeId: "guarantor",
    label: "保証会社費用",
    aliases: [
      "初回保証料", "保証委託料", "家賃保証料", "賃貸保証料",
      "保証会社委託料", "保証加入料", "初回保証委託料",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "物件条件次第。連帯保証人で代替できる場合も",
    agentClaim: "全員必須です",
    reality: "連帯保証人を立てられる場合は交渉余地がある",
    tooltip: "連帯保証人を立てられる場合は確認を",
    strategy: "confirm",
    difficulty: 1,
  },

  // ── 新規追加費目 ────────────────────────────────────────────────────────────

  {
    feeId: "deposit_advance",
    label: "申込金・預り金",
    aliases: [
      "申込金", "申込証拠金", "手付金", "予約金", "仮押さえ金",
      "部屋止め金", "入居申込金", "契約準備金",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "重説前の金銭受領は宅建業法上問題になり得る",
    agentClaim: "部屋を押さえるために必要です",
    reality: "重説・契約前の金銭受領は返還条件・拘束性を確認すべき最重要論点",
    tooltip: "重説前に払った？返金条件の確認が必要",
    strategy: "confirm",
    difficulty: 2,
  },
  {
    feeId: "pack_fee",
    label: "パック料金",
    aliases: [
      "入居安心パック", "安心入居パック", "新生活応援パック", "くらし安心パック",
      "住まいサポートパック", "防虫消毒パック", "初期費用パック",
      "安心セット", "入居セット",
    ],
    nature: "optional",
    owner: "tenant",
    legalBasis: "パック内の各費目の根拠による",
    agentClaim: "セットでお得です",
    reality: "複数費目の束。中身を分解しないと何に払っているか不明",
    tooltip: "中身の内訳を必ず確認してください",
    strategy: "confirm",
    difficulty: 2,
  },

  // ── 将来費用 ────────────────────────────────────────────────────────────────

  {
    feeId: "short_term_penalty",
    label: "短期解約違約金",
    aliases: [
      "早期解約違約金", "1年未満解約違約金", "解約違約金",
      "フリーレント違約金", "キャンペーン違約金",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "特約として契約書に記載される将来負担",
    agentClaim: "短期解約の場合は違約金が発生します",
    reality: "契約時に確定する将来負担。金額・期間・条件を必ず確認",
    tooltip: "いつまでに出ると違約金が発生するか確認",
    strategy: "warn",
    difficulty: 1,
    isFutureCost: true,
  },
  {
    feeId: "renewal_fee",
    label: "更新料",
    aliases: [
      "更新料", "更新事務手数料", "更新手数料",
      "更新契約料", "再契約料", "再契約手数料",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "特約として契約書に記載される将来負担",
    agentClaim: "2年ごとに更新料がかかります",
    reality: "更新料の有無・金額・更新事務手数料との二重払いに注意",
    tooltip: "2年後にいくらかかるか今確認できます",
    strategy: "warn",
    difficulty: 1,
    isFutureCost: true,
  },
  {
    feeId: "guarantor_renewal",
    label: "保証会社更新料",
    aliases: [
      "保証更新料", "年間保証料", "継続保証料",
      "保証会社更新料", "年額保証料",
    ],
    nature: "conditional",
    owner: "tenant",
    legalBasis: "保証委託契約による将来負担",
    agentClaim: "毎年保証料がかかります",
    reality: "初回保証料とは別に毎年発生。総額で見ると相当な負担になる",
    tooltip: "毎年いくらかかるか今確認できます",
    strategy: "warn",
    difficulty: 1,
    isFutureCost: true,
  },
];

export function getFeeGuide(feeId: string): FeeGuide | undefined {
  return FEE_GUIDE_LIST.find((g) => g.feeId === feeId);
}

export function resolveFeeId(rawLabel: string): string | null {
  const exact = FEE_GUIDE_LIST.find(
    (g) => g.label === rawLabel || g.aliases.includes(rawLabel)
  );
  if (exact) return exact.feeId;

  const partial = FEE_GUIDE_LIST.find(
    (g) =>
      g.label.includes(rawLabel) ||
      rawLabel.includes(g.label) ||
      g.aliases.some((a) => a.includes(rawLabel) || rawLabel.includes(a))
  );
  return partial?.feeId ?? null;
}

export function getFutureCostGuides(): FeeGuide[] {
  return FEE_GUIDE_LIST.filter((g) => g.isFutureCost === true);
}
