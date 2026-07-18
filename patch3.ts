import fs from 'fs';
let code = fs.readFileSync('src/backend-logic.ts', 'utf8');

// Add clientId to signature
code = code.replace("export async function handleLiteraryTool(toolAction: string, payload: any, aiInstance: GoogleGenAI)", "export async function handleLiteraryTool(toolAction: string, payload: any, aiInstance: GoogleGenAI, clientId?: string)");

// Replace all callGeminiWithJsonParsing inside handleLiteraryTool to have setAIStatus
code = code.replace(/return await callGeminiWithJsonParsing\(\{/g, "if (clientId) setAIStatus(clientId, 'جاري إرسال النص للتحليل.');\n    return await callGeminiWithJsonParsing({");

fs.writeFileSync('src/backend-logic.ts', code);
