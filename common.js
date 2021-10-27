/*
 * Extracts the version SHA from the manifest URL
 * @param jsonManifest JSON object representing the manifest.
 *        expecting to have a 'url' at root level of format:
 *        "https://sourcegraph.com/-/static/extension/13212-sourcegraph-verilog.js?cf8s0z1vs41c--sourcegraph-verilog"
 * @return string version
 */
function getExtensionVersion(jsonManifest) {
  const url = new URL(jsonManifest['url']);
  // .search.substr(1) to remove the '?'
  const version = url.search.substr(1);
  // now remove the extension ID (everything after --)
  return version.substr(0, version.indexOf('--'));
}

module.exports = { getExtensionVersion }
