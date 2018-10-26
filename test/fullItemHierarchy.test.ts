/*
 | Copyright 2018 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

import * as fetchMock from "fetch-mock";

import { IFullItem } from "../src/fullItem";
import { IItemHash, getFullItemHierarchy } from "../src/fullItemHierarchy";

import { ItemFailResponse, ItemResourcesSuccessResponseNone,
  ItemSuccessResponseWMA, ItemDataSuccessResponseWMA,
  ItemSuccessResponseWebmap, ItemDataSuccessResponseWebmap,
  ItemSuccessResponseService, ItemDataSuccessResponseService
} from "./mocks/fullItemQueries";
import { FeatureServiceSuccessResponse,
  FeatureServiceLayer0SuccessResponse, FeatureServiceLayer1SuccessResponse
} from "./mocks/featureService";

import { UserSession } from "@esri/arcgis-rest-auth";
import { IUserRequestOptions } from "@esri/arcgis-rest-auth";
import { TOMORROW } from "./lib/utils";

//--------------------------------------------------------------------------------------------------------------------//

describe("converting an item into JSON", () => {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;  // default is 5000 ms

  // Set up a UserSession to use in all these tests
  const MOCK_USER_SESSION = new UserSession({
    clientId: "clientId",
    redirectUri: "https://example-app.com/redirect-uri",
    token: "fake-token",
    tokenExpires: TOMORROW,
    refreshToken: "refreshToken",
    refreshTokenExpires: TOMORROW,
    refreshTokenTTL: 1440,
    username: "casey",
    password: "123456",
    portal: "https://myorg.maps.arcgis.com/sharing/rest"
  });

  const MOCK_USER_REQOPTS:IUserRequestOptions = {
    authentication: MOCK_USER_SESSION
  };

  afterEach(() => {
    fetchMock.restore();
  });

  it("should return a list of WMA details for a valid AGOL id", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/map1234567890", ItemSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/data", ItemDataSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/svc1234567890", ItemSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/data", ItemDataSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", FeatureServiceSuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", FeatureServiceLayer0SuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", FeatureServiceLayer1SuccessResponse);
    getFullItemHierarchy("wma1234567890", MOCK_USER_REQOPTS)
    .then(
      (response:IItemHash) => {
        let keys = Object.keys(response);
        expect(keys.length).toEqual(3);
        let fullItem:IFullItem = response[keys[0]] as IFullItem;
        expect(fullItem.type).toEqual("Web Mapping Application");
        expect(fullItem.item.title).toEqual("ROW Permit Public Comment");
        expect(fullItem.data.source).toEqual("template1234567890");
        done();
      },
      done.fail
    );
  });

  it("should return a list of WMA details for a valid AGOL id in a list", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/map1234567890", ItemSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/data", ItemDataSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/svc1234567890", ItemSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/data", ItemDataSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", FeatureServiceSuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", FeatureServiceLayer0SuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", FeatureServiceLayer1SuccessResponse);
    getFullItemHierarchy(["wma1234567890"], MOCK_USER_REQOPTS)
    .then(
      (response:IItemHash) => {
        let keys = Object.keys(response);
        expect(keys.length).toEqual(3);
        let fullItem:IFullItem = response[keys[0]] as IFullItem;
        expect(fullItem.type).toEqual("Web Mapping Application");
        expect(fullItem.item.title).toEqual("ROW Permit Public Comment");
        expect(fullItem.data.source).toEqual("template1234567890");
        done();
      },
      done.fail
    );
  });

  it("should return a list of WMA details for a valid AGOL id in a list with more than one id", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/map1234567890", ItemSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/data", ItemDataSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/svc1234567890", ItemSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/data", ItemDataSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", FeatureServiceSuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", FeatureServiceLayer0SuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", FeatureServiceLayer1SuccessResponse);
    getFullItemHierarchy(["wma1234567890", "svc1234567890"], MOCK_USER_REQOPTS)
    .then(
      (response:IItemHash) => {
        let keys = Object.keys(response);
        expect(keys.length).toEqual(3);
        let fullItem:IFullItem = response[keys[0]] as IFullItem;
        expect(fullItem.type).toEqual("Web Mapping Application");
        expect(fullItem.item.title).toEqual("ROW Permit Public Comment");
        expect(fullItem.data.source).toEqual("template1234567890");
        done();
      },
      done.fail
    );
  });

  it("should return an error message for an invalid AGOL id (getFullItemHierarchy)", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
    .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
    getFullItemHierarchy("fail1234567890", MOCK_USER_REQOPTS)
    .then(
      () => {
        done.fail("Invalid item 'found'");
      },
      error => {
        expect(error.message).toEqual("Item or group does not exist or is inaccessible: fail1234567890");
        done();
      }
    );
  });

  it("should return an error message for an invalid AGOL id in a list", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
    .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
    getFullItemHierarchy(["fail1234567890"], MOCK_USER_REQOPTS)
    .then(
      () => {
        done.fail("Invalid item 'found'");
      },
      error => {
        expect(error.message).toEqual("Item or group does not exist or is inaccessible: fail1234567890");
        done();
      }
    );
  });

  it("should return an error message for an invalid AGOL id in a list with more than one id", done => {
    fetchMock
    .mock("path:/sharing/rest/content/items/wma1234567890", ItemSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/data", ItemDataSuccessResponseWMA, {})
    .mock("path:/sharing/rest/content/items/wma1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/map1234567890", ItemSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/data", ItemDataSuccessResponseWebmap, {})
    .mock("path:/sharing/rest/content/items/map1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .mock("path:/sharing/rest/content/items/svc1234567890", ItemSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/data", ItemDataSuccessResponseService, {})
    .mock("path:/sharing/rest/content/items/svc1234567890/resources", ItemResourcesSuccessResponseNone, {})
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer?f=json", FeatureServiceSuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/0?f=json", FeatureServiceLayer0SuccessResponse)
    .post("https://services123.arcgis.com/org1234567890/arcgis/rest/services/ROWPermits_publiccomment/FeatureServer/1?f=json", FeatureServiceLayer1SuccessResponse)
    .mock("path:/sharing/rest/content/items/fail1234567890", ItemFailResponse, {})
    .mock("path:/sharing/rest/community/groups/fail1234567890", ItemFailResponse, {});
    getFullItemHierarchy(["wma1234567890", "fail1234567890"], MOCK_USER_REQOPTS)
    .then(
      () => {
        done.fail("Invalid item 'found'");
      },
      error => {
        expect(error.message).toEqual("Item or group does not exist or is inaccessible: fail1234567890");
        done();
      }
    );
  });

});
