"use client";

import { useState } from "react";
import type { DiagnosisInput2, DiagnosisResult2 } from "@/lib/types_v2";
import FlowRoot from "./diagnosis/FlowRoot";
import DiagnosisResultV2 from "./DiagnosisResultV2";

export default function DiagnosisFormV2() {
  const [v2Input, setV2Input] = useState<DiagnosisInput2 | null>(null);
  const [v2Result, setV2Result] = useState<DiagnosisResult2 | null>(null);
  const [v2Loading, setV2Loading] = useState(false);
  const [v2Error, setV2Error] = useState<string | null>(null);

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
      setV2Result(result);
    } catch (e) {
      setV2Error(e instanceof Error ? e.message : "診断に失敗しました");
    } finally {
      setV2Loading(false);
    }
  }

  return (
    <div>
      <FlowRoot onChange={handleChange} onSubmit={handleV2Submit} isLoading={v2Loading} />

      {v2Error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{v2Error}</p>
        </div>
      )}

      {v2Result && v2Input && (
        <DiagnosisResultV2
          result={v2Result}
          timing={v2Input.timing}
          stage={v2Input.stage}
          fees={v2Input.fees}
          onBack={() => setV2Result(null)}
        />
      )}
    </div>
  );
}
