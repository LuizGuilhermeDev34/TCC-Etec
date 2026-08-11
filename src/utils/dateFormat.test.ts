import { describe, expect, it } from "vitest";
import { fmtDate, fmtTime } from "./dateFormat";

// Regressão do bug de 2026-08-11: datas puras ("YYYY-MM-DD", sem horário)
// eram passadas direto pro Date() nativo, que as interpreta como UTC — em
// fuso negativo (Brasília, UTC-3) isso desloca o dia exibido em -1 e, pior,
// fmtTime chegava a inventar um horário ("21:00") que não existe na fonte.

describe("fmtDate", () => {
  it("não desloca o dia para datas puras em fuso negativo", () => {
    expect(fmtDate("2026-08-11")).toBe("11 de agosto de 2026");
    expect(fmtDate("2026-07-15")).toBe("15 de julho de 2026");
  });

  it("aceita mês abreviado quando pedido", () => {
    expect(fmtDate("2026-08-11", "short")).toContain("11");
    expect(fmtDate("2026-08-11", "short")).not.toContain("agosto de 2026");
  });

  it("processa datetime completo sem alterar o dia", () => {
    expect(fmtDate("2026-08-11T15:42:39")).toBe("11 de agosto de 2026");
  });

  it("retorna travessão para valor vazio", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate("")).toBe("—");
  });
});

describe("fmtTime", () => {
  it("não inventa horário para uma data pura", () => {
    expect(fmtTime("2026-08-11")).toBe("");
  });

  it("retorna o horário real quando a string tem T", () => {
    expect(fmtTime("2026-08-11T15:42:39")).toBe("15:42");
  });

  it("retorna vazio para valor vazio", () => {
    expect(fmtTime(null)).toBe("");
    expect(fmtTime("")).toBe("");
  });
});
