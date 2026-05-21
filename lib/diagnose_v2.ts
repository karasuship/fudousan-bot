import type {
  DiagnosisInput2,
  DiagnosisResult2,
  FeeEntry,
  Issue2,
  IssueStrategy,
  TimelineEntry,
  AgentResponse,
  FeeId2,
} from "./types_v2";
import { FEE_LABEL } from "./types_v2";

// ─── タイムライン論点 ─────────────────────────────────────────────────────────

export function detectTimelineIssues(timeline: TimelineEntry[]): Issue2[] {
  const issues: Issue2[] = [];

  const payment = timeline.find((e) => e.event === "fee_payment");
  const juusetsu = timeline.find((e) => e.event === "juusetsu");
  const sign = timeline.find((e) => e.event === "contract_sign");

  if (payment && juusetsu && payment.date && juusetsu.date) {
    if (payment.date < juusetsu.date) {
      issues.push({
        id: "payment_before_juusetsu",
        feeId: null,
        axis: "A",
        layer: "timeline",
        severity: "high",
        label: "費用支払いが重要事項説明より前",
        axisAText:
          "重要事項説明の前に費用を受領することは、借主が内容を理解する前に契約を既成事実化するものであり、説明義務の趣旨に反します。",
        axisBText:
          "宅建業法35条は重要事項説明を契約締結「前」に行うことを求めており、費用の受領はその後であることが求められます。",
        strategy: "record",
        yesNoQuestion: "費用の支払いは重要事項説明を受ける前でしたか？",
        evidenceRequest: "重要事項説明書の交付日と費用の領収書を提示してください。",
        explanationRequest: "重要事項説明より前に費用を受け取った理由を書面でご説明ください。",
      });
    }
  }

  if (payment && sign && payment.date && sign.date) {
    if (payment.date < sign.date) {
      issues.push({
        id: "payment_before_sign",
        feeId: null,
        axis: "A",
        layer: "timeline",
        severity: "high",
        label: "費用支払いが契約署名より前",
        axisAText:
          "契約署名前に費用を受領することは、借主が費用内容を確認・交渉する機会を奪います。",
        axisBText: null,
        strategy: "record",
        yesNoQuestion: "費用の支払いは契約書への署名より前でしたか？",
        evidenceRequest: "契約書の署名日と費用の領収書を提示してください。",
        explanationRequest: "署名前に費用を受け取った理由を書面でご説明ください。",
      });
    }
  }

  return issues;
}

// ─── 費目別論点 ───────────────────────────────────────────────────────────────

