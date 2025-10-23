// scripts/build-file-manifest.ts
import fs from "fs";
import path from "path";

const baseDir = path.join(process.cwd(), "public", "BASES DE DATOS");

// Función recursiva para encontrar todos los archivos .xlsx
function findXlsxFiles(dir: string, baseDirForRelative: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(findXlsxFiles(fullPath, baseDirForRelative));
    } else if (file.isFile() && file.name.toLowerCase().endsWith(".xlsx")) {
      // Usamos path.sep para asegurar compatibilidad entre SO
      results.push(path.relative(baseDirForRelative, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

function main() {
  const outPath = path.join(process.cwd(), "public", "bases-manifest.json");

  if (!fs.existsSync(baseDir)) {
    console.warn("Advertencia: No se encontró la carpeta 'public/BASES DE DATOS'. Se generará un manifiesto vacío.");
    
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    fs.writeFileSync(outPath, JSON.stringify({ folder: "BASES DE DATOS", files: [] }, null, 2), "utf8");
    return;
  }
  
  const files = findXlsxFiles(baseDir, baseDir).sort();

  fs.writeFileSync(outPath, JSON.stringify({ folder: "BASES DE DATOS", files }, null, 2), "utf8");
  console.log(`Manifiesto generado: ${outPath} (${files.length} archivos)`);
}

main();
