// Pins the Stoat Home fork's identity values so an upstream sync can't silently revert them.
// Run: node --test test/stoat-home.test.mjs
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("opens the self-hosted instance by default", () => {
  const src = read("src/native/window.ts");
  assert.ok(src.includes('"https://stoat.nicolasyassuda.cloud"'));
  assert.ok(!src.includes('"https://stoat.chat/app"'));
});

test("--force-server still overrides the default", () => {
  const src = read("src/native/window.ts");
  assert.ok(src.includes('app.commandLine.hasSwitch("force-server")'));
  assert.ok(src.includes('app.commandLine.getSwitchValue("force-server")'));
});

test("uses its own Windows notification ID", () => {
  const src = read("src/main.ts");
  assert.ok(src.includes('app.setAppUserModelId("cloud.nicolasyassuda.stoathome")'));
  assert.ok(!src.includes("chat.stoat.notifications"));
});

test("uses its own auto-start entry", () => {
  const src = read("src/native/autoLaunch.ts");
  assert.match(src, /name:\s*"Stoat Home"/);
});

test("tray shows Stoat Home", () => {
  const src = read("src/native/tray.ts");
  assert.ok(src.includes('tray.setToolTip("Stoat Home")'));
  assert.ok(src.includes('label: "Stoat Home"'));
  assert.ok(!src.includes("Stoat for Desktop"));
});

const pkg = JSON.parse(read("package.json"));
const forge = read("forge.config.ts");

test("has its own settings folder name", () => {
  assert.equal(pkg.productName, "stoat-home");
});

test("updater repo and publisher repo are the same fork, not upstream", () => {
  const [owner, name] = pkg.repository.split("/");
  assert.equal(name, "for-desktop");
  assert.notEqual(owner, "stoatchat");
  assert.match(
    forge,
    new RegExp(`owner:\\s*"${owner}",\\s*name:\\s*"${name}"`),
  );
  assert.ok(!forge.includes('owner: "stoatchat"'));
});

test("publishes releases the updater can see", () => {
  assert.match(forge, /draft:\s*false/);
  assert.match(forge, /prerelease:\s*false/);
});

test("installs under its own names", () => {
  assert.match(forge, /name:\s*"Stoat Home",/);
  assert.match(forge, /execName:\s*"stoat-home",/);
  assert.match(forge, /new MakerSquirrel\(\{\s*\/\/[^\n]*\n\s*name:\s*"StoatHome",/);
});
