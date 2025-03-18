import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI("AIzaSyBl5lM6Md8_YbDt7o-rmB2SiIyppPT32dU"); // Replace with your Gemini API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to scan directory structure
function scanDirectory(dirPath) {
  const structure = {};

  function readDirSync(currentPath, relativePath) {
    const items = fs.readdirSync(currentPath);
    structure[relativePath] = { dirs: [], files: [] };

    items.forEach((item) => {
      const itemPath = path.join(currentPath, item);
      const relItemPath = path.join(relativePath, item);
      if (fs.lstatSync(itemPath).isDirectory()) {
        structure[relativePath].dirs.push(item);
        readDirSync(itemPath, relItemPath);
      } else {
        structure[relativePath].files.push(item);
      }
    });
  }

  readDirSync(dirPath, ".");
  return structure;
}

// Function to create a directory
function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created: ${dirPath}`);
  }
}

// Function to move a file
function moveFile(source, destination) {
  if (fs.existsSync(source)) {
    const destinationDir = path.dirname(destination);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    fs.renameSync(source, destination);
    console.log(`Moved ${source} to ${destination}`);
  }
}

// Function to rename a file
function renameFile(oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${oldPath} to ${newPath}`);
  }
}

// Function to preprocess AI response and extract JSON
function extractJSON(response) {
  // Remove markdown code block syntax (```json and ```)
  const jsonString = response.replace(/```json|```/g, "").trim();
  return jsonString;
}

// Function to generate a plan using Gemini
async function generatePlan(dirStructure, userInstruction) {
  const prompt = `
    Directory Structure:
    ${JSON.stringify(dirStructure, null, 2)}

    User Instruction:
    ${userInstruction}

    Generate a step-by-step plan to organize the directory. Use the following tools:
    - createDirectory(dirPath): Create a directory.
    - moveFile(source, destination): Move a file.
    - renameFile(oldPath, newPath): Rename a file.

    Format the plan as a JSON array of steps. Each step should have:
    - action: The action to perform (e.g., "createDirectory", "moveFile", "renameFile").
    - details: The details of the action (e.g., source, destination).

    Example:
    [
      {
        "action": "createDirectory",
        "details": { "dirPath": "./Documents" }
      },
      {
        "action": "moveFile",
        "details": { "source": "./file1.txt", "destination": "./Documents/file1.txt" }
      }
    ]
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textResponse = response.text();

  // Preprocess the response to extract valid JSON
  const jsonString = extractJSON(textResponse);
  console.log("Extracted JSON:", jsonString);

  try {
    const plan = JSON.parse(jsonString);
    return plan;
  } catch (error) {
    console.error("Failed to parse JSON:", error.message);
    throw new Error("Invalid JSON response from AI.");
  }
}

// Function to execute the plan
function executePlan(plan, baseDir) {
  plan.forEach((step) => {
    switch (step.action) {
      case "createDirectory":
        const dirPath = path.join(baseDir, step.details.dirPath);
        createDirectory(dirPath);
        break;
      case "moveFile":
        const source = path.join(baseDir, step.details.source);
        const destination = path.join(baseDir, step.details.destination);
        moveFile(source, destination);
        break;
      case "renameFile":
        const oldPath = path.join(baseDir, step.details.oldPath);
        const newPath = path.join(baseDir, step.details.newPath);
        renameFile(oldPath, newPath);
        break;
      default:
        console.log(`Unknown action: ${step.action}`);
    }
  });
  console.log("Task completed.");
}

// Main function to organize directory
async function organizeDirectory(dirPath, userInstruction) {
  try {
    // Step 1: Analyze directory
    const dirStructure = scanDirectory(dirPath);
    console.log("Directory structure analyzed.");

    // Step 2: Generate plan using AI
    const plan = await generatePlan(dirStructure, userInstruction);
    console.log("AI-generated plan:", JSON.stringify(plan, null, 2));

    // Step 3: Execute plan
    executePlan(plan, dirPath);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Export the organizeDirectory function for use in the server
export { organizeDirectory };
