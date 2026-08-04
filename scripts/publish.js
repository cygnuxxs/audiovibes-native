const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;

// Assets to upload
const assets = [
    "android/app/build/outputs/apk/release/audiovibes-arm64-v8a.apk",
    "android/app/build/outputs/apk/release/audiovibes-armeabi-v7a.apk"
];

try {
    console.log(`Releasing ${tag}...`);

    // Ensure git is clean
    execSync("git diff --quiet", { stdio: "inherit" });

    // Create tag
    execSync(`git tag ${tag}`, { stdio: "inherit" });

    // Push commits and tag
    execSync("git push origin main", { stdio: "inherit" });
    execSync(`git push origin ${tag}`, { stdio: "inherit" });

    // Verify assets exist
    assets.forEach((file) => {
        if (!fs.existsSync(file)) {
            throw new Error(`Asset not found: ${file}`);
        }
    });

    // Create GitHub release with assets
    execSync(
        `gh release create ${tag} ${assets.join(" ")} --title "${tag}" --generate-notes`,
        { stdio: "inherit" }
    );

    console.log(`GitHub release ${tag} created successfully.`);
} catch (err) {
    console.error(err.message);
    process.exit(1);
}