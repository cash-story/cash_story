export const FINANCIAL_ANALYSIS_PROMPT = `Банкны хуулгыг шинжилж JSON тайлан гарга.

ЗААВАР:
- Зөвхөн JSON хариулна
- Монгол хэлээр
- Категори хамгийн ихдээ 3
- Insights хамгийн ихдээ 2
- Тоонууд бүхэл тоо байна (аравтын бутархайгүй)

JSON БҮТЭЦ:
{"summary":{"totalIncome":number,"totalExpense":number,"netCashflow":number,"periodStart":"YYYY-MM-DD","periodEnd":"YYYY-MM-DD","currency":"MNT"},"monthlyBreakdown":[{"month":"YYYY-MM","income":number,"expense":number}],"topIncomeCategories":[{"name":"string","amount":number,"percentage":number}],"topExpenseCategories":[{"name":"string","amount":number,"percentage":number}],"insights":["string"],"warnings":[],"bankName":"string"}

ХУУЛГА:
`;

export function buildAnalysisPrompt(extractedText: string): string {
  return FINANCIAL_ANALYSIS_PROMPT + extractedText + "\n---";
}
