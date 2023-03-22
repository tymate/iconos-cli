#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { transform } from "@svgr/core";
import prettier from "prettier";
import prompts from "prompts";

const svgDir = "./";
const componentsDir = "./components";

(async () => {
  const colorResponse = await prompts({
    type: "text",
    name: "value",
    message:
      "Which color do you want to replace by currentColor, leave empty if you don't need it. (ex: #101828) ?",
  });

  // Vérifier si le dossier components existe, sinon le créer
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir);
  }

  fs.readdirSync(svgDir).forEach(async (file) => {
    const filePath = path.join(svgDir, file);

    // Vérifier si le fichier est un fichier SVG
    if (path.extname(filePath).toLowerCase() === ".svg") {
      const componentName = `${file.charAt(0).toUpperCase()}${file.slice(
        1,
        -4
      )}`.replace(/-./g, (x) => x[1].toUpperCase());
      const fileContent = fs.readFileSync(filePath, "utf8");

      try {
        const jsCode = await transform(
          fileContent,
          {
            icon: true,
            typescript: true,
            replaceAttrValues: {
              [colorResponse?.value]: "currentColor",
            },
          },
          { componentName: componentName }
        );

        // Ajouter la balise style avec les props passées
        let fileContentProps = jsCode.replace(
          /<svg([\s\S]*?)>/,
          `<svg$1 style={{ ...props.style, color: props.color, fontSize: props.size }}>`
        );
        // Ajouter la props size
        fileContentProps = fileContentProps.replace(
          /SVGProps<SVGSVGElement>/,
          `SVGProps<SVGSVGElement>  & { size?: number }`
        );

        // Ajouter la balise style avec les props passées
        fileContentProps = fileContentProps
          .replace(/import \* as React from "react";\n/, "")
          .replace(/\n/g, "\n\n");

        console.log(`${componentName} ✅ - created`);

        fs.writeFileSync(
          path.join(componentsDir, `${componentName}.tsx`),
          `${prettier.format(fileContentProps, {
            printWidth: 90,
            tabWidth: 2,
            useTabs: false,
            semi: true,
            singleQuote: true,
            trailingComma: "all",
            bracketSpacing: true,
            bracketLine: false,
            jsxBracketSameLine: false,
            arrowParens: "avoid",
            requirePragma: false,
            insertPragma: false,
            proseWrap: "preserve",
            parser: "typescript",
          })}\n`
        );
      } catch (err) {
        console.log(err);
      }
    }
  });
})();
