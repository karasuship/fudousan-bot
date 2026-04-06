"use client";

type Region = "metro" | "local";
type Season = "peak" | "off";
type Building = "new" | "young" | "old";

interface Props {
  rent: number;
  region: Region;
  season: Season;
  building: Building;
  showDeposit?: boolean;
}

interface FeeRow {
  label: string;
  industryMin: number;
  industryMax: number;
  // 適正残額（費目ごとに「残ってもおかしくない金額」= 適正水準への寄与分）
  guidelineResidual: number;
  // 適正残額の根拠（コード上の説明）
  residualBasis: string;
  note: string;
  // true = 基本的に削減対象ではない必要費用（日割り賃料など）
  isFixedCost?: boolean;
}

function calcFees(rent: number, region: Region, season: Season, building: Building): FeeRow[] {
  // 交渉補正係数（礼金・仲介手数料にのみ適用）
  const negotiationFactor =
    region === "metro" && season === "peak" ? 1.0 :
    region === "metro" && season === "off" ? 0.85 :
    region === "local" && season === "peak" ? 0.8 :
    0.7;

  const R = rent;

  return [
    {
      label: "仲介手数料",
      industryMin: Math.round(R * 0.55 * negotiationFactor),
      industryMax: Math.round(R * 1.1 * negotiationFactor),
      // 借主負担の上限は0.5ヶ月分（+消費税）
      guidelineResidual: Math.round(R * 0.55),
      residualBasis: "借主負担の上限は0.5ヶ月分（宅建業法）",
      note: "書面による承諾なければあなた（借主）からの上限は0.5ヶ月分。不動産屋は大家さん（貸主）からも手数料を受け取れるため、あなたから1ヶ月分もらわなくても収入は成立する。閑散期・交渉次第でさらに下がる余地あり。",
    },
    {
      label: "礼金",
      industryMin: 0,
      // 礼金は1ヶ月が典型的な上限として使用（2ヶ月は高騰時の特例扱い）
      industryMax: Math.round(R * 1 * negotiationFactor),
      // 法的根拠なし・交渉対象・適正残額は0
      guidelineResidual: 0,
      residualBasis: "法的根拠なし・返還されない慣習的費用。削除または代替交渉の対象",
      note: "大家さん（貸主）へのお礼として慣習的に存在するが法的根拠はなく返還されない。空き期間が長い物件・閑散期・築古物件は交渉が通りやすい。礼金を払う代わりにフリーレント（最初の1〜2ヶ月家賃無料）に切り替える交渉も有効。",
    },
    {
      label: "鍵交換代",
      industryMin: 15000,
      industryMax: 25000,
      // 大家負担が原則のため適正残額は0
      guidelineResidual: 0,
      residualBasis: "次の入居者のための管理業務。大家負担が原則",
      note: building === "new" ? "新築のため交換の必要性自体を確認すべき" : building === "young" ? "築浅物件のため前回交換が最近の可能性あり。実際の交換時期と費用負担根拠の確認が重要。" : "鍵交換は大家さん（貸主）が次の入居者のために行う管理業務。費用も大家さん負担が原則で、あなた（借主）が払う理由は本来ない。実際に交換されたか（業者名・実施日・シリンダー交換・鍵の本数）の確認も必要。",
    },
    {
      label: "入居前清掃",
      industryMin: 15000,
      industryMax: 30000,
      // 入居前の話は大家負担が原則のため適正残額は0
      guidelineResidual: 0,
      residualBasis: "前の入居者退去後の清掃は大家負担が原則",
      note: "前の住人が退去した後の清掃は大家さん（貸主）の負担が原則。あなた（借主）が入居する前の話なので払う理由がない。退去時清掃の前払いとして請求される場合、退去時にさらに請求されると二重払いになる。",
    },
    {
      label: "消毒・除菌",
      industryMin: 0,
      industryMax: 20000,
      // 任意サービスのため適正残額は0
      guidelineResidual: 0,
      residualBasis: "任意サービス・断っても契約できる",
      note: "任意のサービス。「必須」「全員やっています」は事実ではなく断っても契約できる。市販のスプレーやバルサンと大差ない作業が1〜2万円で請求されるケースが多い。",
    },
    {
      label: "24時間サポート",
      industryMin: 0,
      industryMax: 20000,
      // 任意加入のため適正残額は0
      guidelineResidual: 0,
      residualBasis: "任意加入・断っても契約できる",
      note: "任意のサービス。すでに加入している火災保険と補償内容が重複する場合がある。月額・年額で継続的に費用が発生するケースもあり、入居時に説明されないことが多い。",
    },
    {
      label: "火災保険",
      industryMin: 15000,
      industryMax: 20000,
      // 加入自体は必要だが自己選択で安くできる。一般的な自選目安10000円
      guidelineResidual: 10000,
      residualBasis: "加入は必要だが自己選択で安くなる。自選目安1万円程度",
      note: "加入自体は契約条件になる場合が多いが、不動産屋が指定する保険に入る義務はない。自分で同等の保険を選べば年間数千円〜1万円以上安くなる場合がある。",
    },
    {
      label: "保証料（本体）",
      industryMin: Math.round(R * 0.3),
      industryMax: Math.round(R * 0.6),
      // 連帯保証人なし時の相場（賃料50%）を適正残額とする
      guidelineResidual: Math.round(R * 0.5),
      residualBasis: "家賃未払いリスクに対する保証。契約条件として必要な場合が多い",
      note: "大家さん（貸主）のために家賃未払いリスクに備える会社。本来は大家さん側のコスト。連帯保証人がいる場合は賃料の30%前後、いない場合は50%前後が相場目安。この範囲内であれば適正水準内。",
    },
    {
      label: "保証会社委託手数料",
      industryMin: 0,
      industryMax: Math.round(R * 0.2),
      // 不動産会社経由の上乗せ費用。直接契約で回避可能なため適正残額は0
      guidelineResidual: 0,
      residualBasis: "不動産会社経由で発生する上乗せ費用。直接契約で回避可能な場合あり",
      note: "不動産屋が保証会社の手続きを代行する際の上乗せ費用。直接保証会社に申し込める場合は不要。仲介手数料に含まれる性質の費用として確認を求めることができる。",
    },
    {
      label: "書類作成費・事務手数料",
      industryMin: 0,
      industryMax: Math.round(R * 0.2),
      // 仲介手数料に含まれる業務のため適正残額は0
      guidelineResidual: 0,
      residualBasis: "仲介手数料に含まれる業務。別途請求の根拠確認が必要",
      note: "書類作成・事務手続きは仲介手数料に含まれる業務。別途請求する場合は何のための費用か具体的な説明が必要。仲介手数料と合計して家賃の1.1ヶ月分を超えていないか確認すること。",
    },
    {
      label: "日割り賃料",
      // 入居日から月末までの実費。月末入居なら0、月初入居なら1ヶ月分に近い
      industryMin: 0,
      industryMax: R,
      // 基本的に削減対象ではない（industryMax と同額 → gap への寄与は0）
      guidelineResidual: R,
      residualBasis: "入居日から月末までの実費。基本的に削減対象ではない",
      note: "入居月の家賃（入居日から月末までの日割り計算）。月の何日に入居するかで変わる。月初入居なら1ヶ月分に近い金額になる。これは正当な費用で削減対象にはならない。",
      isFixedCost: true,
    },
  ];
}

