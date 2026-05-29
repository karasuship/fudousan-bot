import Anthropic from "@anthropic-ai/sdk";
import type {
  DiagnosisResult2,
  FeeEntry,
  Issue2,
  AgencyFeeDetail,
  KeyExchangeDetail,
  CleaningDetail,
} from "@/lib/types_v2";
import { FEE_LABEL } from "@/lib/types_v2";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateEmailRequest {
  result: DiagnosisResult2;
  timing: string;
  stage: string;
  fees: FeeEntry[];
  emailTone?: "polite" | "firm" | "factual";
  preContractContext?: {
    monthlyRent: number;
    contractMonth: "busy" | "off" | "normal";
    applicationStatus: "before_apply" | "applied_waiting" | "approved";
    otherCompanyComparison: "yes" | "no" | "planning" | null;
    hasGuarantor?: "yes" | "no" | null;
  };
}

// ─── Step1：費目別固定テキスト ─────────────────────────────────────────────────

function getStep1Text(feeId: string): string {
  switch (feeId) {
    case "agency_fee":
      return "仲介手数料は宅建業法上、借主から受領できる上限は賃料の0.5ヶ月分が原則です。1ヶ月分とするには原則の説明と借主の書面承諾が必要とされています。";
    case "key_exchange":
      return "鍵交換は前入居者退去後に貸主が行うべき費用とされています。借主に負担いただく場合、その根拠の説明が必要です。なお実施を証明する資料は根拠の一部であり、資料が揃っても借主負担の理由の説明とは別問題です。";
    case "cleaning":
      return "クリーニング費は国土交通省のガイドライン上、本来貸主負担が原則です。借主に負担いただく場合、その根拠の説明が必要です。また前入居者の退去時清掃との関係についてもご説明いただければ幸いです。";
    case "disinfection":
      return "消毒・抗菌処理は任意サービスです。断っても入居を拒否することはできません。";
    case "support_24h":
      return "24時間サポートは任意サービスです。断っても入居を拒否することはできません。また加入予定の火災保険の付帯サービスと重複する可能性があります。";
    case "admin_fee":
      return "書類作成・事務手続きは宅建業者として法律上予定される基本的業務です。仲介手数料と別に請求できる業務内容についてご確認させてください。";
    case "guarantor":
      return "保証会社のご利用は理解しております。以下の点について確認させてください。";
    case "fire_insurance":
      return "火災保険への加入は理解しております。以下の点について確認させてください。";
    case "key_money":
      return "礼金は慣行であり法的義務ではありません。金額の根拠についてご確認させてください。";
    default:
      return "";
  }
}

// ─── Step2：issueテキスト展開（返答の罠込み） ─────────────────────────────────

function buildIssueText(issue: Issue2): string {
  const parts: string[] = [];

  if (issue.strategy === "delete") {
    parts.push(issue.axisAText);
    if (issue.explanationRequest) parts.push(issue.explanationRequest);
    parts.push("今回は削除をご検討いただけますでしょうか。");
    if (issue.id.endsWith("_bundled")) {
      parts.push(
        "・必須とする根拠をご説明いただけますでしょうか。\n" +
        "・オーナーの契約条件である場合は、その旨を書面でご確認いただければ幸いです。\n" +
        "・業者の規定である場合は、借主負担の根拠としては難しいと考えております。"
      );
    }
  } else if (issue.strategy === "free_rent") {
    parts.push(issue.axisAText);
    if (issue.explanationRequest) parts.push(issue.explanationRequest);
    if (issue.evidenceRequest) parts.push(issue.evidenceRequest);
    parts.push(
      "ご説明いただけた場合はこのまま進めたいと考えております。\n" +
      "ご対応が難しい場合は、同額分のフリーレントまたは礼金・他費用との総額調整という形でのご提案も歓迎いたします。"
    );
    if (issue.id === "agency_fee_principle_not_explained") {
      parts.push(
        "・『説明しました』とのご回答の場合は、その際の書面または記録をご提示ください。\n" +
        "・『承諾をいただいています』とのご回答の場合は、承諾の前に原則が0.5ヶ月分であるとの説明があったかどうかをご確認ください。\n" +
        "・貸主からも仲介手数料を受領されている場合は、合算額と上限との関係についてご説明ください。"
      );
    }
  } else if (issue.strategy === "admin_check") {
    parts.push(issue.axisAText);
    if (issue.yesNoQuestion) {
      parts.push(`${issue.yesNoQuestion}\nはい・いいえでご回答いただけますでしょうか。`);
    }
    if (issue.explanationRequest) parts.push(issue.explanationRequest);
  } else if (issue.strategy === "confirm") {
    parts.push(issue.axisAText);
    if (issue.evidenceRequest) parts.push(issue.evidenceRequest);
    if (issue.explanationRequest) parts.push(issue.explanationRequest);
    if (issue.id === "key_exchange_no_evidence") {
      parts.push(
        "・資料をご提示いただける場合は確認いたします。\n" +
        "・ご提示が難しい場合は、その理由をご説明ください。\n" +
        "・資料の有無にかかわらず、借主負担とする根拠についても別途ご説明いただければ幸いです。"
      );
    }
  }
  // record は展開しない

  return parts.join("\n");
}

