const fs = require("fs");
const https = require("https");

(async function main() {
  const extensionIDs = getExtensionIDs();
  const extensions = await getExtensions(extensionIDs);
  await createBundlesDirectory(extensions);
})();

/**
 * Reads the list of extension IDs to be cloned from `./extensions.txt`.
 */
function getExtensionIDs() {
  const rawExtensionIDs = fs.readFileSync("./extensions.txt", "utf-8");
  const extensionIDs = rawExtensionIDs
    .split("\n")
    .map((id) => id.trim())
    .filter(Boolean);

  return extensionIDs;
}

/**
 * Fetches extension bundles + manifests from sourcegraph.com.
 */
async function getExtensions(extensionIDs) {
  // Log errored extension downloads
  const errors = [];

  const extensions = (
    await Promise.all(
      extensionIDs.map((id) =>
        getExtension(id).catch((error) => {
          errors.push({ extensionID: id, error });
          return null;
        })
      )
    )
  ).filter(Boolean);

  for (const { extensionID, error } of errors) {
    console.error(`Failed to query extension: ${extensionID}`, error);
  }

  return extensions;
}

/**
 * Fetches extension metadata from sourcegraph.com, downloads the extension bundle, then returns
 * a Promise for data necessary to publish the extension.
 */
async function getExtension(extensionID) {
  const extensionQuery = JSON.stringify({
    query: `query Extension($extensionID: String!) {
        extensionRegistry {
            extension(extensionID: $extensionID) {
             extensionID
              manifest {
                  raw
                bundleURL
              }
            }
          }
        }`,
    variables: {
      extensionID,
    },
  });

  const extensionMetadata = await new Promise((resolve, reject) => {
    const req = https.request(
        {
            hostname: "sourcegraph.com",
            path: "/.api/graphql",
            method: "POST",
            headers: {
                "User-agent":
                    "Mozilla/5.0 (Linux; U; Android 4.1.1; en-gb; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30",
            },
        },
        (res) => {
            const chunks = [];

            res.on("data", (data) => chunks.push(data));

            res.on("end", () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(Buffer.concat(chunks)));
                }
                console.error(
                    `Couldn't load ${extensionID}. StatusCode: ${res.statusCode}`
                );
            });
        }
    );

    req.on("error", reject);
    req.write(extensionQuery);
    req.end();
  });

  const { raw: manifest } =
    extensionMetadata.data.extensionRegistry.extension.manifest;

  if (!manifest) {
    throw new Error(`Could not find raw manifest for ${extensionID}`);
  }

  const { bundleURL } =
    extensionMetadata.data.extensionRegistry.extension.manifest;

  if (!bundleURL) {
    throw new Error(`Could not find bundleURL for ${extensionID}`);
  }

  // Download extension bundle.
  const bundle = await new Promise((resolve, reject) => {
    const req = https.get(bundleURL, (res) => {
      const chunks = [];

      res.on("data", (data) => chunks.push(data));

      res.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
    });

    req.on("error", reject);
    req.end();
  });

  return { extensionID, manifest, bundle };
}

function createBundlesDirectory(extensions) {
  const bundlesPath = "./bundles";
  if (fs.existsSync(bundlesPath)) {
    fs.rmSync(bundlesPath, { recursive: true });
  }
  fs.mkdirSync(bundlesPath);

  // Clone customer instructions and publish script.
  fs.copyFileSync("./to-clone/instructions.md", `${bundlesPath}/README.md`);
  fs.copyFileSync("./to-clone/publish.js", `${bundlesPath}/publish.js`);

  // Create extension directories (to be used by publish script).
  for (const { extensionID, manifest, bundle } of extensions) {
    const extensionFileName = extensionID.replace("/", "-");

    fs.mkdirSync(`${bundlesPath}/${extensionFileName}`);

    fs.writeFileSync(
      `${bundlesPath}/${extensionFileName}/${extensionFileName}.js`,
      bundle,
      "utf8"
    );
    fs.writeFileSync(
      `${bundlesPath}/${extensionFileName}/package.json`,
      manifest,
      "utf8"
    );
  }
}
