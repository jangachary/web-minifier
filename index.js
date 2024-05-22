const fs = require("fs");
const path = require("path");
const minify = require("@node-minify/core");
const UglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");
const cheerio = require("cheerio");
const uglifyJS = require("@node-minify/uglify-js");

// const cssnano = require("@node-minify/cssnano");
const sqwish = require("@node-minify/sqwish");
function replacePHPTags(text) {
  text = text.replace(/<\?php/g, "php_starttag");
  text = text.replace(/\?>/g, "php_closing_tag");
  text = text.replace(/<\?=/g, "php_echo_tag");
  text = text.replace(/\$this->/g, "php_this_arrow");
  return text;
}
function replaceBackPHPTags(text) {
  text = text.replace(/php_starttag/g, "<?php");
  text = text.replace(/php_closing_tag/g, "?>");
  text = text.replace(/php_echo_tag/g, "<?= ");
  text = text.replace(/php_this_arrow/g, "$this->");
  text = text.replace(/&gt;/g, ">");
  return text;
}

const checkDirExist = (outputPath) => {
  console.log("checking " + outputPath);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
};

const minifyFile = async (filePath, outputPath) => {
  let compressor;
  if (filePath.endsWith(".js")) {
    try {
      await minify({
        compressor: uglifyJS,
        input: filePath,
        output: outputPath,
        options: {},
        callback: function (err, min) {
          if (err) {
            console.log("error in min js " + filePath);

            fs.copyFile(filePath, outputPath, (err) => {
              if (err) throw err;
              console.log("source.txt was copied to destination.txt");
            });
          }
        },
      });
      console.log(`Minified ${filePath} and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error minifying ${filePath}:`, error);
    }
  } else if (filePath.endsWith(".css")) {
    try {
      await minify({
        compressor: sqwish,
        input: filePath,
        output: outputPath,
        options: {
          strict: false, // strict optimizations
        },
        callback: function (err, min) {
          console.log("after css min");
        },
      });

      console.log(`Minified ${filePath} and saved to ${outputPath}`);
    } catch (error) {
      fs.copyFile(filePath, outputPath, (err) => {
        if (err) throw err;
        console.log(filePath + " was copied to " + outputPath);
      });
      console.error(`Error minifying ${filePath}:`, error);
    }
  } else if (filePath.endsWith(".php")) {
    try {
      let content = fs.readFileSync(filePath, "utf8");
      let replaced_content = replacePHPTags(content);

      const $ = cheerio.load(replaced_content);
      let isMinified = false;
      $("script:not([src])").each((index, element) => {
        isMinified = true;
        const minified = UglifyJS.minify($(element).html());
        $(element).html(minified.code);
      });

      $("style").each((index, element) => {
        isMinified = true;
        const minified = new CleanCSS().minify($(element).html());
        $(element).html(minified.styles);
      });

      if (isMinified) {
        replaced_content = $("body").html(); // $.html();
        replaced_content = replaceBackPHPTags(replaced_content);
        content = replaced_content;
      }

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, content, "utf8");
      console.log(`Minified ${filePath} and saved to ${outputPath}`);
      return;
    } catch (error) {
      console.error(`Error minifying ${filePath}:`, error);
      return;
    }
  } else {
    fs.copyFile(filePath, outputPath, (err) => {
      if (err) throw err;
      console.log(filePath + " was copied to " + outputPath);
    });
    return;
  }
};

// Function to iterate through a directory and minify JS, CSS, and PHP files
const processDirectory = async (inputDir, outputDir, rootInputDir) => {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const relativePath = path.relative(rootInputDir, filePath);
    const outputPath = path.join(outputDir, relativePath);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await processDirectory(filePath, outputDir, rootInputDir);
    } else if (
      !filePath.includes(".min.") &&
      (filePath.endsWith(".js") ||
        filePath.endsWith(".css") ||
        filePath.endsWith(".php"))
    ) {
      try {
        checkDirExist(outputPath);
        await minifyFile(filePath, outputPath);
      } catch (error) {}
    } else {
      checkDirExist(outputPath);
      fs.copyFile(filePath, outputPath, (err) => {
        if (err) throw err;
        console.log("source.txt was copied to destination.txt");
      });
    }
  }
};

// Hardcoded input and output directories
const inputDir = path.resolve("E:\\test\\app");
const outputDir = path.resolve("E:\\test\\app_dist");

// Start the process
processDirectory(inputDir, outputDir, inputDir)
  .then(() => {
    console.log("Minification complete for all JS, CSS, and PHP files.");
  })
  .catch((error) => {
    console.error("Error during minification:", error);
  });