// ─── Step3：detailによる補完 ──────────────────────────────────────────────────

function buildDetailSupplement(fee: FeeEntry): string {
  if (!fee.detail) return "";
  const parts: string[] = [];

  if (fee.feeId === "agency_fee") {
    const d = fee.detail as AgencyFeeDetail;
    if (d.isRenewal && d.newBrokerageActExists === "no") {
      parts.push("今回は同一物件・同一当事者での再契約であり、新たな仲介行為の実体についてもご確認いただければ幸いです。");
    }
    if (d.landlordFeeExplained === "no") {
      parts.push("貸主からの受領の有無についてもご確認いただけますでしょうか。");
    }
  }

  if (fee.feeId === "key_exchange") {
    const d = fee.detail as KeyExchangeDetail;
    if (d.receivedDate && d.executedDate && d.receivedDate < d.executedDate) {
      parts.push("費用の受領が実施より前となっている点についても確認させてください。");
    }
  }

  if (fee.feeId === "cleaning") {
    const d = fee.detail as CleaningDetail;
    if (d.amountBasisExplained === "no") {
      parts.push("金額の算定根拠についても内訳をご提示いただければ幸いです。");
    }
  }

  return parts.join("\n");
}

// ─── 費目ブロック生成 ─────────────────────────────────────────────────────────

