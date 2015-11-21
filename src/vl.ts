import * as vlBin from './bin';
import * as vlChannel from './channel';
import * as vlData from './data';
import * as vlEncoding from './encoding';
import * as vlFieldDef from './fielddef';
import * as vlCompiler from './compiler/compiler';
import * as vlSchema from './schema/schema';
import * as vlShorthand from './shorthand';
import * as vlSpec from './spec';
import * as vlTimeUnit from './timeunit';
import * as vlType from './type';
import * as vlValidate from './validate';

// TODO: remove this
import {format as d3Format} from 'd3-format';

export * from './util';

export var bin = vlBin;
export var channel = vlChannel;
export var compiler = vlCompiler;
export var compile = vlCompiler.compile;
export var data = vlData;
// TODO(#727) rename to encoding
export var encoding = vlEncoding;
export var fieldDef = vlFieldDef;
export var schema = vlSchema;
export var shorthand = vlShorthand;
export var spec = vlSpec;
export var timeUnit = vlTimeUnit;
export var type = vlType;
export var format = d3Format;
export var validate = vlValidate;

export const version = '__VERSION__';
