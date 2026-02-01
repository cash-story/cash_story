// ============================================================================
// CHUNKED PROMPTS FOR GEMINI 2.5 FLASH (to avoid MAX_TOKENS)
// ============================================================================

const BASE_RULES = `Дүрмүүд:
- Бүх тоон утга бүхэл тоо (years_to_reach-с бусад)
- years_to_reach нэг оронтой бутархай (жишээ: 1.5)
- Бүх текст МОНГОЛ хэлээр
- ЗӨВХӨН JSON хариулна
- Тайлбар 50 тэмдэгтээс бага байх
- insights/warnings 2 элементээс ихгүй`;

// Part 1: Core financial data (overview, score, income, expense, cashflow)
export const PROMPT_PART1 = `Та санхүүгийн шинжээч. Банкны хуулгыг шинжилж дараах JSON-г буцаана.

ОНОО ТООЦООЛОХ:
- Хадгаламж (40 оноо): savingsRate = netCashflow/totalIncome×100. >40%=40, 30-40%=32, 20-30%=24, 10-20%=16, 0-10%=8, <0%=0
- Орлого тогтвортой (20 оноо): CV<20%=20
- Зардал харьцаа (20 оноо): <60%=20, 60-80%=12, >80%=4
- Урсгал чиг (20 оноо): тогтмол эерэг=20
Ангилал: 70-100="Сайн"/green, 40-69="Анхаарах"/yellow, 0-39="Эрсдэлтэй"/red

${BASE_RULES}

JSON:
{
  "overview": {"periodStart": "YYYY-MM-DD", "periodEnd": "YYYY-MM-DD", "totalMonths": number, "bankName": string|null, "currency": "MNT", "generatedAt": "YYYY-MM-DD"},
  "score": {"score": 0-100, "category": "Сайн"|"Анхаарах"|"Эрсдэлтэй", "categoryColor": "green"|"yellow"|"red", "description": "string", "factors": [{"name": "string", "impact": "positive"|"negative"|"neutral", "description": "string"}]},
  "income": {"totalIncome": number, "monthlyAverage": number, "stability": "Тогтвортой"|"Тогтворгүй", "stabilityScore": 0-100, "mainSources": [{"name": "string", "amount": number, "percentage": number, "frequency": "Тогтмол"|"Тогтмол бус"}], "insights": ["string"]},
  "expense": {"totalExpense": number, "monthlyAverage": number, "expenseToIncomeRatio": number, "topCategories": [{"name": "string", "amount": number, "percentage": number, "trend": "Өсөж байна"|"Буурч байна"|"Тогтвортой"}], "fixedExpenses": number, "variableExpenses": number, "insights": ["string"], "warnings": []},
  "cashflow": {"netCashflow": number, "monthlyAverage": number, "trend": "Эерэг"|"Сөрөг"|"Тогтвортой", "monthlyBreakdown": [{"month": "YYYY-MM", "income": number, "expense": number, "netCashflow": number}], "deficitMonths": [], "surplusMonths": [], "savingsRate": number, "insights": ["string"]}
}

БАНКНЫ ХУУЛГА:
`;

