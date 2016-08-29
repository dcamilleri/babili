#!/usr/bin/env node
"use strict";

Error.stackTraceLimit = Infinity;

const uglify       = require("uglify-js");
const Table        = require("cli-table");
// const child        = require("child_process");
const chalk        = require("chalk");
const babel        = require("babel-core");
const fs           = require("fs");
const path         = require("path");
// const compile      = require("google-closure-compiler-js").compile;
const preset2015   = require("babel-preset-es2015");
const presetBabili = require("../packages/babel-preset-babili");

// Make it run: node benchmark-pipeline.js ../node_modules/lodash-es

const dirName = process.argv[2];
if (!dirName) {
  console.error("Error: No directory specified");
  process.exit(1);
}

fs.readdir(dirName, init);

let targets = [
  // "closurejs",
  // "closure",
  "babili",
  "uglify"
];

function init(err, files) {
  if (err) {
    throw err;
  }

  const jsFiles = files.filter((fileName) => (/\.js$/i).test(fileName));

  const results = targets
    .map((target) => {
      return jsFiles.map((file) => benchmark(target, file));
    })
    .map((benchmark) => {
      const alltime = benchmark.reduce((prev, next) => prev + next.time, 0);
      return {
        target: benchmark[0].target,
        avg: alltime / benchmark.length
      };
    });

  const table = new Table({
    head: ["", "Transpile + minify"],
    style: {
      "padding-left": 2,
      "padding-right": 2,
      head: ["bold"],
    }
  });

  results.forEach((result) => {
    table.push([
      chalk.bold(result.target),
      result.avg.toFixed(2) + "ms"
    ]);
  });

  console.log(chalk.green("\nResults:"));
  console.log(table.toString());
}

function transpile(code) {
  return babel.transform(code, {
    sourceType: "module",
    presets: [preset2015],
    comments: false,
  }).code;
}

function testBabili(code) {
  return babel.transform(code, {
    sourceType: "module",
    presets: [preset2015, presetBabili],
    comments: false,
  }).code;
}

function testUglify(code) {
  return uglify.minify(code, {
    fromString: true,
  }).code;
}

// function testClosureJs(code) {
  // const flags = {
  //   processCommonJsModules: true,
  //   jsCode: [{ source: code }],
  // };
  // const out = compile(flags);
  // return out.compiledCode;
// }

// function testClosure(fileName) {
  // return child.execSync(
  //   "java -jar " + path.join(__dirname, "gcc.jar") + " --jscomp_off=uselessCode --language_in=ECMASCRIPT6 --language_out=ECMASCRIPT5 " + fileName
  // ).toString();
// }

function benchmark(target, filename) {
  console.log(chalk.blue(`Transpile + minify ${filename} with ${target}...`));

  const filePath = path.join(dirName, filename);
  const code = fs.readFileSync(filePath, "utf8");

  const start = Date.now();

  if (target === "babili") {
    testBabili(code);
  } else if (target === "closure") {
    // @TODO
    // testClosure(filePath);
  } else if (target === "closurejs") {
    // @TODO
    // testClosureJs(code);
  } else if (target === "uglify") {
    const transpiled = transpile(code);
    testUglify(transpiled);
  }

  const end = Date.now();

  const time = end - start;

  return { target, time };
}
