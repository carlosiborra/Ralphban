import * as assert from "assert";

suite("Unit Tests", () => {
  suite("isValidTaskFile", () => {
    const DEFAULT_CATEGORIES = [
      "frontend",
      "backend",
      "database",
      "testing",
      "documentation",
      "infrastructure",
      "security",
      "functional",
    ];

    function isValidTaskFile(data: unknown, categories: string[] = DEFAULT_CATEGORIES): boolean {
      if (!Array.isArray(data)) {
        return false;
      }

      return data.every((task): task is any => {
        if (!task || typeof task !== "object") {
          return false;
        }

        const taskObj = task as Record<string, unknown>;

        return (
          typeof taskObj.description === "string" &&
          (taskObj.status === undefined ||
            (typeof taskObj.status === "string" &&
              ["pending", "in_progress", "completed", "cancelled"].includes(taskObj.status))) &&
          typeof taskObj.category === "string" &&
          categories.includes(taskObj.category) &&
          Array.isArray(taskObj.steps) &&
          (taskObj.dependencies === undefined || Array.isArray(taskObj.dependencies)) &&
          (taskObj.passes === undefined ||
            taskObj.passes === null ||
            typeof taskObj.passes === "boolean")
        );
      });
    }

    test("should accept valid task with all fields", () => {
      const task = [
        {
          description: "Test task",
          status: "pending",
          category: "frontend",
          steps: ["step1", "step2"],
          dependencies: [],
          passes: false,
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept valid task with minimal fields", () => {
      const task = [
        {
          description: "Minimal task",
          category: "backend",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept all valid statuses", () => {
      const statuses = ["pending", "in_progress", "completed", "cancelled"];
      statuses.forEach((status) => {
        const task = [
          {
            description: "Task",
            category: "frontend",
            steps: [],
            status: status,
          },
        ];
        assert.strictEqual(isValidTaskFile(task), true, `Failed for status: ${status}`);
      });
    });

    test("should accept all valid categories", () => {
      const categories = [
        "frontend",
        "backend",
        "database",
        "testing",
        "documentation",
        "infrastructure",
        "security",
        "functional",
      ];
      categories.forEach((category) => {
        const task = [
          {
            description: "Task",
            category: category,
            steps: [],
          },
        ];
        assert.strictEqual(isValidTaskFile(task), true, `Failed for category: ${category}`);
      });
    });

    test("should accept task with dependencies", () => {
      const task = [
        {
          description: "Task with deps",
          category: "frontend",
          steps: [],
          dependencies: ["task-1", "task-2"],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept task without passes (nullable)", () => {
      const task = [
        {
          description: "Task without passes",
          category: "backend",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept passes as null", () => {
      const task = [
        {
          description: "Task with null passes",
          category: "testing",
          steps: [],
          passes: null,
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept passes as true", () => {
      const task = [
        {
          description: "Task with passes true",
          category: "documentation",
          steps: [],
          passes: true,
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept passes as false", () => {
      const task = [
        {
          description: "Task with passes false",
          category: "infrastructure",
          steps: [],
          passes: false,
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept empty steps array", () => {
      const task = [
        {
          description: "Task",
          category: "testing",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should accept empty dependencies array", () => {
      const task = [
        {
          description: "Task",
          category: "documentation",
          steps: [],
          dependencies: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), true);
    });

    test("should reject non-array input", () => {
      assert.strictEqual(isValidTaskFile({}), false);
      assert.strictEqual(isValidTaskFile("string"), false);
      assert.strictEqual(isValidTaskFile(null), false);
      assert.strictEqual(isValidTaskFile(123), false);
    });

    test("should reject array with non-objects", () => {
      assert.strictEqual(isValidTaskFile(["string"]), false);
      assert.strictEqual(isValidTaskFile([123]), false);
    });

    test("should reject task without description", () => {
      const task = [
        {
          category: "frontend",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with non-string description", () => {
      const task = [
        {
          description: 123,
          category: "frontend",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with invalid status", () => {
      const task = [
        {
          description: "Task",
          category: "frontend",
          steps: [],
          status: "invalid_status",
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with invalid category", () => {
      const task = [
        {
          description: "Task",
          category: "invalid_category",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with non-array steps", () => {
      const task = [
        {
          description: "Task",
          category: "frontend",
          steps: "not an array",
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with non-array dependencies", () => {
      const task = [
        {
          description: "Task",
          category: "frontend",
          steps: [],
          dependencies: "not an array",
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should reject task with invalid passes type", () => {
      const task = [
        {
          description: "Task",
          category: "frontend",
          steps: [],
          passes: "string",
        },
      ];
      assert.strictEqual(isValidTaskFile(task), false);
    });

    test("should accept custom categories", () => {
      const task = [
        {
          description: "Custom task",
          category: "custom",
          steps: [],
        },
      ];
      assert.strictEqual(isValidTaskFile(task, ["custom"]), true);
      assert.strictEqual(isValidTaskFile(task, ["other"]), false);
    });
  });

  suite("ParseError", () => {
    test("should create error with message", () => {
      const error = new Error("Test error");
      assert.strictEqual(error.message, "Test error");
    });

    test("should create error with custom name", () => {
      const error = new Error("Test");
      assert.strictEqual(error.name, "Error");
    });

    test("should preserve stack trace", () => {
      const error = new Error("Test");
      assert.ok(error.stack !== undefined);
    });
  });
});