function buildFeeBlock(
  fee: FeeEntry,
  issues: Issue2[],
  timing: string
): string {
  const label = FEE_LABEL[fee.feeId];
  const amountText =
    fee.amount != null && fee.amount > 0
      ? `（${fee.amount.toLocaleString("ja-JP")}円）`
      : "";

  const lines: string[] = [];
  lines.push(`【${label}】${amountText}`);
  lines.push("");

  const step1 = getStep1Text(fee.feeId);
  if (step1) {
    lines.push(step1);
    lines.push("");
  }

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const strategyOrder: Record<string, number> = {
    delete: 0, free_rent: 1, admin_check: 2, confirm: 3, record: 4,
  };
  const sortedIssues = [...issues].sort((a, b) => {
    const s = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    if (s !== 0) return s;
    return (strategyOrder[a.strategy] ?? 9) - (strategyOrder[b.strategy] ?? 9);
  });

  for (const issue of sortedIssues) {
    const text = buildIssueText(issue);
    if (text) {
      lines.push(text);
      lines.push("");
    }
  }

  const supplement = buildDetailSupplement(fee);
  if (supplement) {
    lines.push(supplement);
    lines.push("");
  }

  if (timing === "pre_contract") {
    const topStrategy = sortedIssues[0]?.strategy;
    if (topStrategy === "delete") {
      lines.push(
        "削除をご検討いただけますでしょうか。\n" +
        "難しい場合はフリーレントまたは他費用との総額調整でのご提案も可能でしょうか。"
      );
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

// ─── メール全体フレーム ───────────────────────────────────────────────────────

function buildEmailFrame(
  feeBlocks: string[],
  timing: string,
  _stage: string,
  _tone: string,
  totalAdjustAmount: number
): string {
  const adjustLine =
    totalAdjustAmount > 0
      ? `なお確認・調整の余地がある費用の合計は${totalAdjustAmount.toLocaleString("ja-JP")}円となっております。\n\n`
      : "";

  const feeContent = feeBlocks.join("\n\n");

  if (timing === "pre_contract") {
    return `件名：賃貸借契約に係る費用のご確認について

〇〇株式会社
ご担当者様

お世話になっております。
〇〇（物件名）〇〇号室への入居を検討しております〇〇と申します。

この度はご丁寧にご対応いただきありがとうございます。
契約に際して、いくつか確認させていただきたい点がございます。
お手数をおかけして恐縮ですが、ご確認いただけますと幸いです。

内容をご確認いただけた場合は、引き続き貴社でのご契約を前向きに検討しております。
また費用全体についても、ご相談できればありがたく思っております。

${adjustLine}${feeContent}

以上について、お忙しいところ恐れ入りますが、〇営業日以内にご回答いただけますと幸いです。
どうぞよろしくお願いいたします。

〇〇
物件名：〇〇
部屋番号：〇〇`;
  }

  return `件名：入居時費用についてのご確認

〇〇株式会社
ご担当者様

お世話になっております。
〇〇（物件名）〇〇号室に入居しております〇〇と申します。

入居の際にお支払いした費用について、確認させていただきたい点がございます。
お手数をおかけして申し訳ありませんが、ご確認いただけますと幸いです。

${adjustLine}${feeContent}

以上について、〇営業日以内に書面にてご回答いただけますと幸いです。
どうぞよろしくお願いいたします。

〇〇
物件名：〇〇
部屋番号：〇〇`;
}

// ─── 契約前専用メール生成 ──────────────────────────────────────────────────────

function buildPreContractEmail(
  fees: FeeEntry[],
  context: GenerateEmailRequest["preContractContext"]
): string {
  const feeIds = new Set(fees.map((f) => f.feeId));
  const blocks: string[] = [];

  if (feeIds.has("agency_fee")) {
    blocks.push(`【仲介手数料について】

ご請求は賃料1ヶ月分とのことですが、
宅地建物取引業法の原則は0.5ヶ月分と
伺っております。0.5ヶ月分にご調整いただく
ことは可能でしょうか。
あわせて貸主様からの広告料・手数料の
お受領状況もご教示ください。`);
  }

  if (feeIds.has("key_exchange")) {
    blocks.push(`【鍵交換代について】

本来、前入居者退去後に貸主様のご負担で
行われる費用と理解しております。
こちらのご対応について、貸主様にご相談いただく
ことは可能でしょうか。

あわせて、前入居者の退去日と、新品交換で
あることが確認できる資料についても
ご教示いただけますと幸いです。`);
  }

  if (feeIds.has("cleaning")) {
    blocks.push(`【クリーニング費について】

入居前清掃・退去時清掃のいずれの費用かを
ご教示ください。

入居前清掃の場合、本来貸主様のご負担と
されることが多く、こちらのご対応について
貸主様にご相談いただけますでしょうか。
退去時清掃の場合、敷金からの清算との
二重負担にならないかもご確認いただけますと
幸いです。`);
  }

  if (feeIds.has("disinfection")) {
    blocks.push(`【消毒・抗菌処理費について】

こちらは任意のサービスかと存じます。
今回はお断りすることは可能でしょうか。

契約上必須とのご判断である場合は、
それが貸主様のご意向か御社のご規定かを
ご教示ください。あわせて実施日・実施業者・
処理内容もご提示いただけますと幸いです。`);
  }

  if (feeIds.has("support_24h")) {
    blocks.push(`【24時間サポートについて】

こちらも任意のサービスかと存じます。
お断りすることは可能でしょうか。
火災保険の付帯サービスと内容が重複する
可能性もあり、不要かと考えております。

契約上必須とのご判断である場合は、
貸主様のご意向か御社のご規定か、
あわせてサービス内容・契約期間・運営会社を
ご教示いただけますと幸いです。`);
  }

  if (feeIds.has("admin_fee")) {
    blocks.push(`【書類作成費（事務手数料）について】

こちらは仲介業務における事務手続きへの
対価かと存じます。仲介手数料に含まれる
ものとして、削除いただくことは可能でしょうか。
別途のご請求とされる場合、その内容と
根拠をご教示いただけますと幸いです。`);
  }

  if (feeIds.has("guarantor")) {
    if (context?.hasGuarantor === "yes") {
      blocks.push(`【保証会社費用について】

連帯保証人を立てる予定がありますが、
それでも保証会社のご利用は必須でしょうか。
貸主様のご意向か御社のご規定によるものかを
ご教示ください。
ご利用可能な保証会社の選択肢と、
保証会社と管理会社・仲介会社のグループ関係の
有無もあわせてご教示ください。`);
    } else {
      blocks.push(`【保証会社費用について】

ご利用可能な保証会社の選択肢が
ございましたらご教示ください。
あわせて、保証会社と管理会社・仲介会社の
グループ関係の有無もご確認いただけますと
幸いです。`);
    }
  }

  if (feeIds.has("fire_insurance")) {
    blocks.push(`【火災保険料について】

火災保険は他社で加入予定です。
貸主様が求められる最低限の補償内容
（補償額・特約等）をご教示ください。`);
  }

  if (feeIds.has("key_money")) {
    const isComparing =
      context?.otherCompanyComparison === "yes" ||
      context?.otherCompanyComparison === "planning";
    if (isComparing) {
      blocks.push(`【礼金について】

慣行のご請求と理解しております。
現在、他社様からも同等条件のご案内を
受けている状況です。ご調整、または
フリーレント転換などで総額のご相談を
いただけますでしょうか。`);
    } else {
      blocks.push(`【礼金について】

慣行のご請求と理解しております。
ご調整、またはフリーレント転換などで
総額のご相談をいただけますでしょうか。`);
    }
  }

  const feeContent = blocks.join("\n\n");

  return `件名：初期費用のお見積もりについてのご確認

ご担当者様

お世話になっております。
先日はお見積もりをお送りいただき、
ありがとうございました。

物件は大変気に入っており、
ぜひ前向きに進めさせていただきたく存じます。

つきましては、お見積もりの内訳について
何点かご確認させていただきたい部分が
ございますので、ご教示いただけますと幸いです。

${feeContent}

ご回答にあたり、貸主様のご意向の
ご確認が必要な事項がございましたら、
ご確認のうえご返信いただけますと幸いです。

ご回答を確認のうえ、速やかに契約手続きに
進めさせていただきたく存じます。
ご検討のほど、何卒よろしくお願いいたします。

[お名前]`;
}

// ─── 契約前専用解説生成 ──────────────────────────────────────────────────────

function buildPreContractExplanation(
  fees: FeeEntry[],
  context: GenerateEmailRequest["preContractContext"]
): string {
  const parts: string[] = [];

  // 全体戦略
  const appStatus = context?.applicationStatus;
  if (appStatus === "before_apply") {
    parts.push("あなたは現在申込前の段階です。これは交渉において最も強いタイミングです。業者はあなたを他社に取られると、仲介手数料も貸主からの広告料も全て失います。");
  } else if (appStatus === "applied_waiting") {
    parts.push("申込済みの段階ですが、署名前であれば交渉の余地があります。業者にとっても契約を失うより、一部費用を調整して成約させる方が合理的です。");
  } else if (appStatus === "approved") {
    parts.push("契約直前の段階ですが、署名前であれば確認・交渉はまだ可能です。丁寧かつ具体的な確認が最も有効です。");
  }

  const comparison = context?.otherCompanyComparison;
  if (comparison === "yes" || comparison === "planning") {
    parts.push("他社からも同じ物件を取れる可能性があります。業者はこれを知ると、逃したくないという動機が生まれます。これが交渉の主なカードです。");
  }

  if (context?.contractMonth === "off") {
    parts.push("閑散期（4〜8月）は物件が動きにくく、業者は成約を優先します。削除交渉が通りやすい時期です。");
  }

  parts.push("");

  // 費目ごとの意図
  const feeIds = new Set(fees.map((f) => f.feeId));
  const feeExplanations: Partial<Record<string, string>> = {
    agency_fee:    "宅建業法の原則（0.5ヶ月）を外部根拠として使っています。貸主からの広告料受領を確認したのは、受領があれば借主負担をゼロにできる可能性があるためです。",
    key_exchange:  "本来貸主負担であることを示しつつ、貸主への相談を促しています。資料の提示を求めたのは、実施されていない可能性があるためです。業者が資料を出せなければ、次のメールで実態を追えます。",
    cleaning:      "入居前か退去時かを先に確認しています。答えによって次の手が変わります。退去時なら敷金との二重、入居前なら貸主負担の問題として追えます。",
    disinfection:  "任意サービスであることを前提に、断れるかを問う形にしました。必須と言う場合、貸主の意向か業者規定かを次のメールで確認できます。多くの場合、根拠を出せず取り下げになります。",
    support_24h:   "任意サービスです。火災保険との重複を示したことで、業者は内容の説明コストが生じます。必須と言う場合、サービスの実態を次のメールで深掘りできます。",
    admin_fee:     "仲介手数料に含まれるべき業務であることを示唆しています。業者が『別途』と言えば根拠を追えます。『含まれる』と言えば二重なので削除できます。",
    guarantor:     "保証会社の選択肢とグループ関係を確認しています。グループ会社なら利益相反の問題として次のメールで追えます。",
    fire_insurance:"火災保険は借主が自由に選べる権利があります。他社で入ると宣言し、必要な補償内容を聞き出すだけでシンプルです。回答を元に相場の安いプランを選べます。",
    key_money:     "法的義務のない慣行費用です。他社の存在を匂わせることで、業者が逃したくないというプレッシャーをかけています。フリーレント転換で総額調整に持ち込むことも有効です。",
  };

  for (const feeId of feeIds) {
    const explanation = feeExplanations[feeId];
    if (explanation) {
      const label = FEE_LABEL[feeId] ?? feeId;
      parts.push(`【${label}】\n${explanation}`);
    }
  }

  parts.push("");
  parts.push("このメールは『払わない』と言っていません。『根拠を確認してから決める』という誠実な借主の立場を取っています。根拠のない費用は取り下げる方が、業者にとっても合理的な選択です。最終的な契約承認はオーナーにあります。業者の独断で断られた場合も、『貸主様に確認いただけますか』と問うことができます。");

  return parts.join("\n");
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateEmailRequest;
    const { result, timing, stage, fees, emailTone = "polite", preContractContext } = body;

    // ─── 契約前専用ロジック ─────────────────────────────────────────────────────
    if (timing === "pre_contract") {
      const frame = buildPreContractEmail(fees, preContractContext);
      const explanation = buildPreContractExplanation(fees, preContractContext);

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `あなたは日本語の文章整形の専門家です。
与えられたメールの骨格を、不動産業者への確認メールとして自然な日本語に整形してください。

## 厳守事項
- 論点の内容・意味を変えない
- 新しい内容を追加しない
- 違法・無効・返金確定などの断定をしない
- Markdown記号を使わない
- プレーンテキストのみ
- 担当者への敬意を示しながら確認事項を伝える文体
- 責めるのではなく一緒に解決したいという姿勢
- 入居後の関係が悪くならないよう担当者の善意を引き出す文体
- 初めて連絡する担当者への文体（『いつもお世話になっております』ではなく『先日はお見積もりをいただきありがとうございました』等の書き出し）
- トーン：丁寧・協力的`,
        messages: [{ role: "user", content: frame }],
      });

      const content = response.content[0];
      const draftEmail = content.type === "text" ? content.text : "";

      return Response.json({ draftEmail, explanation });
    }

    // ─── 既存の契約後ロジック ───────────────────────────────────────────────────

    const feeBlocks = fees
      .map((fee) => {
        const feeIssues = result.issues.filter((i) => i.feeId === fee.feeId);
        return buildFeeBlock(fee, feeIssues, timing);
      })
      .filter(Boolean);

    const totalAdjustAmount = result.feeStrategies
      .filter((s) => s.strategy === "delete" || s.strategy === "free_rent")
      .reduce((sum, s) => {
        const fee = fees.find((f) => f.feeId === s.feeId);
        return sum + (fee?.amount ?? 0);
      }, 0);

    const frame = buildEmailFrame(feeBlocks, timing, stage, emailTone, totalAdjustAmount);

    const toneDescription =
      emailTone === "firm"
        ? "明確・毅然"
        : emailTone === "factual"
        ? "事実ベース・簡潔"
        : "丁寧・協力的";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `あなたは日本語の文章整形の専門家です。
与えられたメールの骨格を、不動産業者への確認メールとして自然な日本語に整形してください。

## 厳守事項
- 論点の内容・意味を変えない
- 新しい内容を追加しない
- 違法・無効・返金確定などの断定をしない
- Markdown記号を使わない
- プレーンテキストのみ
- 担当者への敬意を示しながら確認事項を伝える文体
- 責めるのではなく一緒に解決したいという姿勢
- 入居後の関係が悪くならないよう担当者の善意を引き出す文体
- トーン：${toneDescription}
  polite：丁寧・協力的
  firm：明確・毅然
  factual：事実ベース・簡潔`,
      messages: [{ role: "user", content: frame }],
    });

    const content = response.content[0];
    const draftEmail = content.type === "text" ? content.text : "";

    return Response.json({ draftEmail, explanation: null });
  } catch {
    return Response.json({ error: "メール生成に失敗しました" }, { status: 500 });
  }
}
