import React, { memo, useState, useEffect, useMemo, useRef, useLayoutEffect, useContext, createContext, useCallback } from "react";
import { g as getPreviewApiUrl, c as clearPreviewApiUrl, i as isPreviewMode } from "./shared-D-DPf6kX.js";
const RECOMMENDATIONS_EVENT = "omniguide:recommendations";
function emitRecommendations(payload) {
  if (typeof window === "undefined") return;
  window[LAST_KEY] = payload;
  window.dispatchEvent(new CustomEvent(RECOMMENDATIONS_EVENT, { detail: payload }));
}
const LAST_KEY = "__omniguideLastRecommendations";
class OmniguideError extends Error {
  constructor(code, message, options) {
    super(message);
    this.name = "OmniguideError";
    this.code = code;
    this.cause = options == null ? void 0 : options.cause;
    this.context = options == null ? void 0 : options.context;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OmniguideError);
    }
  }
}
class WebSocketError extends OmniguideError {
  constructor(message, options) {
    super("WEBSOCKET_ERROR", message, options);
    this.name = "WebSocketError";
    this.readyState = options == null ? void 0 : options.readyState;
    this.url = options == null ? void 0 : options.url;
    this.closeCode = options == null ? void 0 : options.closeCode;
    this.closeReason = options == null ? void 0 : options.closeReason;
  }
}
class ConnectionTimeoutError extends WebSocketError {
  constructor(url, timeoutMs) {
    super(`Connection to ${url} timed out after ${timeoutMs}ms`, {
      context: { url, timeoutMs },
      url
    });
    this.name = "ConnectionTimeoutError";
  }
}
class MaxReconnectsError extends WebSocketError {
  constructor(attempts) {
    super(`Maximum reconnection attempts (${attempts}) exceeded`, {
      context: { attempts }
    });
    this.name = "MaxReconnectsError";
  }
}
class APIError extends OmniguideError {
  constructor(message, options) {
    super("API_ERROR", message, options);
    this.name = "APIError";
    this.status = options == null ? void 0 : options.status;
    this.statusText = options == null ? void 0 : options.statusText;
    this.url = options == null ? void 0 : options.url;
  }
}
class APITimeoutError extends APIError {
  constructor(url, timeoutMs) {
    super(`API request to ${url} timed out after ${timeoutMs}ms`, {
      context: { url, timeoutMs },
      url
    });
    this.name = "APITimeoutError";
  }
}
function getCurrentPage() {
  return typeof window !== "undefined" ? window.location.href : "";
}
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
const getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
const ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
const errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
let overrideErrorMap = errorMap;
function getErrorMap() {
  return overrideErrorMap;
}
const makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
const INVALID = Object.freeze({
  status: "aborted"
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message == null ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: (params == null ? void 0 : params.async) ?? false,
        contextualErrorMap: params == null ? void 0 : params.errorMap
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    var _a, _b;
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if ((_b = (_a = err == null ? void 0 : err.message) == null ? void 0 : _a.toLowerCase()) == null ? void 0 : _b.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params == null ? void 0 : params.errorMap,
        async: true
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && (decoded == null ? void 0 : decoded.typ) !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      offset: (options == null ? void 0 : options.offset) ?? false,
      local: (options == null ? void 0 : options.local) ?? false,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options == null ? void 0 : options.position,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params == null ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b;
          const defaultError = ((_b = (_a = this._def).errorMap) == null ? void 0 : _b.call(_a, issue, ctx).message) ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}
class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze2 = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze2(data)) : freeze2(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const booleanType = ZodBoolean.create;
const unknownType = ZodUnknown.create;
ZodNever.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
ZodUnion.create;
ZodIntersection.create;
ZodTuple.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
ZodPromise.create;
ZodOptional.create;
ZodNullable.create;
const STORAGE_KEY$1 = "ai-debug";
const PREFIX = "[Omniguide]";
let forceEnabled = false;
function isDebugEnabled() {
  var _a;
  if (forceEnabled) return true;
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY$1) === "true") {
      return true;
    }
  } catch {
  }
  try {
    if (typeof window !== "undefined") {
      const hostname = (_a = window.location) == null ? void 0 : _a.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return true;
      }
    }
  } catch {
  }
  return false;
}
const logger = {
  debug(...args) {
    if (isDebugEnabled()) {
      console.log(PREFIX, ...args);
    }
  },
  warn(...args) {
    console.warn(PREFIX, ...args);
  },
  error(...args) {
    console.error(PREFIX, ...args);
  },
  enable() {
    forceEnabled = true;
    try {
      localStorage.setItem(STORAGE_KEY$1, "true");
    } catch {
    }
  },
  disable() {
    forceEnabled = false;
    try {
      localStorage.removeItem(STORAGE_KEY$1);
    } catch {
    }
  },
  get enabled() {
    return isDebugEnabled();
  }
};
function createScopedLogger(scope) {
  const scopedPrefix = `${PREFIX}:${scope}`;
  return {
    debug(...args) {
      if (isDebugEnabled()) {
        console.log(scopedPrefix, ...args);
      }
    },
    warn(...args) {
      console.warn(scopedPrefix, ...args);
    },
    error(...args) {
      console.error(scopedPrefix, ...args);
    },
    enable: logger.enable,
    disable: logger.disable,
    get enabled() {
      return isDebugEnabled();
    }
  };
}
const WebSocketMessageSchema = objectType({
  type: stringType()
}).passthrough();
objectType({
  type: literalType("stream_chunk").or(literalType("answer")),
  content: stringType().optional(),
  chunk: stringType().optional()
}).passthrough();
objectType({
  type: literalType("session_id"),
  session_id: stringType()
}).passthrough();
objectType({
  type: literalType("conversation_id"),
  conversation_id: stringType()
}).passthrough();
const ProductSchema = objectType({
  id: unknownType(),
  // Accept any ID type (string, number)
  sku: stringType().optional(),
  name: stringType().optional(),
  // Recommendation match fields (SOI-801/802). Only `score`/`rank` are
  // shape-validated here; the richer match fields (matchPct/summary/bullets/
  // detail/reasons) intentionally ride the `.passthrough()` below and are
  // resolved + validated downstream by normalizeRecommendedProduct(). This
  // keeps the schema shape-first and alias-tolerant.
  score: numberType().optional(),
  rank: numberType().optional()
}).passthrough();
const CategorySchema = objectType({
  id: unknownType(),
  name: stringType().optional()
}).passthrough();
objectType({
  type: literalType("sources"),
  products: arrayType(ProductSchema).optional(),
  categories: arrayType(CategorySchema).optional(),
  blogs: arrayType(objectType({}).passthrough()).optional()
}).passthrough();
const AnswerOptionSchema = objectType({
  id: unknownType(),
  text: stringType().optional(),
  answer: stringType().optional()
  // Legacy format
}).passthrough();
objectType({
  type: literalType("discovery_question").or(literalType("intent_question")).or(literalType("clarification_question")),
  question_id: unknownType().optional(),
  question: stringType().optional(),
  question_text: stringType().optional(),
  answers: arrayType(AnswerOptionSchema).optional(),
  options: arrayType(AnswerOptionSchema).optional()
  // Legacy format
}).passthrough();
objectType({
  type: literalType("error"),
  message: stringType().optional(),
  error: stringType().optional(),
  code: stringType().optional()
}).passthrough();
objectType({
  type: literalType("ping").or(literalType("pong"))
}).passthrough();
objectType({
  type: literalType("fit_evaluation").or(literalType("fit_result")),
  fit_score: numberType().optional(),
  fit_level: stringType().optional(),
  explanation: stringType().optional(),
  products: arrayType(ProductSchema).optional()
}).passthrough();
objectType({
  type: literalType("question"),
  question_id: unknownType(),
  question: stringType().optional(),
  question_text: stringType().optional(),
  answers: arrayType(AnswerOptionSchema).optional()
}).passthrough();
function validateMessage(data, schema, logPrefix = "[Omniguide]") {
  const result = schema.safeParse(data);
  if (!result.success) {
    logger.warn(`${logPrefix} Schema validation failed:`, {
      errors: result.error.errors,
      data
    });
    return null;
  }
  return result.data;
}
function validateWebSocketMessage(data) {
  return validateMessage(data, WebSocketMessageSchema, "[Omniguide WS]");
}
function safeJsonParse(text2) {
  try {
    const sanitized = text2.replace(/:\s*Infinity\s*([,}\]])/g, ":null$1").replace(/:\s*-Infinity\s*([,}\]])/g, ":null$1").replace(/:\s*NaN\s*([,}\]])/g, ":null$1");
    return JSON.parse(sanitized);
  } catch (error) {
    logger.warn("Failed to parse JSON:", error);
    return null;
  }
}
function parseAndValidateMessage(text2) {
  const data = safeJsonParse(text2);
  if (data === null) return null;
  return validateWebSocketMessage(data);
}
const DEFAULT_CONFIG$1 = {
  maxReconnectAttempts: 5,
  maxBackoffDelay: 3e4,
  baseDelay: 1e3,
  connectionTimeout: 1e4,
  heartbeatIntervalMs: 5e3
};
class BaseWebSocket {
  constructor(config) {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.isIntentionalClose = false;
    this.connectionPromise = null;
    this.connectionGeneration = 0;
    this.rejectPendingConnection = null;
    this.reconnectTimeoutId = null;
    this.heartbeatInterval = null;
    this.websiteCode = config.websiteCode;
    this.sessionId = config.sessionId ?? "";
    this.currentPageUrl = getCurrentPage();
    this.onMessage = config.onMessage ?? (() => {
    });
    this.onStatusChange = config.onStatusChange ?? (() => {
    });
    this.onError = config.onError ?? (() => {
    });
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? DEFAULT_CONFIG$1.maxReconnectAttempts;
    this.maxBackoffDelay = config.maxBackoffDelay ?? DEFAULT_CONFIG$1.maxBackoffDelay;
    this.baseDelay = DEFAULT_CONFIG$1.baseDelay;
    this.connectionTimeout = config.connectionTimeout ?? DEFAULT_CONFIG$1.connectionTimeout;
    this.autoReconnect = config.autoReconnect ?? true;
    this.onReconnectAttempt = config.onReconnectAttempt;
    this.enableHeartbeat = config.enableHeartbeat ?? false;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? DEFAULT_CONFIG$1.heartbeatIntervalMs;
    this.logPrefix = config.logPrefix ?? "[BaseWebSocket]";
  }
  /**
   * Handle feature-specific messages - override in subclass
   */
  handleMessage(msg) {
    this.onMessage(msg);
  }
  /**
   * Connect to WebSocket server
   *
   * Uses a generation counter to guard against disconnect-during-connect races:
   * if disconnect() is called while connecting, the pending promise is rejected
   * and all stale WebSocket event handlers become no-ops.
   */
  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.cancelPendingReconnect();
    const generation = ++this.connectionGeneration;
    this.isIntentionalClose = false;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.rejectPendingConnection = reject;
      const wsUrl = this.getWebSocketUrl();
      this.onStatusChange("connecting");
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        this.connectionPromise = null;
        this.rejectPendingConnection = null;
        this.onStatusChange("disconnected");
        logger.debug(`${this.logPrefix} Failed to create WebSocket:`, {
          url: wsUrl,
          error: error instanceof Error ? error.message : String(error),
          origin: typeof window !== "undefined" ? window.location.origin : "unknown"
        });
        reject(
          new WebSocketError("Failed to create WebSocket", {
            cause: error instanceof Error ? error : void 0,
            url: wsUrl
          })
        );
        return;
      }
      const connectionTimeoutId = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          if (generation === this.connectionGeneration) {
            this.connectionPromise = null;
            this.rejectPendingConnection = null;
          }
          reject(new ConnectionTimeoutError(wsUrl, this.connectionTimeout));
        }
      }, this.connectionTimeout);
      this.ws.onopen = () => {
        clearTimeout(connectionTimeoutId);
        if (generation !== this.connectionGeneration) {
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          return;
        }
        this.rejectPendingConnection = null;
        this.reconnectAttempts = 0;
        this.onStatusChange("connected");
        if (this.enableHeartbeat) {
          this.startHeartbeat();
        }
        setTimeout(() => {
          resolve();
        }, 50);
      };
      this.ws.onmessage = (event) => {
        const msg = parseAndValidateMessage(event.data);
        if (msg === null) {
          return;
        }
        this.handleIncomingMessage(msg);
      };
      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeoutId);
        if (generation !== this.connectionGeneration) return;
        this.connectionPromise = null;
        this.rejectPendingConnection = null;
        this.stopHeartbeat();
        const closeInfo = {
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
          intentional: this.isIntentionalClose,
          url: wsUrl
        };
        if (!event.wasClean && !this.isIntentionalClose) {
          logger.warn(`${this.logPrefix} Connection closed unexpectedly:`, closeInfo);
        } else {
          logger.debug(`${this.logPrefix} Connection closed:`, closeInfo);
        }
        if (!this.isIntentionalClose) {
          if (event.code !== 1e3 && event.code !== 1001) {
            const error = new WebSocketError(
              `WebSocket closed unexpectedly: ${closeInfo.reason}`,
              {
                closeCode: event.code,
                closeReason: closeInfo.reason,
                url: wsUrl
              }
            );
            this.onError(error);
          }
          if (this.autoReconnect) {
            this.onStatusChange("reconnecting");
            this.scheduleReconnect();
          } else {
            this.onStatusChange("disconnected");
          }
        } else {
          this.onStatusChange("disconnected");
        }
      };
      this.ws.onerror = () => {
        var _a, _b, _c;
        clearTimeout(connectionTimeoutId);
        if (generation !== this.connectionGeneration) return;
        this.connectionPromise = null;
        this.rejectPendingConnection = null;
        const diagnostics = {
          readyState: (_a = this.ws) == null ? void 0 : _a.readyState,
          url: wsUrl,
          origin: typeof window !== "undefined" ? window.location.origin : "unknown",
          protocol: typeof window !== "undefined" ? window.location.protocol : "unknown",
          websiteCode: this.websiteCode,
          sessionId: this.sessionId ? `${this.sessionId.substring(0, 20)}...` : "(none)",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        const error = new WebSocketError("WebSocket connection error occurred", {
          readyState: (_b = this.ws) == null ? void 0 : _b.readyState,
          url: wsUrl
        });
        logger.error(`${this.logPrefix} WebSocket error:`, { url: wsUrl, readyState: (_c = this.ws) == null ? void 0 : _c.readyState });
        logger.debug(`${this.logPrefix} WebSocket error diagnostics:`, diagnostics);
        this.onError(error);
        reject(error);
      };
    });
    return this.connectionPromise;
  }
  /**
   * Internal message handler - routes common messages and delegates to subclass
   */
  handleIncomingMessage(msg) {
    var _a;
    switch (msg.type) {
      case "ping":
        return;
      case "session_id":
        if (typeof msg["session_id"] === "string" && msg["session_id"]) {
          this.sessionId = msg["session_id"];
          (_a = this.onSessionIdUpdate) == null ? void 0 : _a.call(this, msg["session_id"]);
        }
        break;
    }
    this.handleMessage(msg);
  }
  /**
   * Schedule reconnection with exponential backoff + jitter.
   * Jitter prevents thundering-herd when many clients reconnect simultaneously.
   */
  scheduleReconnect() {
    var _a;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onStatusChange("disconnected");
      this.onError(new MaxReconnectsError(this.maxReconnectAttempts));
      return;
    }
    const exponentialDelay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * this.baseDelay;
    const delay = Math.min(exponentialDelay + jitter, this.maxBackoffDelay);
    const attemptInfo = {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: Math.round(delay)
    };
    logger.debug(
      `${this.logPrefix} Reconnecting in ${attemptInfo.delayMs}ms (attempt ${attemptInfo.attempt}/${attemptInfo.maxAttempts})`
    );
    (_a = this.onReconnectAttempt) == null ? void 0 : _a.call(this, attemptInfo);
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.reconnectAttempts++;
      this.connect().catch(() => {
      });
    }, delay);
  }
  /**
   * Cancel any pending reconnect timeout
   */
  cancelPendingReconnect() {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }
  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.sendPing();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      } else {
        this.stopHeartbeat();
      }
    }, this.heartbeatIntervalMs);
  }
  /**
   * Stop heartbeat interval
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  /**
   * Send ping message to keep connection alive
   */
  sendPing() {
    var _a;
    if (this.isConnected()) {
      try {
        (_a = this.ws) == null ? void 0 : _a.send(JSON.stringify({ type: "ping" }));
      } catch (error) {
        logger.warn(`${this.logPrefix} Failed to send ping:`, error);
      }
    }
  }
  /**
   * Send a message to the server
   */
  send(message) {
    var _a;
    if (!this.isConnected()) {
      throw new WebSocketError("WebSocket not connected");
    }
    const fullMessage = {
      ...message,
      website_code: this.websiteCode,
      current_page: this.currentPageUrl
    };
    (_a = this.ws) == null ? void 0 : _a.send(JSON.stringify(fullMessage));
  }
  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  /**
   * Disconnect WebSocket
   *
   * Increments the connection generation to invalidate any pending connect()
   * handlers, rejects the pending connection promise (so callers don't hang),
   * and cancels any scheduled reconnect.
   */
  disconnect() {
    this.isIntentionalClose = true;
    this.connectionGeneration++;
    this.stopHeartbeat();
    this.cancelPendingReconnect();
    if (this.rejectPendingConnection) {
      const reject = this.rejectPendingConnection;
      this.rejectPendingConnection = null;
      reject(new WebSocketError("Connection aborted: disconnect() called during connect()"));
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionPromise = null;
    this.onStatusChange("disconnected");
  }
  /**
   * Reset connection (close and reconnect)
   */
  async reset() {
    this.disconnect();
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    await this.connect();
  }
  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * Update session ID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
  /**
   * Set callback for session ID updates
   */
  setOnSessionIdUpdate(callback) {
    this.onSessionIdUpdate = callback;
  }
  /**
   * Update current page URL (for tracking)
   */
  setCurrentPageUrl(url) {
    this.currentPageUrl = url;
  }
}
function getWebSocketBaseUrl(apiBaseUrl) {
  const isSecure = apiBaseUrl.startsWith("https") || typeof window !== "undefined" && window.location.protocol === "https:";
  const protocol = isSecure ? "wss:" : "ws:";
  const urlObj = new URL(apiBaseUrl);
  return `${protocol}//${urlObj.host}`;
}
class ChatWebSocket extends BaseWebSocket {
  constructor(config) {
    super({
      ...config,
      // Search-specific settings
      enableHeartbeat: false,
      maxReconnectAttempts: 5,
      maxBackoffDelay: 3e4,
      logPrefix: "[ChatWebSocket]"
    });
    this.conversationId = "";
    this.apiBaseUrl = config.apiBaseUrl;
  }
  /**
   * Get WebSocket URL for search
   */
  getWebSocketUrl() {
    const baseUrl = getWebSocketBaseUrl(this.apiBaseUrl);
    return `${baseUrl}/ws/search/${this.sessionId}`;
  }
  /**
   * Set the conversation ID for subsequent messages
   */
  setConversationId(conversationId) {
    this.conversationId = conversationId || "";
  }
  /**
   * Get current conversation ID
   */
  getConversationId() {
    return this.conversationId;
  }
  /**
   * Reset conversation
   */
  resetConversation() {
    this.conversationId = "";
  }
  /**
   * Handle search-specific messages
   */
  handleMessage(msg) {
    if (msg.type === "conversation_id" && typeof msg["conversation_id"] === "string") {
      this.conversationId = msg["conversation_id"];
    }
    this.onMessage(msg);
  }
  /**
   * Send a query message to the server
   */
  sendQuery(content, metadata = {}) {
    const message = {
      type: "query",
      content,
      conversation_id: this.conversationId,
      session_id: this.sessionId,
      ...metadata
    };
    this.send(message);
  }
  /**
   * Send an intent question answer
   */
  sendIntentAnswer(answerText, answerId) {
    this.sendQuery(answerText, {
      intent_question_answer_id: answerId
    });
  }
  /**
   * Send a discovery question answer
   */
  sendDiscoveryAnswer(questionId, answerId, answerText, options = {}) {
    this.send({
      type: "discovery_answer",
      question_id: questionId,
      answer_id: answerId,
      answer_text: answerText,
      session_id: this.sessionId,
      ...options
    });
  }
}
const DEFAULT_CONFIG = {
  timeout: 1e4
};
class ApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.defaultTimeout = config.timeout ?? DEFAULT_CONFIG.timeout;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.headers
    };
  }
  /**
   * Make an HTTP request
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          url
        });
      }
      const data = await response.json();
      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new APITimeoutError(url, timeout);
        }
        throw new APIError(`API request failed: ${error.message}`, {
          cause: error,
          url
        });
      }
      throw new APIError("API request failed", { url });
    }
  }
  /**
   * GET request
   */
  async get(endpoint, options) {
    return this.request(endpoint, { ...options, method: "GET" });
  }
  /**
   * POST request
   */
  async post(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: "POST", body });
  }
  /**
   * PUT request
   */
  async put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: "PUT", body });
  }
  /**
   * DELETE request
   */
  async delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
  /**
   * Update base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, "");
  }
  /**
   * Update default headers
   */
  setHeaders(headers) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers
    };
  }
}
const API_URLS = {
  LOCAL: "http://localhost:8000",
  PRODUCTION: "https://verdict.swiftotter.com"
};
const API_ENDPOINTS = {
  SEARCH: "/api/v1/search",
  EVENT: "/api/v1/event",
  CONSENT: "/api/v1/consent",
  FEEDBACK: "/api/v1/feedback",
  CONVERSATIONAL_SEARCH_INIT: "/api/v1/conversational-search/initialize",
  BC_SEARCH_PRODUCTS: "/api/v1/bc-search-products",
  BC_SEARCH_CATEGORIES: "/api/v1/bc-search-categories",
  PRODUCT_QUESTIONS: "/api/v1/product/questions",
  CATEGORY_QUESTIONS: "/api/v1/category/questions",
  TYPEAHEAD_SEARCH: "/api/v1/typeahead/search"
};
const ERROR_MESSAGES = {
  TIMEOUT: "The search is taking longer than expected. Please try again.",
  GENERIC: "Something went wrong with your search. Please try again."
};
const LATENCY = {
  THINKING_THRESHOLD: 3e3,
  RESPONSE_TIMEOUT: 1e4
};
const FLOW_STATES = {
  IDLE: "idle",
  LOADING_FIRST: "loading_first",
  SHOWING_FIRST: "showing_first",
  CONNECTING: "connecting",
  QUESTIONING: "questioning",
  LOADING_RESULTS: "loading_results",
  COMPLETE: "complete",
  ERROR: "error"
};
function isLocalhost() {
  if (typeof window === "undefined") return false;
  return window.location.origin.includes("localhost");
}
function getApiBaseUrl(customUrl) {
  const previewUrl = getPreviewApiUrl();
  if (previewUrl) return previewUrl;
  if (customUrl) return customUrl;
  return isLocalhost() ? API_URLS.LOCAL : API_URLS.PRODUCTION;
}
const TYPEAHEAD_ENDPOINT = API_ENDPOINTS.TYPEAHEAD_SEARCH;
async function fetchTypeaheadSearch(opts) {
  const { apiBaseUrl, request, origin, signal, fetchImpl = fetch } = opts;
  const url = `${apiBaseUrl.replace(/\/$/, "")}${TYPEAHEAD_ENDPOINT}`;
  const headers = { "Content-Type": "application/json" };
  if (origin) {
    headers["X-Omniguide-Origin"] = origin;
  }
  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { kind: "aborted" };
    }
    return { kind: "error" };
  }
  if (response.status === 503) {
    return { kind: "disabled" };
  }
  if (!response.ok) {
    return { kind: "error", status: response.status };
  }
  try {
    const data = await response.json();
    return { kind: "ok", data };
  } catch {
    return { kind: "error", status: response.status };
  }
}
const TYPEAHEAD_SECTION_ORDER = [
  "products",
  "categories",
  "content",
  "brands"
];
function normalizeSessionResponse(raw) {
  return {
    sessionId: raw.session_id ?? "",
    welcomeText: raw.welcome_text,
    seedQuestions: raw.seed_questions,
    aiDisabled: raw.ai_disabled,
    disabledReason: raw.disabled_reason
  };
}
function normalizeQuestions(raw) {
  if (!raw.questions || !Array.isArray(raw.questions)) {
    return [];
  }
  const sorted = [...raw.questions].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return sorted.map((q) => {
    const rawAnswers = (q.answers || q.options || []).map((a) => ({
      id: String(a.id),
      text: a.text || a.answer_text || a.answer || ""
    }));
    const renderHint = q.answer_render_hint ?? void 0;
    const choices = q.answer_choices ? q.answer_choices.map((c) => ({ id: String(c.id), value: c.value })) : void 0;
    const answers = rawAnswers.length === 0 && renderHint === "choice" && choices && choices.length > 0 ? choices.map((c) => ({ id: c.id, text: c.value })) : rawAnswers;
    return {
      id: String(q.question_id ?? q.id),
      question: q.question || q.question_text || "",
      answers,
      allowOther: q.allow_other,
      productTypeId: q.product_type_id,
      answerRenderHint: renderHint,
      answerChoices: choices
    };
  });
}
function normalizeFeedbackResponse(raw) {
  return {
    success: raw.success ?? false,
    feedbackId: raw.feedbackId ?? raw.feedback_id ?? "",
    message: raw.message
  };
}
const RestSessionResponseSchema = objectType({
  sessionId: stringType(),
  welcomeText: stringType().optional(),
  seedQuestions: arrayType(stringType()).optional(),
  aiDisabled: booleanType().optional(),
  disabledReason: stringType().nullable().optional()
});
const RestDiscoveryAnswerSchema = objectType({
  id: stringType(),
  text: stringType()
});
const RestAnswerChoiceSchema = objectType({
  id: stringType(),
  value: stringType()
});
const RestDiscoveryQuestionSchema = objectType({
  id: stringType(),
  question: stringType(),
  answers: arrayType(RestDiscoveryAnswerSchema),
  allowOther: booleanType().optional(),
  productTypeId: numberType().optional(),
  answerRenderHint: enumType(["choice", "autocomplete", "searchable_dropdown"]).optional(),
  answerChoices: arrayType(RestAnswerChoiceSchema).nullable().optional()
});
const RestQuestionsResponseSchema = arrayType(RestDiscoveryQuestionSchema);
const RestFeedbackResponseSchema = objectType({
  success: booleanType(),
  feedbackId: stringType(),
  message: stringType().optional()
});
class FeedbackAPI {
  constructor(config) {
    this.api = new ApiClient({ baseUrl: config.apiBaseUrl, timeout: 1e4 });
    this.websiteCode = config.websiteCode;
    this.getSessionId = config.getSessionId;
  }
  /**
   * Submit feedback to the API
   */
  async submitFeedback(feedbackData) {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new APIError("Session expired. Please refresh the page.", {
        context: { reason: "no_session" }
      });
    }
    const payload = {
      session_id: sessionId,
      website_code: this.websiteCode,
      entity_type: feedbackData.entityType,
      entity_id: feedbackData.entityId,
      vote: feedbackData.vote,
      comment: feedbackData.comment ?? "",
      context: feedbackData.context ?? {}
    };
    try {
      const response = await this.api.post("/api/v1/feedback", payload);
      const normalized = normalizeFeedbackResponse(response.data);
      const validated = RestFeedbackResponseSchema.safeParse(normalized);
      return validated.success ? validated.data : { success: false, feedbackId: "" };
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 400) {
          throw new APIError("Invalid feedback data. Please try again.", {
            cause: error,
            status: error.status
          });
        } else if (error.status === 404) {
          throw new APIError("Service not found. Please contact support.", {
            cause: error,
            status: error.status
          });
        } else if (error.status === 429) {
          throw new APIError("Too many requests. Please wait a moment.", {
            cause: error,
            status: error.status
          });
        } else if (error.status && error.status >= 500) {
          throw new APIError("Service error. Please try again later.", {
            cause: error,
            status: error.status
          });
        }
      }
      throw error;
    }
  }
  /**
   * Submit thumbs up feedback
   */
  async thumbsUp(entityId, entityType, options) {
    return this.submitFeedback({
      entityId,
      entityType,
      vote: 1,
      ...options
    });
  }
  /**
   * Submit thumbs down feedback
   */
  async thumbsDown(entityId, entityType, options) {
    return this.submitFeedback({
      entityId,
      entityType,
      vote: -1,
      ...options
    });
  }
}
function createFeedbackAPI(config) {
  return new FeedbackAPI(config);
}
const NullPlatformAdapter = {
  getPlatformName: () => "null",
  isInitialized: () => false,
  getProductSku: () => null,
  getCredentials: () => ({}),
  hydrateProducts: async (products) => products,
  hydrateCategories: async (categories) => categories
};
class PlatformAdapterRegistry {
  constructor() {
    this.adapter = NullPlatformAdapter;
  }
  /**
   * Register a platform adapter
   */
  register(adapter) {
    this.adapter = adapter;
  }
  /**
   * Get the current platform adapter
   */
  get() {
    return this.adapter;
  }
  /**
   * Check if a real adapter is registered
   */
  isInitialized() {
    return this.adapter !== NullPlatformAdapter && this.adapter.isInitialized();
  }
  /**
   * Reset to null adapter
   */
  reset() {
    this.adapter = NullPlatformAdapter;
  }
}
const platformRegistry = new PlatformAdapterRegistry();
function createPlatformAdapter(partial) {
  return {
    getPlatformName: partial.getPlatformName,
    isInitialized: partial.isInitialized ?? (() => true),
    getProductSku: partial.getProductSku ?? (() => null),
    getCredentials: partial.getCredentials ?? (() => ({})),
    hydrateProducts: partial.hydrateProducts ?? (async (products) => products),
    hydrateCategories: partial.hydrateCategories ?? (async (categories) => categories)
  };
}
const DEFAULT_STORAGE_KEYS = {
  sessionId: "omniguide_session_id",
  answeredIntents: "omniguideAnsweredIntents"
};
class LocalStorageAdapter {
  constructor() {
    this.available = this.checkAvailability();
  }
  checkAvailability() {
    try {
      const testKey = "__omniguide_storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  getItem(key) {
    if (!this.available) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.warn("Failed to read from localStorage:", error);
      return null;
    }
  }
  setItem(key, value) {
    if (!this.available) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.warn("Failed to write to localStorage:", error);
    }
  }
  removeItem(key) {
    if (!this.available) {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn("Failed to remove from localStorage:", error);
    }
  }
}
class AnsweredIntentsStorage {
  constructor(storage, storageKey = DEFAULT_STORAGE_KEYS.answeredIntents) {
    this.storage = storage;
    this.storageKey = storageKey;
  }
  /**
   * Load answered intents from storage
   */
  load(productTypeId) {
    try {
      const stored = this.storage.getItem(this.storageKey);
      const intents = stored ? JSON.parse(stored) : {};
      if (productTypeId === void 0) {
        return intents;
      }
      const filtered = {};
      for (const [key, value] of Object.entries(intents)) {
        if (value.productTypeId === productTypeId || value.productTypeId === void 0) {
          filtered[key] = value;
        }
      }
      return filtered;
    } catch (error) {
      logger.warn("Failed to load answered intents:", error);
      return {};
    }
  }
  /**
   * Save answered intents to storage
   */
  save(intents) {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(intents));
    } catch (error) {
      logger.warn("Failed to save answered intents:", error);
    }
  }
  /**
   * Add or update an answered intent
   */
  upsert(intent) {
    const intents = this.load();
    intents[intent.questionId] = intent;
    this.save(intents);
  }
  /**
   * Remove specific question answers
   */
  remove(questionIds) {
    const intents = this.load();
    for (const id of questionIds) {
      delete intents[id];
    }
    this.save(intents);
  }
  /**
   * Clear all answered intents
   */
  clear() {
    this.storage.removeItem(this.storageKey);
  }
  /**
   * Convert to API format (numeric IDs without prefixes)
   */
  toApiFormat(productTypeId) {
    const intents = this.load(productTypeId);
    const apiFormat = {};
    for (const [questionId, answer] of Object.entries(intents)) {
      const questionKey = questionId.replace(/^discovery_/, "").replace(/^dynamic_/, "").replace(/^intent_/, "");
      const answerIdStr = String(answer.answerId);
      const numericAnswerId = parseInt(
        answerIdStr.replace(/^discovery_/, "").replace(/^dynamic_/, "").replace(/^intent_/, ""),
        10
      );
      apiFormat[questionKey] = {
        answer_id: isNaN(numericAnswerId) ? answer.answerId : numericAnswerId,
        answer_text: answer.answerText
      };
    }
    return apiFormat;
  }
}
class ResponseTimer {
  constructor(callbacks, config = {}) {
    this.thinkingTimer = null;
    this.timeoutTimer = null;
    this.state = "idle";
    this.callbacks = callbacks;
    this.thinkingThreshold = config.thinkingThreshold ?? LATENCY.THINKING_THRESHOLD;
    this.responseTimeout = config.responseTimeout ?? LATENCY.RESPONSE_TIMEOUT;
  }
  /**
   * Start the latency timer (call when sending a query)
   */
  start() {
    this.cancel();
    this.state = "waiting";
    this.thinkingTimer = setTimeout(() => {
      var _a, _b;
      this.state = "thinking";
      (_b = (_a = this.callbacks).onThinking) == null ? void 0 : _b.call(_a);
    }, this.thinkingThreshold);
    this.timeoutTimer = setTimeout(() => {
      var _a, _b;
      this.state = "timeout";
      (_b = (_a = this.callbacks).onTimeout) == null ? void 0 : _b.call(_a);
    }, this.responseTimeout);
  }
  /**
   * Cancel the timer (call when any response is received)
   */
  cancel() {
    var _a, _b;
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.state !== "idle") {
      this.state = "idle";
      (_b = (_a = this.callbacks).onCancel) == null ? void 0 : _b.call(_a);
    }
  }
  /**
   * Get current latency state
   */
  getState() {
    return this.state;
  }
  /**
   * Check if timer is currently running
   */
  isRunning() {
    return this.state !== "idle";
  }
  /**
   * Clean up timers (call on unmount)
   */
  destroy() {
    this.cancel();
  }
}
function createResponseTimer(callbacks, config) {
  return new ResponseTimer(callbacks, config);
}
const filterEmptyContent = (sources) => sources.filter((source) => {
  var _a, _b;
  const { data } = source;
  if (!data) return false;
  return !!((_a = data.name) == null ? void 0 : _a.trim()) && !!((_b = data.url) == null ? void 0 : _b.trim());
});
const normalizeUrl = (url) => {
  const trimmed = url.trim();
  return trimmed.endsWith("/") && trimmed.length > 1 ? trimmed.slice(0, -1) : trimmed;
};
const filterRedundantContent = (sources, pairs) => {
  if (!(pairs == null ? void 0 : pairs.length)) return sources;
  const normalizedUrls = new Set(sources.map((s) => {
    var _a;
    return normalizeUrl(((_a = s.data) == null ? void 0 : _a.url) ?? "");
  }));
  const toRemove = /* @__PURE__ */ new Set();
  for (const [removable, required] of pairs) {
    if (normalizedUrls.has(normalizeUrl(required)) && normalizedUrls.has(normalizeUrl(removable))) {
      toRemove.add(normalizeUrl(removable));
    }
  }
  if (toRemove.size === 0) return sources;
  return sources.filter((s) => {
    var _a;
    return !toRemove.has(normalizeUrl(((_a = s.data) == null ? void 0 : _a.url) ?? ""));
  });
};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var removeMarkdown;
var hasRequiredRemoveMarkdown;
function requireRemoveMarkdown() {
  if (hasRequiredRemoveMarkdown) return removeMarkdown;
  hasRequiredRemoveMarkdown = 1;
  removeMarkdown = function(md, options) {
    options = options || {};
    options.listUnicodeChar = options.hasOwnProperty("listUnicodeChar") ? options.listUnicodeChar : false;
    options.stripListLeaders = options.hasOwnProperty("stripListLeaders") ? options.stripListLeaders : true;
    options.gfm = options.hasOwnProperty("gfm") ? options.gfm : true;
    options.useImgAltText = options.hasOwnProperty("useImgAltText") ? options.useImgAltText : true;
    options.abbr = options.hasOwnProperty("abbr") ? options.abbr : false;
    options.replaceLinksWithURL = options.hasOwnProperty("replaceLinksWithURL") ? options.replaceLinksWithURL : false;
    options.separateLinksAndTexts = options.hasOwnProperty("separateLinksAndTexts") ? options.separateLinksAndTexts : null;
    options.htmlTagsToSkip = options.hasOwnProperty("htmlTagsToSkip") ? options.htmlTagsToSkip : [];
    options.throwError = options.hasOwnProperty("throwError") ? options.throwError : false;
    var output = md || "";
    output = output.replace(/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/gm, "");
    try {
      if (options.stripListLeaders) {
        if (options.listUnicodeChar)
          output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + " $1");
        else
          output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, "$1");
      }
      if (options.gfm) {
        output = output.replace(/\n={2,}/g, "\n").replace(/~{3}.*\n/g, "").replace(/~~/g, "").replace(/```(?:.*)\n([\s\S]*?)```/g, (_, code) => code.trim());
      }
      if (options.abbr) {
        output = output.replace(/\*\[.*\]:.*\n/, "");
      }
      let htmlReplaceRegex = /<[^>]*>/g;
      if (options.htmlTagsToSkip && options.htmlTagsToSkip.length > 0) {
        const joinedHtmlTagsToSkip = options.htmlTagsToSkip.join("|");
        htmlReplaceRegex = new RegExp(
          `<(?!/?(${joinedHtmlTagsToSkip})(?=>|s[^>]*>))[^>]*>`,
          "g"
        );
      }
      if (options.separateLinksAndTexts) {
        output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1" + options.separateLinksAndTexts + "$2");
      }
      output = output.replace(htmlReplaceRegex, "").replace(/^[=\-]{2,}\s*$/g, "").replace(/\[\^.+?\](\: .*?$)?/g, "").replace(/\s{0,2}\[.*?\]: .*?$/g, "").replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? "$1" : "").replace(/\[([\s\S]*?)\]\s*[\(\[](.*?)[\)\]]/g, options.replaceLinksWithURL ? "$2" : "$1").replace(/^(\n)?\s{0,3}>\s?/gm, "$1").replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "").replace(/^(\n)?\s{0,}#{1,6}\s*( (.+))? +#+$|^(\n)?\s{0,}#{1,6}\s*( (.+))?$/gm, "$1$3$4$6").replace(/([\*]+)(\S)(.*?\S)??\1/g, "$2$3").replace(/(^|\W)([_]+)(\S)(.*?\S)??\2($|\W)/g, "$1$3$4$5").replace(/(`{3,})(.*?)\1/gm, "$2").replace(/`(.+?)`/g, "$1").replace(/~(.*?)~/g, "$1");
    } catch (e) {
      if (options.throwError) throw e;
      console.error("remove-markdown encountered error: %s", e);
      return md;
    }
    return output;
  };
  return removeMarkdown;
}
var removeMarkdownExports = requireRemoveMarkdown();
const removeMd = /* @__PURE__ */ getDefaultExportFromCjs(removeMarkdownExports);
const MAX_SUMMARY_CHARS = 200;
function cleanText(raw = "") {
  if (!raw) return "";
  const lines = raw.split("\n");
  const filtered = [];
  let inToc = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^table of contents$/i.test(trimmed)) {
      inToc = true;
      continue;
    }
    if (/^toggle$/i.test(trimmed)) {
      continue;
    }
    if (inToc) {
      if (/^[*-]\s*\[.*]\(.*\)/i.test(trimmed)) {
        continue;
      }
      if (/^\*?\s*\[.*]\(.*\)/i.test(trimmed)) {
        continue;
      }
      if (/^#{1,6}\s*/.test(trimmed)) {
        inToc = false;
      } else {
        continue;
      }
    }
    if (/^#{1,6}\s*/.test(trimmed)) {
      continue;
    }
    filtered.push(trimmed);
  }
  let text2 = filtered.join(" ");
  text2 = removeMd(text2, { listUnicodeChar: "", useImgAltText: true });
  text2 = text2.replace(/\s+/g, " ").trim();
  return text2;
}
function shortenText(text2, limit = MAX_SUMMARY_CHARS) {
  if (!text2) return "";
  if (text2.length <= limit) return text2;
  return text2.slice(0, limit).trimEnd();
}
function transformSummary(rawSummary) {
  return shortenText(cleanText(rawSummary));
}
function extractSkusFromMarkdown(content) {
  if (!content) return [];
  const skus = /* @__PURE__ */ new Set();
  let match;
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const linkText = match[1] ?? "";
    const skuMatch = linkText.match(/\(SKU:\s*(\d+)\)|SKU:\s*(\d+)/i);
    if (skuMatch) {
      const sku = skuMatch[1] ?? skuMatch[2] ?? "";
      if (sku) skus.add(sku);
    }
  }
  const format1Regex = /\[product\s+sku=['"]([^'"]+)['"]\][^[]+\[\/product\]/g;
  while ((match = format1Regex.exec(content)) !== null) {
    if (match[1]) skus.add(match[1]);
  }
  const format2Regex = /\[[^\]]+\]\(sku=['"]([^'"]+)['"]\)/g;
  while ((match = format2Regex.exec(content)) !== null) {
    if (match[1]) skus.add(match[1]);
  }
  const format3Regex = /\[.+?\s+SKU:\s*(\d+)\]/g;
  while ((match = format3Regex.exec(content)) !== null) {
    if (match[1]) skus.add(match[1]);
  }
  return Array.from(skus);
}
const SAFE_PROTOCOLS = ["http:", "https:"];
function defaultBase() {
  return typeof window !== "undefined" && window.location ? window.location.origin : void 0;
}
function sanitizeUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.origin + url.pathname;
  } catch {
    return raw;
  }
}
function isSafeNavigationUrl(url, base = defaultBase()) {
  if (!url || typeof url !== "string") return false;
  try {
    const resolved = url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : new URL(url, base);
    return SAFE_PROTOCOLS.includes(resolved.protocol);
  } catch {
    return false;
  }
}
function safeHref(url, base = defaultBase()) {
  if (!url) return void 0;
  return isSafeNavigationUrl(url, base) ? url : void 0;
}
let captured = null;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
function capturePageContext() {
  if (captured) return captured;
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    captured = { referrer: "", user_agent: "" };
    return captured;
  }
  const ctx = {
    referrer: sanitizeUrl(document.referrer),
    user_agent: navigator.userAgent || ""
  };
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        ctx[key] = value;
      }
    }
  } catch {
  }
  captured = ctx;
  return captured;
}
function getPageContext$1() {
  return captured ?? capturePageContext();
}
const REGISTRY_KEY = "__omniguideSessions";
function conversationStorageKey(websiteId) {
  return `omniguide_conversation_id_${websiteId}`;
}
function readLocalStorage(key) {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function writeLocalStorage(key, value) {
  try {
    if (typeof window === "undefined") return;
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
  }
}
function getRegistry() {
  if (typeof window === "undefined") return {};
  const win = window;
  if (!win[REGISTRY_KEY]) {
    win[REGISTRY_KEY] = {};
  }
  return win[REGISTRY_KEY];
}
function ensureEntry(websiteId) {
  const registry = getRegistry();
  if (!registry[websiteId]) {
    const storedConversationId = readLocalStorage(conversationStorageKey(websiteId));
    registry[websiteId] = {
      sessionId: null,
      conversationId: storedConversationId,
      sessionStart: null,
      featureStatus: null
    };
  }
  return registry[websiteId];
}
function getSessionId(websiteId) {
  return ensureEntry(websiteId).sessionId;
}
function setSessionId(websiteId, sessionId) {
  ensureEntry(websiteId).sessionId = sessionId;
}
function getConversationId(websiteId) {
  return ensureEntry(websiteId).conversationId;
}
function setConversationId(websiteId, conversationId) {
  ensureEntry(websiteId).conversationId = conversationId;
  writeLocalStorage(conversationStorageKey(websiteId), conversationId);
}
function getSessionStart(websiteId) {
  return ensureEntry(websiteId).sessionStart;
}
function setSessionStart(websiteId, start) {
  ensureEntry(websiteId).sessionStart = start;
}
const featureStatusSubscribers = /* @__PURE__ */ new Map();
function getFeatureStatus(websiteId) {
  return ensureEntry(websiteId).featureStatus;
}
function setFeatureStatus(websiteId, status) {
  ensureEntry(websiteId).featureStatus = status;
  const subs = featureStatusSubscribers.get(websiteId);
  if (subs) {
    subs.forEach((cb) => cb(status));
  }
}
function onFeatureStatusChange(websiteId, callback) {
  if (!featureStatusSubscribers.has(websiteId)) {
    featureStatusSubscribers.set(websiteId, /* @__PURE__ */ new Set());
  }
  const subs = featureStatusSubscribers.get(websiteId);
  subs.add(callback);
  return () => {
    subs.delete(callback);
    if (subs.size === 0) {
      featureStatusSubscribers.delete(websiteId);
    }
  };
}
const log$c = createScopedLogger("ConsentService");
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
  if (!entry) return null;
  const eqIndex = entry.indexOf("=");
  return eqIndex === -1 ? null : entry.substring(eqIndex + 1);
}
function defaultGetConsentScopes(cookieName) {
  try {
    const raw = readCookie(cookieName);
    if (!raw) {
      return { analytics: false, advertising: false };
    }
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    const custom = parsed && parsed.custom || {};
    return {
      analytics: !!custom.marketingAndAnalytics,
      advertising: !!custom.advertising
    };
  } catch {
    return { analytics: false, advertising: false };
  }
}
let sharedOmniguideConsent = true;
class ConsentService {
  constructor(config) {
    this.initialized = false;
    this._websiteConsent = false;
    this.lastScopeJson = null;
    this.lastCanSendAnalytics = null;
    this.watcherStarted = false;
    this.watcherIntervalId = null;
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "");
    this.cookieName = config.cookieName ?? "tracking-preferences";
    this.getConsentScopes = config.getConsentScopes ?? (() => defaultGetConsentScopes(this.cookieName));
    this.readTiers();
  }
  /** Compute effective consent scopes from the two-tier model. */
  getEffectiveScopes() {
    const effective = this._websiteConsent && sharedOmniguideConsent;
    return { analytics: effective, advertising: effective };
  }
  dispatchChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("consent-state-changed"));
    }
  }
  async sendScopeToServer(sessionId, scope) {
    const url = `${this.apiBaseUrl}${API_ENDPOINTS.CONSENT}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        scope
      })
    });
    return res.ok;
  }
  /** Read website consent from cookie. Omniguide consent is in-memory only. */
  readTiers() {
    const websiteScopes = this.getConsentScopes();
    this._websiteConsent = websiteScopes.analytics || websiteScopes.advertising;
  }
  /**
   * Initialize consent by reading website cookie + localStorage, then sync with server.
   * No-op if already initialized or no sessionId.
   */
  async ensureInitialized(sessionId) {
    if (this.initialized || !sessionId) return;
    this.readTiers();
    const scope = this.getEffectiveScopes();
    this.lastScopeJson = JSON.stringify(scope);
    try {
      const ok = await this.sendScopeToServer(sessionId, scope);
      if (!ok) {
        log$c.warn("Consent server returned non-200 — keeping cookie-derived consent");
      }
    } catch (e) {
      log$c.warn("Consent server unreachable — keeping cookie-derived consent:", e);
    }
    this.initialized = true;
    this.dispatchChange();
  }
  /**
   * Re-read consent from cookie + localStorage and sync with server if changed.
   */
  async refresh(sessionId) {
    if (!sessionId) return;
    this.readTiers();
    const scope = this.getEffectiveScopes();
    const scopeJson = JSON.stringify(scope);
    if (scopeJson !== this.lastScopeJson) {
      this.lastScopeJson = scopeJson;
      try {
        const ok = await this.sendScopeToServer(sessionId, scope);
        if (!ok) {
          log$c.warn("Consent refresh server returned non-200 — keeping cookie-derived consent");
        }
      } catch (e) {
        log$c.warn("Consent refresh server unreachable — keeping cookie-derived consent:", e);
      }
    }
    this.initialized = true;
    this.dispatchChange();
  }
  /**
   * Start periodic consent watcher that detects website cookie changes.
   */
  startWatcher(sessionId, intervalMs = 36e5) {
    if (this.watcherStarted || !sessionId) return;
    this.watcherStarted = true;
    this.watcherIntervalId = setInterval(async () => {
      await this.refresh(sessionId);
    }, intervalMs);
  }
  /**
   * Stop the periodic consent watcher.
   */
  stopWatcher() {
    if (this.watcherIntervalId) {
      clearInterval(this.watcherIntervalId);
      this.watcherIntervalId = null;
    }
    this.watcherStarted = false;
  }
  /**
   * Whether analytics events can be sent (effective consent).
   *
   * Consent comes from cookie + localStorage, both read synchronously in the
   * constructor via readTiers(). `initialized` only indicates that the consent
   * state has been synced to the server — it is NOT a precondition for sending
   * events. Gating on it caused click-driven events to drop when each
   * integration's ConsentService server-sync was still in flight at click time
   * (one ConsentService instance per OmniguideProvider).
   */
  canSendAnalytics() {
    const can = this._websiteConsent && sharedOmniguideConsent;
    if (can !== this.lastCanSendAnalytics) {
      this.lastCanSendAnalytics = can;
      if (!can) {
        log$c.debug(`canSendAnalytics=false (websiteConsent=${this._websiteConsent}, omniguideConsent=${sharedOmniguideConsent})`);
      }
    }
    return can;
  }
  /**
   * Whether advertising events can be sent (effective consent).
   */
  canSendAdvertising() {
    return this._websiteConsent && sharedOmniguideConsent;
  }
  /**
   * Re-read consent tiers into memory (no server call).
   */
  syncFromCookie() {
    this.readTiers();
  }
  /**
   * Get current consent state.
   */
  getState() {
    const effective = this._websiteConsent && sharedOmniguideConsent;
    return {
      initialized: this.initialized,
      analytics: effective,
      advertising: effective,
      websiteConsent: this._websiteConsent,
      omniguideConsent: sharedOmniguideConsent
    };
  }
  /**
   * Update the Omniguide consent preference.
   * Updates in-memory state — NEVER touches the website cookie or any storage.
   */
  async updatePreferences(sessionId, enabled) {
    sharedOmniguideConsent = enabled;
    this.initialized = true;
    this.dispatchChange();
    if (sessionId) {
      const scope = this.getEffectiveScopes();
      this.lastScopeJson = JSON.stringify(scope);
      try {
        await this.sendScopeToServer(sessionId, scope);
      } catch {
      }
    }
  }
}
function createConsentService(config) {
  return new ConsentService(config);
}
const log$b = createScopedLogger("EventService");
const STORAGE_KEY = "omniguide_event_queue";
const MAX_AGE_MS = 24 * 60 * 60 * 1e3;
const KEEPALIVE_BODY_LIMIT = 56 * 1024;
class EventService {
  constructor(config) {
    this.queue = [];
    this.flushTimer = null;
    this.isFlushing = false;
    this.sessionId = null;
    this.conversationId = null;
    this.messageId = null;
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "");
    this.consentService = config.consentService;
    this.websiteId = config.websiteId ?? "";
    this.flushInterval = config.flushInterval ?? 5e3;
    this.batchSize = config.batchSize ?? 50;
    this.maxRetries = config.maxRetries ?? 3;
    this.maxQueueSize = config.maxQueueSize ?? 200;
    this.storefrontToken = config.storefrontToken;
    this.storeHash = config.storeHash;
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundPagehideHandler = this.handlePagehide.bind(this);
    this.loadQueue();
    this.startFlushTimer();
    this.setupUnloadHandlers();
  }
  // ── Public API ──────────────────────────────────────────────────
  /**
   * Queue a tracking event for backend delivery.
   * Events are batched and flushed periodically, or via beacon on page unload.
   */
  track(eventName, data = {}) {
    const eventData = {
      event: eventName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...data
    };
    if (this.messageId) {
      eventData["message_id"] = eventData["message_id"] ?? this.messageId;
    }
    this.queue.push({
      data: eventData,
      attempts: 0,
      added_at: Date.now()
    });
    if (this.queue.length > this.maxQueueSize) {
      const removed = this.queue.splice(0, this.queue.length - this.maxQueueSize);
      log$b.warn(`Queue exceeded max size, dropped ${removed.length} oldest events`);
    }
    this.saveQueue();
    this.scheduleMicrotaskKick();
  }
  // Click-driven events race navigation. Periodic flush (every flushInterval)
  // and setTimeout-based debounces fire too late — the browser starts
  // navigation right after the click handler returns, before any macrotask.
  //
  // Microtasks run between the end of the current task and the next macrotask
  // (and before navigation default-actions are dispatched). Initiating the
  // fetch in a microtask means the request is on the wire by the time the
  // browser tears the page down. `keepalive: true` (in sendBatch) keeps it
  // alive past unload.
  //
  // Bails when consent isn't initialized yet or canSendAnalytics is false —
  // the event is already persisted in localStorage and the periodic flush
  // (or the next page's EventService.loadQueue) will pick it up.
  scheduleMicrotaskKick() {
    queueMicrotask(() => {
      this.tryKick();
    });
  }
  tryKick() {
    if (this.queue.length === 0 || this.isFlushing) return;
    if (!this.sessionId) return;
    if (!this.consentService.canSendAnalytics()) return;
    this.isFlushing = true;
    const batch = this.queue.splice(0, this.batchSize);
    this.saveQueue();
    const eventDataToSend = batch.map((e) => e.data);
    this.sendBatch(eventDataToSend).then(() => {
      this.isFlushing = false;
    }).catch((error) => {
      log$b.warn("Kick fetch failed, requeuing:", error);
      for (const queuedEvent of batch) {
        queuedEvent.attempts++;
        if (queuedEvent.attempts < this.maxRetries) {
          this.queue.push(queuedEvent);
        }
      }
      this.saveQueue();
      this.isFlushing = false;
    });
  }
  /**
   * Update session context. Call when conversation starts, session changes, etc.
   */
  updateContext(updates) {
    if (updates.sessionId !== void 0) this.sessionId = updates.sessionId;
    if (updates.conversationId !== void 0) this.conversationId = updates.conversationId;
    if (updates.messageId !== void 0) this.messageId = updates.messageId;
    if (updates.websiteId !== void 0) this.websiteId = updates.websiteId;
    if (updates.storefrontToken !== void 0) this.storefrontToken = updates.storefrontToken;
    if (updates.storeHash !== void 0) this.storeHash = updates.storeHash;
  }
  /**
   * Flush queued events to the backend.
   * Called automatically by the flush timer — can also be called manually.
   */
  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;
    if (!this.sessionId) {
      log$b.debug("Flush deferred: no sessionId yet");
      return;
    }
    this.isFlushing = true;
    const batch = this.queue.splice(0, this.batchSize);
    this.saveQueue();
    try {
      await this.consentService.ensureInitialized(this.sessionId);
      if (!this.consentService.canSendAnalytics()) {
        this.queue.unshift(...batch);
        this.saveQueue();
        return;
      }
      const eventDataToSend = batch.map((e) => e.data);
      await this.sendBatch(eventDataToSend);
    } catch (error) {
      log$b.error("Flush failed:", error);
      for (const queuedEvent of batch) {
        queuedEvent.attempts++;
        if (queuedEvent.attempts < this.maxRetries) {
          this.queue.push(queuedEvent);
        } else {
          log$b.error(`Event "${queuedEvent.data["event"]}" dropped after ${this.maxRetries} attempts`);
        }
      }
      this.saveQueue();
    } finally {
      this.isFlushing = false;
    }
  }
  /**
   * Send remaining events via navigator.sendBeacon (for page unload).
   * Returns true if the beacon was sent successfully.
   */
  sendBeacon() {
    if (this.queue.length === 0) return true;
    if (!this.sessionId || !this.consentService.canSendAnalytics()) {
      this.saveQueue();
      return false;
    }
    const eventDataToSend = this.queue.map((e) => e.data);
    const payload = JSON.stringify(this.buildPayload(eventDataToSend));
    const success = typeof navigator !== "undefined" && navigator.sendBeacon ? navigator.sendBeacon(
      this.getEventUrl(),
      new Blob([payload], { type: "application/json" })
    ) : false;
    if (success) {
      this.queue = [];
      this.saveQueue();
    }
    return success;
  }
  /**
   * Legacy method — send events immediately (no queueing).
   * Kept for backward compatibility with existing callers.
   */
  async sendEvents(params) {
    const { events, sessionId, websiteId, conversationId, storefrontToken, storeHash } = params;
    if (!sessionId || !events || events.length === 0) return;
    try {
      await this.consentService.ensureInitialized(sessionId);
      if (!this.consentService.canSendAnalytics()) return;
      const url = this.getEventUrl();
      const currentPage = getCurrentPage();
      const headers = {
        "Content-Type": "application/json"
      };
      if (storefrontToken) {
        headers["X-Storefront-Token"] = storefrontToken;
      }
      if (storeHash) {
        headers["X-Storefront-Hash"] = storeHash;
      }
      await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          website_code: websiteId,
          events,
          current_page: currentPage,
          ...conversationId && { conversation_id: conversationId },
          page_context: getPageContext$1()
        })
      });
    } catch (error) {
      log$b.error("Failed to send event batch:", error);
    }
  }
  /**
   * Clean up timers and listeners. Call when the service is no longer needed.
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.removeUnloadHandlers();
    this.sendBeacon();
  }
  /**
   * Get current queue length (for testing / debugging).
   */
  getQueueLength() {
    return this.queue.length;
  }
  // ── Private ─────────────────────────────────────────────────────
  getEventUrl() {
    return `${this.apiBaseUrl}${API_ENDPOINTS.EVENT}`;
  }
  buildPayload(events) {
    return {
      session_id: this.sessionId,
      website_code: this.websiteId,
      conversation_id: this.conversationId,
      message_id: this.messageId,
      current_page: getCurrentPage(),
      events,
      page_context: getPageContext$1()
    };
  }
  async sendBatch(events) {
    const url = this.getEventUrl();
    const payload = this.buildPayload(events);
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.storefrontToken) {
      headers["X-Storefront-Token"] = this.storefrontToken;
    }
    if (this.storeHash) {
      headers["X-Storefront-Hash"] = this.storeHash;
    }
    const body = JSON.stringify(payload);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      keepalive: body.length <= KEEPALIVE_BODY_LIMIT
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }
  loadQueue() {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const valid = parsed.filter((e) => Date.now() - e.added_at < MAX_AGE_MS);
      if (valid.length > 0) {
        this.queue.push(...valid);
        log$b.debug(`Loaded ${valid.length} event(s) from storage`);
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }
  saveQueue() {
    if (typeof localStorage === "undefined") return;
    try {
      if (this.queue.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch {
    }
  }
  startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  handleVisibilityChange() {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      this.sendBeacon();
    }
  }
  handlePagehide() {
    this.sendBeacon();
  }
  setupUnloadHandlers() {
    if (typeof window === "undefined") return;
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.boundVisibilityHandler);
    }
    window.addEventListener("pagehide", this.boundPagehideHandler);
  }
  removeUnloadHandlers() {
    if (typeof window === "undefined") return;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    }
    window.removeEventListener("pagehide", this.boundPagehideHandler);
  }
}
function createEventService(config) {
  return new EventService(config);
}
const log$a = createScopedLogger("directGraphQL");
const PRODUCT_BATCH_SIZE = 20;
const CATEGORY_BATCH_SIZE = 8;
const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    entityId
    sku
    name
    path
    defaultImage {
      url640wide: url(width: 640)
      altText
    }
    prices {
      price { value }
      retailPrice { value }
    }
    brand {
      name
    }
  }
`;
const CATEGORY_FRAGMENT = `
  fragment CategoryFields on Category {
    entityId
    name
    path
    description
    defaultImage {
      url640wide: url(width: 640)
    }
  }
`;
async function postGraphQL(query, options) {
  var _a;
  const endpoint = options.endpoint ?? "/graphql";
  const token = options.getToken();
  if (!token) {
    log$a.warn("no storefront token; direct GraphQL request skipped");
    return null;
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      log$a.warn("direct GraphQL HTTP", response.status, endpoint);
      return null;
    }
    const json = await response.json();
    if ((_a = json.errors) == null ? void 0 : _a.length) {
      log$a.warn("direct GraphQL errors", json.errors.map((e) => e.message));
    }
    return json;
  } catch (error) {
    log$a.warn("direct GraphQL request failed", endpoint, error);
    return null;
  }
}
function escapeGraphQLString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function buildProductsQuery(skus) {
  const aliases = skus.map((sku, i) => `sku_${i}: product(sku: "${escapeGraphQLString(sku)}") { ...ProductFields }`).join("\n");
  return `query ProductsBySkus { site { ${aliases} } } ${PRODUCT_FRAGMENT}`;
}
function buildCategoriesQuery(ids) {
  const aliases = ids.map((id, i) => `cat_${i}: category(entityId: ${id}) { ...CategoryFields }`).join("\n");
  return `query CategoriesByIds { site { ${aliases} } } ${CATEGORY_FRAGMENT}`;
}
function transformProductNode(node) {
  var _a, _b, _c, _d, _e, _f, _g;
  const path = node.path;
  const priceValue = (_b = (_a = node.prices) == null ? void 0 : _a.price) == null ? void 0 : _b.value;
  const retailValue = (_d = (_c = node.prices) == null ? void 0 : _c.retailPrice) == null ? void 0 : _d.value;
  const price = priceValue !== void 0 || retailValue !== void 0 ? {
    ...priceValue !== void 0 ? { value: priceValue } : {},
    ...retailValue !== void 0 ? { retailPrice: { value: retailValue } } : {}
  } : void 0;
  return {
    entityId: node.entityId,
    sku: node.sku,
    name: node.name,
    path,
    url: path,
    price,
    imageUrl: (_e = node.defaultImage) == null ? void 0 : _e.url640wide,
    imageAlt: (_f = node.defaultImage) == null ? void 0 : _f.altText,
    brand: (_g = node.brand) == null ? void 0 : _g.name
  };
}
function transformCategoryNode(node) {
  var _a;
  return {
    entityId: node.entityId,
    name: node.name,
    path: node.path,
    description: node.description,
    defaultImage: ((_a = node.defaultImage) == null ? void 0 : _a.url640wide) || ""
  };
}
async function fetchProductsDirectGraphQL(skus, options) {
  var _a;
  if (!skus || skus.length === 0) return [];
  const unique = Array.from(new Set(skus));
  const out = [];
  for (let start = 0; start < unique.length; start += PRODUCT_BATCH_SIZE) {
    const batch = unique.slice(start, start + PRODUCT_BATCH_SIZE);
    const query = buildProductsQuery(batch);
    const result = await postGraphQL(query, options);
    const site = ((_a = result == null ? void 0 : result.data) == null ? void 0 : _a.site) ?? {};
    for (let i = 0; i < batch.length; i++) {
      const node = site[`sku_${i}`];
      if (node) out.push(transformProductNode(node));
    }
  }
  return out;
}
async function fetchCategoriesDirectGraphQL(ids, options) {
  var _a;
  if (!ids || ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const out = [];
  for (let start = 0; start < unique.length; start += CATEGORY_BATCH_SIZE) {
    const batch = unique.slice(start, start + CATEGORY_BATCH_SIZE);
    const query = buildCategoriesQuery(batch);
    const result = await postGraphQL(query, options);
    const site = ((_a = result == null ? void 0 : result.data) == null ? void 0 : _a.site) ?? {};
    for (let i = 0; i < batch.length; i++) {
      const node = site[`cat_${i}`];
      if (node) out.push(transformCategoryNode(node));
    }
  }
  return out;
}
const log$9 = createScopedLogger("BigCommerceAdapter");
const PRODUCT_HYDRATE_KEYS$1 = [
  "entityId",
  "name",
  "display_name",
  "product_line",
  "sku",
  "path",
  "url",
  "price",
  "imageUrl",
  "brandId",
  "brand"
];
const CATEGORY_HYDRATE_KEYS$1 = [
  "entityId",
  "name",
  "path",
  "url",
  "imageUrl",
  "description"
];
function mergeEntityData$1(original, fetched, hydrateKeys) {
  if (!fetched) return original;
  const merged = { ...original };
  for (const key of hydrateKeys) {
    const originalValue = merged[key];
    const fetchedValue = fetched[key];
    const isOriginalEmpty = originalValue === null || originalValue === void 0 || typeof originalValue === "string" && originalValue.trim() === "" || typeof originalValue === "object" && Object.keys(originalValue).length === 0;
    if (isOriginalEmpty && fetchedValue !== void 0 && fetchedValue !== null) {
      merged[key] = fetchedValue;
    }
  }
  return merged;
}
function createBigCommerceAdapter(config) {
  var _a;
  const productEndpoint = config.productHydrationEndpoint ?? "/bc-search-products";
  const categoryEndpoint = config.categoryHydrationEndpoint ?? "/bc-search-categories";
  const getEffectiveApiBaseUrl = () => getPreviewApiUrl() ?? config.apiBaseUrl;
  const getGraphQLToken = () => {
    var _a2;
    if (typeof window === "undefined") return null;
    return window.graphQLToken ?? ((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken) ?? null;
  };
  const directGraphQLOptions = ((_a = config.directGraphQL) == null ? void 0 : _a.enabled) ? {
    endpoint: config.directGraphQL.endpoint,
    getToken: config.directGraphQL.getToken ?? getGraphQLToken
  } : null;
  const adapter = createPlatformAdapter({
    getPlatformName: () => "bigcommerce",
    isInitialized: () => {
      var _a2;
      if (typeof window === "undefined") return false;
      return !!((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken);
    },
    getCredentials: () => {
      var _a2, _b;
      return {
        storefrontToken: typeof window !== "undefined" ? ((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken) ?? null : null,
        storeHash: typeof window !== "undefined" ? ((_b = window.storeConfig) == null ? void 0 : _b.storeHash) ?? null : null,
        graphQLToken: getGraphQLToken()
      };
    },
    getProductSku: () => {
      var _a2, _b;
      if (typeof window === "undefined") return null;
      try {
        return ((_b = (_a2 = window.BCData) == null ? void 0 : _a2.product_attributes) == null ? void 0 : _b.sku) ?? null;
      } catch (e) {
        log$9.warn("Failed to get product SKU from BCData:", e);
        return null;
      }
    },
    hydrateProducts: async (products) => {
      if (!products || products.length === 0) {
        return [];
      }
      const skusToFetch = products.map((p) => p.sku).filter((sku) => !!sku);
      if (skusToFetch.length === 0) {
        return products;
      }
      let fetchedProducts = [];
      if (directGraphQLOptions) {
        try {
          fetchedProducts = await fetchProductsDirectGraphQL(skusToFetch, directGraphQLOptions);
        } catch (error) {
          log$9.error("Direct GraphQL product hydration failed:", error);
          return products;
        }
      } else {
        const graphqlToken = getGraphQLToken();
        try {
          const headers = {
            "Content-Type": "application/json"
          };
          if (graphqlToken) {
            headers["X-Storefront-Token"] = graphqlToken;
          }
          const response = await fetch(`${getEffectiveApiBaseUrl()}${productEndpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              skus: skusToFetch,
              website_code: config.websiteId,
              graphql_token: graphqlToken
            })
          });
          if (!response.ok) {
            log$9.error("Product hydration failed:", response.status);
            return products;
          }
          const data = await response.json();
          fetchedProducts = (data == null ? void 0 : data.products) ?? [];
        } catch (error) {
          log$9.error("Failed to hydrate products:", error);
          return products;
        }
      }
      const fetchedMap = /* @__PURE__ */ new Map();
      for (const product of fetchedProducts) {
        if (product.sku) {
          fetchedMap.set(product.sku, product);
        }
      }
      return products.map((original) => {
        const fetched = original.sku ? fetchedMap.get(original.sku) : void 0;
        return mergeEntityData$1(original, fetched, PRODUCT_HYDRATE_KEYS$1);
      });
    },
    hydrateCategories: async (categories) => {
      if (!categories || categories.length === 0) {
        return [];
      }
      const categoryIds = categories.map((c) => {
        const id = c.entityId ?? c.id;
        return typeof id === "string" ? parseInt(id, 10) : id;
      }).filter((id) => !!id && !isNaN(id));
      if (categoryIds.length === 0) {
        return categories;
      }
      let fetchedCategories = [];
      if (directGraphQLOptions) {
        try {
          fetchedCategories = await fetchCategoriesDirectGraphQL(categoryIds, directGraphQLOptions);
        } catch (error) {
          log$9.error("Direct GraphQL category hydration failed:", error);
          return categories;
        }
      } else {
        const graphqlToken = getGraphQLToken();
        try {
          const headers = {
            "Content-Type": "application/json"
          };
          if (graphqlToken) {
            headers["X-Storefront-Token"] = graphqlToken;
          }
          const response = await fetch(`${getEffectiveApiBaseUrl()}${categoryEndpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              category_ids: categoryIds,
              website_code: config.websiteId,
              graphql_token: graphqlToken
            })
          });
          if (!response.ok) {
            log$9.error("Category hydration failed:", response.status);
            return categories;
          }
          const data = await response.json();
          fetchedCategories = (data == null ? void 0 : data.categories) ?? [];
        } catch (error) {
          log$9.error("Failed to hydrate categories:", error);
          return categories;
        }
      }
      const fetchedMap = /* @__PURE__ */ new Map();
      for (const category of fetchedCategories) {
        if (category.entityId) {
          fetchedMap.set(category.entityId, category);
        }
      }
      return categories.map((original) => {
        const id = original.entityId ?? original.id;
        const numericId = typeof id === "string" ? parseInt(id, 10) : id;
        const fetched = numericId ? fetchedMap.get(numericId) : void 0;
        return mergeEntityData$1(original, fetched, CATEGORY_HYDRATE_KEYS$1);
      });
    }
  });
  return adapter;
}
const CheckIcon$1 = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const DiscoveryOptionButton = memo(function DiscoveryOptionButton2({ answer, isSelected, onSelect }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `omniguide-pr-option-pill ${isSelected ? "omniguide-pr-option-pill--selected" : ""}`,
      onClick: () => onSelect(answer),
      "aria-pressed": isSelected
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-option-pill__checkbox" }, /* @__PURE__ */ React.createElement("div", { className: `omniguide-pr-option-pill__checkbox-inner ${isSelected ? "omniguide-pr-option-pill__checkbox-inner--selected" : ""}` }, isSelected && /* @__PURE__ */ React.createElement(CheckIcon$1, null))),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-option-pill__text" }, answer.text)
  );
});
const STAR_PATH_D = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
const StarIcon = ({ filled, half }) => {
  if (half) {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: "omniguide-pr-star-rating__icon omniguide-pr-star-rating__icon--half",
        viewBox: "0 0 20 20",
        "aria-hidden": "true"
      },
      /* @__PURE__ */ React.createElement("path", { className: "omniguide-pr-star-rating__icon-bg", d: STAR_PATH_D }),
      /* @__PURE__ */ React.createElement("path", { className: "omniguide-pr-star-rating__icon-fill-half", d: STAR_PATH_D })
    );
  }
  const className = `omniguide-pr-star-rating__icon ${filled ? "omniguide-pr-star-rating__icon--filled" : "omniguide-pr-star-rating__icon--empty"}`;
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className,
      viewBox: "0 0 20 20",
      fill: "currentColor",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ React.createElement("path", { d: STAR_PATH_D })
  );
};
const DiscoveryStarRating = memo(function DiscoveryStarRating2({
  rating = 0,
  maxStars = 5,
  reviewCount = 0
}) {
  const stars = [];
  const normalizedRating = Math.min(Math.max(rating, 0), maxStars);
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(normalizedRating)) {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, filled: true }));
    } else if (i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.25) {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, half: true }));
    } else {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, filled: false }));
    }
  }
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-star-rating" }, stars, reviewCount > 0 && ` (${reviewCount})`);
});
const ChevronIcon = ({ isExpanded }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "16",
    height: "16",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    style: {
      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease"
    }
  },
  /* @__PURE__ */ React.createElement(
    "path",
    {
      fillRule: "evenodd",
      d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
      clipRule: "evenodd"
    }
  )
);
const ReviewInsightsToggle = memo(function ReviewInsightsToggle2({
  rating = 0,
  reviewCount = 0,
  summary,
  likes,
  className,
  productName,
  productSku,
  onToggle
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasInsights = summary || likes && likes.length > 0;
  const handleToggle = (e) => {
    e.stopPropagation();
    const action = isExpanded ? "collapse" : "expand";
    onToggle == null ? void 0 : onToggle({ productName, productSku, action });
    setIsExpanded(!isExpanded);
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-pr-review-insights ${className || ""}` }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__rating-row" }, /* @__PURE__ */ React.createElement(DiscoveryStarRating, { rating, reviewCount }), hasInsights && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleToggle,
      className: "omniguide-pr-review-insights__chevron-btn",
      "aria-label": isExpanded ? "Hide review insights" : "Show review insights",
      "aria-expanded": isExpanded
    },
    /* @__PURE__ */ React.createElement(ChevronIcon, { isExpanded })
  )), isExpanded && hasInsights && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__panel" }, summary && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__section" }, /* @__PURE__ */ React.createElement("h5", { className: "omniguide-pr-review-insights__title" }, "Customers Say"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-review-insights__summary" }, summary)), likes && likes.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__section" }, /* @__PURE__ */ React.createElement("h5", { className: "omniguide-pr-review-insights__title" }, "Customers Like"), /* @__PURE__ */ React.createElement("ul", { className: "omniguide-pr-review-insights__likes-list" }, likes.map((like) => /* @__PURE__ */ React.createElement("li", { key: like, className: "omniguide-pr-review-insights__like-item" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-review-insights__like-bullet" }, "•"), /* @__PURE__ */ React.createElement("span", null, like)))))));
});
function filterChoices(choices, query, max) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return choices.slice(0, max);
  const matches = [];
  for (const choice of choices) {
    if (choice.value.toLowerCase().includes(trimmed)) {
      matches.push(choice);
      if (matches.length >= max) break;
    }
  }
  return matches;
}
function SearchIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "7", cy: "7", r: "4.6" }), /* @__PURE__ */ React.createElement("path", { d: "M11 11l3.6 3.6", strokeLinecap: "round" }));
}
function ClearIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 3l8 8M11 3l-8 8" }));
}
function CheckIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3.5 8.5l3 3 6-7" }));
}
function InlineFilterPills({
  questionId,
  choices,
  onSelectChoice,
  selectedValue,
  topCount,
  maxResults,
  placeholder,
  filterLabel,
  ariaLabel
}) {
  const [query, setQuery] = useState("");
  const inputId = `omniguide-cfq-filter-${questionId}`;
  const hasHiddenChoices = choices.length > topCount;
  useEffect(() => {
    setQuery("");
  }, [questionId]);
  const isFiltering = query.trim().length > 0;
  const topPicks = useMemo(() => choices.slice(0, topCount), [choices, topCount]);
  const matches = useMemo(
    () => isFiltering ? filterChoices(choices, query, maxResults) : [],
    [choices, query, isFiltering, maxResults]
  );
  const searchPlaceholder = placeholder ?? `Search ${choices.length} options…`;
  const resultsId = `${inputId}-results`;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__popular" }, hasHiddenChoices && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__popular-label" }, "Popular"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-pr-questionnaire__choices omniguide-pr-cfq__choices",
      role: "radiogroup",
      "aria-label": ariaLabel ?? "Popular options"
    },
    topPicks.map((choice) => /* @__PURE__ */ React.createElement(
      DiscoveryOptionButton,
      {
        key: choice.id,
        answer: { id: choice.id, text: choice.value },
        isSelected: selectedValue === choice.value,
        onSelect: () => onSelectChoice(choice)
      }
    ))
  )), hasHiddenChoices && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__bar" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__field" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__field-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchIcon, null)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: inputId,
      type: "text",
      className: "omniguide-pr-cfq__filter-input",
      value: query,
      onChange: (e) => setQuery(e.target.value),
      placeholder: searchPlaceholder,
      autoComplete: "off",
      role: "combobox",
      "aria-expanded": isFiltering,
      "aria-controls": resultsId,
      "aria-label": filterLabel
    }
  ), isFiltering && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-cfq__clear",
      "aria-label": "Clear search",
      onClick: () => setQuery("")
    },
    /* @__PURE__ */ React.createElement(ClearIcon, null)
  )), isFiltering && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__meta", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__count" }, matches.length, " of ", choices.length))), isFiltering && (matches.length > 0 ? /* @__PURE__ */ React.createElement(
    "div",
    {
      id: resultsId,
      className: "omniguide-pr-cfq__grid",
      role: "group",
      "aria-label": ariaLabel ?? "Filtered options"
    },
    matches.map((choice) => {
      const current = selectedValue === choice.value;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: choice.id,
          type: "button",
          className: current ? "omniguide-pr-cfq__opt omniguide-pr-cfq__opt--current" : "omniguide-pr-cfq__opt",
          "aria-pressed": current,
          onClick: () => onSelectChoice(choice)
        },
        /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__opt-name" }, choice.value),
        current && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__opt-check", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(CheckIcon, null))
      );
    })
  ) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__empty", role: "status" }, "No options match “", query.trim(), "”"))));
}
function SearchableDropdown({
  questionId,
  choices,
  onSelectChoice,
  selectedValue,
  maxResults,
  placeholder,
  ariaLabel
}) {
  const [query, setQuery] = useState(selectedValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listboxId = `omniguide-autocomplete-listbox-${questionId}`;
  useEffect(() => {
    setQuery(selectedValue ?? "");
    setIsOpen(false);
    setHighlightedIndex(0);
  }, [questionId, selectedValue]);
  const results = useMemo(
    () => filterChoices(choices, query, maxResults),
    [choices, query, maxResults]
  );
  useEffect(() => {
    setHighlightedIndex((i) => i >= results.length ? 0 : i);
  }, [results.length]);
  const showList = isOpen && results.length > 0;
  const handleSelect = (choice) => {
    setQuery(choice.value);
    setIsOpen(false);
    onSelectChoice(choice);
  };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = results[highlightedIndex];
      if (choice) handleSelect(choice);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-autocomplete omniguide-pr-autocomplete--searchable-dropdown" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "omniguide-pr-autocomplete__input",
      value: query,
      onChange: (e) => {
        setQuery(e.target.value);
        setIsOpen(true);
        setHighlightedIndex(0);
      },
      onFocus: () => setIsOpen(true),
      onKeyDown: handleKeyDown,
      placeholder,
      role: "combobox",
      "aria-label": ariaLabel,
      "aria-expanded": showList,
      "aria-controls": listboxId,
      "aria-autocomplete": "list",
      "aria-activedescendant": showList && results[highlightedIndex] ? `${listboxId}-option-${results[highlightedIndex].id}` : void 0
    }
  ), showList && /* @__PURE__ */ React.createElement("ul", { id: listboxId, role: "listbox", className: "omniguide-pr-autocomplete__list" }, results.map((choice, index) => /* @__PURE__ */ React.createElement(
    "li",
    {
      key: choice.id,
      id: `${listboxId}-option-${choice.id}`,
      role: "option",
      "aria-selected": index === highlightedIndex,
      className: index === highlightedIndex ? "omniguide-pr-autocomplete__option omniguide-pr-autocomplete__option--highlighted" : "omniguide-pr-autocomplete__option",
      onMouseDown: (e) => e.preventDefault(),
      onClick: () => handleSelect(choice),
      onMouseEnter: () => setHighlightedIndex(index)
    },
    choice.value
  ))), isOpen && query.trim() && results.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-autocomplete__no-results", role: "status" }, "No matches"));
}
function DiscoveryAutocomplete({
  questionId,
  choices,
  onSelectChoice,
  selectedValue = null,
  topCount = 5,
  maxResults = 12,
  placeholder,
  filterLabel = "Or filter it down here",
  ariaLabel,
  renderHint = "autocomplete"
}) {
  if (renderHint === "searchable_dropdown") {
    return /* @__PURE__ */ React.createElement(
      SearchableDropdown,
      {
        questionId,
        choices,
        onSelectChoice,
        selectedValue,
        maxResults,
        placeholder: placeholder ?? "Filter options…",
        ariaLabel
      }
    );
  }
  return /* @__PURE__ */ React.createElement(
    InlineFilterPills,
    {
      questionId,
      choices,
      onSelectChoice,
      selectedValue,
      topCount,
      maxResults,
      placeholder,
      filterLabel,
      ariaLabel
    }
  );
}
const ThumbsUpIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M8 26H5C3.89543 26 3 25.1046 3 24V15C3 13.8954 3.89543 13 5 13H8M17 11V6C17 3.79086 15.2091 2 13 2L8 13V26H21.3933C22.8612 26 24.1395 25.0042 24.499 23.5794L25.9557 17.5794C26.4454 15.6269 25.0293 13.6884 23.0267 13.5114L17 11Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const ThumbsDownIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M8 2H5C3.89543 2 3 2.89543 3 4V13C3 14.1046 3.89543 15 5 15H8M17 17V22C17 24.2091 15.2091 26 13 26L8 15V2H21.3933C22.8612 2 24.1395 2.99584 24.499 4.42059L25.9557 10.4206C26.4454 12.3731 25.0293 14.3116 23.0267 14.4886L17 17Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const CheckmarkIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M16.6667 5L7.50004 14.1667L3.33337 10",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const ErrorIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 6V10",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 14H10.01",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
function DiscoveryFeedbackWidget({
  entityId,
  entityType,
  context = {},
  className = "",
  onSubmit,
  onSuccess,
  onError,
  disabled = false
}) {
  const [phase, setPhase] = useState("initial");
  const [voteDirection, setVoteDirection] = useState(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleVote = (vote) => {
    if (disabled || isSubmitting) return;
    setVoteDirection(vote);
    setPhase("expanded");
    setErrorMessage("");
  };
  const handleSubmit = async () => {
    if (disabled || isSubmitting || !voteDirection) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onSubmit({
        entity_id: entityId,
        entity_type: entityType,
        vote: voteDirection,
        comment: comment.trim(),
        context
      });
      setPhase("success");
      setIsSubmitting(false);
      onSuccess == null ? void 0 : onSuccess();
      setTimeout(() => {
        setPhase("initial");
        setVoteDirection(null);
        setComment("");
      }, 3e3);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to submit feedback");
      setErrorMessage(err.message || "Failed to submit feedback");
      setPhase("error");
      setIsSubmitting(false);
      onError == null ? void 0 : onError(err);
    }
  };
  const handleRetry = () => {
    setPhase("expanded");
    setErrorMessage("");
  };
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };
  if (phase === "initial") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback ${className}`, role: "group", "aria-label": "Feedback options" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__question", id: "feedback-question" }, "Was this helpful?"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__buttons", role: "group", "aria-labelledby": "feedback-question" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__button omniguide-feedback__button--up",
        onClick: () => handleVote(1),
        disabled,
        "aria-label": "Yes, this was helpful"
      },
      /* @__PURE__ */ React.createElement(ThumbsUpIcon, null)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__button omniguide-feedback__button--down",
        onClick: () => handleVote(-1),
        disabled,
        "aria-label": "No, this was not helpful"
      },
      /* @__PURE__ */ React.createElement(ThumbsDownIcon, null)
    )));
  }
  if (phase === "expanded") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--expanded ${className}` }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__form" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "omniguide-feedback__textarea",
        placeholder: "Tell us why (optional)",
        value: comment,
        onChange: handleCommentChange,
        maxLength: 500,
        rows: 4,
        disabled: isSubmitting,
        "aria-label": "Feedback text input (optional)"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__submit",
        onClick: handleSubmit,
        disabled: isSubmitting,
        "aria-busy": isSubmitting
      },
      isSubmitting ? "Submitting..." : "Submit Feedback"
    )));
  }
  if (phase === "success") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--success ${className}`, role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__success" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__success-icon" }, /* @__PURE__ */ React.createElement(CheckmarkIcon, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__success-text" }, "Thank you for your feedback!")));
  }
  if (phase === "error") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--error ${className}`, role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__error" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__error-icon" }, /* @__PURE__ */ React.createElement(ErrorIcon, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__error-text" }, errorMessage)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__retry",
        onClick: handleRetry
      },
      "Try Again"
    ));
  }
  return null;
}
/*! @license DOMPurify 3.4.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.0/LICENSE */
const {
  entries,
  setPrototypeOf,
  isFrozen,
  getPrototypeOf,
  getOwnPropertyDescriptor
} = Object;
let {
  freeze,
  seal,
  create
} = Object;
let {
  apply,
  construct
} = typeof Reflect !== "undefined" && Reflect;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone(object) {
  const newObject = create(null);
  for (const [property, value] of entries(object)) {
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (Array.isArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
const html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
const svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
const svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
const svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
const mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
const mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
const text = freeze(["#text"]);
const html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]);
const svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
const mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
const xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
const IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR,
  ATTR_WHITESPACE,
  CUSTOM_ELEMENT,
  DATA_ATTR,
  DOCTYPE_NAME,
  ERB_EXPR,
  IS_ALLOWED_URI,
  IS_SCRIPT_OR_DATA,
  MUSTACHE_EXPR,
  TMPLIT_EXPR
});
const NODE_TYPE = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
};
const getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
const _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.4.0";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let {
    document: document2
  } = window2;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  const {
    DocumentFragment,
    HTMLTemplateElement,
    Node,
    Element,
    NodeFilter,
    NamedNodeMap = window2.NamedNodeMap || window2.MozNamedAttrMap,
    HTMLFormElement,
    DOMParser,
    trustedTypes
  } = window2;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  const {
    implementation,
    createNodeIterator,
    createDocumentFragment,
    getElementsByTagName
  } = document2;
  const {
    importNode
  } = originalDocument;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: MUSTACHE_EXPR2,
    ERB_EXPR: ERB_EXPR2,
    TMPLIT_EXPR: TMPLIT_EXPR2,
    DATA_ATTR: DATA_ATTR2,
    ARIA_ATTR: ARIA_ATTR2,
    IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA2,
    ATTR_WHITESPACE: ATTR_WHITESPACE2,
    CUSTOM_ELEMENT: CUSTOM_ELEMENT2
  } = EXPRESSIONS;
  let {
    IS_ALLOWED_URI: IS_ALLOWED_URI$1
  } = EXPRESSIONS;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ["mi", "mo", "mn", "ms", "mtext"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
    ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
    DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
    FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
    FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
    FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || create(null);
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
    }
    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
    }
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = create(null);
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    EXTRA_ELEMENT_HANDLING.tagCheck = null;
    EXTRA_ELEMENT_HANDLING.attributeCheck = null;
    if (cfg.ADD_TAGS) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (cfg.ADD_ATTR) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (cfg.ADD_URI_SAFE_ATTR) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (cfg.FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (cfg.ADD_FORBID_CONTENTS) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      emptyHTML = trustedTypesPolicy.createHTML("");
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      }
      if (trustedTypesPolicy !== null && typeof emptyHTML === "string") {
        emptyHTML = trustedTypesPolicy.createHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "svg";
      }
      if (parent.namespaceURI === MATHML_NAMESPACE) {
        return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
      }
      return Boolean(ALL_SVG_TAGS[tagName]);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      if (parent.namespaceURI === HTML_NAMESPACE) {
        return tagName === "math";
      }
      if (parent.namespaceURI === SVG_NAMESPACE) {
        return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
      }
      return Boolean(ALL_MATHML_TAGS[tagName]);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
        return false;
      }
      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _isClobbered = function _isClobbered2(element) {
    return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
  };
  const _isNode = function _isNode2(value) {
    return typeof Node === "function" && value instanceof Node;
  };
  function _executeHooks(hooks2, currentNode, data) {
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    let content = null;
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
      _forceRemove(currentNode);
      return true;
    }
    if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
          return false;
        }
        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
          return false;
        }
      }
      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
        if (childNodes && parentNode) {
          const childCount = childNodes.length;
          for (let i = childCount - 1; i >= 0; --i) {
            const childClone = cloneNode(childNodes[i], true);
            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
            parentNode.insertBefore(childClone, getNextSibling(currentNode));
          }
        }
      }
      _forceRemove(currentNode);
      return true;
    }
    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      content = currentNode.textContent;
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        content = stringReplace(content, expr, " ");
      });
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (FORBID_ATTR[lcName]) {
      return false;
    }
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR2, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR2, lcName)) ;
    else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ;
    else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA2, stringReplace(value, ATTR_WHITESPACE2, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return tagName !== "annotation-xml" && stringMatch(tagName, CUSTOM_ELEMENT2);
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const {
      attributes
    } = currentNode;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    while (l--) {
      const attr = attributes[l];
      const {
        name,
        namespaceURI,
        value: attrValue
      } = attr;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name")) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          value = stringReplace(value, expr, " ");
        });
      }
      const lcTag = transformCaseFunc(currentNode.nodeName);
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") {
        if (namespaceURI) ;
        else {
          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
            case "TrustedHTML": {
              value = trustedTypesPolicy.createHTML(value);
              break;
            }
            case "TrustedScriptURL": {
              value = trustedTypesPolicy.createScriptURL(value);
              break;
            }
          }
        }
      }
      if (value !== initValue) {
        try {
          if (namespaceURI) {
            currentNode.setAttributeNS(namespaceURI, name, value);
          } else {
            currentNode.setAttribute(name, value);
          }
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
          } else {
            arrayPop(DOMPurify.removed);
          }
        } catch (_) {
          _removeAttribute(name, currentNode);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (shadowNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      if (typeof dirty.toString === "function") {
        dirty = dirty.toString();
        if (typeof dirty !== "string") {
          throw typeErrorCreate("dirty is not a string, aborting");
        }
      } else {
        throw typeErrorCreate("toString is not a function");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (!SET_CONFIG) {
      _parseConfig(cfg);
    }
    DOMPurify.removed = [];
    if (typeof dirty === "string") {
      IN_PLACE = false;
    }
    if (IN_PLACE) {
      if (dirty.nodeName) {
        const tagName = transformCaseFunc(dirty.nodeName);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
    } else if (dirty instanceof Node) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
    while (currentNode = nodeIterator.nextNode()) {
      _sanitizeElements(currentNode);
      _sanitizeAttributes(currentNode);
      if (currentNode.content instanceof DocumentFragment) {
        _sanitizeShadowDOM2(currentNode.content);
      }
    }
    if (IN_PLACE) {
      return dirty;
    }
    if (RETURN_DOM) {
      if (SAFE_FOR_TEMPLATES) {
        body.normalize();
        let html2 = body.innerHTML;
        arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
          html2 = stringReplace(html2, expr, " ");
        });
        body.innerHTML = html2;
      }
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      arrayForEach([MUSTACHE_EXPR2, ERB_EXPR2, TMPLIT_EXPR2], (expr) => {
        serializedHTML = stringReplace(serializedHTML, expr, " ");
      });
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
  };
  DOMPurify.isValidAttribute = function(tag, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();
const DEFAULT_LINK_COLOR = "#FF4C00";
const SAFE_SKU_PATTERN = /^[\w.-]+$/;
function skuAttr(sku) {
  return sku && SAFE_SKU_PATTERN.test(sku) ? ` data-omniguide-sku="${sku}"` : "";
}
function parseMarkdown(content, options = {}) {
  if (!content) return content;
  const linkColor = options.linkColor ?? DEFAULT_LINK_COLOR;
  const shouldSanitize = options.sanitize !== false;
  const productUrls = options.productUrls ?? {};
  const productNames = options.productNames ?? {};
  const requireCorrectUrls = options.requireCorrectUrls ?? false;
  const skuByUrl = {};
  const ambiguousUrls = /* @__PURE__ */ new Set();
  for (const [sku, url] of Object.entries(productUrls)) {
    if (!url) continue;
    if (ambiguousUrls.has(url)) continue;
    if (url in skuByUrl) {
      delete skuByUrl[url];
      ambiguousUrls.add(url);
      continue;
    }
    skuByUrl[url] = String(sku);
  }
  let result = content;
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, originalUrl) => {
    if (originalUrl.startsWith("sku=")) {
      return match;
    }
    const skuMatch = linkText.match(/\(SKU:\s*(\d+)\)|SKU:\s*(\d+)/i);
    if (skuMatch) {
      const sku = skuMatch[1] ?? skuMatch[2] ?? "";
      const correctUrl = productUrls[String(sku)] ?? productUrls[sku];
      const cleanName = linkText.replace(/\s*\(SKU:\s*\d+\)/i, "").replace(/\s*SKU:\s*\d+/i, "").trim();
      const displayName = productNames[String(sku)] ?? productNames[sku] ?? cleanName;
      const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
      const finalUrl = correctUrl ?? originalUrl;
      if (requireCorrectUrls && !correctUrl) {
        const pendingStyle = `color: ${linkColor}; font-weight: 500; opacity: 0.7;`;
        return `<span style="${pendingStyle}">${displayName}</span>`;
      }
      return `<a href="${finalUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
    }
    return match;
  });
  result = result.replace(/\[product\s+sku=['"]([^'"]+)['"]\]([^[]+)\[\/product\]/g, (_match, sku, productName) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[([^\]]+)\]\(sku=['"]([^'"]+)['"]\)/g, (_match, productName, sku) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[(.+?)\s+SKU:\s*(\d+)\]/g, (_match, productName, sku) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[product[^\]]*\]([^[]*)\[\/product\]/gi, "$1");
  result = result.replace(/\[([^\]]+)\]\((?!sku=)([^)]+)\)/g, (_match, text2, url) => {
    const invalidPathPattern = /^\/(URL|url|undefined|null|#|about:)/i;
    if (invalidPathPattern.test(url)) {
      return `<strong>${text2}</strong>`;
    }
    const linkStyle = `color: ${linkColor}; text-decoration: underline;`;
    return `<a href="${url}"${skuAttr(skuByUrl[url])} style="${linkStyle}">${text2}</a>`;
  });
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  result = result.replace(/`([^`]+)`/g, '<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
  const UL_STYLE = "margin: 8px 0; padding-left: 20px;";
  const OL_STYLE = "margin: 8px 0; padding-left: 24px;";
  const lines = result.split("\n");
  const blocks = [];
  let root = null;
  let sub = null;
  let paraBuf = [];
  const renderList = (list) => {
    const style = list.tag === "ul" ? UL_STYLE : OL_STYLE;
    const items = list.items.map((it) => `<li>${it}</li>`).join("");
    return `<${list.tag} style="${style}">${items}</${list.tag}>`;
  };
  const flushSub = () => {
    if (!sub || !root || root.items.length === 0) {
      sub = null;
      return;
    }
    const lastIdx = root.items.length - 1;
    root.items[lastIdx] = root.items[lastIdx] + renderList(sub);
    sub = null;
  };
  const flushRoot = () => {
    flushSub();
    if (!root) return;
    blocks.push(renderList(root));
    root = null;
  };
  const flushPara = () => {
    if (paraBuf.length === 0) return;
    blocks.push(`<p>${paraBuf.join("<br>")}</p>`);
    paraBuf = [];
  };
  const appendItem = (tag, content2) => {
    if (!root) {
      root = { tag, items: [content2] };
      return;
    }
    if (sub) {
      if (sub.tag === tag) {
        sub.items.push(content2);
      } else {
        flushSub();
        root.items.push(content2);
      }
      return;
    }
    if (root.tag === tag) {
      root.items.push(content2);
    } else {
      sub = { tag, items: [content2] };
    }
  };
  for (const rawLine of lines) {
    const ulMatch = rawLine.match(/^\s*[-*]\s+(.+)$/);
    const olMatch = rawLine.match(/^\s*\d+\.\s+(.+)$/);
    const isBlank = rawLine.trim() === "";
    if (ulMatch) {
      flushPara();
      appendItem("ul", ulMatch[1]);
    } else if (olMatch) {
      flushPara();
      appendItem("ol", olMatch[1]);
    } else if (isBlank) {
      flushPara();
    } else {
      flushRoot();
      paraBuf.push(rawLine);
    }
  }
  flushPara();
  flushRoot();
  result = blocks.join("");
  result = result.replace(new RegExp("(?<!\\w)\\*([^*]+)\\*(?!\\w)", "g"), "<em>$1</em>");
  result = result.replace(new RegExp("(?<!\\w)_([^_]+)_(?!\\w)", "g"), "<em>$1</em>");
  if (shouldSanitize) {
    result = purify.sanitize(result, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "code"],
      ALLOWED_ATTR: ["href", "target", "rel", "style", "data-omniguide-sku"]
    });
  }
  return result;
}
function parseMarkdownToHtml(content, options = {}) {
  const html2 = parseMarkdown(content, options);
  return { __html: html2 || "" };
}
const BANNER_ID = "omniguide-preview-banner";
function PreviewBanner() {
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef(null);
  const previewUrl = getPreviewApiUrl();
  let displayHost = previewUrl ?? "";
  try {
    displayHost = new URL(previewUrl).hostname;
  } catch {
  }
  const isDuplicate = typeof document !== "undefined" && document.getElementById(BANNER_ID) !== null && document.getElementById(BANNER_ID) !== bannerRef.current;
  useLayoutEffect(() => {
    if (dismissed || isDuplicate || !bannerRef.current) {
      document.body.style.paddingTop = "";
      return;
    }
    const height = bannerRef.current.getBoundingClientRect().height;
    document.body.style.paddingTop = `${height}px`;
    return () => {
      document.body.style.paddingTop = "";
    };
  }, [dismissed, isDuplicate]);
  if (dismissed || isDuplicate) return null;
  const handleDeactivate = () => {
    clearPreviewApiUrl();
    window.location.reload();
  };
  const handleDismiss = () => {
    setDismissed(true);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      id: BANNER_ID,
      ref: bannerRef,
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "8px 40px 8px 16px",
        backgroundColor: "#f59e0b",
        color: "#000",
        fontSize: "13px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "PREVIEW MODE: ", displayHost),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDeactivate,
        style: {
          padding: "3px 10px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: "#000",
          color: "#f59e0b",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }
      },
      "Deactivate"
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDismiss,
        "aria-label": "Dismiss preview banner",
        style: {
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          padding: "0",
          width: "20px",
          height: "20px",
          lineHeight: "20px",
          fontSize: "16px",
          fontWeight: 700,
          backgroundColor: "transparent",
          color: "#000",
          border: "none",
          cursor: "pointer",
          opacity: 0.6
        }
      },
      "✕"
    )
  );
}
const defaultContextValue = {
  config: {
    websiteId: "",
    apiBaseUrl: "",
    aiSearchStoreUrl: "",
    features: {
      search: false,
      productFit: false,
      categoryGuide: false,
      discoveryQuestions: false
    }
  },
  platformAdapter: NullPlatformAdapter,
  storageAdapter: new LocalStorageAdapter(),
  isInitialized: false,
  components: {}
};
const OmniguideContext = createContext(defaultContextValue);
function useOmniguideContext() {
  const context = useContext(OmniguideContext);
  if (!context.isInitialized) {
    logger.warn("useOmniguideContext called outside of OmniguideProvider or provider not initialized");
  }
  return context;
}
function OmniguideProvider({
  config,
  platformAdapter,
  storageAdapter,
  components,
  children
}) {
  const contextValue = useMemo(() => {
    capturePageContext();
    const previewUrl = getPreviewApiUrl();
    const effectiveConfig = previewUrl ? { ...config, apiBaseUrl: previewUrl } : config;
    const adapter = platformAdapter ?? NullPlatformAdapter;
    const storage = storageAdapter ?? new LocalStorageAdapter();
    if (platformAdapter) {
      platformRegistry.register(platformAdapter);
    }
    const consentService = effectiveConfig.apiBaseUrl ? createConsentService({ apiBaseUrl: effectiveConfig.apiBaseUrl }) : void 0;
    const eventService = consentService && effectiveConfig.apiBaseUrl ? createEventService({
      apiBaseUrl: effectiveConfig.apiBaseUrl,
      consentService,
      websiteId: effectiveConfig.websiteId
    }) : void 0;
    const feedbackApi = effectiveConfig.apiBaseUrl ? createFeedbackAPI({
      apiBaseUrl: effectiveConfig.apiBaseUrl,
      websiteCode: effectiveConfig.websiteId,
      getSessionId: () => {
        var _a;
        return getSessionId(effectiveConfig.websiteId) ?? storage.getItem(((_a = effectiveConfig.storageKeys) == null ? void 0 : _a.sessionId) ?? "aiSearchSessionId");
      }
    }) : void 0;
    return {
      config: effectiveConfig,
      platformAdapter: adapter,
      storageAdapter: storage,
      isInitialized: true,
      feedbackApi,
      consentService,
      eventService,
      components: components ?? {}
    };
  }, [config, platformAdapter, storageAdapter, components]);
  const showPreviewBanner = isPreviewMode();
  return /* @__PURE__ */ React.createElement(OmniguideContext.Provider, { value: contextValue }, showPreviewBanner && /* @__PURE__ */ React.createElement(PreviewBanner, null), children);
}
function useComponent(key, DefaultComponent) {
  const { components } = useOmniguideContext();
  return components[key] ?? DefaultComponent;
}
const SearchCheckIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const SearchChevronDownIcon = ({ expanded }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `omniguide-privacy__caret ${expanded ? "omniguide-privacy__caret--expanded" : ""}`,
    "aria-hidden": "true",
    focusable: "false"
  },
  /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })
);
const SearchMagnifierIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 20 20", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "9", r: "6.4" }), /* @__PURE__ */ React.createElement("path", { d: "M14 14l4 4" }));
const SearchSparkIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: "14", height: "14", fill: "currentColor", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M8 0l1.6 5.4L15 7l-5.4 1.6L8 14l-1.6-5.4L1 7l5.4-1.6z" }));
const SearchArrowIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 14 14", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M3 7h8M7.5 3.5L11 7l-3.5 3.5" }));
const SearchCollapseToggleIcon = ({ isCollapsed }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    style: { transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" },
    "aria-hidden": "true",
    focusable: "false"
  },
  /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z", clipRule: "evenodd" })
);
const SearchThinkingIndicator = () => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "omniguide-qa",
    role: "status",
    "aria-live": "polite",
    "aria-label": "Loading response, please wait"
  },
  /* @__PURE__ */ React.createElement("div", { className: "omniguide-thinking-dots", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" })),
  /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading response...")
);
const statusConfig = {
  thinking: {
    texts: [
      "Analyzing your question...",
      "Understanding your needs...",
      "Processing your request..."
    ]
  },
  searching: {
    texts: [
      "Searching products...",
      "Exploring our catalog...",
      "Finding relevant options..."
    ]
  },
  generating: {
    texts: [
      "Writing response...",
      "Crafting your answer...",
      "Preparing recommendations..."
    ]
  },
  product_recommendation: {
    texts: [
      "And now, describing that perfect product...",
      "Highlighting key features...",
      "Explaining why this fits..."
    ]
  },
  selecting_products: {
    texts: [
      "Finding the right product...",
      "Evaluating options...",
      "Comparing features..."
    ]
  },
  finalizing: {
    texts: [
      "Finalizing...",
      "Wrapping up...",
      "Almost done..."
    ]
  },
  awaiting_clarification: {
    texts: [
      "Waiting for your response...",
      "Ready for your input...",
      "Standing by..."
    ]
  },
  error: {
    texts: [
      "An error occurred",
      "Something went wrong",
      "Unable to complete"
    ]
  }
};
const SearchPipelineStatusIndicator = ({ status }) => {
  const [variationIndex, setVariationIndex] = useState(0);
  const statusStartTimeRef = useRef(null);
  const currentStatusRef = useRef(null);
  useEffect(() => {
    if (currentStatusRef.current !== status) {
      currentStatusRef.current = status;
      statusStartTimeRef.current = Date.now();
      setVariationIndex(0);
    }
  }, [status]);
  useEffect(() => {
    if (!status) return;
    const config2 = statusConfig[status];
    if (!config2 || config2.texts.length <= 1) return;
    const interval = setInterval(() => {
      setVariationIndex((prev) => (prev + 1) % config2.texts.length);
    }, 2e3);
    return () => clearInterval(interval);
  }, [status]);
  if (!status || status === "idle" || status === "done") return null;
  const config = statusConfig[status] || { texts: ["Processing..."] };
  const currentText = config.texts[variationIndex] || config.texts[0];
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-pipeline-status",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      "aria-label": currentText
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pipeline-status__text" }, currentText)
  );
};
const QUESTION_WORDS = ["what", "which", "how", "why", "can", "does", "do", "is", "are", "should", "when", "where", "who", "will", "whats", "what's"];
const ADVISORY_RE = /\b(best|vs|versus|difference|compare|recommend|help me|better|ideal|suitable|which|good for)\b/;
function detectQuestion(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return false;
  if (s.endsWith("?")) return true;
  const words = s.split(/\s+/);
  if (QUESTION_WORDS.includes(words[0] ?? "")) return true;
  if (ADVISORY_RE.test(s)) return true;
  return words.length >= 6;
}
const SearchQueryRow = ({ text: text2, onClick }) => {
  const isQuestion = detectQuestion(text2);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      onKeyDown: handleKeyDown,
      className: `omniguide-query-row ${isQuestion ? "omniguide-query-row--question" : ""}`,
      "aria-label": isQuestion ? `Ask: ${text2}` : `Search: ${text2}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__icon", "aria-hidden": "true" }, isQuestion ? /* @__PURE__ */ React.createElement(SearchSparkIcon, null) : /* @__PURE__ */ React.createElement(SearchMagnifierIcon, null)),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__text" }, text2),
    isQuestion && /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__tag" }, "Ask"),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__arrow", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchArrowIcon, null))
  );
};
const SearchGradientChip = ({ text: text2, onClick, isSelected = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onKeyDown: handleKeyDown,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      className: "omniguide-chip--gradient",
      "data-hovered": isHovered,
      "data-selected": isSelected,
      "data-focused": isFocused,
      "aria-label": `Ask: ${text2}`,
      "aria-pressed": isSelected
    },
    /* @__PURE__ */ React.createElement("span", { className: `omniguide-chip__inner ${isSelected ? "omniguide-chip__inner--selected" : ""}` }, isSelected && /* @__PURE__ */ React.createElement(SearchCheckIcon, null), text2)
  );
};
const SearchCategoryChip = ({ text: text2, onClick, isSelected = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onKeyDown: handleKeyDown,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      className: "omniguide-chip--category",
      "data-hovered": isHovered,
      "data-selected": isSelected,
      "data-focused": isFocused,
      "aria-label": `Ask: ${text2}`,
      "aria-pressed": isSelected
    },
    isSelected && /* @__PURE__ */ React.createElement(SearchCheckIcon, null),
    text2
  );
};
const SearchSuggestionChips = ({
  suggestions,
  onSuggestionClick,
  selectedSuggestions = [],
  variant = "search"
}) => {
  if (!suggestions || suggestions.length === 0) return null;
  const ChipComponent = variant === "category" ? SearchCategoryChip : SearchGradientChip;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-chips",
      role: "group",
      "aria-label": "Suggested questions"
    },
    suggestions.map((suggestion) => /* @__PURE__ */ React.createElement(
      ChipComponent,
      {
        key: suggestion,
        text: suggestion,
        onClick: () => onSuggestionClick(suggestion),
        isSelected: selectedSuggestions.includes(suggestion)
      }
    ))
  );
};
const SearchNavigationButtons = memo(({
  canGoUp,
  canGoDown,
  onNavigateUp,
  onNavigateDown,
  currentIndex,
  totalCount,
  timestamp,
  isMobile = false
}) => {
  if (totalCount <= 1) return null;
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) : "";
  const handleNavKeyDown = (e, direction) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (direction === "up") {
        onNavigateUp(e);
      } else if (direction === "down") {
        onNavigateDown(e);
      }
    }
  };
  const handleUpClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onNavigateUp(e);
  };
  const handleDownClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onNavigateDown(e);
  };
  if (isMobile) {
    return /* @__PURE__ */ React.createElement(
      "nav",
      {
        className: "omniguide-chat__navigation omniguide-chat__navigation--mobile",
        role: "navigation",
        "aria-label": "Message navigation"
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-buttons", role: "group", "aria-label": "Navigate between messages" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleUpClick,
          className: "omniguide-chat__nav-btn",
          "data-disabled": !canGoUp,
          "aria-disabled": !canGoUp,
          "aria-label": `Previous message (${currentIndex} of ${totalCount})`
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "18 15 12 9 6 15" }))
      ), /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__nav-indicator", "aria-live": "polite" }, currentIndex + 1, " / ", totalCount), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleDownClick,
          className: "omniguide-chat__nav-btn",
          "data-disabled": !canGoDown,
          "aria-disabled": !canGoDown,
          "aria-label": `Next message (${currentIndex + 2} of ${totalCount})`
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      ))
    );
  }
  return /* @__PURE__ */ React.createElement(
    "nav",
    {
      className: "omniguide-chat__navigation",
      role: "navigation",
      "aria-label": "Message navigation"
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-buttons", role: "group", "aria-label": "Navigate between messages" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleUpClick,
        onKeyDown: (e) => handleNavKeyDown(e, "up"),
        className: "omniguide-chat__nav-btn",
        "data-disabled": !canGoUp,
        "aria-disabled": !canGoUp,
        "aria-label": `Previous message (${currentIndex} of ${totalCount})`
      },
      /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "18 15 12 9 6 15" }))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDownClick,
        onKeyDown: (e) => handleNavKeyDown(e, "down"),
        className: "omniguide-chat__nav-btn",
        "data-disabled": !canGoDown,
        "aria-disabled": !canGoDown,
        "aria-label": `Next message (${currentIndex + 2} of ${totalCount})`
      },
      /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
    )),
    formattedTime && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-timestamp", "aria-live": "polite" }, formattedTime)
  );
});
const UNSELECTED$1 = Symbol("unselected");
const SearchIntentQuestionUI = ({
  intentQuestion,
  onAnswerClick,
  onCustomAnswer,
  variant = "search"
}) => {
  var _a, _b;
  const [customInput, setCustomInput] = useState("");
  const [selectedAnswerId, setSelectedAnswerId] = useState(UNSELECTED$1);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [hoveredId, setHoveredId] = useState(UNSELECTED$1);
  if (!intentQuestion) return null;
  const isDiscoveryQuestion = intentQuestion._isDiscoveryQuestion;
  const hasOtherOption = (_a = intentQuestion.answers) == null ? void 0 : _a.some((a) => a.is_other_option);
  const isGuide = variant === "search";
  const questionText = intentQuestion.question_text || intentQuestion.question;
  const renderHint = intentQuestion.answer_render_hint ?? "choice";
  const choices = intentQuestion.answer_choices ?? [];
  const useChoiceRenderer = renderHint !== "choice" && choices.length > 0;
  const handleSelectChoice = (choice) => {
    setSelectedAnswerId(choice.id);
    onAnswerClick(choice.value, choice.id, { isOtherAnswer: false });
  };
  const handleAnswerClick = (answer) => {
    const answerText = answer.answer_text || answer.answer || "";
    if (answer.is_other_option) {
      setSelectedAnswerId(answer.id);
      setShowOtherInput(true);
      return;
    }
    setSelectedAnswerId(answer.id);
    setShowOtherInput(false);
    if (isDiscoveryQuestion) {
      onAnswerClick(answerText, answer.id, {
        isOtherAnswer: false
      });
    } else {
      onAnswerClick(answerText, answer.id);
    }
  };
  const handleOtherClick = () => {
    setSelectedAnswerId("other");
    setShowOtherInput(true);
  };
  const handleCustomSubmit = (e) => {
    var _a2;
    e.preventDefault();
    if (customInput.trim()) {
      if (isDiscoveryQuestion) {
        const otherAnswer = (_a2 = intentQuestion.answers) == null ? void 0 : _a2.find((a) => a.is_other_option);
        if (otherAnswer) {
          onAnswerClick(customInput.trim(), otherAnswer.id, {
            isOtherAnswer: true,
            otherAnswerText: customInput.trim()
          });
        } else {
          onCustomAnswer(customInput.trim());
        }
      } else {
        onCustomAnswer(customInput.trim());
      }
      setCustomInput("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-intent-question ${isGuide ? "omniguide-intent-question--guide" : ""}` }, isGuide && /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-question__eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-intent-question__mark", "aria-hidden": "true" }), "To narrow this down"), isGuide && questionText && /* @__PURE__ */ React.createElement("p", { className: "omniguide-intent-question__text" }, questionText), useChoiceRenderer ? /* @__PURE__ */ React.createElement(
    DiscoveryAutocomplete,
    {
      questionId: String(intentQuestion.question_id ?? intentQuestion.id ?? ""),
      choices,
      onSelectChoice: handleSelectChoice,
      selectedValue: ((_b = choices.find((c) => c.id === selectedAnswerId)) == null ? void 0 : _b.value) ?? null,
      ariaLabel: questionText,
      renderHint: renderHint === "searchable_dropdown" ? "searchable_dropdown" : "autocomplete"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-answers" }, intentQuestion.answers.map((answer) => {
    const isSelected = selectedAnswerId === answer.id;
    const displayText = answer.is_other_option ? "Other" : answer.answer_text || answer.answer;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: answer.id,
        onClick: () => handleAnswerClick(answer),
        className: "omniguide-intent-answer-btn",
        "data-selected": isSelected,
        "data-hovered": hoveredId === answer.id,
        onMouseEnter: () => setHoveredId(answer.id),
        onMouseLeave: () => setHoveredId(UNSELECTED$1),
        title: answer.explanation || ""
      },
      displayText
    );
  }), !hasOtherOption && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleOtherClick,
      className: "omniguide-intent-answer-btn",
      "data-selected": selectedAnswerId === "other",
      "data-hovered": hoveredId === "other",
      onMouseEnter: () => setHoveredId("other"),
      onMouseLeave: () => setHoveredId(UNSELECTED$1)
    },
    "Other"
  )), !useChoiceRenderer && showOtherInput && /* @__PURE__ */ React.createElement("form", { onSubmit: handleCustomSubmit, className: "omniguide-intent-custom-form" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: customInput,
      onChange: (e) => setCustomInput(e.target.value),
      placeholder: "Type your answer...",
      className: "omniguide-intent-custom-input",
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !customInput.trim(),
      className: "omniguide-intent-custom-submit",
      "data-disabled": !customInput.trim()
    },
    "Send"
  )));
};
const UNSELECTED = Symbol("unselected");
const SearchClarificationQuestionUI = ({
  clarificationQuestion,
  onAnswerClick,
  onCustomAnswer,
  variant = "search"
}) => {
  const [customInput, setCustomInput] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState(UNSELECTED);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [hoveredId, setHoveredId] = useState(UNSELECTED);
  if (!clarificationQuestion) return null;
  const { message, param_name, options } = clarificationQuestion;
  const isGuide = variant === "search";
  const handleOptionClick = (optionLabel, optionId) => {
    setSelectedOptionId(optionId);
    setShowOtherInput(false);
    onAnswerClick(optionLabel, optionId, param_name);
  };
  const handleOtherClick = () => {
    setSelectedOptionId("other");
    setShowOtherInput(true);
  };
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCustomAnswer(customInput.trim());
      setCustomInput("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-intent-question ${isGuide ? "omniguide-intent-question--guide" : ""}` }, isGuide && /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-question__eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-intent-question__mark", "aria-hidden": "true" }), "To narrow this down"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-intent-question__text" }, message), /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-answers" }, options.map((option) => {
    const isSelected = selectedOptionId === option.id;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: option.id,
        onClick: () => handleOptionClick(option.label, option.id),
        className: "omniguide-intent-answer-btn",
        "data-selected": isSelected,
        "data-hovered": hoveredId === option.id,
        onMouseEnter: () => setHoveredId(option.id),
        onMouseLeave: () => setHoveredId(UNSELECTED),
        title: option.description || ""
      },
      option.label
    );
  }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleOtherClick,
      className: "omniguide-intent-answer-btn",
      "data-selected": selectedOptionId === "other",
      "data-hovered": hoveredId === "other",
      onMouseEnter: () => setHoveredId("other"),
      onMouseLeave: () => setHoveredId(UNSELECTED)
    },
    "Other"
  )), showOtherInput && /* @__PURE__ */ React.createElement("form", { onSubmit: handleCustomSubmit, className: "omniguide-intent-custom-form" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: customInput,
      onChange: (e) => setCustomInput(e.target.value),
      placeholder: "Type your answer...",
      className: "omniguide-intent-custom-input",
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !customInput.trim(),
      className: "omniguide-intent-custom-submit",
      "data-disabled": !customInput.trim()
    },
    "Send"
  )));
};
function useCountdown(reconnectInfo, active) {
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!reconnectInfo || !active) {
      setCountdown(null);
      return;
    }
    let remaining = Math.ceil(reconnectInfo.delayMs / 1e3);
    setCountdown(remaining);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        setCountdown(null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setCountdown(remaining);
      }
    }, 1e3);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reconnectInfo, active]);
  return countdown;
}
const SearchAnswerSkeleton = ({
  connectionLost = false,
  connectionStatus,
  reconnectInfo
}) => {
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  if (connectionLost && connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton omniguide-answer-skeleton--lost" }, /* @__PURE__ */ React.createElement("p", { className: "omniguide-answer-skeleton__lost-text" }, countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Reconnecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, ".")), " (", reconnectInfo.attempt, "/", reconnectInfo.maxAttempts, ")")));
  }
  if (connectionLost) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton omniguide-answer-skeleton--lost" }, /* @__PURE__ */ React.createElement("p", { className: "omniguide-answer-skeleton__lost-text" }, "Connection lost while waiting for a response."));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "100%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "85%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "65%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "40%" } }));
};
function isValidNavigationUrl(url, baseUrl = window.location.origin) {
  if (!url || typeof url !== "string") {
    return false;
  }
  try {
    const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : new URL(url, baseUrl).href;
    const parsed = new URL(fullUrl);
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function safeNavigate(url, baseUrl = window.location.origin, options = {}) {
  if (!isValidNavigationUrl(url, baseUrl)) {
    return false;
  }
  const { newTab = false, event } = options;
  const openInNewTab = newTab || (event == null ? void 0 : event.ctrlKey) || (event == null ? void 0 : event.metaKey);
  if (openInNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
  return true;
}
function buildSafeUrl(baseUrl, path, params = {}) {
  try {
    if (path && (path.startsWith("javascript:") || path.startsWith("data:") || path.startsWith("vbscript:"))) {
      return null;
    }
    const resolvedBase = (baseUrl || window.location.origin).replace(/\/+$/, "");
    const url = path && (path.startsWith("http://") || path.startsWith("https://")) ? new URL(path) : new URL(path || "", resolvedBase);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    if (!isValidNavigationUrl(url.href)) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
const SECTION_LABELS = {
  products: "Products",
  categories: "Categories",
  content: "Guides & Help",
  brands: "Brands"
};
const CONTENT_SNIPPET_MAX = 140;
function matchedTokensFor(highlights, field) {
  var _a;
  return ((_a = highlights == null ? void 0 : highlights.find((h) => h.field === field)) == null ? void 0 : _a.matched_tokens) ?? [];
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const HighlightedText = ({ highlights, field, value, className }) => {
  const tokens = matchedTokensFor(highlights, field).filter(
    (t) => typeof t === "string" && t.trim().length > 0
  );
  if (tokens.length === 0) {
    return /* @__PURE__ */ React.createElement("span", { className }, value);
  }
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  const parts = value.split(pattern);
  return /* @__PURE__ */ React.createElement("span", { className }, parts.map(
    (part, i) => i % 2 === 1 ? (
      // eslint-disable-next-line react/no-array-index-key -- positional split of one string; no stable id and order is fixed
      /* @__PURE__ */ React.createElement("mark", { key: i }, part)
    ) : (
      // eslint-disable-next-line react/no-array-index-key -- positional split of one string; no stable id and order is fixed
      /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, part)
    )
  ));
};
function truncate(text2, max) {
  if (text2.length <= max) return text2;
  return `${text2.slice(0, max).trimEnd()}…`;
}
const SearchTypeaheadSections = ({
  sections,
  idPrefix,
  activeId,
  onSelect,
  onHover
}) => {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-ta", role: "listbox", id: `${idPrefix}-listbox` }, TYPEAHEAD_SECTION_ORDER.map((sectionKey) => {
    const hits = sections[sectionKey].hits;
    if (hits.length === 0) return null;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: sectionKey,
        className: "omniguide-ta__section",
        role: "group",
        "aria-label": SECTION_LABELS[sectionKey]
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-ta__section-head", "aria-hidden": "true" }, SECTION_LABELS[sectionKey]),
      /* @__PURE__ */ React.createElement("ul", { className: "omniguide-ta__list" }, hits.map((hit, i) => {
        const optionId = `${idPrefix}-${sectionKey}-${i}`;
        const active = optionId === activeId;
        return /* @__PURE__ */ React.createElement(
          "li",
          {
            key: hit.id || optionId,
            id: optionId,
            role: "option",
            "aria-selected": active,
            className: `omniguide-ta__row omniguide-ta__row--${sectionKey}${active ? " omniguide-ta__row--active" : ""}`,
            onMouseDown: (e) => {
              e.preventDefault();
              onSelect(hit, sectionKey);
            },
            onMouseEnter: () => onHover == null ? void 0 : onHover(optionId)
          },
          renderRow(sectionKey, hit)
        );
      }))
    );
  }));
};
function renderRow(sectionKey, hit) {
  switch (sectionKey) {
    case "products":
      return /* @__PURE__ */ React.createElement(ProductRow, { hit });
    case "categories":
      return /* @__PURE__ */ React.createElement(CategoryRow, { hit });
    case "content":
      return /* @__PURE__ */ React.createElement(ContentRow, { hit });
    case "brands":
      return /* @__PURE__ */ React.createElement(BrandRow, { hit });
    default:
      return null;
  }
}
const ProductRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__thumb", "aria-hidden": "true" }, hit.image_url && isValidNavigationUrl(hit.image_url) ? /* @__PURE__ */ React.createElement("img", { src: hit.image_url, alt: "", loading: "lazy" }) : /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__thumb-fallback" })), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "title",
    value: hit.title
  }
), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__meta" }, hit.brand && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__brand" }, hit.brand), hit.brand && hit.sku && /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, " · "), hit.sku && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__sku" }, "SKU: ", hit.sku))), typeof hit.price === "number" && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__price" }, "$", hit.price.toFixed(2)));
const CategoryRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FolderGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "name",
    value: hit.name
  }
)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__count" }, hit.product_count, " items"));
const ContentRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(DocGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "title",
    value: hit.title
  }
), hit.snippet && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__snippet" }, truncate(hit.snippet, CONTENT_SNIPPET_MAX))));
const BrandRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(TagGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "name",
    value: hit.name
  }
)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__count" }, hit.product_count, " items"));
const FolderGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M1.5 4a1 1 0 0 1 1-1h3.2l1.2 1.4H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V4Z",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }
));
const DocGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M4 2h5l3 3v9H4V2Z", stroke: "currentColor", strokeWidth: "1.2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 2v3h3M6 8h4M6 10.5h4", stroke: "currentColor", strokeWidth: "1.2" }));
const TagGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M2.5 2.5h5l6 6-5 5-6-6v-5Z",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }
), /* @__PURE__ */ React.createElement("circle", { cx: "5", cy: "5", r: "1", fill: "currentColor" }));
const TYPEAHEAD_DEBOUNCE_MS = 120;
const TYPEAHEAD_MIN_QUERY_LENGTH = 2;
const TYPEAHEAD_DEFAULT_PER_PAGE = 8;
const EMPTY_SECTIONS = {
  products: { found: 0, hits: [] },
  categories: { found: 0, hits: [] },
  content: { found: 0, hits: [] },
  brands: { found: 0, hits: [] }
};
function normalizeSections(data) {
  if (!data || typeof data !== "object") return EMPTY_SECTIONS;
  const sections = data.sections;
  if (!sections || typeof sections !== "object") return EMPTY_SECTIONS;
  const obj = sections;
  const coerce = (v) => {
    if (!v || typeof v !== "object") return { found: 0, hits: [] };
    const sect = v;
    const hits = Array.isArray(sect.hits) ? sect.hits : [];
    const found = typeof sect.found === "number" ? sect.found : hits.length;
    return { found, hits };
  };
  return {
    products: coerce(obj["products"]),
    categories: coerce(obj["categories"]),
    content: coerce(obj["content"]),
    brands: coerce(obj["brands"])
  };
}
function isAllEmpty(s) {
  return s.products.hits.length === 0 && s.categories.hits.length === 0 && s.content.hits.length === 0 && s.brands.hits.length === 0;
}
function useTypeaheadSearch(options = {}) {
  const { config } = useOmniguideContext();
  const apiBaseUrl = config.apiBaseUrl;
  const websiteCode = config.websiteId;
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);
  const [hasResolvedEmpty, setHasResolvedEmpty] = useState(false);
  const nextIdRef = useRef(0);
  const lastRenderedIdRef = useRef(-1);
  const debounceTimerRef = useRef(null);
  const abortRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const clearTimer = () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };
  const clearResults = () => {
    setSections(EMPTY_SECTIONS);
    setIsQuestion(false);
    setHasResolvedEmpty(false);
  };
  const reset = useCallback(() => {
    var _a;
    clearTimer();
    (_a = abortRef.current) == null ? void 0 : _a.abort();
    abortRef.current = null;
    clearResults();
    setResolvedQuery("");
    setIsLoading(false);
  }, []);
  const fire = useCallback(
    async (query) => {
      var _a;
      if (!apiBaseUrl || !websiteCode) return;
      const myId = ++nextIdRef.current;
      (_a = abortRef.current) == null ? void 0 : _a.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      const result = await fetchTypeaheadSearch({
        apiBaseUrl,
        request: {
          website_code: websiteCode,
          query,
          per_page: optionsRef.current.perPage ?? TYPEAHEAD_DEFAULT_PER_PAGE,
          allow_oos: optionsRef.current.allowOos ?? false
        },
        origin: typeof window !== "undefined" ? sanitizeUrl(window.location.href) : void 0,
        signal: controller.signal
      });
      if (myId <= lastRenderedIdRef.current) return;
      if (result.kind === "aborted") {
        return;
      }
      lastRenderedIdRef.current = myId;
      setIsLoading(false);
      if (result.kind === "disabled") {
        setIsDisabled(true);
        clearResults();
        return;
      }
      if (result.kind === "error") {
        clearResults();
        return;
      }
      const data = result.data;
      setResolvedQuery(typeof (data == null ? void 0 : data.query) === "string" ? data.query : query);
      if (data == null ? void 0 : data.is_question) {
        setIsQuestion(true);
        setSections(EMPTY_SECTIONS);
        setHasResolvedEmpty(false);
        return;
      }
      const normalized = normalizeSections(data);
      setIsQuestion(false);
      setSections(normalized);
      setHasResolvedEmpty(isAllEmpty(normalized));
    },
    [apiBaseUrl, websiteCode]
  );
  const setQuery = useCallback(
    (rawQuery) => {
      var _a;
      if (isDisabled) return;
      clearTimer();
      const trimmed = rawQuery.trim();
      if (trimmed.length < TYPEAHEAD_MIN_QUERY_LENGTH) {
        (_a = abortRef.current) == null ? void 0 : _a.abort();
        abortRef.current = null;
        clearResults();
        setIsLoading(false);
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void fire(trimmed);
      }, TYPEAHEAD_DEBOUNCE_MS);
    },
    [fire, isDisabled]
  );
  useEffect(() => {
    return () => {
      var _a;
      clearTimer();
      (_a = abortRef.current) == null ? void 0 : _a.abort();
    };
  }, []);
  return {
    sections,
    resolvedQuery,
    isLoading,
    isDisabled,
    isQuestion,
    hasResolvedEmpty,
    setQuery,
    reset
  };
}
const CHAT_PROMPT_TEXT$1 = "Ask a question.";
const TYPEAHEAD_ID_PREFIX = "omniguide-ta";
const DEFAULT_CATEGORY_EXAMPLES = ["What are the best options?", "Compare products", "Help me choose"];
const SearchEmptyState = ({
  onExampleClick,
  isMobile,
  variant = "search",
  suggestedQuestions = [],
  seedQuestions = [],
  welcomeText = "",
  hideTitle = false,
  siteName,
  defaultSearchExamples,
  disabled = false,
  connectionStatus,
  reconnectInfo,
  liveQuery = "",
  typeahead = false,
  aiSearchStoreUrl,
  onSelectHit
}) => {
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  const isCategory = variant === "category";
  const askTarget = siteName && siteName.trim() ? `ask ${siteName.trim()}` : "ask";
  const ta = useTypeaheadSearch();
  const taSetQuery = ta.setQuery;
  const typeaheadActive = typeahead && !isCategory && !ta.isDisabled;
  const [activeHitId, setActiveHitId] = useState(null);
  useEffect(() => {
    if (!typeaheadActive) return;
    taSetQuery(liveQuery);
    setActiveHitId(null);
  }, [typeaheadActive, liveQuery, taSetQuery]);
  const handleSelectHit = (hit, sectionKey) => {
    if (onSelectHit) {
      onSelectHit(hit, sectionKey);
      return;
    }
    if ("url" in hit && hit.url) {
      const base = aiSearchStoreUrl || (typeof document !== "undefined" ? document.baseURI : void 0);
      const target = buildSafeUrl(base, hit.url) ?? hit.url;
      safeNavigate(target);
    }
  };
  const examples = isCategory ? suggestedQuestions.length > 0 ? suggestedQuestions.slice(0, 3) : DEFAULT_CATEGORY_EXAMPLES : seedQuestions.length > 0 ? seedQuestions.slice(0, 6) : defaultSearchExamples || DEFAULT_CATEGORY_EXAMPLES;
  const connectionNotice = isConnectionDisabled && /* @__PURE__ */ React.createElement("p", { className: "omniguide-chat__connection-notice" }, connectionStatus === "disconnected" ? "Unable to connect to the assistant." : connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2 ? countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : `Reconnecting... (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Connecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."))));
  if (!isCategory) {
    const trimmedQuery = liveQuery.trim();
    const typed = trimmedQuery.length > 0;
    const isQuestion = typeaheadActive ? ta.isQuestion : detectQuestion(liveQuery);
    const taHasHits = typeaheadActive && (ta.sections.products.hits.length > 0 || ta.sections.categories.hits.length > 0 || ta.sections.content.hits.length > 0 || ta.sections.brands.hits.length > 0);
    const taNoMatches = typeaheadActive && typed && !isQuestion && ta.hasResolvedEmpty;
    const showCommonSearches = !typed;
    const showTypedHint = typed && !isQuestion && !typeaheadActive;
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__empty-state omniguide-instant ${isMobile ? "omniguide-chat__empty-state--mobile" : ""}` }, connectionNotice, isQuestion && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-instant__hero",
        onClick: disabled ? void 0 : () => onExampleClick(trimmedQuery),
        disabled,
        "aria-label": `Ask the AI shopping advisor: ${trimmedQuery}`
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hero-mark", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchSparkIcon, null)),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hero-body" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hero-eyebrow" }, "AI Shopping Advisor"), /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hero-q" }, "“", trimmedQuery, "”")),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hero-cta" }, "Press ", /* @__PURE__ */ React.createElement("kbd", null, "Enter ↵"))
    ), taHasHits && /* @__PURE__ */ React.createElement(
      SearchTypeaheadSections,
      {
        sections: ta.sections,
        idPrefix: TYPEAHEAD_ID_PREFIX,
        activeId: activeHitId,
        onSelect: handleSelectHit,
        onHover: setActiveHitId
      }
    ), taNoMatches && /* @__PURE__ */ React.createElement("p", { className: "omniguide-instant__typed-hint" }, "No matches for “", trimmedQuery, "”. Press ", /* @__PURE__ */ React.createElement("kbd", null, "↵"), " to ", askTarget, "."), showCommonSearches && /* @__PURE__ */ React.createElement("div", { className: "omniguide-instant__section" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-instant__heading" }, "Common searches"), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-instant__rows ${disabled ? "omniguide-chips--disabled" : ""}`,
        role: "group",
        "aria-label": "Example questions to get started",
        "aria-disabled": disabled || void 0
      },
      examples.map((example) => /* @__PURE__ */ React.createElement(
        SearchQueryRow,
        {
          key: example,
          text: example,
          onClick: disabled ? () => {
          } : () => onExampleClick(example)
        }
      ))
    )), showTypedHint && /* @__PURE__ */ React.createElement("p", { className: "omniguide-instant__typed-hint" }, "Press ", /* @__PURE__ */ React.createElement("kbd", null, "↵"), " to ", askTarget, " about “", trimmedQuery, "”."), /* @__PURE__ */ React.createElement("div", { className: "omniguide-instant__foot" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-instant__hint" }, /* @__PURE__ */ React.createElement("kbd", null, "↵"), " ", isQuestion ? "ask" : askTarget, " · ", /* @__PURE__ */ React.createElement("kbd", null, "esc"), " close")));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__empty-state ${isMobile ? "omniguide-chat__empty-state--mobile" : ""}` }, !hideTitle && /* @__PURE__ */ React.createElement("h3", { className: "omniguide-chat__empty-state-title" }, CHAT_PROMPT_TEXT$1), /* @__PURE__ */ React.createElement(React.Fragment, null, welcomeText && /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa__answer", style: { marginBottom: "16px" } }, welcomeText), connectionNotice, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `omniguide-chips ${disabled ? "omniguide-chips--disabled" : ""}`,
      role: "group",
      "aria-label": "Example questions to get started",
      "aria-disabled": disabled || void 0
    },
    examples.map((example) => /* @__PURE__ */ React.createElement(
      SearchCategoryChip,
      {
        key: example,
        text: example,
        onClick: disabled ? () => {
        } : () => onExampleClick(example),
        isSelected: false
      }
    ))
  )));
};
const SearchConnectionError = ({
  onRetry,
  isMobile = false
}) => {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `omniguide-connection-error ${isMobile ? "omniguide-connection-error--mobile" : ""}`,
      role: "alert"
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-connection-error__icon" }, /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        fillRule: "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        clipRule: "evenodd"
      }
    ))),
    /* @__PURE__ */ React.createElement("h3", { className: "omniguide-connection-error__title" }, "Unable to connect"),
    /* @__PURE__ */ React.createElement("p", { className: "omniguide-connection-error__text" }, "We couldn't reach the assistant. Please check your connection and try again."),
    onRetry && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-connection-error__retry-btn",
        onClick: onRetry
      },
      /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("polyline", { points: "23 4 23 10 17 10" }), /* @__PURE__ */ React.createElement("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })),
      /* @__PURE__ */ React.createElement("span", null, "Try Again")
    )
  );
};
const SearchConnectionBanner = ({
  status,
  onRetry,
  reconnectInfo
}) => {
  const countdown = useCountdown(reconnectInfo, status === "reconnecting");
  if (status === "reconnecting") {
    const attemptText = reconnectInfo ? ` (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : "";
    const mainText = countdown !== null && countdown > 0 ? `Trying to reconnect in ${countdown}s${attemptText}` : `Reconnecting...${attemptText}`;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-connection-banner omniguide-connection-banner--reconnecting",
        role: "status",
        "aria-live": "polite"
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__dot", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__text" }, mainText)
    );
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-connection-banner omniguide-connection-banner--disconnected",
      role: "status",
      "aria-live": "polite"
    },
    /* @__PURE__ */ React.createElement("svg", { className: "omniguide-connection-banner__icon", width: "14", height: "14", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        fillRule: "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        clipRule: "evenodd"
      }
    )),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__text" }, "Unable to connect"),
    onRetry && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-connection-banner__retry-btn",
        onClick: onRetry
      },
      "Try Again"
    )
  );
};
const SearchQAMessage = ({
  userMessage,
  assistantMessage,
  onSuggestionClick,
  onIntentAnswer,
  onCustomIntentAnswer,
  onClarificationAnswer,
  onCustomClarificationAnswer,
  selectedSuggestions = [],
  pipelineStatus,
  isLoading,
  variant = "search",
  productUrls = {},
  connectionStatus,
  reconnectInfo,
  conversationId,
  FeedbackWidgetComponent,
  onInlineProductLinkClick
}) => {
  var _a, _b;
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const questionRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  useEffect(() => {
    if (questionRef.current) {
      const element = questionRef.current;
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [userMessage.content]);
  const { sourceProductUrls, sourceProductNames } = useMemo(() => {
    const urlMap = { ...productUrls };
    const nameMap = {};
    const sources = (assistantMessage == null ? void 0 : assistantMessage.sources) || [];
    sources.forEach((source) => {
      if (source.type === "product" && source.data) {
        const { sku, url, path, display_name, name, product_line, brand } = source.data;
        if (sku) {
          if (url || path) {
            urlMap[String(sku)] = url || path;
          }
          const shortName = name || display_name;
          if (shortName) {
            if (!name && display_name) {
              const brandName = product_line || (typeof brand === "object" ? brand == null ? void 0 : brand.name : typeof brand === "string" ? brand : null);
              nameMap[String(sku)] = brandName ? `${brandName} ${shortName}` : shortName;
            } else {
              nameMap[String(sku)] = shortName;
            }
          }
        }
      }
    });
    return { sourceProductUrls: urlMap, sourceProductNames: nameMap };
  }, [assistantMessage == null ? void 0 : assistantMessage.sources, productUrls]);
  const isStreaming = assistantMessage == null ? void 0 : assistantMessage.isStreaming;
  const hasProductUrls = Object.keys(sourceProductUrls).length > 0;
  const sanitizedContent = parseMarkdown((assistantMessage == null ? void 0 : assistantMessage.content) || "", {
    linkColor: "var(--omniguide-color-primary)",
    productUrls: sourceProductUrls,
    productNames: sourceProductNames,
    requireCorrectUrls: !hasProductUrls
  }) || "";
  const hasContent = (((_a = assistantMessage == null ? void 0 : assistantMessage.content) == null ? void 0 : _a.length) ?? 0) > 0;
  const hasSubstantialContent = (((_b = assistantMessage == null ? void 0 : assistantMessage.content) == null ? void 0 : _b.length) ?? 0) > 100;
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const showInlineStatus = isLoading && pipelineStatus && pipelineStatus !== "idle" && pipelineStatus !== "generating" && !(hasSubstantialContent && pipelineStatus === "finalizing" && !isStreaming);
  const questionClassName = `omniguide-qa__question ${variant === "category" ? "omniguide-qa__question--category" : ""} ${isTruncated ? "omniguide-qa__question--truncated" : ""}`.trim();
  const handleQuestionClick = () => {
    if (isTruncated) {
      setIsQuestionExpanded(!isQuestionExpanded);
    }
  };
  const handleAnswerClick = useCallback((event) => {
    var _a2;
    if (!onInlineProductLinkClick) return;
    const anchor = (_a2 = event.target) == null ? void 0 : _a2.closest("a[data-omniguide-sku]");
    if (!anchor) return;
    const sku = anchor.getAttribute("data-omniguide-sku") || "";
    if (!sku) return;
    onInlineProductLinkClick({
      sku,
      href: anchor.getAttribute("href") || "",
      messageId: assistantMessage == null ? void 0 : assistantMessage.id,
      queryContext: userMessage.content
    });
  }, [onInlineProductLinkClick, assistantMessage == null ? void 0 : assistantMessage.id, userMessage.content]);
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa" }, /* @__PURE__ */ React.createElement(
    "h3",
    {
      ref: questionRef,
      className: questionClassName,
      onClick: handleQuestionClick
    },
    userMessage.content
  ), assistantMessage && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa__answer", onClick: handleAnswerClick }, hasContent ? /* @__PURE__ */ React.createElement("span", { dangerouslySetInnerHTML: { __html: sanitizedContent } }) : !hasContent && isConnectionDisabled ? /* @__PURE__ */ React.createElement(SearchAnswerSkeleton, { connectionLost: true, connectionStatus, reconnectInfo }) : isStreaming || isLoading ? /* @__PURE__ */ React.createElement(SearchAnswerSkeleton, null) : null, isStreaming && hasContent && /* @__PURE__ */ React.createElement("span", { className: "omniguide-streaming-cursor" }), showInlineStatus && /* @__PURE__ */ React.createElement(SearchPipelineStatusIndicator, { status: pipelineStatus })), !isStreaming && assistantMessage.intentQuestion && /* @__PURE__ */ React.createElement(
    SearchIntentQuestionUI,
    {
      intentQuestion: assistantMessage.intentQuestion,
      onAnswerClick: onIntentAnswer,
      onCustomAnswer: onCustomIntentAnswer,
      variant
    }
  ), !isStreaming && assistantMessage.clarificationQuestion && /* @__PURE__ */ React.createElement(
    SearchClarificationQuestionUI,
    {
      clarificationQuestion: assistantMessage.clarificationQuestion,
      onAnswerClick: onClarificationAnswer,
      onCustomAnswer: onCustomClarificationAnswer,
      variant
    }
  ), !isStreaming && !assistantMessage.intentQuestion && !assistantMessage.clarificationQuestion && /* @__PURE__ */ React.createElement(
    SearchSuggestionChips,
    {
      suggestions: assistantMessage.suggestions,
      onSuggestionClick,
      selectedSuggestions,
      variant
    }
  ), !isStreaming && assistantMessage.id && FeedbackWidgetComponent && /* @__PURE__ */ React.createElement("div", { className: "omniguide-message__feedback" }, /* @__PURE__ */ React.createElement(
    FeedbackWidgetComponent,
    {
      entityId: assistantMessage.id,
      entityType: "message",
      context: {
        query: userMessage.content,
        conversation_id: conversationId,
        message_role: "assistant",
        has_sources: assistantMessage.sources && assistantMessage.sources.length > 0
      }
    }
  ))));
};
const SearchPrivacySettings = ({
  isMobile,
  onResetChat,
  sessionId: _sessionId,
  privacyPolicyUrl = "/privacy-policy",
  onOpenSupport,
  supportHref,
  supportLabel = "Talk to a specialist",
  consentEnabled = false,
  onToggleConsent,
  consentDisabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const contentId = "privacy-settings-content";
  const closeWithAnimation = useCallback(() => {
    if (!isExpanded || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 250);
  }, [isExpanded, isClosing]);
  useEffect(() => {
    if (!isExpanded || !isMobile || isClosing) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeWithAnimation();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isExpanded, isMobile, isClosing, closeWithAnimation]);
  useEffect(() => {
    if (!isExpanded || !isMobile || isClosing) return;
    const handleScroll = () => {
      closeWithAnimation();
    };
    const resultsEl = document.querySelector(".omniguide-mobile-results-bg");
    if (resultsEl) {
      resultsEl.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (resultsEl) {
        resultsEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isExpanded, isMobile, isClosing, closeWithAnimation]);
  const handleToggleExpand = () => {
    if (isExpanded) {
      closeWithAnimation();
    } else {
      setIsExpanded(true);
    }
  };
  const handleToggleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleExpand();
    }
  };
  const handleConsentKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!consentDisabled) {
        onToggleConsent == null ? void 0 : onToggleConsent();
      }
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: containerRef,
      className: `omniguide-privacy ${isMobile ? "omniguide-privacy--mobile" : ""} ${isExpanded ? "omniguide-privacy--expanded" : ""}`
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleToggleExpand,
        onKeyDown: handleToggleKeyDown,
        className: "omniguide-privacy__toggle",
        "data-hovered": isHovered,
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        "aria-expanded": isExpanded,
        "aria-controls": contentId,
        "aria-label": `Privacy & Settings, ${isExpanded ? "expanded" : "collapsed"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "Privacy & Settings"),
      /* @__PURE__ */ React.createElement(SearchChevronDownIcon, { expanded: isExpanded })
    ),
    (isExpanded || isClosing) && /* @__PURE__ */ React.createElement(
      "div",
      {
        id: contentId,
        className: `omniguide-privacy__content ${isClosing ? "omniguide-privacy__content--closing" : ""}`,
        role: "region",
        "aria-label": "Privacy settings options"
      },
      onToggleConsent && /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: consentDisabled ? void 0 : onToggleConsent,
          onKeyDown: handleConsentKeyDown,
          className: `omniguide-privacy__switch ${consentDisabled ? "omniguide-privacy__switch--disabled" : ""}`,
          "data-enabled": consentDisabled ? false : consentEnabled,
          role: "switch",
          "aria-checked": consentDisabled ? false : consentEnabled,
          "aria-disabled": consentDisabled || void 0,
          "aria-label": consentDisabled ? "Consent for tracking, disabled because website tracking is off" : `Consent for tracking, currently ${consentEnabled ? "enabled" : "disabled"}`,
          style: consentDisabled ? { cursor: "not-allowed", opacity: 0.5 } : void 0
        },
        /* @__PURE__ */ React.createElement("span", { className: `omniguide-privacy__knob ${!consentDisabled && consentEnabled ? "omniguide-privacy__knob--enabled" : ""}` })
      ), /* @__PURE__ */ React.createElement("span", { className: "omniguide-privacy__label", id: "consent-label" }, consentDisabled ? "Enable tracking via website cookie preferences" : /* @__PURE__ */ React.createElement(React.Fragment, null, "Consent for tracking (", /* @__PURE__ */ React.createElement("a", { className: "omniguide-privacy__oneline", href: privacyPolicyUrl }, "read more"), ")"))),
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "omniguide-privacy__link",
          onClick: () => {
            if (onResetChat) {
              onResetChat();
            }
          },
          "aria-label": "Clear chat session"
        },
        "Clear Session"
      )),
      (supportHref || onOpenSupport) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, supportHref ? /* @__PURE__ */ React.createElement(
        "a",
        {
          className: "omniguide-privacy__link",
          href: supportHref,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: onOpenSupport,
          "aria-label": supportLabel
        },
        supportLabel
      ) : /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "omniguide-privacy__link",
          onClick: onOpenSupport,
          "aria-label": supportLabel
        },
        supportLabel
      )),
      /* @__PURE__ */ React.createElement("div", { style: { height: "16px" }, "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("p", { className: "omniguide-privacy__disclaimer" }, "This conversation leverages AI. We continuously monitor to ensure quality results."),
      /* @__PURE__ */ React.createElement("p", { className: "omniguide-privacy__disclaimer" }, "Read our ", /* @__PURE__ */ React.createElement("a", { href: `${privacyPolicyUrl}/` }, "Privacy Policy"), ".")
    )
  );
};
const MAX_INPUT_LENGTH = 200;
const MAX_INPUT_ERROR_MSG = `Maximum ${MAX_INPUT_LENGTH} characters allowed`;
const SearchChatInput = ({
  onSendMessage,
  isLoading = false,
  isMobile = false,
  isCategory = false,
  isCollapsed = false,
  onCollapseToggle,
  onResetChat,
  autoFocusAfterSend = false,
  privacySettingsProps,
  connectionStatus,
  reconnectInfo,
  topSearch = false,
  onValueChange,
  placeholder
}) => {
  const [input, setInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showInputLimitError, setShowInputLimitError] = useState(false);
  const [askExpanded, setAskExpanded] = useState(false);
  const inputRef = useRef(null);
  const prevIsLoadingRef = useRef(isLoading);
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const isDisabled = isLoading || isConnectionDisabled;
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  const getPlaceholder = () => {
    if (topSearch) return "Search or ask anything…";
    if (isMobile) return placeholder ?? "Ask a question";
    if (isCategory) return placeholder ?? "Ask anything…";
    return "Ask Anything";
  };
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && inputRef.current && autoFocusAfterSend) {
      inputRef.current.focus({ preventScroll: true });
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, autoFocusAfterSend]);
  useEffect(() => {
    if (!isMobile || isCategory) return;
    const id = window.setTimeout(() => {
      var _a;
      return (_a = inputRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(id);
  }, [isMobile, isCategory]);
  useEffect(() => {
    var _a;
    if (askExpanded) {
      (_a = inputRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }
  }, [askExpanded]);
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput && !isDisabled) {
      const messageToSend = trimmedInput;
      setInput("");
      onValueChange == null ? void 0 : onValueChange("");
      setShowInputLimitError(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onSendMessage(messageToSend);
    }
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    onValueChange == null ? void 0 : onValueChange(value);
    setShowInputLimitError(value.length >= MAX_INPUT_LENGTH);
  };
  const handleInputPaste = (e) => {
    var _a;
    const pastedText = ((_a = e.clipboardData) == null ? void 0 : _a.getData("text")) || "";
    const currentValue = input;
    const target = e.target;
    const selectionStart = target.selectionStart || 0;
    const selectionEnd = target.selectionEnd || 0;
    const resultingLength = currentValue.length - (selectionEnd - selectionStart) + pastedText.length;
    if (resultingLength > MAX_INPUT_LENGTH) {
      setShowInputLimitError(true);
    }
  };
  const handleFocus = () => {
    setIsInputFocused(true);
    if (isCollapsed && onCollapseToggle) {
      onCollapseToggle();
    }
  };
  const inputId = isMobile ? "chat-input-mobile" : "chat-input";
  const errorId = isMobile ? "chat-input-error-mobile" : "chat-input-error";
  if (isMobile) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-input" }, /* @__PURE__ */ React.createElement(
      "form",
      {
        onSubmit: handleSubmit,
        className: "omniguide-chat__mobile-input-form",
        role: "search",
        "aria-label": "Ask a question"
      },
      /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "sr-only" }, "Type your question"),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          id: inputId,
          ref: inputRef,
          type: "text",
          value: input,
          onChange: handleInputChange,
          onPaste: handleInputPaste,
          placeholder: getPlaceholder(),
          disabled: isDisabled,
          maxLength: MAX_INPUT_LENGTH,
          className: "omniguide-chat__mobile-input-field",
          "aria-describedby": showInputLimitError ? errorId : void 0,
          "aria-invalid": showInputLimitError
        }
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          disabled: !input.trim() || isDisabled,
          className: "omniguide-chat__mobile-submit-btn",
          "data-disabled": !input.trim() || isDisabled,
          "aria-label": isLoading ? "Sending message..." : "Send message"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12H19M19 12L12 5M19 12L12 19", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))
      )
    ), showInputLimitError && /* @__PURE__ */ React.createElement("p", { id: errorId, className: "omniguide-chat__input-error", role: "alert", "aria-live": "assertive" }, MAX_INPUT_ERROR_MSG));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__input-container ${topSearch ? "omniguide-chat__input-container--top" : ""} ${isCategory ? "omniguide-chat__input-container--category" : ""} ${isCollapsed ? "omniguide-chat__input-container--collapsed" : ""}` }, isCategory && !askExpanded ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-chat__ask-toggle",
      onClick: () => setAskExpanded(true)
    },
    "or, ask a question"
  ) : /* @__PURE__ */ React.createElement(
    "form",
    {
      onSubmit: handleSubmit,
      className: `omniguide-chat__input-form ${topSearch ? "omniguide-chat__input-form--top" : ""} ${isCategory ? "omniguide-chat__input-form--category" : ""}`,
      "data-focused": isInputFocused,
      role: "search",
      "aria-label": "Ask a question"
    },
    topSearch && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-leading-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchMagnifierIcon, null)),
    isCategory && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-search-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m20 20-3.5-3.5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }))),
    /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "sr-only" }, "Type your question"),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        id: inputId,
        ref: inputRef,
        type: "text",
        value: input,
        onChange: handleInputChange,
        onPaste: handleInputPaste,
        placeholder: getPlaceholder(),
        disabled: isDisabled,
        maxLength: MAX_INPUT_LENGTH,
        autoFocus: topSearch,
        className: `omniguide-chat__input ${isCategory ? "omniguide-chat__input--category" : ""}`,
        "aria-describedby": showInputLimitError ? errorId : void 0,
        "aria-invalid": showInputLimitError,
        onFocus: handleFocus,
        onBlur: (e) => {
          var _a, _b;
          if ((_b = (_a = e.relatedTarget) == null ? void 0 : _a.matches) == null ? void 0 : _b.call(_a, "a, button, input, select, textarea")) {
            return;
          }
          setIsInputFocused(false);
        }
      }
    ),
    !topSearch && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: !input.trim() || isDisabled,
        className: `omniguide-chat__submit-btn ${isCategory ? "omniguide-chat__submit-btn--category" : ""}`,
        "data-disabled": !input.trim() || isDisabled,
        "data-focused": isInputFocused,
        "aria-label": isLoading ? "Sending message..." : "Send message"
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__submit-label" }, "Send"),
      /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "19", height: "19", viewBox: "0 0 19 19", fill: "none", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M14.2002 7.90792L7.9422 1.64991L9.5921 0L18.6667 9.07459L9.5921 18.149L7.9422 16.4991L14.2002 10.2413H0V7.90792H14.2002Z", fill: "currentColor" }))
    )
  ), showInputLimitError && /* @__PURE__ */ React.createElement("p", { id: errorId, className: "omniguide-chat__input-error", role: "alert", "aria-live": "assertive" }, MAX_INPUT_ERROR_MSG), !topSearch && (privacySettingsProps || isCategory && isConnectionDisabled) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__input-footer" }, privacySettingsProps ? /* @__PURE__ */ React.createElement(
    SearchPrivacySettings,
    {
      ...privacySettingsProps,
      isMobile: false,
      onResetChat
    }
  ) : /* @__PURE__ */ React.createElement("div", null), isCategory && isConnectionDisabled && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-status" }, connectionStatus === "disconnected" ? "Unable to connect" : connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2 ? countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Reconnecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, ".")), " (", reconnectInfo.attempt, "/", reconnectInfo.maxAttempts, ")") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Connecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."))))));
};
function useProductUrlFetching({
  messages,
  fetchProductUrls
}) {
  const [productUrls, setProductUrls] = useState({});
  const fetchedSkusRef = useRef(/* @__PURE__ */ new Set());
  const pendingFetchRef = useRef(null);
  const allSkus = useMemo(() => {
    const skus = /* @__PURE__ */ new Set();
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.content) {
        const extractedSkus = extractSkusFromMarkdown(msg.content);
        extractedSkus.forEach((sku) => skus.add(sku));
      }
    });
    return Array.from(skus);
  }, [messages]);
  useEffect(() => {
    const fetchedSkus = fetchedSkusRef.current;
    const pendingFetch = pendingFetchRef;
    return () => {
      fetchedSkus.clear();
      if (pendingFetch.current) {
        clearTimeout(pendingFetch.current);
      }
    };
  }, []);
  useEffect(() => {
    if (!fetchProductUrls) return;
    const newSkus = allSkus.filter((sku) => !fetchedSkusRef.current.has(sku));
    if (newSkus.length === 0) return;
    if (pendingFetchRef.current) {
      clearTimeout(pendingFetchRef.current);
    }
    pendingFetchRef.current = setTimeout(() => {
      const skusToFetch = allSkus.filter((sku) => !fetchedSkusRef.current.has(sku));
      if (skusToFetch.length > 0) {
        skusToFetch.forEach((sku) => fetchedSkusRef.current.add(sku));
        fetchProductUrls(skusToFetch).then((urls) => {
          setProductUrls((prev) => ({ ...prev, ...urls }));
        });
      }
    }, 150);
    return () => {
      if (pendingFetchRef.current) {
        clearTimeout(pendingFetchRef.current);
      }
    };
  }, [allSkus, fetchProductUrls]);
  return { productUrls };
}
function useChatNavigation({
  messages,
  variant,
  controlledIndex,
  onMessageIndexChange,
  chatPanelRef
}) {
  const [internalMessageIndex, setInternalMessageIndex] = useState(0);
  const prevQaPairsLengthRef = useRef(0);
  const userNavigatedRef = useRef(false);
  const currentMessageIndex = controlledIndex !== void 0 ? controlledIndex : internalMessageIndex;
  const qaPairs = useMemo(() => {
    const pairs = [];
    let currentPair = null;
    const chronologicalMessages = [...messages].reverse();
    for (const message of chronologicalMessages) {
      const msgType = message["type"];
      if (msgType === "thinking") {
        pairs.push({ type: "thinking", id: message.id });
      } else if (message.role === "user") {
        currentPair = { userMessage: message, assistantMessage: null };
        pairs.push(currentPair);
      } else if (message.role === "assistant" && currentPair && !currentPair.assistantMessage) {
        currentPair.assistantMessage = message;
      }
    }
    return pairs;
  }, [messages]);
  useEffect(() => {
    const prevLength = prevQaPairsLengthRef.current;
    if (!onMessageIndexChange && qaPairs.length > 0) {
      if (qaPairs.length > prevLength) {
        setInternalMessageIndex(qaPairs.length - 1);
        userNavigatedRef.current = false;
      } else if (qaPairs.length < prevLength) {
        setInternalMessageIndex(qaPairs.length - 1);
      }
    }
    if (qaPairs.length > prevLength && variant === "category" && (chatPanelRef == null ? void 0 : chatPanelRef.current)) {
      setTimeout(() => {
        const fixedHeader = document.querySelector("header");
        const headerHeight = fixedHeader ? fixedHeader.offsetHeight : 120;
        const padding = 20;
        const elementTop = chatPanelRef.current.getBoundingClientRect().top;
        const scrollTop = window.pageYOffset + elementTop - headerHeight - padding;
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "smooth"
        });
      }, 100);
    }
    prevQaPairsLengthRef.current = qaPairs.length;
  }, [qaPairs.length, variant, onMessageIndexChange, chatPanelRef]);
  const canGoUp = currentMessageIndex > 0;
  const canGoDown = currentMessageIndex < qaPairs.length - 1;
  const currentIndexRef = useRef(currentMessageIndex);
  const qaPairsLengthRef = useRef(qaPairs.length);
  currentIndexRef.current = currentMessageIndex;
  qaPairsLengthRef.current = qaPairs.length;
  const handleNavigateUp = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx <= 0) return;
    const newIndex = idx - 1;
    if (onMessageIndexChange) {
      onMessageIndexChange(newIndex);
    } else {
      setInternalMessageIndex(newIndex);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  const handleNavigateDown = useCallback(() => {
    const idx = currentIndexRef.current;
    const maxIdx = qaPairsLengthRef.current - 1;
    if (idx >= maxIdx) return;
    const newIndex = idx + 1;
    if (onMessageIndexChange) {
      onMessageIndexChange(newIndex);
    } else {
      setInternalMessageIndex(newIndex);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  const setMessageIndex = useCallback((index) => {
    if (onMessageIndexChange) {
      onMessageIndexChange(index);
    } else {
      setInternalMessageIndex(index);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  return {
    qaPairs,
    currentMessageIndex,
    canGoUp,
    canGoDown,
    handleNavigateUp,
    handleNavigateDown,
    setMessageIndex
  };
}
const log$8 = createScopedLogger("ScrollTracking");
const CHAT_PROMPT_TEXT = "Ask a question.";
const SearchChatPanel = ({
  messages,
  onSendMessage,
  isMobile = false,
  isCollapsed = false,
  isLoading = false,
  pipelineStatus = "idle",
  onIntentAnswer,
  onCustomIntentAnswer,
  onClarificationAnswer,
  onCustomClarificationAnswer,
  onCollapseToggle,
  onResetChat,
  variant = "search",
  suggestedQuestions = [],
  seedQuestions = [],
  welcomeText = "",
  siteName,
  currentMessageIndex: controlledIndex,
  onMessageIndexChange,
  isCompactMode = false,
  fetchProductUrls,
  conversationId,
  FeedbackWidgetComponent,
  privacySettingsProps,
  defaultSearchExamples,
  connectionStatus,
  onRetryConnection,
  reconnectInfo,
  onScrollForMoreTapped,
  onScrollStarted,
  onInlineProductLinkClick,
  hideInput = false,
  liveQuery = "",
  typeahead = false,
  aiSearchStoreUrl,
  hideMobileAskBox = false,
  mobileAskPlaceholder
}) => {
  var _a, _b, _c, _d, _e, _f;
  const SearchEmptyState$1 = useComponent("SearchEmptyState", SearchEmptyState);
  const SearchQAMessage$1 = useComponent("SearchQAMessage", SearchQAMessage);
  const SearchConnectionError$1 = useComponent("SearchConnectionError", SearchConnectionError);
  const SearchConnectionBanner$1 = useComponent("SearchConnectionBanner", SearchConnectionBanner);
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [hasMoreToScroll, setHasMoreToScroll] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const chatPanelRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollTrackedRef = useRef(/* @__PURE__ */ new Set());
  const { productUrls } = useProductUrlFetching({ messages, fetchProductUrls });
  const {
    qaPairs,
    currentMessageIndex,
    canGoUp,
    canGoDown,
    handleNavigateUp,
    handleNavigateDown
  } = useChatNavigation({
    messages,
    variant,
    controlledIndex,
    onMessageIndexChange,
    chatPanelRef
  });
  const currentPair = qaPairs[currentMessageIndex];
  const currentMessageId = ((_a = currentPair == null ? void 0 : currentPair.assistantMessage) == null ? void 0 : _a.id) ?? ((_b = currentPair == null ? void 0 : currentPair.userMessage) == null ? void 0 : _b.id) ?? "";
  const onScrollStartedRef = useRef(onScrollStarted);
  onScrollStartedRef.current = onScrollStarted;
  useEffect(() => {
    if (!isMobile || !messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const msgId = currentMessageId;
    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
      setHasMoreToScroll(isScrollable && !isAtBottom);
    };
    const handleScroll = () => {
      var _a2;
      checkScrollable();
      if (container.scrollTop > 0) {
        setHasUserScrolled(true);
        if (msgId && !scrollTrackedRef.current.has(msgId)) {
          const minScroll = Math.max(30, container.scrollHeight * 0.05);
          log$8.debug("Scroll detected:", { msgId, scrollTop: container.scrollTop, minScroll, scrollHeight: container.scrollHeight });
          if (container.scrollTop >= minScroll) {
            scrollTrackedRef.current.add(msgId);
            log$8.debug("Firing onScrollStarted for message:", msgId);
            (_a2 = onScrollStartedRef.current) == null ? void 0 : _a2.call(onScrollStartedRef, msgId);
          }
        }
      }
    };
    checkScrollable();
    setHasUserScrolled(false);
    container.addEventListener("scroll", handleScroll, { passive: true });
    const observer = new ResizeObserver(checkScrollable);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [isMobile, messages, currentMessageIndex, isCollapsed, currentMessageId]);
  const handleScrollIndicatorClick = useCallback(() => {
    if (currentMessageId && onScrollForMoreTapped) {
      log$8.debug("Scroll indicator tapped for message:", currentMessageId);
      onScrollForMoreTapped(currentMessageId);
    }
  }, [currentMessageId, onScrollForMoreTapped]);
  const handleExampleClick = (example) => {
    onSendMessage(example);
  };
  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestions((prev) => [...prev, suggestion]);
    onSendMessage(suggestion);
  };
  const handleIntentAnswer = (answerText, answerId, options = {}) => {
    if (onIntentAnswer) onIntentAnswer(answerText, answerId, options);
  };
  const handleCustomIntentAnswer = (customText) => {
    if (onCustomIntentAnswer) {
      onCustomIntentAnswer(customText);
    } else {
      onSendMessage(customText);
    }
  };
  const handleClarificationAnswer = (answerText, optionId, paramName) => {
    if (onClarificationAnswer) onClarificationAnswer(answerText, optionId, paramName);
  };
  const handleCustomClarificationAnswer = (customText) => {
    if (onCustomClarificationAnswer) {
      onCustomClarificationAnswer(customText);
    } else {
      onSendMessage(customText);
    }
  };
  const renderMessages = () => {
    var _a2;
    if (qaPairs.length === 0) return null;
    const pair = qaPairs[currentMessageIndex];
    if (!pair) return null;
    const key = pair.type === "thinking" ? pair.id : (_a2 = pair.userMessage) == null ? void 0 : _a2.id;
    const isLatest = currentMessageIndex === qaPairs.length - 1;
    return /* @__PURE__ */ React.createElement("div", { key }, pair.type === "thinking" ? /* @__PURE__ */ React.createElement(SearchThinkingIndicator, null) : pair.userMessage ? /* @__PURE__ */ React.createElement(
      SearchQAMessage$1,
      {
        userMessage: pair.userMessage,
        assistantMessage: pair.assistantMessage,
        onSuggestionClick: handleSuggestionClick,
        onIntentAnswer: handleIntentAnswer,
        onCustomIntentAnswer: handleCustomIntentAnswer,
        onClarificationAnswer: handleClarificationAnswer,
        onCustomClarificationAnswer: handleCustomClarificationAnswer,
        selectedSuggestions,
        pipelineStatus: isLatest ? pipelineStatus : void 0,
        isLoading: isLatest ? isLoading : false,
        variant,
        productUrls,
        connectionStatus: isLatest ? connectionStatus : void 0,
        reconnectInfo: isLatest ? reconnectInfo : void 0,
        isMobile,
        conversationId,
        FeedbackWidgetComponent,
        onInlineProductLinkClick
      }
    ) : null);
  };
  const isCategory = variant === "category";
  const autoFocusAfterSend = !isMobile && variant === "search";
  if (isMobile) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-chat omniguide-chat--mobile ${isCollapsed ? "omniguide-chat--mobile-collapsed" : ""}`,
        style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
        role: "region",
        "aria-label": "Product assistant chat",
        "aria-busy": isLoading
      },
      isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-nav-row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-chat__expand-btn",
          onClick: onCollapseToggle,
          "aria-label": "Expand to see answer"
        },
        /* @__PURE__ */ React.createElement("span", null, "See answer"),
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      )),
      !isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement(
        SearchNavigationButtons,
        {
          canGoUp,
          canGoDown,
          onNavigateUp: handleNavigateUp,
          onNavigateDown: handleNavigateDown,
          currentIndex: currentMessageIndex,
          totalCount: qaPairs.length,
          timestamp: (_d = (_c = qaPairs[currentMessageIndex]) == null ? void 0 : _c.userMessage) == null ? void 0 : _d.timestamp,
          isMobile: true
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `omniguide-chat__mobile-content ${isCollapsed ? "omniguide-chat__mobile-content--collapsed" : ""}`,
          ref: messagesContainerRef,
          role: "log",
          "aria-live": "polite",
          "aria-label": "Conversation messages",
          "aria-relevant": "additions",
          "aria-hidden": isCollapsed
        },
        messages.length === 0 ? connectionStatus === "disconnected" ? /* @__PURE__ */ React.createElement(SearchConnectionError$1, { onRetry: onRetryConnection, isMobile: true }) : /* @__PURE__ */ React.createElement(SearchEmptyState$1, { onExampleClick: handleExampleClick, isMobile: true, variant, suggestedQuestions, seedQuestions, welcomeText, siteName, defaultSearchExamples, disabled: isConnectionDisabled, connectionStatus, reconnectInfo }) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-full-content omniguide-chat__message-content", style: { paddingTop: "8px", paddingBottom: "8px" } }, renderMessages(), isConnectionDisabled && /* @__PURE__ */ React.createElement(
          SearchConnectionBanner$1,
          {
            status: connectionStatus === "disconnected" ? "disconnected" : "reconnecting",
            onRetry: onRetryConnection,
            reconnectInfo
          }
        )),
        hasMoreToScroll && !isCollapsed && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__scroll-fade" }, /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__scroll-indicator ${hasUserScrolled ? "omniguide-chat__scroll-indicator--no-animate" : ""}`, onClick: handleScrollIndicatorClick, role: "button", tabIndex: 0, "aria-label": "Scroll for more content", style: { pointerEvents: "auto", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", null, "Scroll for more"), /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))))
      ),
      !hideMobileAskBox && /* @__PURE__ */ React.createElement(
        SearchChatInput,
        {
          onSendMessage,
          isLoading,
          isMobile: true,
          isCategory,
          autoFocusAfterSend: false,
          connectionStatus,
          placeholder: mobileAskPlaceholder
        }
      )
    );
  }
  const chatClassName = isCategory ? `omniguide-chat omniguide-chat--category ${isCollapsed ? "omniguide-chat--collapsed" : ""}` : `omniguide-chat ${isCompactMode ? "omniguide-chat--compact" : ""} ${isCollapsed ? "omniguide-chat--collapsed" : ""}`;
  const handleChatAreaClick = (e) => {
    var _a2;
    const target = e.target;
    if (target === chatPanelRef.current || target.classList.contains("omniguide-chat__messages")) {
      const inputEl = (_a2 = chatPanelRef.current) == null ? void 0 : _a2.querySelector("#chat-input");
      inputEl == null ? void 0 : inputEl.focus({ preventScroll: true });
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: chatPanelRef,
      className: chatClassName,
      onClick: handleChatAreaClick,
      role: "region",
      "aria-label": "Product assistant chat",
      "aria-busy": isLoading
    },
    !isCollapsed && onCollapseToggle && isCategory && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-chat__header omniguide-chat__header--collapsed",
        style: { borderBottom: "1px solid var(--omniguide-border-lighter)" },
        role: "region",
        "aria-label": "Ask a question section"
      },
      /* @__PURE__ */ React.createElement("h3", { className: "omniguide-chat__header-title omniguide-chat__header-title--category" }, CHAT_PROMPT_TEXT),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-chat__collapse-btn",
          onClick: onCollapseToggle,
          "aria-label": "Collapse question suggestions",
          "aria-expanded": "true"
        },
        /* @__PURE__ */ React.createElement(SearchCollapseToggleIcon, { isCollapsed: false })
      )
    ),
    !isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement(
      SearchNavigationButtons,
      {
        canGoUp,
        canGoDown,
        onNavigateUp: handleNavigateUp,
        onNavigateDown: handleNavigateDown,
        currentIndex: currentMessageIndex,
        totalCount: qaPairs.length,
        timestamp: (_f = (_e = qaPairs[currentMessageIndex]) == null ? void 0 : _e.userMessage) == null ? void 0 : _f.timestamp,
        isMobile: false
      }
    ),
    !isCollapsed && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-chat__messages ${isCategory ? "omniguide-chat__messages--category" : ""}`,
        style: onCollapseToggle && isCategory ? { paddingTop: "1rem" } : {},
        ref: messagesContainerRef,
        role: "log",
        "aria-live": "polite",
        "aria-label": "Conversation messages",
        "aria-relevant": "additions"
      },
      messages.length === 0 ? connectionStatus === "disconnected" ? /* @__PURE__ */ React.createElement(SearchConnectionError$1, { onRetry: onRetryConnection, isMobile: false }) : /* @__PURE__ */ React.createElement(SearchEmptyState$1, { onExampleClick: handleExampleClick, isMobile: false, variant, suggestedQuestions, seedQuestions, welcomeText, siteName, hideTitle: !!onCollapseToggle, defaultSearchExamples, disabled: isConnectionDisabled, connectionStatus, reconnectInfo, liveQuery, typeahead, aiSearchStoreUrl }) : /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__message-content${isCategory ? " omniguide-chat__message-content--category" : ""}` }, renderMessages(), isConnectionDisabled && /* @__PURE__ */ React.createElement(
        SearchConnectionBanner$1,
        {
          status: connectionStatus === "disconnected" ? "disconnected" : "reconnecting",
          onRetry: onRetryConnection,
          reconnectInfo
        }
      ))
    ),
    !hideInput && /* @__PURE__ */ React.createElement(
      SearchChatInput,
      {
        onSendMessage,
        isLoading,
        isMobile: false,
        isCategory,
        isCollapsed,
        onCollapseToggle,
        onResetChat,
        autoFocusAfterSend,
        privacySettingsProps,
        connectionStatus,
        reconnectInfo
      }
    )
  );
};
const log$7 = createScopedLogger("useChatMessageHandler");
const generateId$1 = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const useChatMessageHandler = ({
  websiteId,
  setMessages,
  setIsLoading,
  setPipelineStatus,
  setIsThinking,
  setIsTimedOut,
  setError,
  setConversationId: setConversationId2,
  setSessionId: setSessionId$1,
  setPendingIntentQuestion,
  setPendingClarificationQuestion,
  currentMessageIdRef,
  hydration,
  query,
  messages,
  buildFallbackSearchUrl
}) => {
  const tokenBufferRef = useRef("");
  const tokenFlushTimeoutRef = useRef(null);
  const streamingResponseRef = useRef("");
  const hydrationRef = useRef(hydration);
  const queryRef = useRef(query);
  const messagesRef = useRef(messages);
  hydrationRef.current = hydration;
  queryRef.current = query;
  messagesRef.current = messages;
  const buildFallbackSearchUrlRef = useRef(buildFallbackSearchUrl);
  buildFallbackSearchUrlRef.current = buildFallbackSearchUrl;
  const responseTimerRef = useRef(null);
  useEffect(() => {
    responseTimerRef.current = createResponseTimer({
      onThinking: () => {
        log$7.debug('Entering "thinking" state after 3s');
        setIsThinking(true);
      },
      onTimeout: () => {
        log$7.debug("Response timed out after 10s");
        setIsTimedOut(true);
        setIsLoading(false);
        setError(ERROR_MESSAGES.TIMEOUT);
      },
      onCancel: () => {
        setIsThinking(false);
        setIsTimedOut(false);
      }
    });
    return () => {
      if (responseTimerRef.current) {
        responseTimerRef.current.destroy();
      }
    };
  }, [setIsThinking, setIsTimedOut, setIsLoading, setError]);
  useEffect(() => {
    return () => {
      if (tokenFlushTimeoutRef.current) {
        clearTimeout(tokenFlushTimeoutRef.current);
        tokenFlushTimeoutRef.current = null;
      }
    };
  }, []);
  const flushTokenBuffer = useCallback(() => {
    if (tokenBufferRef.current && currentMessageIdRef.current) {
      const bufferedContent = tokenBufferRef.current;
      tokenBufferRef.current = "";
      setMessages((prev) => prev.map(
        (m) => m.id === currentMessageIdRef.current ? { ...m, content: m.content + bufferedContent, isStreaming: true } : m
      ));
    }
  }, [setMessages, currentMessageIdRef]);
  const bufferToken = useCallback((token) => {
    tokenBufferRef.current += token;
    streamingResponseRef.current += token;
    if (tokenFlushTimeoutRef.current) {
      clearTimeout(tokenFlushTimeoutRef.current);
    }
    tokenFlushTimeoutRef.current = setTimeout(flushTokenBuffer, 50);
  }, [flushTokenBuffer]);
  const startResponseTimer = useCallback(() => {
    if (responseTimerRef.current) {
      responseTimerRef.current.start();
    }
  }, []);
  const resetStreamingState = useCallback(() => {
    streamingResponseRef.current = "";
    tokenBufferRef.current = "";
  }, []);
  const handleMessage = useCallback((msg) => {
    if (responseTimerRef.current) {
      responseTimerRef.current.cancel();
    }
    switch (msg.type) {
      case "status": {
        const status = msg.status || msg.content;
        setPipelineStatus(status === "done" ? "idle" : status);
        if (status === "done") {
          flushTokenBuffer();
          setIsLoading(false);
          if (currentMessageIdRef.current) {
            setMessages((prev) => prev.map(
              (m) => m.id === currentMessageIdRef.current ? { ...m, isStreaming: false } : m
            ));
          }
        }
        break;
      }
      case "token":
        if (msg.content) {
          bufferToken(msg.content);
        }
        break;
      case "answer":
        flushTokenBuffer();
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, content: msg.content, isStreaming: false } : m
          ));
          streamingResponseRef.current = msg.content;
        }
        break;
      case "sources":
        if (msg.content && Array.isArray(msg.content)) {
          hydrationRef.current.hydrateSources(msg.content);
        }
        break;
      case "suggestions":
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, suggestions: msg.content } : m
          ));
        }
        break;
      case "metadata":
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, metadata: msg.content } : m
          ));
        }
        break;
      case "intent_question":
        if (msg.content) {
          setPendingIntentQuestion(msg.content);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, intentQuestion: msg.content, isStreaming: false } : m
          ));
        }
        break;
      case "discovery_question": {
        if (msg.content) {
          const raw = msg.content;
          const answers = raw["answers"] || [];
          const rawChoices = raw["answer_choices"] || [];
          const discoveryQuestion = {
            question_id: raw["question_id"],
            question_text: raw["question_text"],
            question_summary: raw["question_summary"],
            sort_order: raw["sort_order"],
            is_root: raw["is_root"],
            parent_answer_id: raw["parent_answer_id"],
            answer_render_hint: raw["answer_render_hint"],
            answer_choices: rawChoices.map((choice) => ({
              id: String(choice["id"]),
              value: choice["value"]
            })),
            // Legacy field mappings
            id: raw["question_id"],
            question: raw["question_text"],
            summary: raw["question_summary"],
            answers: answers.map((answer) => ({
              id: answer["id"],
              answer_text: answer["answer_text"],
              explanation: answer["explanation"],
              examples: answer["examples"],
              is_other_option: answer["is_other_option"],
              has_child_question: answer["has_child_question"],
              answer: answer["answer_text"]
            })),
            _isDiscoveryQuestion: true
          };
          setPendingIntentQuestion(discoveryQuestion);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, intentQuestion: discoveryQuestion, isStreaming: false } : m
          ));
        }
        break;
      }
      case "clarification_question":
        if (msg.content) {
          setPendingClarificationQuestion(msg.content);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, clarificationQuestion: msg.content, isStreaming: false } : m
          ));
        }
        break;
      case "session_id": {
        if (msg.content || msg.session_id) {
          const contentObj = msg.content;
          const serverSessionId = (typeof contentObj === "object" && contentObj !== null ? contentObj["session_id"] : void 0) || msg.session_id || contentObj;
          log$7.debug("Syncing session ID from server:", serverSessionId);
          setSessionId$1(serverSessionId);
          setSessionId(websiteId, serverSessionId);
        }
        break;
      }
      case "user": {
        if (msg.content) {
          const content = msg.content;
          if (content["conversation_id"]) {
            setConversationId2(content["conversation_id"]);
          }
          if (content["session_id"]) {
            const serverSessionId = content["session_id"];
            log$7.debug("Syncing session ID from user message:", serverSessionId);
            setSessionId$1(serverSessionId);
            setSessionId(websiteId, serverSessionId);
          }
          if (content["message_id"] && currentMessageIdRef.current) {
            setMessages((prev) => prev.map(
              (m) => m.id === currentMessageIdRef.current ? { ...m, serverMessageId: content["message_id"] } : m
            ));
          }
        }
        break;
      }
      case "error": {
        const rawError = msg.content || "An error occurred";
        log$7.error("Search WebSocket error:", rawError);
        setError("We encountered an error while processing your request. Please try again.");
        setIsLoading(false);
        setPipelineStatus("idle");
        const lastUserMessage = messagesRef.current.filter((m) => m.role === "user").pop();
        const userQuery = (lastUserMessage == null ? void 0 : lastUserMessage.content) || queryRef.current || "";
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.type !== "thinking");
          const errorMessage = {
            id: generateId$1(),
            role: "assistant",
            content: ERROR_MESSAGES.GENERIC,
            isError: true,
            timestamp: /* @__PURE__ */ new Date(),
            fallbackSearch: userQuery ? {
              query: userQuery,
              url: buildFallbackSearchUrlRef.current ? buildFallbackSearchUrlRef.current(userQuery) : `?q=${encodeURIComponent(userQuery)}`
            } : void 0
          };
          return [errorMessage, ...filtered];
        });
        break;
      }
      case "products":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          log$7.debug("Hydrating products:", msg.content.length);
          hydrationRef.current.hydrateProducts(msg.content);
        } else {
          log$7.debug("Products received but skipped:", {
            hasMessageId: !!currentMessageIdRef.current,
            hasContent: !!msg.content,
            isArray: Array.isArray(msg.content)
          });
        }
        break;
      case "categories":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          log$7.debug("Categories received:", msg.content.length);
          hydrationRef.current.hydrateCategories(msg.content);
        }
        break;
      case "documentation":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          hydrationRef.current.hydrateDocumentation(msg.content);
        }
        break;
      case "recommendations":
        if (currentMessageIdRef.current && msg.content) {
          const recContent = msg.content;
          const keyFilterQuestions = recContent["key_filter_questions"];
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? {
              ...m,
              recommendations: recContent,
              ...keyFilterQuestions ? { keyFilterQuestions } : {}
            } : m
          ));
        }
        break;
      default:
        log$7.debug("Unhandled WebSocket message type:", msg.type);
    }
  }, [
    setMessages,
    setIsLoading,
    setPipelineStatus,
    setPendingIntentQuestion,
    setPendingClarificationQuestion,
    setConversationId2,
    setSessionId$1,
    setError,
    currentMessageIdRef,
    flushTokenBuffer,
    bufferToken,
    // websiteId is a config-level identifier that doesn't change at
    // runtime in practice — including it keeps the lint rule happy
    // without destabilizing handleMessage.
    websiteId
    // hydration, query, messages, buildFallbackSearchUrl accessed via refs to keep handleMessage stable.
    // This prevents infinite reconnection loops in useChatConnection.
  ]);
  return {
    handleMessage,
    startResponseTimer,
    resetStreamingState,
    flushTokenBuffer,
    streamingResponseRef
  };
};
const log$6 = createScopedLogger("useChatConnection");
const useChatConnection = ({
  websiteId,
  apiBaseUrl,
  sessionId,
  onMessage,
  conversationIdRef,
  autoConnect = true,
  connectionTimeout
}) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [reconnectInfo, setReconnectInfo] = useState(null);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const isConnectingRef = useRef(false);
  const wsRef = useRef(null);
  const connect = useCallback(async () => {
    var _a;
    if (!sessionId) {
      log$6.debug("Skipping connect: session id not ready");
      return;
    }
    setHasAttemptedConnection(true);
    if ((_a = wsRef.current) == null ? void 0 : _a.isConnected()) {
      return;
    }
    if (isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    try {
      wsRef.current = new ChatWebSocket({
        websiteCode: websiteId,
        apiBaseUrl,
        sessionId: sessionId || "",
        connectionTimeout,
        onMessage,
        onStatusChange: (status) => {
          setConnectionStatus(status);
          if (status === "connected" || status === "disconnected") {
            setReconnectInfo(null);
          }
        },
        onError: (err) => {
          log$6.debug("WebSocket error:", err.message);
        },
        onReconnectAttempt: setReconnectInfo
      });
      wsRef.current.setConversationId(conversationIdRef.current || "");
      log$6.debug("Connecting to WebSocket:", { websiteId, apiBaseUrl });
      await wsRef.current.connect();
    } finally {
      isConnectingRef.current = false;
    }
  }, [websiteId, apiBaseUrl, sessionId, onMessage, conversationIdRef, connectionTimeout]);
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);
  const sendQuery = useCallback((content, metadata = {}) => {
    if (wsRef.current) {
      wsRef.current.sendQuery(content, metadata);
    }
  }, []);
  const resetConnection = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.reset();
    }
  }, []);
  const isConnected = useCallback(() => {
    var _a;
    return ((_a = wsRef.current) == null ? void 0 : _a.isConnected()) || false;
  }, []);
  const setWebSocketConversationId = useCallback((conversationId) => {
    if (wsRef.current) {
      wsRef.current.setConversationId(conversationId || "");
    }
  }, []);
  useEffect(() => {
    if (autoConnect) {
      connect().catch((err) => {
        log$6.debug("Auto-connect failed:", err.message);
      });
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  return {
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect,
    disconnect,
    sendQuery,
    resetConnection,
    isConnected,
    setWebSocketConversationId
  };
};
const log$5 = createScopedLogger("bcHydration");
const PRODUCT_HYDRATE_KEYS = [
  "entityId",
  "name",
  "display_name",
  "product_line",
  "sku",
  "path",
  "url",
  "price",
  "imageUrl",
  "brandId",
  "brand",
  "defaultImage",
  "images"
];
const CATEGORY_HYDRATE_KEYS = [
  "entityId",
  "name",
  "path",
  "url",
  "imageUrl",
  "description"
];
function mergeEntityData(original, fetched, hydrateKeys) {
  if (!fetched) return original;
  if (!original) return fetched;
  const merged = { ...original };
  for (const key of hydrateKeys) {
    const originalValue = merged[key];
    const fetchedValue = fetched[key];
    const isOriginalEmpty = originalValue === null || originalValue === void 0 || typeof originalValue === "string" && originalValue.trim() === "" || typeof originalValue === "object" && originalValue !== null && Object.keys(originalValue).length === 0;
    if (isOriginalEmpty && fetchedValue !== void 0 && fetchedValue !== null) {
      merged[key] = fetchedValue;
    }
  }
  return merged;
}
const inFlightRequests = /* @__PURE__ */ new Map();
function buildRequestKey(url, websiteId, idKey, entityIds, hasToken, mode) {
  const sortedIds = [...entityIds].map(String).sort().join(",");
  return `${mode}|${url}|${websiteId}|${idKey}|${sortedIds}|${hasToken ? "tok" : "notok"}`;
}
async function fetchDataByIds(config, entityIds, endpoint, idKey, entityKey, directFetcher) {
  var _a;
  if (!entityIds || entityIds.length === 0) return [];
  const direct = config.directGraphQL;
  const useDirect = !!((direct == null ? void 0 : direct.enabled) && directFetcher);
  const proxyUrl = `${config.apiBaseUrl}${endpoint}`;
  const directToken = useDirect ? direct.getToken() ?? null : null;
  const graphqlToken = useDirect ? directToken : ((_a = config.getGraphQLToken) == null ? void 0 : _a.call(config)) ?? null;
  const url = useDirect ? direct.endpoint ?? "/graphql" : proxyUrl;
  const key = buildRequestKey(
    url,
    config.websiteId,
    idKey,
    entityIds,
    !!graphqlToken,
    useDirect ? "direct" : "proxy"
  );
  const existing = inFlightRequests.get(key);
  if (existing) return existing;
  const promise = (async () => {
    if (useDirect) {
      try {
        return await directFetcher(entityIds, {
          endpoint: direct.endpoint,
          getToken: direct.getToken
        });
      } catch (error) {
        log$5.warn("fetchDataByIds: direct request failed", endpoint, error);
        return [];
      }
    }
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (graphqlToken) {
        headers["X-Storefront-Token"] = graphqlToken;
      }
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          [idKey]: entityIds,
          website_code: config.websiteId,
          graphql_token: graphqlToken
        })
      });
      if (!response.ok) {
        log$5.warn("fetchDataByIds: HTTP", response.status, endpoint);
        return [];
      }
      const data = await response.json();
      return (data == null ? void 0 : data[entityKey]) || [];
    } catch (error) {
      log$5.warn("fetchDataByIds: request failed", endpoint, error);
      return [];
    }
  })();
  const tracked = promise.finally(() => {
    if (inFlightRequests.get(key) === tracked) {
      inFlightRequests.delete(key);
    }
  });
  inFlightRequests.set(key, tracked);
  return tracked;
}
async function hydrateProducts(config, products) {
  if (!products || products.length === 0) return [];
  if (config.hydrate === false) return products;
  const skusToFetch = products.map((p) => p["sku"]).filter(Boolean);
  if (skusToFetch.length === 0) return products;
  const fetchedProducts = await fetchDataByIds(
    config,
    skusToFetch,
    API_ENDPOINTS.BC_SEARCH_PRODUCTS,
    "skus",
    "products",
    (ids, options) => fetchProductsDirectGraphQL(ids.map(String), options)
  );
  const fetchedMap = /* @__PURE__ */ new Map();
  for (const product of fetchedProducts) {
    if (product.sku) {
      fetchedMap.set(product.sku, product);
    }
  }
  return products.map((original) => {
    const sku = original["sku"];
    const fetched = sku ? fetchedMap.get(sku) : void 0;
    const merged = mergeEntityData(original, fetched ?? null, PRODUCT_HYDRATE_KEYS);
    if (fetched) {
      if (!merged["image_url"] && fetched.imageUrl) {
        merged["image_url"] = fetched.imageUrl;
      }
      if (!merged["image_url"] && fetched["defaultImage"]) {
        const defaultImage = fetched["defaultImage"];
        if (defaultImage == null ? void 0 : defaultImage["url"]) {
          merged["image_url"] = defaultImage["url"];
        }
      }
      if (!merged["url"] && fetched.path) {
        merged["url"] = fetched.path;
      }
      if (!merged["product_line"] && fetched["brand"]) {
        const brand = fetched["brand"];
        if (typeof brand === "object" && brand !== null && "name" in brand) {
          merged["product_line"] = brand["name"];
        } else if (typeof brand === "string") {
          merged["product_line"] = brand;
        }
      }
      if (!merged["price"] && fetched["price"]) {
        const price = fetched["price"];
        if (typeof price === "object" && price !== null && "value" in price) {
          merged["price"] = price["value"];
        }
      }
      if (!merged["retail_price"] && fetched["price"]) {
        const price = fetched["price"];
        const retailPrice = price == null ? void 0 : price["retailPrice"];
        if (retailPrice == null ? void 0 : retailPrice["value"]) {
          merged["retail_price"] = retailPrice["value"];
        }
      }
    }
    return merged;
  });
}
async function hydrateCategories(config, categories) {
  if (!categories || categories.length === 0) return [];
  if (config.hydrate === false) return categories;
  const categoryIds = categories.map((c) => parseInt(String(c["id"] || c["entityId"]), 10)).filter(Boolean);
  if (categoryIds.length === 0) return [];
  const fetchedCategories = await fetchDataByIds(
    config,
    categoryIds,
    API_ENDPOINTS.BC_SEARCH_CATEGORIES,
    "category_ids",
    "categories",
    (ids, options) => fetchCategoriesDirectGraphQL(
      ids.map((id) => typeof id === "number" ? id : parseInt(String(id), 10)),
      options
    )
  );
  const fetchedMap = /* @__PURE__ */ new Map();
  for (const category of fetchedCategories) {
    if (category.entityId) {
      fetchedMap.set(category.entityId, category);
    }
  }
  return categories.map((original) => {
    const id = parseInt(String(original["id"] || original["entityId"]), 10);
    const fetched = id ? fetchedMap.get(id) : void 0;
    return mergeEntityData(original, fetched ?? null, CATEGORY_HYDRATE_KEYS);
  });
}
async function hydrateAlternativeProduct(config, alternative) {
  if (!alternative) return null;
  try {
    const hydrated = await hydrateProducts(config, [alternative]);
    return hydrated[0] || alternative;
  } catch {
    return alternative;
  }
}
async function hydrateCurrentProduct(config, currentProduct) {
  if (!currentProduct) return null;
  try {
    const hydrated = await hydrateProducts(config, [currentProduct]);
    return hydrated[0] || currentProduct;
  } catch {
    return currentProduct;
  }
}
const log$4 = createScopedLogger("productUrls");
async function fetchProductUrlsBySkus(skus, config) {
  if (!skus || skus.length === 0) return {};
  if (config.hydrate === false) return {};
  const endpoint = config.productHydrationEndpoint ? `/api/v1${config.productHydrationEndpoint}` : API_ENDPOINTS.BC_SEARCH_PRODUCTS;
  const products = await fetchDataByIds(
    config,
    skus,
    endpoint,
    "skus",
    "products",
    (ids, options) => fetchProductsDirectGraphQL(ids.map(String), options)
  );
  const urlMap = {};
  products.forEach((product) => {
    var _a;
    const productUrl = product["url"] ?? product["path"] ?? ((_a = product["custom_url"]) == null ? void 0 : _a["url"]);
    if (product["sku"] && productUrl) {
      urlMap[String(product["sku"])] = productUrl;
    }
  });
  const missingSkus = skus.filter((sku) => !urlMap[String(sku)]);
  if (missingSkus.length > 0) {
    log$4.warn("Product URLs not found for SKUs:", missingSkus);
  }
  return urlMap;
}
const log$3 = createScopedLogger("useBCChatHydration");
function getPageContext() {
  if (typeof window === "undefined") return "search";
  if (window.location.pathname.includes("/products/")) return "product";
  if (window.location.pathname.includes("/category/")) return "category";
  return "search";
}
function parseEntityId(source) {
  return parseInt(
    String(source["id"] ?? source["product_id"] ?? source["entityId"] ?? ""),
    10
  );
}
function matchById(source, candidates) {
  const id = parseEntityId(source);
  if (isNaN(id)) return void 0;
  return candidates.find(
    (c) => c["entityId"] === id || c["id"] === id || parseInt(String(c["id"]), 10) === id
  );
}
function mergeProduct(omniguideProduct, bcProduct) {
  const merged = {
    ...omniguideProduct,
    ...bcProduct,
    // Preserve Omniguide-specific fields
    score: omniguideProduct["score"],
    is_recommended: omniguideProduct["is_recommended"],
    llm_relevance: omniguideProduct["llm_relevance"],
    tag: omniguideProduct["tag"],
    url: (bcProduct == null ? void 0 : bcProduct["path"]) ?? (bcProduct == null ? void 0 : bcProduct["url"]) ?? omniguideProduct["url"] ?? omniguideProduct["path"],
    path: (bcProduct == null ? void 0 : bcProduct["path"]) ?? omniguideProduct["path"] ?? omniguideProduct["url"]
  };
  if (!merged["url"] && !merged["path"]) {
    const searchQuery = encodeURIComponent(String(merged["sku"] ?? merged["name"] ?? ""));
    merged["url"] = `/search.php?search_query=${searchQuery}`;
    merged["path"] = `/search.php?search_query=${searchQuery}`;
  }
  return merged;
}
function mergeCategory(omniguideCategory, bcCategory) {
  return {
    ...omniguideCategory,
    ...bcCategory,
    tag: omniguideCategory["tag"],
    url: (bcCategory == null ? void 0 : bcCategory["path"]) ?? (bcCategory == null ? void 0 : bcCategory["url"]) ?? omniguideCategory["url"] ?? omniguideCategory["path"],
    path: (bcCategory == null ? void 0 : bcCategory["path"]) ?? omniguideCategory["path"] ?? omniguideCategory["url"]
  };
}
function buildFallbackProductSource(product) {
  const data = { ...product };
  if (!data["url"] && !data["path"]) {
    const searchQuery = encodeURIComponent(String(data["sku"] ?? data["name"] ?? ""));
    data["url"] = `/search.php?search_query=${searchQuery}`;
    data["path"] = `/search.php?search_query=${searchQuery}`;
  }
  return { type: "product", data };
}
function useBCChatHydration({
  storefrontToken,
  setMessages,
  currentMessageIdRef,
  trackRecommendationProvided,
  api,
  redundantContentUrls
}) {
  const hydrateProducts2 = useCallback(async (products) => {
    const items = products;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true } : m
    ));
    try {
      const hydratedProducts = await api.fetchProductData(items, storefrontToken);
      const productSources = items.map((omniguideProduct) => ({
        type: "product",
        data: mergeProduct(omniguideProduct, matchById(omniguideProduct, hydratedProducts))
      }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...productSources], isLoadingSources: false } : m
      ));
      if (trackRecommendationProvided) {
        trackRecommendationProvided({
          messageId,
          recommendationType: "products",
          itemCount: items.length,
          context: getPageContext()
        });
      }
    } catch (err) {
      log$3.error("Failed to hydrate products:", err);
      const productSources = items.map(buildFallbackProductSource);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...productSources], isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, trackRecommendationProvided, api]);
  const hydrateCategories2 = useCallback(async (categories) => {
    const items = categories;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true } : m
    ));
    try {
      const hydratedCategories = await api.fetchCategoryData(items, storefrontToken);
      const categorySources = items.map((omniguideCategory) => ({
        type: "category",
        data: mergeCategory(omniguideCategory, matchById(omniguideCategory, hydratedCategories))
      }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...categorySources], isLoadingSources: false } : m
      ));
      if (trackRecommendationProvided) {
        trackRecommendationProvided({
          messageId,
          recommendationType: "categories",
          itemCount: items.length,
          context: getPageContext()
        });
      }
    } catch (err) {
      log$3.error("Failed to hydrate categories:", err);
      const categorySources = items.map((category) => ({ type: "category", data: category }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...categorySources], isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, trackRecommendationProvided, api]);
  const hydrateSources = useCallback(async (apiSources) => {
    const items = apiSources;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true, pendingSources: items } : m
    ));
    try {
      const productData = items.filter((s) => s["type"] === "product");
      const categoryData = items.filter((s) => s["type"] === "category");
      const contentDocuments = items.filter((s) => s["type"] === "content");
      const [products, categories, content] = await Promise.all([
        productData.length > 0 ? api.fetchProductData(productData, storefrontToken) : [],
        categoryData.length > 0 ? api.fetchCategoryData(categoryData, storefrontToken) : [],
        contentDocuments.length > 0 ? api.fetchContentData(contentDocuments) : []
      ]);
      const finalSources = items.map((source) => {
        const id = parseEntityId(source);
        switch (source["type"]) {
          case "product": {
            const product = products.find(
              (p) => p["entityId"] === id || p["id"] === id || parseInt(String(p["id"]), 10) === id
            );
            return product ? { type: "product", data: product } : null;
          }
          case "category": {
            const category = categories.find(
              (c) => c["entityId"] === id || c["id"] === id || parseInt(String(c["id"]), 10) === id
            );
            return category ? { type: "category", data: category } : null;
          }
          case "content": {
            const wpcontent = content.find((c) => c["id"] === id);
            return wpcontent ? { type: "content", data: wpcontent } : null;
          }
          default:
            return null;
        }
      }).filter(Boolean);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...finalSources], isLoadingSources: false } : m
      ));
    } catch (err) {
      log$3.error("Failed to hydrate sources:", err);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, api]);
  const hydrateDocumentation = useCallback((content) => {
    const messageId = currentMessageIdRef.current;
    const docs = content;
    if (!messageId || !docs || !Array.isArray(docs)) return;
    let contentSources = filterEmptyContent(docs.map((doc) => ({
      type: "content",
      data: {
        id: doc["id"],
        name: doc["title"] ?? doc["name"] ?? "",
        url: doc["url"],
        summary: doc["summary"] ?? "",
        image: doc["image"] ? { url: doc["image"], altText: doc["title"] ?? doc["name"] ?? "" } : null
      }
    })));
    if (redundantContentUrls == null ? void 0 : redundantContentUrls.length) {
      contentSources = filterRedundantContent(contentSources, redundantContentUrls);
    }
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...contentSources], isLoadingSources: false } : m
    ));
    if (trackRecommendationProvided) {
      trackRecommendationProvided({
        messageId,
        recommendationType: "content",
        itemCount: docs.length,
        context: "search"
      });
    }
  }, [setMessages, currentMessageIdRef, trackRecommendationProvided, redundantContentUrls]);
  return {
    hydrateProducts: hydrateProducts2,
    hydrateCategories: hydrateCategories2,
    hydrateSources,
    hydrateDocumentation
  };
}
function buildBCHydrationConfig(config, platformAdapter) {
  var _a;
  const readToken = () => platformAdapter.getCredentials()["graphQLToken"] ?? null;
  const direct = config.directGraphQL;
  const hydrate = Boolean(config.productHydrationEndpoint) || ((_a = platformAdapter == null ? void 0 : platformAdapter.getPlatformName) == null ? void 0 : _a.call(platformAdapter)) !== "generic";
  return {
    apiBaseUrl: config.apiBaseUrl,
    websiteId: config.websiteId,
    hydrate,
    getGraphQLToken: readToken,
    ...config.productHydrationEndpoint ? { productHydrationEndpoint: config.productHydrationEndpoint } : {},
    ...(direct == null ? void 0 : direct.enabled) ? {
      directGraphQL: {
        enabled: true,
        endpoint: direct.endpoint,
        getToken: direct.getToken ?? readToken
      }
    } : {}
  };
}
const log$2 = createScopedLogger("useBCSearchChat");
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
function useBCSearchChat({
  trackMessageSent,
  trackQuestionAnswered,
  trackRecommendationProvided,
  trackStartOver,
  autoConnect = true,
  sessionId: externalSessionId
} = {}) {
  var _a;
  const { config, platformAdapter } = useOmniguideContext();
  const { websiteId, apiBaseUrl, storageKeys, connectionTimeout } = config;
  const conversationStorageKey2 = (storageKeys == null ? void 0 : storageKeys.conversationId) ?? "aiSearchConversationId";
  const sessionStorageKey = (storageKeys == null ? void 0 : storageKeys.sessionId) ?? "aiSearchSessionId";
  const [pipelineStatus, setPipelineStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId$1] = useState(() => {
    return getConversationId(websiteId) ?? localStorage.getItem(conversationStorageKey2) ?? null;
  });
  const [sessionId, setSessionId2] = useState(() => {
    return localStorage.getItem(sessionStorageKey) ?? null;
  });
  const [error, setError] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [pendingIntentQuestion, setPendingIntentQuestion] = useState(null);
  const [pendingClarificationQuestion, setPendingClarificationQuestion] = useState(null);
  const currentMessageIdRef = useRef(null);
  const conversationIdRef = useRef(conversationId);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  useEffect(() => {
    conversationIdRef.current = conversationId;
    setConversationId(websiteId, conversationId);
    if (conversationId) {
      localStorage.setItem(conversationStorageKey2, conversationId);
    } else {
      localStorage.removeItem(conversationStorageKey2);
    }
  }, [conversationId, conversationStorageKey2, websiteId]);
  const hydrationConfig = useMemo(
    () => buildBCHydrationConfig(config, platformAdapter),
    [config, platformAdapter]
  );
  const api = useMemo(() => ({
    fetchProductData: (products) => hydrateProducts(hydrationConfig, products),
    fetchCategoryData: (categories) => hydrateCategories(hydrationConfig, categories),
    fetchContentData: async (content) => {
      if (!content || content.length === 0) return [];
      return filterEmptyContent(
        content.map((article) => ({
          id: article["id"],
          name: article["title"] || "",
          url: article["url"],
          summary: article["summary"] ? transformSummary(article["summary"]) : "",
          image: { url: article["image"], altText: article["name"] }
        }))
      );
    }
  }), [hydrationConfig]);
  const storefrontToken = platformAdapter.getCredentials()["storefrontToken"] ?? "";
  const hydration = useBCChatHydration({
    storefrontToken,
    setMessages,
    currentMessageIdRef,
    trackRecommendationProvided,
    api,
    redundantContentUrls: (_a = config.ui) == null ? void 0 : _a.redundantContentUrls
  });
  const { handleMessage, startResponseTimer, resetStreamingState } = useChatMessageHandler({
    websiteId,
    setMessages,
    setIsLoading,
    setPipelineStatus,
    setIsThinking,
    setIsTimedOut,
    setError,
    setConversationId: setConversationId$1,
    setSessionId: setSessionId2,
    setPendingIntentQuestion,
    setPendingClarificationQuestion,
    currentMessageIdRef,
    hydration,
    query,
    messages,
    buildFallbackSearchUrl: (q) => `/search.php?search_query=${encodeURIComponent(q)}`
  });
  const {
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect,
    disconnect,
    sendQuery,
    resetConnection,
    isConnected,
    setWebSocketConversationId
  } = useChatConnection({
    websiteId,
    apiBaseUrl,
    sessionId: externalSessionId ?? localStorage.getItem(sessionStorageKey) ?? void 0,
    onMessage: handleMessage,
    conversationIdRef,
    autoConnect,
    connectionTimeout
  });
  useEffect(() => {
    setWebSocketConversationId(conversationId);
  }, [conversationId, setWebSocketConversationId]);
  const sendMessage = useCallback(
    async (content, metadata = {}) => {
      if (!(content == null ? void 0 : content.trim())) return;
      if (!isConnected()) {
        try {
          await connect();
        } catch (err) {
          log$2.error("Failed to connect WebSocket:", err);
          setError("Unable to connect. Please try again.");
          return;
        }
      }
      const userMessages = messagesRef.current.filter(
        (m) => m.role === "user"
      );
      const isFollowUp = userMessages.length > 0;
      const turnNumber = userMessages.length + 1;
      trackMessageSent == null ? void 0 : trackMessageSent({
        messageLength: content.trim().length,
        isFollowUp,
        turnNumber
      });
      resetStreamingState();
      setPendingIntentQuestion(null);
      setPendingClarificationQuestion(null);
      setError(null);
      setIsLoading(true);
      setIsThinking(false);
      setIsTimedOut(false);
      startResponseTimer();
      const userMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: /* @__PURE__ */ new Date()
      };
      const assistantMessageId = generateId();
      currentMessageIdRef.current = assistantMessageId;
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: /* @__PURE__ */ new Date(),
        isStreaming: true,
        sources: [],
        queryContext: content.trim(),
        suggestions: []
      };
      setMessages((prev) => [assistantMessage, userMessage, ...prev]);
      try {
        sendQuery(content.trim(), metadata);
      } catch (err) {
        log$2.error("Failed to send message:", err);
        setError("Failed to send message");
        setIsLoading(false);
        setMessages(
          (prev) => prev.filter((m) => m.id !== assistantMessageId)
        );
      }
    },
    [
      isConnected,
      connect,
      sendQuery,
      trackMessageSent,
      resetStreamingState,
      startResponseTimer
    ]
  );
  const sendIntentAnswer = useCallback(
    (answerText, answerId, options = {}) => {
      var _a2;
      const question = pendingIntentQuestion;
      const isDiscoveryQuestion = question == null ? void 0 : question["_isDiscoveryQuestion"];
      const questionId = (question == null ? void 0 : question["question_id"]) ?? (question == null ? void 0 : question["id"]);
      if (questionId) {
        try {
          const storageKey = ((_a2 = config.storageKeys) == null ? void 0 : _a2.answeredIntents) ?? "aiAnsweredIntents";
          const raw = localStorage.getItem(storageKey);
          const currentIntents = raw ? JSON.parse(raw) : {};
          if (isDiscoveryQuestion) {
            currentIntents[questionId] = {
              question_id: questionId,
              answer_id: answerId,
              answer_text: answerText,
              is_other: options.isOtherAnswer || false,
              other_text: options.otherAnswerText
            };
          } else {
            currentIntents[questionId] = {
              answer_id: answerId,
              answer: answerText
            };
          }
          localStorage.setItem(storageKey, JSON.stringify(currentIntents));
        } catch (e) {
          log$2.warn("Failed to save answered intent:", e);
        }
      }
      if (trackQuestionAnswered && question) {
        trackQuestionAnswered({
          questionId,
          questionText: question["question_text"] ?? question["question"] ?? "",
          answer: answerText,
          context: isDiscoveryQuestion ? "discovery" : "intent"
        });
      }
      if (isDiscoveryQuestion) {
        const metadata = {
          discovery_answer_id: answerId,
          discovery_question_id: questionId
        };
        if (options.isOtherAnswer) {
          metadata["is_other_answer"] = true;
          metadata["other_answer_text"] = options.otherAnswerText || answerText;
        }
        sendMessage(answerText, metadata);
      } else {
        sendMessage(answerText, { intent_question_answer_id: answerId });
      }
    },
    [sendMessage, pendingIntentQuestion, trackQuestionAnswered, config.storageKeys]
  );
  const sendClarificationAnswer = useCallback(
    (answerText, optionId, paramName) => {
      const question = pendingClarificationQuestion;
      if (trackQuestionAnswered && question) {
        trackQuestionAnswered({
          questionId: question["id"] ?? paramName,
          questionText: question["question_text"] ?? question["question"] ?? "",
          answer: answerText,
          context: "clarification"
        });
      }
      sendMessage(answerText, { [paramName]: optionId });
    },
    [sendMessage, pendingClarificationQuestion, trackQuestionAnswered]
  );
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  const handleResetChat = useCallback(() => {
    if (trackStartOver) {
      trackStartOver({
        context: window.location.pathname.includes("/products/") ? "product" : window.location.pathname.includes("/category/") ? "category" : "search",
        messageCount: messagesRef.current.length
      });
    }
    setMessages([]);
    setConversationId$1(null);
    setQuery("");
    setPendingIntentQuestion(null);
    setPendingClarificationQuestion(null);
    setError(null);
    currentMessageIdRef.current = null;
    resetStreamingState();
    resetConnection();
  }, [trackStartOver, resetStreamingState, resetConnection]);
  return {
    // Connection state
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    pipelineStatus,
    isConnected: connectionStatus === "connected",
    // Chat state
    messages,
    query,
    setQuery,
    isLoading,
    conversationId,
    sessionId,
    error,
    // Latency states (Non-Negotiable #4)
    isThinking,
    isTimedOut,
    // Intent questions
    pendingIntentQuestion,
    // Clarification questions
    pendingClarificationQuestion,
    // Actions
    connect,
    disconnect,
    sendMessage,
    sendIntentAnswer,
    sendClarificationAnswer,
    handleResetChat,
    clearError,
    // Compatibility
    fetchResults: sendMessage
  };
}
const log$1 = createScopedLogger("useAnalyticsTracking");
function useAnalyticsTracking({
  websiteId
}) {
  const { config, consentService, eventService } = useOmniguideContext();
  const hasProductClickRef = useRef(false);
  const isDebug = typeof window !== "undefined" && (() => {
    try {
      return localStorage.getItem("omniguide_debug_tracking") === "true";
    } catch {
      return false;
    }
  })();
  const canTrack = useCallback((eventName) => {
    const state = consentService ? consentService.getState() : null;
    const hasConsent = state ? state.analytics : true;
    if (hasConsent) {
      if (isDebug && eventName) {
        console.log(`[Omniguide Tracking] BACKEND OK "${eventName}" | consent: initialized=${state == null ? void 0 : state.initialized} websiteConsent=${state == null ? void 0 : state.websiteConsent} omniguideConsent=${state == null ? void 0 : state.omniguideConsent}`);
      }
      return true;
    }
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      try {
        if (localStorage.getItem("ai-debug") === "true") {
          log$1.debug("canTrack: consent=NO but bypassed (localhost + ai-debug)");
          return true;
        }
      } catch {
      }
    }
    if (isDebug && eventName) {
      console.warn(`[Omniguide Tracking] BACKEND BLOCKED "${eventName}" | consent: initialized=${state == null ? void 0 : state.initialized} websiteConsent=${state == null ? void 0 : state.websiteConsent} omniguideConsent=${state == null ? void 0 : state.omniguideConsent}`);
    }
    return false;
  }, [consentService, isDebug]);
  const track = useCallback((eventName, payload = {}) => {
    if (!config.analyticsAdapter) {
      if (isDebug) console.warn(`[Omniguide Tracking] ADAPTER SKIP "${eventName}" | no analyticsAdapter configured`);
      return;
    }
    const fullPayload = {
      timestamp: Date.now(),
      session_id: getSessionId(websiteId),
      conversation_id: getConversationId(websiteId),
      ...payload
    };
    if (isDebug) console.log(`[Omniguide Tracking] ADAPTER "${eventName}" -> dataLayer + PostHog`);
    config.analyticsAdapter.track(eventName, fullPayload);
  }, [config.analyticsAdapter, websiteId, isDebug]);
  const sessionId = getSessionId(websiteId);
  const conversationId = getConversationId(websiteId);
  useEffect(() => {
    if (!eventService) return;
    eventService.updateContext({
      sessionId: sessionId ?? void 0,
      conversationId: conversationId ?? void 0
    });
  }, [eventService, sessionId, conversationId]);
  const trackBackend = useCallback((eventName, data) => {
    if (!canTrack(eventName)) return;
    if (!eventService) {
      if (isDebug) console.warn(`[Omniguide Tracking] BACKEND SKIP "${eventName}" | no eventService`);
      return;
    }
    eventService.track(eventName, data);
  }, [canTrack, eventService, isDebug]);
  const getJourneyMetrics = useCallback(() => {
    const sessionStart = getSessionStart(websiteId) || Date.now();
    const timeInConversation = Math.round((Date.now() - sessionStart) / 1e3);
    return {
      time_in_conversation_sec: timeInConversation,
      has_clicked_product: hasProductClickRef.current
    };
  }, [websiteId]);
  const buildAnalyticsProperties = useCallback((baseProps) => {
    return {
      ...baseProps,
      conversation_id: getConversationId(websiteId),
      session_id: getSessionId(websiteId),
      ...getJourneyMetrics()
    };
  }, [getJourneyMetrics, websiteId]);
  const trackMessageSent = useCallback(
    ({ messageLength, isFollowUp, turnNumber, context, messageType }) => {
      const data = {
        message_length: messageLength,
        is_followup: isFollowUp,
        turn_number: turnNumber,
        context,
        message_type: messageType
      };
      trackBackend("ai_search_message_sent", data);
      track("ai_search_message_sent", data);
    },
    [trackBackend, track]
  );
  const trackProductClick = useCallback(
    ({ messageId, productId, productSku, position, queryContext }) => {
      hasProductClickRef.current = true;
      track("ai_search_product_click", buildAnalyticsProperties({
        message_id: messageId,
        product_id: productId,
        product_sku: productSku,
        position,
        query: queryContext
      }));
    },
    [buildAnalyticsProperties, track]
  );
  const trackCategoryClick = useCallback(
    ({ messageId, categoryId, name, url, position, queryContext }) => {
      hasProductClickRef.current = true;
      const backendData = {
        message_id: messageId,
        category_id: categoryId,
        category_name: name,
        category_url: url,
        category_position: position,
        query_context: queryContext
      };
      trackBackend("ai_search_category_click", backendData);
      track("ai_search_category_click", buildAnalyticsProperties({
        message_id: messageId,
        category_id: categoryId,
        category_name: name,
        category_url: url,
        position,
        query: queryContext
      }));
    },
    [trackBackend, buildAnalyticsProperties, track]
  );
  const trackContentClick = useCallback(
    ({ messageId, contentId, title, url, position, queryContext }) => {
      hasProductClickRef.current = true;
      const backendData = {
        message_id: messageId,
        content_id: contentId,
        content_title: title,
        content_url: url,
        content_position: position,
        query_context: queryContext
      };
      trackBackend("ai_search_content_click", backendData);
      track("ai_search_content_click", buildAnalyticsProperties({
        message_id: messageId,
        content_id: contentId,
        content_title: title,
        content_url: url,
        position,
        query: queryContext
      }));
    },
    [trackBackend, buildAnalyticsProperties, track]
  );
  const trackFeedback = useCallback(
    ({ messageId, feedbackType, turnNumber }) => {
      const data = {
        message_id: messageId,
        feedback_type: feedbackType,
        conversation_turn: turnNumber
      };
      trackBackend("ai_search_feedback", data);
      track("ai_search_feedback", data);
    },
    [trackBackend, track]
  );
  const trackComponentClose = useCallback(
    ({ sessionDurationMs, totalMessages }) => {
      const durationSeconds = Math.round(sessionDurationMs / 1e3);
      const data = {
        session_duration_ms: sessionDurationMs,
        session_duration: durationSeconds,
        message_count: totalMessages,
        product_clicked: hasProductClickRef.current
      };
      trackBackend("ai_search_closed", data);
      track("ai_search_closed", data);
      hasProductClickRef.current = false;
    },
    [trackBackend, track]
  );
  const trackSearchOpened = useCallback(
    ({ source, page_type }) => {
      const data = { source, page_type };
      trackBackend("ai_search_opened", data);
      track("ai_search_opened", data);
    },
    [trackBackend, track]
  );
  const trackQuestionAnswered = useCallback(
    ({ questionId, questionText, answer, context }) => {
      const data = {
        question_id: questionId,
        question_text: questionText,
        answer,
        context
      };
      trackBackend("ai_search_question_answered", data);
      track("ai_search_question_answered", data);
    },
    [trackBackend, track]
  );
  const trackRecommendationProvided = useCallback(
    ({ messageId, recommendationType, itemCount, context }) => {
      const data = {
        message_id: messageId,
        recommendation_type: recommendationType,
        item_count: itemCount,
        context
      };
      trackBackend("ai_search_recommendation_provided", data);
      track("ai_search_recommendation_provided", data);
    },
    [trackBackend, track]
  );
  const trackStartOver = useCallback(
    ({ context, messageCount }) => {
      const data = { context, message_count: messageCount };
      trackBackend("ai_search_start_over", data);
      track("ai_search_start_over", data);
    },
    [trackBackend, track]
  );
  const trackScrollForMore = useCallback(
    ({ messageId }) => {
      const data = { message_id: messageId };
      trackBackend("scroll_for_more", data);
      track("scroll_for_more", data);
    },
    [trackBackend, track]
  );
  const trackScrollStarted = useCallback(
    ({ messageId }) => {
      const data = { message_id: messageId };
      trackBackend("chat_with_scroll_for_more_scrolled", data);
      track("chat_with_scroll_for_more_scrolled", data);
    },
    [trackBackend, track]
  );
  const trackProductRecClick = useCallback(
    ({ productName, productSku, productUrl }) => {
      track("product_rec_product_click", {
        product_name: productName,
        product_sku: productSku,
        product_url: productUrl
      });
    },
    [track]
  );
  const trackProductRecStartOver = useCallback(
    () => {
      trackBackend("product_rec_start_over", {});
      track("product_rec_start_over", {});
    },
    [trackBackend, track]
  );
  const trackCategoryRecClick = useCallback(
    ({ productName, productSku, productUrl, position }) => {
      track("category_rec_product_click", {
        product_name: productName,
        product_sku: productSku,
        product_url: productUrl,
        product_position: position
      });
    },
    [track]
  );
  const trackCategoryRecStartOver = useCallback(
    () => {
      trackBackend("category_rec_start_over", {});
      track("category_rec_start_over", {});
    },
    [trackBackend, track]
  );
  const trackRecProductClick = useCallback(
    ({ sku, recSource, recPageArea, recPosition, messageId, productName, productUrl }) => {
      const data = {
        sku,
        rec_source: recSource,
        rec_page_area: recPageArea,
        rec_position: recPosition,
        message_id: messageId,
        product_name: productName,
        product_url: productUrl
      };
      trackBackend("rec_product_clicked", data);
      track("rec_product_clicked", data);
      if (sku) {
        try {
          const key = "omniguide_rec_clicks";
          const existing = JSON.parse(sessionStorage.getItem(key) || "[]");
          existing.push({ sku, rec_source: recSource, rec_page_area: recPageArea, timestamp: Date.now(), message_id: messageId });
          sessionStorage.setItem(key, JSON.stringify(existing.slice(-50)));
        } catch {
        }
      }
    },
    [trackBackend, track]
  );
  const trackInlineProductLink = useCallback(
    ({ sku, productUrl, messageId, recPageArea, queryContext }) => {
      track("ai_chat_inline_product_click", {
        sku,
        product_url: productUrl,
        message_id: messageId,
        rec_page_area: recPageArea,
        query_context: queryContext
      });
      trackRecProductClick({
        sku,
        recSource: "chat_msg",
        recPageArea,
        messageId,
        productUrl
      });
    },
    [track, trackRecProductClick]
  );
  return {
    trackMessageSent,
    trackProductClick,
    trackCategoryClick,
    trackContentClick,
    trackFeedback,
    trackComponentClose,
    trackSearchOpened,
    trackQuestionAnswered,
    trackRecommendationProvided,
    trackStartOver,
    trackScrollForMore,
    trackScrollStarted,
    trackProductRecClick,
    trackProductRecStartOver,
    trackCategoryRecClick,
    trackCategoryRecStartOver,
    trackRecProductClick,
    trackInlineProductLink
  };
}
function useUserConsent() {
  var _a;
  const { config, consentService } = useOmniguideContext();
  const getState = useCallback(() => {
    if (!consentService) {
      return {
        analytics: true,
        advertising: true,
        initialized: true,
        websiteConsent: true,
        omniguideConsent: true
      };
    }
    return consentService.getState();
  }, [consentService]);
  const [state, setState] = useState(getState);
  const refreshState = useCallback(() => {
    setState(getState());
  }, [getState]);
  useEffect(() => {
    var _a2;
    if (!((_a2 = config.consent) == null ? void 0 : _a2.enabled)) return;
    const handleConsentChange = () => {
      consentService == null ? void 0 : consentService.syncFromCookie();
      refreshState();
    };
    window.addEventListener("consent-state-changed", handleConsentChange);
    const id = setInterval(refreshState, 52e4);
    return () => {
      window.removeEventListener("consent-state-changed", handleConsentChange);
      clearInterval(id);
    };
  }, [(_a = config.consent) == null ? void 0 : _a.enabled, refreshState, consentService]);
  return {
    analytics: state.analytics,
    advertising: state.advertising,
    initialized: state.initialized,
    canTrack: consentService ? consentService.canSendAnalytics() : true,
    websiteConsent: state.websiteConsent,
    omniguideConsent: state.omniguideConsent
  };
}
const log = createScopedLogger("useFeedbackWidget");
const VALID_ENTITY_TYPES = ["message", "product_recommendation", "category_recommendation"];
function isEntityType(value) {
  return VALID_ENTITY_TYPES.includes(value);
}
function isVote(value) {
  return value === 1 || value === -1;
}
function useFeedbackWidget(options) {
  const { feedbackApi } = useOmniguideContext();
  const onFeedbackSubmitted = options == null ? void 0 : options.onFeedbackSubmitted;
  return useCallback(
    function FeedbackWidget(props) {
      const handleFeedbackSubmit = async (data) => {
        if (!feedbackApi) throw new Error("Feedback API not available");
        if (!isEntityType(data.entity_type)) {
          throw new Error(`Invalid entity_type: "${data.entity_type}"`);
        }
        if (!isVote(data.vote)) {
          throw new Error(`Invalid vote value: ${data.vote}`);
        }
        const result = await feedbackApi.submitFeedback({
          entityId: data.entity_id,
          entityType: data.entity_type,
          vote: data.vote,
          comment: data.comment ?? "",
          context: data.context ?? {}
        });
        onFeedbackSubmitted == null ? void 0 : onFeedbackSubmitted({
          entityId: data.entity_id,
          entityType: data.entity_type,
          vote: data.vote
        });
        return result;
      };
      if (!isEntityType(props.entityType)) {
        log.error(`Invalid entityType prop: "${props.entityType}"`);
        return null;
      }
      return /* @__PURE__ */ React.createElement(
        DiscoveryFeedbackWidget,
        {
          ...props,
          entityType: props.entityType,
          onSubmit: handleFeedbackSubmit
        }
      );
    },
    [feedbackApi, onFeedbackSubmitted]
  );
}
function buildConfig(userConfig) {
  const apiBaseUrl = getApiBaseUrl(userConfig.apiBaseUrl);
  return {
    websiteId: userConfig.websiteId,
    apiBaseUrl,
    aiSearchStoreUrl: userConfig.aiSearchStoreUrl,
    features: {
      search: true,
      productFit: true,
      categoryGuide: true,
      discoveryQuestions: true,
      ...userConfig.features
    },
    selectors: userConfig.selectors,
    fallbackImages: userConfig.fallbackImages,
    ui: userConfig.ui,
    callbacks: userConfig.callbacks,
    analyticsAdapter: userConfig.analyticsAdapter,
    consent: userConfig.consent,
    storageKeys: userConfig.storageKeys ?? DEFAULT_STORAGE_KEYS,
    categoryUrl: userConfig.categoryUrl,
    connectionTimeout: userConfig.connectionTimeout,
    currentPage: userConfig.currentPage,
    productHydrationEndpoint: userConfig.productHydrationEndpoint,
    categoryHydrationEndpoint: userConfig.categoryHydrationEndpoint
  };
}
function buildPlatformAdapter(userConfig) {
  const platform = userConfig.platform ?? "bigcommerce";
  if (platform === "generic") {
    const productSku = userConfig.productSku ?? null;
    return createPlatformAdapter({
      getPlatformName: () => "generic",
      isInitialized: () => true,
      getProductSku: () => productSku
    });
  }
  const apiBaseUrl = getApiBaseUrl(userConfig.apiBaseUrl);
  return createBigCommerceAdapter({
    apiBaseUrl,
    websiteId: userConfig.websiteId,
    productHydrationEndpoint: userConfig.productHydrationEndpoint,
    categoryHydrationEndpoint: userConfig.categoryHydrationEndpoint
  });
}
export {
  getSessionId as A,
  BaseWebSocket as B,
  AnsweredIntentsStorage as C,
  DiscoveryFeedbackWidget as D,
  DiscoveryStarRating as E,
  FLOW_STATES as F,
  safeHref as G,
  hydrateProducts as H,
  purify as I,
  setSessionId as J,
  getCurrentPage as K,
  LocalStorageAdapter as L,
  API_ENDPOINTS as M,
  normalizeSessionResponse as N,
  OmniguideProvider as O,
  RestSessionResponseSchema as P,
  setFeatureStatus as Q,
  ReviewInsightsToggle as R,
  SearchPrivacySettings as S,
  RestQuestionsResponseSchema as T,
  DiscoveryAutocomplete as U,
  DiscoveryOptionButton as V,
  getFeatureStatus as W,
  onFeatureStatusChange as X,
  useChatNavigation as a,
  buildSafeUrl as b,
  SearchChatInput as c,
  SearchChatPanel as d,
  useOmniguideContext as e,
  useAnalyticsTracking as f,
  useFeedbackWidget as g,
  useBCSearchChat as h,
  isValidNavigationUrl as i,
  useUserConsent as j,
  buildBCHydrationConfig as k,
  fetchProductUrlsBySkus as l,
  setSessionStart as m,
  emitRecommendations as n,
  createScopedLogger as o,
  buildConfig as p,
  buildPlatformAdapter as q,
  getWebSocketBaseUrl as r,
  safeNavigate as s,
  transformSummary as t,
  useComponent as u,
  parseMarkdownToHtml as v,
  logger as w,
  normalizeQuestions as x,
  hydrateAlternativeProduct as y,
  hydrateCurrentProduct as z
};
//# sourceMappingURL=shared-B9CqjVZQ.js.map
