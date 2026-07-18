import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { AIProgressTracker } from './components/AIProgressTracker';");

// Add clientId ref to App component
code = code.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n  const [localAIStatus, setLocalAIStatus] = useState<string | null>(null);\n  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);");

if (!code.includes("useRef")) {
  code = code.replace("useState", "useState, useRef");
}

code = code.replace("...params,\n          turnstileToken", "...params,\n          turnstileToken,\n          clientId: user?.uid || clientIdRef.current");

code = code.replace("</Layout>", "  <AIProgressTracker isActive={loading || suggestLoading} clientId={user?.uid || clientIdRef.current} localStatus={localAIStatus} />\n      </Layout>");

// Local updates
code = code.replace("setLoading(true);", "setLoading(true);\n      setLocalAIStatus('تم استلام الطلب.');");
code = code.replace("const responseData = await response.json();", "setLocalAIStatus('تم استلام الاستجابة.');\n      const responseData = await response.json();");

// Also remove the old LOADING_QUOTES and useEffect
// The user hates the artificial quotes.
code = code.replace(/const LOADING_QUOTES = \[[\s\S]*?\];/, "");
code = code.replace(/const \[loadingQuoteIndex, setLoadingQuoteIndex\] = useState\(0\);/, "");
code = code.replace(/\/\/ Rotate loading quotes when loading is active[\s\S]*?\}, \[loading\]\);/, "");

// Remove the quote UI
code = code.replace(/<motion\.p[\s\S]*?\{LOADING_QUOTES\[loadingQuoteIndex\]\}[\s\S]*?<\/motion\.p>/, "");
// Remove the text "يرجى الانتظار، جاري نظم الأبيات" that comes before it
code = code.replace(/<h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">[\s\S]*?يرجى الانتظار، جاري نظم الأبيات[\s\S]*?<\/h3>/, "");

fs.writeFileSync('src/App.tsx', code);
