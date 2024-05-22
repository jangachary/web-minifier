const fs = require("fs");
const path = require("path");
const minify = require("@node-minify/core");
const uglifyJS = require("@node-minify/uglify-js");
const cleanCSS = require("@node-minify/clean-css");

// Function to minify a file based on its type
const minifyFile = async (filePath, outputPath) => {
  let compressor;

  if (filePath.endsWith(".js")) {
    compressor = uglifyJS;
  } else if (filePath.endsWith(".css")) {
    compressor = cleanCSS;
  } else {
    return;
  }

  try {
    // Ensure the output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await minify({
      compressor: compressor,
      input: filePath,
      output: outputPath,
    });

    console.log(`Minified ${filePath} and saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error minifying ${filePath}:`, error);
  }
};

// Function to iterate through a directory and minify JS and CSS files
const processDirectory = async (inputDir, outputDir, rootInputDir) => {
  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const relativePath = path.relative(rootInputDir, filePath);
    const outputPath = path.join(outputDir, relativePath);
    const stat = fs.statSync(filePath);
    console.log("checking " + filePath);
    if (stat.isDirectory()) {
      await processDirectory(filePath, outputDir, rootInputDir);
    } else if (
      !filePath.includes(".min.") &&
      (filePath.endsWith(".js") || filePath.endsWith(".css"))
    ) {
      await minifyFile(filePath, outputPath);
    }
  }
};

// Hardcoded input and output directories
const inputDir = path.resolve("E:\\test\\app");
const outputDir = path.resolve("E:\\test\\app_dist");

// Start the process
processDirectory(inputDir, outputDir, inputDir)
  .then(() => {
    console.log("Minification complete for all JS and CSS files.");
  })
  .catch((error) => {
    console.error("Error during minification:", error);
  });
