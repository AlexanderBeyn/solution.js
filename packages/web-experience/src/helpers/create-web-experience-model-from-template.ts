/** @license
 * Copyright 2020 Esri
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

import { interpolate, IModelTemplate } from "@esri/hub-common";
import { UserSession } from "@esri/arcgis-rest-auth";
import { getWebExperiencepBaseUrl} from './get-web-experience-base-url';
/**
 * Convert a Web Experience template into a Model that can be persisted to the Portal API
 * @param templateModel Template
 * @param settings Hash of values to interpolate into the template
 * @param transforms Hash of transform functions to use in the interpolation
 * @param authentication UserSession
 */
export function createWebExperienceModelFromTemplate(
  templateModel: IModelTemplate,
  settings: any,
  transforms: any,
  authentication: UserSession
): Promise<any> {
  // get the experience base url
  settings.experienceTemplateUrl = `${getWebExperiencepBaseUrl(authentication)}/experience/?id={{appid}}`;

  const model = interpolate(templateModel, settings, transforms);
  model.item.url = settings.experienceTemplateUrl;
  return Promise.resolve(model);
}
