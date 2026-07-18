import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const start = code.indexOf('{/* Loading Overlay */}');
const end = code.indexOf('{/* Active Tab View */}');
if (start !== -1 && end !== -1) {
  code = code.substring(0, start) + code.substring(end);
}

fs.writeFileSync('src/App.tsx', code);
