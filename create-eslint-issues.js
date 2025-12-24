import fs from "fs";
import { execSync } from "child_process";

const lintOutput = fs.readFileSync("lint_output.txt", "utf-8");
const lines = lintOutput.split("\n");

let currentFile = "";
let issueCount = 0;

lines.forEach((line) => {
  // Match file path lines: starting with /
  if (line.startsWith("/")) {
    currentFile = line.trim();
  } else {
    // Match issue lines: indented with spaces, like "   1:16  warning  Strings must use singlequote  quotes"
    const match = line.match(/^\s+(\d+):(\d+)\s+(warning|error)\s+(.+)$/);
    if (match && currentFile) {
      const [, lineNum, , type, message] = match;
      const relativeFile = currentFile.replace(
        "/home/rana/Documents/test/accelerator/",
        "",
      );
      const issueType = type === "error" ? "bug" : "task";
      const title = `Fix ESLint ${type} in ${relativeFile}:${lineNum} - ${message.split(" ")[0]}`;
      const cmd = `bd create "${title}" --type ${issueType} --priority 2`;
      try {
        execSync(cmd, { stdio: "inherit" });
        issueCount++;
      } catch (error) {
        console.error(`Failed to create issue for ${line}: ${error.message}`);
      }
    }
  }
});

console.log(`Created ${issueCount} ESLint issues.`);
