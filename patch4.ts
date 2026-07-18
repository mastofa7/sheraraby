import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("const [loading, setLoading] = useState<boolean>(false);", "const [loading, setLoading] = useState<boolean>(false);\n  const [localAIStatus, setLocalAIStatus] = useState<string | null>(null);\n  const clientIdRef = useRef<string>(`client-${Math.random().toString(36).substr(2, 9)}`);");

if (!code.includes("useRef")) {
  code = code.replace("useState,", "useState, useRef,");
}

fs.writeFileSync('src/App.tsx', code);
