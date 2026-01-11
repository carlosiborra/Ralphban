import Ajv, { type ValidateFunction } from "ajv";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type { TaskFile } from "./types";

interface HasTasksProperty {
  tasks: unknown;
}

function hasTasksProperty(obj: unknown): obj is HasTasksProperty {
  return typeof obj === "object" && obj !== null && "tasks" in obj;
}

let schemaValidator: ValidateFunction | null = null;
let schemaLoadPromise: Promise<ValidateFunction> | null = null;

async function loadSchemaValidator(): Promise<ValidateFunction> {
  if (schemaValidator) {
    return schemaValidator;
  }

  if (schemaLoadPromise) {
    return schemaLoadPromise;
  }

  schemaLoadPromise = (async () => {
    let schemaContent: string;

    const extension = vscode.extensions.getExtension("carlosiborra.ralphban");
    if (extension) {
      const schemaUri = extension.extensionUri.with({
        path: `${extension.extensionUri.path}/schemas/task-schema.json`,
      });
      const uint8Array = await vscode.workspace.fs.readFile(schemaUri);
      schemaContent = Buffer.from(uint8Array).toString("utf8");
    } else {
      const schemaPath = path.join(__dirname, "..", "schemas", "task-schema.json");
      schemaContent = fs.readFileSync(schemaPath, "utf8");
    }

    const schema = JSON.parse(schemaContent);

    const ajv = new Ajv({ allErrors: true });
    schemaValidator = ajv.compile(schema);
    schemaLoadPromise = null;
    return schemaValidator;
  })();

  return schemaLoadPromise;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly errors?: string[]
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export async function parseTaskFile(uri: vscode.Uri): Promise<TaskFile> {
  try {
    const uint8Array = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(uint8Array).toString("utf8");

    let jsonData: unknown;
    try {
      jsonData = JSON.parse(content);
    } catch (error) {
      throw new ParseError(`Failed to parse JSON in file: ${uri.fsPath}`, [
        error instanceof Error ? error.message : "Unknown parsing error",
      ]);
    }

    const validator = await loadSchemaValidator();

    // Support files where the tasks are wrapped in a 'tasks' property
    let validationData = jsonData;
    if (hasTasksProperty(jsonData)) {
      validationData = jsonData.tasks;
    }

    const isValid = validator(validationData);

    if (!isValid) {
      const errorMessages = validator.errors?.map((err) => {
        const path = err.instancePath || "root";
        const message = err.message || "Unknown error";
        return `${path}: ${message}`;
      }) || ["Unknown validation error"];

      throw new ParseError(`JSON validation failed for file: ${uri.fsPath}`, errorMessages);
    }

    const taskFile = validationData as TaskFile;
    return taskFile;
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }

    throw new ParseError(`Failed to read or validate task file: ${uri.fsPath}`, [
      error instanceof Error ? error.message : "Unknown error",
    ]);
  }
}

export async function validateTaskFile(
  jsonData: unknown
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    const validator = await loadSchemaValidator();

    // Support files where the tasks are wrapped in a 'tasks' property
    let validationData = jsonData;
    if (hasTasksProperty(jsonData)) {
      validationData = jsonData.tasks;
    }

    const isValid = validator(validationData);

    if (!isValid) {
      const errorMessages = validator.errors?.map((err) => {
        const path = err.instancePath || "root";
        const message = err.message || "Unknown error";
        return `${path}: ${message}`;
      }) || ["Unknown validation error"];

      return { valid: false, errors: errorMessages };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
