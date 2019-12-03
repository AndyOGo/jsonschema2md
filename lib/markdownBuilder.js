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
const { each, values } = require('ferrum');
const {
  root, paragraph, text, heading, brk, separator
} = require('mdast-builder');

function build({ }) {


  return (schemas) => {
  // eslint-disable-next-line no-return-assign, no-param-reassign
    each(values(schemas), schema => schema.markdown = root([
    // todo add more elements
      heading(1, text(schema.title)),
      paragraph(text('This is a schema.')),
    ]));
    return schemas;
  };
}

module.exports = build;
