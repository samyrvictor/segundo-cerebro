import assert from "node:assert/strict";
import { test } from "node:test";
import { decidir } from "./decidir";

const estado = { local: "A", banco: "A" };

test("ninguém mudou", () => {
  assert.equal(decidir({ estado, local: "A", banco: "A", importar: false }), "nada");
});

test("só o arquivo mudou → envia", () => {
  assert.equal(decidir({ estado, local: "B", banco: "A", importar: false }), "enviar");
});

test("só o banco mudou → baixa", () => {
  assert.equal(decidir({ estado, local: "A", banco: "B", importar: false }), "baixar");
});

test("os dois mudaram diferente → conflito", () => {
  assert.equal(decidir({ estado, local: "B", banco: "C", importar: false }), "conflito");
});

test("os dois mudaram para o mesmo conteúdo → só registra", () => {
  assert.equal(decidir({ estado, local: "B", banco: "B", importar: false }), "registrar");
});

test("apagado no Obsidian, banco igual → apaga no banco", () => {
  assert.equal(decidir({ estado, local: "", banco: "A", importar: false }), "apagarBanco");
});

test("apagado no banco, arquivo igual → apaga o arquivo", () => {
  assert.equal(decidir({ estado, local: "A", banco: "", importar: false }), "apagarLocal");
});

test("apagado no Obsidian mas editado no app → baixa de novo (app vence)", () => {
  assert.equal(decidir({ estado, local: "", banco: "B", importar: false }), "baixar");
});

test("apagado no banco mas editado no Obsidian → envia (não perde a edição)", () => {
  assert.equal(decidir({ estado, local: "B", banco: "", importar: false }), "enviar");
});

test("sumiu dos dois lados → esquece", () => {
  assert.equal(decidir({ estado, local: "", banco: "", importar: false }), "esquecer");
});

test("sem estado: só existe local → envia; só existe no banco → baixa", () => {
  assert.equal(decidir({ local: "A", banco: "", importar: false }), "enviar");
  assert.equal(decidir({ local: "", banco: "A", importar: false }), "baixar");
});

test("sem estado e iguais → registra", () => {
  assert.equal(decidir({ local: "A", banco: "A", importar: false }), "registrar");
});

test("sem estado e diferentes: banco vence, a não ser na migração", () => {
  assert.equal(decidir({ local: "A", banco: "B", importar: false }), "baixar");
  assert.equal(decidir({ local: "A", banco: "B", importar: true }), "enviar");
});
