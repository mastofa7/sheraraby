import fs from 'fs';
let content = fs.readFileSync('src/backend-logic.ts', 'utf8');

// add activeStatuses map
if (!content.includes('activeStatuses')) {
  content = content.replace('const activeUsers = new Set<string>();', `const activeUsers = new Set<string>();\nexport const activeStatuses = new Map<string, string>();\n\nexport function setAIStatus(clientId: string, status: string) {\n  if(clientId) activeStatuses.set(clientId, status);\n}\n\nexport function getAIStatus(clientId: string): string | null {\n  return activeStatuses.get(clientId) || null;\n}`);
}
fs.writeFileSync('src/backend-logic.ts', content);
