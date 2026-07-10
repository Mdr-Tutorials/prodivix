/* eslint-disable */
// @ts-nocheck -- Ajv emits JavaScript source; this file is generated and checked at runtime boundaries.
/**
 * Generated from specs/plugins/runtime/*.schema.json.
 * DO NOT EDIT. Run `pnpm --filter @prodivix/plugin-protocol generate`.
 */
'use strict';
export const validateRuntimeEnvelopeSchema = validate20;
const schema31 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-envelope-v1.schema.json',
  title: 'RuntimeEnvelopeV1',
  description:
    'Strict JSON transport envelope shared by the Prodivix plugin Host and runtime.',
  'x-prodivix-contract-version': '1.0',
  type: 'object',
  additionalProperties: false,
  required: [
    'protocol',
    'protocolVersion',
    'kind',
    'channel',
    'method',
    'contractVersion',
    'messageId',
    'sequence',
    'payload',
  ],
  properties: {
    protocol: { const: 'prodivix.plugin-runtime' },
    protocolVersion: { const: '1.0' },
    kind: { enum: ['request', 'response', 'event'] },
    channel: { enum: ['control', 'gateway', 'implementation'] },
    method: { $ref: '#/$defs/method' },
    contractVersion: { $ref: '#/$defs/contractVersion' },
    messageId: { $ref: '#/$defs/messageId' },
    replyTo: { $ref: '#/$defs/messageId' },
    sequence: { type: 'integer', minimum: 1, maximum: 9007199254740991 },
    payload: { $ref: '#/$defs/jsonValue' },
  },
  allOf: [
    {
      if: { properties: { kind: { const: 'response' } }, required: ['kind'] },
      then: {
        properties: { replyTo: { $ref: '#/$defs/messageId' } },
        required: ['replyTo'],
      },
      else: { not: { properties: { replyTo: true }, required: ['replyTo'] } },
    },
  ],
  $defs: {
    method: {
      type: 'string',
      minLength: 3,
      maxLength: 96,
      pattern: '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$',
    },
    contractVersion: {
      type: 'string',
      pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
      maxLength: 24,
    },
    messageId: {
      type: 'string',
      minLength: 3,
      maxLength: 128,
      pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$',
    },
    jsonValue: {
      oneOf: [
        { type: 'null' },
        { type: 'boolean' },
        { type: 'number' },
        { type: 'string' },
        { type: 'array', items: { $ref: '#/$defs/jsonValue' } },
        { type: 'object', additionalProperties: { $ref: '#/$defs/jsonValue' } },
      ],
    },
  },
};
const schema32 = {
  type: 'string',
  minLength: 3,
  maxLength: 128,
  pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$',
};
const schema33 = {
  type: 'string',
  minLength: 3,
  maxLength: 96,
  pattern: '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$',
};
const schema34 = {
  type: 'string',
  pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
  maxLength: 24,
};
const func1 = function unicodeCodePointLength(value) {
  let length = 0;
  for (const _codePoint of value) length += 1;
  return length;
};
const func3 = Object.prototype.hasOwnProperty;
const pattern4 = new RegExp('^[A-Za-z0-9][A-Za-z0-9._:-]*$', 'u');
const pattern5 = new RegExp(
  '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$',
  'u'
);
const pattern6 = new RegExp('^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$', 'u');
const schema37 = {
  oneOf: [
    { type: 'null' },
    { type: 'boolean' },
    { type: 'number' },
    { type: 'string' },
    { type: 'array', items: { $ref: '#/$defs/jsonValue' } },
    { type: 'object', additionalProperties: { $ref: '#/$defs/jsonValue' } },
  ],
};
const wrapper0 = { validate: validate21 };
function validate21(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate21.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data !== null) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf/0/type',
      keyword: 'type',
      params: { type: 'null' },
      message: 'must be null',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (typeof data !== 'boolean') {
    const err1 = {
      instancePath,
      schemaPath: '#/oneOf/1/type',
      keyword: 'type',
      params: { type: 'boolean' },
      message: 'must be boolean',
    };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs5 = errors;
    if (!(typeof data == 'number' && isFinite(data))) {
      const err2 = {
        instancePath,
        schemaPath: '#/oneOf/2/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    var _valid0 = _errs5 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs7 = errors;
      if (typeof data !== 'string') {
        const err3 = {
          instancePath,
          schemaPath: '#/oneOf/3/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs9 = errors;
        if (Array.isArray(data)) {
          const len0 = data.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (
              !wrapper0.validate(data[i0], {
                instancePath: instancePath + '/' + i0,
                parentData: data,
                parentDataProperty: i0,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? wrapper0.validate.errors
                  : vErrors.concat(wrapper0.validate.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err4 = {
            instancePath,
            schemaPath: '#/oneOf/4/type',
            keyword: 'type',
            params: { type: 'array' },
            message: 'must be array',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        var _valid0 = _errs9 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            var items1 = true;
          }
          const _errs12 = errors;
          if (data && typeof data == 'object' && !Array.isArray(data)) {
            for (const key0 in data) {
              if (
                !wrapper0.validate(data[key0], {
                  instancePath:
                    instancePath +
                    '/' +
                    key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                  parentData: data,
                  parentDataProperty: key0,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? wrapper0.validate.errors
                    : vErrors.concat(wrapper0.validate.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err5 = {
              instancePath,
              schemaPath: '#/oneOf/5/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          var _valid0 = _errs12 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              var props2 = true;
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err6 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate21.errors = vErrors;
  evaluated0.props = props2;
  evaluated0.items = items1;
  return errors === 0;
}
validate21.evaluated = { dynamicProps: true, dynamicItems: true };
function validate20(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  /*# sourceURL="https://prodivix.dev/schemas/runtime-envelope-v1.schema.json" */ let vErrors =
    null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs2 = errors;
  let valid1 = true;
  const _errs3 = errors;
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    let missing0;
    if (data.kind === undefined && (missing0 = 'kind')) {
      const err0 = {};
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.kind !== undefined) {
        if ('response' !== data.kind) {
          const err1 = {};
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
      }
    }
  }
  var _valid0 = _errs3 === errors;
  errors = _errs2;
  if (vErrors !== null) {
    if (_errs2) {
      vErrors.length = _errs2;
    } else {
      vErrors = null;
    }
  }
  let ifClause0;
  if (_valid0) {
    const _errs5 = errors;
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      if (data.replyTo === undefined) {
        const err2 = {
          instancePath,
          schemaPath: '#/allOf/0/then/required',
          keyword: 'required',
          params: { missingProperty: 'replyTo' },
          message: "must have required property '" + 'replyTo' + "'",
        };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (data.replyTo !== undefined) {
        let data1 = data.replyTo;
        if (typeof data1 === 'string') {
          if (func1(data1) > 128) {
            const err3 = {
              instancePath: instancePath + '/replyTo',
              schemaPath: '#/$defs/messageId/maxLength',
              keyword: 'maxLength',
              params: { limit: 128 },
              message: 'must NOT have more than 128 characters',
            };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
          if (func1(data1) < 3) {
            const err4 = {
              instancePath: instancePath + '/replyTo',
              schemaPath: '#/$defs/messageId/minLength',
              keyword: 'minLength',
              params: { limit: 3 },
              message: 'must NOT have fewer than 3 characters',
            };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
          if (!pattern4.test(data1)) {
            const err5 = {
              instancePath: instancePath + '/replyTo',
              schemaPath: '#/$defs/messageId/pattern',
              keyword: 'pattern',
              params: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$' },
              message:
                'must match pattern "' + '^[A-Za-z0-9][A-Za-z0-9._:-]*$' + '"',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        } else {
          const err6 = {
            instancePath: instancePath + '/replyTo',
            schemaPath: '#/$defs/messageId/type',
            keyword: 'type',
            params: { type: 'string' },
            message: 'must be string',
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      }
    }
    var _valid0 = _errs5 === errors;
    valid1 = _valid0;
    if (valid1) {
      var props0 = {};
      props0.replyTo = true;
      props0.kind = true;
    }
    ifClause0 = 'then';
  } else {
    const _errs9 = errors;
    const _errs10 = errors;
    const _errs11 = errors;
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing1;
      if (data.replyTo === undefined && (missing1 = 'replyTo')) {
        const err7 = {};
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    var valid5 = _errs11 === errors;
    if (valid5) {
      const err8 = {
        instancePath,
        schemaPath: '#/allOf/0/else/not',
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
      };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    } else {
      errors = _errs10;
      if (vErrors !== null) {
        if (_errs10) {
          vErrors.length = _errs10;
        } else {
          vErrors = null;
        }
      }
    }
    var _valid0 = _errs9 === errors;
    valid1 = _valid0;
    ifClause0 = 'else';
  }
  if (!valid1) {
    const err9 = {
      instancePath,
      schemaPath: '#/allOf/0/if',
      keyword: 'if',
      params: { failingKeyword: ifClause0 },
      message: 'must match "' + ifClause0 + '" schema',
    };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.protocol === undefined) {
      const err10 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'protocol' },
        message: "must have required property '" + 'protocol' + "'",
      };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.protocolVersion === undefined) {
      const err11 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'protocolVersion' },
        message: "must have required property '" + 'protocolVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err11];
      } else {
        vErrors.push(err11);
      }
      errors++;
    }
    if (data.kind === undefined) {
      const err12 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
    if (data.channel === undefined) {
      const err13 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'channel' },
        message: "must have required property '" + 'channel' + "'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err14 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err14];
      } else {
        vErrors.push(err14);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err15 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err15];
      } else {
        vErrors.push(err15);
      }
      errors++;
    }
    if (data.messageId === undefined) {
      const err16 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'messageId' },
        message: "must have required property '" + 'messageId' + "'",
      };
      if (vErrors === null) {
        vErrors = [err16];
      } else {
        vErrors.push(err16);
      }
      errors++;
    }
    if (data.sequence === undefined) {
      const err17 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'sequence' },
        message: "must have required property '" + 'sequence' + "'",
      };
      if (vErrors === null) {
        vErrors = [err17];
      } else {
        vErrors.push(err17);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err18 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err18];
      } else {
        vErrors.push(err18);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func3.call(schema31.properties, key0)) {
        const err19 = {
          instancePath,
          schemaPath: '#/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
    if (data.protocol !== undefined) {
      if ('prodivix.plugin-runtime' !== data.protocol) {
        const err20 = {
          instancePath: instancePath + '/protocol',
          schemaPath: '#/properties/protocol/const',
          keyword: 'const',
          params: { allowedValue: 'prodivix.plugin-runtime' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.protocolVersion !== undefined) {
      if ('1.0' !== data.protocolVersion) {
        const err21 = {
          instancePath: instancePath + '/protocolVersion',
          schemaPath: '#/properties/protocolVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data4 = data.kind;
      if (!(data4 === 'request' || data4 === 'response' || data4 === 'event')) {
        const err22 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema31.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
    if (data.channel !== undefined) {
      let data5 = data.channel;
      if (!(
        data5 === 'control' ||
        data5 === 'gateway' ||
        data5 === 'implementation'
      )) {
        const err23 = {
          instancePath: instancePath + '/channel',
          schemaPath: '#/properties/channel/enum',
          keyword: 'enum',
          params: { allowedValues: schema31.properties.channel.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      let data6 = data.method;
      if (typeof data6 === 'string') {
        if (func1(data6) > 96) {
          const err24 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/method/maxLength',
            keyword: 'maxLength',
            params: { limit: 96 },
            message: 'must NOT have more than 96 characters',
          };
          if (vErrors === null) {
            vErrors = [err24];
          } else {
            vErrors.push(err24);
          }
          errors++;
        }
        if (func1(data6) < 3) {
          const err25 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/method/minLength',
            keyword: 'minLength',
            params: { limit: 3 },
            message: 'must NOT have fewer than 3 characters',
          };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        if (!pattern5.test(data6)) {
          const err26 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/method/pattern',
            keyword: 'pattern',
            params: {
              pattern:
                '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$',
            },
            message:
              'must match pattern "' +
              '^[a-z][a-z0-9-]*(?:\\.[a-z][a-z0-9-]*)*(?:/[a-z][a-z0-9-]*)+$' +
              '"',
          };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
      } else {
        const err27 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      let data7 = data.contractVersion;
      if (typeof data7 === 'string') {
        if (func1(data7) > 24) {
          const err28 = {
            instancePath: instancePath + '/contractVersion',
            schemaPath: '#/$defs/contractVersion/maxLength',
            keyword: 'maxLength',
            params: { limit: 24 },
            message: 'must NOT have more than 24 characters',
          };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
        if (!pattern6.test(data7)) {
          const err29 = {
            instancePath: instancePath + '/contractVersion',
            schemaPath: '#/$defs/contractVersion/pattern',
            keyword: 'pattern',
            params: { pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$' },
            message:
              'must match pattern "' +
              '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$' +
              '"',
          };
          if (vErrors === null) {
            vErrors = [err29];
          } else {
            vErrors.push(err29);
          }
          errors++;
        }
      } else {
        const err30 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath: '#/$defs/contractVersion/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err30];
        } else {
          vErrors.push(err30);
        }
        errors++;
      }
    }
    if (data.messageId !== undefined) {
      let data8 = data.messageId;
      if (typeof data8 === 'string') {
        if (func1(data8) > 128) {
          const err31 = {
            instancePath: instancePath + '/messageId',
            schemaPath: '#/$defs/messageId/maxLength',
            keyword: 'maxLength',
            params: { limit: 128 },
            message: 'must NOT have more than 128 characters',
          };
          if (vErrors === null) {
            vErrors = [err31];
          } else {
            vErrors.push(err31);
          }
          errors++;
        }
        if (func1(data8) < 3) {
          const err32 = {
            instancePath: instancePath + '/messageId',
            schemaPath: '#/$defs/messageId/minLength',
            keyword: 'minLength',
            params: { limit: 3 },
            message: 'must NOT have fewer than 3 characters',
          };
          if (vErrors === null) {
            vErrors = [err32];
          } else {
            vErrors.push(err32);
          }
          errors++;
        }
        if (!pattern4.test(data8)) {
          const err33 = {
            instancePath: instancePath + '/messageId',
            schemaPath: '#/$defs/messageId/pattern',
            keyword: 'pattern',
            params: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$' },
            message:
              'must match pattern "' + '^[A-Za-z0-9][A-Za-z0-9._:-]*$' + '"',
          };
          if (vErrors === null) {
            vErrors = [err33];
          } else {
            vErrors.push(err33);
          }
          errors++;
        }
      } else {
        const err34 = {
          instancePath: instancePath + '/messageId',
          schemaPath: '#/$defs/messageId/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err34];
        } else {
          vErrors.push(err34);
        }
        errors++;
      }
    }
    if (data.replyTo !== undefined) {
      let data9 = data.replyTo;
      if (typeof data9 === 'string') {
        if (func1(data9) > 128) {
          const err35 = {
            instancePath: instancePath + '/replyTo',
            schemaPath: '#/$defs/messageId/maxLength',
            keyword: 'maxLength',
            params: { limit: 128 },
            message: 'must NOT have more than 128 characters',
          };
          if (vErrors === null) {
            vErrors = [err35];
          } else {
            vErrors.push(err35);
          }
          errors++;
        }
        if (func1(data9) < 3) {
          const err36 = {
            instancePath: instancePath + '/replyTo',
            schemaPath: '#/$defs/messageId/minLength',
            keyword: 'minLength',
            params: { limit: 3 },
            message: 'must NOT have fewer than 3 characters',
          };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
        if (!pattern4.test(data9)) {
          const err37 = {
            instancePath: instancePath + '/replyTo',
            schemaPath: '#/$defs/messageId/pattern',
            keyword: 'pattern',
            params: { pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]*$' },
            message:
              'must match pattern "' + '^[A-Za-z0-9][A-Za-z0-9._:-]*$' + '"',
          };
          if (vErrors === null) {
            vErrors = [err37];
          } else {
            vErrors.push(err37);
          }
          errors++;
        }
      } else {
        const err38 = {
          instancePath: instancePath + '/replyTo',
          schemaPath: '#/$defs/messageId/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err38];
        } else {
          vErrors.push(err38);
        }
        errors++;
      }
    }
    if (data.sequence !== undefined) {
      let data10 = data.sequence;
      if (!(
        typeof data10 == 'number' &&
        !(data10 % 1) &&
        !isNaN(data10) &&
        isFinite(data10)
      )) {
        const err39 = {
          instancePath: instancePath + '/sequence',
          schemaPath: '#/properties/sequence/type',
          keyword: 'type',
          params: { type: 'integer' },
          message: 'must be integer',
        };
        if (vErrors === null) {
          vErrors = [err39];
        } else {
          vErrors.push(err39);
        }
        errors++;
      }
      if (typeof data10 == 'number' && isFinite(data10)) {
        if (data10 > 9007199254740991 || isNaN(data10)) {
          const err40 = {
            instancePath: instancePath + '/sequence',
            schemaPath: '#/properties/sequence/maximum',
            keyword: 'maximum',
            params: { comparison: '<=', limit: 9007199254740991 },
            message: 'must be <= 9007199254740991',
          };
          if (vErrors === null) {
            vErrors = [err40];
          } else {
            vErrors.push(err40);
          }
          errors++;
        }
        if (data10 < 1 || isNaN(data10)) {
          const err41 = {
            instancePath: instancePath + '/sequence',
            schemaPath: '#/properties/sequence/minimum',
            keyword: 'minimum',
            params: { comparison: '>=', limit: 1 },
            message: 'must be >= 1',
          };
          if (vErrors === null) {
            vErrors = [err41];
          } else {
            vErrors.push(err41);
          }
          errors++;
        }
      }
    }
    if (data.payload !== undefined) {
      if (
        !validate21(data.payload, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate21.errors
            : vErrors.concat(validate21.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err42 = {
      instancePath,
      schemaPath: '#/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err42];
    } else {
      vErrors.push(err42);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
export const validateRuntimeControlSchema = validate23;
const schema38 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-control-v1.schema.json',
  title: 'RuntimeControlMessageV1',
  description:
    'Control-channel payload contracts for Prodivix plugin runtime lifecycle.',
  'x-prodivix-contract-version': '1.0',
  oneOf: [
    { $ref: '#/$defs/runtimeReadyEvent' },
    { $ref: '#/$defs/runtimeActivateRequest' },
    { $ref: '#/$defs/runtimeActivateResponse' },
    { $ref: '#/$defs/runtimeDeactivateRequest' },
    { $ref: '#/$defs/runtimeDeactivateResponse' },
    { $ref: '#/$defs/runtimeHeartbeatRequest' },
    { $ref: '#/$defs/runtimeHeartbeatResponse' },
    { $ref: '#/$defs/runtimeCancelEvent' },
    { $ref: '#/$defs/runtimeErrorEvent' },
  ],
  $defs: {
    contractMessage: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'method', 'contractVersion', 'payload'],
      properties: {
        kind: { enum: ['request', 'response', 'event'] },
        method: { type: 'string' },
        contractVersion: { const: '1.0' },
        payload: true,
      },
    },
    safeDiagnostic: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: {
        code: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
        message: { type: 'string', minLength: 1, maxLength: 512 },
        meta: {
          type: 'object',
          maxProperties: 16,
          additionalProperties: {
            type: ['null', 'boolean', 'number', 'string'],
          },
        },
      },
    },
    operationResponse: {
      type: 'object',
      additionalProperties: false,
      required: ['ok', 'diagnostics'],
      properties: {
        ok: { type: 'boolean' },
        diagnostics: {
          type: 'array',
          maxItems: 32,
          items: { $ref: '#/$defs/safeDiagnostic' },
        },
      },
    },
    runtimeReadyEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/ready' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['selectedProtocolVersion', 'runtimeDigest'],
              properties: {
                selectedProtocolVersion: { const: '1.0' },
                runtimeDigest: {
                  type: 'string',
                  pattern: '^sha256-[A-Za-z0-9+/]{43}=$',
                },
                runtimeModuleVersion: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 64,
                },
              },
            },
          },
        },
      ],
    },
    runtimeActivateRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/activate' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['event'],
              properties: {
                event: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
              },
            },
          },
        },
      ],
    },
    runtimeActivateResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/activate' },
            payload: { $ref: '#/$defs/operationResponse' },
          },
        },
      ],
    },
    runtimeDeactivateRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/deactivate' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['reason'],
              properties: {
                reason: {
                  enum: [
                    'manual',
                    'disable',
                    'permission-revoked',
                    'generation-replaced',
                    'activation-rollback',
                    'host-shutdown',
                  ],
                },
              },
            },
          },
        },
      ],
    },
    runtimeDeactivateResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/deactivate' },
            payload: { $ref: '#/$defs/operationResponse' },
          },
        },
      ],
    },
    runtimeHeartbeatRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime/heartbeat' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['nonce'],
              properties: {
                nonce: { type: 'string', minLength: 1, maxLength: 128 },
              },
            },
          },
        },
      ],
    },
    runtimeHeartbeatResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime/heartbeat' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['nonce'],
              properties: {
                nonce: { type: 'string', minLength: 1, maxLength: 128 },
              },
            },
          },
        },
      ],
    },
    runtimeCancelEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/cancel' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['requestId', 'reasonCode'],
              properties: {
                requestId: { type: 'string', minLength: 3, maxLength: 128 },
                reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
              },
            },
          },
        },
      ],
    },
    runtimeErrorEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'runtime/error' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['reasonCode', 'safeMessage'],
              properties: {
                reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
                safeMessage: { type: 'string', minLength: 1, maxLength: 512 },
              },
            },
          },
        },
      ],
    },
  },
};
const schema39 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'event' },
        method: { const: 'runtime/ready' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['selectedProtocolVersion', 'runtimeDigest'],
          properties: {
            selectedProtocolVersion: { const: '1.0' },
            runtimeDigest: {
              type: 'string',
              pattern: '^sha256-[A-Za-z0-9+/]{43}=$',
            },
            runtimeModuleVersion: {
              type: 'string',
              minLength: 1,
              maxLength: 64,
            },
          },
        },
      },
    },
  ],
};
const schema40 = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'method', 'contractVersion', 'payload'],
  properties: {
    kind: { enum: ['request', 'response', 'event'] },
    method: { type: 'string' },
    contractVersion: { const: '1.0' },
    payload: true,
  },
};
const pattern9 = new RegExp('^sha256-[A-Za-z0-9+/]{43}=$', 'u');
function validate24(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate24.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('event' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'event' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/ready' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/ready' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.selectedProtocolVersion === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'selectedProtocolVersion' },
            message:
              "must have required property '" + 'selectedProtocolVersion' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.runtimeDigest === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'runtimeDigest' },
            message: "must have required property '" + 'runtimeDigest' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'selectedProtocolVersion' ||
            key1 === 'runtimeDigest' ||
            key1 === 'runtimeModuleVersion'
          )) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.selectedProtocolVersion !== undefined) {
          if ('1.0' !== data5.selectedProtocolVersion) {
            const err14 = {
              instancePath: instancePath + '/payload/selectedProtocolVersion',
              schemaPath:
                '#/allOf/1/properties/payload/properties/selectedProtocolVersion/const',
              keyword: 'const',
              params: { allowedValue: '1.0' },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.runtimeDigest !== undefined) {
          let data7 = data5.runtimeDigest;
          if (typeof data7 === 'string') {
            if (!pattern9.test(data7)) {
              const err15 = {
                instancePath: instancePath + '/payload/runtimeDigest',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/runtimeDigest/pattern',
                keyword: 'pattern',
                params: { pattern: '^sha256-[A-Za-z0-9+/]{43}=$' },
                message:
                  'must match pattern "' + '^sha256-[A-Za-z0-9+/]{43}=$' + '"',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = {
              instancePath: instancePath + '/payload/runtimeDigest',
              schemaPath:
                '#/allOf/1/properties/payload/properties/runtimeDigest/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data5.runtimeModuleVersion !== undefined) {
          let data8 = data5.runtimeModuleVersion;
          if (typeof data8 === 'string') {
            if (func1(data8) > 64) {
              const err17 = {
                instancePath: instancePath + '/payload/runtimeModuleVersion',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/runtimeModuleVersion/maxLength',
                keyword: 'maxLength',
                params: { limit: 64 },
                message: 'must NOT have more than 64 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (func1(data8) < 1) {
              const err18 = {
                instancePath: instancePath + '/payload/runtimeModuleVersion',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/runtimeModuleVersion/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          } else {
            const err19 = {
              instancePath: instancePath + '/payload/runtimeModuleVersion',
              schemaPath:
                '#/allOf/1/properties/payload/properties/runtimeModuleVersion/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
  }
  validate24.errors = vErrors;
  return errors === 0;
}
validate24.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema41 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'runtime/activate' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['event'],
          properties: {
            event: { $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue' },
          },
        },
      },
    },
  ],
};
function validate27(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data !== null) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf/0/type',
      keyword: 'type',
      params: { type: 'null' },
      message: 'must be null',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (typeof data !== 'boolean') {
    const err1 = {
      instancePath,
      schemaPath: '#/oneOf/1/type',
      keyword: 'type',
      params: { type: 'boolean' },
      message: 'must be boolean',
    };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs5 = errors;
    if (!(typeof data == 'number' && isFinite(data))) {
      const err2 = {
        instancePath,
        schemaPath: '#/oneOf/2/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    var _valid0 = _errs5 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs7 = errors;
      if (typeof data !== 'string') {
        const err3 = {
          instancePath,
          schemaPath: '#/oneOf/3/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs9 = errors;
        if (Array.isArray(data)) {
          const len0 = data.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (
              !validate21(data[i0], {
                instancePath: instancePath + '/' + i0,
                parentData: data,
                parentDataProperty: i0,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate21.errors
                  : vErrors.concat(validate21.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err4 = {
            instancePath,
            schemaPath: '#/oneOf/4/type',
            keyword: 'type',
            params: { type: 'array' },
            message: 'must be array',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        var _valid0 = _errs9 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            var items1 = true;
          }
          const _errs12 = errors;
          if (data && typeof data == 'object' && !Array.isArray(data)) {
            for (const key0 in data) {
              if (
                !validate21(data[key0], {
                  instancePath:
                    instancePath +
                    '/' +
                    key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                  parentData: data,
                  parentDataProperty: key0,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate21.errors
                    : vErrors.concat(validate21.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err5 = {
              instancePath,
              schemaPath: '#/oneOf/5/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          var _valid0 = _errs12 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              var props2 = true;
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err6 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate27.errors = vErrors;
  evaluated0.props = props2;
  evaluated0.items = items1;
  return errors === 0;
}
validate27.evaluated = { dynamicProps: true, dynamicItems: true };
function validate26(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate26.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/activate' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/activate' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.event === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'event' },
            message: "must have required property '" + 'event' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'event')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.event !== undefined) {
          if (
            !validate27(data5.event, {
              instancePath: instancePath + '/payload/event',
              parentData: data5,
              parentDataProperty: 'event',
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate27.errors
                : vErrors.concat(validate27.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err13 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
  }
  validate26.errors = vErrors;
  return errors === 0;
}
validate26.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema44 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'runtime/activate' },
        payload: { $ref: '#/$defs/operationResponse' },
      },
    },
  ],
};
const schema46 = {
  type: 'object',
  additionalProperties: false,
  required: ['ok', 'diagnostics'],
  properties: {
    ok: { type: 'boolean' },
    diagnostics: {
      type: 'array',
      maxItems: 32,
      items: { $ref: '#/$defs/safeDiagnostic' },
    },
  },
};
const schema47 = {
  type: 'object',
  additionalProperties: false,
  required: ['code', 'message'],
  properties: {
    code: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
    message: { type: 'string', minLength: 1, maxLength: 512 },
    meta: {
      type: 'object',
      maxProperties: 16,
      additionalProperties: { type: ['null', 'boolean', 'number', 'string'] },
    },
  },
};
const pattern10 = new RegExp('^[A-Z]+-[0-9]{4}$', 'u');
function validate33(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate33.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.ok === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'ok' },
        message: "must have required property '" + 'ok' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.diagnostics === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'diagnostics' },
        message: "must have required property '" + 'diagnostics' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === 'ok' || key0 === 'diagnostics')) {
        const err2 = {
          instancePath,
          schemaPath: '#/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.ok !== undefined) {
      if (typeof data.ok !== 'boolean') {
        const err3 = {
          instancePath: instancePath + '/ok',
          schemaPath: '#/properties/ok/type',
          keyword: 'type',
          params: { type: 'boolean' },
          message: 'must be boolean',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.diagnostics !== undefined) {
      let data1 = data.diagnostics;
      if (Array.isArray(data1)) {
        if (data1.length > 32) {
          const err4 = {
            instancePath: instancePath + '/diagnostics',
            schemaPath: '#/properties/diagnostics/maxItems',
            keyword: 'maxItems',
            params: { limit: 32 },
            message: 'must NOT have more than 32 items',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data2 = data1[i0];
          if (data2 && typeof data2 == 'object' && !Array.isArray(data2)) {
            if (data2.code === undefined) {
              const err5 = {
                instancePath: instancePath + '/diagnostics/' + i0,
                schemaPath: '#/$defs/safeDiagnostic/required',
                keyword: 'required',
                params: { missingProperty: 'code' },
                message: "must have required property '" + 'code' + "'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data2.message === undefined) {
              const err6 = {
                instancePath: instancePath + '/diagnostics/' + i0,
                schemaPath: '#/$defs/safeDiagnostic/required',
                keyword: 'required',
                params: { missingProperty: 'message' },
                message: "must have required property '" + 'message' + "'",
              };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            for (const key1 in data2) {
              if (!(key1 === 'code' || key1 === 'message' || key1 === 'meta')) {
                const err7 = {
                  instancePath: instancePath + '/diagnostics/' + i0,
                  schemaPath: '#/$defs/safeDiagnostic/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key1 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
            }
            if (data2.code !== undefined) {
              let data3 = data2.code;
              if (typeof data3 === 'string') {
                if (!pattern10.test(data3)) {
                  const err8 = {
                    instancePath: instancePath + '/diagnostics/' + i0 + '/code',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/code/pattern',
                    keyword: 'pattern',
                    params: { pattern: '^[A-Z]+-[0-9]{4}$' },
                    message: 'must match pattern "' + '^[A-Z]+-[0-9]{4}$' + '"',
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
              } else {
                const err9 = {
                  instancePath: instancePath + '/diagnostics/' + i0 + '/code',
                  schemaPath: '#/$defs/safeDiagnostic/properties/code/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
            }
            if (data2.message !== undefined) {
              let data4 = data2.message;
              if (typeof data4 === 'string') {
                if (func1(data4) > 512) {
                  const err10 = {
                    instancePath:
                      instancePath + '/diagnostics/' + i0 + '/message',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/message/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 512 },
                    message: 'must NOT have more than 512 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                if (func1(data4) < 1) {
                  const err11 = {
                    instancePath:
                      instancePath + '/diagnostics/' + i0 + '/message',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/message/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
              } else {
                const err12 = {
                  instancePath:
                    instancePath + '/diagnostics/' + i0 + '/message',
                  schemaPath: '#/$defs/safeDiagnostic/properties/message/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
            }
            if (data2.meta !== undefined) {
              let data5 = data2.meta;
              if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
                if (Object.keys(data5).length > 16) {
                  const err13 = {
                    instancePath: instancePath + '/diagnostics/' + i0 + '/meta',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/meta/maxProperties',
                    keyword: 'maxProperties',
                    params: { limit: 16 },
                    message: 'must NOT have more than 16 properties',
                  };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                for (const key2 in data5) {
                  let data6 = data5[key2];
                  if (
                    data6 !== null &&
                    typeof data6 !== 'boolean' &&
                    !(typeof data6 == 'number' && isFinite(data6)) &&
                    typeof data6 !== 'string'
                  ) {
                    const err14 = {
                      instancePath:
                        instancePath +
                        '/diagnostics/' +
                        i0 +
                        '/meta/' +
                        key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                      schemaPath:
                        '#/$defs/safeDiagnostic/properties/meta/additionalProperties/type',
                      keyword: 'type',
                      params: {
                        type: schema47.properties.meta.additionalProperties
                          .type,
                      },
                      message: 'must be null,boolean,number,string',
                    };
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                }
              } else {
                const err15 = {
                  instancePath: instancePath + '/diagnostics/' + i0 + '/meta',
                  schemaPath: '#/$defs/safeDiagnostic/properties/meta/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
            }
          } else {
            const err16 = {
              instancePath: instancePath + '/diagnostics/' + i0,
              schemaPath: '#/$defs/safeDiagnostic/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
      } else {
        const err17 = {
          instancePath: instancePath + '/diagnostics',
          schemaPath: '#/properties/diagnostics/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
        };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
  } else {
    const err18 = {
      instancePath,
      schemaPath: '#/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err18];
    } else {
      vErrors.push(err18);
    }
    errors++;
  }
  validate33.errors = vErrors;
  return errors === 0;
}
validate33.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate32(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate32.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/activate' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/activate' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      if (
        !validate33(data.payload, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate33.errors
            : vErrors.concat(validate33.errors);
        errors = vErrors.length;
      }
    }
  }
  validate32.errors = vErrors;
  return errors === 0;
}
validate32.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema48 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'runtime/deactivate' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['reason'],
          properties: {
            reason: {
              enum: [
                'manual',
                'disable',
                'permission-revoked',
                'generation-replaced',
                'activation-rollback',
                'host-shutdown',
              ],
            },
          },
        },
      },
    },
  ],
};
function validate36(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate36.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/deactivate' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/deactivate' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.reason === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'reason' },
            message: "must have required property '" + 'reason' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'reason')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.reason !== undefined) {
          let data6 = data5.reason;
          if (!(
            data6 === 'manual' ||
            data6 === 'disable' ||
            data6 === 'permission-revoked' ||
            data6 === 'generation-replaced' ||
            data6 === 'activation-rollback' ||
            data6 === 'host-shutdown'
          )) {
            const err13 = {
              instancePath: instancePath + '/payload/reason',
              schemaPath: '#/allOf/1/properties/payload/properties/reason/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema48.allOf[1].properties.payload.properties.reason.enum,
              },
              message: 'must be equal to one of the allowed values',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
      } else {
        const err14 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  }
  validate36.errors = vErrors;
  return errors === 0;
}
validate36.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema50 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'runtime/deactivate' },
        payload: { $ref: '#/$defs/operationResponse' },
      },
    },
  ],
};
function validate38(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate38.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/deactivate' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/deactivate' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      if (
        !validate33(data.payload, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate33.errors
            : vErrors.concat(validate33.errors);
        errors = vErrors.length;
      }
    }
  }
  validate38.errors = vErrors;
  return errors === 0;
}
validate38.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema52 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'runtime/heartbeat' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['nonce'],
          properties: {
            nonce: { type: 'string', minLength: 1, maxLength: 128 },
          },
        },
      },
    },
  ],
};
function validate41(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate41.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/heartbeat' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/heartbeat' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.nonce === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'nonce' },
            message: "must have required property '" + 'nonce' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'nonce')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.nonce !== undefined) {
          let data6 = data5.nonce;
          if (typeof data6 === 'string') {
            if (func1(data6) > 128) {
              const err13 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/maxLength',
                keyword: 'maxLength',
                params: { limit: 128 },
                message: 'must NOT have more than 128 characters',
              };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err14 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          } else {
            const err15 = {
              instancePath: instancePath + '/payload/nonce',
              schemaPath: '#/allOf/1/properties/payload/properties/nonce/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
      } else {
        const err16 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  }
  validate41.errors = vErrors;
  return errors === 0;
}
validate41.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema54 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'runtime/heartbeat' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['nonce'],
          properties: {
            nonce: { type: 'string', minLength: 1, maxLength: 128 },
          },
        },
      },
    },
  ],
};
function validate43(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate43.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/heartbeat' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/heartbeat' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.nonce === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'nonce' },
            message: "must have required property '" + 'nonce' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'nonce')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.nonce !== undefined) {
          let data6 = data5.nonce;
          if (typeof data6 === 'string') {
            if (func1(data6) > 128) {
              const err13 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/maxLength',
                keyword: 'maxLength',
                params: { limit: 128 },
                message: 'must NOT have more than 128 characters',
              };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err14 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          } else {
            const err15 = {
              instancePath: instancePath + '/payload/nonce',
              schemaPath: '#/allOf/1/properties/payload/properties/nonce/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
      } else {
        const err16 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  }
  validate43.errors = vErrors;
  return errors === 0;
}
validate43.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema56 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'event' },
        method: { const: 'runtime/cancel' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['requestId', 'reasonCode'],
          properties: {
            requestId: { type: 'string', minLength: 3, maxLength: 128 },
            reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
          },
        },
      },
    },
  ],
};
function validate45(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate45.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('event' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'event' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/cancel' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/cancel' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.requestId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'requestId' },
            message: "must have required property '" + 'requestId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.reasonCode === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'reasonCode' },
            message: "must have required property '" + 'reasonCode' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'requestId' || key1 === 'reasonCode')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.requestId !== undefined) {
          let data6 = data5.requestId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 128) {
              const err14 = {
                instancePath: instancePath + '/payload/requestId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/requestId/maxLength',
                keyword: 'maxLength',
                params: { limit: 128 },
                message: 'must NOT have more than 128 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 3) {
              const err15 = {
                instancePath: instancePath + '/payload/requestId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/requestId/minLength',
                keyword: 'minLength',
                params: { limit: 3 },
                message: 'must NOT have fewer than 3 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = {
              instancePath: instancePath + '/payload/requestId',
              schemaPath:
                '#/allOf/1/properties/payload/properties/requestId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data5.reasonCode !== undefined) {
          let data7 = data5.reasonCode;
          if (typeof data7 === 'string') {
            if (func1(data7) > 96) {
              const err17 = {
                instancePath: instancePath + '/payload/reasonCode',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/reasonCode/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err18 = {
                instancePath: instancePath + '/payload/reasonCode',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/reasonCode/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          } else {
            const err19 = {
              instancePath: instancePath + '/payload/reasonCode',
              schemaPath:
                '#/allOf/1/properties/payload/properties/reasonCode/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
  }
  validate45.errors = vErrors;
  return errors === 0;
}
validate45.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema58 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'event' },
        method: { const: 'runtime/error' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['reasonCode', 'safeMessage'],
          properties: {
            reasonCode: { type: 'string', minLength: 1, maxLength: 96 },
            safeMessage: { type: 'string', minLength: 1, maxLength: 512 },
          },
        },
      },
    },
  ],
};
function validate47(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate47.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema40.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('event' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'event' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime/error' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime/error' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.reasonCode === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'reasonCode' },
            message: "must have required property '" + 'reasonCode' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.safeMessage === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'safeMessage' },
            message: "must have required property '" + 'safeMessage' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'reasonCode' || key1 === 'safeMessage')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.reasonCode !== undefined) {
          let data6 = data5.reasonCode;
          if (typeof data6 === 'string') {
            if (func1(data6) > 96) {
              const err14 = {
                instancePath: instancePath + '/payload/reasonCode',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/reasonCode/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err15 = {
                instancePath: instancePath + '/payload/reasonCode',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/reasonCode/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = {
              instancePath: instancePath + '/payload/reasonCode',
              schemaPath:
                '#/allOf/1/properties/payload/properties/reasonCode/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data5.safeMessage !== undefined) {
          let data7 = data5.safeMessage;
          if (typeof data7 === 'string') {
            if (func1(data7) > 512) {
              const err17 = {
                instancePath: instancePath + '/payload/safeMessage',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/safeMessage/maxLength',
                keyword: 'maxLength',
                params: { limit: 512 },
                message: 'must NOT have more than 512 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err18 = {
                instancePath: instancePath + '/payload/safeMessage',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/safeMessage/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          } else {
            const err19 = {
              instancePath: instancePath + '/payload/safeMessage',
              schemaPath:
                '#/allOf/1/properties/payload/properties/safeMessage/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
  }
  validate47.errors = vErrors;
  return errors === 0;
}
validate47.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate23(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  /*# sourceURL="https://prodivix.dev/schemas/runtime-control-v1.schema.json" */ let vErrors =
    null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (
    !validate24(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs2 = errors;
  if (
    !validate26(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs3 = errors;
    if (
      !validate32(data, {
        instancePath,
        parentData,
        parentDataProperty,
        rootData,
        dynamicAnchors,
      })
    ) {
      vErrors =
        vErrors === null
          ? validate32.errors
          : vErrors.concat(validate32.errors);
      errors = vErrors.length;
    }
    var _valid0 = _errs3 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
      const _errs4 = errors;
      if (
        !validate36(data, {
          instancePath,
          parentData,
          parentDataProperty,
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate36.errors
            : vErrors.concat(validate36.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs4 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
          if (props0 !== true) {
            props0 = true;
          }
        }
        const _errs5 = errors;
        if (
          !validate38(data, {
            instancePath,
            parentData,
            parentDataProperty,
            rootData,
            dynamicAnchors,
          })
        ) {
          vErrors =
            vErrors === null
              ? validate38.errors
              : vErrors.concat(validate38.errors);
          errors = vErrors.length;
        }
        var _valid0 = _errs5 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            if (props0 !== true) {
              props0 = true;
            }
          }
          const _errs6 = errors;
          if (
            !validate41(data, {
              instancePath,
              parentData,
              parentDataProperty,
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate41.errors
                : vErrors.concat(validate41.errors);
            errors = vErrors.length;
          }
          var _valid0 = _errs6 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              if (props0 !== true) {
                props0 = true;
              }
            }
            const _errs7 = errors;
            if (
              !validate43(data, {
                instancePath,
                parentData,
                parentDataProperty,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate43.errors
                  : vErrors.concat(validate43.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs7 === errors;
            if (_valid0 && valid0) {
              valid0 = false;
              passing0 = [passing0, 6];
            } else {
              if (_valid0) {
                valid0 = true;
                passing0 = 6;
                if (props0 !== true) {
                  props0 = true;
                }
              }
              const _errs8 = errors;
              if (
                !validate45(data, {
                  instancePath,
                  parentData,
                  parentDataProperty,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate45.errors
                    : vErrors.concat(validate45.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs8 === errors;
              if (_valid0 && valid0) {
                valid0 = false;
                passing0 = [passing0, 7];
              } else {
                if (_valid0) {
                  valid0 = true;
                  passing0 = 7;
                  if (props0 !== true) {
                    props0 = true;
                  }
                }
                const _errs9 = errors;
                if (
                  !validate47(data, {
                    instancePath,
                    parentData,
                    parentDataProperty,
                    rootData,
                    dynamicAnchors,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate47.errors
                      : vErrors.concat(validate47.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                if (_valid0 && valid0) {
                  valid0 = false;
                  passing0 = [passing0, 8];
                } else {
                  if (_valid0) {
                    valid0 = true;
                    passing0 = 8;
                    if (props0 !== true) {
                      props0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate23.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate23.evaluated = { dynamicProps: true, dynamicItems: false };
export const validateRuntimeImplementationSchema = validate49;
const schema60 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/runtime-implementation-v1.schema.json',
  title: 'RuntimeImplementationMessageV1',
  description:
    'Implementation binding and invocation payload contracts for plugin runtimes.',
  'x-prodivix-contract-version': '1.0',
  oneOf: [
    { $ref: '#/$defs/bindEvent' },
    { $ref: '#/$defs/unbindEvent' },
    { $ref: '#/$defs/invokeRequest' },
    { $ref: '#/$defs/invokeResponse' },
  ],
  $defs: {
    contractMessage: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'method', 'contractVersion', 'payload'],
      properties: {
        kind: { enum: ['request', 'response', 'event'] },
        method: { type: 'string' },
        contractVersion: { const: '1.0' },
        payload: true,
      },
    },
    localId: {
      type: 'string',
      minLength: 1,
      maxLength: 96,
      pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
    },
    methodBinding: {
      type: 'object',
      additionalProperties: false,
      required: ['method', 'contractVersion', 'required'],
      properties: {
        method: { $ref: '#/$defs/localId' },
        contractVersion: {
          type: 'string',
          pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
        },
        required: { type: 'boolean' },
      },
    },
    bindEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'implementation/bind' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['contributionId', 'implementationId', 'methods'],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
                methods: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 32,
                  items: { $ref: '#/$defs/methodBinding' },
                },
              },
            },
          },
        },
      ],
    },
    unbindEvent: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'event' },
            method: { const: 'implementation/unbind' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['contributionId', 'implementationId'],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
              },
            },
          },
        },
      ],
    },
    invokeRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'implementation/invoke' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: [
                'contributionId',
                'implementationId',
                'method',
                'arguments',
              ],
              properties: {
                contributionId: { $ref: '#/$defs/localId' },
                implementationId: { $ref: '#/$defs/localId' },
                method: { $ref: '#/$defs/localId' },
                arguments: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
              },
            },
          },
        },
      ],
    },
    invokeResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'implementation/invoke' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['ok'],
              properties: {
                ok: { type: 'boolean' },
                value: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
                errorCode: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
              },
            },
          },
        },
      ],
    },
  },
};
const schema61 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'event' },
        method: { const: 'implementation/bind' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['contributionId', 'implementationId', 'methods'],
          properties: {
            contributionId: { $ref: '#/$defs/localId' },
            implementationId: { $ref: '#/$defs/localId' },
            methods: {
              type: 'array',
              minItems: 1,
              maxItems: 32,
              items: { $ref: '#/$defs/methodBinding' },
            },
          },
        },
      },
    },
  ],
};
const schema62 = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'method', 'contractVersion', 'payload'],
  properties: {
    kind: { enum: ['request', 'response', 'event'] },
    method: { type: 'string' },
    contractVersion: { const: '1.0' },
    payload: true,
  },
};
const schema63 = {
  type: 'string',
  minLength: 1,
  maxLength: 96,
  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
};
const pattern11 = new RegExp('^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$', 'u');
const schema65 = {
  type: 'object',
  additionalProperties: false,
  required: ['method', 'contractVersion', 'required'],
  properties: {
    method: { $ref: '#/$defs/localId' },
    contractVersion: {
      type: 'string',
      pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$',
    },
    required: { type: 'boolean' },
  },
};
function validate51(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate51.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.method === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.required === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'required' },
        message: "must have required property '" + 'required' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'required'
      )) {
        const err3 = {
          instancePath,
          schemaPath: '#/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      let data0 = data.method;
      if (typeof data0 === 'string') {
        if (func1(data0) > 96) {
          const err4 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/localId/maxLength',
            keyword: 'maxLength',
            params: { limit: 96 },
            message: 'must NOT have more than 96 characters',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (func1(data0) < 1) {
          const err5 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/localId/minLength',
            keyword: 'minLength',
            params: { limit: 1 },
            message: 'must NOT have fewer than 1 characters',
          };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (!pattern11.test(data0)) {
          const err6 = {
            instancePath: instancePath + '/method',
            schemaPath: '#/$defs/localId/pattern',
            keyword: 'pattern',
            params: { pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' },
            message:
              'must match pattern "' +
              '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
              '"',
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/localId/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      let data1 = data.contractVersion;
      if (typeof data1 === 'string') {
        if (!pattern6.test(data1)) {
          const err8 = {
            instancePath: instancePath + '/contractVersion',
            schemaPath: '#/properties/contractVersion/pattern',
            keyword: 'pattern',
            params: { pattern: '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$' },
            message:
              'must match pattern "' +
              '^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$' +
              '"',
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath: '#/properties/contractVersion/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.required !== undefined) {
      if (typeof data.required !== 'boolean') {
        const err10 = {
          instancePath: instancePath + '/required',
          schemaPath: '#/properties/required/type',
          keyword: 'type',
          params: { type: 'boolean' },
          message: 'must be boolean',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
  } else {
    const err11 = {
      instancePath,
      schemaPath: '#/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err11];
    } else {
      vErrors.push(err11);
    }
    errors++;
  }
  validate51.errors = vErrors;
  return errors === 0;
}
validate51.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate50(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate50.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema62.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('event' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'event' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('implementation/bind' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'implementation/bind' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.contributionId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'contributionId' },
            message: "must have required property '" + 'contributionId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.implementationId === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'implementationId' },
            message: "must have required property '" + 'implementationId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.methods === undefined) {
          const err13 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'methods' },
            message: "must have required property '" + 'methods' + "'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'contributionId' ||
            key1 === 'implementationId' ||
            key1 === 'methods'
          )) {
            const err14 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.contributionId !== undefined) {
          let data6 = data5.contributionId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 96) {
              const err15 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err16 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (!pattern11.test(data6)) {
              const err17 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          } else {
            const err18 = {
              instancePath: instancePath + '/payload/contributionId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
        if (data5.implementationId !== undefined) {
          let data7 = data5.implementationId;
          if (typeof data7 === 'string') {
            if (func1(data7) > 96) {
              const err19 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err20 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (!pattern11.test(data7)) {
              const err21 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
          } else {
            const err22 = {
              instancePath: instancePath + '/payload/implementationId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        if (data5.methods !== undefined) {
          let data8 = data5.methods;
          if (Array.isArray(data8)) {
            if (data8.length > 32) {
              const err23 = {
                instancePath: instancePath + '/payload/methods',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/methods/maxItems',
                keyword: 'maxItems',
                params: { limit: 32 },
                message: 'must NOT have more than 32 items',
              };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (data8.length < 1) {
              const err24 = {
                instancePath: instancePath + '/payload/methods',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/methods/minItems',
                keyword: 'minItems',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 items',
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            const len0 = data8.length;
            for (let i0 = 0; i0 < len0; i0++) {
              if (
                !validate51(data8[i0], {
                  instancePath: instancePath + '/payload/methods/' + i0,
                  parentData: data8,
                  parentDataProperty: i0,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate51.errors
                    : vErrors.concat(validate51.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err25 = {
              instancePath: instancePath + '/payload/methods',
              schemaPath:
                '#/allOf/1/properties/payload/properties/methods/type',
              keyword: 'type',
              params: { type: 'array' },
              message: 'must be array',
            };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      } else {
        const err26 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
  }
  validate50.errors = vErrors;
  return errors === 0;
}
validate50.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema67 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'event' },
        method: { const: 'implementation/unbind' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['contributionId', 'implementationId'],
          properties: {
            contributionId: { $ref: '#/$defs/localId' },
            implementationId: { $ref: '#/$defs/localId' },
          },
        },
      },
    },
  ],
};
function validate54(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate54.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema62.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('event' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'event' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('implementation/unbind' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'implementation/unbind' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.contributionId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'contributionId' },
            message: "must have required property '" + 'contributionId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.implementationId === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'implementationId' },
            message: "must have required property '" + 'implementationId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'contributionId' || key1 === 'implementationId')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.contributionId !== undefined) {
          let data6 = data5.contributionId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 96) {
              const err14 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err15 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (!pattern11.test(data6)) {
              const err16 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          } else {
            const err17 = {
              instancePath: instancePath + '/payload/contributionId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
        if (data5.implementationId !== undefined) {
          let data7 = data5.implementationId;
          if (typeof data7 === 'string') {
            if (func1(data7) > 96) {
              const err18 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err19 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (!pattern11.test(data7)) {
              const err20 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          } else {
            const err21 = {
              instancePath: instancePath + '/payload/implementationId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
      } else {
        const err22 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
  }
  validate54.errors = vErrors;
  return errors === 0;
}
validate54.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema71 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'implementation/invoke' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: [
            'contributionId',
            'implementationId',
            'method',
            'arguments',
          ],
          properties: {
            contributionId: { $ref: '#/$defs/localId' },
            implementationId: { $ref: '#/$defs/localId' },
            method: { $ref: '#/$defs/localId' },
            arguments: {
              $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
            },
          },
        },
      },
    },
  ],
};
function validate57(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate57.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data !== null) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf/0/type',
      keyword: 'type',
      params: { type: 'null' },
      message: 'must be null',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (typeof data !== 'boolean') {
    const err1 = {
      instancePath,
      schemaPath: '#/oneOf/1/type',
      keyword: 'type',
      params: { type: 'boolean' },
      message: 'must be boolean',
    };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs5 = errors;
    if (!(typeof data == 'number' && isFinite(data))) {
      const err2 = {
        instancePath,
        schemaPath: '#/oneOf/2/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    var _valid0 = _errs5 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs7 = errors;
      if (typeof data !== 'string') {
        const err3 = {
          instancePath,
          schemaPath: '#/oneOf/3/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs9 = errors;
        if (Array.isArray(data)) {
          const len0 = data.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (
              !validate21(data[i0], {
                instancePath: instancePath + '/' + i0,
                parentData: data,
                parentDataProperty: i0,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate21.errors
                  : vErrors.concat(validate21.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err4 = {
            instancePath,
            schemaPath: '#/oneOf/4/type',
            keyword: 'type',
            params: { type: 'array' },
            message: 'must be array',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        var _valid0 = _errs9 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            var items1 = true;
          }
          const _errs12 = errors;
          if (data && typeof data == 'object' && !Array.isArray(data)) {
            for (const key0 in data) {
              if (
                !validate21(data[key0], {
                  instancePath:
                    instancePath +
                    '/' +
                    key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                  parentData: data,
                  parentDataProperty: key0,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate21.errors
                    : vErrors.concat(validate21.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err5 = {
              instancePath,
              schemaPath: '#/oneOf/5/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          var _valid0 = _errs12 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              var props2 = true;
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err6 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate57.errors = vErrors;
  evaluated0.props = props2;
  evaluated0.items = items1;
  return errors === 0;
}
validate57.evaluated = { dynamicProps: true, dynamicItems: true };
function validate56(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate56.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema62.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('implementation/invoke' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'implementation/invoke' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.contributionId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'contributionId' },
            message: "must have required property '" + 'contributionId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.implementationId === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'implementationId' },
            message: "must have required property '" + 'implementationId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.method === undefined) {
          const err13 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'method' },
            message: "must have required property '" + 'method' + "'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data5.arguments === undefined) {
          const err14 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'arguments' },
            message: "must have required property '" + 'arguments' + "'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'contributionId' ||
            key1 === 'implementationId' ||
            key1 === 'method' ||
            key1 === 'arguments'
          )) {
            const err15 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
        if (data5.contributionId !== undefined) {
          let data6 = data5.contributionId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 96) {
              const err16 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err17 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (!pattern11.test(data6)) {
              const err18 = {
                instancePath: instancePath + '/payload/contributionId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          } else {
            const err19 = {
              instancePath: instancePath + '/payload/contributionId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
        if (data5.implementationId !== undefined) {
          let data7 = data5.implementationId;
          if (typeof data7 === 'string') {
            if (func1(data7) > 96) {
              const err20 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err21 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
            if (!pattern11.test(data7)) {
              const err22 = {
                instancePath: instancePath + '/payload/implementationId',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
          } else {
            const err23 = {
              instancePath: instancePath + '/payload/implementationId',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        }
        if (data5.method !== undefined) {
          let data8 = data5.method;
          if (typeof data8 === 'string') {
            if (func1(data8) > 96) {
              const err24 = {
                instancePath: instancePath + '/payload/method',
                schemaPath: '#/$defs/localId/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            if (func1(data8) < 1) {
              const err25 = {
                instancePath: instancePath + '/payload/method',
                schemaPath: '#/$defs/localId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
            if (!pattern11.test(data8)) {
              const err26 = {
                instancePath: instancePath + '/payload/method',
                schemaPath: '#/$defs/localId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
          } else {
            const err27 = {
              instancePath: instancePath + '/payload/method',
              schemaPath: '#/$defs/localId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
        if (data5.arguments !== undefined) {
          if (
            !validate57(data5.arguments, {
              instancePath: instancePath + '/payload/arguments',
              parentData: data5,
              parentDataProperty: 'arguments',
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate57.errors
                : vErrors.concat(validate57.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err28 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
    }
  }
  validate56.errors = vErrors;
  return errors === 0;
}
validate56.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema77 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'implementation/invoke' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['ok'],
          properties: {
            ok: { type: 'boolean' },
            value: { $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue' },
            errorCode: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
          },
        },
      },
    },
  ],
};
function validate62(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate62.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response' || data0 === 'event')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema62.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('implementation/invoke' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'implementation/invoke' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'value' || key1 === 'errorCode')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (typeof data5.ok !== 'boolean') {
            const err13 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath: '#/allOf/1/properties/payload/properties/ok/type',
              keyword: 'type',
              params: { type: 'boolean' },
              message: 'must be boolean',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.value !== undefined) {
          if (
            !validate57(data5.value, {
              instancePath: instancePath + '/payload/value',
              parentData: data5,
              parentDataProperty: 'value',
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate57.errors
                : vErrors.concat(validate57.errors);
            errors = vErrors.length;
          }
        }
        if (data5.errorCode !== undefined) {
          let data8 = data5.errorCode;
          if (typeof data8 === 'string') {
            if (!pattern10.test(data8)) {
              const err14 = {
                instancePath: instancePath + '/payload/errorCode',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/errorCode/pattern',
                keyword: 'pattern',
                params: { pattern: '^[A-Z]+-[0-9]{4}$' },
                message: 'must match pattern "' + '^[A-Z]+-[0-9]{4}$' + '"',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          } else {
            const err15 = {
              instancePath: instancePath + '/payload/errorCode',
              schemaPath:
                '#/allOf/1/properties/payload/properties/errorCode/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
      } else {
        const err16 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  }
  validate62.errors = vErrors;
  return errors === 0;
}
validate62.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate49(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  /*# sourceURL="https://prodivix.dev/schemas/runtime-implementation-v1.schema.json" */ let vErrors =
    null;
  let errors = 0;
  const evaluated0 = validate49.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (
    !validate50(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs2 = errors;
  if (
    !validate54(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs3 = errors;
    if (
      !validate56(data, {
        instancePath,
        parentData,
        parentDataProperty,
        rootData,
        dynamicAnchors,
      })
    ) {
      vErrors =
        vErrors === null
          ? validate56.errors
          : vErrors.concat(validate56.errors);
      errors = vErrors.length;
    }
    var _valid0 = _errs3 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
      const _errs4 = errors;
      if (
        !validate62(data, {
          instancePath,
          parentData,
          parentDataProperty,
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate62.errors
            : vErrors.concat(validate62.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs4 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
    }
  }
  if (!valid0) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate49.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate49.evaluated = { dynamicProps: true, dynamicItems: false };
export const validateGatewayEnvelopeSchema = validate65;
const schema79 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://prodivix.dev/schemas/gateway-envelope-v1.schema.json',
  title: 'GatewayContractMessageV1',
  description: 'Phase 4 capability-scoped Host Gateway payload contracts.',
  'x-prodivix-contract-version': '1.0',
  oneOf: [
    { $ref: '#/$defs/healthPingRequest' },
    { $ref: '#/$defs/healthPingResponse' },
    { $ref: '#/$defs/telemetryEmitRequest' },
    { $ref: '#/$defs/telemetryEmitResponse' },
    { $ref: '#/$defs/workspaceReadSummaryRequest' },
    { $ref: '#/$defs/workspaceReadSummaryResponse' },
    { $ref: '#/$defs/workspaceDispatchIntentRequest' },
    { $ref: '#/$defs/workspaceDispatchIntentResponse' },
    { $ref: '#/$defs/documentReadRequest' },
    { $ref: '#/$defs/documentReadResponse' },
    { $ref: '#/$defs/documentApplyPatchRequest' },
    { $ref: '#/$defs/documentApplyPatchResponse' },
    { $ref: '#/$defs/networkRequestRequest' },
    { $ref: '#/$defs/networkRequestResponse' },
  ],
  $defs: {
    contractMessage: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'method', 'contractVersion', 'payload'],
      properties: {
        kind: { enum: ['request', 'response'] },
        method: { type: 'string' },
        contractVersion: { const: '1.0' },
        payload: true,
      },
    },
    scope: {
      type: 'string',
      minLength: 1,
      maxLength: 160,
      pattern: '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$',
    },
    revision: { type: 'integer', minimum: 0, maximum: 9007199254740991 },
    stringMap: {
      type: 'object',
      maxProperties: 32,
      propertyNames: { minLength: 1, maxLength: 96 },
      additionalProperties: { type: 'string', maxLength: 4096 },
    },
    safeDiagnostic: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: {
        code: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
        message: { type: 'string', minLength: 1, maxLength: 512 },
        meta: {
          type: 'object',
          maxProperties: 16,
          additionalProperties: {
            type: ['null', 'boolean', 'number', 'string'],
          },
        },
      },
    },
    gatewayFailure: {
      type: 'object',
      additionalProperties: false,
      required: ['ok', 'diagnostics'],
      properties: {
        ok: { const: false },
        diagnostics: {
          type: 'array',
          minItems: 1,
          maxItems: 16,
          items: { $ref: '#/$defs/safeDiagnostic' },
        },
      },
    },
    healthPingRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'runtime.health/ping' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['nonce'],
              properties: {
                nonce: { type: 'string', minLength: 1, maxLength: 128 },
              },
            },
          },
        },
      ],
    },
    healthPingResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'runtime.health/ping' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['nonce'],
                      properties: {
                        nonce: { type: 'string', minLength: 1, maxLength: 128 },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    telemetryEmitRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'telemetry/emit' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'level'],
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 96,
                  pattern: '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$',
                },
                level: { enum: ['debug', 'info', 'warning', 'error'] },
                attributes: { $ref: '#/$defs/stringMap' },
              },
            },
          },
        },
      ],
    },
    telemetryEmitResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'telemetry/emit' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['accepted'],
                      properties: { accepted: { const: true } },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    workspaceReadSummaryRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'workspace/read-summary' },
            payload: {
              type: 'object',
              additionalProperties: false,
              maxProperties: 0,
            },
          },
        },
      ],
    },
    workspaceReadSummaryResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'workspace/read-summary' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: [
                        'workspaceId',
                        'revision',
                        'documentCount',
                        'routeCount',
                        'componentCount',
                      ],
                      properties: {
                        workspaceId: {
                          type: 'string',
                          minLength: 1,
                          maxLength: 256,
                        },
                        revision: { $ref: '#/$defs/revision' },
                        documentCount: {
                          type: 'integer',
                          minimum: 0,
                          maximum: 1000000,
                        },
                        routeCount: {
                          type: 'integer',
                          minimum: 0,
                          maximum: 1000000,
                        },
                        componentCount: {
                          type: 'integer',
                          minimum: 0,
                          maximum: 1000000,
                        },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    workspaceDispatchIntentRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'workspace/dispatch-intent' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['intentId', 'payload'],
              properties: {
                intentId: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 128,
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                payload: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
                expectedRevision: { $ref: '#/$defs/revision' },
              },
            },
          },
        },
      ],
    },
    workspaceDispatchIntentResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'workspace/dispatch-intent' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['accepted', 'operationId', 'revision'],
                      properties: {
                        accepted: { const: true },
                        operationId: {
                          type: 'string',
                          minLength: 1,
                          maxLength: 128,
                        },
                        revision: { $ref: '#/$defs/revision' },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    documentReadRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'document/read' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['documentId', 'scope'],
              properties: {
                documentId: { type: 'string', minLength: 1, maxLength: 256 },
                scope: { $ref: '#/$defs/scope' },
              },
            },
          },
        },
      ],
    },
    documentReadResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'document/read' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['documentId', 'revision', 'content'],
                      properties: {
                        documentId: {
                          type: 'string',
                          minLength: 1,
                          maxLength: 256,
                        },
                        revision: { $ref: '#/$defs/revision' },
                        content: {
                          $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                        },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    documentApplyPatchRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'document/apply-patch' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['documentId', 'scope', 'baseRevision', 'patch'],
              properties: {
                documentId: { type: 'string', minLength: 1, maxLength: 256 },
                scope: { $ref: '#/$defs/scope' },
                baseRevision: { $ref: '#/$defs/revision' },
                patch: {
                  $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                },
              },
            },
          },
        },
      ],
    },
    documentApplyPatchResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'document/apply-patch' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['documentId', 'revision', 'applied'],
                      properties: {
                        documentId: {
                          type: 'string',
                          minLength: 1,
                          maxLength: 256,
                        },
                        revision: { $ref: '#/$defs/revision' },
                        applied: { const: true },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
    networkRequestRequest: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'request' },
            method: { const: 'network/request' },
            payload: {
              type: 'object',
              additionalProperties: false,
              required: ['scope', 'url', 'method'],
              properties: {
                scope: { $ref: '#/$defs/scope' },
                url: { type: 'string', minLength: 1, maxLength: 2048 },
                method: { enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
                headers: { $ref: '#/$defs/stringMap' },
                body: { type: 'string', maxLength: 262144 },
              },
            },
          },
        },
      ],
    },
    networkRequestResponse: {
      allOf: [
        { $ref: '#/$defs/contractMessage' },
        {
          properties: {
            kind: { const: 'response' },
            method: { const: 'network/request' },
            payload: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['ok', 'result'],
                  properties: {
                    ok: { const: true },
                    result: {
                      type: 'object',
                      additionalProperties: false,
                      required: [
                        'url',
                        'status',
                        'headers',
                        'body',
                        'bodyBytes',
                        'redirected',
                      ],
                      properties: {
                        url: { type: 'string', minLength: 1, maxLength: 2048 },
                        status: { type: 'integer', minimum: 100, maximum: 599 },
                        headers: { $ref: '#/$defs/stringMap' },
                        body: { type: 'string', maxLength: 1048576 },
                        bodyBytes: {
                          type: 'integer',
                          minimum: 0,
                          maximum: 1048576,
                        },
                        redirected: { type: 'boolean' },
                      },
                    },
                  },
                },
                { $ref: '#/$defs/gatewayFailure' },
              ],
            },
          },
        },
      ],
    },
  },
};
const schema80 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'runtime.health/ping' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['nonce'],
          properties: {
            nonce: { type: 'string', minLength: 1, maxLength: 128 },
          },
        },
      },
    },
  ],
};
const schema81 = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'method', 'contractVersion', 'payload'],
  properties: {
    kind: { enum: ['request', 'response'] },
    method: { type: 'string' },
    contractVersion: { const: '1.0' },
    payload: true,
  },
};
function validate66(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate66.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime.health/ping' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime.health/ping' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.nonce === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'nonce' },
            message: "must have required property '" + 'nonce' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'nonce')) {
            const err12 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data5.nonce !== undefined) {
          let data6 = data5.nonce;
          if (typeof data6 === 'string') {
            if (func1(data6) > 128) {
              const err13 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/maxLength',
                keyword: 'maxLength',
                params: { limit: 128 },
                message: 'must NOT have more than 128 characters',
              };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err14 = {
                instancePath: instancePath + '/payload/nonce',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/nonce/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
          } else {
            const err15 = {
              instancePath: instancePath + '/payload/nonce',
              schemaPath: '#/allOf/1/properties/payload/properties/nonce/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
      } else {
        const err16 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  }
  validate66.errors = vErrors;
  return errors === 0;
}
validate66.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema82 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'runtime.health/ping' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['nonce'],
                  properties: {
                    nonce: { type: 'string', minLength: 1, maxLength: 128 },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
const schema84 = {
  type: 'object',
  additionalProperties: false,
  required: ['ok', 'diagnostics'],
  properties: {
    ok: { const: false },
    diagnostics: {
      type: 'array',
      minItems: 1,
      maxItems: 16,
      items: { $ref: '#/$defs/safeDiagnostic' },
    },
  },
};
const schema85 = {
  type: 'object',
  additionalProperties: false,
  required: ['code', 'message'],
  properties: {
    code: { type: 'string', pattern: '^[A-Z]+-[0-9]{4}$' },
    message: { type: 'string', minLength: 1, maxLength: 512 },
    meta: {
      type: 'object',
      maxProperties: 16,
      additionalProperties: { type: ['null', 'boolean', 'number', 'string'] },
    },
  },
};
function validate69(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate69.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.ok === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'ok' },
        message: "must have required property '" + 'ok' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.diagnostics === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/required',
        keyword: 'required',
        params: { missingProperty: 'diagnostics' },
        message: "must have required property '" + 'diagnostics' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === 'ok' || key0 === 'diagnostics')) {
        const err2 = {
          instancePath,
          schemaPath: '#/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.ok !== undefined) {
      if (false !== data.ok) {
        const err3 = {
          instancePath: instancePath + '/ok',
          schemaPath: '#/properties/ok/const',
          keyword: 'const',
          params: { allowedValue: false },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.diagnostics !== undefined) {
      let data1 = data.diagnostics;
      if (Array.isArray(data1)) {
        if (data1.length > 16) {
          const err4 = {
            instancePath: instancePath + '/diagnostics',
            schemaPath: '#/properties/diagnostics/maxItems',
            keyword: 'maxItems',
            params: { limit: 16 },
            message: 'must NOT have more than 16 items',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (data1.length < 1) {
          const err5 = {
            instancePath: instancePath + '/diagnostics',
            schemaPath: '#/properties/diagnostics/minItems',
            keyword: 'minItems',
            params: { limit: 1 },
            message: 'must NOT have fewer than 1 items',
          };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        const len0 = data1.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data2 = data1[i0];
          if (data2 && typeof data2 == 'object' && !Array.isArray(data2)) {
            if (data2.code === undefined) {
              const err6 = {
                instancePath: instancePath + '/diagnostics/' + i0,
                schemaPath: '#/$defs/safeDiagnostic/required',
                keyword: 'required',
                params: { missingProperty: 'code' },
                message: "must have required property '" + 'code' + "'",
              };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data2.message === undefined) {
              const err7 = {
                instancePath: instancePath + '/diagnostics/' + i0,
                schemaPath: '#/$defs/safeDiagnostic/required',
                keyword: 'required',
                params: { missingProperty: 'message' },
                message: "must have required property '" + 'message' + "'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key1 in data2) {
              if (!(key1 === 'code' || key1 === 'message' || key1 === 'meta')) {
                const err8 = {
                  instancePath: instancePath + '/diagnostics/' + i0,
                  schemaPath: '#/$defs/safeDiagnostic/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key1 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            if (data2.code !== undefined) {
              let data3 = data2.code;
              if (typeof data3 === 'string') {
                if (!pattern10.test(data3)) {
                  const err9 = {
                    instancePath: instancePath + '/diagnostics/' + i0 + '/code',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/code/pattern',
                    keyword: 'pattern',
                    params: { pattern: '^[A-Z]+-[0-9]{4}$' },
                    message: 'must match pattern "' + '^[A-Z]+-[0-9]{4}$' + '"',
                  };
                  if (vErrors === null) {
                    vErrors = [err9];
                  } else {
                    vErrors.push(err9);
                  }
                  errors++;
                }
              } else {
                const err10 = {
                  instancePath: instancePath + '/diagnostics/' + i0 + '/code',
                  schemaPath: '#/$defs/safeDiagnostic/properties/code/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err10];
                } else {
                  vErrors.push(err10);
                }
                errors++;
              }
            }
            if (data2.message !== undefined) {
              let data4 = data2.message;
              if (typeof data4 === 'string') {
                if (func1(data4) > 512) {
                  const err11 = {
                    instancePath:
                      instancePath + '/diagnostics/' + i0 + '/message',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/message/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 512 },
                    message: 'must NOT have more than 512 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err11];
                  } else {
                    vErrors.push(err11);
                  }
                  errors++;
                }
                if (func1(data4) < 1) {
                  const err12 = {
                    instancePath:
                      instancePath + '/diagnostics/' + i0 + '/message',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/message/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
              } else {
                const err13 = {
                  instancePath:
                    instancePath + '/diagnostics/' + i0 + '/message',
                  schemaPath: '#/$defs/safeDiagnostic/properties/message/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err13];
                } else {
                  vErrors.push(err13);
                }
                errors++;
              }
            }
            if (data2.meta !== undefined) {
              let data5 = data2.meta;
              if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
                if (Object.keys(data5).length > 16) {
                  const err14 = {
                    instancePath: instancePath + '/diagnostics/' + i0 + '/meta',
                    schemaPath:
                      '#/$defs/safeDiagnostic/properties/meta/maxProperties',
                    keyword: 'maxProperties',
                    params: { limit: 16 },
                    message: 'must NOT have more than 16 properties',
                  };
                  if (vErrors === null) {
                    vErrors = [err14];
                  } else {
                    vErrors.push(err14);
                  }
                  errors++;
                }
                for (const key2 in data5) {
                  let data6 = data5[key2];
                  if (
                    data6 !== null &&
                    typeof data6 !== 'boolean' &&
                    !(typeof data6 == 'number' && isFinite(data6)) &&
                    typeof data6 !== 'string'
                  ) {
                    const err15 = {
                      instancePath:
                        instancePath +
                        '/diagnostics/' +
                        i0 +
                        '/meta/' +
                        key2.replace(/~/g, '~0').replace(/\//g, '~1'),
                      schemaPath:
                        '#/$defs/safeDiagnostic/properties/meta/additionalProperties/type',
                      keyword: 'type',
                      params: {
                        type: schema85.properties.meta.additionalProperties
                          .type,
                      },
                      message: 'must be null,boolean,number,string',
                    };
                    if (vErrors === null) {
                      vErrors = [err15];
                    } else {
                      vErrors.push(err15);
                    }
                    errors++;
                  }
                }
              } else {
                const err16 = {
                  instancePath: instancePath + '/diagnostics/' + i0 + '/meta',
                  schemaPath: '#/$defs/safeDiagnostic/properties/meta/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
          } else {
            const err17 = {
              instancePath: instancePath + '/diagnostics/' + i0,
              schemaPath: '#/$defs/safeDiagnostic/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
      } else {
        const err18 = {
          instancePath: instancePath + '/diagnostics',
          schemaPath: '#/properties/diagnostics/type',
          keyword: 'type',
          params: { type: 'array' },
          message: 'must be array',
        };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
  } else {
    const err19 = {
      instancePath,
      schemaPath: '#/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err19];
    } else {
      vErrors.push(err19);
    }
    errors++;
  }
  validate69.errors = vErrors;
  return errors === 0;
}
validate69.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate68(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate68.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('runtime.health/ping' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'runtime.health/ping' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.nonce === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'nonce' },
                message: "must have required property '" + 'nonce' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(key2 === 'nonce')) {
                const err16 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
            if (data7.nonce !== undefined) {
              let data8 = data7.nonce;
              if (typeof data8 === 'string') {
                if (func1(data8) > 128) {
                  const err17 = {
                    instancePath: instancePath + '/payload/result/nonce',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/nonce/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 128 },
                    message: 'must NOT have more than 128 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                if (func1(data8) < 1) {
                  const err18 = {
                    instancePath: instancePath + '/payload/result/nonce',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/nonce/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              } else {
                const err19 = {
                  instancePath: instancePath + '/payload/result/nonce',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/nonce/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
          } else {
            const err20 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
      } else {
        const err21 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs22 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs22 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err22 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate68.errors = vErrors;
  return errors === 0;
}
validate68.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema86 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'telemetry/emit' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'level'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 96,
              pattern: '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$',
            },
            level: { enum: ['debug', 'info', 'warning', 'error'] },
            attributes: { $ref: '#/$defs/stringMap' },
          },
        },
      },
    },
  ],
};
const schema88 = {
  type: 'object',
  maxProperties: 32,
  propertyNames: { minLength: 1, maxLength: 96 },
  additionalProperties: { type: 'string', maxLength: 4096 },
};
const pattern22 = new RegExp('^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$', 'u');
function validate72(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate72.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('telemetry/emit' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'telemetry/emit' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.name === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'name' },
            message: "must have required property '" + 'name' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.level === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'level' },
            message: "must have required property '" + 'level' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'name' || key1 === 'level' || key1 === 'attributes')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.name !== undefined) {
          let data6 = data5.name;
          if (typeof data6 === 'string') {
            if (func1(data6) > 96) {
              const err14 = {
                instancePath: instancePath + '/payload/name',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/name/maxLength',
                keyword: 'maxLength',
                params: { limit: 96 },
                message: 'must NOT have more than 96 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err15 = {
                instancePath: instancePath + '/payload/name',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/name/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (!pattern22.test(data6)) {
              const err16 = {
                instancePath: instancePath + '/payload/name',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/name/pattern',
                keyword: 'pattern',
                params: { pattern: '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$' },
                message:
                  'must match pattern "' +
                  '^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          } else {
            const err17 = {
              instancePath: instancePath + '/payload/name',
              schemaPath: '#/allOf/1/properties/payload/properties/name/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
        if (data5.level !== undefined) {
          let data7 = data5.level;
          if (!(
            data7 === 'debug' ||
            data7 === 'info' ||
            data7 === 'warning' ||
            data7 === 'error'
          )) {
            const err18 = {
              instancePath: instancePath + '/payload/level',
              schemaPath: '#/allOf/1/properties/payload/properties/level/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema86.allOf[1].properties.payload.properties.level.enum,
              },
              message: 'must be equal to one of the allowed values',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
        if (data5.attributes !== undefined) {
          let data8 = data5.attributes;
          if (data8 && typeof data8 == 'object' && !Array.isArray(data8)) {
            if (Object.keys(data8).length > 32) {
              const err19 = {
                instancePath: instancePath + '/payload/attributes',
                schemaPath: '#/$defs/stringMap/maxProperties',
                keyword: 'maxProperties',
                params: { limit: 32 },
                message: 'must NOT have more than 32 properties',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            for (const key2 in data8) {
              const _errs20 = errors;
              if (typeof key2 === 'string') {
                if (func1(key2) > 96) {
                  const err20 = {
                    instancePath: instancePath + '/payload/attributes',
                    schemaPath: '#/$defs/stringMap/propertyNames/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 96 },
                    message: 'must NOT have more than 96 characters',
                    propertyName: key2,
                  };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if (func1(key2) < 1) {
                  const err21 = {
                    instancePath: instancePath + '/payload/attributes',
                    schemaPath: '#/$defs/stringMap/propertyNames/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                    propertyName: key2,
                  };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              }
              var valid6 = _errs20 === errors;
              if (!valid6) {
                const err22 = {
                  instancePath: instancePath + '/payload/attributes',
                  schemaPath: '#/$defs/stringMap/propertyNames',
                  keyword: 'propertyNames',
                  params: { propertyName: key2 },
                  message: 'property name must be valid',
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            for (const key3 in data8) {
              let data9 = data8[key3];
              if (typeof data9 === 'string') {
                if (func1(data9) > 4096) {
                  const err23 = {
                    instancePath:
                      instancePath +
                      '/payload/attributes/' +
                      key3.replace(/~/g, '~0').replace(/\//g, '~1'),
                    schemaPath:
                      '#/$defs/stringMap/additionalProperties/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 4096 },
                    message: 'must NOT have more than 4096 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
              } else {
                const err24 = {
                  instancePath:
                    instancePath +
                    '/payload/attributes/' +
                    key3.replace(/~/g, '~0').replace(/\//g, '~1'),
                  schemaPath: '#/$defs/stringMap/additionalProperties/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
          } else {
            const err25 = {
              instancePath: instancePath + '/payload/attributes',
              schemaPath: '#/$defs/stringMap/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      } else {
        const err26 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
  }
  validate72.errors = vErrors;
  return errors === 0;
}
validate72.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema89 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'telemetry/emit' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['accepted'],
                  properties: { accepted: { const: true } },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
function validate74(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate74.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('telemetry/emit' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'telemetry/emit' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.accepted === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'accepted' },
                message: "must have required property '" + 'accepted' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(key2 === 'accepted')) {
                const err16 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
            if (data7.accepted !== undefined) {
              if (true !== data7.accepted) {
                const err17 = {
                  instancePath: instancePath + '/payload/result/accepted',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/accepted/const',
                  keyword: 'const',
                  params: { allowedValue: true },
                  message: 'must be equal to constant',
                };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
            }
          } else {
            const err18 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
      } else {
        const err19 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs21 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs21 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err20 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate74.errors = vErrors;
  return errors === 0;
}
validate74.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema91 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'workspace/read-summary' },
        payload: {
          type: 'object',
          additionalProperties: false,
          maxProperties: 0,
        },
      },
    },
  ],
};
function validate77(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate77.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('workspace/read-summary' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'workspace/read-summary' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (Object.keys(data5).length > 0) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/maxProperties',
            keyword: 'maxProperties',
            params: { limit: 0 },
            message: 'must NOT have more than 0 properties',
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key1 in data5) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/additionalProperties',
            keyword: 'additionalProperties',
            params: { additionalProperty: key1 },
            message: 'must NOT have additional properties',
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
  }
  validate77.errors = vErrors;
  return errors === 0;
}
validate77.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema93 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'workspace/read-summary' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: [
                    'workspaceId',
                    'revision',
                    'documentCount',
                    'routeCount',
                    'componentCount',
                  ],
                  properties: {
                    workspaceId: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 256,
                    },
                    revision: { $ref: '#/$defs/revision' },
                    documentCount: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 1000000,
                    },
                    routeCount: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 1000000,
                    },
                    componentCount: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 1000000,
                    },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
const schema95 = { type: 'integer', minimum: 0, maximum: 9007199254740991 };
function validate79(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate79.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('workspace/read-summary' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'workspace/read-summary' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.workspaceId === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'workspaceId' },
                message: "must have required property '" + 'workspaceId' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data7.revision === undefined) {
              const err16 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'revision' },
                message: "must have required property '" + 'revision' + "'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data7.documentCount === undefined) {
              const err17 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'documentCount' },
                message:
                  "must have required property '" + 'documentCount' + "'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (data7.routeCount === undefined) {
              const err18 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'routeCount' },
                message: "must have required property '" + 'routeCount' + "'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data7.componentCount === undefined) {
              const err19 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'componentCount' },
                message:
                  "must have required property '" + 'componentCount' + "'",
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(
                key2 === 'workspaceId' ||
                key2 === 'revision' ||
                key2 === 'documentCount' ||
                key2 === 'routeCount' ||
                key2 === 'componentCount'
              )) {
                const err20 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err20];
                } else {
                  vErrors.push(err20);
                }
                errors++;
              }
            }
            if (data7.workspaceId !== undefined) {
              let data8 = data7.workspaceId;
              if (typeof data8 === 'string') {
                if (func1(data8) > 256) {
                  const err21 = {
                    instancePath: instancePath + '/payload/result/workspaceId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/workspaceId/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 256 },
                    message: 'must NOT have more than 256 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
                if (func1(data8) < 1) {
                  const err22 = {
                    instancePath: instancePath + '/payload/result/workspaceId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/workspaceId/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
              } else {
                const err23 = {
                  instancePath: instancePath + '/payload/result/workspaceId',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/workspaceId/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data7.revision !== undefined) {
              let data9 = data7.revision;
              if (!(
                typeof data9 == 'number' &&
                !(data9 % 1) &&
                !isNaN(data9) &&
                isFinite(data9)
              )) {
                const err24 = {
                  instancePath: instancePath + '/payload/result/revision',
                  schemaPath: '#/$defs/revision/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
              if (typeof data9 == 'number' && isFinite(data9)) {
                if (data9 > 9007199254740991 || isNaN(data9)) {
                  const err25 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 9007199254740991 },
                    message: 'must be <= 9007199254740991',
                  };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
                if (data9 < 0 || isNaN(data9)) {
                  const err26 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
              }
            }
            if (data7.documentCount !== undefined) {
              let data10 = data7.documentCount;
              if (!(
                typeof data10 == 'number' &&
                !(data10 % 1) &&
                !isNaN(data10) &&
                isFinite(data10)
              )) {
                const err27 = {
                  instancePath: instancePath + '/payload/result/documentCount',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentCount/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
              if (typeof data10 == 'number' && isFinite(data10)) {
                if (data10 > 1000000 || isNaN(data10)) {
                  const err28 = {
                    instancePath:
                      instancePath + '/payload/result/documentCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentCount/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 1000000 },
                    message: 'must be <= 1000000',
                  };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                }
                if (data10 < 0 || isNaN(data10)) {
                  const err29 = {
                    instancePath:
                      instancePath + '/payload/result/documentCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentCount/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err29];
                  } else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
              }
            }
            if (data7.routeCount !== undefined) {
              let data11 = data7.routeCount;
              if (!(
                typeof data11 == 'number' &&
                !(data11 % 1) &&
                !isNaN(data11) &&
                isFinite(data11)
              )) {
                const err30 = {
                  instancePath: instancePath + '/payload/result/routeCount',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/routeCount/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
              if (typeof data11 == 'number' && isFinite(data11)) {
                if (data11 > 1000000 || isNaN(data11)) {
                  const err31 = {
                    instancePath: instancePath + '/payload/result/routeCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/routeCount/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 1000000 },
                    message: 'must be <= 1000000',
                  };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
                if (data11 < 0 || isNaN(data11)) {
                  const err32 = {
                    instancePath: instancePath + '/payload/result/routeCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/routeCount/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err32];
                  } else {
                    vErrors.push(err32);
                  }
                  errors++;
                }
              }
            }
            if (data7.componentCount !== undefined) {
              let data12 = data7.componentCount;
              if (!(
                typeof data12 == 'number' &&
                !(data12 % 1) &&
                !isNaN(data12) &&
                isFinite(data12)
              )) {
                const err33 = {
                  instancePath: instancePath + '/payload/result/componentCount',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/componentCount/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err33];
                } else {
                  vErrors.push(err33);
                }
                errors++;
              }
              if (typeof data12 == 'number' && isFinite(data12)) {
                if (data12 > 1000000 || isNaN(data12)) {
                  const err34 = {
                    instancePath:
                      instancePath + '/payload/result/componentCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/componentCount/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 1000000 },
                    message: 'must be <= 1000000',
                  };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
                if (data12 < 0 || isNaN(data12)) {
                  const err35 = {
                    instancePath:
                      instancePath + '/payload/result/componentCount',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/componentCount/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err35];
                  } else {
                    vErrors.push(err35);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err36 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
        }
      } else {
        const err37 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err37];
        } else {
          vErrors.push(err37);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs31 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs31 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err38 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err38];
        } else {
          vErrors.push(err38);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate79.errors = vErrors;
  return errors === 0;
}
validate79.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema96 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'workspace/dispatch-intent' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['intentId', 'payload'],
          properties: {
            intentId: {
              type: 'string',
              minLength: 1,
              maxLength: 128,
              pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
            },
            payload: {
              $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
            },
            expectedRevision: { $ref: '#/$defs/revision' },
          },
        },
      },
    },
  ],
};
function validate83(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate83.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (data !== null) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf/0/type',
      keyword: 'type',
      params: { type: 'null' },
      message: 'must be null',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (typeof data !== 'boolean') {
    const err1 = {
      instancePath,
      schemaPath: '#/oneOf/1/type',
      keyword: 'type',
      params: { type: 'boolean' },
      message: 'must be boolean',
    };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs5 = errors;
    if (!(typeof data == 'number' && isFinite(data))) {
      const err2 = {
        instancePath,
        schemaPath: '#/oneOf/2/type',
        keyword: 'type',
        params: { type: 'number' },
        message: 'must be number',
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    var _valid0 = _errs5 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs7 = errors;
      if (typeof data !== 'string') {
        const err3 = {
          instancePath,
          schemaPath: '#/oneOf/3/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
      var _valid0 = _errs7 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs9 = errors;
        if (Array.isArray(data)) {
          const len0 = data.length;
          for (let i0 = 0; i0 < len0; i0++) {
            if (
              !validate21(data[i0], {
                instancePath: instancePath + '/' + i0,
                parentData: data,
                parentDataProperty: i0,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate21.errors
                  : vErrors.concat(validate21.errors);
              errors = vErrors.length;
            }
          }
        } else {
          const err4 = {
            instancePath,
            schemaPath: '#/oneOf/4/type',
            keyword: 'type',
            params: { type: 'array' },
            message: 'must be array',
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        var _valid0 = _errs9 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            var items1 = true;
          }
          const _errs12 = errors;
          if (data && typeof data == 'object' && !Array.isArray(data)) {
            for (const key0 in data) {
              if (
                !validate21(data[key0], {
                  instancePath:
                    instancePath +
                    '/' +
                    key0.replace(/~/g, '~0').replace(/\//g, '~1'),
                  parentData: data,
                  parentDataProperty: key0,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate21.errors
                    : vErrors.concat(validate21.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err5 = {
              instancePath,
              schemaPath: '#/oneOf/5/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
          var _valid0 = _errs12 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              var props2 = true;
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err6 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err6];
    } else {
      vErrors.push(err6);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate83.errors = vErrors;
  evaluated0.props = props2;
  evaluated0.items = items1;
  return errors === 0;
}
validate83.evaluated = { dynamicProps: true, dynamicItems: true };
function validate82(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate82.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('workspace/dispatch-intent' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'workspace/dispatch-intent' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.intentId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'intentId' },
            message: "must have required property '" + 'intentId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.payload === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'payload' },
            message: "must have required property '" + 'payload' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'intentId' ||
            key1 === 'payload' ||
            key1 === 'expectedRevision'
          )) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.intentId !== undefined) {
          let data6 = data5.intentId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 128) {
              const err14 = {
                instancePath: instancePath + '/payload/intentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/intentId/maxLength',
                keyword: 'maxLength',
                params: { limit: 128 },
                message: 'must NOT have more than 128 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err15 = {
                instancePath: instancePath + '/payload/intentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/intentId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (!pattern11.test(data6)) {
              const err16 = {
                instancePath: instancePath + '/payload/intentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/intentId/pattern',
                keyword: 'pattern',
                params: {
                  pattern: '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$',
                },
                message:
                  'must match pattern "' +
                  '^[a-z][A-Za-z0-9]*(?:[._-][A-Za-z0-9]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
          } else {
            const err17 = {
              instancePath: instancePath + '/payload/intentId',
              schemaPath:
                '#/allOf/1/properties/payload/properties/intentId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
        if (data5.payload !== undefined) {
          if (
            !validate83(data5.payload, {
              instancePath: instancePath + '/payload/payload',
              parentData: data5,
              parentDataProperty: 'payload',
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate83.errors
                : vErrors.concat(validate83.errors);
            errors = vErrors.length;
          }
        }
        if (data5.expectedRevision !== undefined) {
          let data8 = data5.expectedRevision;
          if (!(
            typeof data8 == 'number' &&
            !(data8 % 1) &&
            !isNaN(data8) &&
            isFinite(data8)
          )) {
            const err18 = {
              instancePath: instancePath + '/payload/expectedRevision',
              schemaPath: '#/$defs/revision/type',
              keyword: 'type',
              params: { type: 'integer' },
              message: 'must be integer',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
          if (typeof data8 == 'number' && isFinite(data8)) {
            if (data8 > 9007199254740991 || isNaN(data8)) {
              const err19 = {
                instancePath: instancePath + '/payload/expectedRevision',
                schemaPath: '#/$defs/revision/maximum',
                keyword: 'maximum',
                params: { comparison: '<=', limit: 9007199254740991 },
                message: 'must be <= 9007199254740991',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (data8 < 0 || isNaN(data8)) {
              const err20 = {
                instancePath: instancePath + '/payload/expectedRevision',
                schemaPath: '#/$defs/revision/minimum',
                keyword: 'minimum',
                params: { comparison: '>=', limit: 0 },
                message: 'must be >= 0',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          }
        }
      } else {
        const err21 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
  }
  validate82.errors = vErrors;
  return errors === 0;
}
validate82.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema100 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'workspace/dispatch-intent' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['accepted', 'operationId', 'revision'],
                  properties: {
                    accepted: { const: true },
                    operationId: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 128,
                    },
                    revision: { $ref: '#/$defs/revision' },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
function validate88(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate88.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('workspace/dispatch-intent' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'workspace/dispatch-intent' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.accepted === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'accepted' },
                message: "must have required property '" + 'accepted' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data7.operationId === undefined) {
              const err16 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'operationId' },
                message: "must have required property '" + 'operationId' + "'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data7.revision === undefined) {
              const err17 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'revision' },
                message: "must have required property '" + 'revision' + "'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(
                key2 === 'accepted' ||
                key2 === 'operationId' ||
                key2 === 'revision'
              )) {
                const err18 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            if (data7.accepted !== undefined) {
              if (true !== data7.accepted) {
                const err19 = {
                  instancePath: instancePath + '/payload/result/accepted',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/accepted/const',
                  keyword: 'const',
                  params: { allowedValue: true },
                  message: 'must be equal to constant',
                };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data7.operationId !== undefined) {
              let data9 = data7.operationId;
              if (typeof data9 === 'string') {
                if (func1(data9) > 128) {
                  const err20 = {
                    instancePath: instancePath + '/payload/result/operationId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/operationId/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 128 },
                    message: 'must NOT have more than 128 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
                if (func1(data9) < 1) {
                  const err21 = {
                    instancePath: instancePath + '/payload/result/operationId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/operationId/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
              } else {
                const err22 = {
                  instancePath: instancePath + '/payload/result/operationId',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/operationId/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data7.revision !== undefined) {
              let data10 = data7.revision;
              if (!(
                typeof data10 == 'number' &&
                !(data10 % 1) &&
                !isNaN(data10) &&
                isFinite(data10)
              )) {
                const err23 = {
                  instancePath: instancePath + '/payload/result/revision',
                  schemaPath: '#/$defs/revision/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
              if (typeof data10 == 'number' && isFinite(data10)) {
                if (data10 > 9007199254740991 || isNaN(data10)) {
                  const err24 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 9007199254740991 },
                    message: 'must be <= 9007199254740991',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
                if (data10 < 0 || isNaN(data10)) {
                  const err25 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              }
            }
          } else {
            const err26 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err26];
            } else {
              vErrors.push(err26);
            }
            errors++;
          }
        }
      } else {
        const err27 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs26 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs26 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err28 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate88.errors = vErrors;
  return errors === 0;
}
validate88.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema103 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'document/read' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['documentId', 'scope'],
          properties: {
            documentId: { type: 'string', minLength: 1, maxLength: 256 },
            scope: { $ref: '#/$defs/scope' },
          },
        },
      },
    },
  ],
};
const schema105 = {
  type: 'string',
  minLength: 1,
  maxLength: 160,
  pattern: '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$',
};
const pattern24 = new RegExp('^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$', 'u');
function validate91(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate91.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('document/read' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'document/read' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.documentId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'documentId' },
            message: "must have required property '" + 'documentId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.scope === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'scope' },
            message: "must have required property '" + 'scope' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'documentId' || key1 === 'scope')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.documentId !== undefined) {
          let data6 = data5.documentId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 256) {
              const err14 = {
                instancePath: instancePath + '/payload/documentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/documentId/maxLength',
                keyword: 'maxLength',
                params: { limit: 256 },
                message: 'must NOT have more than 256 characters',
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err15 = {
                instancePath: instancePath + '/payload/documentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/documentId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
          } else {
            const err16 = {
              instancePath: instancePath + '/payload/documentId',
              schemaPath:
                '#/allOf/1/properties/payload/properties/documentId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data5.scope !== undefined) {
          let data7 = data5.scope;
          if (typeof data7 === 'string') {
            if (func1(data7) > 160) {
              const err17 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/maxLength',
                keyword: 'maxLength',
                params: { limit: 160 },
                message: 'must NOT have more than 160 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err18 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (!pattern24.test(data7)) {
              const err19 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/pattern',
                keyword: 'pattern',
                params: { pattern: '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' },
                message:
                  'must match pattern "' +
                  '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
          } else {
            const err20 = {
              instancePath: instancePath + '/payload/scope',
              schemaPath: '#/$defs/scope/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
      } else {
        const err21 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err21];
        } else {
          vErrors.push(err21);
        }
        errors++;
      }
    }
  }
  validate91.errors = vErrors;
  return errors === 0;
}
validate91.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema106 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'document/read' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['documentId', 'revision', 'content'],
                  properties: {
                    documentId: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 256,
                    },
                    revision: { $ref: '#/$defs/revision' },
                    content: {
                      $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue',
                    },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
function validate93(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate93.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('document/read' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'document/read' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.documentId === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'documentId' },
                message: "must have required property '" + 'documentId' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data7.revision === undefined) {
              const err16 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'revision' },
                message: "must have required property '" + 'revision' + "'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data7.content === undefined) {
              const err17 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'content' },
                message: "must have required property '" + 'content' + "'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(
                key2 === 'documentId' ||
                key2 === 'revision' ||
                key2 === 'content'
              )) {
                const err18 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            if (data7.documentId !== undefined) {
              let data8 = data7.documentId;
              if (typeof data8 === 'string') {
                if (func1(data8) > 256) {
                  const err19 = {
                    instancePath: instancePath + '/payload/result/documentId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 256 },
                    message: 'must NOT have more than 256 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
                if (func1(data8) < 1) {
                  const err20 = {
                    instancePath: instancePath + '/payload/result/documentId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
              } else {
                const err21 = {
                  instancePath: instancePath + '/payload/result/documentId',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
            if (data7.revision !== undefined) {
              let data9 = data7.revision;
              if (!(
                typeof data9 == 'number' &&
                !(data9 % 1) &&
                !isNaN(data9) &&
                isFinite(data9)
              )) {
                const err22 = {
                  instancePath: instancePath + '/payload/result/revision',
                  schemaPath: '#/$defs/revision/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
              if (typeof data9 == 'number' && isFinite(data9)) {
                if (data9 > 9007199254740991 || isNaN(data9)) {
                  const err23 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 9007199254740991 },
                    message: 'must be <= 9007199254740991',
                  };
                  if (vErrors === null) {
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
                if (data9 < 0 || isNaN(data9)) {
                  const err24 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              }
            }
            if (data7.content !== undefined) {
              if (
                !validate83(data7.content, {
                  instancePath: instancePath + '/payload/result/content',
                  parentData: data7,
                  parentDataProperty: 'content',
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate83.errors
                    : vErrors.concat(validate83.errors);
                errors = vErrors.length;
              }
            }
          } else {
            const err25 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      } else {
        const err26 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props1 = true;
      }
      const _errs26 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs26 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props1 !== true) {
            props1 = true;
          }
        }
      }
      if (!valid4) {
        const err27 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate93.errors = vErrors;
  return errors === 0;
}
validate93.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema109 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'document/apply-patch' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['documentId', 'scope', 'baseRevision', 'patch'],
          properties: {
            documentId: { type: 'string', minLength: 1, maxLength: 256 },
            scope: { $ref: '#/$defs/scope' },
            baseRevision: { $ref: '#/$defs/revision' },
            patch: { $ref: 'runtime-envelope-v1.schema.json#/$defs/jsonValue' },
          },
        },
      },
    },
  ],
};
function validate97(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate97.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('document/apply-patch' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'document/apply-patch' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.documentId === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'documentId' },
            message: "must have required property '" + 'documentId' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.scope === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'scope' },
            message: "must have required property '" + 'scope' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.baseRevision === undefined) {
          const err13 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'baseRevision' },
            message: "must have required property '" + 'baseRevision' + "'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data5.patch === undefined) {
          const err14 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'patch' },
            message: "must have required property '" + 'patch' + "'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'documentId' ||
            key1 === 'scope' ||
            key1 === 'baseRevision' ||
            key1 === 'patch'
          )) {
            const err15 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
        if (data5.documentId !== undefined) {
          let data6 = data5.documentId;
          if (typeof data6 === 'string') {
            if (func1(data6) > 256) {
              const err16 = {
                instancePath: instancePath + '/payload/documentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/documentId/maxLength',
                keyword: 'maxLength',
                params: { limit: 256 },
                message: 'must NOT have more than 256 characters',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err17 = {
                instancePath: instancePath + '/payload/documentId',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/documentId/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          } else {
            const err18 = {
              instancePath: instancePath + '/payload/documentId',
              schemaPath:
                '#/allOf/1/properties/payload/properties/documentId/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
        if (data5.scope !== undefined) {
          let data7 = data5.scope;
          if (typeof data7 === 'string') {
            if (func1(data7) > 160) {
              const err19 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/maxLength',
                keyword: 'maxLength',
                params: { limit: 160 },
                message: 'must NOT have more than 160 characters',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err20 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (!pattern24.test(data7)) {
              const err21 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/pattern',
                keyword: 'pattern',
                params: { pattern: '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' },
                message:
                  'must match pattern "' +
                  '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
          } else {
            const err22 = {
              instancePath: instancePath + '/payload/scope',
              schemaPath: '#/$defs/scope/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        if (data5.baseRevision !== undefined) {
          let data8 = data5.baseRevision;
          if (!(
            typeof data8 == 'number' &&
            !(data8 % 1) &&
            !isNaN(data8) &&
            isFinite(data8)
          )) {
            const err23 = {
              instancePath: instancePath + '/payload/baseRevision',
              schemaPath: '#/$defs/revision/type',
              keyword: 'type',
              params: { type: 'integer' },
              message: 'must be integer',
            };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
          if (typeof data8 == 'number' && isFinite(data8)) {
            if (data8 > 9007199254740991 || isNaN(data8)) {
              const err24 = {
                instancePath: instancePath + '/payload/baseRevision',
                schemaPath: '#/$defs/revision/maximum',
                keyword: 'maximum',
                params: { comparison: '<=', limit: 9007199254740991 },
                message: 'must be <= 9007199254740991',
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            if (data8 < 0 || isNaN(data8)) {
              const err25 = {
                instancePath: instancePath + '/payload/baseRevision',
                schemaPath: '#/$defs/revision/minimum',
                keyword: 'minimum',
                params: { comparison: '>=', limit: 0 },
                message: 'must be >= 0',
              };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
          }
        }
        if (data5.patch !== undefined) {
          if (
            !validate83(data5.patch, {
              instancePath: instancePath + '/payload/patch',
              parentData: data5,
              parentDataProperty: 'patch',
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate83.errors
                : vErrors.concat(validate83.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err26 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
  }
  validate97.errors = vErrors;
  return errors === 0;
}
validate97.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema113 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'document/apply-patch' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['documentId', 'revision', 'applied'],
                  properties: {
                    documentId: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 256,
                    },
                    revision: { $ref: '#/$defs/revision' },
                    applied: { const: true },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
function validate100(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate100.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('document/apply-patch' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'document/apply-patch' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.documentId === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'documentId' },
                message: "must have required property '" + 'documentId' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data7.revision === undefined) {
              const err16 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'revision' },
                message: "must have required property '" + 'revision' + "'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data7.applied === undefined) {
              const err17 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'applied' },
                message: "must have required property '" + 'applied' + "'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(
                key2 === 'documentId' ||
                key2 === 'revision' ||
                key2 === 'applied'
              )) {
                const err18 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            if (data7.documentId !== undefined) {
              let data8 = data7.documentId;
              if (typeof data8 === 'string') {
                if (func1(data8) > 256) {
                  const err19 = {
                    instancePath: instancePath + '/payload/result/documentId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 256 },
                    message: 'must NOT have more than 256 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
                if (func1(data8) < 1) {
                  const err20 = {
                    instancePath: instancePath + '/payload/result/documentId',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
              } else {
                const err21 = {
                  instancePath: instancePath + '/payload/result/documentId',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/documentId/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
            if (data7.revision !== undefined) {
              let data9 = data7.revision;
              if (!(
                typeof data9 == 'number' &&
                !(data9 % 1) &&
                !isNaN(data9) &&
                isFinite(data9)
              )) {
                const err22 = {
                  instancePath: instancePath + '/payload/result/revision',
                  schemaPath: '#/$defs/revision/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
              if (typeof data9 == 'number' && isFinite(data9)) {
                if (data9 > 9007199254740991 || isNaN(data9)) {
                  const err23 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 9007199254740991 },
                    message: 'must be <= 9007199254740991',
                  };
                  if (vErrors === null) {
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
                if (data9 < 0 || isNaN(data9)) {
                  const err24 = {
                    instancePath: instancePath + '/payload/result/revision',
                    schemaPath: '#/$defs/revision/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              }
            }
            if (data7.applied !== undefined) {
              if (true !== data7.applied) {
                const err25 = {
                  instancePath: instancePath + '/payload/result/applied',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/applied/const',
                  keyword: 'const',
                  params: { allowedValue: true },
                  message: 'must be equal to constant',
                };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            }
          } else {
            const err26 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err26];
            } else {
              vErrors.push(err26);
            }
            errors++;
          }
        }
      } else {
        const err27 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs26 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs26 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err28 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate100.errors = vErrors;
  return errors === 0;
}
validate100.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema116 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'request' },
        method: { const: 'network/request' },
        payload: {
          type: 'object',
          additionalProperties: false,
          required: ['scope', 'url', 'method'],
          properties: {
            scope: { $ref: '#/$defs/scope' },
            url: { type: 'string', minLength: 1, maxLength: 2048 },
            method: { enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            headers: { $ref: '#/$defs/stringMap' },
            body: { type: 'string', maxLength: 262144 },
          },
        },
      },
    },
  ],
};
function validate103(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate103.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('request' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('network/request' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'network/request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.scope === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'scope' },
            message: "must have required property '" + 'scope' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.url === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'url' },
            message: "must have required property '" + 'url' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.method === undefined) {
          const err13 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/required',
            keyword: 'required',
            params: { missingProperty: 'method' },
            message: "must have required property '" + 'method' + "'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(
            key1 === 'scope' ||
            key1 === 'url' ||
            key1 === 'method' ||
            key1 === 'headers' ||
            key1 === 'body'
          )) {
            const err14 = {
              instancePath: instancePath + '/payload',
              schemaPath: '#/allOf/1/properties/payload/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.scope !== undefined) {
          let data6 = data5.scope;
          if (typeof data6 === 'string') {
            if (func1(data6) > 160) {
              const err15 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/maxLength',
                keyword: 'maxLength',
                params: { limit: 160 },
                message: 'must NOT have more than 160 characters',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (func1(data6) < 1) {
              const err16 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (!pattern24.test(data6)) {
              const err17 = {
                instancePath: instancePath + '/payload/scope',
                schemaPath: '#/$defs/scope/pattern',
                keyword: 'pattern',
                params: { pattern: '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' },
                message:
                  'must match pattern "' +
                  '^[a-z0-9*]+(?:[._/:-][a-z0-9*]+)*$' +
                  '"',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          } else {
            const err18 = {
              instancePath: instancePath + '/payload/scope',
              schemaPath: '#/$defs/scope/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
        if (data5.url !== undefined) {
          let data7 = data5.url;
          if (typeof data7 === 'string') {
            if (func1(data7) > 2048) {
              const err19 = {
                instancePath: instancePath + '/payload/url',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/url/maxLength',
                keyword: 'maxLength',
                params: { limit: 2048 },
                message: 'must NOT have more than 2048 characters',
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (func1(data7) < 1) {
              const err20 = {
                instancePath: instancePath + '/payload/url',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/url/minLength',
                keyword: 'minLength',
                params: { limit: 1 },
                message: 'must NOT have fewer than 1 characters',
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
          } else {
            const err21 = {
              instancePath: instancePath + '/payload/url',
              schemaPath: '#/allOf/1/properties/payload/properties/url/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
        if (data5.method !== undefined) {
          let data8 = data5.method;
          if (!(
            data8 === 'GET' ||
            data8 === 'POST' ||
            data8 === 'PUT' ||
            data8 === 'PATCH' ||
            data8 === 'DELETE'
          )) {
            const err22 = {
              instancePath: instancePath + '/payload/method',
              schemaPath: '#/allOf/1/properties/payload/properties/method/enum',
              keyword: 'enum',
              params: {
                allowedValues:
                  schema116.allOf[1].properties.payload.properties.method.enum,
              },
              message: 'must be equal to one of the allowed values',
            };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        if (data5.headers !== undefined) {
          let data9 = data5.headers;
          if (data9 && typeof data9 == 'object' && !Array.isArray(data9)) {
            if (Object.keys(data9).length > 32) {
              const err23 = {
                instancePath: instancePath + '/payload/headers',
                schemaPath: '#/$defs/stringMap/maxProperties',
                keyword: 'maxProperties',
                params: { limit: 32 },
                message: 'must NOT have more than 32 properties',
              };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            for (const key2 in data9) {
              const _errs23 = errors;
              if (typeof key2 === 'string') {
                if (func1(key2) > 96) {
                  const err24 = {
                    instancePath: instancePath + '/payload/headers',
                    schemaPath: '#/$defs/stringMap/propertyNames/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 96 },
                    message: 'must NOT have more than 96 characters',
                    propertyName: key2,
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
                if (func1(key2) < 1) {
                  const err25 = {
                    instancePath: instancePath + '/payload/headers',
                    schemaPath: '#/$defs/stringMap/propertyNames/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                    propertyName: key2,
                  };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              }
              var valid7 = _errs23 === errors;
              if (!valid7) {
                const err26 = {
                  instancePath: instancePath + '/payload/headers',
                  schemaPath: '#/$defs/stringMap/propertyNames',
                  keyword: 'propertyNames',
                  params: { propertyName: key2 },
                  message: 'property name must be valid',
                };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            }
            for (const key3 in data9) {
              let data10 = data9[key3];
              if (typeof data10 === 'string') {
                if (func1(data10) > 4096) {
                  const err27 = {
                    instancePath:
                      instancePath +
                      '/payload/headers/' +
                      key3.replace(/~/g, '~0').replace(/\//g, '~1'),
                    schemaPath:
                      '#/$defs/stringMap/additionalProperties/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 4096 },
                    message: 'must NOT have more than 4096 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
              } else {
                const err28 = {
                  instancePath:
                    instancePath +
                    '/payload/headers/' +
                    key3.replace(/~/g, '~0').replace(/\//g, '~1'),
                  schemaPath: '#/$defs/stringMap/additionalProperties/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
          } else {
            const err29 = {
              instancePath: instancePath + '/payload/headers',
              schemaPath: '#/$defs/stringMap/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err29];
            } else {
              vErrors.push(err29);
            }
            errors++;
          }
        }
        if (data5.body !== undefined) {
          let data11 = data5.body;
          if (typeof data11 === 'string') {
            if (func1(data11) > 262144) {
              const err30 = {
                instancePath: instancePath + '/payload/body',
                schemaPath:
                  '#/allOf/1/properties/payload/properties/body/maxLength',
                keyword: 'maxLength',
                params: { limit: 262144 },
                message: 'must NOT have more than 262144 characters',
              };
              if (vErrors === null) {
                vErrors = [err30];
              } else {
                vErrors.push(err30);
              }
              errors++;
            }
          } else {
            const err31 = {
              instancePath: instancePath + '/payload/body',
              schemaPath: '#/allOf/1/properties/payload/properties/body/type',
              keyword: 'type',
              params: { type: 'string' },
              message: 'must be string',
            };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
        }
      } else {
        const err32 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
    }
  }
  validate103.errors = vErrors;
  return errors === 0;
}
validate103.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
const schema120 = {
  allOf: [
    { $ref: '#/$defs/contractMessage' },
    {
      properties: {
        kind: { const: 'response' },
        method: { const: 'network/request' },
        payload: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['ok', 'result'],
              properties: {
                ok: { const: true },
                result: {
                  type: 'object',
                  additionalProperties: false,
                  required: [
                    'url',
                    'status',
                    'headers',
                    'body',
                    'bodyBytes',
                    'redirected',
                  ],
                  properties: {
                    url: { type: 'string', minLength: 1, maxLength: 2048 },
                    status: { type: 'integer', minimum: 100, maximum: 599 },
                    headers: { $ref: '#/$defs/stringMap' },
                    body: { type: 'string', maxLength: 1048576 },
                    bodyBytes: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 1048576,
                    },
                    redirected: { type: 'boolean' },
                  },
                },
              },
            },
            { $ref: '#/$defs/gatewayFailure' },
          ],
        },
      },
    },
  ],
};
function validate105(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate105.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind === undefined) {
      const err0 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'kind' },
        message: "must have required property '" + 'kind' + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.method === undefined) {
      const err1 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'method' },
        message: "must have required property '" + 'method' + "'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.contractVersion === undefined) {
      const err2 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'contractVersion' },
        message: "must have required property '" + 'contractVersion' + "'",
      };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.payload === undefined) {
      const err3 = {
        instancePath,
        schemaPath: '#/$defs/contractMessage/required',
        keyword: 'required',
        params: { missingProperty: 'payload' },
        message: "must have required property '" + 'payload' + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(
        key0 === 'kind' ||
        key0 === 'method' ||
        key0 === 'contractVersion' ||
        key0 === 'payload'
      )) {
        const err4 = {
          instancePath,
          schemaPath: '#/$defs/contractMessage/additionalProperties',
          keyword: 'additionalProperties',
          params: { additionalProperty: key0 },
          message: 'must NOT have additional properties',
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(data0 === 'request' || data0 === 'response')) {
        const err5 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/$defs/contractMessage/properties/kind/enum',
          keyword: 'enum',
          params: { allowedValues: schema81.properties.kind.enum },
          message: 'must be equal to one of the allowed values',
        };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if (typeof data.method !== 'string') {
        const err6 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/$defs/contractMessage/properties/method/type',
          keyword: 'type',
          params: { type: 'string' },
          message: 'must be string',
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.contractVersion !== undefined) {
      if ('1.0' !== data.contractVersion) {
        const err7 = {
          instancePath: instancePath + '/contractVersion',
          schemaPath:
            '#/$defs/contractMessage/properties/contractVersion/const',
          keyword: 'const',
          params: { allowedValue: '1.0' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
  } else {
    const err8 = {
      instancePath,
      schemaPath: '#/$defs/contractMessage/type',
      keyword: 'type',
      params: { type: 'object' },
      message: 'must be object',
    };
    if (vErrors === null) {
      vErrors = [err8];
    } else {
      vErrors.push(err8);
    }
    errors++;
  }
  if (data && typeof data == 'object' && !Array.isArray(data)) {
    if (data.kind !== undefined) {
      if ('response' !== data.kind) {
        const err9 = {
          instancePath: instancePath + '/kind',
          schemaPath: '#/allOf/1/properties/kind/const',
          keyword: 'const',
          params: { allowedValue: 'response' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.method !== undefined) {
      if ('network/request' !== data.method) {
        const err10 = {
          instancePath: instancePath + '/method',
          schemaPath: '#/allOf/1/properties/method/const',
          keyword: 'const',
          params: { allowedValue: 'network/request' },
          message: 'must be equal to constant',
        };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.payload !== undefined) {
      let data5 = data.payload;
      const _errs12 = errors;
      let valid4 = false;
      let passing0 = null;
      const _errs13 = errors;
      if (data5 && typeof data5 == 'object' && !Array.isArray(data5)) {
        if (data5.ok === undefined) {
          const err11 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'ok' },
            message: "must have required property '" + 'ok' + "'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data5.result === undefined) {
          const err12 = {
            instancePath: instancePath + '/payload',
            schemaPath: '#/allOf/1/properties/payload/oneOf/0/required',
            keyword: 'required',
            params: { missingProperty: 'result' },
            message: "must have required property '" + 'result' + "'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        for (const key1 in data5) {
          if (!(key1 === 'ok' || key1 === 'result')) {
            const err13 = {
              instancePath: instancePath + '/payload',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/additionalProperties',
              keyword: 'additionalProperties',
              params: { additionalProperty: key1 },
              message: 'must NOT have additional properties',
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data5.ok !== undefined) {
          if (true !== data5.ok) {
            const err14 = {
              instancePath: instancePath + '/payload/ok',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/ok/const',
              keyword: 'const',
              params: { allowedValue: true },
              message: 'must be equal to constant',
            };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data5.result !== undefined) {
          let data7 = data5.result;
          if (data7 && typeof data7 == 'object' && !Array.isArray(data7)) {
            if (data7.url === undefined) {
              const err15 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'url' },
                message: "must have required property '" + 'url' + "'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data7.status === undefined) {
              const err16 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'status' },
                message: "must have required property '" + 'status' + "'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data7.headers === undefined) {
              const err17 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'headers' },
                message: "must have required property '" + 'headers' + "'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (data7.body === undefined) {
              const err18 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'body' },
                message: "must have required property '" + 'body' + "'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data7.bodyBytes === undefined) {
              const err19 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'bodyBytes' },
                message: "must have required property '" + 'bodyBytes' + "'",
              };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (data7.redirected === undefined) {
              const err20 = {
                instancePath: instancePath + '/payload/result',
                schemaPath:
                  '#/allOf/1/properties/payload/oneOf/0/properties/result/required',
                keyword: 'required',
                params: { missingProperty: 'redirected' },
                message: "must have required property '" + 'redirected' + "'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            for (const key2 in data7) {
              if (!(
                key2 === 'url' ||
                key2 === 'status' ||
                key2 === 'headers' ||
                key2 === 'body' ||
                key2 === 'bodyBytes' ||
                key2 === 'redirected'
              )) {
                const err21 = {
                  instancePath: instancePath + '/payload/result',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/additionalProperties',
                  keyword: 'additionalProperties',
                  params: { additionalProperty: key2 },
                  message: 'must NOT have additional properties',
                };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
            if (data7.url !== undefined) {
              let data8 = data7.url;
              if (typeof data8 === 'string') {
                if (func1(data8) > 2048) {
                  const err22 = {
                    instancePath: instancePath + '/payload/result/url',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/url/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 2048 },
                    message: 'must NOT have more than 2048 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (func1(data8) < 1) {
                  const err23 = {
                    instancePath: instancePath + '/payload/result/url',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/url/minLength',
                    keyword: 'minLength',
                    params: { limit: 1 },
                    message: 'must NOT have fewer than 1 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
              } else {
                const err24 = {
                  instancePath: instancePath + '/payload/result/url',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/url/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
            if (data7.status !== undefined) {
              let data9 = data7.status;
              if (!(
                typeof data9 == 'number' &&
                !(data9 % 1) &&
                !isNaN(data9) &&
                isFinite(data9)
              )) {
                const err25 = {
                  instancePath: instancePath + '/payload/result/status',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/status/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
              if (typeof data9 == 'number' && isFinite(data9)) {
                if (data9 > 599 || isNaN(data9)) {
                  const err26 = {
                    instancePath: instancePath + '/payload/result/status',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/status/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 599 },
                    message: 'must be <= 599',
                  };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
                if (data9 < 100 || isNaN(data9)) {
                  const err27 = {
                    instancePath: instancePath + '/payload/result/status',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/status/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 100 },
                    message: 'must be >= 100',
                  };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
              }
            }
            if (data7.headers !== undefined) {
              let data10 = data7.headers;
              if (
                data10 &&
                typeof data10 == 'object' &&
                !Array.isArray(data10)
              ) {
                if (Object.keys(data10).length > 32) {
                  const err28 = {
                    instancePath: instancePath + '/payload/result/headers',
                    schemaPath: '#/$defs/stringMap/maxProperties',
                    keyword: 'maxProperties',
                    params: { limit: 32 },
                    message: 'must NOT have more than 32 properties',
                  };
                  if (vErrors === null) {
                    vErrors = [err28];
                  } else {
                    vErrors.push(err28);
                  }
                  errors++;
                }
                for (const key3 in data10) {
                  const _errs27 = errors;
                  if (typeof key3 === 'string') {
                    if (func1(key3) > 96) {
                      const err29 = {
                        instancePath: instancePath + '/payload/result/headers',
                        schemaPath: '#/$defs/stringMap/propertyNames/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 96 },
                        message: 'must NOT have more than 96 characters',
                        propertyName: key3,
                      };
                      if (vErrors === null) {
                        vErrors = [err29];
                      } else {
                        vErrors.push(err29);
                      }
                      errors++;
                    }
                    if (func1(key3) < 1) {
                      const err30 = {
                        instancePath: instancePath + '/payload/result/headers',
                        schemaPath: '#/$defs/stringMap/propertyNames/minLength',
                        keyword: 'minLength',
                        params: { limit: 1 },
                        message: 'must NOT have fewer than 1 characters',
                        propertyName: key3,
                      };
                      if (vErrors === null) {
                        vErrors = [err30];
                      } else {
                        vErrors.push(err30);
                      }
                      errors++;
                    }
                  }
                  var valid8 = _errs27 === errors;
                  if (!valid8) {
                    const err31 = {
                      instancePath: instancePath + '/payload/result/headers',
                      schemaPath: '#/$defs/stringMap/propertyNames',
                      keyword: 'propertyNames',
                      params: { propertyName: key3 },
                      message: 'property name must be valid',
                    };
                    if (vErrors === null) {
                      vErrors = [err31];
                    } else {
                      vErrors.push(err31);
                    }
                    errors++;
                  }
                }
                for (const key4 in data10) {
                  let data11 = data10[key4];
                  if (typeof data11 === 'string') {
                    if (func1(data11) > 4096) {
                      const err32 = {
                        instancePath:
                          instancePath +
                          '/payload/result/headers/' +
                          key4.replace(/~/g, '~0').replace(/\//g, '~1'),
                        schemaPath:
                          '#/$defs/stringMap/additionalProperties/maxLength',
                        keyword: 'maxLength',
                        params: { limit: 4096 },
                        message: 'must NOT have more than 4096 characters',
                      };
                      if (vErrors === null) {
                        vErrors = [err32];
                      } else {
                        vErrors.push(err32);
                      }
                      errors++;
                    }
                  } else {
                    const err33 = {
                      instancePath:
                        instancePath +
                        '/payload/result/headers/' +
                        key4.replace(/~/g, '~0').replace(/\//g, '~1'),
                      schemaPath: '#/$defs/stringMap/additionalProperties/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    };
                    if (vErrors === null) {
                      vErrors = [err33];
                    } else {
                      vErrors.push(err33);
                    }
                    errors++;
                  }
                }
              } else {
                const err34 = {
                  instancePath: instancePath + '/payload/result/headers',
                  schemaPath: '#/$defs/stringMap/type',
                  keyword: 'type',
                  params: { type: 'object' },
                  message: 'must be object',
                };
                if (vErrors === null) {
                  vErrors = [err34];
                } else {
                  vErrors.push(err34);
                }
                errors++;
              }
            }
            if (data7.body !== undefined) {
              let data12 = data7.body;
              if (typeof data12 === 'string') {
                if (func1(data12) > 1048576) {
                  const err35 = {
                    instancePath: instancePath + '/payload/result/body',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/body/maxLength',
                    keyword: 'maxLength',
                    params: { limit: 1048576 },
                    message: 'must NOT have more than 1048576 characters',
                  };
                  if (vErrors === null) {
                    vErrors = [err35];
                  } else {
                    vErrors.push(err35);
                  }
                  errors++;
                }
              } else {
                const err36 = {
                  instancePath: instancePath + '/payload/result/body',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/body/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                };
                if (vErrors === null) {
                  vErrors = [err36];
                } else {
                  vErrors.push(err36);
                }
                errors++;
              }
            }
            if (data7.bodyBytes !== undefined) {
              let data13 = data7.bodyBytes;
              if (!(
                typeof data13 == 'number' &&
                !(data13 % 1) &&
                !isNaN(data13) &&
                isFinite(data13)
              )) {
                const err37 = {
                  instancePath: instancePath + '/payload/result/bodyBytes',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/bodyBytes/type',
                  keyword: 'type',
                  params: { type: 'integer' },
                  message: 'must be integer',
                };
                if (vErrors === null) {
                  vErrors = [err37];
                } else {
                  vErrors.push(err37);
                }
                errors++;
              }
              if (typeof data13 == 'number' && isFinite(data13)) {
                if (data13 > 1048576 || isNaN(data13)) {
                  const err38 = {
                    instancePath: instancePath + '/payload/result/bodyBytes',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/bodyBytes/maximum',
                    keyword: 'maximum',
                    params: { comparison: '<=', limit: 1048576 },
                    message: 'must be <= 1048576',
                  };
                  if (vErrors === null) {
                    vErrors = [err38];
                  } else {
                    vErrors.push(err38);
                  }
                  errors++;
                }
                if (data13 < 0 || isNaN(data13)) {
                  const err39 = {
                    instancePath: instancePath + '/payload/result/bodyBytes',
                    schemaPath:
                      '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/bodyBytes/minimum',
                    keyword: 'minimum',
                    params: { comparison: '>=', limit: 0 },
                    message: 'must be >= 0',
                  };
                  if (vErrors === null) {
                    vErrors = [err39];
                  } else {
                    vErrors.push(err39);
                  }
                  errors++;
                }
              }
            }
            if (data7.redirected !== undefined) {
              if (typeof data7.redirected !== 'boolean') {
                const err40 = {
                  instancePath: instancePath + '/payload/result/redirected',
                  schemaPath:
                    '#/allOf/1/properties/payload/oneOf/0/properties/result/properties/redirected/type',
                  keyword: 'type',
                  params: { type: 'boolean' },
                  message: 'must be boolean',
                };
                if (vErrors === null) {
                  vErrors = [err40];
                } else {
                  vErrors.push(err40);
                }
                errors++;
              }
            }
          } else {
            const err41 = {
              instancePath: instancePath + '/payload/result',
              schemaPath:
                '#/allOf/1/properties/payload/oneOf/0/properties/result/type',
              keyword: 'type',
              params: { type: 'object' },
              message: 'must be object',
            };
            if (vErrors === null) {
              vErrors = [err41];
            } else {
              vErrors.push(err41);
            }
            errors++;
          }
        }
      } else {
        const err42 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf/0/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        };
        if (vErrors === null) {
          vErrors = [err42];
        } else {
          vErrors.push(err42);
        }
        errors++;
      }
      var _valid0 = _errs13 === errors;
      if (_valid0) {
        valid4 = true;
        passing0 = 0;
        var props0 = true;
      }
      const _errs37 = errors;
      if (
        !validate69(data5, {
          instancePath: instancePath + '/payload',
          parentData: data,
          parentDataProperty: 'payload',
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate69.errors
            : vErrors.concat(validate69.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs37 === errors;
      if (_valid0 && valid4) {
        valid4 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid4 = true;
          passing0 = 1;
          if (props0 !== true) {
            props0 = true;
          }
        }
      }
      if (!valid4) {
        const err43 = {
          instancePath: instancePath + '/payload',
          schemaPath: '#/allOf/1/properties/payload/oneOf',
          keyword: 'oneOf',
          params: { passingSchemas: passing0 },
          message: 'must match exactly one schema in oneOf',
        };
        if (vErrors === null) {
          vErrors = [err43];
        } else {
          vErrors.push(err43);
        }
        errors++;
      } else {
        errors = _errs12;
        if (vErrors !== null) {
          if (_errs12) {
            vErrors.length = _errs12;
          } else {
            vErrors = null;
          }
        }
      }
    }
  }
  validate105.errors = vErrors;
  return errors === 0;
}
validate105.evaluated = {
  props: true,
  dynamicProps: false,
  dynamicItems: false,
};
function validate65(
  data,
  {
    instancePath = '',
    parentData,
    parentDataProperty,
    rootData = data,
    dynamicAnchors = {},
  } = {}
) {
  /*# sourceURL="https://prodivix.dev/schemas/gateway-envelope-v1.schema.json" */ let vErrors =
    null;
  let errors = 0;
  const evaluated0 = validate65.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = undefined;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = undefined;
  }
  const _errs0 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs1 = errors;
  if (
    !validate66(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate66.errors : vErrors.concat(validate66.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs1 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
    var props0 = true;
  }
  const _errs2 = errors;
  if (
    !validate68(data, {
      instancePath,
      parentData,
      parentDataProperty,
      rootData,
      dynamicAnchors,
    })
  ) {
    vErrors =
      vErrors === null ? validate68.errors : vErrors.concat(validate68.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
      if (props0 !== true) {
        props0 = true;
      }
    }
    const _errs3 = errors;
    if (
      !validate72(data, {
        instancePath,
        parentData,
        parentDataProperty,
        rootData,
        dynamicAnchors,
      })
    ) {
      vErrors =
        vErrors === null
          ? validate72.errors
          : vErrors.concat(validate72.errors);
      errors = vErrors.length;
    }
    var _valid0 = _errs3 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
        if (props0 !== true) {
          props0 = true;
        }
      }
      const _errs4 = errors;
      if (
        !validate74(data, {
          instancePath,
          parentData,
          parentDataProperty,
          rootData,
          dynamicAnchors,
        })
      ) {
        vErrors =
          vErrors === null
            ? validate74.errors
            : vErrors.concat(validate74.errors);
        errors = vErrors.length;
      }
      var _valid0 = _errs4 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
          if (props0 !== true) {
            props0 = true;
          }
        }
        const _errs5 = errors;
        if (
          !validate77(data, {
            instancePath,
            parentData,
            parentDataProperty,
            rootData,
            dynamicAnchors,
          })
        ) {
          vErrors =
            vErrors === null
              ? validate77.errors
              : vErrors.concat(validate77.errors);
          errors = vErrors.length;
        }
        var _valid0 = _errs5 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
            if (props0 !== true) {
              props0 = true;
            }
          }
          const _errs6 = errors;
          if (
            !validate79(data, {
              instancePath,
              parentData,
              parentDataProperty,
              rootData,
              dynamicAnchors,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate79.errors
                : vErrors.concat(validate79.errors);
            errors = vErrors.length;
          }
          var _valid0 = _errs6 === errors;
          if (_valid0 && valid0) {
            valid0 = false;
            passing0 = [passing0, 5];
          } else {
            if (_valid0) {
              valid0 = true;
              passing0 = 5;
              if (props0 !== true) {
                props0 = true;
              }
            }
            const _errs7 = errors;
            if (
              !validate82(data, {
                instancePath,
                parentData,
                parentDataProperty,
                rootData,
                dynamicAnchors,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate82.errors
                  : vErrors.concat(validate82.errors);
              errors = vErrors.length;
            }
            var _valid0 = _errs7 === errors;
            if (_valid0 && valid0) {
              valid0 = false;
              passing0 = [passing0, 6];
            } else {
              if (_valid0) {
                valid0 = true;
                passing0 = 6;
                if (props0 !== true) {
                  props0 = true;
                }
              }
              const _errs8 = errors;
              if (
                !validate88(data, {
                  instancePath,
                  parentData,
                  parentDataProperty,
                  rootData,
                  dynamicAnchors,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate88.errors
                    : vErrors.concat(validate88.errors);
                errors = vErrors.length;
              }
              var _valid0 = _errs8 === errors;
              if (_valid0 && valid0) {
                valid0 = false;
                passing0 = [passing0, 7];
              } else {
                if (_valid0) {
                  valid0 = true;
                  passing0 = 7;
                  if (props0 !== true) {
                    props0 = true;
                  }
                }
                const _errs9 = errors;
                if (
                  !validate91(data, {
                    instancePath,
                    parentData,
                    parentDataProperty,
                    rootData,
                    dynamicAnchors,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate91.errors
                      : vErrors.concat(validate91.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs9 === errors;
                if (_valid0 && valid0) {
                  valid0 = false;
                  passing0 = [passing0, 8];
                } else {
                  if (_valid0) {
                    valid0 = true;
                    passing0 = 8;
                    if (props0 !== true) {
                      props0 = true;
                    }
                  }
                  const _errs10 = errors;
                  if (
                    !validate93(data, {
                      instancePath,
                      parentData,
                      parentDataProperty,
                      rootData,
                      dynamicAnchors,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate93.errors
                        : vErrors.concat(validate93.errors);
                    errors = vErrors.length;
                  }
                  var _valid0 = _errs10 === errors;
                  if (_valid0 && valid0) {
                    valid0 = false;
                    passing0 = [passing0, 9];
                  } else {
                    if (_valid0) {
                      valid0 = true;
                      passing0 = 9;
                      if (props0 !== true) {
                        props0 = true;
                      }
                    }
                    const _errs11 = errors;
                    if (
                      !validate97(data, {
                        instancePath,
                        parentData,
                        parentDataProperty,
                        rootData,
                        dynamicAnchors,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate97.errors
                          : vErrors.concat(validate97.errors);
                      errors = vErrors.length;
                    }
                    var _valid0 = _errs11 === errors;
                    if (_valid0 && valid0) {
                      valid0 = false;
                      passing0 = [passing0, 10];
                    } else {
                      if (_valid0) {
                        valid0 = true;
                        passing0 = 10;
                        if (props0 !== true) {
                          props0 = true;
                        }
                      }
                      const _errs12 = errors;
                      if (
                        !validate100(data, {
                          instancePath,
                          parentData,
                          parentDataProperty,
                          rootData,
                          dynamicAnchors,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate100.errors
                            : vErrors.concat(validate100.errors);
                        errors = vErrors.length;
                      }
                      var _valid0 = _errs12 === errors;
                      if (_valid0 && valid0) {
                        valid0 = false;
                        passing0 = [passing0, 11];
                      } else {
                        if (_valid0) {
                          valid0 = true;
                          passing0 = 11;
                          if (props0 !== true) {
                            props0 = true;
                          }
                        }
                        const _errs13 = errors;
                        if (
                          !validate103(data, {
                            instancePath,
                            parentData,
                            parentDataProperty,
                            rootData,
                            dynamicAnchors,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate103.errors
                              : vErrors.concat(validate103.errors);
                          errors = vErrors.length;
                        }
                        var _valid0 = _errs13 === errors;
                        if (_valid0 && valid0) {
                          valid0 = false;
                          passing0 = [passing0, 12];
                        } else {
                          if (_valid0) {
                            valid0 = true;
                            passing0 = 12;
                            if (props0 !== true) {
                              props0 = true;
                            }
                          }
                          const _errs14 = errors;
                          if (
                            !validate105(data, {
                              instancePath,
                              parentData,
                              parentDataProperty,
                              rootData,
                              dynamicAnchors,
                            })
                          ) {
                            vErrors =
                              vErrors === null
                                ? validate105.errors
                                : vErrors.concat(validate105.errors);
                            errors = vErrors.length;
                          }
                          var _valid0 = _errs14 === errors;
                          if (_valid0 && valid0) {
                            valid0 = false;
                            passing0 = [passing0, 13];
                          } else {
                            if (_valid0) {
                              valid0 = true;
                              passing0 = 13;
                              if (props0 !== true) {
                                props0 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    const err0 = {
      instancePath,
      schemaPath: '#/oneOf',
      keyword: 'oneOf',
      params: { passingSchemas: passing0 },
      message: 'must match exactly one schema in oneOf',
    };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  } else {
    errors = _errs0;
    if (vErrors !== null) {
      if (_errs0) {
        vErrors.length = _errs0;
      } else {
        vErrors = null;
      }
    }
  }
  validate65.errors = vErrors;
  evaluated0.props = props0;
  return errors === 0;
}
validate65.evaluated = { dynamicProps: true, dynamicItems: false };
