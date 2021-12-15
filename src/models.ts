import providedLibs from './libs';

export interface AppDefaults {
  templatesDirectoryPath?: string;
  outputDirectoryPath?: string;
  inputDirectoryPath?: string;
}

export interface AppConfig {
  templatesDirectoryPath: string;
  outputDirectoryPath: string;
  inputDirectoryPath: string;
}

export interface ManifestDto {
  name: string;
  templates: ManifestTemplateDto[];
}

export interface ManifestTemplateDto {
  templatePath: string;
  directoryTemplate: string;
  filenameTemplate: string;
}

export interface ManifestTemplate {
  resolvedTemplatePath: string;
  directoryTemplate: string;
  filenameTemplate: string;
}

export interface Manifest {
  name: string;
  manifestPath: string;
  templates: ManifestTemplate[];
}

export interface ParsedJsonInput {
  path: string;
  parsedData: any;
}

export interface AllFilesParams {
  jsonInputs: any[];
  helpers: any;
  libs: typeof providedLibs
}
