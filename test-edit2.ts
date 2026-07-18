import fs from 'fs';
let content = fs.readFileSync('src/backend-logic.ts', 'utf8');

content = content.replace(
  "const finalPoem = await poemGenerationQueue.enqueue(async () => {",
  "const finalPoem = await poemGenerationQueue.enqueue(async () => {\n      setAIStatus(clientId, 'جاري إعداد تعليمات الذكاء الاصطناعي.');"
);

content = content.replace(
  "const model = aiInstance.models.get({",
  "setAIStatus(clientId, 'جاري التواصل مع نموذج Gemini.');\n      const model = aiInstance.models.get({"
);

content = content.replace(
  "const result = await model.generateContent({",
  "setAIStatus(clientId, 'ينتظر النظام استجابة نموذج الذكاء الاصطناعي.');\n      const result = await model.generateContent({"
);

content = content.replace(
  "const text = result.text || '';",
  "setAIStatus(clientId, 'تم استلام الاستجابة.');\n      const text = result.text || '';"
);

content = content.replace(
  "let jsonObj: any;",
  "setAIStatus(clientId, 'جاري التحقق من سلامة النتيجة.');\n      let jsonObj: any;"
);

content = content.replace(
  "activeUsers.delete(clientId);",
  "activeStatuses.delete(clientId);\n    activeUsers.delete(clientId);"
);

// also for the other activeUsers.delete(clientId) (the cache one and finally)
// wait, we can just replace all activeUsers.delete with both.

content = content.replace(
  /activeUsers\.delete\(clientId\);/g,
  "activeStatuses.delete(clientId);\n    activeUsers.delete(clientId);"
);

fs.writeFileSync('src/backend-logic.ts', content);
