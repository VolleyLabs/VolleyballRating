// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const directory = "./src/app/utils/supabase/api-client";
const search = "/index.js';";
const replace = "/index';";

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes(search)) {
        const updatedContent = content.replace(
          new RegExp(search, "g"),
          replace
        );
        fs.writeFileSync(fullPath, updatedContent, "utf-8");
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(directory);
console.log("Replacement complete.");