export function detectFeeIssues(fees: FeeEntry[]): Issue2[] {
  const issues: Issue2[] = [];

  for (const fee of fees) {
    const label = FEE_LABEL[fee.feeId];

    // 3層チェック共通論点
    if (fee.threeLayer.voluntaryExplained === "no") {
      issues.push({
        id: `${fee.feeId}_voluntary`,
        feeId: fee.feeId,
        axis: "A",
        layer: "voluntary",
        severity: "high",
        label: `${label}：任意・必須の説明なし`,
        axisAText: `${label}について、任意か必須かの説明がありませんでした。借主が判断できる前提条件が欠けています。`,
        axisBText: null,
        strategy: "confirm",
        yesNoQuestion: `${label}は任意での契約ですか？断ることはできましたか？`,
        evidenceRequest: null,
        explanationRequest: `${label}が任意か必須かを書面でご説明ください。`,
      });
    }

    if (fee.threeLayer.ownerOrAgentExplained === "no") {
      issues.push({
        id: `${fee.feeId}_source`,
        feeId: fee.feeId,
        axis: "A",
        layer: "source",
        severity: "medium",
        label: `${label}：オーナー条件か業者サービスか不明`,
        axisAText: `${label}がオーナーの条件なのか仲介業者のサービスなのかが説明されていません。`,
        axisBText: null,
        strategy: "confirm",
        yesNoQuestion: `${label}はオーナーが条件として求めているものですか？`,
        evidenceRequest: null,
        explanationRequest: `${label}がオーナーの条件か業者のサービスかを書面でご説明ください。`,
      });
    }

    if (fee.threeLayer.evidenceProvided === "no") {
      issues.push({
        id: `${fee.feeId}_evidence`,
        feeId: fee.feeId,
        axis: "A",
        layer: "evidence",
        severity: "medium",
        label: `${label}：根拠・資料の提示なし`,
        axisAText: `${label}の金額根拠や実施証明となる資料が提示されていません。`,
        axisBText: null,
        strategy: "confirm",
        yesNoQuestion: null,
        evidenceRequest: `${label}の算定根拠と実施を証明する資料を提示してください。`,
        explanationRequest: null,
      });
    }

    // 費目固有の論点
    if (fee.feeId === "agency_fee" && fee.detail) {
      const d = fee.detail as import("./types_v2").AgencyFeeDetail;
      if (d.amountMonths === "over") {
        issues.push({
          id: "agency_fee_over_one_month",
          feeId: "agency_fee",
          axis: "B",
          layer: "evidence",
          severity: "high",
          label: "仲介手数料：賃料1ヶ月超",
          axisAText: "仲介手数料が賃料の1ヶ月分を超えています。借主の書面承諾があっても上限は1ヶ月分です。",
          axisBText:
            "宅建業法46条により、仲介手数料の上限は賃料の1ヶ月分（消費税別）です。",
          strategy: "delete",
          yesNoQuestion: "仲介手数料が賃料の1ヶ月分を超えることについて、書面で承諾を求められましたか？",
          evidenceRequest: "仲介手数料の算定根拠を書面で提示してください。",
          explanationRequest: "仲介手数料が1ヶ月分を超える根拠をご説明ください。",
        });
      } else if (d.amountMonths === "one" && d.principleExplained === "no") {
        issues.push({
          id: "agency_fee_principle_not_explained",
          feeId: "agency_fee",
          axis: "A",
          layer: "voluntary",
          severity: "high",
          label: "仲介手数料：0.5ヶ月原則の説明なし",
          axisAText:
            "仲介手数料を1ヶ月分とする場合、原則が0.5ヶ月分であることと借主の承諾を得ることが必要ですが、その説明がありませんでした。",
          axisBText:
            "宅建業法46条の解釈上、借主からの受領が0.5ヶ月超の場合には借主の承諾が必要です。",
          strategy: "free_rent",
          yesNoQuestion:
            "仲介手数料の原則が0.5ヶ月分であるとの説明を受けましたか？",
          evidenceRequest: null,
          explanationRequest:
            "仲介手数料を1ヶ月分とする根拠と借主承諾の経緯を書面でご説明ください。",
        });
      }

      if (d.amountMonths === "one" && d.writtenConsentRequested === "no") {
        issues.push({
          id: "agency_fee_no_written_consent",
          feeId: "agency_fee",
          axis: "A",
          layer: "voluntary",
          severity: "high",
          label: "仲介手数料：書面承諾なしで1ヶ月分請求",
          axisAText:
            "仲介手数料を1ヶ月分とするには借主の書面承諾が必要ですが、承諾を求められていません。",
          axisBText:
            "宅建業法46条の解釈上、借主からの受領が0.5ヶ月超となる場合には借主の書面による承諾が必要です。",
          strategy: "free_rent",
          yesNoQuestion: "仲介手数料を1ヶ月分とすることについて、書面での承諾を求められましたか？",
          evidenceRequest: null,
          explanationRequest:
            "仲介手数料を1ヶ月分とする書面承諾の経緯を書面でご説明ください。",
        });
      }
      if (d.isRenewal && d.newBrokerageActExists === "no") {
        issues.push({
          id: "agency_fee_renewal_no_new_brokerage",
          feeId: "agency_fee",
          axis: "B",
          layer: "evidence",
          severity: "high",
          label: "仲介手数料：再契約で新たな仲介行為なし",
          axisAText:
            "再契約において新たな仲介行為が存在しない場合、仲介手数料の請求根拠が不明確です。",
          axisBText: null,
          strategy: "admin_check",
          yesNoQuestion: "今回の契約で、新たな物件紹介や交渉等の仲介行為はありましたか？",
          evidenceRequest: "今回の仲介行為の内容を書面で提示してください。",
          explanationRequest: null,
        });
      }
    }

    if (fee.feeId === "disinfection" || fee.feeId === "support_24h" || fee.feeId === "admin_fee") {
      if (fee.detail) {
        const d = fee.detail as import("./types_v2").OptionalServiceDetail;
        if (d.deniedIfRefused === "yes") {
          issues.push({
            id: `${fee.feeId}_bundled`,
            feeId: fee.feeId,
            axis: "A",
            layer: "voluntary",
            severity: "high",
            label: `${label}：断ると契約できないと告知`,
            axisAText: `${label}は任意サービスですが、断ると契約できないと告知されています。これは実質的な強制であり、説明義務に反します。`,
            axisBText: null,
            strategy: "delete",
            yesNoQuestion: `${label}を断れば契約できないと言われましたか？`,
            evidenceRequest: null,
            explanationRequest: `${label}が契約の必須条件である根拠を書面でご説明ください。`,
          });
        } else if (d.deniedIfRefused === "nuance") {
          issues.push({
            id: `${fee.feeId}_nuance`,
            feeId: fee.feeId,
            axis: "A",
            layer: "voluntary",
            severity: "medium",
            label: `${label}：断りにくい雰囲気があった`,
            axisAText: "断ることへの心理的障壁を作ることは、借主の選択機会を実質的に奪っている可能性があります",
            axisBText: null,
            strategy: "delete",
            yesNoQuestion: `${label}を断りにくい雰囲気を作られましたか？`,
            evidenceRequest: null,
            explanationRequest: `${label}は任意サービスであることを確認してください。`,
          });
        }
      }
    }

    if (fee.feeId === "cleaning" && fee.detail) {
      const d = fee.detail as import("./types_v2").CleaningDetail;
      if (d.timingExplained === "no") {
        issues.push({
          id: "cleaning_timing_not_explained",
          feeId: "cleaning",
          axis: "A",
          layer: "voluntary",
          severity: "medium",
          label: "クリーニング費：入退去時の区別の説明なし",
          axisAText:
            "入居前クリーニングか退去時クリーニングかの説明がなく、借主が費用の性質を判断できません。",
          axisBText: null,
          strategy: "free_rent",
          yesNoQuestion: "クリーニング費は入居前のものですか、退去時のものですか？",
          evidenceRequest: null,
          explanationRequest: "クリーニングのタイミング（入居前・退去時）と内容を書面でご説明ください。",
        });
      }
    }

    if (fee.feeId === "key_exchange" && fee.detail) {
      const d = fee.detail as import("./types_v2").KeyExchangeDetail;
      if (d.receivedDate && d.executedDate && d.receivedDate < d.executedDate) {
        issues.push({
          id: "key_exchange_payment_before_execution",
          feeId: "key_exchange",
          axis: "A",
          layer: "timeline",
          severity: "high",
          label: "鍵交換代：実施前に支払い",
          axisAText:
            "鍵交換の実施より前に費用を受領しています。実施前の受領は費用の正当性を確認する機会を奪います。",
          axisBText: null,
          strategy: "confirm",
          yesNoQuestion: "鍵交換代の支払いは、鍵交換の実施より前でしたか？",
          evidenceRequest: "費用の領収書と鍵交換実施日を確認できる書類を提示してください。",
          explanationRequest: null,
        });
      }
      if (d.requestedBeforeJuusetsu === "before") {
        issues.push({
          id: "key_exchange_before_juusetsu",
          feeId: "key_exchange",
          axis: "A",
          layer: "timeline",
          severity: "high",
          label: "鍵交換代：重説前に請求",
          axisAText:
            "鍵交換代が重要事項説明前に請求されています。内容確認前の費用請求は適切ではありません。",
          axisBText: null,
          strategy: "confirm",
          yesNoQuestion: "鍵交換代の請求は重要事項説明の前でしたか？",
          evidenceRequest: "重要事項説明書の交付日と鍵交換代の領収書を提示してください。",
          explanationRequest: null,
        });
      }
      if (d.hasEvidenceDocument === "no") {
        issues.push({
          id: "key_exchange_no_evidence",
          feeId: "key_exchange",
          axis: "A",
          layer: "evidence",
          severity: "high",
          label: "鍵交換代：実施証明なし",
          axisAText: "鍵交換の実施を証明する資料が提示されていません。",
          axisBText: null,
          strategy: "confirm",
          yesNoQuestion: null,
          evidenceRequest: "鍵交換の実施日と業者名、作業報告書を提示してください。",
          explanationRequest: null,
        });
      }
    }

    if (fee.feeId === "guarantor" && fee.detail) {
      const d = fee.detail as import("./types_v2").GuarantorDetail2;
      if (d.companyChoiceExplained === "no" || d.companyChoiceExplained === "unknown") {
        issues.push({
          id: "guarantor_no_company_choice",
          feeId: "guarantor",
          axis: "A",
          layer: "voluntary",
          severity: "medium",
          label: "保証会社：複数社選択の説明なし",
          axisAText: "複数の保証会社から選べることの説明がない場合、借主に選択機会が与えられていなかった可能性があります",
          axisBText: null,
          strategy: "free_rent",
          yesNoQuestion: "複数の保証会社から選べることを事前に説明しましたか？",
          evidenceRequest: null,
          explanationRequest: "利用できる保証会社の選択肢とその根拠を書面でご説明ください。",
        });
      }
      if (d.groupCompanyExplained === "unknown") {
        issues.push({
          id: "guarantor_group_company_unexplained",
          feeId: "guarantor",
          axis: "A",
          layer: "evidence",
          severity: "high",
          label: "保証会社：グループ会社の利益相反が未開示",
          axisAText:
            "保証会社と管理会社・仲介会社がグループ会社であることを説明せずに指定した場合、利益相反の未開示として宅建業者の誠実義務の観点から問題になり得ます",
          axisBText: null,
          strategy: "admin_check",
          yesNoQuestion:
            "保証会社と管理会社・仲介会社がグループ会社であることを事前に説明しましたか？ Yes / No",
          evidenceRequest: null,
          explanationRequest:
            "グループ会社関係の有無と、指定の根拠について書面でご説明ください",
        });
      }
    }

    if (fee.feeId === "fire_insurance" && fee.detail) {
      const d = fee.detail as import("./types_v2").FireInsuranceDetail;
      if (d.otherPlanChoiceExplained === "no" || d.otherPlanChoiceExplained === "unknown") {
        issues.push({
          id: "fire_insurance_no_other_plan",
          feeId: "fire_insurance",
          axis: "A",
          layer: "voluntary",
          severity: "medium",
          label: "火災保険：他社プラン選択の説明なし",
          axisAText: "他社の保険プランを選べることの説明がない場合、借主に選択機会が与えられていなかった可能性があります",
          axisBText: null,
          strategy: "free_rent",
          yesNoQuestion: "他社の火災保険プランを選べることを事前に説明しましたか？",
          evidenceRequest: null,
          explanationRequest: "指定プラン以外を選べない場合、その根拠を書面でご説明ください。",
        });
      }
      if (d.agentRelationshipExplained === "unknown") {
        issues.push({
          id: "fire_insurance_agent_unexplained",
          feeId: "fire_insurance",
          axis: "A",
          layer: "evidence",
          severity: "high",
          label: "火災保険：代理店関係の利益相反が未開示",
          axisAText:
            "保険会社と仲介会社・管理会社が代理店関係にあることを説明せずに指定した場合、利益相反の未開示として宅建業者の誠実義務の観点から問題になり得ます",
          axisBText: null,
          strategy: "admin_check",
          yesNoQuestion:
            "保険会社と仲介会社・管理会社が代理店関係にあることを事前に説明しましたか？ Yes / No",
          evidenceRequest: null,
          explanationRequest:
            "代理店関係の有無と、指定プランを勧めた根拠について書面でご説明ください",
        });
      }
    }

    if (fee.feeId === "special_clause" && fee.detail) {
      const d = fee.detail as import("./types_v2").SpecialClauseDetail;
      if (d.clauseReadAloud === "no" || d.disadvantageExplained === "no") {
        issues.push({
          id: "special_clause_not_explained",
          feeId: "special_clause",
          axis: "A",
          layer: "voluntary",
          severity: "high",
          label: "特約：不利内容の説明なし",
          axisAText:
            "特約の内容が読み上げられていないか、借主に不利な内容であることが説明されていません。",
          axisBText:
            "消費者契約法10条上、一方的に借主の権利を制限する特約は無効となる場合があります。",
          strategy: "confirm",
          yesNoQuestion: "特約の内容について、具体的に読み上げて説明を受けましたか？",
          evidenceRequest: null,
          explanationRequest: "特約の根拠と、借主への説明経緯を書面でご説明ください。",
        });
      }
    }

    if ((fee.feeId === "label_mismatch" || fee.feeId === "entity_mismatch" || fee.feeId === "unknown_label") && fee.detail) {
      const d = fee.detail as import("./types_v2").LabelMismatchDetail;
      if (d.mismatchExplained === "no" || d.mismatchExplained === "problem_none_only") {
        issues.push({
          id: `${fee.feeId}_not_explained`,
          feeId: fee.feeId,
          axis: "A",
          layer: "document_consistency",
          severity: "high",
          label: `${label}：不整合の説明なし`,
          axisAText: `${label}について書類や名称の不整合があるにもかかわらず、明確な説明がありません。`,
          axisBText: null,
          strategy: "admin_check",
          yesNoQuestion: `書類間の不整合について説明を受けましたか？`,
          evidenceRequest: "書類間の不整合に関する説明資料を提示してください。",
          explanationRequest: `${label}について、不整合の理由を書面でご説明ください。`,
        });
      }
    }
  }

  return issues;
}

