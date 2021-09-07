# Sourcegraph extensions cloning scripts

Used to produce a directory of Sourcegraph for customers to publish to their private registries.

### Steps

- Edit `extensions.txt` to include the list of extension IDs the customer wants to clone. Each extension ID should be on its own line.
- Run `npm run build`, which will create a `./bundles` directory with each extension bundle + manifest in its own directory and a `publish.js` script that publishes the cloned extensions to their private registry.
- We give the `./bundles` directory to customers who may want to audit the bundles and script inside. They then run `npm run publish`, which runs the `publish.js` script.
  - The script will look for the `SRC_ENDPOINT` and `SRC_ACCESS_TOKEN` environment variables. Read `src-cli`'s [README](https://github.com/sourcegraph/src-cli#log-into-your-sourcegraph-instance) for more information about these environment variables. NOTE: the customer does _not_ need to have `src-cli` installed for this script to work.
