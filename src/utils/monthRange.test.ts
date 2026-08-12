import { describe, expect, it } from "vitest";
import { buildDataFim, buildDataInicio } from "./monthRange";

// Regressão de 2026-08-11: buildDataFim devolvia o último dia do mês
// selecionado, mas a API da Câmara trata dataFim como quase-exclusivo — o
// filtro perdia silenciosamente as votações do fim de todo mês.

describe("buildDataInicio", () => {
  it("monta o primeiro dia do mês selecionado", () => {
    expect(buildDataInicio(8, 2026)).toBe("2026-08-01");
    expect(buildDataInicio(1, 2026)).toBe("2026-01-01");
  });
});

describe("buildDataFim", () => {
  it("devolve o primeiro dia do mês SEGUINTE, não o último do mês selecionado", () => {
    expect(buildDataFim(8, 2026)).toBe("2026-09-01");
    expect(buildDataFim(12, 2025)).toBe("2026-01-01"); // vira o ano
    expect(buildDataFim(2, 2026)).toBe("2026-03-01"); // não depende de saber quantos dias fevereiro tem
  });
});
