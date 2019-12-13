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
const fs = require('fs');
const path = require('path');
const unified = require('unified');
const parse = require('remark-parse');
const stringify = require('mdast-util-to-string');
const s = require('./symbols');
const { keyword } = require('./keywords');


function isabstract(schema) {
  return schema.definitions !== undefined
    && (!schema[keyword`properties`] || Object.keys(schema[keyword`properties`]).length === 0);
}

function isextensible(schema) {
  return schema.definitions !== undefined || schema[keyword`meta:extensible`] === true;
}

function isidentifiable(schema) {
  if (!schema[keyword`properties`]) {
    return 'undefined';
  }
  if (schema[keyword`properties`][keyword`@id`] && schema[keyword`properties`][keyword`@id`][keyword`type`] === 'string' && schema[keyword`properties`][keyword`@id`].format === 'uri') {
    return 'true';
  } else {
    return 'false';
  }
}

function iscustom(schema) {
  return [...(schema[keyword`allOf`] || [])]
    .filter(e => typeof e === 'object')
    .filter(e => typeof e.$ref === 'string')
    .filter(({ $ref }) => $ref === 'https://ns.adobe.com/xdm/common/extensible.schema.json#/definitions/@context')
    .length > 0;
}

function getdefined(schema) {
  if (schema[s.parent]) {
    return {
      text: `${path.basename(schema[s.filename])}*`,
      link: schema[s.filename],
    };
  }
  return {
    text: path.basename(schema[s.filename]),
    link: schema[s.filename],
  };
}

function plaindescription(schema) {
  try {
    if (schema[s.filename] && !schema[s.parent]) {
      const filename = path.resolve(
        path.dirname(schema[s.filename]),
        schema[s.filename].replace(/\..*$/, '.description.md'),
      );
      const longdesc = fs.readFileSync(filename);
      return longdesc.toString();
    }
  } catch {
    return schema[keyword`description`] || '';
  }
  return schema[keyword`description`] || '';
}

function shorten(str) {
  return str.split('\n')[0].split('.')[0];
}

const parser = unified()
  .use(parse);

function parsedescription(str) {
  const markdown = parser.parse(str);
  return {
    longdescription: markdown,
    shortdescription: shorten(stringify(markdown)),
    description: str,
  };
}

function formatmeta(schema) {
  return {
    abstract: isabstract(schema),
    extensible: isextensible(schema),
    status: schema[keyword`meta:status`] || undefined,
    identifiable: isidentifiable(schema),
    custom: iscustom(schema),
    additional: schema[keyword`additionalProperties`] !== false,
    definedin: getdefined(schema),
    ...parsedescription(plaindescription(schema)),
  };
}

module.exports.formatmeta = formatmeta;
