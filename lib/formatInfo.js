/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { map } = require('ferrum');
const fs = require('fs');
const path = require('path');
const unified = require('unified');
const parse = require('remark-parse');
const inspect = require('unist-util-inspect');
const stringify = require('mdast-util-to-string');
const { formatname } = require('./formatname');

function formatInfo({ extension }) {
  function plaindescription(schema) {
    try {
      if (schema.path) {
        const filename = path.resolve(
          path.dirname(schema.path),
          `${path.basename(schema.path, extension)}description.md`,
        );
        const longdesc = fs.readFileSync(filename);
        return longdesc.toString();
      }
    } catch {}
    return schema.schema.description || '';
  }

  function shorten(str) {
    return str.split('\n')[0].split('.')[0];
  }

  const parser = unified()
    .use(parse);

  function parsedescription(str) {
    try {
      const markdown = parser.parse(str);
      return {
        longdescription: markdown,
        shortdescription: shorten(stringify(markdown)),
        description: str,
      };
    } catch {
      return {
        longdescription: {},
        shortdescription: '',
        description: shorten(str),
      };
    }
  }

  function isabstract(schema) {
    return schema.definitions !== undefined &&
      (!schema.properties || Object.keys(schema.properties).length === 0);
  }

  function isextensible(schema) {
    return schema.definitions !== undefined || schema['meta:extensible'] === true;
  }

  function isidentifiable(schema) {
    if (!schema.properties) {
      return 'undefined';
    }
    if (schema.properties['@id'] && schema.properties['@id'].type === 'string' && schema.properties['@id'].format === 'uri') {
      return 'true';
    } else {
      return 'false';
    }
  }

  function iscustom(schema) {
    return [...(schema.allOf || [])]
      .filter(e => typeof e === 'object')
      .filter(e => typeof e.$ref === 'string')
      .filter(({ $ref }) => $ref === 'https://ns.adobe.com/xdm/common/extensible.schema.json#/definitions/@context')
      .length > 0;
  }

  function getdefined(schema) {
    if (schema.rootpath) {
      return {
        text: path.basename(schema.rootpath) + "*",
        link: schema.rootpath
      }
    }
    if (schema.path) {
      return {
        text: path.basename(schema.path),
        link: schema.path
      }
    }
    return undefined;
  }

  function gettype(schema) {
    if (typeof schema.type === 'string') {
      return schema.type;
    }
    if (Array.isArray(schema.type)) {
      return 'multiple';
    }
    if (isabstract(schema)) {
      return gettype(schema.definitions);
    }
    return undefined;
  }

  function formatmeta(schema) {
    return {
      type: gettype(schema.schema),
      abstract: isabstract(schema.schema),
      extensible: isextensible(schema.schema),
      status: schema.schema['meta:status'] || undefined,
      identifiable: isidentifiable(schema.schema),
      custom: iscustom(schema.schema),
      additional: schema.schema.additionalProperties !== false,
      definedin: getdefined(schema)
    };
  }

  return schemas => map(schemas, (schema) => {
    const newobj = {
      ...schema,
      ...parsedescription(plaindescription(schema)),
      title: formatname(schema),
      meta: formatmeta(schema)
    };
    return newobj;
  });
}

module.exports = formatInfo;