// Part 2: Behavior, risks, recommendations
export const PROMPT_PART2 = `Та санхүүгийн шинжээч. Өмнөх шинжилгээний үр дүн болон банкны хуулга дээр үндэслэн дараах JSON-г буцаана.

Зуршлын төрөл: salary_driven, end_of_month_shortage, frequent_small_expenses, impulse_spending, consistent_saving, seasonal_variation
Эрсдэл төрөл: expense_exceeds_income, no_savings, single_income_dependency, increasing_debt, high_expense_ratio, irregular_income

${BASE_RULES}

JSON:
{
  "behaviorPatterns": {"patterns": [{"type": "string", "detected": boolean, "severity": "low"|"medium"|"high"|null, "description": "string"}], "spendingProfile": "Хэмнэлттэй"|"Тэнцвэртэй"|"Өгөөмөр", "insights": ["string"]},
  "risks": {"overallRiskLevel": "Бага"|"Дунд"|"Өндөр", "risks": [{"type": "string", "detected": boolean, "severity": "Бага"|"Дунд"|"Өндөр", "title": "string", "description": "string", "recommendation": "string"}], "hasUrgentRisks": boolean},
  "recommendations": {"priority": [{"id": "p1", "title": "string", "description": "string", "impact": "Өндөр"|"Дунд"|"Бага", "difficulty": "Хялбар"|"Дунд"|"Хэцүү", "timeframe": "Богино хугацаа"|"Дунд хугацаа"|"Урт хугацаа", "actionItems": ["string"]}], "savings": [], "investment": [], "lifestyle": []}
}

ӨМНӨХ ШИНЖИЛГЭЭ:
`;

// Part 3: Milestones, projections, strategy, verdict
export const PROMPT_PART3 = `Та санхүүгийн шинжээч. Өмнөх шинжилгээний үр дүн дээр үндэслэн дараах JSON-г буцаана.

ТООЦОО (12% жилийн өгөөж):
- security: monthly_expenses × 6
- comfort: (monthly_expenses × 12) / 0.12 × 0.5
- freedom: (monthly_expenses × 12) / 0.12
- super_freedom: 1,000,000,000
- years_to_reach: Хэрэв monthly_savings<=0 бол 99, эсвэл target/(monthly_savings×12)

Тусгал: monthly_savings×12×((1.12^N-1)/0.12) for N=5,15,30

${BASE_RULES}

JSON:
{
  "milestones": {"security": {"amount_mnt": number, "years_to_reach": number}, "comfort": {"amount_mnt": number, "years_to_reach": number}, "freedom": {"amount_mnt": number, "years_to_reach": number}, "super_freedom": {"amount_mnt": 1000000000, "years_to_reach": number}},
  "projections": [{"year": 5, "projected_value": number, "assumptions": "12% жилийн өгөөж"}, {"year": 15, "projected_value": number, "assumptions": "12% жилийн өгөөж"}, {"year": 30, "projected_value": number, "assumptions": "12% жилийн өгөөж"}],
  "strategy": {"philosophy": "Мянгат малчин стратеги", "advice_items": ["string"], "riskTolerance": "Бага"|"Дунд"|"Өндөр", "suggestedAllocation": [{"category": "string", "percentage": number, "description": "string"}]},
  "verdict": {"overallStatus": "string", "mainStrength": "string", "mainRisk": "string", "mainOpportunity": "string", "nextSteps": ["string"]}
}

ӨМНӨХ ШИНЖИЛГЭЭ:
`;

export function buildPart1Prompt(extractedText: string): string {
  return PROMPT_PART1 + extractedText;
}

export function buildPart2Prompt(
  extractedText: string,
  part1Result: string,
): string {
  return PROMPT_PART2 + part1Result + "\n\nБАНКНЫ ХУУЛГА:\n" + extractedText;
}

export function buildPart3Prompt(
  part1Result: string,
  part2Result: string,
): string {
  return (
    PROMPT_PART3 + JSON.stringify({ part1: part1Result, part2: part2Result })
  );
}

// Legacy single prompt (kept for reference)
export const FINANCIAL_GUIDE_PROMPT = PROMPT_PART1;

export function buildAnalysisPrompt(extractedText: string): string {
  return buildPart1Prompt(extractedText);
}

