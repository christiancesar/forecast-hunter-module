import fs from "node:fs";
import path from "node:path";

export function createJsonFile(fileName: string, data: any) {
  console.log(`Writing ${fileName}.json 💾`);

  fs.writeFileSync(
    path.resolve(
      __dirname,
      "..",
      "..",
      "files",
      "repositories",
      `${fileName}.json`
    ),
    JSON.stringify(data),
    {
      encoding: "utf8",
    }
  );
}
