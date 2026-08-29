const fs = require('fs');
const path = './src/components/admin/BespokeGenerationStudio.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove states
content = content.replace(/const \[provider, setProvider\] = useState<"openai" \| "gemini">\("openai"\);\n/g, '');
content = content.replace(/const \[model, setModel\] = useState<string>\(""\);\n/g, '');
content = content.replace(/const \[models, setModels\].*\n/g, '');
content = content.replace(/const \[modelsLoading, setModelsLoading\].*\n/g, '');

// 2. Remove loadModels function
content = content.replace(/async function loadModels\(\) \{[\s\S]*?\}\n\n/g, '');

// 3. Remove from POST body
content = content.replace(/provider,\n\s*model: model \|\| undefined,\n/g, '');

// 4. Remove UI Card
const uiCardRegex = /\{\/\* AI Model Settings Card \*\/\}([\s\S]*?)<\!-- Model Select Dropdown -->(?:[\s\S]*?)<\/select>\n\s*<\/div>\n\s*<\/div>\n/g;
// Just easier to replace the entire chunk based on strings. Let's find the start and end of that whole card.
const startStr = "{/* AI Model Settings Card */}";
const endStr = `</select>
            </div>
          </div>`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);
if (startIdx !== -1 && endIdx !== -1) {
    const cardContent = content.substring(startIdx, endIdx + endStr.length);
    content = content.replace(cardContent, "");
}

fs.writeFileSync(path, content);
