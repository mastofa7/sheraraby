import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("payload: { topic: description }", "payload: { topic: description },\n          clientId: user?.uid || clientIdRef.current");

// Add localAIStatus updates for literary tool
code = code.replace("setSuggestLoading(true);", "setSuggestLoading(true);\n    setLocalAIStatus('تم استلام النص.');");
code = code.replace("const data = await response.json();", "setLocalAIStatus('تم استلام نتيجة التحليل.');\n      const data = await response.json();");

fs.writeFileSync('src/App.tsx', code);
