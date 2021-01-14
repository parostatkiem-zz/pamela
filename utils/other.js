// export function addJsonFieldToItems(sourceJSON, extraHeader) {
//   //TODO do this in a better way
//   sourceJSON.items.forEach((item) => {
//     addJsonField(item, extraHeader);
//   });
// }

// export async function addJsonField(sourceJSON, extraHeader) {
//   try {
//     let jsonField = JSON.parse(JSON.stringify(sourceJSON));
//     delete jsonField.status;
//     if (extraHeader) jsonField = { ...extraHeader, ...jsonField };
//     sourceJSON.json = jsonField;
//   } catch (e) {
//     console.error("Failed to add JSON field to an item", sourceJSON, e);
//   }
// }

// export const calculateURL = (template, variables) => {
//   let output = template;
//   Object.entries(variables).forEach(([key, value]) => {
//     if (value === undefined) return;
//     output = output.replace(`{${key}}`, value);
//   });
//   if (~output.indexOf("{")) throw new Error("Not every variable supplied for template " + template);
//   return output;
// };

// export class HttpError extends Error {
//   constructor(title, message, statusCode) {
//     super(message);
//     this.title = title;
//     this.code = statusCode;
//   }

//   send(response) {
//     const { title, message, code } = this;
//     response.status(code).json({ title, message });
//   }
// }

export function requestLogger(httpModule) {
  var original = httpModule.request;
  httpModule.request = function (options, callback) {
    console.log("Outgoing HTTP request with options", options);
    return original(options, callback);
  };
}