// ─── 業者対応論点 ─────────────────────────────────────────────────────────────

export function detectAgentResponseIssues(agentResponse: AgentResponse | null): Issue2[] {
  if (!agentResponse || !agentResponse.contacted) return [];

  const issues: Issue2[] = [];

  if (agentResponse.responseTypes.includes("ignored")) {
    issues.push({
      id: "agent_ignored",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：確認を無視された",
      axisAText: "費用確認への連絡を無視されています。誠実な対応義務に反します。",
      axisBText: null,
      strategy: "admin_check",
      yesNoQuestion: "確認の連絡を複数回送りましたが返答がない状況ですか？",
      evidenceRequest: null,
      explanationRequest: "確認メールへの回答がない理由を教えてください。",
    });
  }

  if (agentResponse.responseTypes.includes("conclusion_only")) {
    issues.push({
      id: "agent_conclusion_only",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：「問題ない」と結論のみ",
      axisAText:
        "「問題ありません」という結論のみの回答は、根拠の説明義務を果たしていません。",
      axisBText: null,
      strategy: "confirm",
      yesNoQuestion: null,
      evidenceRequest: null,
      explanationRequest: "「問題ない」とする根拠を具体的に書面でご説明ください。",
    });
  }

  if (agentResponse.responseTypes.includes("dimension_switch")) {
    issues.push({
      id: "agent_dimension_switch",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：「違法ではない」と論点をすり替え",
      axisAText:
        "「違法ではない」という回答は、説明の十分性についての質問に答えていません。",
      axisBText: null,
      strategy: "admin_check",
      yesNoQuestion: null,
      evidenceRequest: null,
      explanationRequest:
        "違法性の有無ではなく、各費目の説明を受ける権利について回答してください。",
    });
  }

  if (agentResponse.responseTypes.includes("internal_rule")) {
    issues.push({
      id: "agent_internal_rule",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：「社内基準で開示不可」と回答",
      axisAText:
        "「社内基準で開示できない」という理由で費用根拠の開示を拒否することは、説明義務の観点から問題があります。",
      axisBText: null,
      strategy: "admin_check",
      yesNoQuestion: null,
      evidenceRequest: null,
      explanationRequest:
        "開示できない社内基準の根拠となる規定を示してください。",
    });
  }

  if (agentResponse.responseTypes.includes("no_reply_needed")) {
    issues.push({
      id: "agent_no_reply",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：「回答する必要はない」と拒否",
      axisAText:
        "費用の説明を求めることは借主の正当な権利であり、「回答不要」という対応は誠実義務に反します。",
      axisBText: null,
      strategy: "admin_check",
      yesNoQuestion: null,
      evidenceRequest: null,
      explanationRequest: "費用の根拠説明を拒否する理由を書面でご説明ください。",
    });
  }

  if (
    (agentResponse.monthsElapsed ?? 0) >= 1 &&
    agentResponse.unprovidedDocuments.length > 0
  ) {
    issues.push({
      id: "agent_long_term_no_document",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：1ヶ月以上経過しても資料未提出",
      axisAText:
        "確認を求めてから1ヶ月以上経過しているにもかかわらず、求めた資料が提出されていません。誠実対応義務の観点から深刻な問題です。",
      axisBText: null,
      strategy: "admin_check",
      yesNoQuestion: "資料の提示を求めてから1ヶ月以上が経過していますか？",
      evidenceRequest: null,
      explanationRequest: "求めた資料が1ヶ月以上提出されていない理由を書面でご説明ください。",
    });
  }

  if (agentResponse.responseTypes.includes("partial_discount")) {
    issues.push({
      id: "agent_partial_discount_warning",
      feeId: null,
      axis: "A",
      layer: "response",
      severity: "high",
      label: "業者：一部減額提案あり（他の問題は未解消）",
      axisAText:
        "一部費用の減額提案がありますが、これは他の費目の説明義務・書類整合性などの問題を解消するものではありません。",
      axisBText: null,
      strategy: "record",
      yesNoQuestion: "減額提案は、費用の根拠説明を行った上でのものでしたか？",
      evidenceRequest: null,
      explanationRequest:
        "減額の根拠と、他の費目の問題への対応方針を書面でご説明ください。",
    });
  }

  if (agentResponse.unprovidedDocuments.length > 0) {
    issues.push({
      id: "agent_unprovided_documents",
      feeId: null,
      axis: "A",
      layer: "evidence",
      severity: "medium",
      label: "業者：求めた資料が未提出",
      axisAText:
        "提示を求めた資料が提出されていません。費用の根拠説明が不完全な状態です。",
      axisBText: null,
      strategy: "record",
      yesNoQuestion: null,
      evidenceRequest: agentResponse.unprovidedDocuments
        .map((d) => {
          const labels: Record<string, string> = {
            calculation_basis: "費用の算定根拠",
            work_evidence: "作業実施の証明資料",
            label_change_reason: "費用名目の変遷理由",
            doc_inconsistency: "書類間の不整合の理由",
            entity_explanation: "受領・領収書発行者の説明",
            juusetsu_timing: "重説と費用受領の前後関係",
          };
          return labels[d] ?? d;
        })
        .join("、") + "を提示してください。",
      explanationRequest: null,
    });
  }

  return issues;
}

