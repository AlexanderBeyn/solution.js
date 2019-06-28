/** @license
 * Copyright 2018 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Manages the creation and deployment of simple item types.
 *
 * @module simple-types
 */

import * as auth from "@esri/arcgis-rest-auth";
import * as common from "@esri/solution-common";
import * as dashboard from "./dashboard";
import * as form from "./form";
import * as portal from "@esri/arcgis-rest-portal";
import * as webmap from "./webmap";
import * as webmappingapplication from "./webmappingapplication";
import * as workforce from "./workforce";

// ------------------------------------------------------------------------------------------------------------------ //

export function convertItemToTemplate(
  solutionItemId: string,
  itemInfo: any,
  userSession: auth.UserSession,
  isGroup = false
): Promise<common.IItemTemplate> {
  return new Promise<common.IItemTemplate>(resolve => {
    console.log(
      "converting " +
        (isGroup ? "Group" : itemInfo.type) +
        ' "' +
        itemInfo.title +
        '" (' +
        itemInfo.id +
        ")..."
    );
    const requestOptions: auth.IUserRequestOptions = {
      authentication: userSession
    };

    // Init template
    const itemTemplate: common.IItemTemplate = isGroup
      ? common.createInitializedGroupTemplate(itemInfo)
      : common.createInitializedItemTemplate(itemInfo);
    itemTemplate.estimatedDeploymentCostFactor = 2; // minimal set is starting, creating, done|failed

    // Templatize item info property values
    itemTemplate.item.id = common.templatizeTerm(
      itemTemplate.item.id,
      itemTemplate.item.id,
      ".id"
    );
    if (itemTemplate.item.item) {
      itemTemplate.item.item = common.templatizeTerm(
        itemTemplate.item.item,
        itemTemplate.item.item,
        ".id"
      );
    }

    if (!isGroup) {
      // Use the initiative's extent
      // if (itemTemplate.item.extent) {
      //   itemTemplate.item.extent = "{{initiative.extent:optional}}";
      // }

      // Request item resources
      const resourcePromise = portal
        .getItemResources(itemTemplate.itemId, requestOptions)
        .then(resourcesResponse => {
          // Save resources to solution item
          itemTemplate.resources = (resourcesResponse.resources as any[]).map(
            (resourceDetail: any) => resourceDetail.resource
          );
          const resourceItemFilePaths: common.ISourceFileCopyPath[] = common.generateSourceItemFilePaths(
            "https://www.arcgis.com/sharing/",
            itemTemplate.itemId,
            itemTemplate.item.thumbnail,
            itemTemplate.resources
          );
          return common.copyFilesToStorageItem(
            requestOptions,
            resourceItemFilePaths,
            solutionItemId,
            requestOptions
          );
        })
        .catch(() => Promise.resolve([]));

      // Perform type-specific handling
      let dataPromise = Promise.resolve({});
      let relatedPromise = Promise.resolve(
        {} as portal.IGetRelatedItemsResponse
      );
      switch (itemInfo.type.toLowerCase()) {
        case "dashboard":
        case "feature service":
        case "project package":
        case "workforce project":
        case "web map":
        case "web mapping application":
          dataPromise = common.getItemData(itemTemplate.itemId, requestOptions);
          break;
        case "form":
          dataPromise = common.getItemBlob(itemTemplate.itemId, requestOptions);
          relatedPromise = common.getItemRelatedItems(
            itemTemplate.itemId,
            "Survey2Service",
            "forward",
            requestOptions
          );
          break;
      }

      // Items without a data section return an error from the REST library, so we'll need to prevent it
      // from killing off both promises. This means that there's no `reject` clause to handle, hence:
      // tslint:disable-next-line:no-floating-promises
      Promise.all([
        dataPromise.catch(() => ({})),
        resourcePromise.catch(() => [] as string[]),
        relatedPromise.catch(
          () =>
            ({ total: 0, relatedItems: [] } as portal.IGetRelatedItemsResponse)
        )
      ]).then(responses => {
        const [
          itemDataResponse,
          savedResourceFilenames,
          relatedItemsResponse
        ] = responses;
        itemTemplate.data = itemDataResponse;
        itemTemplate.resources = savedResourceFilenames as any[];

        let wrapupPromise = Promise.resolve();
        switch (itemInfo.type.toLowerCase()) {
          case "dashboard":
            dashboard.convertItemToTemplate(itemTemplate);
            break;
          case "form":
            itemTemplate.dependencies = itemTemplate.dependencies.concat(
              relatedItemsResponse.relatedItems.map(
                relatedItem => relatedItem.id
              )
            );

            // Store the form's data in the solution resources, not in template
            common
              .copyBlobToStorageItem(
                itemTemplate.data,
                solutionItemId,
                requestOptions
              )
              .then(
                ok => console.log(JSON.stringify(ok, null, 2)),
                err => console.log(JSON.stringify(err, null, 2))
              );

            itemTemplate.data = {};
            form.convertItemToTemplate(itemTemplate);

            const storageName = common.generateResourceStorageFilename(
              itemTemplate.itemId,
              itemTemplate.item.name,
              "info_form"
            );
            wrapupPromise = common.addResourceFromBlob(
              itemDataResponse,
              solutionItemId,
              storageName.folder,
              storageName.filename,
              requestOptions
            );
            break;
          case "web map":
            webmap.convertItemToTemplate(itemTemplate);
            break;
          case "web mapping application":
            webmappingapplication.convertItemToTemplate(itemTemplate);
            break;
          case "workforce project":
            workforce.convertItemToTemplate(itemTemplate);
            break;
        }

        wrapupPromise.then(
          () => {
            console.log(
              "converted " +
                itemInfo.type +
                ' "' +
                itemInfo.title +
                '" (' +
                itemInfo.id +
                ")"
            );
            resolve(itemTemplate);
          },
          err => {
            console.log(
              "unable to convert " +
                itemInfo.type +
                ' "' +
                itemInfo.title +
                '" (' +
                itemInfo.id +
                "): " +
                JSON.stringify(err, null, 2)
            );
            resolve(itemTemplate);
          }
        );
      });
    } else {
      // Get the group's items--its dependencies
      common.getGroupContents(itemInfo.id, requestOptions).then(
        groupContents => {
          itemTemplate.type = "Group";
          itemTemplate.dependencies = groupContents;
          portal.getGroup(itemInfo.id, requestOptions).then(
            groupResponse => {
              groupResponse.id = itemTemplate.item.id;
              itemTemplate.item = groupResponse;
              resolve(itemTemplate);
            },
            () => resolve(itemTemplate)
          );
        },
        () => resolve(itemTemplate)
      );
    }
  });
}

