import { describe, expect, it } from "vitest";
import { partyColorLight, partyColorBordered, partyColorSolid, partyColorSolidRing, partyInitials } from "./partyColors";

// Regressao de 2026-09-03 (F-19 da auditoria de codigo): o mesmo partido
// (ex: PSD) tinha cores DIFERENTES em arquivos diferentes -- roxo em 3
// telas, cinza-ardosia em 2 -- porque cada tela mantinha seu proprio mapa
// copiado a mao. Fonte unica agora: uma familia de cor por partido, usada
// por todas as variantes de estilo.

describe("partyColors", () => {
  it("mesma sigla resolve pra mesma familia de cor em todas as variantes", () => {
    // PSD deve ser "purple" nas quatro variantes, nunca slate/cinza
    expect(partyColorLight("PSD")).toContain("purple");
    expect(partyColorBordered("PSD")).toContain("purple");
    expect(partyColorSolid("PSD").bg).toContain("purple");
    expect(partyColorSolidRing("PSD").bg).toContain("purple");
  });

  it("partido desconhecido cai no fallback neutro, nao quebra", () => {
    expect(partyColorLight("PARTIDO_INEXISTENTE")).toContain("slate");
    expect(partyColorSolid("PARTIDO_INEXISTENTE").bg).toContain("slate");
  });

  it("cada variante devolve a forma esperada", () => {
    expect(typeof partyColorLight("PT")).toBe("string");
    expect(typeof partyColorBordered("PT")).toBe("string");
    expect(partyColorSolid("PT")).toHaveProperty("bg");
    expect(partyColorSolid("PT")).toHaveProperty("text");
    expect(partyColorSolidRing("PT")).toHaveProperty("ring");
  });
});

describe("partyInitials", () => {
  it("mantem siglas de 2 letras ou menos intactas", () => {
    expect(partyInitials("PL")).toBe("PL");
  });

  it("trunca siglas maiores pras 2 primeiras letras", () => {
    expect(partyInitials("PSOL")).toBe("PS");
    expect(partyInitials("REPUBLICANOS")).toBe("RE");
  });
});
