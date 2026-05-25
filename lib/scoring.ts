import {
  Phase1Answers,
  Phase1Result,
  RiskScore,
  UserPhase,
  RecoveryMethod,
  FeeId,
} from './types';

const FEE_GROUP: Record<FeeId, 'main' | 'sub' | 'card'> = {
  cleaning: 'main',
  support24: 'main',
  key: 'main',
  adminFee: 'main',
  guarantee: 'sub',
  insurance: 'sub',
  brokerage: 'card',
  keyMoney: 'card',
  other: 'main',
};

function determinePhase(answers: Phase1Answers): UserPhase {
  if (!answers.hasSigned) return 'A';
  if (!answers.hasPaid) return 'B';
  return 'C';
}

function calcRiskScore(answers: Phase1Answers): RiskScore {
  let procedureRisk = 0;
  let explanationRisk = 0;
  let pressureRisk = 0;
  let recoveryScore = 0;

  if (answers.documentedIn === 'nowhere') procedureRisk += 2;
  if (answers.documentedIn === 'estimate_only') procedureRisk += 2;

  if (answers.voluntaryExplained === 'no') explanationRisk += 3;
  if (answers.voluntaryExplained === 'unclear') explanationRisk += 2;
  if (answers.documentedIn === 'nowhere') explanationRisk += 1;

  if (answers.deniedIfRefused === 'yes') pressureRisk += 3;
  if (answers.deniedIfRefused === 'unknown') pressureRisk += 1;

  if (!answers.hasPaid) recoveryScore += 3;
  else if (!answers.hasSigned) recoveryScore += 3;
  else recoveryScore += 1;

  const mainFees = answers.selectedFees.filter((f) => FEE_GROUP[f] === 'main');
  recoveryScore += Math.min(mainFees.length, 2);

  return {
    procedureRisk: Math.min(procedureRisk, 3),
    explanationRisk: Math.min(explanationRisk, 3),
    pressureRisk: Math.min(pressureRisk, 3),
    recoveryScore: Math.min(recoveryScore, 3),
  };
}

function extractStrongPoints(answers: Phase1Answers): FeeId[] {
  return answers.selectedFees.filter((f) => FEE_GROUP[f] === 'main');
}

function extractWeakPoints(answers: Phase1Answers): FeeId[] {
  return answers.selectedFees.filter((f) => FEE_GROUP[f] !== 'main');
}

function calcVerdict(score: RiskScore): 'strong' | 'moderate' | 'weak' {
  const total = score.explanationRisk + score.pressureRisk + score.procedureRisk;
  if (total >= 5) return 'strong';
  if (total >= 3) return 'moderate';
  return 'weak';
}

function calcRecoveryMethod(phase: UserPhase, score: RiskScore): RecoveryMethod {
  if (phase === 'A' || phase === 'B') return 'WITHHOLD';
  if (score.recoveryScore >= 2) return 'OFFSET';
  if (score.explanationRisk >= 3) return 'REFUND';
  return 'ESCALATE';
}

function calcNextAction(
  phase: UserPhase,
  verdict: 'strong' | 'moderate' | 'weak',
): string {
  if (verdict === 'weak') {
    return '契約書・重説を手元に用意して、費用の記載箇所を確認してください。記載がなければ論点が強くなります。';
  }
  if (phase === 'A' || phase === 'B') {
    return 'この費用について「任意であることの説明を受けていないため、根拠を書面で示してください」と伝えるだけで構いません。';
  }
  return 'この費用について「任意であることの説明を受けていなかったため、返金または翌月家賃との相殺でのご対応をお願いします」と伝えてください。';
}

export function diagnosePhase1(answers: Phase1Answers): Phase1Result {
  const userPhase = determinePhase(answers);
  const riskScore = calcRiskScore(answers);
  const strongPoints = extractStrongPoints(answers);
  const weakPoints = extractWeakPoints(answers);
  const verdict = calcVerdict(riskScore);
  const recoveryMethod = calcRecoveryMethod(userPhase, riskScore);
  const nextAction = calcNextAction(userPhase, verdict);

  return {
    userPhase,
    riskScore,
    strongPoints,
    weakPoints,
    verdict,
    recoveryMethod,
    estimatedAmount: 0,
    nextAction,
  };
}
