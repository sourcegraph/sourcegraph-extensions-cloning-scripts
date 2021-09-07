const fs = require("fs");
const https = require("https");

(async function main() {
  const extensionIDs = getExtensionIDs();
  const extensions = await getExtensions(extensionIDs);
  console.log(extensionIDs, JSON.stringify(extensions));
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

function createBundlesDirectory() {}

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
          error.push({ extensionID: id, error });
          return null;
        })
      )
    )
  ).filter(Boolean);

  // Log errors TODO

  return extensions;
}

/**
 * Fetches extension metadata from sourcegraph.com, downloads the extension bundle, then returns
 * a Promise for data necessary to publish the extension.
 */
async function getExtension(extensionID) {
  const extensionQuery = JSON.stringify({
    query: `query Extension() {
        extensionRegistry {
            extension(extensionID: "${extensionID}") {
             extensionID
              manifest {
                bundleURL
              }
            }
          }
        }`,
  });

  const extensionMetadata = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "sourcegraph.com",
        path: "/.api/graphql",
        method: "POST",
      },
      (res) => {
        const chunks = [];

        res.on("data", (data) => chunks.push(data));

        res.on("end", () => {
          resolve(JSON.parse(Buffer.concat(chunks)));
        });
      }
    );

    req.on("error", reject);
    req.write(extensionQuery);
    req.end();
  });

  // Download extension bundle TODO

  return { extensionID, manifest: extensionMetadata, bundle: "" };
}