// ─── 費目別推奨戦略 ───────────────────────────────────────────────────────────

export function buildFeeStrategies(
  fees: FeeEntry[],
  issues: Issue2[]
): DiagnosisResult2["feeStrategies"] {
  return fees.map((fee) => {
    const feeIssues = issues.filter((i) => i.feeId === fee.feeId);
    const topIssue = feeIssues.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    })[0];

    const strategy: IssueStrategy = topIssue?.strategy ?? "confirm";
    const label = FEE_LABEL[fee.feeId];

    const reasonMap: Record<IssueStrategy, string> = {
      delete: `${label}には削除を求めるべき根拠があります。`,
      free_rent: `${label}をフリーレント転換として交渉する余地があります。`,
      admin_check: `${label}については行政・消費者センターへの相談を検討してください。`,
      record: `${label}に関する記録を保全・固定してください。`,
      confirm: `${label}の根拠・条件について書面で確認を求めてください。`,
    };

    return {
      feeId: fee.feeId,
      label,
      strategy,
      reason: reasonMap[strategy],
    };
  });
}

// ─── メール構造生成 ────────────────────────────────────────────────────────────

export function buildEmailStructure(
  issues: Issue2[]
): DiagnosisResult2["emailStructure"] {
  const yesNoQuestions = [
    ...new Set(issues.map((i) => i.yesNoQuestion).filter(Boolean) as string[]),
  ].slice(0, 8);

  const evidenceRequests = [
    ...new Set(issues.map((i) => i.evidenceRequest).filter(Boolean) as string[]),
  ].slice(0, 8);

  const explanationRequests = [
    ...new Set(
      issues.map((i) => i.explanationRequest).filter(Boolean) as string[]
    ),
  ].slice(0, 8);

  return { yesNoQuestions, evidenceRequests, explanationRequests };
}

