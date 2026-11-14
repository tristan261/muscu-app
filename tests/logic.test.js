/* Tests des règles de FORGE V2. Lancer : node tests/logic.test.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(p, "utf8");
const src = ["data", "store", "logic"].map((f) => read(path.join(root, "js", f + ".js"))).join("\n");
const mem = {};
const localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const body = src + "\nconst SRC = " + JSON.stringify(src) + ";\n" + read(path.join(__dirname, "cases.js")) + "\nreturn { results, failed };";
const run = new Function("localStorage", "document", "indexedDB", "mem", "assert", body);
const { results, failed } = run(localStorage, {}, {}, mem, require("assert"));
console.log(results.join("\n"));
console.log(failed ? "\n" + failed + " test(s) en échec" : "\n" + results.length + " tests OK");
process.exit(failed ? 1 : 0);