export function createItemFromTemplate(
  template: common.IItemTemplate,
  resourceFilePaths: common.IDeployFileCopyPath[],
  storageUserSession: auth.UserSession,
  templateDictionary: any,
  destinationUserSession: auth.UserSession,
  progressTickCallback: () => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const isGroup: boolean = template.type.toLowerCase() === "group";
    console.log(
      "createItemFromTemplate for a " +
        (isGroup ? "Group" : template.type) +
        " (" +
        template.itemId +
        ")"
    );

    // Replace the templatized symbols in a copy of the template
    let newItemTemplate: common.IItemTemplate = common.cloneObject(template);
    newItemTemplate = common.replaceInTemplate(
      newItemTemplate,
      templateDictionary
    );

    if (!isGroup) {
      // Create the item, then update its URL with its new id
      common
        .createItemWithData(
          newItemTemplate.item,
          newItemTemplate.data,
          { authentication: destinationUserSession },
          templateDictionary.folderId
        )
        .then(
          createResponse => {
            progressTickCallback();

            if (createResponse.success) {
              // Add the new item to the settings
              newItemTemplate.itemId = createResponse.id;
              templateDictionary[template.itemId] = {
                id: createResponse.id
              };

              // Update the template again now that we have the new item id
              newItemTemplate = common.replaceInTemplate(
                newItemTemplate,
                templateDictionary
              );

              // Copy resources, metadata, thumbnail, form
              const resourcesDef = common.copyFilesFromStorageItem(
                { authentication: storageUserSession },
                resourceFilePaths,
                createResponse.id,
                { authentication: destinationUserSession }
              );

              // The item's URL includes its id, so it needs to be updated
              const updateUrlDef = common.updateItemURL(
                createResponse.id,
                common.replaceInTemplate(
                  newItemTemplate.item.url,
                  templateDictionary
                ),
                { authentication: destinationUserSession }
              );

              // Check for extra processing for web mapping application
              let customProcDef: Promise<void>;
              if (template.type.toLowerCase() === "web mapping application") {
                customProcDef = webmappingapplication.createItemFromTemplate(
                  template,
                  newItemTemplate,
                  templateDictionary,
                  destinationUserSession
                );
              } else {
                customProcDef = Promise.resolve();
              }

              Promise.all([resourcesDef, updateUrlDef, customProcDef]).then(
                () => {
                  progressTickCallback();

                  // Update the template dictionary with the new id
                  templateDictionary[template.itemId].id = createResponse.id;

                  resolve(createResponse.id);
                },
                e => reject(common.fail(e))
              );
            } else {
              reject(common.fail());
            }
          },
          e => reject(common.fail(e))
        );
    } else {
      // handle group
      getGroupTitle(newItemTemplate.item.title, newItemTemplate.itemId).then(
        title => {
          // Set the item title with a valid name for the ORG
          newItemTemplate.item.title = title;

          portal
            .createGroup({
              group: newItemTemplate.item,
              authentication: destinationUserSession
            })
            .then(
              createResponse => {
                progressTickCallback();
                if (createResponse.success) {
                  newItemTemplate.itemId = createResponse.group.id;
                  templateDictionary[template.itemId] = {
                    id: createResponse.group.id
                  };

                  // Update the template again now that we have the new item id
                  newItemTemplate = common.replaceInTemplate(
                    newItemTemplate,
                    templateDictionary
                  );

                  // Copy resources
                  common
                    .copyFilesFromStorageItem(
                      { authentication: storageUserSession },
                      resourceFilePaths,
                      createResponse.group.id,
                      { authentication: destinationUserSession }
                    )
                    .then(
                      () => {
                        // Update the template dictionary with the new id
                        templateDictionary[template.itemId].id =
                          createResponse.group.id;

                        updateGroup(
                          newItemTemplate,
                          destinationUserSession,
                          templateDictionary
                        ).then(
                          () => {
                            progressTickCallback();
                            resolve(createResponse.group.id);
                          },
                          e => reject(common.fail(e))
                        );
                      },
                      e => reject(common.fail(e))
                    );
                } else {
                  reject(common.fail());
                }
              },
              e => reject(common.fail(e))
            );
        },
        e => reject(common.fail(e))
      );
    }
  });
}

export function updateGroup(
  newItemTemplate: common.IItemTemplate,
  destinationUserSession: auth.UserSession,
  templateDictionary: any
): Promise<any> {
  return new Promise<string>((resolve, reject) => {
    const defArray: any[] = [];
    const groupId: string = newItemTemplate.itemId;
    newItemTemplate.dependencies.forEach(d => {
      defArray.push(
        common.shareItem(
          groupId,
          templateDictionary[d].id,
          destinationUserSession
        )
      );
    });
    Promise.all(defArray).then(
      a => {
        resolve();
      },
      e => reject(common.fail(e))
    );
  });
}

export function getGroupTitle(name: string, id: string): Promise<any> {
  return new Promise<string>((resolve, reject) => {
    portal.searchGroups(name).then(
      searchResult => {
        // if we find a group call the func again with a new name
        const results: any[] = common.getProp(searchResult, "results");
        if (results && results.length > 0) {
          getGroupTitle(name + "_" + id, common.getUTCTimestamp()).then(
            title => {
              resolve(title);
            },
            e => reject(common.fail(e))
          );
        } else {
          resolve(name);
        }
      },
      e => reject(common.fail(e))
    );
  });
}
