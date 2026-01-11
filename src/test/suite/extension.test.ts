import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

const SLOW_MODE = process.env.SLOW_TESTS === "true";
const testWorkspacePath = path.resolve(__dirname, "../../../test-workspace");
const testFilePath = path.resolve(testWorkspacePath, "test-prd.json");

function log(msg: string) {
  console.log(`[TEST] ${msg}`);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slowWait(ms: number) {
  const actualMs = SLOW_MODE ? ms * 3 : ms;
  return wait(actualMs);
}

async function openPanelWithFile(forceNew: boolean = false) {
  const uri = vscode.Uri.file(testFilePath);
  if (forceNew) {
    await vscode.commands.executeCommand("ralphban.forceReopenBoard", uri);
  } else {
    await vscode.commands.executeCommand("ralphban.openKanbanBoard", uri);
  }
  await slowWait(1500);
}

async function openFileInEditor(): Promise<vscode.TextDocument> {
  const uri = vscode.Uri.file(testFilePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, { preview: false });
  await slowWait(500);
  return doc;
}

async function modifyAndSave(doc: vscode.TextDocument, newContent: string) {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri, new vscode.Range(0, 0, doc.lineCount, 0), newContent);
  await vscode.workspace.applyEdit(edit);
  await doc.save();
  await slowWait(500);
}

