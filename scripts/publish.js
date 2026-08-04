const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function log(step, message) {
    console.log(`[${new Date().toISOString()}] [${step}] ${message}`);
}

function run(command, step) {
    log(step, `Running: ${command}`);
    const start = Date.now();

    execSync(command, { stdio: "inherit" });

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(step, `Completed in ${duration}s`);
}

try {
    log("INIT", "Starting GitHub release process");

    const packagePath = path.join(__dirname, "..", "package.json");
    log("INIT", `Reading package.json from: ${packagePath}`);

    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const version = pkg.version;
    const tag = `v${version}`;

    log("INIT", `Detected version: ${version}`);
    log("INIT", `Release tag: ${tag}`);

    // Assets to upload
    const assets = [
        "android/app/build/outputs/apk/release/audiovibes-arm64-v8a.apk",
        "android/app/build/outputs/apk/release/audiovibes-armeabi-v7a.apk",
    ];

    log("CHECK", "Checking git working tree");
    run("git diff --quiet", "GIT");
    log("CHECK", "Git working tree is clean");

    log("TAG", `Creating git tag: ${tag}`);
    run(`git tag ${tag}`, "TAG");

    log("PUSH", "Pushing main branch");
    run("git push origin main", "PUSH");

    log("PUSH", `Pushing tag: ${tag}`);
    run(`git push origin ${tag}`, "PUSH");

    log("ASSETS", "Verifying release assets");
    assets.forEach((file, index) => {
        const absolute = path.resolve(file);
        log("ASSETS", `Checking asset ${index + 1}/${assets.length}: ${absolute}`);

        if (!fs.existsSync(file)) {
            throw new Error(`Asset not found: ${absolute}`);
        }

        const size = (fs.statSync(file).size / (1024 * 1024)).toFixed(2);
        log("ASSETS", `Found asset (${size} MB): ${path.basename(file)}`);
    });

    log("RELEASE", "Creating GitHub release");
    run(
        `gh release create ${tag} ${assets.join(" ")} --title "${tag}" --generate-notes`,
        "RELEASE"
    );

    log("DONE", `GitHub release ${tag} created successfully`);
} catch (err) {
    log("ERROR", err.message);
    if (err.stack) {
        console.error(err.stack);
    }
    process.exit(1);
}