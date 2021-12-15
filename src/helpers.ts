import pluralize from 'pluralize';
import { camelCase, capitalCase, pascalCase, sentenceCase } from 'change-case';
import { v4 as uuidv4 } from 'uuid';

export default {
  'pluralize': (input: any) => pluralize(input),
  'capitalcase': (input: any) => capitalCase(input),
  'sentencecase': (input: any) => sentenceCase(input),
  'camelcase': (input: any) => camelCase(input),
  'pascalcase': (input: any) => pascalCase(input),
  'uuidv4': () => uuidv4(),
};
