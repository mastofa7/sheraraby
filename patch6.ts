import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
code = code.replace("import BotanicalThemeBackground from './components/BotanicalThemeBackground';", "import BotanicalThemeBackground from './components/BotanicalThemeBackground';\nimport { AIProgressTracker } from './components/AIProgressTracker';");

// Add clientIdRef and setLocalAIStatus
code = code.replace("const [loading, setLoading] = useState<boolean>(false);", "const [loading, setLoading] = useState<boolean>(false);\n  const [localAIStatus, setLocalAIStatus] = useState<string | null>(null);\n  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);");

if (!code.includes("useRef")) {
  code = code.replace("useState,", "useState, useRef,");
}

// Add tracker component
code = code.replace("{/* Active Tab View */}", "  <AIProgressTracker isActive={loading || suggestLoading} clientId={user?.uid || clientIdRef.current} localStatus={localAIStatus} error={error} />\n        {/* Active Tab View */}");

// Pass clientId to API
code = code.replace("...params,\n          turnstileToken", "...params,\n          turnstileToken,\n          clientId: user?.uid || clientIdRef.current");
code = code.replace("payload: { topic: description }", "payload: { topic: description },\n          clientId: user?.uid || clientIdRef.current");

// Add localAIStatus updates
code = code.replace("setLoading(true);", "setLoading(true);\n      setLocalAIStatus('تم استلام الطلب.');");
code = code.replace("const responseData = await response.json();", "setLocalAIStatus('تم استلام الاستجابة.');\n      const responseData = await response.json();");

code = code.replace("setSuggestLoading(true);", "setSuggestLoading(true);\n    setLocalAIStatus('تم استلام النص.');");
code = code.replace("const data = await response.json();", "setLocalAIStatus('تم استلام نتيجة التحليل.');\n      const data = await response.json();");

fs.writeFileSync('src/App.tsx', code);
