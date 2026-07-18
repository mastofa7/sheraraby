import fs from 'fs';
let code = fs.readFileSync('src/components/AdvancedTools.tsx', 'utf8');

// Add import
code = code.replace("import { apiFetch } from '../firebase';", "import { apiFetch } from '../firebase';\nimport { AIProgressTracker } from './AIProgressTracker';\nimport { useRef } from 'react';");

// Add state
code = code.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n  const [localAIStatus, setLocalAIStatus] = useState<string | null>(null);\n  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);");

// Add clientId to payload
code = code.replace("toolAction: action,\n           payload,", "toolAction: action,\n           payload,\n           clientId: clientIdRef.current,");

// Add local status updates
code = code.replace("setLoading(true);", "setLoading(true);\n    setLocalAIStatus('تم استلام الطلب.');");
code = code.replace("const data = await response.json();", "setLocalAIStatus('تم استلام الاستجابة.');\n      const data = await response.json();");

// Add AIProgressTracker to JSX.
// We'll append it just before the final </div> in AdvancedTools.
// Let's find the last </div>
const lastDivIndex = code.lastIndexOf("</div>");
if (lastDivIndex !== -1) {
  code = code.substring(0, lastDivIndex) + `\n      <AIProgressTracker isActive={loading} clientId={clientIdRef.current} localStatus={localAIStatus} error={error} />\n` + code.substring(lastDivIndex);
}

fs.writeFileSync('src/components/AdvancedTools.tsx', code);
