const fs = require('fs');
const path = './src/components/admin/BespokeGenerationStudio.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const \[modelsError, setModelsError\].*\n/g, '');

const loadModelsRegex = /const loadModels = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);\n\n  useEffect\(\(\) => \{\n    void loadModels\(\);\n  \}, \[loadModels\]\);\n/g;

content = content.replace(loadModelsRegex, '');

fs.writeFileSync(path, content);
