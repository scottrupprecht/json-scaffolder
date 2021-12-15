# json-scaffolder
json-scaffolder is a simple, unopinionated, node-based cli that takes a directory if input files and runs them through a series of custom JavaScript or Handlebars templates.

## How to construct templates

### Where do templates live?
Templates can live anywhere on your computer. The recommended file structure is as follows:

```
/RootFolder
└───RobustApplication
│   │   manifest.json
│   └───FrontEnd
│       │   FrontEndFileToGenerate.js
│       │   AnotherFrontEndFileToGenerate.js
│       │   OneLastFrontEndFileToGenerate.js
│   └───BackEnd
│       │   BackEndFileToGenerate.cs.js
│       │   AnotherBackEndFileToGenerate.cs.js
│       │   OneLastBackEndFileToGenerate.cs.js
└───SimpleApplication
    │   manifest.json
    │   FileToGenerate.js
    │   AnotherFileToGenerate.js
    │   OneLastFileToGenerate.js
```
Simply point the CLI to the /RootFolder directory, the CLI will parse out and locate the two manifest.json files and the templates will be made available to the CLI.

### The manifest.json
The manifest.json file is what tells the CLI where the template file lives and how to handle the output. It consists of two required properties:
* `name`
  * The name of the template (displayed in the CLI)
* `templates`
  * The list of objects describing each of the template files
  * The object consists of three required properties
    * `templatePath`
      * The path to the template file (relative to the manifest.json file)
    * `directoryTemplate`
      * The directory the output file will be placed. Handlebars templating is supported and all the built-in helpers are provided (`pluralize, capitalcase, sentencecase, camelcase, pascalcase, uuidv4`)
    * `filenameTemplate`
      * The filename of the output file. Handlebars templating is supported and all the built-in helpers are provided (`pluralize, capitalcase, sentencecase, camelcase, pascalcase, uuidv4`)

An example manifest.json file could be:
```json
{
  "name": "Scott's Cool App",
  "templates": [
    {
      "templatePath": "testResults.json.hbs",
      "directoryTemplate": "input/{{camelcase lastName}}/{{camelcase firstName}}",
      "filenameTemplate": "{{firstName}}{{lastName}}TestResults.json"
    },
    {
      "templatePath": "dataProcessor.js",
      "directoryTemplate": "src",
      "filenameTemplate": "dataProcessor.js"
    }
  ]
}
```

#### How are templates made?
Supported templates end in either `.hbs (Handlebars)` or `.js (JavaScript)`.
* `.hbs`
  * The file will be compiled by the handlebars engine and the json inputs will be fed directory to the template.
  * All built-in handlebars logic is supported. In addition, the following helpers have been made available in the template `pluralize, capitalcase, sentencecase, camelcase, pascalcase, uuidv4`.
  * Given a json file containing `{ "firstName": "Scott", "lastName": "Rupprecht" }`:
    * Simple Example
      * Template:``Hello my name is {{firstName}} {{lastName}}``
      * Produces: `Hello my name is Scott Rupprecht`
    * With Helpers
      * Template:``Hello my name is {{camelcase firstName}} {{camelcase lastName}``
      * Produces: `Hello my name is scott rupprecht`
* `.js`
  * For more advanced templates JavaScript templating is recommended.
  * Each template must export a single function. This function will be provided the input from the JSON file, a helpers object which contains built-in helpers (`pluralize, capitalcase, sentencecase, camelcase, pascalcase, uuidv4`), and a small sampling of libraries that may prove useful when creating templates (`temp, _ (Lodash), glob, pluralize`)
  * Given a json file containing `{ "firstName": "Scott", "lastName": "Rupprecht" }`:
    * Simple Example
      * Template:``module.exports = ({ firstName, lastName }) => `Hello my name is ${firstName} ${lastName}``
      * Produces: `Hello my name is Scott Rupprecht`
    * With Helpers
      * Template:``module.exports = ({ firstName, lastName, helpers }) => `Hello my name is ${helpers.camelcase(firstName)} ${helpers.camelcase(lastName)}``
      * Produces: `Hello my name is scott rupprecht`

Full JavaScript based template parameters:
```javascript
module.exports = ({ helpers: { pluralize, capitalcase, sentencecase, camelcase, pascalcase, uuidv4 }, libs: { temp, _, glob, pluralize }, ...jsonInput }) => {
  return `...`;
}
```

### Custom Helpers
Both handlebars and JavaScript based templates support custom helpers. This are implicitly loaded in via a `helpers.js` file at the root of the template (same directory as the manifest.json file). For example:

```javascript
// helpers.js
module.exports = {
  currentYear: () => new Date().getFullYear(),
  add: (a, b) => a + b,
}
```

In handlebars these helpers could be used as such:
```handlebars
The current year is {{currentYear}} and 1 plus 1 is {{add 1 1}}
```


In JavaScript these helpers could be used as such:
```javascript
module.exports = ({ helpers: { add, currentYear } }) => {
  return `The current year is ${currentYear()} and 1 plus 1 is ${add(1, 1)}`;
}
```

#### All Files
Sometimes you want to execute an action or actions upon the entire the all the JSON data supplied to the json CLI. A `allFiles.js` is the method to do so.

allFiles.js will be given helpers (both built-in and the custom helpers detailed above), the provided libraries, and an object called `jsonInputs`. Given those inputs you are free to take an action, no return is required.


## Running the CLI
When running the CLI you will be prompted with three configuration questions:
* "Please provide the directory where the JSON files are stored"
  * The CLI will be traverse the provided directory recursively and any *.json files will be collected.
* "Please provide the directory where the templates are stored"
  * As indicated, this is the directory where templates are stored. Templates should be stored in individual folder with a manifest.json at the root.
  * The CLI will traverse the provided directory recursively looking for any manifest.json file. The folder will be made available as a template by the CLI.
* "Please provide the directory where scaffolded files should be placed"
  * This is the root directory where the resulting files will be placed.

Next you will be prompted three questions relating to the specific run of the CLI
* "What app template do you want to use?"
  * Select the template that the CLI should use.
* "What templates do you want to apply?"
  * Using the specified actions, select one to many template files that will be generated (default is all).
* "What input JSON files would you like to process?"
  * Specify which of the found *.json files you would like to process (default is all).

The CLI will run all the specified JSON files through the specified templates and the output will be placed specifically in the specified directory.