// Transaction Parsing Prompt
export const TRANSACTION_PARSE_PROMPT = `Та банкны хуулгаас гүйлгээнүүдийг задлах үүрэгтэй.

ДААЛГАВАР:
1. Банкны хуулгын текстээс БҮХ гүйлгээг (орлого, зарлага) олж задлана
2. Гүйлгээ бүрийг доорх категоруудын аль нэгэнд хуваарилна
3. JSON форматаар хариулна

ЧУХАЛ - БАНКНЫ ФОРМАТ ТАНИХ:
Монголын банкууд өөр өөр формат ашигладаг. Дараах бүтцүүдийг анхаарна уу:

1. ГОЛОМТ БАНК формат:
   - Огноо | Гүйлгээний утга | Дебит | Кредит | Үлдэгдэл
   - Дебит = зарлага (expense), Кредит = орлого (income)

2. ХУДАЛДАА ХӨГЖЛИЙН БАНК (TDB) формат:
   - Огноо | Тайлбар | Орлого | Зарлага | Үлдэгдэл
   - Эсвэл: Дансны дугаар | Огноо | Гүйлгээний утга | Дүн | Үлдэгдэл
   - "Орлого" багана = income, "Зарлага" багана = expense
   - Хэрэв нэг "Дүн" багана байвал: эерэг = income, сөрөг = expense

3. ХААН БАНК формат:
   - Огноо | Гүйлгээ | Орлого | Зарлага | Үлдэгдэл

4. ХАС БАНК формат:
   - Огноо | Утга | Дүн | Төрөл | Үлдэгдэл

ГҮЙЛГЭЭНИЙ ТӨРӨЛ ТОДОРХОЙЛОХ:
- "Орлого", "Кредит", "Credit", "CR", эерэг тоо (+ тэмдэгтэй) = income
- "Зарлага", "Дебит", "Debit", "DR", сөрөг тоо (- тэмдэгтэй) = expense
- Хэрэв тодорхой бус бол гүйлгээний тайлбараас таамаглана:
  - "Цалин", "Шилжүүлэг орсон", "Орлого" = income
  - "Худалдан авалт", "Төлбөр", "Шилжүүлэг", "Татан авалт" = expense

ДҮРМҮҮД:
- date: YYYY-MM-DD формат (жишээ: 2024-01-15)
- amount: Эерэг тоо (бүхэл), таслалыг хасна (1,500,000 -> 1500000)
- type: "income" эсвэл "expense"
- Зөвхөн JSON хариулна
- Бүх текст МОНГОЛ хэлээр
- Хоосон мөр, толгой мөр, нийлбэр мөрийг алгасна
- Хэрэв гүйлгээ олдохгүй бол хоосон transactions буцаана

JSON БҮТЭЦ:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Гүйлгээний тайлбар",
      "amount": number,
      "type": "income" | "expense",
      "suggested_category_id": "category_uuid",
      "suggested_category_name": "Категорийн нэр"
    }
  ]
}

КАТЕГОРИУД:
`;

export function buildTransactionParsePrompt(
  extractedText: string,
  categories: {
    income: { id: string; name: string }[];
    expense: { id: string; name: string }[];
  },
): string {
  const categoryList = `
ОРЛОГО:
${categories.income.map((c) => `- ${c.id}: ${c.name}`).join("\n")}

ЗАРЛАГА:
${categories.expense.map((c) => `- ${c.id}: ${c.name}`).join("\n")}
`;

  return (
    TRANSACTION_PARSE_PROMPT +
    categoryList +
    "\n\nБАНКНЫ ХУУЛГА:\n" +
    extractedText
  );
}

