/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  SupersetClient,
  SupersetClientResponse,
} from '@superset-ui/connection';
import { t } from '@superset-ui/translation';
import rison from 'rison';
import getClientErrorObject from 'src/utils/getClientErrorObject';

export const createFetchRelated = (
  resource: string,
  relation: string,
  handleError: (error: Response) => void,
) => async (filterValue = '', pageIndex?: number, pageSize?: number) => {
  const resourceEndpoint = `/api/v1/${resource}/related/${relation}`;

  try {
    const queryParams = rison.encode({
      ...(pageIndex ? { page: pageIndex } : {}),
      ...(pageSize ? { page_size: pageSize } : {}),
      ...(filterValue ? { filter: filterValue } : {}),
    });
    const { json = {} } = await SupersetClient.get({
      endpoint: `${resourceEndpoint}?q=${queryParams}`,
    });

    return json?.result?.map(
      ({ text: label, value }: { text: string; value: any }) => ({
        label,
        value,
      }),
    );
  } catch (e) {
    handleError(e);
  }
  return [];
};

export function createErrorHandler(handleErrorFunc: (errMsg?: string) => void) {
  return async (e: SupersetClientResponse | string) => {
    const parsedError = await getClientErrorObject(e);
    console.error(e);
    handleErrorFunc(parsedError.message);
  };
}

export function createFaveStarHandlers(
  baseURL: string,
  context: any,
  handleErrorFunc: (message: string) => void,
) {
  const fetchFaveStar = (id: number) => {
    SupersetClient.get({
      endpoint: `${baseURL}/${id}/count/`,
    })
      .then(({ json }) => {
        const faves = {
          ...context.state.favoriteStatus,
        };

        faves[id] = json.count > 0;

        context.setState({
          favoriteStatus: faves,
        });
      })
      .catch(() =>
        handleErrorFunc(t('There was an error fetching the favorite status')),
      );
  };

  const saveFaveStar = (id: number, isStarred: boolean) => {
    const urlSuffix = isStarred ? 'unselect' : 'select';

    SupersetClient.get({
      endpoint: `${baseURL}/${id}/${urlSuffix}/`,
    })
      .then(() => {
        const faves = {
          ...context.state.favoriteStatus,
        };

        faves[id] = !isStarred;

        context.setState({
          favoriteStatus: faves,
        });
      })
      .catch(() =>
        handleErrorFunc(t('There was an error saving the favorite status')),
      );
  };

  return {
    fetchFaveStar,
    saveFaveStar,
  };
}