// ─── メイン診断関数 ───────────────────────────────────────────────────────────

export function diagnoseV2(input: DiagnosisInput2): DiagnosisResult2 {
  const timelineIssues = detectTimelineIssues(input.timeline);
  const feeIssues = detectFeeIssues(input.fees);
  const agentIssues = detectAgentResponseIssues(input.agentResponse);

  const allIssues = [...feeIssues, ...timelineIssues, ...agentIssues].sort(
    (a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    }
  );

  const feeStrategies = buildFeeStrategies(input.fees, allIssues);
  const emailStructure = buildEmailStructure(allIssues);

  const compoundCount = allIssues.filter((i) => i.severity === "high").length;

  const hasDiscount =
    input.agentResponse?.responseTypes.includes("partial_discount") ?? false;
  const discountWarning = hasDiscount
    ? "業者から一部費用の減額提案があっても、仲介手数料の原則説明・重説と費用受領の前後関係・名目変遷・書類間の不整合などの問題は別問題として残ります。減額で全体を終わりにしないでください。"
    : null;

  const freeRentFees = feeStrategies.filter((s) => s.strategy === "free_rent");
  const freeRentEstimate =
    freeRentFees.length > 0
      ? input.fees
          .filter((f) => freeRentFees.some((s) => s.feeId === f.feeId))
          .reduce((sum, f) => sum + (f.amount ?? 0), 0) || null
      : null;

  return {
    timing: input.timing,
    stage: input.stage,
    issues: allIssues,
    feeStrategies,
    compoundCount,
    discountWarning,
    freeRentEstimate,
    emailStructure,
  };
}
