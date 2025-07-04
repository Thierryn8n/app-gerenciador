// Script para instalar dependências necessárias para exportação de relatórios
// Execute: npm install jspdf html2canvas

console.log("Instalando dependências para exportação de relatórios...")
console.log("Execute os seguintes comandos:")
console.log("npm install jspdf")
console.log("npm install html2canvas")
console.log("npm install @types/jspdf")

// Verificar se as dependências estão instaladas
try {
  require("jspdf")
  console.log("✅ jsPDF instalado com sucesso")
} catch (error) {
  console.log("❌ jsPDF não encontrado - execute: npm install jspdf")
}

try {
  require("html2canvas")
  console.log("✅ html2canvas instalado com sucesso")
} catch (error) {
  console.log("❌ html2canvas não encontrado - execute: npm install html2canvas")
}

console.log("\nDependências necessárias:")
console.log("- jspdf: Para geração de PDFs")
console.log("- html2canvas: Para captura de elementos HTML")
console.log("- @types/jspdf: Tipos TypeScript para jsPDF")
