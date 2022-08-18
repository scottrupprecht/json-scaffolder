#!/usr/bin/env node
import _ from 'lodash';
import getAppDataPath from 'appdata-path';
import inquirer from 'inquirer';
import glob from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { TemplateDelegate } from 'handlebars';

import Handlebars, { registerHandlebarsHelpers } from './handlebars';
import providedLibs from './libs';
import providedHelpers from './helpers';
import {
  AllFilesParams,
  AppConfig,
  AppDefaults,
  Manifest,
  ManifestDto,
  ManifestTemplate,
  ParsedJsonInput,
} from './models';

type HandlerParams = (
  templatePath: string,
  templateHelpers: Record<string,
    TemplateDelegate>,
  jsonInput: any,
  jsonInputs: any[]
) => string;

const templateHandlerMap: Record<string, HandlerParams> = {
  '.js': (templatePath, helpers, jsonInput, jsonInputs) => {
    return require(templatePath)({ ...jsonInput, helpers, libs: providedLibs, jsonInputs });
  },
  '.hbs': (templatePath, helpers, jsonInput, jsonInputs) => {
    registerHandlebarsHelpers(helpers);
    return Handlebars.compile(fs.readFileSync(templatePath, 'utf-8'))({ ...jsonInput, jsonInputs });
  },
};

(async () => {
  const { templatesDirectoryPath, inputDirectoryPath, outputDirectoryPath } = await getAppConfig();
  const jsonInputPaths = loadJsonInputs(inputDirectoryPath);
  const manifest = await loadManifest(templatesDirectoryPath);
  const templatesToRun = await promptTemplatesToRun(manifest);
  const helpers = getHelpersForTemplate(manifest.manifestPath);

  const jsonInputPathsToCreate = await promptJsonInputPathsToCreate(jsonInputPaths);
  const jsonInputs = jsonInputPaths.map(parsedJsonInput => parsedJsonInput.parsedData);

  for (const jsonInputPath of jsonInputPaths) {
    const jsonInput = jsonInputPath.parsedData;
    for (const template of templatesToRun) {
      if(template.promptBeforeProcessing) {
        const { shouldProcessTemplateForJsonInput } = await inquirer.prompt({
          type: 'confirm',
          name: 'shouldProcessTemplateForJsonInput',
          message: `Would you like to run the ${path.basename(template.resolvedTemplatePath)} template for JSON file: '${path.basename(jsonInputPath.path)}'?`,
          default: true,
        });

        if(!shouldProcessTemplateForJsonInput) {
          continue;
        }
      }

      const filename = Handlebars.compile(template.filenameTemplate)(jsonInput);
      const directory = Handlebars.compile(template.directoryTemplate)(jsonInput);

      const outputFilePath = path.join.apply(null, _.compact([ outputDirectoryPath, directory, filename ]));
      fs.ensureDirSync(path.dirname(outputFilePath));

      const templateExtension: string = path.extname(template.resolvedTemplatePath);

      const handler = templateHandlerMap[templateExtension];

      if(!handler) {
        throw new Error(`No handler defined for template extension: ${templateExtension}`);
      }

      if(!_.includes(jsonInputPathsToCreate, jsonInputPath.path)) {
        continue;
      }

      const fileContents = handler(template.resolvedTemplatePath, helpers, jsonInput, jsonInputs);

      if(!_.trim(fileContents)) {
        continue;
      }

      fs.writeFileSync(outputFilePath, fileContents, 'utf-8');
    }
  }

  await processAllFiles(manifest, jsonInputs, helpers);
})();

