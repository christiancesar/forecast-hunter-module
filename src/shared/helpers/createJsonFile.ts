import fs from "fs";
export function createJsonFile(fileName: string, data: any) {
  console.log(`Writing ${fileName}.json 💾`);

  fs.writeFileSync(`${fileName}.json`, JSON.stringify(data), {
    encoding: "utf8",
  });
}
