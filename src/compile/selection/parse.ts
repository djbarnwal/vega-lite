import {selector as parseSelector} from 'vega-event-selector';
import {isString} from 'vega-util';
import {SelectionComponent, SelectionAggregate} from '.';
import {SelectionDef} from '../../selection';
import {Dict, duplicate, varName} from '../../util';
import {UnitModel} from '../unit';
import {forEachTransform} from './transforms/transforms';
import {CONDITION_CHANNELS, ConditionChannel} from '../../channel';
import {
  isSelectionComparisonPredicate,
  SelectionComparisonPredicate,
  getComparisonOperator,
  ComparisonOp,
  DEFAULT_AGGREGATE,
  Predicate
} from '../../predicate';
import {forEachLeaf, LogicalOperand} from '../../logical';
// import {isFilter} from '../../transform';

function parseEachSelectionAggregate(
  logicalPredicate: LogicalOperand<Predicate>,
  selectionAggregates: SelectionAggregate[]
) {
  forEachLeaf(logicalPredicate, predicate => {
    if (isSelectionComparisonPredicate(predicate)) {
      const comparisonSpec = Object.values(predicate)[0] as SelectionComparisonPredicate;
      const operator = getComparisonOperator(Object.keys(comparisonSpec)) as ComparisonOp;
      const selection = varName(comparisonSpec[operator]);
      const sfield = comparisonSpec.field;
      const aggregate = comparisonSpec.aggregate ? comparisonSpec.aggregate : DEFAULT_AGGREGATE;
      const hasSelection = selectionAggregates.filter(s => s.selection === selection);

      if (hasSelection.length) {
        const aggFieldType = hasSelection[0].aggregates;
        if (aggFieldType.findIndex(t => t.sfield === sfield && t.op === aggregate) === -1) {
          aggFieldType.push({sfield, op: aggregate});
        }
      } else {
        selectionAggregates.push({selection, aggregates: [{sfield, op: aggregate}]});
      }
    }
  });
}

function parseUnitSelectionComparisonTest(model: UnitModel, selCmpts: Dict<SelectionComponent>) {
  const {encoding} = model;
  const selectionAggregates: SelectionAggregate[] = [];

  // Comparison Selection on encoding channels
  CONDITION_CHANNELS.forEach((channel: ConditionChannel) => {
    const channelDef = encoding[channel];
    if (channelDef && channelDef['condition'] && channelDef['condition']['test']) {
      const logicalPredicate = channelDef['condition']['test'];
      parseEachSelectionAggregate(logicalPredicate, selectionAggregates);
    }
  });

  // PROBLEM

  // Second pass doesn't get the selCmpts..

  // // on filter transform
  // for (const t of model.transforms) {
  //   if (isFilter(t)) {
  //     const logicalPredicate = t.filter;
  //     parseEachSelectionAggregate(logicalPredicate, selectionAggregates);
  //   }
  // }

  // console.log(selectionAggregates);
  if (selectionAggregates.length) {
    selectionAggregates.forEach(a => {
      selCmpts[a.selection].aggregates = a.aggregates;
    });
  }
  return selCmpts;
}

export function parseUnitSelection(model: UnitModel, selDefs: Dict<SelectionDef>) {
  const selCmpts: Dict<SelectionComponent<any /* this has to be "any" so typing won't fail in test files*/>> = {};
  const selectionConfig = model.config.selection;

  if (selDefs) {
    selDefs = duplicate(selDefs); // duplicate to avoid side effects to original spec
  }

  for (let name in selDefs) {
    if (!selDefs.hasOwnProperty(name)) {
      continue;
    }

    const selDef = selDefs[name];
    const {fields, encodings, ...cfg} = selectionConfig[selDef.type]; // Project transform applies its defaults.

    // Set default values from config if a property hasn't been specified,
    // or if it is true. E.g., "translate": true should use the default
    // event handlers for translate. However, true may be a valid value for
    // a property (e.g., "nearest": true).
    for (const key in cfg) {
      // A selection should contain either `encodings` or `fields`, only use
      // default values for these two values if neither of them is specified.
      if ((key === 'encodings' && selDef.fields) || (key === 'fields' && selDef.encodings)) {
        continue;
      }

      if (key === 'mark') {
        selDef[key] = {...cfg[key], ...selDef[key]};
      }

      if (selDef[key] === undefined || selDef[key] === true) {
        selDef[key] = cfg[key] || selDef[key];
      }
    }

    name = varName(name);
    const selCmpt = (selCmpts[name] = {
      ...selDef,
      name: name,
      events: isString(selDef.on) ? parseSelector(selDef.on, 'scope') : selDef.on
    } as any);

    forEachTransform(selCmpt, txCompiler => {
      if (txCompiler.parse) {
        txCompiler.parse(model, selDef, selCmpt);
      }
    });
  }

  parseUnitSelectionComparisonTest(model, selCmpts);

  return selCmpts;
}
