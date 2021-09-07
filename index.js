const fs = require("fs");
const https = require("https");

(async function main() {
  const extensionIDs = getExtensionIDs();
  const extensions = await getExtensions();
  console.log(extensionIDs, extensions);
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
async function getExtensions() {
  const extensionsQuery = JSON.stringify({
    query: `query Extensions() {
                extensionRegistry {
                    extensions(query: "sourcegraph") {
                        nodes{
                            extensionID
                            url
                        }
                        error
                    }
                }
            }`,
  });

  return new Promise((resolve, reject) => {
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
    req.write(extensionsQuery);
    req.end();
  });
}