async function getAppConfig(): Promise<AppConfig> {
  const appDataPath = getAppDataPath('json-scaffolder');

  const defaultsJsonFilePath = path.join(appDataPath, 'defaults.json');

  const {
    inputDirectoryPath: defaultInputDirectoryPath,
    templatesDirectoryPath: defaultTemplatesDirectoryPath,
    outputDirectoryPath: defaultOutputDirectoryPath,
  }: AppDefaults = fs.existsSync(defaultsJsonFilePath) ? fs.readJSONSync(defaultsJsonFilePath) : {};

  const { templatesDirectoryPath, inputDirectoryPath, outputDirectoryPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'inputDirectoryPath',
      message: 'Please provide the directory where the JSON files are stored',
      default: defaultInputDirectoryPath,
      validate: (input) => !!_.trim(input),
    },
    {
      type: 'input',
      name: 'templatesDirectoryPath',
      message: 'Please provide the directory where the templates are stored',
      default: defaultTemplatesDirectoryPath,
      validate: (input) => !!_.trim(input),
    },
    {
      type: 'input',
      name: 'outputDirectoryPath',
      message: 'Please provide the directory where scaffolded files should be placed',
      default: defaultOutputDirectoryPath,
      validate: (input) => !!_.trim(input),
    },
  ]);

  const defaults: AppDefaults = {
    templatesDirectoryPath,
    inputDirectoryPath,
    outputDirectoryPath,
  };

  fs.ensureDirSync(path.dirname(defaultsJsonFilePath));
  fs.writeJSONSync(defaultsJsonFilePath, defaults);

  return {
    templatesDirectoryPath,
    inputDirectoryPath,
    outputDirectoryPath,
  };
}

async function loadManifest(templatesDirectoryPath: string) {
  const manifests = loadManifests(templatesDirectoryPath);

  const { appTemplateName } = await inquirer.prompt({
    type: 'list',
    name: 'appTemplateName',
    message: 'What app template do you want to use?',
    choices: manifests.map(t => t.name),
    validate: (input) => !!_.trim(input),
    loop: true,
  });

  const templateGroup = manifests.find(t => t.name === appTemplateName);

  if (!templateGroup) {
    throw new Error('An error occurred while loading template.');
  }

  return templateGroup;
}

function processAllFiles(manifest: Manifest, jsonInputs: any[], helpers: any) {
  const allFilesPath = path.join(path.dirname(manifest.manifestPath), 'allFiles.js');

  if (!fs.existsSync(allFilesPath)) {
    return;
  }

  const params: AllFilesParams = {
    jsonInputs,
    helpers,
    libs: providedLibs,
  };

  require(allFilesPath)(params);
}

function loadManifests(templatesDirectoryPath: string): Manifest[] {
  const templateManifestPaths = glob.sync(path.join(templatesDirectoryPath, '**/manifest.json'), { absolute: true });

  return templateManifestPaths.map((templateManifestPath): Manifest => {
    const manifest: ManifestDto = fs.readJSONSync(templateManifestPath);

    const templates = manifest.templates.map((manifestTemplate): ManifestTemplate => {
      const templatePath = path.join(path.dirname(templateManifestPath), manifestTemplate.templatePath);

      return {
        ...manifestTemplate,
        resolvedTemplatePath: templatePath,
      };
    });

    return {
      name: manifest.name,
      manifestPath: templateManifestPath,
      templates: templates,
    };
  });
}

async function promptJsonInputPathsToCreate(jsonInputPaths: ParsedJsonInput[]) {
  const choices = jsonInputPaths.map(jsonInputPath => path.basename(jsonInputPath.path));
  const { jsonInputPathsToRun } = await inquirer.prompt({
    type: 'checkbox',
    name: 'jsonInputPathsToRun',
    message: 'What input JSON files would you like to process?',
    choices: choices,
    default: choices,
    loop: true,
  });

  return jsonInputPaths.filter(jsonInputPath => _.includes(jsonInputPathsToRun, path.basename(jsonInputPath.path))).map(p => p.path);
}

async function promptTemplatesToRun(manifest: Manifest) {
  const choices = manifest.templates.map(t => t.resolvedTemplatePath);
  const { templatesToRun } = await inquirer.prompt({
    type: 'checkbox',
    name: 'templatesToRun',
    message: 'What templates do you want to apply?',
    choices: choices,
    default: choices,
    loop: true,
  });

  return manifest.templates.filter(t => _.includes(templatesToRun, t.resolvedTemplatePath));
}

function loadJsonInputs(inputDirectoryPath: string): ParsedJsonInput[] {
  return glob.sync(path.join(inputDirectoryPath, '**/*.json'), { absolute: true }).map((jsonInputPath) => ({
    path: jsonInputPath,
    parsedData: fs.readJSONSync(jsonInputPath),
  }));
}

function getHelpersForTemplate(manifestPath: string) {
  const helpersPath = path.join(path.dirname(manifestPath), 'helpers.js');

  if(fs.existsSync(helpersPath)) {
    return {
      ...providedHelpers,
      ...require(helpersPath),
    };
  }

  return providedHelpers;
}
