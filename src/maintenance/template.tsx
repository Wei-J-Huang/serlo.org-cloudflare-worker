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
import { DateTime } from 'luxon'
import { h } from 'preact'

import { Template, CenteredContent } from '../ui'

export function Maintenance({
  lang,
  end,
}: {
  lang: 'de' | 'en'
  end?: DateTime
}) {
  const { content, title } = getTranslations()
  return (
    <Template lang={lang} title={title}>
      <CenteredContent>{content}</CenteredContent>
    </Template>
  )

  function getTranslations() {
    switch (lang) {
      case 'de':
        return {
          title: 'Wartungsmodus',
          content: `Wir führen gerade Wartungsarbeiten durch und sind ${
            end
              ? `gegen ${end.setLocale('de').toFormat('HH:mm (ZZZZ)')}`
              : 'in ein paar Stunden'
          } wieder online.`,
        }
      case 'en':
        return {
          title: 'Maintenance mode',
          content: `Serlo is currently down for maintenance. We expect to be back ${
            end
              ? `by ${end.setLocale('en').toFormat('HH:mm (ZZZZ)')}`
              : 'in a couple of hours.'
          }`,
        }
    }
  }
}
