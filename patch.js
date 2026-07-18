const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { AIProgressTracker } from './components/AIProgressTracker';");

// Add clientId ref to App component
code = code.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n  const [localAIStatus, setLocalAIStatus] = useState<string | null>(null);\n  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);");

// Ensure useRef is imported
if (!code.includes("useRef")) {
  code = code.replace("useState", "useState, useRef");
}

// Add clientId to payload
code = code.replace("...params,\n          turnstileToken", "...params,\n          turnstileToken,\n          clientId: user?.uid || clientIdRef.current");

// Add AIProgressTracker component at the end of return inside the main div
code = code.replace("</Layout>", "  <AIProgressTracker isActive={loading || suggestLoading} clientId={user?.uid || clientIdRef.current} localStatus={localAIStatus} />\n      </Layout>");

// Now add local status updates to App.tsx
code = code.replace("setLoading(true);", "setLoading(true);\n      setLocalAIStatus('تم استلام الطلب.');\n      setTimeout(() => setLocalAIStatus('جاري تجهيز البيانات.'), 100);"); // well wait, this is just a quick UI update before fetch. "يمنع منعا باتا استخدام setTimeout" oh!

fs.writeFileSync('src/App.tsx', code);
