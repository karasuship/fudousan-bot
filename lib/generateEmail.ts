import { Phase1Result, Phase2Answers, FeeId } from './types';

export interface EmailSet {
  first: string;
  second: string;
  third: string;
}

const FEE_LABELS: Record<FeeId, string> = {
  cleaning: '消毒・消臭費',
  support24: '24時間サポート料',
  key: '鍵交換代',
  adminFee: '契約事務手数料',
  guarantee: '保証会社利用料',
  insurance: '火災保険料',
  brokerage: '仲介手数料',
  keyMoney: '礼金',
  other: 'その他費用',
};

function feeList(fees: FeeId[], amounts: Partial<Record<FeeId, number>>): string {
  return fees
    .map((f) => {
      const label = FEE_LABELS[f];
      const amt = amounts[f];
      return amt ? `${label}（${amt.toLocaleString()}円）` : label;
    })
    .join('、');
}

function totalAmount(fees: FeeId[], amounts: Partial<Record<FeeId, number>>): number {
  return fees.reduce((sum, f) => sum + (amounts[f] ?? 0), 0);
}

export function generateEmailSet(
  phase1: Phase1Result,
  phase2: Phase2Answers
): EmailSet {
  const fees = phase1.strongPoints;
  const feeStr = feeList(fees, phase2.feeAmounts);
  const total = totalAmount(fees, phase2.feeAmounts);
  const totalStr = total > 0 ? `（合計${total.toLocaleString()}円）` : '';
  const evidenceNote =
    phase2.hasEvidence === 'email_or_line'
      ? 'なお、これまでのやり取りはメール・LINEで記録しております。'
      : phase2.hasEvidence === 'recording'
      ? 'なお、これまでのやり取りについて記録を保持しております。'
      : '';

  // 1通目：確認・事実固定（断定しない）
  const first = `お世話になっております。

このたびご請求いただいております${feeStr}${totalStr}について、確認させてください。

契約手続きの中で、これらの費用が任意のオプションである旨の説明を受けた記憶がございません。費用の根拠・算出方法・任意性の有無について、書面でご説明いただけますでしょうか。

お手数をおかけしますが、ご確認のほどよろしくお願いいたします。`;

  // 2通目：相手の返し方別
  let second = '';
  switch (phase2.opponentResponse) {
    case 'nothing':
    case 'insisting':
      second = `ご連絡ありがとうございます。

改めて確認させてください。${feeStr}について、契約手続きの際に「任意であり、断ることができる」という説明は受けておりません。

「必須である」とのご説明であれば、その法的根拠および契約書・重要事項説明書における記載箇所をご提示いただけますでしょうか。${evidenceNote}

引き続きよろしくお願いいたします。`;
      break;
    case 'internal_rule':
      second = `ご連絡ありがとうございます。

「社内規定」とのことですが、貸主・借主間の費用負担は社内基準ではなく、借地借家法および宅建業法の定めに従います。内部基準は借主が費用を負担する根拠にはなりません。

改めて、費用負担の法的根拠をご提示いただけますでしょうか。${evidenceNote}

よろしくお願いいたします。`;
      break;
    case 'contract_based':
      second = `ご連絡ありがとうございます。

契約書への記載と、任意性の説明が行われたことは別の問題です。記載があっても、締結時に「断ることができる任意のサービスである」と説明を受けていなければ、合意の前提が整っていないと考えられます。

記載箇所と、当時の説明内容についてご確認いただけますでしょうか。${evidenceNote}

よろしくお願いいたします。`;
      break;
    case 'ignoring':
      second = `先日送付いたしましたご確認の件について、まだご回答をいただけておりません。

${feeStr}の根拠・任意性についての書面説明をお願いしております。引き続き回答がいただけない場合は、消費生活センターや宅地建物取引業の行政窓口への相談を検討いたします。${evidenceNote}

ご対応のほどよろしくお願いいたします。`;
      break;
    default:
      second = `ご連絡ありがとうございます。

改めてご確認をお願いいたします。${feeStr}について、任意性の説明がなかった点を事実として確認しております。根拠の書面提示をお願いいたします。${evidenceNote}`;
  }

  // 3通目：希望着地 or 外部相談示唆
  let third = '';
  switch (phase2.preferredSettlement) {
    case 'withhold':
      third = `これまでのやり取りを踏まえ、${feeStr}について、任意性の説明がなかったことが確認されていることから、当該費用のお支払いを見合わせることといたします。

ご理解のほどよろしくお願いいたします。ご不明点があればご連絡ください。`;
      break;
    case 'refund':
      third = `これまでのご対応を踏まえ、${feeStr}${totalStr}について、任意性の説明がなかった点を根拠として、返金対応をお願いしたいと考えております。

お振込先等のご案内をいただけますでしょうか。ご検討よろしくお願いいたします。

なお、本件についてご対応いただけない場合は、消費生活センターへの相談を検討いたします。`;
      break;
    case 'offset':
      third = `これまでのご対応を踏まえ、${feeStr}${totalStr}について、翌月の家賃との相殺でのご対応をご提案いたします。

ご検討のほどよろしくお願いいたします。ご対応いただけない場合は、外部窓口への相談を検討いたします。`;
      break;
    case 'free_rent':
      third = `これまでのご対応を踏まえ、${feeStr}${totalStr}について、フリーレント（賃料無料期間）でのご対応をご提案いたします。

ご検討のほどよろしくお願いいたします。ご対応いただけない場合は、消費生活センターへの相談を検討いたします。`;
      break;
    default:
      third = `これまでのご対応を踏まえ、${feeStr}について、適切な形でのご対応をお願いいたします。引き続きご回答いただけない場合は、外部窓口への相談を検討いたします。`;
  }

  return { first, second, third };
}