function fmt(n: number): string {
  return n.toLocaleString("ja-JP") + "円";
}

function fmtRange(min: number, max: number): string {
  if (min === 0 && max === 0) return "0円（本来不要）";
  if (min === max) return fmt(min);
  return `${fmt(min)}〜${fmt(max)}`;
}

export default function FeeEstimate({ rent, region, season, building }: Props) {
  const fees = calcFees(rent, region, season, building);
  const industryTotal = fees.reduce((s, f) => s + f.industryMax, 0);
  const guidelineTotal = fees.reduce((s, f) => s + f.guidelineResidual, 0);
  const gap = industryTotal - guidelineTotal;

  return (
    <div className="space-y-4">
      {/* 総額比較 */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500">実際に消える金額の目安（敷金除く）</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>業界相場（上限）</span>
              <span className="font-semibold">{fmt(industryTotal)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-2 bg-amber-400 rounded-full w-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>適正水準（目安）</span>
              <span className="font-semibold text-blue-700">{fmt(guidelineTotal)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${Math.round((guidelineTotal / industryTotal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          交渉・確認によって最大 <span className="text-red-600 font-semibold">{fmt(gap)}</span> 削減できる可能性があります
        </p>
      </div>

      {/* 科目別内訳 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500">科目別内訳</p>
        {fees.map((row) => (
          <div
            key={row.label}
            className={`border rounded-lg px-3 py-2.5 ${
              row.isFixedCost
                ? "bg-slate-50 border-slate-200"
                : "bg-white border-slate-100"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-medium text-slate-800">{row.label}</span>
                {row.isFixedCost && (
                  <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full leading-none">
                    削減対象外
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-700">{fmtRange(row.industryMin, row.industryMax)}</div>
                <div className="text-xs text-blue-700">
                  {row.isFixedCost
                    ? `${fmt(row.guidelineResidual)}（実費）`
                    : row.guidelineResidual === 0
                    ? "0円（本来不要）"
                    : fmt(row.guidelineResidual)}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">{row.note}</p>
          </div>
        ))}
        <div className="flex gap-4 text-xs text-slate-400 px-1">
          <span><span className="text-amber-500">■</span> 業界相場</span>
          <span><span className="text-blue-500">■</span> 適正水準</span>
        </div>
      </div>

      {/* 敷金は別枠 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-slate-600">敷金（別枠）</p>
        <p className="text-xs text-slate-700 leading-relaxed">
          敷金は退去時に返還される預け金です。損失ではありませんが以下に注意してください。
        </p>
        <ul className="text-xs text-slate-600 space-y-1 mt-1">
          <li>・敷金ゼロの物件は退去時の修繕費が全額請求されるリスクがあります</li>
          <li>・清掃代を入居時に前払いさせる物件は、退去時にさらに請求されると二重払いになります</li>
          <li>・業界相場は家賃1〜2ヶ月分。本来は全額返還が原則です</li>
        </ul>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        ※ 適正水準は法的・行政的根拠に基づく目安です。交渉・確認によって近づけられる可能性があります。
      </p>
    </div>
  );
}
