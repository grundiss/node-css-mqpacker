#!/usr/bin/env node

"use strict";

var mqpacker = require("../index");
var fs = require("fs");
var minimist = require("minimist");
var pkg = require("../package.json");

var binname = Object.keys(pkg.bin)[0];
var showHelp = function () {
  console.log("Usage: " + binname + " [options] INPUT [OUTPUT]");
  console.log("");
  console.log("Description:");
  console.log("  " + pkg.description);
  console.log("");
  console.log("Options:");
  console.log("  -s, --sort       Sort `min-width` queries.");
  console.log("      --sourcemap  Create source map file.");
  console.log("  -h, --help       Show this message.");
  console.log("  -v, --version    Print version information.");
  console.log("");
  console.log("Use a single dash for INPUT to read CSS from standard input.");

  return;
};
var pack = function (s, o) {
  mqpacker.pack(s, o).then(function (result) {
    if (!o.to) {
      process.stdout.write(result.css);

      return;
    }

    fs.writeFileSync(o.to, result.css);

    if (result.map) {
      fs.writeFileSync(o.to + ".map", result.map);
    }
  }).catch(function (error) {
    if (error.name === "CssSyntaxError") {
      console.error([
        error.file,
        error.line,
        error.column,
        " " + error.reason
      ].join(":"));
      process.exit(1);
    }

    throw error;
  });
};
var argv = minimist(process.argv.slice(2), {
  boolean: [
    "help",
    "sort",
    "sourcemap",
    "version"
  ],
  alias: {
    "h": "help",
    "s": "sort",
    "v": "version"
  },
  default: {
    "help": false,
    "sourcemap": false,
    "sort": false,
    "version": false
  }
});

if (argv._.length < 1) {
  argv.help = true;
}

switch (true) {
case argv.version:
  console.log(binname + " v" + pkg.version);

  break;

case argv.help:
  showHelp();

  break;

default:
  var css = "";
  var options = {};

  if (argv.sort) {
    options.sort = true;
  }

  if (argv.sourcemap) {
    options.map = true;
  }

  options.from = argv._[0];

  if (argv._[1]) {
    options.to = argv._[1];
  }

  if (options.map && options.to) {
    options.map = {
      inline: false
    };
  }

  if (options.from === "-") {
    delete options.from;
    argv._[0] = process.stdin.fd;
  }

  css = fs.readFileSync(argv._[0], "utf8");
  pack(css, options);
}
