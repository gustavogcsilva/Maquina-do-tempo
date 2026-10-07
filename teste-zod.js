// teste-zod.js
// Como foi exportado do arquivo capsuleValidator.js, podemos garantir que
// todo o esquema de validação terá o mesmo comportamento aqui e nas rotas.
import { createCapsuleSchema } from "./capsuleValidator.js";

console.log("=== INICIANDO TESTES DO VALIDADOR ===\n");

// ---------------------------------------------------------------------
// TESTE 1: Cenário Ideal (Tudo correto)
// ---------------------------------------------------------------------
// Objeto simulando uma requisição bem preenchida pelo usuário:
const dadosCorretos = {
  title: "  Minha Primeira Cápsula  ",
  message: "Esta mensagem será lida no futuro!",
  unlockDate: "2027-01-01T00:00:00.000Z"
};

// safeParse roda a inspeção sem lançar exceções (não derruba a aplicação)
const resultado1 = createCapsuleSchema.safeParse(dadosCorretos);

if (resultado1.success) {
  console.log("✅ TESTE 1 PASSOU!");
  console.log("Dados higienizados (note o trim aplicado no título):", resultado1.data);
} else {
  console.log("❌ TESTE 1 FALHOU:", resultado1.error.format());
}

console.log("\n-----------------------------------------------------\n");

// ---------------------------------------------------------------------
// TESTE 2: Cenário com Erros (Simulando entradas inválidas ou maliciosas)
// ---------------------------------------------------------------------
const dadosInvalidos = {
  title: "Oi",                // Menor que 3 caracteres (deve falhar)
  message: "   ",             // Vazio após o trim (deve falhar)
  unlockDate: "data-invalida" // Formato não é ISO 8601 (deve falhar)
};

const resultado2 = createCapsuleSchema.safeParse(dadosInvalidos);

if (!resultado2.success) {
  console.log("✅ TESTE 2 PASSOU! O validador barrou com sucesso:");

  // CORREÇÃO: Usamos .issues em vez de .errors para percorrer a lista no Zod
  resultado2.error.issues.forEach((erro) => {
    console.log(` -> Campo [${erro.path.join(".")}]: ${erro.message}`);
  });
} else {
  console.log("❌ TESTE 2 FALHOU: Deveria ter barrado, mas deixou passar!");
}