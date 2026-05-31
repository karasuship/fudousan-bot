"use client";

import { useState } from "react";
import type { DiagnosisInput2, DiagnosisResult2, FeeEntry } from "@/lib/types_v2";
import FlowRoot from "./diagnosis/FlowRoot";
import DiagnosisResultV2 from "./DiagnosisResultV2";
import PreContractResult from "./PreContractResult";
import FeeExtractor from "./FeeExtractor";

export default function DiagnosisFormV2() {
  const [v2Input, setV2Input] = useState<DiagnosisInput2 | null>(null);
  const [v2Result, setV2Result] = useState<DiagnosisResult2 | null>(null);
  const [v2Loading, setV2Loading] = useState(false);
  const [v2Error, setV2Error] = useState<string | null>(null);
  const [extractedFees, setExtractedFees] = useState<FeeEntry[]>([]);
  const [flowKey, setFlowKey] = useState(0);

  function handleChange(input: DiagnosisInput2 | null) {
    setV2Input(input);
    setV2Result(null);
    setV2Error(null);
  }

  async function handleV2Submit() {
    if (!v2Input || v2Input.fees.length === 0) return;
    setV2Loading(true);
    setV2Error(null);
    try {
      const res = await fetch("/api/diagnose-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v2Input),
      });
      if (!res.ok) throw new Error("診断に失敗しました");
      const result: DiagnosisResult2 = await res.json();
      localStorage.setItem(
        "rental_diagnosis_v2",
        JSON.stringify({
          result,
          timing: v2Input.timing,
          stage: v2Input.stage,
          fees: v2Input.fees,
          preContractContext: v2Input.preContractContext,
          savedAt: new Date().toISOString(),
        })
      );
      setV2Result(result);
    } catch (e) {
      setV2Error(e instanceof Error ? e.message : "診断に失敗しました");
    } finally {
      setV2Loading(false);
    }
  }

  function handleExtract(fees: FeeEntry[]) {
    setExtractedFees(fees);
    setFlowKey((k) => k + 1);
    setV2Result(null);
    setV2Error(null);
  }

  return (
    <div className="space-y-4">
      {!v2Result && (
        <FeeExtractor onExtract={handleExtract} />
      )}
      <FlowRoot key={flowKey} initialFees={extractedFees} onChange={handleChange} onSubmit={handleV2Submit} isLoading={v2Loading} />

      {v2Error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{v2Error}</p>
        </div>
      )}

      {v2Result && v2Input && (
        v2Input.timing === "pre_contract" ? (
          <PreContractResult
            result={v2Result}
            fees={v2Input.fees}
            preContractContext={v2Input.preContractContext}
            onBack={() => setV2Result(null)}
          />
        ) : (
          <DiagnosisResultV2
            result={v2Result}
            timing={v2Input.timing}
            stage={v2Input.stage}
            fees={v2Input.fees}
            onBack={() => setV2Result(null)}
          />
        )
      )}
    </div>
  );
}
