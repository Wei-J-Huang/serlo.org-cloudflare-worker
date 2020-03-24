/**
 * This file is part of Serlo.org Cloudflare Worker.
 *
 * Copyright (c) 2020 Serlo Education e.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @copyright Copyright (c) 2020 Serlo Education e.V.
 * @license   http://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://github.com/serlo-org/serlo.org-cloudflare-worker for the canonical source repository
 */
import { gql } from 'apollo-server-cloudflare'

import { Instance } from './instance'
import { License, licenseResolvers } from './license'
import { Context, Resolver } from './types'
import { requestsOnlyFields } from './utils'

export const uuidTypeDefs = gql`
  extend type Query {
    uuid(alias: AliasInput, id: Int): Uuid
  }

  interface Uuid {
    id: Int!
  }

  interface Entity {
    instance: Instance!
    license: License!
  }

  type Article implements Uuid & Entity {
    id: Int!
    instance: Instance!
    license: License!
    currentRevision: ArticleRevision
  }

  type ArticleRevision implements Uuid {
    id: Int!
    article: Article!
    title: String!
    content: String!
    changes: String!
  }

  type Page implements Uuid {
    id: Int!
    currentRevision: PageRevision
  }

  type PageRevision implements Uuid {
    id: Int!
    title: String!
    content: String!
  }

  input AliasInput {
    instance: Instance!
    path: String!
  }
`

export const uuidResolvers: {
  Query: {
    uuid: Resolver<
      undefined,
      {
        alias?: AliasInput
        id?: number
      },
      Uuid
    >
  }
  Uuid: {
    __resolveType(uuid: Uuid): UuidType
  }
  Entity: {
    __resolveType(entity: Entity): EntityType
  }
  Article: {
    currentRevision: Resolver<Article, {}, Partial<ArticleRevision>>
    license: Resolver<Entity, {}, Partial<License>>
  }
  ArticleRevision: {
    article: Resolver<ArticleRevision, {}, Partial<Article>>
  }
  Page: {
    currentRevision: Resolver<Page, {}, Partial<PageRevision>>
  }
} = {
  Query: {
    uuid,
  },
  Uuid: {
    __resolveType(uuid) {
      return uuid.__typename
    },
  },
  Entity: {
    __resolveType(entity) {
      return entity.__typename
    },
  },
  Article: {
    async currentRevision(entity, _args, context, info) {
      const partialCurrentRevision = { id: entity.currentRevisionId }
      if (requestsOnlyFields('ArticleRevision', ['id'], info)) {
        return partialCurrentRevision
      }
      return uuid(undefined, partialCurrentRevision, context)
    },
    async license(entity, _args, context, info) {
      const partialLicense = { id: entity.licenseId }
      if (requestsOnlyFields('License', ['id'], info)) {
        return partialLicense
      }
      return licenseResolvers.Query.license(
        undefined,
        partialLicense,
        context,
        info
      )
    },
  },
  ArticleRevision: {
    async article(articleRevision, _args, context, info) {
      const partialArticle = { id: articleRevision.repositoryId }
      if (requestsOnlyFields('Article', ['id'], info)) {
        return partialArticle
      }
      return uuid(undefined, partialArticle, context)
    },
  },
  Page: {
    async currentRevision(page, _args, context, info) {
      const partialCurrentRevision = { id: page.currentRevisionId }
      if (requestsOnlyFields('PageRevision', ['id'], info)) {
        return partialCurrentRevision
      }
      return uuid(undefined, partialCurrentRevision, context)
    },
  },
}

enum EntityType {
  Article = 'Article',
}

enum EntityRevisionType {
  ArticleRevision = 'ArticleRevision',
}

enum DiscriminatorType {
  Page = 'Page',
  PageRevision = 'PageRevision',
}

type UuidType = DiscriminatorType | EntityType | EntityRevisionType

abstract class Uuid {
  public abstract __typename: UuidType
  public id: number

  public constructor(payload: { id: number }) {
    this.id = payload.id
  }
}

abstract class Entity extends Uuid {
  public abstract __typename: EntityType
  public instance: Instance
  public licenseId: number
  public currentRevisionId: number

  public constructor(payload: {
    id: number
    instance: Instance
    licenseId: number
    currentRevisionId: number
  }) {
    super(payload)
    this.instance = payload.instance
    this.licenseId = payload.licenseId
    this.currentRevisionId = payload.currentRevisionId
  }
}

class Article extends Entity {
  public __typename = EntityType.Article
}

abstract class EntityRevision extends Uuid {
  public abstract __typename: EntityRevisionType
  public repositoryId: number

  public constructor(payload: { id: number; repositoryId: number }) {
    super(payload)
    this.repositoryId = payload.repositoryId
  }
}

class ArticleRevision extends EntityRevision {
  public __typename = EntityRevisionType.ArticleRevision
  public title: string
  public content: string
  public changes: string

  public constructor(payload: {
    id: number
    repositoryId: number
    title: string
    content: string
    changes: string
  }) {
    super(payload)
    this.title = payload.title
    this.content = payload.content
    this.changes = payload.changes
  }
}

class Page extends Uuid {
  public __typename = DiscriminatorType.Page
  public currentRevisionId: number

  public constructor(payload: { id: number; currentRevisionId: number }) {
    super(payload)
    this.currentRevisionId = payload.currentRevisionId
  }
}

class PageRevision extends Uuid {
  public __typename = DiscriminatorType.PageRevision
  public title: string
  public content: string

  public constructor(payload: { id: number; title: string; content: string }) {
    super(payload)
    this.title = payload.title
    this.content = payload.content
  }
}

interface AliasInput {
  instance: Instance
  path: string
}

async function uuid(
  _parent: unknown,
  { alias, id }: { id?: number; alias?: AliasInput },
  { dataSources }: Context
) {
  const data = alias
    ? await dataSources.serlo.getAlias(alias)
    : await dataSources.serlo.getUuid(id as number)

  switch (data.discriminator) {
    case 'entity':
      switch (data.type) {
        case 'article':
          return new Article(data)
      }
      break
    case 'entityRevision':
      switch (data.type) {
        case 'article':
          return new ArticleRevision({ ...data, ...data.fields })
      }
      break
    case 'page':
      return new Page(data)
    case 'pageRevision':
      return new PageRevision(data)
  }
}