// Legacy prompt for backward compatibility
export const FINANCIAL_ROADMAP_PROMPT = `Role: Та Монголын Санхүүгийн Зөвлөх бөгөөд банкны хуулгын мэдээллийг "Санхүүгийн Эрх Чөлөөний Төлөвлөгөө" болгон хувиргах үүрэгтэй.

Оролтын өгөгдөл: Банкны хуулгын текст (гүйлгээний жагсаалт).

ШИНЖИЛГЭЭНИЙ ДҮРЭМ:

1. ҮНЭЛГЭЭНИЙ СИСТЕМ (Ганбатын загвар):
- AA: Хадгаламжийн хувь >40%, төрөлжсөн хөрөнгө оруулалттай, муу өргүй
- A: Хадгаламжийн хувь 30-40%, зарим хөрөнгө оруулалттай, бага өр
- B: Хадгаламжийн хувь 15-30%, тогтвортой боловч хөрөнгө оруулалтын төлөвлөгөөгүй
- C: Хадгаламжийн хувь 5-15%, цалингаас цалин амьдарч байна
- D: Хадгаламжийн хувь <5%, өндөр хэрэглээний өр
- E: Сөрөг мөнгөн урсгал, санхүүгийн эгзэгтэй байдал

Хадгаламжийн хувь = (netCashflow / totalIncome) × 100

2. 4 ШАТНЫ ТООЦОО (12% жилийн өгөөж дээр суурилсан):
- security (Санхүүгийн хамгаалалт): monthly_expenses × 6
- comfort (Санхүүгийн тав тух): (monthly_expenses × 0.5 × 12) / 0.12
- freedom (Санхүүгийн эрх чөлөө): (monthly_expenses × 12) / 0.12
- super_freedom (Супер эрх чөлөө): 1,000,000,000

years_to_reach тооцоо:
- current_savings = 0 (консерватив тооцоо)
- monthly_savings = netCashflow / сарын тоо
- Хэрэв monthly_savings <= 0 бол years_to_reach = 99
- Эсвэл: ln((target × r / (monthly_savings × 12) + 1)) / ln(1 + r) буюу (target - current) / (monthly_savings × 12) ойролцоогоор

3. МЯНГАТ МАЛЧИН СТРАТЕГИ:
- philosophy: "Мянгат малчин стратеги" - мал сүргээ олон бэлчээрт хуваарилдаг шиг хөрөнгөө төрөлжүүлэх
- advice_items: 2-4 зөвлөмж (зардал бууруулах, хөрөнгө оруулалт төрөлжүүлэх, гадаад/дотоод зах зээл)

4. ТУСГАЛ ТООЦОО (12% жилийн өгөөж):
- 5 жил: FV = monthly_savings × 12 × ((1.12^5 - 1) / 0.12)
- 15 жил: FV = monthly_savings × 12 × ((1.12^15 - 1) / 0.12)
- 30 жил: FV = monthly_savings × 12 × ((1.12^30 - 1) / 0.12)

JSON БҮТЭЦ (ЗӨВХӨН ЭНЭ ФОРМАТААР ХАРИУЛНА):
{
  "summary": {
    "totalIncome": number,
    "totalExpense": number,
    "netCashflow": number,
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "currency": "MNT"
  },
  "monthlyBreakdown": [
    {"month": "YYYY-MM", "income": number, "expense": number}
  ],
  "rating": {
    "grade": "AA|A|B|C|D|E",
    "status_mn": "Монгол үг",
    "description": "Тайлбар монголоор"
  },
  "milestones": {
    "security": {"amount_mnt": number, "years_to_reach": number},
    "comfort": {"amount_mnt": number, "years_to_reach": number},
    "freedom": {"amount_mnt": number, "years_to_reach": number},
    "super_freedom": {"amount_mnt": number, "years_to_reach": number}
  },
  "strategy": {
    "philosophy": "Мянгат малчин стратеги",
    "advice_items": ["зөвлөмж 1", "зөвлөмж 2", "зөвлөмж 3"]
  },
  "projections": [
    {"year": 5, "projected_value": number},
    {"year": 15, "projected_value": number},
    {"year": 30, "projected_value": number}
  ],
  "bankName": "string эсвэл null"
}

ЧУХАЛ:
- Бүх тоон утга бүхэл тоо байна (аравтын бутархайгүй, years_to_reach-с бусад)
- years_to_reach нэг оронтой бутархай (жишээ: 1.5, 2.3)
- Монгол хэлээр бүх текст
- Зөвхөн JSON хариулна, өөр юм бичихгүй
- Хэрэв мэдээлэл дутуу бол консерватив тооцоо хийх

БАНКНЫ ХУУЛГА:
`;
