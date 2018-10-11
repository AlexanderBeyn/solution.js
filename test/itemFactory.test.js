/* Copyright (c) 2018 Esri
 * Apache-2.0 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fetch-mock", "../src/itemFactory", "./mocks/item", "./mocks/featureService", "@esri/arcgis-rest-auth", "./lib/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fetchMock = require("fetch-mock");
    var itemFactory_1 = require("../src/itemFactory");
    var item_1 = require("./mocks/item");
    var featureService_1 = require("./mocks/featureService");
    var arcgis_rest_auth_1 = require("@esri/arcgis-rest-auth");
    var utils_1 = require("./lib/utils");
    describe("converting an item into JSON", function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // default is 5000 ms
        // Set up a UserSession to use in all these tests
        var MOCK_USER_SESSION = new arcgis_rest_auth_1.UserSession({
            clientId: "clientId",
            redirectUri: "https://example-app.com/redirect-uri",
            token: "fake-token",
            tokenExpires: utils_1.TOMORROW,
            refreshToken: "refreshToken",
            refreshTokenExpires: utils_1.TOMORROW,
            refreshTokenTTL: 1440,
            username: "casey",
            password: "123456",
            portal: "https://myorg.maps.arcgis.com/sharing/rest"
        });
        var MOCK_USER_REQOPTS = {
            authentication: MOCK_USER_SESSION
        };
        afterEach(function () {
            fetchMock.restore();
        });
        /*
        it("throws an error if the item id is not accessible: missing id", done => {
          fetchMock.once("*", ItemFailResponse);
          ItemFactory.itemToJSON(null, MOCK_USER_REQOPTS)
          .then(
            fail,
            error => {
              expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
              done();
            }
          );
        });
      
        it("throws an error if the item id is not accessible: inaccessible", done => {
          fetchMock
          .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
          .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
        ItemFactory.itemToJSON("fail1234567890", MOCK_USER_REQOPTS)
          .then(
            fail,
            error => {
              expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
              done();
            }
          );
        });
        */
        describe("with accurate function documentation", function () {
            /*
            it("should return WMA details for a valid AGOL id", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {});
              ItemFactory.itemToJSON("wma1234567890")
              .then(
                (response:AgolItem) => {
                  expect(response.type).toEqual("Web Mapping Application");
                  expect(response.itemSection.title).toEqual("ROW Permit Public Comment");
                  expect((response as Item).dataSection.source).toEqual("bb3fcf7c3d804271bfd7ac6f48290fcf");
                  done();
                },
                done.fail
              );
            });
        
            it("should return an error message for an invalid AGOL id (itemToJSON)", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
              .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
              ItemFactory.itemToJSON("fail1234567890", MOCK_USER_REQOPTS)
                .then(
                () => {
                  done.fail("Invalid item 'found'");
                },
                error => {
                  expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
                  done();
                }
              );
            });
            */
            it("should return a list of WMA details for a valid AGOL id", function (done) {
                fetchMock
                    .mock("path:/sharing/rest/content/items/wma1234567890", item_1.ItemSuccessResponseWMA, {})
                    .mock("path:/sharing/rest/content/items/wma1234567890/data", item_1.ItemDataSuccessResponseWMA, {})
                    .mock("path:/sharing/rest/content/items/map1234567890", item_1.ItemSuccessResponseWebmap, {})
                    .mock("path:/sharing/rest/content/items/map1234567890/data", item_1.ItemDataSuccessResponseWebmap, {})
                    .mock("path:/sharing/rest/content/items/svc1234567890", item_1.ItemSuccessResponseService, {})
                    .mock("path:/sharing/rest/content/items/svc1234567890/data", item_1.ItemDataSuccessResponseService, {})
                    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", featureService_1.FeatureServiceSuccessResponse)
                    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", featureService_1.FeatureServiceLayer0SuccessResponse)
                    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", featureService_1.FeatureServiceLayer1SuccessResponse);
                itemFactory_1.ItemFactory.itemHierarchyToJSON("wma1234567890", null, MOCK_USER_REQOPTS)
                    .then(function (response) {
                    var keys = Object.keys(response);
                    expect(keys.length).toEqual(3);
                    expect(response[keys[0]].type).toEqual("Web Mapping Application");
                    expect(response[keys[0]].itemSection.title).toEqual("ROW Permit Public Comment");
                    expect(response[keys[0]].dataSection.source).toEqual("template1234567890");
                    done();
                }, done.fail);
            });
            /*
            it("should return a list of WMA details for a valid AGOL id in a list", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {});
              ItemFactory.itemHierarchyToJSON("wma1234567890", null, MOCK_USER_REQOPTS)
              .then(
                (response:IItemHash) => {
                  let keys = Object.keys(response);
                  expect(keys.length).toEqual(3);
                  expect((response[keys[0]] as AgolItem).type).toEqual("Web Mapping Application");
                  expect((response[keys[0]] as AgolItem).itemSection.title).toEqual("ROW Permit Public Comment");
                  expect((response[keys[0]] as Item).dataSection.source).toEqual("bb3fcf7c3d804271bfd7ac6f48290fcf");
                  done();
                },
                done.fail
              );
            });
        
            it("should return a list of WMA details for a valid AGOL id in a list with more than one id", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/map1234567890", ItemSuccessResponseWebmap, {})
              .mock("path:/sharing/rest/content/items/map1234567890/data", ItemDataSuccessResponseWebmap, {});
              ItemFactory.itemHierarchyToJSON(["wma1234567890", "svc1234567890"], null, MOCK_USER_REQOPTS)
              .then(
                (response:IItemHash) => {
                  let keys = Object.keys(response);
                  expect(keys.length).toEqual(6);
                  expect((response[keys[0]] as AgolItem).type).toEqual("Web Mapping Application");
                  expect((response[keys[0]] as AgolItem).itemSection.title).toEqual("ROW Permit Public Comment");
                  expect((response[keys[0]] as Item).dataSection.source).toEqual("bb3fcf7c3d804271bfd7ac6f48290fcf");
                  done();
                },
                done.fail
              );
            });
            */
            /*
            it("should return an error message for an invalid AGOL id (itemHierarchyToJSON)", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
              .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
              ItemFactory.itemHierarchyToJSON("fail1234567890", null, MOCK_USER_REQOPTS)
              .then(
                () => {
                  done.fail("Invalid item 'found'");
                },
                error => {
                  expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
                  done();
                }
              );
            });
        
            it("should return an error message for an invalid AGOL id in a list", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
              .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
              ItemFactory.itemHierarchyToJSON(["fail1234567890"], null, MOCK_USER_REQOPTS)
              .then(
                () => {
                  done.fail("Invalid item 'found'");
                },
                error => {
                  expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
                  done();
                }
              );
            });
        
            it("should return an error message for an invalid AGOL id in a list with more than one id", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
              .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
              .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
              ItemFactory.itemHierarchyToJSON(["wma1234567890", "fail1234567890"], null, MOCK_USER_REQOPTS)
              .then(
                () => {
                  done.fail("Invalid item 'found'");
                },
                error => {
                  expect(error.message).toEqual("Item or group does not exist or is inaccessible.");
                  done();
                }
              );
            });
            */
        });
        /*
        describe("for different item types", () => {
      
          [
            {type: "Dashboard", item: DashboardItemSuccessResponse, data: DashboardItemDataSuccessResponse },
            {type: "Web Map", item: WebMapItemSuccessResponse, data: WebMapItemDataSuccessResponse },
            {type: "Web Mapping Application", item: WebMappingAppItemSuccessResponse, data: WebMappingAppItemDataSuccessResponse }
          ].forEach(({type, item, data}) => {
            it("should create a " + type + " based on the AGOL response", done => {
              fetchMock
              .mock("path:/sharing/rest/content/items/wma1234567890", item, {})
              .mock("path:/sharing/rest/content/items/wma1234567890/data", data, {});
      
              ItemFactory.itemToJSON("wma1234567890", MOCK_USER_REQOPTS)
              .then((response:Item) => {
                expect(fetchMock.called("path:/sharing/rest/content/items/wma1234567890")).toEqual(true);
                expect(fetchMock.called("path:/sharing/rest/content/items/wma1234567890/data")).toEqual(true);
      
                expect(response.type).toEqual(type);
      
                expect(response.itemSection).toEqual(jasmine.anything());
                expect(Object.keys(response.itemSection).length).toEqual(16);
                expect(response.itemSection.owner).toBeUndefined();
                expect(response.itemSection.created).toBeUndefined();
                expect(response.itemSection.modified).toBeUndefined();
      
                expect(response.dataSection).toEqual(jasmine.anything());
                done();
              })
              .catch(e => {
                fail(e);
              });
            });
          });
      
          it("should create a Feature Service based on the AGOL response", done => {
            fetchMock
            .mock("path:/sharing/rest/content/items/wma1234567890", FeatureServiceItemSuccessResponse, {})
            .mock("path:/sharing/rest/content/items/wma1234567890/data", FeatureServiceItemDataSuccessResponse, {})
            .post("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", FeatureServiceSuccessResponse)
            .post("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", FeatureServiceLayer0SuccessResponse)
            .post("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", FeatureServiceLayer1SuccessResponse);
      
            ItemFactory.itemToJSON("wma1234567890", MOCK_USER_REQOPTS)
            .then((response:Item) => {
              expect(fetchMock.called("path:/sharing/rest/content/items/wma1234567890")).toEqual(true);
              expect(fetchMock.called("path:/sharing/rest/content/items/wma1234567890/data")).toEqual(true);
              expect(fetchMock.called("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json")).toEqual(true);
              expect(fetchMock.called("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json")).toEqual(true);
              expect(fetchMock.called("https://services123.arcgis.com/myOrg123/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json")).toEqual(true);
      
              expect(response.type).toEqual("Feature Service");
      
              expect(response.itemSection).toEqual(jasmine.anything());
              expect(Object.keys(response.itemSection).length).toEqual(16);
              expect(response.itemSection.owner).toBeUndefined();
              expect(response.itemSection.created).toBeUndefined();
              expect(response.itemSection.modified).toBeUndefined();
      
              expect(response.dataSection).toEqual(jasmine.anything());
              done();
            })
            .catch(e => {
              fail(e);
            });
          });
      
        });
        */
    });
});
//# sourceMappingURL=itemFactory.test.js.map