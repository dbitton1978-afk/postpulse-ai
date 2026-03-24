const { execSync } = require("node:child_process");

function isMusl() {
  try {
    if (process.report && typeof process.report.getReport === "function") {
      const report = process.report.getReport();
      return !report.header.glibcVersionRuntime;
    }
  } catch (_) {}
  return false;
}

function main() {
  if (process.platform !== "linux" || process.arch !== "x64") {
    console.log("Skipping rollup native check on this platform.");
    return;
  }

  const variant = isMusl() ? "musl" : "gnu";
  const pkgName = `@rollup/rollup-linux-x64-${variant}`;

  let rollupVersion = "latest";
  try {
    rollupVersion = require("rollup/package.json").version || "latest";
  } catch (err) {
    console.log("Could not read rollup version, using latest.");
  }

  try {
    require.resolve(pkgName);
    console.log(`${pkgName} already installed.`);
  } catch (err) {
    console.log(`Installing missing native package: ${pkgName}@${rollupVersion}`);
    execSync(`npm install --no-save ${pkgName}@${rollupVersion}`, {
      stdio: "inherit"
    });
  }
}

main();
