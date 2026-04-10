import {
  serializerCompiler as zodSerializerCompiler,
  validatorCompiler as zodValidatorCompiler,
} from 'fastify-type-provider-zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import Ajv from 'ajv';

const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: true,
});

/**
 * Check if an object looks like a Zod schema
 */
function isZodSchema(obj: any): boolean {
  return obj && (typeof obj.parse === 'function' || typeof obj.safeParse === 'function' || obj.isZod || obj._def);
}

/**
 * Safe Transform for Swagger.
 * Passes Zod schemas to zodToJsonSchema, leaves raw JSON schemas untouched.
 */
export function safeJsonSchemaTransform({ schema, url }: any) {
  if (!schema) return { schema, url };

  // Ignored or hidden routes
  if (
    schema.hide ||
    url.startsWith('/documentation')
  ) {
    return { schema: { hide: true }, url };
  }

  const transformed: any = {};
  const { response, headers, querystring, body, params, ...rest } = schema;
  const zodOptions = { target: 'openApi3', $refStrategy: 'none' } as const;

  for (const [key, val] of Object.entries({ headers, querystring, body, params })) {
    if (val) {
      if (isZodSchema(val)) {
        transformed[key] = zodToJsonSchema(val, zodOptions);
      } else {
        transformed[key] = val; // Already a JSON Schema
      }
    }
  }

  if (response) {
    transformed.response = {};
    for (const code in response) {
      const r = response[code];
      if (r) {
        if (isZodSchema(r)) {
          transformed.response[code] = zodToJsonSchema(r, zodOptions);
        } else {
          transformed.response[code] = r; // Already a JSON Schema
        }
      }
    }
  }

  for (const [key, val] of Object.entries(rest)) {
    if (val !== undefined) {
      transformed[key] = val;
    }
  }

  return { schema: transformed, url };
}

/**
 * Safe Validator Compiler.
 * Intercepts routing validations. If the schema is Zod, delegates to fastify-type-provider-zod.
 * Otherwise, falls back to a raw AJV compile.
 */
export function safeValidatorCompiler({ schema, method, url, httpPart }: any) {
  if (isZodSchema(schema)) {
    return zodValidatorCompiler({ schema, method, url, httpPart });
  }

  // Fallback to AJV
  let validate: any;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    // If we fail to compile the JSON Schema, return a fast failure validator.
    validate = () => false;
  }

  return (data: any) => {
    if (validate(data)) {
      return { value: data };
    }
    return { error: validate.errors || new Error('Validation failed') };
  };
}

/**
 * Safe Serializer Compiler.
 * Intercepts response serialization.
 */
export function safeSerializerCompiler({ schema, method, url, httpStatus }: any) {
  if (isZodSchema(schema)) {
    return zodSerializerCompiler({ schema, method, url, httpStatus });
  }

  // fastify-type-provider-zod's default behavior is to wrap plain JSON schemas if they fall through.
  // Instead of trying to reinvent fast-json-stringify, we fallback to standard JSON.stringify 
  // since these endpoints aren't Zod parsed anyway.
  return (data: any) => JSON.stringify(data);
}
