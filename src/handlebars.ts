import _ from 'lodash';
import handlebars, { HelperDelegate } from 'handlebars';
import providedHelpers from './helpers';

registerHandlebarsHelpers(providedHelpers);

export function registerHandlebarsHelpers(helpers: Record<string, HelperDelegate>) {
  _.each(helpers, (func, key) => {
    handlebars.registerHelper(key, func);
  });
}

export default handlebars;
