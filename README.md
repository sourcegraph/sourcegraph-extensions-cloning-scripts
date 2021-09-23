# Sourcegraph extensions cloning scripts

Used to produce a directory of Sourcegraph extensions for customers to publish to their private registries.

### Steps

#### Prepare the Extension Bundles
1. Edit `extensions.txt` to include the list of extension IDs desired.
   - Find the extension ID by looking at the **Extension ID** label on the extension found on https://sourcegraph.com/extensions or by using `src extensions list` against sourcegraph.com
   - Each extension ID should be on its own line.
2. Run `npm run build` in the top level directory where `extensions.txt` resides.
   - This will create a `./bundles` directory with:
      - each extension bundle + manifest in its own directory.
      - a `publish.js` script that will be used to publish the extensions to a private registry.
      - a `README.md` file

#### Publish the Extension Bundles
1. (Optional) If the publish step will be performed by another user, simply provide them with the `bundles` folder.
2. From the `bundles` folder, run `npm run publish`.
   - This runs the `publish.js` script in the `bundles` folder.
   - The script requires the following environment variables:
     |Environment Variable|Description|
     |--------------------|-----------|
     | `SRC_ENDPOINT` | See `src-cli`'s [README](https://github.com/sourcegraph/src-cli#log-into-your-sourcegraph-instance) for more information. |
     | `SRC_ACCESS_TOKEN` | See `src-cli`'s [README](https://github.com/sourcegraph/src-cli#log-into-your-sourcegraph-instance) for more information. |
     | `PUBLISHER` | The name of the [publisher](https://docs.sourcegraph.com/extensions/authoring/manifest#fields) |

   - NOTE: You do _not_ need to have `src-cli` installed for this script to work.