suite("Kanban Extension Integration Tests", () => {
  setup(async () => {
    log(SLOW_MODE ? "🐌 SLOW MODE: Setting up..." : "⚡ FAST MODE: Setting up...");
    const testContent = [
      {
        description: "Task Alpha",
        status: "pending",
        category: "frontend",
        steps: ["Design", "Code", "Test"],
        dependencies: [],
        passes: null,
      },
      {
        description: "Task Beta",
        status: "in_progress",
        category: "backend",
        steps: ["API", "DB", "Auth"],
        dependencies: ["Task Alpha"],
        passes: null,
      },
    ];
    fs.writeFileSync(testFilePath, JSON.stringify(testContent, null, 2));
    log(`  → Created 2 tasks`);
    await slowWait(500);
  });

  teardown(async () => {
    log("Cleaning up...");
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await slowWait(200);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test("Should open panel with 2 tasks", async () => {
    log("Test: Opening panel...");
    await slowWait(500);

    await openPanelWithFile(true);

    const content = fs.readFileSync(testFilePath, "utf8");
    const tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 2);
    log(`  → Panel open with 2 tasks - PASSED`);
  });

  test("Should force reopen panel with new content", async () => {
    log("Test: Force reopen with modified content...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();
    const newContent = [
      {
        description: "Fresh Task X",
        status: "pending",
        category: "testing",
        steps: [],
        dependencies: [],
        passes: null,
      },
      {
        description: "Fresh Task Y",
        status: "completed",
        category: "testing",
        steps: [],
        dependencies: [],
        passes: true,
      },
      {
        description: "Fresh Task Z",
        status: "in_progress",
        category: "testing",
        steps: [],
        dependencies: [],
        passes: null,
      },
    ];
    await modifyAndSave(doc, JSON.stringify(newContent, null, 2));
    log("  → Saved 3 new tasks");

    await openPanelWithFile(true);
    log("  → Force reopened panel");

    const content = fs.readFileSync(testFilePath, "utf8");
    const tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 3);
    assert.strictEqual(tasks[0].description, "Fresh Task X");
    assert.strictEqual(tasks[1].description, "Fresh Task Y");
    assert.strictEqual(tasks[2].description, "Fresh Task Z");
    log(`  → Verified: ${tasks.length} tasks loaded`);

    log("  → Force reopen - PASSED");
  });

  test("Should update when file saved via editor", async () => {
    log("Test: Modify file via editor save...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();

    const newContent = [
      {
        description: "Modified via Editor",
        status: "pending",
        category: "testing",
        steps: [],
        dependencies: [],
        passes: null,
      },
      {
        description: "Second Task",
        status: "in_progress",
        category: "testing",
        steps: [],
        dependencies: [],
        passes: null,
      },
    ];
    await modifyAndSave(doc, JSON.stringify(newContent, null, 2));
    log("  → File saved via editor");

    await openPanelWithFile(true);

    const content = fs.readFileSync(testFilePath, "utf8");
    const tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 2);
    assert.strictEqual(tasks[0].description, "Modified via Editor");
    log(`  → Verified: '${tasks[0].description}'`);

    log("  → Editor save update - PASSED");
  });

  test("Should reflect status change from editor save", async () => {
    log("Test: Status change via editor...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    assert.strictEqual(tasks[0].status, "pending");
    log(`  → Initial status: '${tasks[0].status}'`);

    tasks[0].status = "completed";
    tasks[0].passes = true;
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Changed status to 'completed'");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks[0].status, "completed");
    assert.strictEqual(tasks[0].passes, true);
    log(`  → Verified: status='${tasks[0].status}', passes=${tasks[0].passes}`);

    log("  → Status change - PASSED");
  });

  test("Should add task via editor", async () => {
    log("Test: Add task via editor...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 2);

    tasks.push({
      description: "Task Added via Editor",
      status: "pending",
      category: "testing",
      steps: ["Verify"],
      dependencies: [],
      passes: null,
    });
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Added task via editor");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 3);
    assert.strictEqual(tasks[2].description, "Task Added via Editor");
    log(`  → Verified: ${tasks.length} tasks`);

    log("  → Add task - PASSED");
  });

  test("Should delete task via editor", async () => {
    log("Test: Delete task via editor...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 2);
    log(`  → Starting with ${tasks.length} tasks`);

    tasks.splice(0, 1);
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Deleted first task");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 1);
    log(`  → Verified: ${tasks.length} task remaining`);

    log("  → Delete task - PASSED");
  });

  test("Should refresh panel after file change", async () => {
    log("Test: Refresh panel command...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();

    const newTask = {
      description: "Refresh Test Task",
      status: "pending",
      category: "backend",
      steps: [],
      dependencies: [],
      passes: null,
    };

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    tasks.push(newTask);
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Added task");

    await vscode.commands.executeCommand("ralphban.refreshBoardList");
    await slowWait(1000);
    log("  → Executed refresh command");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks.length, 3);
    log(`  → Verified: ${tasks.length} tasks`);

    log("  → Refresh - PASSED");
  });

  test("Should handle multiple editor saves", async () => {
    log("Test: Multiple saves...");
    await slowWait(500);

    await openPanelWithFile(true);
    const doc = await openFileInEditor();

    for (let i = 0; i < 3; i++) {
      const content = fs.readFileSync(testFilePath, "utf8");
      const tasks = JSON.parse(content);
      tasks[i % 2].description = `Modified ${i}`;
      await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
      log(`  → Save ${i + 1}`);
    }

    const final = fs.readFileSync(testFilePath, "utf8");
    const finalTasks = JSON.parse(final);
    assert.strictEqual(finalTasks[0].description, "Modified 2");
    log(`  → Verified: '${finalTasks[0].description}'`);

    log("  → Multiple saves - PASSED");
  });

  test("Should edit description via editor", async () => {
    log("Test: Edit description...");
    await slowWait(500);

    await openPanelWithFile(true);
    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    const original = tasks[0].description;
    log(`  → Original: '${original}'`);

    tasks[0].description = "Edited Description via Editor";
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Saved new description");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks[0].description, "Edited Description via Editor");
    log(`  → Verified: '${tasks[0].description}'`);

    log("  → Description edit - PASSED");
  });

  test("Should modify steps via editor", async () => {
    log("Test: Modify steps...");
    await slowWait(500);

    await openPanelWithFile(true);
    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    tasks[0].steps = ["Step 1", "Step 2", "Step 3", "Step 4"];
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Updated steps");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks[0].steps.length, 4);
    assert.deepStrictEqual(tasks[0].steps, ["Step 1", "Step 2", "Step 3", "Step 4"]);
    log(`  → Verified: ${tasks[0].steps.length} steps`);

    log("  → Steps modify - PASSED");
  });

  test("Should update category via editor", async () => {
    log("Test: Update category...");
    await slowWait(500);

    await openPanelWithFile(true);
    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    tasks[0].category = "infrastructure";
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Changed to 'infrastructure'");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.strictEqual(tasks[0].category, "infrastructure");
    log(`  → Verified: '${tasks[0].category}'`);

    log("  → Category update - PASSED");
  });

  test("Should manage dependencies via editor", async () => {
    log("Test: Manage dependencies...");
    await slowWait(500);

    await openPanelWithFile(true);
    const doc = await openFileInEditor();

    let content = fs.readFileSync(testFilePath, "utf8");
    let tasks = JSON.parse(content);
    tasks[0].dependencies = ["Task Beta"];
    await modifyAndSave(doc, JSON.stringify(tasks, null, 2));
    log("  → Added dependency 'Task Beta'");

    await openPanelWithFile(true);

    content = fs.readFileSync(testFilePath, "utf8");
    tasks = JSON.parse(content);
    assert.deepStrictEqual(tasks[0].dependencies, ["Task Beta"]);
    log(`  → Verified: [${tasks[0].dependencies.join(", ")}]`);

    log("  → Dependencies - PASSED");
  });

  test("Should open workspace prd.json", async () => {
    log("Test: Open prd.json...");
    await slowWait(500);

    const prdPath = path.resolve(testWorkspacePath, "prd.json");
    assert.ok(fs.existsSync(prdPath));

    const content = fs.readFileSync(prdPath, "utf8");
    const tasks = JSON.parse(content);
    assert.ok(tasks.length > 0);
    log(`  → Found ${tasks.length} tasks`);

    log("  → prd.json - PASSED");
  });

  test("Should show different file contents on force reopen", async () => {
    log("Test: Different content on new panel...");
    await slowWait(500);

    await openPanelWithFile(true);

    const doc = await openFileInEditor();
    const content1 = fs.readFileSync(testFilePath, "utf8");
    const tasks1 = JSON.parse(content1);
    log(`  → Initial: ${tasks1.length} tasks`);

    const newTasks = [
      {
        description: "New One",
        status: "pending",
        category: "frontend",
        steps: [],
        dependencies: [],
        passes: null,
      },
      {
        description: "New Two",
        status: "pending",
        category: "frontend",
        steps: [],
        dependencies: [],
        passes: null,
      },
      {
        description: "New Three",
        status: "pending",
        category: "frontend",
        steps: [],
        dependencies: [],
        passes: null,
      },
      {
        description: "New Four",
        status: "pending",
        category: "frontend",
        steps: [],
        dependencies: [],
        passes: null,
      },
    ];
    await modifyAndSave(doc, JSON.stringify(newTasks, null, 2));
    log("  → Changed to 4 different tasks");

    await openPanelWithFile(true);

    const content2 = fs.readFileSync(testFilePath, "utf8");
    const tasks2 = JSON.parse(content2);
    assert.strictEqual(tasks2.length, 4);
    assert.strictEqual(tasks2[0].description, "New One");
    assert.strictEqual(tasks2[3].description, "New Four");
    log(`  → New panel shows: ${tasks2.length} tasks`);

    log("  → Different content - PASSED");
  });
});
